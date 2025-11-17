import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import type { NextRequest } from "next/server"
import { adminLoginSchema } from "@/lib/validation"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = adminLoginSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { email, password } = validation.data

    const supabase = await createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      logger.warn("Admin login failed", { email, error: signInError.message })
      return errorResponse("Invalid credentials", 401)
    }

    if (!data.session) {
      logger.warn("Admin login failed - no session", { email })
      return errorResponse("No session created", 401)
    }

    logger.info("Admin login successful", { 
      email, 
      userId: data.user.id,
      hasSession: !!data.session,
      sessionExpiry: data.session.expires_at
    })

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase'))
    console.log("[v0] Supabase cookies set:", supabaseCookies.map(c => c.name))

    return successResponse(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      "Login successful",
    )
  } catch (error) {
    logger.error("Admin login error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Login failed", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
