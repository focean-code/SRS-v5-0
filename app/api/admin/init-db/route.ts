import { createServiceRoleClient } from "@/lib/supabase-server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized - Please login as admin" }, { status: 401 })
    }

    const client = await createServiceRoleClient()

    const { error: testError } = await client.from("products").select("count").limit(1)

    if (testError) {
      return Response.json(
        {
          error: "Database connection failed",
          details: testError.message,
        },
        { status: 500 },
      )
    }

    // Check if tables exist and are accessible
    const tables = ["products", "product_skus", "campaigns", "qr_codes", "feedback", "rewards"]
    const tableStatus: Record<string, boolean> = {}

    for (const table of tables) {
      const { error } = await client.from(table).select("count").limit(1)
      tableStatus[table] = !error
    }

    const allTablesExist = Object.values(tableStatus).every((status) => status)

    return Response.json(
      {
        success: true,
        message: allTablesExist
          ? "Database is ready. Create products, campaigns, and SKUs via the admin dashboard."
          : "Some tables are missing. Please run the database schema script.",
        databaseConnected: true,
        tables: tableStatus,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Database verification error:", error)
    return Response.json(
      {
        error: "Failed to verify database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
