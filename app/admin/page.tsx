"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  LogOut,
  TrendingUp,
  Users,
  Gift,
  Zap,
  QrCodeIcon,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Download,
  Filter,
  Star,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AnalyticsData {
  feedbackCount: number
  rewardsSent: number
  averageRating: number
  totalQRCodes: number
  usedQRCodes: number
  conversionRate: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // QR Generation state
  const [skuId, setSkuId] = useState("")
  const [quantity, setQuantity] = useState("100")
  const [batchNumber, setBatchNumber] = useState("1")
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(undefined)
  const [qrLoading, setQrLoading] = useState(false)
  const [generatedQRs, setGeneratedQRs] = useState<any[]>([])
  const [totalQRCount, setTotalQRCount] = useState(0)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [lastBatchInfo, setLastBatchInfo] = useState<{ skuId: string; batchNumber: number } | null>(null)
  const [processingRewards, setProcessingRewards] = useState(false)
  const [skus, setSkus] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedWeight, setSelectedWeight] = useState<string>("340g")

  // Campaigns state
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null)
  const [editingQuestions, setEditingQuestions] = useState<any[]>([])
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false)

  const [responses, setResponses] = useState<any[]>([])
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [responsesTotal, setResponsesTotal] = useState(0)
  const [responsesPage, setResponsesPage] = useState(0)
  const [responsesLimit] = useState(50)
  const [filterCampaignId, setFilterCampaignId] = useState<string | undefined>(undefined)
  const [filterRating, setFilterRating] = useState<string | undefined>(undefined)
  const [filterDateFrom, setFilterDateFrom] = useState<string>("")
  const [filterDateTo, setFilterDateTo] = useState<string>("")
  const [downloadingCSV, setDownloadingCSV] = useState(false)

  const [webhookTestLoading, setWebhookTestLoading] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null)

  useEffect(() => {
    fetchAnalytics()
    // Load SKUs for selector
    fetchSKUs()

    // Load campaigns when campaigns tab or QR generation tab is active
    if (activeTab === "campaigns" || activeTab === "qr-generation") {
      fetchCampaigns()
      // Refresh SKUs when QR generation tab is active to ensure fresh data
      if (activeTab === "qr-generation") {
        fetchSKUs()
      }
    }

    if (activeTab === "responses") {
      fetchCampaigns()
      fetchResponses()
    }
  }, [activeTab])

  const fetchSKUs = async () => {
    try {
      const res = await fetch("/api/skus")
      if (res.ok) {
        const result = await res.json()
        // Handle both response formats: { data: { skus: [...] } } and { skus: [...] }
        const skusData = result.data?.skus || result.skus || []
        setSkus(skusData)
        if (skusData.length === 0) {
          console.warn("No SKUs found. Make sure products and SKUs are created.")
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("Failed to fetch SKUs:", res.status, errorData)
        setMessage({ type: "error", text: "Failed to load products. Please refresh the page." })
      }
    } catch (error) {
      console.error("Error fetching SKUs:", error)
      setMessage({ type: "error", text: "Failed to load products. Please check your connection." })
    }
  }

  const fetchCampaigns = async () => {
    setCampaignsLoading(true)
    try {
      console.log("Fetching campaigns from API")
      const response = await fetch("/api/campaigns")
      console.log("Campaigns API response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("Campaigns API response:", result)

        const campaignsData = result.data?.campaigns || result.campaigns || []
        console.log("Extracted campaigns:", campaignsData)

        setCampaigns(campaignsData)
      } else {
        console.error("Campaigns API error:", response.status, response.statusText)
        setMessage({ type: "error", text: "Failed to load campaigns" })
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
      setMessage({ type: "error", text: "Failed to load campaigns" })
    } finally {
      setCampaignsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/analytics")

      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Analytics error:", error)
      setMessage({ type: "error", text: "Failed to load analytics" })
    } finally {
      setLoading(false)
    }
  }

  const fetchResponses = async () => {
    setResponsesLoading(true)
    try {
      const params = new URLSearchParams({
        limit: responsesLimit.toString(),
        offset: (responsesPage * responsesLimit).toString(),
      })

      if (filterCampaignId) params.append("campaignId", filterCampaignId)

      const response = await fetch(`/api/feedback/list?${params}`)
      if (response.ok) {
        const data = await response.json()
        let filteredData = data.feedback || []

        // Apply client-side filters
        if (filterRating) {
          filteredData = filteredData.filter((r: any) => r.rating === Number.parseInt(filterRating))
        }
        if (filterDateFrom) {
          filteredData = filteredData.filter((r: any) => new Date(r.created_at) >= new Date(filterDateFrom))
        }
        if (filterDateTo) {
          const toDate = new Date(filterDateTo)
          toDate.setHours(23, 59, 59, 999)
          filteredData = filteredData.filter((r: any) => new Date(r.created_at) <= toDate)
        }

        setResponses(filteredData)
        setResponsesTotal(data.total || 0)
      } else {
        setMessage({ type: "error", text: "Failed to load responses" })
      }
    } catch (error) {
      console.error("Failed to fetch responses:", error)
      setMessage({ type: "error", text: "Failed to load responses" })
    } finally {
      setResponsesLoading(false)
    }
  }

  const handleDownloadResponsesCSV = async () => {
    setDownloadingCSV(true)
    try {
      // Fetch all responses without pagination
      const params = new URLSearchParams({ limit: "10000", offset: "0" })
      if (filterCampaignId) params.append("campaignId", filterCampaignId)

      const response = await fetch(`/api/feedback/list?${params}`)
      if (!response.ok) throw new Error("Failed to fetch responses")

      const data = await response.json()
      let allResponses = data.feedback || []

      // Apply filters
      if (filterRating) {
        allResponses = allResponses.filter((r: any) => r.rating === Number.parseInt(filterRating))
      }
      if (filterDateFrom) {
        allResponses = allResponses.filter((r: any) => new Date(r.created_at) >= new Date(filterDateFrom))
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        toDate.setHours(23, 59, 59, 999)
        allResponses = allResponses.filter((r: any) => new Date(r.created_at) <= toDate)
      }

      // Create CSV headers
      const headers = [
        "Date",
        "Customer Name",
        "Customer Phone",
        "Product",
        "Campaign",
        "Rating",
        "Sentiment",
        "Comment",
        "Custom Answers",
        "Verified",
      ]

      // Create CSV rows
      const rows = allResponses.map((r: any) => [
        new Date(r.created_at).toLocaleString(),
        r.customer_name || "",
        r.customer_phone || "",
        r.product_skus?.products?.name || "N/A",
        campaigns.find((c) => c.id === r.campaign_id)?.name || "N/A",
        r.rating || "",
        r.sentiment || "",
        r.comment || "",
        r.custom_answers ? JSON.stringify(r.custom_answers) : "",
        r.verified ? "Yes" : "No",
      ])

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `customer-responses-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: `Downloaded ${allResponses.length} responses as CSV` })
    } catch (error) {
      console.error("Download error:", error)
      setMessage({ type: "error", text: "Failed to download responses" })
    } finally {
      setDownloadingCSV(false)
    }
  }

  const handleClearFilters = () => {
    setFilterCampaignId("")
    setFilterRating("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setResponsesPage(0)
  }

  useEffect(() => {
    if (activeTab === "responses") {
      fetchResponses()
    }
  }, [responsesPage, filterCampaignId, filterRating, filterDateFrom, filterDateTo])

  const handleGenerateQRCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    console.log("QR Generation - Form submitted", {
      skuId,
      selectedProductId,
      selectedWeight,
      quantity,
      batchNumber,
      selectedCampaignId,
      skusCount: skus.length,
    })

    // Derive skuId from product + size if not manually set
    let finalSkuId = skuId
    if (!finalSkuId && selectedProductId && selectedWeight) {
      const found = skus.find(
        (s) => s.product_id === selectedProductId && String(s.weight).toLowerCase() === selectedWeight.toLowerCase(),
      )
      console.log("QR Generation - Looking for SKU", {
        selectedProductId,
        selectedWeight,
        found: found ? { id: found.id, weight: found.weight } : null,
        availableSkus: skus.map((s) => ({ id: s.id, product_id: s.product_id, weight: s.weight })),
      })
      if (found) {
        finalSkuId = found.id
        setSkuId(found.id)
      }
    }

    if (!finalSkuId || !quantity) {
      console.error("QR Generation - Validation failed", { finalSkuId, quantity })
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    // Validate numeric fields
    const quantityNum = Number.parseInt(quantity)
    const batchNumberNum = Number.parseInt(batchNumber)

    if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 10000) {
      setMessage({ type: "error", text: "Quantity must be between 1 and 10,000" })
      return
    }

    if (isNaN(batchNumberNum) || batchNumberNum < 1) {
      setMessage({ type: "error", text: "Batch number must be a positive number" })
      return
    }

    setQrLoading(true)

    try {
      // Build request body - only include campaignId if it's defined
      const requestBody: any = {
        skuId: finalSkuId,
        quantity: quantityNum,
        batchNumber: batchNumberNum,
      }
      
      // Only include campaignId if it's defined (not undefined or null)
      if (selectedCampaignId) {
        requestBody.campaignId = selectedCampaignId
      }

      console.log("QR Generation - Sending request", requestBody)

      const response = await fetch("/api/admin/generate-qr-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("QR Generation - Response status", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        console.error("QR Generation - Error response", errorData)
        // Extract validation errors if available
        const errorMessage = errorData.error || "Failed to generate QR codes"
        const validationErrors = errorData.meta?.errors || errorData.meta?.details
        const detailedError = validationErrors
          ? `${errorMessage}: ${JSON.stringify(validationErrors)}`
          : errorMessage
        throw new Error(detailedError)
      }

      const data = await response.json()
      console.log("QR Generation - Success response", { 
        fullResponse: data,
        qrCodesCount: data.data?.qrCodes?.length || data.qrCodes?.length || 0,
        totalCount: data.data?.totalCount || data.totalCount || 0,
        message: data.message || data.data?.message
      })
      
      // Handle both response formats: { data: { qrCodes: [...] } } and { qrCodes: [...] }
      const qrCodes = data.data?.qrCodes || data.qrCodes || []
      const totalCount = data.data?.totalCount || data.totalCount || qrCodes.length
      
      setGeneratedQRs(qrCodes)
      setTotalQRCount(totalCount)
      setLastBatchInfo({ skuId: finalSkuId, batchNumber: batchNumberNum })
      const campaignName = selectedCampaignId ? campaigns.find((c) => c.id === selectedCampaignId)?.name : null
      setMessage({
        type: "success",
        text: `Successfully generated ${quantity} QR codes${campaignName ? ` linked to "${campaignName}" campaign` : ""}`,
      })
      // Reset campaign selection after successful generation
      setSelectedCampaignId(undefined)

      // Reset and refresh analytics
      setSkuId("")
      setQuantity("100")
      setBatchNumber(String(batchNumberNum + 1))
      await fetchAnalytics()
    } catch (error) {
      console.error("QR generation error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to generate QR codes",
      })
    } finally {
      setQrLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      // Still redirect even if there's an error
      router.push("/admin/login")
    }
  }

  const handleDownloadCSV = async () => {
    if (!lastBatchInfo) {
      setMessage({ type: "error", text: "No batch information available. Please generate QR codes first." })
      return
    }

    setDownloadLoading(true)
    try {
      // Fetch all QR codes for this batch
      const response = await fetch(
        `/api/admin/qr-codes?skuId=${encodeURIComponent(lastBatchInfo.skuId)}&batchNumber=${lastBatchInfo.batchNumber}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch QR codes")
      }

      const data = await response.json()
      const allQRCodes = data.qrCodes || []

      if (allQRCodes.length === 0) {
        setMessage({ type: "error", text: "No QR codes found for this batch." })
        return
      }

      // Create CSV headers
      const headers = ["ID", "URL", "Batch Number", "Is Used", "Created At"]
      const rows = allQRCodes.map((qr: any) => [
        qr.id,
        qr.url,
        qr.batch_number,
        qr.is_used ? "Yes" : "No",
        new Date(qr.created_at).toLocaleString(),
      ])

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `qr-codes-batch-${lastBatchInfo.batchNumber}-${new Date().toISOString().split("T")[0]}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: `Downloaded ${allQRCodes.length} QR codes as CSV` })
    } catch (error) {
      console.error("Download error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to download QR codes",
      })
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!lastBatchInfo) {
      setMessage({ type: "error", text: "No batch information available. Please generate QR codes first." })
      return
    }

    setPdfLoading(true)
    try {
      const response = await fetch(
        `/api/admin/qr-codes/pdf?skuId=${encodeURIComponent(lastBatchInfo.skuId)}&batchNumber=${lastBatchInfo.batchNumber}`,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate PDF" }))
        throw new Error(errorData.error || "Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `qr-codes-batch-${lastBatchInfo.batchNumber}-${new Date().toISOString().split("T")[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      const count = totalQRCount > 0 ? totalQRCount : generatedQRs.length
      setMessage({
        type: "success",
        text: `Downloaded HTML file with ${count} QR codes. Open it in a browser and press Ctrl+P (or Cmd+P) to print/save as PDF.`,
      })
    } catch (error) {
      console.error("PDF download error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to download PDF",
      })
    } finally {
      setPdfLoading(false)
    }
  }

  // Campaign management handlers
  const handleCreateCampaign = async (campaignData: any) => {
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create campaign")
      }

      setMessage({ type: "success", text: "Campaign created successfully" })
      setShowCampaignDialog(false)
      await fetchCampaigns()
    } catch (error) {
      console.error("Create campaign error:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to create campaign" })
    }
  }

  const handleUpdateCampaign = async (id: string, campaignData: any) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update campaign")
      }

      setMessage({ type: "success", text: "Campaign updated successfully" })
      setShowCampaignDialog(false)
      setEditingCampaign(null)
      await fetchCampaigns()
    } catch (error) {
      console.error("Update campaign error:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update campaign" })
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete campaign")
      }

      setMessage({ type: "success", text: "Campaign deleted successfully" })
      await fetchCampaigns()
    } catch (error) {
      console.error("Delete campaign error:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to delete campaign" })
    }
  }

  const handleSaveQuestions = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: editingQuestions }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save questions")
      }

      setMessage({ type: "success", text: "Questions saved successfully" })
      setShowQuestionsDialog(false)
      await fetchCampaigns()
    } catch (error) {
      console.error("Save questions error:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save questions" })
    }
  }

  const handleLoadQuestions = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/questions`)
      if (response.ok) {
        const data = await response.json()
        const questions = (data.questions || []).sort((a: any, b: any) => a.order - b.order)
        setEditingQuestions(questions)
        setEditingCampaign(campaigns.find((c) => c.id === campaignId))
        setShowQuestionsDialog(true)
      }
    } catch (error) {
      console.error("Load questions error:", error)
      setMessage({ type: "error", text: "Failed to load questions" })
    }
  }

  const handleProcessRewards = async () => {
    setProcessingRewards(true)
    setMessage(null)
    try {
      const response = await fetch("/api/rewards/process-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Failed to process rewards")
      }

      const data = await response.json().catch(() => ({}))
      const successful = data.successful ?? data.processed ?? ""
      setMessage({
        type: "success",
        text: `Rewards processing triggered. ${successful ? `Successful: ${successful}.` : ""}`,
      })
      await fetchAnalytics()
    } catch (error) {
      console.error("Process rewards error:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to process rewards" })
    } finally {
      setProcessingRewards(false)
    }
  }

  const handleTestWebhook = async (type: "validation" | "notification") => {
    setWebhookTestLoading(true)
    setWebhookTestResult(null)
    setMessage(null)

    try {
      const testData =
        type === "validation"
          ? {
              transactionId: `TEST-${Date.now()}`,
              category: "MobileData",
              phoneNumber: "+254727166458",
              sourceIpAddress: "127.0.0.1",
              metadata: { source: "admin-test" },
              bundle: {
                provider: "Safaricom",
                quantity: 100,
                unit: "MB",
                validity: "Day", // Changed from "Month" to "Monthly"
              },
            }
          : {
              transactionId: `TEST-${Date.now()}`,
              category: "MobileData",
              status: "Success",
              description: "Test notification",
              destination: "+254727166458",
              requestMetadata: { source: "admin-test" },
            }

      const response = await fetch(`/api/webhooks/africas-talking/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      })

      let result
      try {
        result = await response.json()
      } catch {
        // If response is not JSON, try to get text
        result = { text: await response.text() }
      }

      setWebhookTestResult({
        status: response.status,
        statusText: response.statusText,
        data: result,
        success: response.ok,
      })

      if (response.ok) {
        setMessage({ type: "success", text: `${type} webhook test successful!` })
      } else {
        setMessage({ type: "error", text: `${type} webhook test failed with status ${response.status}` })
      }
    } catch (error) {
      console.error("Webhook test error:", error)
      setWebhookTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      setMessage({ type: "error", text: `Failed to test ${type} webhook` })
    } finally {
      setWebhookTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
              <QrCodeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">RewardHub Admin</span>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"} className="mb-6">
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="qr-generation">QR Codes</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Total Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.feedbackCount || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Customer submissions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                    Average Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {analytics?.averageRating.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Out of 5 stars</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    Rewards Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.rewardsSent || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Processed rewards</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.conversionRate || "0"}%</div>
                  <p className="text-xs text-gray-500 mt-1">QR codes used</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Analytics</CardTitle>
                <CardDescription>Detailed performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : analytics ? (
                  <div className="space-y-4">
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

                    <div>
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
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Generation Tab */}
          <TabsContent value="qr-generation" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle>Generate QR Code Batch</CardTitle>
                <CardDescription className="text-blue-100">
                  Create new QR codes for products and campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleGenerateQRCodes} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product" className="text-sm font-semibold">
                        Product *
                      </Label>
                      <select
                        id="product"
                        className="w-full h-10 border rounded px-3 bg-white"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        disabled={qrLoading}
                        required
                      >
                        <option value="">Select a product</option>
                        {Array.from(
                          new Map(
                            (skus || []).map((s) => [
                              s.product_id,
                              { id: s.product_id, name: s.products?.name || s.product_id },
                            ]),
                          ).values(),
                        ).map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Size *</Label>
                      <div className="flex items-center gap-4 h-10">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="size"
                            value="340g"
                            checked={selectedWeight === "340g"}
                            onChange={() => setSelectedWeight("340g")}
                            disabled={qrLoading}
                          />
                          340g (100MB)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="size"
                            value="500g"
                            checked={selectedWeight === "500g"}
                            onChange={() => setSelectedWeight("500g")}
                            disabled={qrLoading}
                          />
                          500g (150MB)
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-semibold">
                        Quantity *
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="100"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        max="10000"
                        required
                        disabled={qrLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batchNumber" className="text-sm font-semibold">
                        Batch Number
                      </Label>
                      <Input
                        id="batchNumber"
                        type="number"
                        placeholder="1"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        min="1"
                        disabled={qrLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign" className="text-sm font-semibold">
                      Campaign (Optional)
                    </Label>
                    <Select
                      value={selectedCampaignId}
                      onValueChange={(value) => {
                        // Handle clear option
                        if (value === "__clear__") {
                          setSelectedCampaignId(undefined)
                        } else {
                          setSelectedCampaignId(value)
                        }
                      }}
                      disabled={qrLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__clear__">None (No Campaign)</SelectItem>
                        {campaigns
                          .filter((c) => c.active && c.id && c.id.trim() !== "")
                          .map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name || "Unnamed Campaign"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedCampaignId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCampaignId(undefined)}
                        className="h-6 text-xs"
                      >
                        Clear selection
                      </Button>
                    )}
                    <p className="text-xs text-gray-500">
                      Link QR codes to a campaign to show custom feedback questions
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={qrLoading}>
                    {qrLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate QR Codes"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {generatedQRs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated QR Codes</CardTitle>
                  <CardDescription>{generatedQRs.length} QR codes created</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedQRs.slice(0, 10).map((qr, index) => (
                      <div key={qr.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-mono text-gray-600">
                          {index + 1}. {qr.id}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">URL: {qr.url}</p>
                      </div>
                    ))}
                    {generatedQRs.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-2">... and {generatedQRs.length - 10} more</p>
                    )}
                  </div>

                  <Alert className="mt-4 mb-4 bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>How to save as PDF:</strong> Click "Download Print-Ready HTML" to download the file, then
                      open it in your browser and use Ctrl+P (Cmd+P on Mac) → "Save as PDF"
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={handleDownloadCSV}
                      disabled={downloadLoading || !lastBatchInfo}
                    >
                      {downloadLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>Download CSV ({totalQRCount > 0 ? totalQRCount : generatedQRs.length} codes)</>
                      )}
                    </Button>

                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={handleDownloadPDF}
                      disabled={pdfLoading || !lastBatchInfo}
                    >
                      {pdfLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>Download Print-Ready HTML</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Campaign Management</CardTitle>
                    <CardDescription>
                      Create and manage marketing campaigns with custom feedback questions
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingCampaign(null)
                      setShowCampaignDialog(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No campaigns yet. Create your first campaign to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    campaign.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {campaign.active ? "Active" : "Inactive"}
                                </span>
                              </div>
                              {campaign.description && (
                                <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                              )}
                              <div className="flex gap-4 text-xs text-gray-500">
                                {campaign.start_date && (
                                  <span>Start: {new Date(campaign.start_date).toLocaleDateString()}</span>
                                )}
                                {campaign.end_date && (
                                  <span>End: {new Date(campaign.end_date).toLocaleDateString()}</span>
                                )}
                                {campaign.target_responses > 0 && (
                                  <span>Target: {campaign.target_responses} responses</span>
                                )}
                              </div>
                              {campaign.meta?.questions && (
                                <p className="text-xs text-blue-600 mt-2">
                                  {campaign.meta.questions.length} custom question
                                  {campaign.meta.questions.length !== 1 ? "s" : ""} configured
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCampaign(campaign)
                                  setShowCampaignDialog(true)
                                }}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleLoadQuestions(campaign.id)}>
                                Manage Questions
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteCampaign(campaign.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Customer Responses
                    </CardTitle>
                    <CardDescription>View and download customer feedback responses</CardDescription>
                  </div>
                  <Button onClick={handleDownloadResponsesCSV} disabled={downloadingCSV || responses.length === 0}>
                    {downloadingCSV ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filter-campaign" className="text-xs">
                        Campaign
                      </Label>
                      <Select
                        value={filterCampaignId || "all"}
                        onValueChange={(val) => setFilterCampaignId(val === "all" ? undefined : val)}
                      >
                        <SelectTrigger id="filter-campaign">
                          <SelectValue placeholder="All campaigns" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All campaigns</SelectItem>
                          {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-rating" className="text-xs">
                        Rating
                      </Label>
                      <Select
                        value={filterRating || "all"}
                        onValueChange={(val) => setFilterRating(val === "all" ? undefined : val)}
                      >
                        <SelectTrigger id="filter-rating">
                          <SelectValue placeholder="All ratings" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All ratings</SelectItem>
                          <SelectItem value="5">5 stars</SelectItem>
                          <SelectItem value="4">4 stars</SelectItem>
                          <SelectItem value="3">3 stars</SelectItem>
                          <SelectItem value="2">2 stars</SelectItem>
                          <SelectItem value="1">1 star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-date-from" className="text-xs">
                        From Date
                      </Label>
                      <Input
                        id="filter-date-from"
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-date-to" className="text-xs">
                        To Date
                      </Label>
                      <Input
                        id="filter-date-to"
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  {(filterCampaignId || filterRating || filterDateFrom || filterDateTo) && (
                    <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-3 bg-transparent">
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Responses Table */}
                {responsesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : responses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No responses found</p>
                    <p className="text-sm">Customer feedback will appear here once submitted</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Campaign</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Rating</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Sentiment</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Comment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {responses.map((response) => (
                            <tr key={response.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-600">
                                {new Date(response.created_at).toLocaleDateString()}
                                <br />
                                <span className="text-xs text-gray-400">
                                  {new Date(response.created_at).toLocaleTimeString()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{response.customer_name || "Anonymous"}</div>
                                <div className="text-xs text-gray-500">{response.customer_phone}</div>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {response.product_skus?.products?.name || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {campaigns.find((c) => c.id === response.campaign_id)?.name || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < (response.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">{response.rating || 0}/5</span>
                              </td>
                              <td className="px-4 py-3">
                                {response.sentiment && (
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      response.sentiment === "positive"
                                        ? "bg-green-100 text-green-800"
                                        : response.sentiment === "negative"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {response.sentiment}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <p className="text-gray-700 line-clamp-2">{response.comment || "No comment"}</p>
                                {response.custom_answers && Object.keys(response.custom_answers).length > 0 && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    + {Object.keys(response.custom_answers).length} custom answer(s)
                                  </p>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Showing {responsesPage * responsesLimit + 1} to{" "}
                        {Math.min((responsesPage + 1) * responsesLimit, responsesTotal)} of {responsesTotal} responses
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResponsesPage(Math.max(0, responsesPage - 1))}
                          disabled={responsesPage === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResponsesPage(responsesPage + 1)}
                          disabled={(responsesPage + 1) * responsesLimit >= responsesTotal}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reward Distribution</CardTitle>
                <CardDescription>Process and track customer rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Rewards are automatically processed and sent via Africa's Talking
                  </p>
                  <Button onClick={handleProcessRewards} disabled={processingRewards}>
                    {processingRewards ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Process Pending Rewards"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Testing & Configuration</CardTitle>
                <CardDescription>
                  Test your Africa's Talking webhook endpoints and verify they're accessible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Webhook URLs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Webhook URLs</h3>
                  <p className="text-sm text-gray-600">Configure these URLs in your Africa's Talking dashboard:</p>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Label className="text-sm font-semibold text-blue-900">Validation Callback URL</Label>
                      <code className="block mt-2 p-2 bg-white rounded text-sm font-mono text-blue-700 break-all">
                        {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
                        /api/webhooks/africas-talking/validation
                      </code>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <Label className="text-sm font-semibold text-green-900">Notification Callback URL</Label>
                      <code className="block mt-2 p-2 bg-white rounded text-sm font-mono text-green-700 break-all">
                        {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
                        /api/webhooks/africas-talking/notification
                      </code>
                    </div>
                  </div>
                </div>

                {/* Test Buttons */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Webhooks</h3>
                  <p className="text-sm text-gray-600">
                    Send test requests to verify your webhooks are working correctly
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Validation Webhook</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Tests the endpoint that validates data bundle requests
                        </p>
                        <Button
                          onClick={() => handleTestWebhook("validation")}
                          disabled={webhookTestLoading}
                          className="w-full"
                        >
                          {webhookTestLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            "Test Validation Webhook"
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Notification Webhook</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Tests the endpoint that receives transaction status updates
                        </p>
                        <Button
                          onClick={() => handleTestWebhook("notification")}
                          disabled={webhookTestLoading}
                          className="w-full"
                          variant="outline"
                        >
                          {webhookTestLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            "Test Notification Webhook"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Test Results */}
                {webhookTestResult && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Test Results</h3>
                    <Card
                      className={
                        webhookTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {webhookTestResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span
                              className={`font-semibold ${webhookTestResult.success ? "text-green-900" : "text-red-900"}`}
                            >
                              {webhookTestResult.success ? "Success" : "Failed"}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm font-semibold">Status Code</Label>
                              <p className="text-sm font-mono">
                                {webhookTestResult.status} {webhookTestResult.statusText}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-semibold">Response</Label>
                              <pre className="mt-2 p-3 bg-white rounded text-xs font-mono overflow-x-auto">
                                {JSON.stringify(webhookTestResult.data || webhookTestResult.error, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Instructions */}
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Important:</strong> If the tests fail, ensure:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Your application is deployed and accessible from the internet</li>
                      <li>The webhook URLs are correctly configured in Africa's Talking dashboard</li>
                      <li>There are no firewall rules blocking Africa's Talking's IP addresses</li>
                      <li>Check the browser console and server logs for detailed error messages</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Campaign Create/Edit Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Update campaign details" : "Create a new marketing campaign"}
            </DialogDescription>
          </DialogHeader>
          <CampaignForm
            campaign={editingCampaign}
            onSave={(data) => {
              if (editingCampaign) {
                handleUpdateCampaign(editingCampaign.id, data)
              } else {
                handleCreateCampaign(data)
              }
            }}
            onCancel={() => {
              setShowCampaignDialog(false)
              setEditingCampaign(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Questions Management Dialog */}
      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Questions - {editingCampaign?.name}</DialogTitle>
            <DialogDescription>Add and configure custom feedback questions for this campaign</DialogDescription>
          </DialogHeader>
          <QuestionsEditor
            questions={editingQuestions}
            onQuestionsChange={setEditingQuestions}
            onSave={() => {
              if (editingCampaign) {
                handleSaveQuestions(editingCampaign.id)
              }
            }}
            onCancel={() => {
              setShowQuestionsDialog(false)
              setEditingCampaign(null)
              setEditingQuestions([])
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Campaign Form Component
function CampaignForm({
  campaign,
  onSave,
  onCancel,
}: {
  campaign: any | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: campaign?.name || "",
    description: campaign?.description || "",
    start_date: campaign?.start_date ? new Date(campaign.start_date).toISOString().split("T")[0] : "",
    end_date: campaign?.end_date ? new Date(campaign.end_date).toISOString().split("T")[0] : "",
    target_responses: campaign?.target_responses || 0,
    active: campaign?.active !== undefined ? campaign.active : true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      return
    }
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="target_responses">Target Responses</Label>
        <Input
          id="target_responses"
          type="number"
          min="0"
          value={formData.target_responses}
          onChange={(e) => setFormData({ ...formData, target_responses: Number.parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="active">Active</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Campaign</Button>
      </div>
    </form>
  )
}

// Questions Editor Component
function QuestionsEditor({
  questions,
  onQuestionsChange,
  onSave,
  onCancel,
}: {
  questions: any[]
  onQuestionsChange: (questions: any[]) => void
  onSave: () => void
  onCancel: () => void
}) {
  const addQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      type: "text",
      question: "",
      required: false,
      options: [],
      order: questions.length + 1,
    }
    onQuestionsChange([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updates: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...updates }
    onQuestionsChange(updated)
  }

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 }))
    onQuestionsChange(updated)
  }

  const addOption = (questionIndex: number) => {
    const updated = [...questions]
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = []
    }
    updated[questionIndex].options.push("")
    onQuestionsChange(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    onQuestionsChange(updated)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].options = updated[questionIndex].options.filter((_: any, i: number) => i !== optionIndex)
    onQuestionsChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Questions will appear in the feedback form for this campaign</p>
        <Button type="button" onClick={addQuestion} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No questions yet. Add your first question to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label>Question Text *</Label>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(index, { question: e.target.value })}
                          placeholder="Enter your question"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Question Type</Label>
                          <Select
                            value={question.type}
                            onValueChange={(value) => {
                              const updates: any = { type: value }
                              if (["radio", "select", "checkbox"].includes(value)) {
                                updates.options =
                                  question.options && question.options.length > 0 ? question.options : [""]
                              } else {
                                updates.options = []
                              }
                              updateQuestion(index, updates)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Input</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="radio">Radio Buttons</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                              <SelectItem value="checkbox">Checkboxes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={question.required}
                            onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor={`required-${index}`}>Required</Label>
                        </div>
                      </div>
                      {["radio", "select", "checkbox"].includes(question.type) && (
                        <div className="space-y-2">
                          <Label>Options *</Label>
                          <div className="space-y-2">
                            {(question.options || []).map((opt: string, optIndex: number) => (
                              <div key={optIndex} className="flex gap-2">
                                <Input
                                  value={opt}
                                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOption(index, optIndex)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => addOption(index)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={questions.some(
            (q) =>
              !q.question ||
              (["radio", "select", "checkbox"].includes(q.type) &&
                (!q.options || q.options.length === 0 || q.options.some((opt: string) => !opt.trim()))),
          )}
        >
          Save Questions
        </Button>
      </div>
    </div>
  )
}
