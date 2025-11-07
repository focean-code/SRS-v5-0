import { checkDuplicateSubmission } from "@/lib/qr-utils"
import { getQRCodeData, markQRCodeAsUsed, createFeedback, createReward } from "@/lib/db-utils"
import { feedbackSchema } from "@/lib/validation"
import { rateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse, validationErrorResponse, rateLimitResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Rate limiting by phone number
    const { customerPhone } = body
    if (customerPhone) {
      const rateLimitResult = await rateLimit(`feedback:${customerPhone}`, {
        interval: 300000, // 5 minutes
        uniqueTokenPerInterval: 3, // Max 3 submissions per 5 minutes
      })

      if (!rateLimitResult.success) {
        logger.warn("Rate limit exceeded for feedback submission", { phone: customerPhone })
        return rateLimitResponse(rateLimitResult.reset)
      }
    }

    // Validate input
    const validation = feedbackSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      logger.warn("Feedback validation failed", { errors })
      return validationErrorResponse(errors as Record<string, string[]>)
    }

    const { qrId, customerName, customAnswers } = validation.data
    const rating = body.rating || validation.data.rating || 3
    const campaignId = body.campaignId || null

    // Check for duplicate submission
    const isDuplicate = await checkDuplicateSubmission(customerPhone, qrId)
    if (isDuplicate) {
      logger.warn("Duplicate feedback submission attempt", { phone: customerPhone, qrId })
      return errorResponse("You have already submitted feedback for this product", 409)
    }

    // Get QR code and product data
    const qrData = await getQRCodeData(qrId)
    if (!qrData || qrData.is_used) {
      logger.warn("Invalid or used QR code", { qrId })
      return errorResponse("QR code is invalid or already used", 404)
    }

    // Create feedback record
    const feedbackData = {
      campaign_id: campaignId,
      qr_id: qrId,
      sku_id: qrData.sku_id,
      customer_name: customerName || "Anonymous",
      customer_phone: customerPhone,
      rating: rating ? Math.min(Math.max(rating, 1), 5) : 3,
      comment: null, // No comment field
      custom_answers: customAnswers || {},
      verified: true,
    }

    const feedback = await createFeedback(feedbackData)

    // Create reward record
    const rewardData = {
      feedback_id: feedback.id,
      qr_id: qrId,
      customer_phone: customerPhone,
      reward_name: qrData.product_skus?.reward_description || "Reward",
      amount: qrData.product_skus?.reward_amount || 0,
      status: "pending",
    }

    const reward = await createReward(rewardData)

    // Mark QR code as used
    await markQRCodeAsUsed(qrId, customerPhone)

    logger.info("Feedback submitted successfully", {
      feedbackId: feedback.id,
      rewardId: reward.id,
      phone: customerPhone,
      calculatedRating: rating,
    })

    return successResponse(
      {
        feedback: {
          id: feedback.id,
          customer_name: feedback.customer_name,
          rating: feedback.rating,
        },
        reward: {
          id: reward.id,
          amount: reward.amount,
          status: reward.status,
        },
      },
      "Feedback submitted successfully",
    )
  } catch (error) {
    logger.error("Feedback submission error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Failed to submit feedback", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
