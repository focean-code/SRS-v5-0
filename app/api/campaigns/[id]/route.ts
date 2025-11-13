import { createServiceRoleClient } from "@/lib/supabase-server"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await createServiceRoleClient()

    const { data, error } = await client.from("campaigns").select("*").eq("id", id).single()

    if (error) {
      return Response.json({ error: "Campaign not found" }, { status: 404 })
    }

    return Response.json({ success: true, campaign: data }, { status: 200 })
  } catch (error) {
    console.error("[v0] Fetch campaign error:", error)
    return Response.json(
      { error: "Failed to fetch campaign", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, start_date, end_date, target_responses, active, meta } = body

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 })
    }

    const client = await createServiceRoleClient()

    const updateData: any = {
      name,
      description: description || "",
      start_date: start_date || null,
      end_date: end_date || null,
      target_responses: target_responses || 0,
      active: active !== undefined ? active : true,
      updated_at: new Date().toISOString(),
    }

    if (meta !== undefined) {
      updateData.meta = meta
    }

    const { data, error } = await client.from("campaigns").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Update campaign error:", error)
      return Response.json({ error: "Failed to update campaign" }, { status: 500 })
    }

    return Response.json({ success: true, campaign: data }, { status: 200 })
  } catch (error) {
    console.error("[v0] Update campaign error:", error)
    return Response.json(
      { error: "Failed to update campaign", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await createServiceRoleClient()

    const { error } = await client.from("campaigns").delete().eq("id", id)

    if (error) {
      console.error("[v0] Delete campaign error:", error)
      return Response.json({ error: "Failed to delete campaign" }, { status: 500 })
    }

    return Response.json({ success: true, message: "Campaign deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Delete campaign error:", error)
    return Response.json(
      { error: "Failed to delete campaign", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
