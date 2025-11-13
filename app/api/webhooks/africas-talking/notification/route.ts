import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase-server"

/**
 * Notification Callback endpoint for Africa's Talking Mobile Data
 * Receives transaction status updates for mobile data bundles
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 10

export async function POST(req: Request) {
  const timestamp = new Date().toISOString()
  console.log(`\n========== [${timestamp}] NOTIFICATION WEBHOOK POST ==========`)

  try {
    // Log request details
    console.log("Request URL:", req.url)
    console.log("Content-Type:", req.headers.get("content-type"))

    // Read raw body
    const rawBody = await req.text()
    console.log("Raw notification body:", rawBody)

    // Parse the body
    let body: any
    try {
      body = JSON.parse(rawBody)
      console.log("Parsed notification JSON:", JSON.stringify(body, null, 2))
    } catch (jsonError) {
      console.error("Failed to parse notification JSON:", jsonError)
      // Try form data
      try {
        body = Object.fromEntries(new URLSearchParams(rawBody))
        console.log("Parsed as form data:", JSON.stringify(body, null, 2))
      } catch (formError) {
        console.error("Failed to parse as form data:", formError)
        return NextResponse.json({ status: "error", message: "Invalid format" }, { status: 200 })
      }
    }

    const {
      transactionId,
      status,
      category,
      description,
      destination,
      destinationType,
      productName,
      provider,
      providerRefId,
      providerChannel,
      source,
      sourceType,
      value,
      transactionDate,
      requestMetadata,
    } = body

    console.log("Notification details:", {
      transactionId,
      status,
      category,
      destination,
      description,
    })

    if (!transactionId) {
      console.warn("Notification missing transactionId")
      return NextResponse.json({ status: "error", message: "Missing transactionId" }, { status: 200 })
    }

    // Validate category
    if (category !== "MobileData") {
      console.warn("Unexpected category in notification:", category)
    }

    const client = await createServiceRoleClient()

    if (status === "Success" || status === "Failed") {
      let reward = null as any

      // Try to find by transaction_id first
      if (transactionId) {
        console.log("Looking up reward by transaction_id:", transactionId)
        const { data, error } = await client
          .from("rewards")
          .select("id, status")
          .eq("transaction_id", transactionId)
          .maybeSingle()

        if (error) {
          console.error("Error looking up reward by transaction_id:", error)
        }

        reward = data
        console.log("Reward found by transaction_id:", reward)
      }

      // Fallback: find latest processing reward by phone number
      if (!reward && destination) {
        console.log("Transaction ID not found, falling back to phone lookup:", destination)

        const { data, error } = await client
          .from("rewards")
          .select("id, status")
          .eq("customer_phone", destination)
          .eq("status", "processing")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error("Error looking up reward by phone:", error)
        }

        reward = data
        console.log("Reward found by phone:", reward)
      }

      if (reward) {
        const updateData: any = {
          updated_at: new Date().toISOString(),
        }

        if (status === "Success") {
          updateData.status = "sent"
          updateData.sent_at = transactionDate || new Date().toISOString()
        } else if (status === "Failed") {
          updateData.status = "failed"
          if (description) {
            updateData.error_message = description
          }
        }

        console.log("Updating reward:", { rewardId: reward.id, updateData })
        const { error: updateError } = await client.from("rewards").update(updateData).eq("id", reward.id)

        if (updateError) {
          console.error("Error updating reward:", updateError)
        } else {
          console.log("Reward updated successfully")
        }
      } else {
        console.warn("No matching reward found for notification")
      }
    }

    console.log("Notification processed successfully")
    console.log("==========================================================\n")
    return NextResponse.json({ status: "success" }, { status: 200 })
  } catch (error) {
    console.error("CRITICAL ERROR in notification webhook:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.log("==========================================================\n")

    // Still return success to prevent retries
    return NextResponse.json({ status: "error", message: "Internal error" }, { status: 200 })
  }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Notification webhook GET request - health check`)

  return NextResponse.json(
    {
      status: "ok",
      endpoint: "notification",
      timestamp: timestamp,
    },
    { status: 200 },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
