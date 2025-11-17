import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase-server"
import TestPageClient from "./client"


export default async function TestPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.log("[admin/test] No valid session, redirecting to login")
    redirect("/admin/login")
  }

  console.log("[admin/test] Valid session found, rendering test page")

  return <TestPageClient />
}
