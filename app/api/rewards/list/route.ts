import { createServiceRoleClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status")

    const supabase = await createServiceRoleClient()

    // Build query
    let query = supabase
      .from("rewards")
      .select(
        `
        *,
        feedback:feedback_id (
          customer_name,
          rating,
          comment
        ),
        qr_codes:qr_id (
          id,
          product_skus (
            weight,
            products (
              name
            )
          )
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: rewards, error, count } = await query

    if (error) {
      console.error("[v0] Rewards list error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate summary stats
    const statsQuery = supabase.from("rewards").select("status, amount")

    const { data: allRewards } = await statsQuery

    const stats = {
      total: count || 0,
      pending: allRewards?.filter((r) => r.status === "pending").length || 0,
      processing: allRewards?.filter((r) => r.status === "processing").length || 0,
      sent: allRewards?.filter((r) => r.status === "sent").length || 0,
      failed: allRewards?.filter((r) => r.status === "failed").length || 0,
      totalAmount: allRewards?.reduce((sum, r) => sum + (Number.parseFloat(r.amount as string) || 0), 0) || 0,
    }

    return NextResponse.json({
      rewards,
      total: count || 0,
      stats,
    })
  } catch (error) {
    console.error("[v0] Rewards list error:", error)
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 })
  }
}
