import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "***REDACTED***" : null,
    }

    // Try to create service role client and run simple counts
    const client = await createServiceRoleClient()

    // Run a few simple count queries to validate access and RLS
    const tables = ["campaigns", "rewards", "qr_codes", "feedback"]
    const results: Record<string, any> = {}

    for (const t of tables) {
      try {
        const { data, error, count } = await client.from(t).select("id", { count: "exact", head: false }).range(0, 0)
        // If select returned error, surface it
        if (error) {
          results[t] = { error: error.message }
        } else {
          results[t] = { sample: Array.isArray(data) ? data.slice(0, 1) : data, count: count ?? null }
        }
      } catch (e: any) {
        results[t] = { error: e?.message || String(e) }
      }
    }

    return NextResponse.json({ ok: true, env, results }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || String(error), hint: "Ensure SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are set in the environment." },
      { status: 500 },
    )
  }
}
