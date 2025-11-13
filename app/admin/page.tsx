import { requireAdminAuth } from "@/lib/auth-server"
import AdminDashboardClient from "./client"

/**
 * Server component wrapper for admin dashboard.
 * Verifies authentication server-side before rendering the client dashboard.
 * Tokens are never exposed to the client - only httpOnly cookies are used.
 *
 * Client component is located in ./client.tsx
 */
export default async function AdminPage() {
  // This will redirect to /admin/login if no valid session found in httpOnly cookies
  const session = await requireAdminAuth()

  // Render the client component with only the user email (no tokens)
  return <AdminDashboardClient userEmail={session.user.email} />
}