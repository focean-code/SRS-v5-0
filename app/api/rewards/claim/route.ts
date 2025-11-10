import { sendDataBundle, mapToSupportedBundleSize } from "@/lib/africas-talking"
import { createServiceRoleClient } from "@/lib/supabase-server"
import { rewardClaimSchema } from "@/lib/validation"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { getRewardConfig } from "@/lib/reward-config"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const validation = rewardClaimSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { rewardId, phoneNumber } = validation.data

    const client = await createServiceRoleClient()

    // Get reward details
    const { data: reward, error: rewardError } = await client.from("rewards").select("*").eq("id", rewardId).single()

    if (rewardError || !reward) {
      logger.warn("Reward not found", { rewardId })
      return errorResponse("Reward not found", 404)
    }

    if (reward.status !== "sent") {
      logger.warn("Reward cannot be claimed", { rewardId, status: reward.status })
      return errorResponse("Reward cannot be claimed in its current status", 400)
    }

    try {
      let bundleSize = "50MB"
      let sendTimes = 1

      if (reward.feedback_id) {
        const { data: feedbackRow } = await client
          .from("feedback")
          .select("sku_id")
          .eq("id", reward.feedback_id)
          .single()

        if (feedbackRow?.sku_id) {
          const { data: skuRow } = await client
            .from("product_skus")
            .select("weight")
            .eq("id", feedbackRow.sku_id)
            .single()

          const weight = ((skuRow as any)?.weight || "").toString().trim().toLowerCase()
          const rewardConfig = getRewardConfig(weight)

          if (rewardConfig) {
            bundleSize = rewardConfig.bundleSize
            sendTimes = rewardConfig.bundleCount
            logger.info(
              `${weight} SKU detected - sending ${bundleSize} ${sendTimes} times (total ${rewardConfig.displayAmount}MB)`,
              {
                rewardId,
                phoneNumber,
                displayedAmount: reward.amount,
              },
            )
          } else {
            bundleSize = mapToSupportedBundleSize(reward.amount)
            sendTimes = 1
          }
        } else {
          bundleSize = mapToSupportedBundleSize(reward.amount)
          sendTimes = 1
        }
      } else {
        bundleSize = mapToSupportedBundleSize(reward.amount)
        sendTimes = 1
      }

      logger.info("Claiming reward", {
        rewardId,
        bundleSize,
        sendTimes,
        totalData: sendTimes === 2 ? "100MB" : sendTimes === 3 ? "150MB" : `${bundleSize}`,
        phoneNumber,
        displayedAmount: reward.amount,
      })

      // Send data bundle to user
      // ⚠️ REAL API CALL - Sends actual data bundles via Africa's Talking
      const result = await sendDataBundle(phoneNumber, bundleSize, sendTimes)

      // Update reward status to claimed with transaction ID
      await client
        .from("rewards")
        .update({
          status: "claimed",
          transaction_id: result.data?.transactionId || null,
          claimed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rewardId)

      logger.info("Reward claimed successfully", {
        rewardId,
        phoneNumber,
        transactionId: result.data?.transactionId,
      })

      return successResponse(
        {
          transactionId: result.data?.transactionId,
        },
        "Reward claimed successfully",
      )
    } catch (error) {
      logger.error("Failed to send data bundle", {
        rewardId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new Error(`Failed to send data bundle: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  } catch (error) {
    logger.error("Claim reward error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Failed to claim reward", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
