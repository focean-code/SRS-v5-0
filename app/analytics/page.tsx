"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, TrendingUp, Users, Gift, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AnalyticsData {
  feedbackCount: number
  rewardsSent: number
  averageRating: number
  totalQRCodes: number
  usedQRCodes: number
  conversionRate: string
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignId, setCampaignId] = useState("")

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const url = campaignId ? `/api/analytics?campaignId=${campaignId}` : "/api/analytics"
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch analytics")
        }

        const data = await response.json()
        setAnalytics(data)
        setError(null)
      } catch (err) {
        console.error("[v0] Analytics error:", err)
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [campaignId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Analytics</h1>
          <p className="text-gray-600">Track feedback, rewards, and conversion metrics</p>
        </div>

        {/* Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter by Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter campaign ID (optional)"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => setCampaignId("")} variant="outline">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Metrics Grid */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Feedback */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Total Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics.feedbackCount}</div>
                <p className="text-xs text-gray-500 mt-1">Customer submissions</p>
              </CardContent>
            </Card>

            {/* Average Rating */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics.averageRating.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Out of 5 stars</p>
              </CardContent>
            </Card>

            {/* Rewards Sent */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  Rewards Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics.rewardsSent}</div>
                <p className="text-xs text-gray-500 mt-1">Processed rewards</p>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics.conversionRate}%</div>
                <p className="text-xs text-gray-500 mt-1">QR codes used</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed View */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>QR Code Performance</CardTitle>
              <CardDescription>Detailed breakdown of QR code distribution and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total QR Codes Generated</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalQRCodes}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">QR Codes Used</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.usedQRCodes}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Usage Progress</p>
                  <p className="text-sm text-gray-600">
                    {analytics.usedQRCodes} / {analytics.totalQRCodes}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all"
                    style={{
                      width: `${analytics.totalQRCodes > 0 ? (analytics.usedQRCodes / analytics.totalQRCodes) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
