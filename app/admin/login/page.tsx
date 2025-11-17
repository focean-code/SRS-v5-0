"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = credentials.email.trim()
    const trimmedPassword = credentials.password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter email and password")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Submitting login request...")
      
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
        credentials: "include",
      })

      const data = await response.json()
      console.log("[v0] Login API response:", { ok: response.ok, data })

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      console.log("Login successful")
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log("[v0] Redirecting to admin page...")
      window.location.href = "/admin"
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <CardDescription className="text-blue-100">Manage rewards and campaigns</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600 border border-blue-200">
            <p className="font-semibold mb-1">Admin Access:</p>
            <p>Sign in with your Supabase Auth account.</p>
            <p className="mt-2 text-blue-700">Create an admin account in your Supabase dashboard first.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
