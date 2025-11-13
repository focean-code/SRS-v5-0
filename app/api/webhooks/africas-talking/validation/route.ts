import { NextResponse } from "next/server"

// This webhook MUST always return 200 with {"status": "Validated"}

/**
 * B2C Validation Callback for Africa's Talking Mobile Data
 * This endpoint validates data bundle transactions
 *
 * CRITICAL: Must always return 200 with {"status": "Validated"}
 * to prevent blocking transactions
 */

// Disable body size limit and enable all methods
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 10

export async function POST(req: Request) {
  const timestamp = new Date().toISOString()
  console.log(`\n========== [${timestamp}] VALIDATION WEBHOOK POST ==========`)

  try {
    // Log request details
    console.log("Request URL:", req.url)
    console.log("Request method:", req.method)
    console.log("Content-Type:", req.headers.get("content-type"))

    // Log all headers
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log("All headers:", JSON.stringify(headers, null, 2))

    // Read raw body
    let rawBody = ""
    try {
      rawBody = await req.text()
      console.log("Raw body:", rawBody)
      console.log("Body length:", rawBody.length)
    } catch (readError) {
      console.error("Error reading body:", readError)
    }

    // Try to parse as JSON
    let parsedBody: any = null
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody)
        console.log("Parsed JSON body:", JSON.stringify(parsedBody, null, 2))
      } catch (jsonError) {
        console.log("Not JSON, trying form data...")
        try {
          const formData = new URLSearchParams(rawBody)
          parsedBody = Object.fromEntries(formData.entries())
          console.log("Parsed form data:", JSON.stringify(parsedBody, null, 2))
        } catch (formError) {
          console.log("Could not parse as form data either")
        }
      }
    }

    // Log transaction details if available
    if (parsedBody) {
      console.log("Transaction ID:", parsedBody.transactionId || parsedBody.transaction_id || "N/A")
      console.log("Phone Number:", parsedBody.phoneNumber || parsedBody.phone_number || parsedBody.destination || "N/A")
      console.log("Category:", parsedBody.category || "N/A")
      console.log("Bundle:", JSON.stringify(parsedBody.bundle || parsedBody.Bundle || "N/A"))
    }

    // ALWAYS return Validated
    console.log('Returning: {"status": "Validated"}')
    console.log("==========================================================\n")

    return NextResponse.json(
      { status: "Validated" },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("CRITICAL ERROR in validation webhook:")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack")
    console.log("==========================================================\n")

    // STILL return Validated even on error
    return NextResponse.json(
      { status: "Validated" },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Validation webhook GET request - health check`)

  return NextResponse.json(
    {
      status: "ok",
      endpoint: "validation",
      timestamp: timestamp,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

// Handle OPTIONS for CORS preflight
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
