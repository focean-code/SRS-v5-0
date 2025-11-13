"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Gift } from "lucide-react"

export default function RewardsPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [rewards, setRewards] = useState<any[]>([])

  const handleCheckRewards = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!phoneNumber) {
      setMessage({ type: "error", text: "Please enter your phone number" })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/rewards/check?phone=${encodeURIComponent(phoneNumber)}`)
      const parsed = await parseApiResponse(response)

      if (!response.ok) {
        throw new Error(extractError(parsed) || "Failed to fetch rewards")
      }

      const rewardsData = parsed.rewards || parsed.data?.rewards || []
      setRewards(rewardsData)

      if ((rewardsData || []).length === 0) {
        setMessage({ type: "error", text: "No rewards found for this phone number" })
      }
    } catch (error) {
      console.error("Check rewards error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to check rewards",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helpers to parse API responses and extract errors (covers wrapped and raw responses)
  async function parseApiResponse(res: Response) {
    try {
      const text = await res.text()
      if (!text) return {}
      try {
        return JSON.parse(text)
      } catch {
        return { text }
      }
    } catch (e) {
      return { error: "Failed to read response" }
    }
  }

  function extractError(parsed: any) {
    if (!parsed) return null
    if (typeof parsed === "string") return parsed
    if (parsed.error) return parsed.error
    if (parsed?.data?.error) return parsed.data.error
    if (parsed?.message) return parsed.message
    if (parsed?.meta?.errors) return JSON.stringify(parsed.meta.errors)
    if (parsed.text) return parsed.text
    return null
  }

  const handleClaimReward = async (rewardId: string) => {
    try {
      const response = await fetch(`/api/rewards/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId, phoneNumber }),
      })

      if (!response.ok) {
        throw new Error("Failed to claim reward")
      }

      setMessage({ type: "success", text: "Reward claimed successfully! Check your phone for the data bundle." })
      // Refresh rewards
      handleCheckRewards(new Event("submit") as any)
    } catch (error) {
      console.error("Claim reward error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to claim reward",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-6 w-6" />
              <div>
                <CardTitle>Check Your Rewards</CardTitle>
                <CardDescription className="text-blue-100">
                  View and claim your earned rewards from feedback submissions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {message && (
              <Alert variant={message.type === "success" ? "default" : "destructive"} className="mb-4">
                {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCheckRewards} className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+254712345678 or 0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Rewards"
                )}
              </Button>
            </form>

            {rewards.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-900">Your Rewards</h3>
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{reward.reward_name}</p>
                      <p className="text-sm text-gray-600">Amount: KES {reward.amount}</p>
                      <p
                        className={`text-xs mt-1 font-medium ${reward.status === "sent" ? "text-green-600" : "text-yellow-600"}`}
                      >
                        Status: {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                      </p>
                    </div>
                    {reward.status === "sent" && (
                      <Button size="sm" onClick={() => handleClaimReward(reward.id)}>
                        Claim Reward
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
