import { createServiceRoleClient } from "./supabase-server"

export async function generateQRBatch(skuId: string, quantity: number, batchNumber: number, campaignId?: string) {
  const client = await createServiceRoleClient()
  const qrCodes: any[] = []

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  for (let i = 0; i < quantity; i++) {
    const qrId = crypto.randomUUID()

    qrCodes.push({
      campaign_id: campaignId || null,
      id: qrId,
      sku_id: skuId,
      batch_number: batchNumber,
      is_used: false,
      used_by: null,
      used_at: null,
      location: null,
      url: `${appUrl}/qr/${qrId}`,
      created_at: new Date().toISOString(),
    })
  }

  const { error } = await client.from("qr_codes").insert(qrCodes)

  if (error) {
    console.error("Error inserting QR codes:", error)
    throw new Error("Failed to generate QR codes")
  }

  return qrCodes
}

export async function validateQRToken(qrId: string) {
  const client = await createServiceRoleClient()

  const { data, error } = await client
    .from("qr_codes")
    .select(
      "id, is_used, sku_id, campaign_id, product_skus(id, product_id, reward_amount, reward_description, products(id, name, category, description))",
    )
    .eq("id", qrId)
    .single()

  if (error) {
    console.error("QR validation error:", error)
    return null
  }

  if (!data || data.is_used) {
    console.warn("QR code already used or invalid:", qrId)
    return null
  }

  return data
}

export function validatePhoneNumber(phone: string): boolean {
  // Kenyan phone number validation: +254 or 07/01, 10-13 digits total
  const phoneRegex = /^(?:\+254|0)[17]\d{8,10}$/
  return phoneRegex.test(phone.replace(/\s+/g, ""))
}

export async function checkDuplicateSubmission(phoneNumber: string, qrId: string): Promise<boolean> {
  const client = await createServiceRoleClient()

  const { data, error } = await client
    .from("feedback")
    .select("id")
    .eq("customer_phone", phoneNumber)
    .eq("qr_id", qrId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 means no rows found, which is expected
    console.error("Error checking duplicate submission:", error)
  }

  return !!data
}
