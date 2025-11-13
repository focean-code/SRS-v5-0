import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow login page and non-admin routes to pass through
  if (pathname === "/admin/login" || !pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "sb-middleware-auth-token",
      },
    })

    // Get the session tokens from httpOnly cookies
    const accessToken = request.cookies.get("sb-access-token")?.value
    const refreshToken = request.cookies.get("sb-refresh-token")?.value

    if (!accessToken || !refreshToken) {
      console.log("[middleware] No auth tokens found, redirecting to login")
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Verify the session is valid by checking the user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.log("[middleware] Invalid session, redirecting to login", error?.message)
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    console.log("[middleware] User authenticated:", user.email)
    return NextResponse.next()
  } catch (error) {
    console.error("[middleware] Auth check failed:", error)
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
