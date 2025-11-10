"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
  bundle_size: string
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

const createFormSchema = (questions: CampaignQuestion[]) => {
  const customAnswersShape: Record<string, z.ZodTypeAny> = {}

  questions.forEach((q) => {
    if (q.order === 7) return // Skip thank you message

    if (q.required) {
      if (q.type === "checkbox") {
        customAnswersShape[q.id] = z.array(z.string()).min(1, `Please select at least one option for: ${q.question}`)
      } else {
        customAnswersShape[q.id] = z.string().min(1, `Please answer: ${q.question}`)
      }
    } else {
      if (q.type === "checkbox") {
        customAnswersShape[q.id] = z.array(z.string()).optional()
      } else {
        customAnswersShape[q.id] = z.string().optional()
      }
    }
  })

  return z.object({
    customerPhone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^(\+?254|0)?[17]\d{8}$/, "Invalid Kenyan phone number format"),
    customAnswers: z.object(customAnswersShape),
  })
}

type FormData = {
  customerPhone: string
  customAnswers: Record<string, any>
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createFormSchema(campaignQuestions)),
    defaultValues: {
      customerPhone: "",
      customAnswers: {},
    },
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

              // Reset form with new validation schema
              const defaultAnswers: Record<string, any> = {}
              questions.forEach((q) => {
                defaultAnswers[q.id] = q.type === "checkbox" ? [] : ""
              })
              reset({
                customerPhone: "",
                customAnswers: defaultAnswers,
              })
            }
          } catch (err) {
            console.error("Failed to load campaign questions:", err)
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
  }, [qrId, reset])

  const onSubmit = async (data: FormData) => {
    setError(null)
    setSubmitting(true)

    try {
      const calculateAverageRating = (): number => {
        const ratingQuestions = campaignQuestions.filter((q) => {
          if (q.type !== "radio" && q.type !== "select") return false
          return q.options?.some((opt) => !isNaN(Number(opt)))
        })

        if (ratingQuestions.length === 0) return 3

        const ratings = ratingQuestions
          .map((q) => {
            const answer = data.customAnswers[q.id]
            const numericValue = Number(answer)
            return !isNaN(numericValue) ? numericValue : null
          })
          .filter((r): r is number => r !== null)

        if (ratings.length === 0) return 3

        return Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
      }

      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrId,
          customerPhone: data.customerPhone,
          customAnswers: data.customAnswers,
          campaignId: qrData?.campaign_id || null,
          rating: calculateAverageRating(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit feedback")
      }

      // Success - redirect to success page
      router.push(
        `/feedback/success?rewardAmount=${qrData?.bundle_size}&rewardDesc=${encodeURIComponent(qrData?.reward_description || "")}`,
      )
    } catch (err) {
      console.error("Submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: CampaignQuestion, field: any) => {
    // Question 7 is a thank you message, not a question
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
          <Input
            {...field}
            id={questionId}
            placeholder={question.question}
            disabled={submitting}
            aria-label={question.question}
            aria-required={question.required}
          />
        )
      case "textarea":
        return (
          <Textarea
            {...field}
            id={questionId}
            placeholder={question.question}
            disabled={submitting}
            rows={4}
            aria-label={question.question}
            aria-required={question.required}
          />
        )
      case "radio":
        return (
          <RadioGroup
            value={field.value}
            onValueChange={field.onChange}
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
        )
      case "select":
        return (
          <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
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
        )
      case "checkbox":
        return (
          <div className="space-y-2" role="group" aria-label={question.question} aria-required={question.required}>
            {question.options?.map((opt: string) => {
              const checkboxId = `${questionId}-${opt}`
              const currentValues = field.value || []
              const isChecked = Array.isArray(currentValues) && currentValues.includes(opt)

              return (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentValues = (field.value || []) as string[]
                      if (checked) {
                        field.onChange([...currentValues, opt])
                      } else {
                        field.onChange(currentValues.filter((v) => v !== opt))
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
                <p className="text-sm text-green-600">Amount: {qrData?.bundle_size}</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Phone Number with validation */}
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-sm font-semibold">
                  Phone Number *
                </Label>
                <Controller
                  name="customerPhone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="customerPhone"
                      placeholder="+254712345678 or 0712345678"
                      disabled={submitting}
                      aria-invalid={!!errors.customerPhone}
                    />
                  )}
                />
                {errors.customerPhone && <p className="text-xs text-red-500">{errors.customerPhone.message}</p>}
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
                      <Controller
                        name={`customAnswers.${question.id}`}
                        control={control}
                        render={({ field }) => renderQuestion(question, field)}
                      />
                      {errors.customAnswers?.[question.id] && (
                        <p className="text-xs text-red-500">{(errors.customAnswers[question.id] as any)?.message}</p>
                      )}
                      {question.required && !errors.customAnswers?.[question.id] && question.order !== 7 && (
                        <p className="text-xs text-gray-500">This field is required</p>
                      )}
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
