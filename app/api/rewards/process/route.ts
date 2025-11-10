import { sendDataBundle, mapToSupportedBundleSize } from "@/lib/africas-talking"
import { createServiceRoleClient } from "@/lib/supabase-server"
import { successResponse, errorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { getRewardConfig } from "@/lib/reward-config"

const processRewardSchema = z.object({
  rewardId: z.string().uuid(),
  phoneNumber: z.string().min(10),
  amount: z.number().positive(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const validation = processRewardSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse("Invalid request data", 400, validation.error.flatten().fieldErrors)
    }

    const { rewardId, phoneNumber, amount } = validation.data

    const client = await createServiceRoleClient()

    try {
      const { data: rewardRow } = await client
        .from("rewards")
        .select("feedback_id, amount, reward_name, status")
        .eq("id", rewardId)
        .single()

      if (!rewardRow) {
        return errorResponse("Reward not found", 404)
      }

      if (rewardRow.status === "sent") {
        return errorResponse("Reward already processed", 400)
      }

      // Determine bundle strategy based on SKU weight if available
      let bundleSize = "50MB"
      let sendTimes = 1

      if (rewardRow.feedback_id) {
        const { data: feedbackRow } = await client
          .from("feedback")
          .select("sku_id")
          .eq("id", rewardRow.feedback_id)
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
                displayedAmount: rewardRow.amount,
              },
            )
          } else {
            bundleSize = mapToSupportedBundleSize(rewardRow.amount)
            sendTimes = 1
          }
        } else {
          bundleSize = mapToSupportedBundleSize(rewardRow.amount)
          sendTimes = 1
        }
      } else {
        bundleSize = mapToSupportedBundleSize(rewardRow.amount)
        sendTimes = 1
      }

      logger.info("Processing reward", {
        rewardId,
        bundleSize,
        sendTimes,
        totalData: sendTimes === 2 ? "100MB" : sendTimes === 3 ? "150MB" : `${bundleSize}`,
        phoneNumber,
        displayedAmount: rewardRow.amount,
      })

      await client
        .from("rewards")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rewardId)

      const result = await sendDataBundle(phoneNumber, bundleSize, sendTimes)

      await client
        .from("rewards")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          transaction_id: result.data?.transactionId || null,
        })
        .eq("id", rewardId)

      logger.info("Reward processed successfully", { rewardId, transactionId: result.data?.transactionId })

      return successResponse(
        {
          transactionId: result.data?.transactionId,
          bundleSize,
          phoneNumber: result.data?.phoneNumber,
        },
        "Reward processed and data bundle sent successfully",
      )
    } catch (error) {
      logger.error("Reward processing failed", {
        rewardId,
        error: error instanceof Error ? error.message : String(error),
      })

      // Mark as failed
      await client
        .from("rewards")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rewardId)

      throw error
    }
  } catch (error) {
    logger.error("Reward processing error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Failed to process reward", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
