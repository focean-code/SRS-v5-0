"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  step: string
  status: "PASS" | "FAIL"
  data?: any
  error?: string
}

interface TestResponse {
  results: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    successRate: string
  }
  testData?: any
  note?: string
}

export default function TestPage() {
  const [phoneNumber, setPhoneNumber] = useState("0727166458")
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setError(null)
    setTestResults(null)

    try {
      const response = await fetch("/api/admin/test/e2e", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.results?.[0]?.error || "Test failed")
        setTestResults(data)
      } else {
        setTestResults(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">End-to-End Test</h1>
        <p className="text-muted-foreground">
          Test the complete reward system flow: QR generation → Feedback → Data bundle delivery
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>Enter a real Kenyan phone number to receive the test data bundle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0727166458 or +254727166458"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">Format: 07XXXXXXXX or +2547XXXXXXXX (Safaricom or Airtel)</p>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> This test will send a REAL data bundle to the provided phone number using your
              Africa's Talking account. The reward amount is determined by the product SKU in your database.
            </AlertDescription>
          </Alert>

          <Button onClick={runTest} disabled={loading || !phoneNumber} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              "Run End-to-End Test"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && !testResults && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {testResults && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{testResults.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Steps</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{testResults.summary.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{testResults.summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{testResults.summary.successRate}</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      result.status === "PASS"
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                    }`}
                  >
                    {result.status === "PASS" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{result.step}</div>
                      {result.error && <div className="text-sm text-red-600 mt-1">{result.error}</div>}
                      {result.data && (
                        <pre className="text-xs mt-2 p-2 bg-black/5 dark:bg-white/5 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {testResults.testData && (
            <Card>
              <CardHeader>
                <CardTitle>Test Data IDs</CardTitle>
                <CardDescription>Use these IDs to verify data in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm p-4 bg-muted rounded-lg overflow-x-auto">
                  {JSON.stringify(testResults.testData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {testResults.note && (
            <Alert>
              <AlertDescription>{testResults.note}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
