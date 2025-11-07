import { createServiceRoleClient } from "@/lib/supabase-server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId")
    const limit = Number(searchParams.get("limit")) || 50
    const offset = Number(searchParams.get("offset")) || 0

    const client = await createServiceRoleClient()

    let query = client
      .from("feedback")
      .select("*, product_skus(*, products(name, category))", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (campaignId) {
      query = query.eq("campaign_id", campaignId)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error("Failed to fetch feedback")
    }

    return Response.json(
      {
        success: true,
        feedback: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] List feedback error:", error)
    return Response.json(
      { error: "Failed to fetch feedback", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
