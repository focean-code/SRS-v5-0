"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QRData {
  product: {
    name: string
    category: string
    description: string
  }
  reward_description: string
  reward_amount: number
  sku_weight?: string | null
  bundle_size?: string | null
  campaign_id?: string | null
}

interface CampaignQuestion {
  id: string
  type: "text" | "textarea" | "radio" | "select" | "checkbox"
  question: string
  required: boolean
  options?: string[]
  order: number
}

export default function FeedbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qrId = searchParams.get("qr")

  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campaignQuestions, setCampaignQuestions] = useState<CampaignQuestion[]>([])
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({})

  const [formData, setFormData] = useState({
    customerPhone: "",
  })

  useEffect(() => {
    const loadQRData = async () => {
      if (!qrId) {
        setError("QR code not found")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/qr/validate?id=${qrId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Invalid QR code")
        }

        const result = await response.json()
        const qrData = result.data?.qr || result.qr

        if (!qrData) {
          throw new Error("Invalid QR code data structure")
        }

        setQrData(qrData)

        // Load campaign questions if campaign_id exists
        if (qrData.campaign_id) {
          try {
            const questionsResponse = await fetch(`/api/campaigns/${qrData.campaign_id}/questions`)
            if (questionsResponse.ok) {
              const questionsData = await questionsResponse.json()
              const questions = (questionsData.data?.questions || questionsData.questions || []).sort(
                (a: CampaignQuestion, b: CampaignQuestion) => a.order - b.order,
              )
              setCampaignQuestions(questions)
            }
          } catch (err) {
            console.error("Failed to load campaign questions:", err)
            // Don't fail the whole form if questions fail to load
          }
        }
      } catch (err) {
        console.error("Failed to load QR data:", err)
        setError(err instanceof Error ? err.message : "Failed to load product data")
      } finally {
        setLoading(false)
      }
    }

    loadQRData()
  }, [qrId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.customerPhone) {
      setError("Please fill in all required fields")
      return
    }

    // Validate required custom questions (excluding question 7 which is a thank you message, not a question)
    const missingRequired = campaignQuestions
      .filter((q) => q.required && q.order !== 7 && !customAnswers[q.id])
      .map((q) => q.question)

    if (missingRequired.length > 0) {
      setError(`Please answer all required questions: ${missingRequired.join(", ")}`)
      return
    }

    setSubmitting(true)

    try {
      const calculateAverageRating = (): number => {
        const ratingMap: Record<string, number> = {
          poor: 1,
          fair: 2,
          good: 3,
          "very good": 4,
          excellent: 5,
          "1": 1,
          "2": 2,
          "3": 3,
          "4": 4,
          "5": 5,
        }

        const ratingQuestions = campaignQuestions.filter((q) => {
          // Consider radio and select questions with rating-like options as rating questions
          if (q.type !== "radio" && q.type !== "select") return false
          if (!q.options || q.options.length === 0) return false

          // Check if options are numeric or rating labels
          const hasNumericOptions = q.options.some((opt) => !isNaN(Number(opt)))
          const hasRatingLabels = q.options.some((opt) =>
            ["poor", "fair", "good", "very good", "excellent"].includes(opt.toLowerCase()),
          )

          return hasNumericOptions || hasRatingLabels
        })

        if (ratingQuestions.length === 0) {
          return 3 // Default to 3 if no rating questions
        }

        const ratings = ratingQuestions
          .map((q) => {
            const answer = customAnswers[q.id]
            if (!answer) return null

            const answerStr = String(answer).toLowerCase()
            const numericValue = ratingMap[answerStr] || Number(answer)

            return !isNaN(numericValue) ? numericValue : null
          })
          .filter((r): r is number => r !== null)

        if (ratings.length === 0) {
          return 3 // Default to 3 if no valid ratings
        }

        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        return Math.round(average) // Round to nearest integer
      }

      const calculatedRating = calculateAverageRating()

      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrId,
          customerPhone: formData.customerPhone,
          customAnswers,
          campaignId: qrData?.campaign_id || null,
          rating: calculatedRating, // Send calculated rating
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit feedback")
      }

      const data = await response.json()

      // Success - redirect to success page
      router.push(
        `/feedback/success?rewardAmount=${qrData?.reward_amount}&rewardDesc=${encodeURIComponent(qrData?.reward_description || "")}`,
      )
    } catch (err) {
      console.error("Submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: CampaignQuestion) => {
    // Question 7 is a thank you message, not a question - display as informational
    if (question.order === 7) {
      return (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-gray-700 font-medium">{question.question}</p>
        </div>
      )
    }

    const questionId = `question-${question.id}`

    switch (question.type) {
      case "text":
        return (
          <div className="space-y-1">
            <Input
              id={questionId}
              value={customAnswers[question.id] || ""}
              onChange={(e) => setCustomAnswers({ ...customAnswers, [question.id]: e.target.value })}
              placeholder={question.question}
              required={question.required}
              disabled={submitting}
              aria-label={question.question}
              aria-required={question.required}
            />
            {question.required && (
              <p className="text-xs text-gray-500">This field is required</p>
            )}
          </div>
        )
      case "textarea":
        return (
          <div className="space-y-1">
            <Textarea
              id={questionId}
              value={customAnswers[question.id] || ""}
              onChange={(e) => setCustomAnswers({ ...customAnswers, [question.id]: e.target.value })}
              placeholder={question.question}
              required={question.required}
              disabled={submitting}
              rows={4}
              aria-label={question.question}
              aria-required={question.required}
            />
            {question.required && (
              <p className="text-xs text-gray-500">This field is required</p>
            )}
          </div>
        )
      case "radio":
        return (
          <div className="space-y-1">
            <RadioGroup
              value={customAnswers[question.id] || ""}
              onValueChange={(value) => setCustomAnswers({ ...customAnswers, [question.id]: value })}
              disabled={submitting}
              aria-label={question.question}
              aria-required={question.required}
            >
              <div className="space-y-2">
                {question.options?.map((opt: string) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${questionId}-${opt}`} aria-label={opt} />
                    <Label htmlFor={`${questionId}-${opt}`} className="font-normal cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {question.required && (
              <p className="text-xs text-gray-500">Please select one option</p>
            )}
          </div>
        )
      case "select":
        return (
          <div className="space-y-1">
            <Select
              value={customAnswers[question.id] || ""}
              onValueChange={(value) => setCustomAnswers({ ...customAnswers, [question.id]: value })}
              disabled={submitting}
            >
              <SelectTrigger aria-label={question.question} aria-required={question.required}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {question.required && (
              <p className="text-xs text-gray-500">Please select an option</p>
            )}
          </div>
        )
      case "checkbox":
        return (
          <div className="space-y-2">
            <div className="space-y-2" role="group" aria-label={question.question} aria-required={question.required}>
              {question.options?.map((opt: string) => {
                const checkboxId = `${questionId}-${opt}`
                const currentValues = customAnswers[question.id] || []
                const isChecked = Array.isArray(currentValues) && currentValues.includes(opt)

                return (
                  <div key={opt} className="flex items-center space-x-2">
                    <Checkbox
                      id={checkboxId}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentValues = (customAnswers[question.id] || []) as string[]
                        if (checked) {
                          setCustomAnswers({ ...customAnswers, [question.id]: [...currentValues, opt] })
                        } else {
                          setCustomAnswers({
                            ...customAnswers,
                            [question.id]: currentValues.filter((v) => v !== opt),
                          })
                        }
                      }}
                      disabled={submitting}
                      aria-label={opt}
                    />
                    <Label htmlFor={checkboxId} className="font-normal cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                )
              })}
            </div>
            {question.required && (
              <p className="text-xs text-gray-500">Please select at least one option</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>Loading Product Information</CardTitle>
            <CardDescription>Please wait...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !qrData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <Card className="w-full max-w-2xl border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error Loading Feedback Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")} className="w-full" variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Product Feedback Form</CardTitle>
            <CardDescription className="text-blue-100">
              Thank you for purchasing {qrData?.product.name}. Your feedback helps us improve!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Product Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2">{qrData?.product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{qrData?.product.category}</p>
              {qrData?.product.description && (
                <p className="text-sm text-gray-600 mb-3">{qrData.product.description}</p>
              )}
              <div className="p-3 bg-green-50 rounded border border-green-200 mt-3">
                <p className="text-sm font-semibold text-green-900">Reward for feedback:</p>
                <p className="text-lg font-bold text-green-700">{qrData?.reward_description}</p>
                {(() => {
                  // Calculate displayed reward amount based on SKU weight
                  // IMPORTANT: For 340g SKUs, customer sees 100MB (2×50MB bundles)
                  // For 500g SKUs, customer sees 150MB (3×50MB bundles)
                  let displayedRewardAmount = qrData?.reward_amount || 0
                  const weightLower = String(qrData?.sku_weight || "").trim().toLowerCase()
                  if (weightLower === "340g") {
                    displayedRewardAmount = 100 // Customer receives 2×50MB = 100MB total
                  } else if (weightLower === "500g") {
                    displayedRewardAmount = 150 // Customer receives 3×50MB = 150MB total
                  }
                })()}
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Feedback Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-sm font-semibold">
                  Phone Number *
                </Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  placeholder="+254712345678 or 0712345678"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500">Enter your Kenyan phone number</p>
              </div>

              {/* Campaign Questions */}
              {campaignQuestions.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Additional Questions</h3>
                    <p className="text-sm text-gray-500 mb-4">Please help us improve by answering these questions.</p>
                  </div>
                  {campaignQuestions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      {question.order !== 7 && (
                        <Label htmlFor={`question-${question.id}`} className="text-sm font-semibold">
                          {question.question} {question.required && <span className="text-red-500">*</span>}
                        </Label>
                      )}
                      {renderQuestion(question)}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback & Claim Reward"
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                Your feedback is important to us. After submission, your reward will be processed immediately.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
