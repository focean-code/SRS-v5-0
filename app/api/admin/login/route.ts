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

    const cookieStore = await cookies()

    // Set the access token cookie
    cookieStore.set({
      name: "sb-access-token",
      value: data.session.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Set the refresh token cookie
    cookieStore.set({
      name: "sb-refresh-token",
      value: data.session.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    logger.info("Admin login successful", { email, userId: data.user.id })

    // Return only user info - tokens are stored in httpOnly cookies
    // No tokens exposed to the client
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
