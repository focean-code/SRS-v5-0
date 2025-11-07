import { sendDataBundle, mapToSupportedBundleSize } from "@/lib/africas-talking"
import { createServiceRoleClient } from "@/lib/supabase-server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function verifyAdminAuth() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const isAuthorized = await verifyAdminAuth()
    if (!isAuthorized) {
      return Response.json({ error: "Unauthorized - Please login first" }, { status: 401 })
    }

    const client = await createServiceRoleClient()

    // Get all pending rewards
    const { data: pendingRewards, error: fetchError } = await client
      .from("rewards")
      .select("id, customer_phone, amount, reward_name, feedback_id")
      .eq("status", "pending")
      .limit(50)

    if (fetchError) {
      throw new Error("Failed to fetch pending rewards")
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      details: [] as any[],
    }

    // Process each reward
    for (const reward of pendingRewards || []) {
      try {
        results.processed++

        // Update to processing
        await client.from("rewards").update({ status: "processing" }).eq("id", reward.id)

        // Look up SKU weight via feedback -> product_skus
        // IMPORTANT: For 340g SKUs, we send 50MB twice (total 100MB) to match the displayed reward
        // For 500g SKUs, we send 50MB three times (total 150MB) to match the displayed reward
        // The customer only sees the total amount (100MB/150MB) - they don't know about multiple transactions
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
            if (weight === "340g") {
              // Send 50MB bundle twice to total 100MB (customer sees 100MB on QR code)
              bundleSize = "50MB"
              sendTimes = 2
            } else if (weight === "500g") {
              // Send 50MB bundle three times to total 150MB (customer sees 150MB on QR code)
              bundleSize = "50MB"
              sendTimes = 3
            } else {
              // Fallback to amount-based mapping if weight is unknown
              bundleSize = mapToSupportedBundleSize(reward.amount)
              sendTimes = 1
            }
          }
        } else {
          bundleSize = mapToSupportedBundleSize(reward.amount)
          sendTimes = 1
        }

        // Send data bundle using derived bundle size and repetitions
        // ⚠️ REAL API CALL - Sends actual data bundles via Africa's Talking
        const bundleResult = await sendDataBundle(reward.customer_phone, bundleSize, sendTimes)

        // Update to sent with transaction ID
        await client
          .from("rewards")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            transaction_id: bundleResult.data?.transactionId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reward.id)

        results.successful++
        results.details.push({
          rewardId: reward.id,
          status: "sent",
          phone: reward.customer_phone,
          transactionId: bundleResult.data?.transactionId,
        })
      } catch (error) {
        results.failed++
        await client.from("rewards").update({ status: "failed" }).eq("id", reward.id)

        results.details.push({
          rewardId: reward.id,
          status: "failed",
          phone: reward.customer_phone,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return Response.json(
      {
        success: true,
        message: `Processed ${results.processed} rewards`,
        results,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Batch reward processing error:", error)
    return Response.json(
      {
        error: "Failed to process rewards",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
