import { createClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return Response.json({ error: error.message || "Logout failed" }, { status: 500 })
    }

    return Response.json({ success: true, message: "Logged out successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Admin logout error:", error)
    return Response.json(
      { error: "Logout failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
