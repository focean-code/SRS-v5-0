import { createServiceRoleClient } from "@/lib/supabase-server"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const skuId = searchParams.get("skuId")
    const batchNumber = searchParams.get("batchNumber")

    if (!skuId || !batchNumber) {
      return Response.json({ error: "Missing required parameters: skuId, batchNumber" }, { status: 400 })
    }

    const client = await createServiceRoleClient()

    const { data: qrCodes, error } = await client
      .from("qr_codes")
      .select("id, url, batch_number, is_used, created_at")
      .eq("sku_id", skuId)
      .eq("batch_number", Number.parseInt(batchNumber))
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching QR codes:", error)
      throw new Error("Failed to fetch QR codes")
    }

    return Response.json({
      success: true,
      qrCodes: qrCodes || [],
      count: qrCodes?.length || 0,
    })
  } catch (error) {
    console.error("QR codes fetch error:", error)
    return Response.json(
      { error: "Failed to fetch QR codes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
