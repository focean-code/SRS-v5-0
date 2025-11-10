import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Admin routes authentication
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Skip auth check for login page
    if (request.nextUrl.pathname.startsWith("/admin/login")) {
      return response
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role to check user metadata
    )

    // Check for authenticated session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Check if user has admin role in metadata
    const userId = session.user.id
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId)

    if (error || !userData) {
      console.error("[v0] Failed to fetch user data:", error)
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Check for admin role in user metadata
    const userRole = userData.user.user_metadata?.role || userData.user.app_metadata?.role

    if (userRole !== "admin") {
      console.warn("[v0] Unauthorized access attempt to admin area:", { userId, role: userRole })
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
