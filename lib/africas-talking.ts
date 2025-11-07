import { retryAsync } from "./retry"
import { logger } from "./logger"

interface DataBundleRecipient {
  phoneNumber: string
  quantity: number
  unit: string
  validity?: string
  metadata?: Record<string, string>
}

interface DataBundleResponse {
  statusCode: string
  success: boolean
  message: string
  data?: any
}

const AFRICAS_TALKING_API_KEY = process.env.AFRICAS_TALKING_API_KEY
const AFRICAS_TALKING_USERNAME = process.env.AFRICAS_TALKING_USERNAME
const AFRICAS_TALKING_PRODUCT_NAME = process.env.AFRICAS_TALKING_PRODUCT_NAME || "Darajaplus"

const AFRICAS_TALKING_BASE_URL = "https://bundles.africastalking.com"

// Helper function to parse bundle size into quantity and unit
function parseBundleSize(bundleSize: string): { quantity: number; unit: string } {
  // Match patterns like "100MB", "1GB", "50MB"
  const match = bundleSize.match(/^(\d+(?:\.\d+)?)(MB|GB)$/i)

  if (!match) {
    throw new Error(`Invalid bundle size format: ${bundleSize}. Expected format like "100MB" or "1GB"`)
  }

  const quantity = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()

  return { quantity, unit }
}

/**
 * Maps a reward amount to a valid Africa's Talking bundle size
 * Based on official Africa's Talking pricing (2024):
 * - 50MB: Ksh 10
 * - 100MB: Ksh 20
 * - 250MB: Ksh 50
 * - 500MB: Ksh 100
 * - 1GB: Ksh 205
 * - 5GB: Ksh 1025
 * - 10GB: Ksh 2050
 *
 * @param amount - The reward amount in MB
 * @returns A valid bundle size string (e.g., "50MB", "100MB", "250MB", "500MB", "1GB", "5GB", "10GB")
 */
export function mapToSupportedBundleSize(amount: number): string {
  if (amount <= 50) return "50MB"
  if (amount <= 100) return "50MB"
  if (amount <= 250) return "250MB"
  if (amount <= 500) return "500MB"
  if (amount <= 1000) return "1GB"
  if (amount <= 5000) return "5GB"
  return "10GB"
}

/**
 * Sends a REAL data bundle via Africa's Talking API
 * ⚠️ PRODUCTION FUNCTION - This makes actual API calls and charges your account
 * 
 * @param phoneNumber - Kenyan phone number (+254 or 0 prefix)
 * @param bundleSize - Bundle size (e.g., "50MB", "100MB", "1GB")
 * @param quantity - Number of times to send the bundle (for 340g=2x, 500g=3x)
 * @returns Promise with transaction details
 * @throws Error if API credentials are missing or API call fails
 */
