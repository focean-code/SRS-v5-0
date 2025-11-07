import { createServiceRoleClient } from "./supabase-server"
import { logger } from "./logger"
import { cache } from "./cache"

export async function getQRCodeData(qrToken: string) {
  const cacheKey = `qr:${qrToken}`
  const cached = cache.get(cacheKey)
  if (cached) {
    logger.debug("QR code data retrieved from cache", { qrToken })
    return cached
  }

  const client = await createServiceRoleClient()

  const { data, error } = await client
    .from("qr_codes")
    .select(
      "id, sku_id, is_used, product_skus(id, product_id, weight, reward_amount, reward_description, products(id, name, category, description))",
    )
    .eq("id", qrToken)
    .single()

  if (error) {
    logger.error("Error fetching QR code", { qrToken, error: error.message })
    throw new Error("QR code not found")
  }

  cache.set(cacheKey, data, 300)
  return data
}

export async function markQRCodeAsUsed(qrId: string, phoneNumber: string, location?: any) {
  const client = await createServiceRoleClient()

  const { error } = await client
    .from("qr_codes")
    .update({
      is_used: true,
      used_by: phoneNumber,
      used_at: new Date().toISOString(),
      location: location || null,
    })
    .eq("id", qrId)

  if (error) {
    logger.error("Error marking QR as used", { qrId, error: error.message })
    throw new Error("Failed to mark QR code as used")
  }

  cache.delete(`qr:${qrId}`)
  logger.info("QR code marked as used", { qrId, phoneNumber })
}

export async function createFeedback(feedbackData: any) {
  const client = await createServiceRoleClient()

  const { data, error } = await client.from("feedback").insert([feedbackData]).select().single()

  if (error) {
    logger.error("Error creating feedback", { error: error.message })
    throw new Error("Failed to create feedback")
  }

  logger.info("Feedback created", { feedbackId: data.id, phone: feedbackData.customer_phone })
  return data
}

export async function createReward(rewardData: any) {
  const client = await createServiceRoleClient()

  const { data, error } = await client.from("rewards").insert([rewardData]).select().single()

  if (error) {
    logger.error("Error creating reward", { error: error.message })
    throw new Error("Failed to create reward")
  }

  logger.info("Reward created", { rewardId: data.id, phone: rewardData.customer_phone })
  return data
}

export async function getRewardByFeedbackId(feedbackId: string) {
  const client = await createServiceRoleClient()

  const { data, error } = await client.from("rewards").select("*").eq("feedback_id", feedbackId).single()

  if (error && error.code !== "PGRST116") {
    logger.error("Error fetching reward", { feedbackId, error: error.message })
  }

  return data || null
}

export async function updateRewardStatus(rewardId: string, status: string, sentAt?: boolean) {
  const client = await createServiceRoleClient()

  const updateData: any = { status, updated_at: new Date().toISOString() }
  if (sentAt) {
    updateData.sent_at = new Date().toISOString()
  }

  const { error } = await client.from("rewards").update(updateData).eq("id", rewardId)

  if (error) {
    logger.error("Error updating reward status", { rewardId, status, error: error.message })
    throw new Error("Failed to update reward status")
  }

  logger.info("Reward status updated", { rewardId, status })
}

export async function getAnalytics(campaignId?: string) {
  const cacheKey = `analytics:${campaignId || "all"}`
  const cached = cache.get(cacheKey)
  if (cached) {
    logger.debug("Analytics retrieved from cache", { campaignId })
    return cached
  }

  const client = await createServiceRoleClient()

  try {
    // Get feedback count
    let feedbackQuery = client.from("feedback").select("id", { count: "exact", head: true })
    if (campaignId) {
      feedbackQuery = feedbackQuery.eq("campaign_id", campaignId)
    }
    const { count: feedbackCount } = await feedbackQuery

    // Get rewards sent
    let rewardsQuery = client.from("rewards").select("id", { count: "exact", head: true }).eq("status", "sent")
    if (campaignId) {
      rewardsQuery = rewardsQuery.eq("feedback_id", campaignId)
    }
    const { count: rewardsSent } = await rewardsQuery

    // Get average rating
    let ratingsQuery = client.from("feedback").select("rating").gt("rating", 0)
    if (campaignId) {
      ratingsQuery = ratingsQuery.eq("campaign_id", campaignId)
    }
    const { data: ratings } = await ratingsQuery

    const avgRating =
      ratings && ratings.length > 0
        ? (ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length).toFixed(2)
        : "0"

    let qrQuery = client.from("qr_codes").select("id, is_used", { count: "exact", head: false })
    if (campaignId) {
      qrQuery = qrQuery.eq("campaign_id", campaignId)
    }
    const { data: qrData } = await qrQuery

    const totalQRCodes = qrData?.length || 0
    const usedQRCodes = qrData?.filter((qr: any) => qr.is_used).length || 0

    const result = {
      feedbackCount: feedbackCount || 0,
      rewardsSent: rewardsSent || 0,
      averageRating: Number.parseFloat(avgRating),
      totalQRCodes,
      usedQRCodes,
      conversionRate: totalQRCodes > 0 ? ((usedQRCodes / totalQRCodes) * 100).toFixed(2) : "0",
    }

    cache.set(cacheKey, result, 120)
    return result
  } catch (error) {
    logger.error("Error getting analytics", {
      campaignId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      feedbackCount: 0,
      rewardsSent: 0,
      averageRating: 0,
      totalQRCodes: 0,
      usedQRCodes: 0,
      conversionRate: "0",
    }
  }
}

export async function getPendingRewards() {
  const client = await createServiceRoleClient()

  const { data, error } = await client
    .from("rewards")
    .select("id, customer_phone, amount, reward_name")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    logger.error("Error fetching pending rewards", { error: error.message })
    return []
  }

  return data || []
}

export async function getAllRewards(status?: string) {
  const client = await createServiceRoleClient()

  let query = client.from("rewards").select("*")

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    logger.error("Error fetching rewards", { status, error: error.message })
    return []
  }

  return data || []
}
