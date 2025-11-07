import { createServiceRoleClient } from "@/lib/supabase-server"
import { logger } from "@/lib/logger"
import { productSchema } from "@/lib/validation"
import { errorResponse, validationErrorResponse, createdResponse } from "@/lib/api-response"

export async function GET() {
  try {
    logger.debug("Fetching products")
    const client = await createServiceRoleClient()

    const { data, error } = await client.from("products").select("*").eq("active", true)

    if (error) {
      logger.error("Supabase error fetching products", {
        error: error.message,
        code: error.code,
      })
      throw new Error(`Database error: ${error.message}`)
    }

    logger.info("Products fetched successfully", { count: data?.length || 0 })

    return Response.json({ success: true, products: data || [] }, { status: 200 })
  } catch (error) {
    logger.error("Fetch products error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return Response.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const validation = productSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { name, category, description } = validation.data

    const client = await createServiceRoleClient()

    const { data, error } = await client
      .from("products")
      .insert([
        {
          name,
          category,
          description: description || "",
          active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      logger.error("Supabase error creating product", {
        error: error.message,
        code: error.code,
      })
      throw new Error(`Database error: ${error.message}`)
    }

    logger.info("Product created successfully", { product: data })

    return createdResponse({ product: data }, "Product created successfully")
  } catch (error) {
    logger.error("Create product error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return errorResponse("Failed to create product", 500, error instanceof Error ? error.message : "Unknown error")
  }
}