export async function sendDataBundle(
  phoneNumber: string,
  bundleSize: string | number = "50MB",
  quantity = 1,
): Promise<DataBundleResponse> {
  // ⚠️ NO MOCK MODE - Requires real API credentials
  if (!AFRICAS_TALKING_API_KEY) {
    throw new Error(
      "❌ Africa's Talking API key not configured. Please set AFRICAS_TALKING_API_KEY environment variable. This function sends REAL data bundles.",
    )
  }

  if (!AFRICAS_TALKING_USERNAME) {
    throw new Error(
      "❌ Africa's Talking username not configured. Please set AFRICAS_TALKING_USERNAME environment variable. This function sends REAL data bundles.",
    )
  }

  const formattedPhone = formatPhoneNumber(phoneNumber)
  const bundleSizeStr = typeof bundleSize === "number" ? `${bundleSize}MB` : bundleSize

  const { quantity: bundleQuantity, unit: bundleUnit } = parseBundleSize(bundleSizeStr)

  logger.info("Sending data bundle", {
    phone: formattedPhone,
    bundle: bundleSizeStr,
    quantity: bundleQuantity,
    unit: bundleUnit,
    username: AFRICAS_TALKING_USERNAME,
  })

  try {
    // Helper to perform a single API request
    const sendOnce = async (): Promise<DataBundleResponse> => {
        const endpoint = `${AFRICAS_TALKING_BASE_URL}/mobile/data/request`

        const payload = {
          username: AFRICAS_TALKING_USERNAME,
          productName: AFRICAS_TALKING_PRODUCT_NAME,
          recipients: [
            {
              phoneNumber: formattedPhone,
              quantity: bundleQuantity,
              unit: bundleUnit,
              validity: "Day",
              metadata: {
                source: "shopper-reward-system",
                bundleSize: bundleSizeStr,
                timestamp: new Date().toISOString(),
              },
            },
          ],
        }

        const requestHeaders = {
          "Content-Type": "application/json",
          apiKey: AFRICAS_TALKING_API_KEY,
          Accept: "application/json",
        }

        console.log("========== AFRICA'S TALKING API REQUEST ==========")
        console.log("Method:", "POST")
        console.log("URL:", endpoint)
        console.log(
          "Headers:",
          JSON.stringify(
            {
              ...requestHeaders,
              apiKey: `${AFRICAS_TALKING_API_KEY?.substring(0, 10)}...`, // Mask API key for security
            },
            null,
            2,
          ),
        )
        console.log("Request Body:", JSON.stringify(payload, null, 2))
        console.log("===================================================")

        logger.debug("Sending to Africa's Talking API", { endpoint, payload })

        const response = await fetch(endpoint, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(payload),
        })

        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        const responseText = await response.text()

        console.log("========== AFRICA'S TALKING API RESPONSE ==========")
        console.log("Status Code:", response.status)
        console.log("Status Text:", response.statusText)
        console.log("Response Headers:", JSON.stringify(responseHeaders, null, 2))
        console.log("Response Body (raw):", responseText)
        console.log("======================================================")

        logger.debug("Africa's Talking API response", {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}: ${responseText}`)
        }

        let responseData
        try {
          responseData = JSON.parse(responseText)
          console.log("Response Body (parsed JSON):", JSON.stringify(responseData, null, 2))
        } catch (e) {
          throw new Error(`Invalid JSON response: ${responseText}`)
        }

        // Check if the response indicates success
        if (!responseData.entries || responseData.entries.length === 0) {
          throw new Error(responseData.errorMessage || "Failed to send data bundle - no entries in response")
        }

        const entry = responseData.entries[0]

        if (entry.status !== "Sent" && entry.status !== "Queued") {
          throw new Error(entry.errorMessage || `Failed to send bundle: ${entry.status}`)
        }

        return {
          statusCode: "200",
          success: true,
          message: "Data bundle sent successfully",
          data: {
            phoneNumber: formattedPhone,
            bundleSize: bundleSizeStr,
            transactionId: entry.transactionId || `AT-${Date.now()}`,
            status: entry.status,
            value: entry.value || bundleSizeStr,
          },
        }
      }

    // If quantity > 1, send the bundle multiple times sequentially
    // This is used for 340g (2x 50MB = 100MB) and 500g (3x 50MB = 150MB) SKUs
    // The customer only sees the total amount - multiple transactions are transparent to them
    let lastResult: DataBundleResponse | undefined
    const timesToSend = Math.max(1, Math.floor(quantity))
    if (timesToSend > 1) {
      logger.info("Sending multiple bundles to match displayed reward amount", {
        phone: formattedPhone,
        bundleSize: bundleSizeStr,
        timesToSend,
        totalData: `${timesToSend} × ${bundleSizeStr} = ${timesToSend * bundleQuantity}${bundleUnit}`,
        note: "Customer sees total amount only - multiple transactions are transparent",
      })
    }
    for (let i = 0; i < timesToSend; i++) {
      logger.info("Dispatching data bundle iteration", {
        iteration: i + 1,
        total: timesToSend,
        phone: formattedPhone,
        bundle: bundleSizeStr,
      })

      const result = await retryAsync(sendOnce, {
        maxAttempts: 3,
        delayMs: 2000,
        backoffMultiplier: 2,
        onRetry: (attempt: number, error: any) => {
          logger.warn(`Retry attempt ${attempt} for data bundle`, {
            phone: formattedPhone,
            error: (error as Error).message,
          })
        },
      })

      lastResult = result as DataBundleResponse
    }

    logger.info("Data bundle(s) sent successfully", lastResult?.data)
    return lastResult as DataBundleResponse
  } catch (error) {
    logger.error("Failed to send data bundle after retries", {
      phone: formattedPhone,
      bundle: bundleSizeStr,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error(`Failed to send data bundle: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.startsWith("254")) {
    return "+" + cleaned
  }
  if (cleaned.startsWith("0")) {
    return "+254" + cleaned.substring(1)
  }
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    return "+254" + cleaned
  }

  if (phone.startsWith("+254")) {
    return phone
  }

  throw new Error(`Invalid phone number format: ${phone}. Expected Kenyan format (e.g., +254712345678 or 0712345678)`)
}

function getBundleCost(bundleSize: string): number {
  const pricingMap: Record<string, number> = {
    "50MB": 10,
    "100MB": 20,
    "250MB": 50,
    "500MB": 100,
    "1GB": 205,
    "5GB": 1025,
    "10GB": 2050,
  }

  return pricingMap[bundleSize] || 10
}

export function getMobileDataOptions() {
  return [
    { id: "50MB", label: "50 MB", value: "50MB", cost: 10 },
    { id: "100MB", label: "100 MB", value: "100MB", cost: 20 },
    { id: "250MB", label: "250 MB", value: "250MB", cost: 50 },
    { id: "500MB", label: "500 MB", value: "500MB", cost: 100 },
    { id: "1GB", label: "1 GB", value: "1GB", cost: 205 },
    { id: "5GB", label: "5 GB", value: "5GB", cost: 1025 },
    { id: "10GB", label: "10 GB", value: "10GB", cost: 2050 },
  ]
}
