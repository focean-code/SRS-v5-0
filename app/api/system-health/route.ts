import { createServiceRoleClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"

export async function GET() {
  const checks: Record<string, any> = {}

  try {
    // Check database connection
    const client = await createServiceRoleClient()
    const { data: dbCheck, error: dbError } = await client.from("campaigns").select("count").limit(1)

    checks.database = {
      status: dbError ? "error" : "ok",
      error: dbError?.message,
    }

    // Check each table
    const tables = ["campaigns", "products", "product_skus", "qr_codes", "feedback", "rewards"]

    for (const table of tables) {
      try {
        const { count, error } = await client.from(table).select("*", { count: "exact", head: true })
        checks[`table_${table}`] = {
          status: error ? "error" : "ok",
          count: count || 0,
          error: error?.message,
        }
      } catch (e) {
        checks[`table_${table}`] = {
          status: "error",
          error: e instanceof Error ? e.message : String(e),
        }
      }
    }

    // Check environment variables
    checks.environment = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      africas_talking_api_key: !!process.env.AFRICAS_TALKING_API_KEY,
      africas_talking_username: !!process.env.AFRICAS_TALKING_USERNAME,
    }

    // Overall health
    const hasErrors = Object.values(checks).some((check: any) => check.status === "error")

    logger.info("System health check completed", { checks })

    return Response.json({
      status: hasErrors ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      checks,
    })
  } catch (error) {
    logger.error("System health check failed", { error: error instanceof Error ? error.message : String(error) })

    return Response.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        checks,
      },
      { status: 500 },
    )
  }
}
