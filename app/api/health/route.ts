import { createServiceRoleClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const client = await createServiceRoleClient()

    // Test database connection
    const { data, error } = await client.from("products").select("count", { count: "exact", head: true })

    if (error) {
      throw new Error("Database connection failed")
    }

    return Response.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
          hasAfricasTalking: !!process.env.AFRICAS_TALKING_API_KEY,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Health check error:", error)
    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
