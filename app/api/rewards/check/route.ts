import { createServiceRoleClient } from "@/lib/supabase-server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return Response.json({ error: "Phone number required" }, { status: 400 })
    }

    const client = await createServiceRoleClient()

    const { data, error } = await client
      .from("rewards")
      .select("id, reward_name, amount, status, created_at")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching rewards:", error)
      throw new Error("Failed to fetch rewards")
    }

    return Response.json({ success: true, rewards: data || [] }, { status: 200 })
  } catch (error) {
    console.error("[v0] Check rewards error:", error)
    return Response.json(
      { error: "Failed to check rewards", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
