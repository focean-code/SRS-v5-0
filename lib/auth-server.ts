import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import { logger } from "./logger"
import { redirect } from "next/navigation"

/**
 * Get the admin session from httpOnly cookies
 * Returns null if no valid session found
 */
export async function getAdminSession() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("sb-access-token")?.value
    const refreshToken = cookieStore.get("sb-refresh-token")?.value

    if (!accessToken || !refreshToken) {
      return null
    }

    // Create a client and try to validate the session
    const supabase = await createClient()

    // Set the session from cookies
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      logger.warn("Invalid session from cookies", { error: error?.message })
      return null
    }

    return data.session
  } catch (error) {
    logger.error("Error getting admin session", {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Server-side auth check that redirects to login if not authenticated
 * Returns the session if valid
 */
export async function requireAdminAuth() {
  const session = await getAdminSession()

  if (!session) {
    logger.warn("Unauthorized admin access attempt")
    redirect("/admin/login")
  }

  return session
}

/**
 * Clear admin session cookies (used for logout)
 */
export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete("sb-access-token")
  cookieStore.delete("sb-refresh-token")
}
