import { createServiceRoleClient } from "@/lib/supabase-server"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await createServiceRoleClient()

    const { data, error } = await client.from("campaigns").select("meta").eq("id", id).single()

    if (error) {
      return Response.json({ error: "Campaign not found" }, { status: 404 })
    }

    const meta = (data.meta as any) || {}
    const questions = meta.questions || []

    return Response.json({ success: true, questions }, { status: 200 })
  } catch (error) {
    console.error("[v0] Fetch questions error:", error)
    return Response.json(
      { error: "Failed to fetch questions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { questions } = await req.json()

    if (!Array.isArray(questions)) {
      return Response.json({ error: "Questions must be an array" }, { status: 400 })
    }

    const client = await createServiceRoleClient()

    // Get current campaign
    const { data: campaign, error: fetchError } = await client
      .from("campaigns")
      .select("meta")
      .eq("id", id)
      .single()

    if (fetchError) {
      return Response.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Update meta with questions
    const currentMeta = (campaign.meta as any) || {}
    const updatedMeta = {
      ...currentMeta,
      questions: questions || [],
    }

    const { data, error } = await client
      .from("campaigns")
      .update({
        meta: updatedMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Update questions error:", error)
      return Response.json({ error: "Failed to update questions" }, { status: 500 })
    }

    return Response.json({ success: true, questions: updatedMeta.questions }, { status: 200 })
  } catch (error) {
    console.error("[v0] Update questions error:", error)
    return Response.json(
      { error: "Failed to update questions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
