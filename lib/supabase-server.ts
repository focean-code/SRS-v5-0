import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { logger } from "./logger"

export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Cookies can fail in production during builds
        }
      },
    },
  })
}

export async function createServerClient() {
  return createClient()
}

let serviceRoleClient: ReturnType<typeof createSupabaseServerClient> | null = null

export async function createServiceRoleClient() {
  // Return cached instance if it exists
  if (serviceRoleClient) {
    return serviceRoleClient
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    logger.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }

  serviceRoleClient = createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "sb-service-role-auth-token",
    },
  })

  return serviceRoleClient
}
