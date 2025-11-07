import { createClient } from "@/lib/supabase-server"

/**
 * Get the current authenticated user from Supabase session
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get the current session from Supabase
 */
export async function getCurrentSession() {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession()
  return session !== null
}

/**
 * Get the current user's email
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.email || null
}
