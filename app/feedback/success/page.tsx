"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rewardAmount = searchParams.get("rewardAmount")
  const rewardDesc = searchParams.get("rewardDesc") ? decodeURIComponent(searchParams.get("rewardDesc")!) : "Reward"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg text-center">
          <div className="flex justify-center mb-3">
            <CheckCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
          <CardDescription className="text-green-100">Your feedback has been submitted successfully</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Your reward has been processed:</p>
            <p className="text-lg font-bold text-green-700">{rewardDesc}</p>
            {rewardAmount && <p className="text-2xl font-bold text-green-600 mt-2">KES {rewardAmount}</p>}
            <p className="text-xs text-gray-500 mt-3">Check your phone for reward confirmation within 24 hours</p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Feedback recorded</p>
            <p>✓ Reward queued for processing</p>
            <p>✓ Confirmation will be sent to your phone</p>
          </div>

          <Button onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
