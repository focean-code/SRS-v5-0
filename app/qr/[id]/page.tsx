"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface QRData {
  id: string
  sku_id: string
  product: {
    id: string
    name: string
    category: string
    description: string
  }
  reward_amount: number
  reward_description: string
}

export default function QRPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateQR = async () => {
      try {
        const response = await fetch(`/api/qr/validate?id=${params.id}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Invalid QR code")
        }

        const data = await response.json()
        setQrData(data.qr)

        // Redirect to feedback form
        setTimeout(() => {
          router.push(`/feedback?qr=${params.id}`)
        }, 2000)
      } catch (err) {
        console.error("QR validation failed:", err)
        setError(err instanceof Error ? err.message : "Failed to validate QR code")
        setLoading(false)
      }
    }

    validateQR()
  }, [params.id, router])

  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Scanning QR Code</CardTitle>
            <CardDescription>Please wait while we validate your code...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid QR Code</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-gray-600">Please try scanning again...</p>
            </div>
            <Button onClick={() => router.push("/")} className="w-full mt-4" variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">QR Code Valid</CardTitle>
          <CardDescription>Redirecting to feedback form...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="font-semibold">Product: {qrData?.product.name}</p>
            <p className="text-gray-600">{qrData?.product.category}</p>
          </div>
          <div className="text-sm bg-blue-50 p-3 rounded">
            <p className="font-semibold text-blue-900">Reward: {qrData?.reward_description}</p>
            <p className="text-blue-700">Amount: KES {qrData?.reward_amount}</p>
          </div>
          <div className="text-center py-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-600">You will be redirected to the feedback form automatically...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
