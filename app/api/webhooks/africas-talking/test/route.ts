import { NextResponse } from "next/server"

/**
 * Test endpoint to verify webhook is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    return NextResponse.json({
      status: "ok",
      message: "POST request received successfully",
      receivedData: body,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
