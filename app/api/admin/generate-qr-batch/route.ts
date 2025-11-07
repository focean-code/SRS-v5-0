import { generateQRBatch } from "@/lib/qr-utils"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { qrBatchSchema } from "@/lib/validation"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

// Function to verify admin authentication using Supabase
async function verifyAdminAuth() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const isAuthorized = await verifyAdminAuth()
    if (!isAuthorized) {
      logger.warn("Unauthorized QR generation attempt")
      return errorResponse("Unauthorized - Please login first", 401)
    }

    const body = await req.json()

    const validation = qrBatchSchema.safeParse({
      skuId: body.skuId,
      quantity: body.quantity,
      batchNumber: body.batchNumber,
      campaignId: body.campaignId,
    })

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { skuId, quantity, batchNumber, campaignId } = validation.data

    // Convert null to undefined for generateQRBatch function (it expects string | undefined, not null)
    const qrCodes = await generateQRBatch(skuId, quantity, batchNumber, campaignId ?? undefined)

    logger.info("QR batch generated successfully", {
      skuId,
      quantity,
      batchNumber,
      campaignId,
    })

    return successResponse(
      {
        qrCodes: qrCodes.slice(0, 20), // Return first 20 for display
        totalCount: qrCodes.length,
      },
      `Generated ${quantity} QR codes${campaignId ? " linked to campaign" : ""}`,
    )
  } catch (error) {
    logger.error("QR batch generation error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Failed to generate QR codes", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
