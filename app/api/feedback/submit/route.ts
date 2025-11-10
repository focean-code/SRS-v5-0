import { getQRCodeData } from "@/lib/db-utils"
import { feedbackSchema } from "@/lib/validation"
import { rateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse, validationErrorResponse, rateLimitResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { sendDataBundle, mapToSupportedBundleSize } from "@/lib/africas-talking"
import { createServiceRoleClient } from "@/lib/supabase-server"
import { getRewardConfig } from "@/lib/reward-config"

export async function POST(req: Request) {
  const client = await createServiceRoleClient()

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

    // Get QR code and product data
    const qrData = await getQRCodeData(qrId)
    if (!qrData || qrData.is_used) {
      logger.warn("Invalid or used QR code", { qrId })
      return errorResponse("QR code is invalid or already used", 404)
    }

    // This ensures feedback, reward, and QR marking happen together or not at all
    const { data: result, error: rpcError } = await client.rpc("submit_feedback_atomic", {
      p_campaign_id: campaignId,
      p_qr_id: qrId,
      p_sku_id: qrData.sku_id,
      p_customer_name: customerName || "Anonymous",
      p_customer_phone: customerPhone,
      p_rating: rating ? Math.min(Math.max(rating, 1), 5) : 3,
      p_comment: null,
      p_custom_answers: customAnswers || {},
      p_verified: true,
      p_reward_name: qrData.product_skus?.reward_description || "Reward",
      p_reward_amount: qrData.product_skus?.reward_amount || 0,
    })

    if (rpcError) {
      logger.error("Atomic feedback submission failed", { error: rpcError })

      // Handle specific error cases
      if (rpcError.message.includes("QR code already used")) {
        return errorResponse("QR code is already used", 409)
      }
      if (rpcError.message.includes("Duplicate submission")) {
        return errorResponse("You have already submitted feedback for this product", 409)
      }

      throw rpcError
    }

    const feedbackId = result.feedback_id
    const rewardId = result.reward_id

    // Fetch the created records for response
    const { data: feedback } = await client.from("feedback").select("*").eq("id", feedbackId).single()
    const { data: reward } = await client.from("rewards").select("*").eq("id", rewardId).single()

    try {
      console.log("[v0] Starting automatic bundle sending for reward:", rewardId)

      let bundleSize = "50MB"
      let sendTimes = 1

      if (qrData.sku_id) {
        const { data: skuRow } = await client.from("product_skus").select("weight").eq("id", qrData.sku_id).single()

        const weight = ((skuRow as any)?.weight || "").toString().trim().toLowerCase()
        const rewardConfig = getRewardConfig(weight)

        if (rewardConfig) {
          bundleSize = rewardConfig.bundleSize
          sendTimes = rewardConfig.bundleCount
          console.log(
            `[v0] ${weight} SKU detected - sending ${bundleSize} ${sendTimes} times (total ${rewardConfig.displayAmount}MB)`,
          )
        } else {
          bundleSize = mapToSupportedBundleSize(reward.amount)
          sendTimes = 1
        }
      } else {
        bundleSize = mapToSupportedBundleSize(reward.amount)
        sendTimes = 1
      }

      console.log("[v0] Sending data bundle:", { bundleSize, sendTimes, phoneNumber: customerPhone })

      // Update reward to processing
      await client
        .from("rewards")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rewardId)

      const result = await sendDataBundle(customerPhone, bundleSize, sendTimes, rewardId)

      console.log("[v0] Data bundle sent successfully:", result.data?.transactionId)

      // Update reward to sent
      await client
        .from("rewards")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          transaction_id: result.data?.transactionId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rewardId)

      logger.info("Feedback submitted and bundle sent automatically", {
        feedbackId,
        rewardId,
        transactionId: result.data?.transactionId,
        phone: customerPhone,
        calculatedRating: rating,
      })

      return successResponse(
        {
          feedback: {
            id: feedbackId,
            customer_name: feedback?.customer_name,
            rating: feedback?.rating,
          },
          reward: {
            id: rewardId,
            amount: reward?.amount,
            status: "sent",
            transactionId: result.data?.transactionId,
          },
        },
        "Feedback submitted and data bundle sent successfully",
      )
    } catch (bundleError) {
      // If bundle sending fails, log error but don't fail the whole request
      logger.error("Failed to send data bundle automatically", {
        rewardId: rewardId,
        error: bundleError instanceof Error ? bundleError.message : String(bundleError),
      })

      // Mark reward as failed
      await client
        .from("rewards")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rewardId)

      // Still return success for feedback, but with failed reward status
      return successResponse(
        {
          feedback: {
            id: feedbackId,
            customer_name: feedback?.customer_name,
            rating: feedback?.rating,
          },
          reward: {
            id: rewardId,
            amount: reward?.amount,
            status: "failed",
          },
        },
        "Feedback submitted but bundle sending failed. Please contact support.",
      )
    }
  } catch (error) {
    logger.error("Feedback submission error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Failed to submit feedback", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
