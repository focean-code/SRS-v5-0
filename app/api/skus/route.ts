import { createServiceRoleClient } from "@/lib/supabase-server"
import { skuSchema } from "@/lib/validation"
import { successResponse, errorResponse, validationErrorResponse, createdResponse } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    console.log("[v0] Fetching SKUs...")
    const client = await createServiceRoleClient()
    console.log("[v0] Service role client created")

    const { data, error } = await client
      .from("product_skus")
      .select("id, product_id, weight, price, reward_amount, reward_description, products(id, name, category)")
      .order("created_at", { ascending: false })

    console.log("[v0] Query result:", { dataLength: data?.length, error: error?.message })

    if (error) {
      logger.error("Supabase error fetching SKUs", { error: error.message, details: error })
      throw new Error(`Database error: ${error.message}`)
    }

    logger.info("SKUs fetched successfully", { count: data?.length || 0 })
    return successResponse({ skus: data || [] }, "SKUs fetched successfully")
  } catch (error) {
    console.error("[v0] Fetch SKUs error:", error)
    logger.error("Fetch SKUs error:", error)
    return errorResponse("Failed to fetch SKUs", 500, error instanceof Error ? error.message : "Unknown error")
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const validation = skuSchema.safeParse({
      productId: body.product_id,
      weight: body.weight,
      price: body.price,
      rewardAmount: body.reward_amount,
      rewardDescription: body.reward_description,
    })

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { productId, weight, price, rewardAmount, rewardDescription } = validation.data

    const client = await createServiceRoleClient()

    const { data, error } = await client
      .from("product_skus")
      .insert([
        {
          product_id: productId,
          weight,
          price,
          reward_amount: rewardAmount,
          reward_description: rewardDescription,
        },
      ])
      .select()
      .single()

    if (error) {
      logger.error("Supabase error creating SKU", { error: error.message })
      throw new Error(`Database error: ${error.message}`)
    }

    logger.info("SKU created successfully", { sku: data })

    return createdResponse({ sku: data }, "SKU created successfully")
  } catch (error) {
    logger.error("Create SKU error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return errorResponse("Failed to create SKU", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
