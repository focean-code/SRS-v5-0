import { createServiceRoleClient } from "@/lib/supabase-server"
import { campaignSchema } from "@/lib/validation"
import { successResponse, errorResponse, validationErrorResponse, createdResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    logger.debug("Fetching campaigns - creating service role client")
    const client = await createServiceRoleClient()

    logger.debug("Querying campaigns table")
    const { data, error } = await client.from("campaigns").select("*").order("created_at", { ascending: false })

    if (error) {
      logger.error("Supabase error fetching campaigns", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Database error: ${error.message}`)
    }

    logger.info("Campaigns fetched successfully", { count: data?.length || 0 })

    return successResponse({ campaigns: data || [] })
  } catch (error) {
    logger.error("Fetch campaigns error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return errorResponse("Failed to fetch campaigns", 500, error instanceof Error ? error.message : "Unknown error")
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const validation = campaignSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { name, description, startDate, endDate, targetResponses } = validation.data

    const client = await createServiceRoleClient()

    const { data, error } = await client
      .from("campaigns")
      .insert([
        {
          name,
          description: description || "",
          start_date: startDate,
          end_date: endDate,
          target_responses: targetResponses || 0,
          active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error("Failed to create campaign")
    }

    logger.info("Campaign created", { campaignId: data.id, name: data.name })

    return createdResponse({ campaign: data }, "Campaign created successfully")
  } catch (error) {
    logger.error("Create campaign error", { error: error instanceof Error ? error.message : String(error) })
    return errorResponse("Failed to create campaign", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
