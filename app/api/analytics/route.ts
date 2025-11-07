import { getAnalytics } from "@/lib/db-utils"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get("campaignId")

    const analytics = await getAnalytics(campaignId || undefined)

    return Response.json(analytics, { status: 200 })
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return Response.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
