import { validateQRToken } from "@/lib/qr-utils"
import { qrValidationSchema } from "@/lib/validation"
import { rateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse, validationErrorResponse, rateLimitResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const qrId = searchParams.get("id")

    if (!qrId) {
      return errorResponse("QR ID required", 400)
    }

    // Rate limiting by QR ID
    const rateLimitResult = await rateLimit(`qr-validate:${qrId}`, {
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 10,
    })

    if (!rateLimitResult.success) {
      logger.warn("Rate limit exceeded for QR validation", { qrId })
      return rateLimitResponse(rateLimitResult.reset)
    }

    // Validate QR ID format
    const validation = qrValidationSchema.safeParse({ qrId })
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const qrData = await validateQRToken(qrId)

    if (!qrData) {
      logger.warn("Invalid or used QR code", { qrId })
      return errorResponse("Invalid or already used QR code", 404)
    }

    const weight = qrData.product_skus?.weight || null
    const bundleSize = (() => {
      const w = String(weight || "").toLowerCase()
      if (w.startsWith("340")) return "100MB"
      if (w.startsWith("500")) return "150MB"
      return "100MB"
    })()

    logger.info("QR code validated", { qrId })

    return successResponse({
      qr: {
        id: qrData.id,
        sku_id: qrData.sku_id,
        campaign_id: qrData.campaign_id || null,
        sku_weight: weight,
        bundle_size: bundleSize,
        product: {
          id: qrData.product_skus?.products?.id || null,
          name: qrData.product_skus?.products?.name || "Unknown",
          category: qrData.product_skus?.products?.category || "General",
          description: qrData.product_skus?.products?.description || "",
        },
        reward_amount: qrData.product_skus?.reward_amount || 0,
        reward_description: qrData.product_skus?.reward_description || "Reward",
      },
    })
  } catch (error) {
    logger.error("QR validation error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Failed to validate QR code", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
