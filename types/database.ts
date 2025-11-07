export interface Product {
  id: string
  name: string
  category: string
  description: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductSKU {
  id: string
  product_id: string
  weight: string
  price: number
  reward_amount: number
  reward_description: string
  created_at: string
  updated_at: string
}

export interface QRCode {
  id: string
  sku_id: string
  batch_number: number
  is_used: boolean
  used_by: string | null
  used_at: string | null
  location: Record<string, any> | null
  url: string
  created_at: string
}

export interface Feedback {
  id: string
  campaign_id: string
  sku_id: string
  customer_name: string
  customer_phone: string
  rating: number
  comment: string | null
  custom_answers: Record<string, any>
  sentiment: string | null
  verified: boolean
  created_at: string
}

export interface Reward {
  id: string
  feedback_id: string
  customer_phone: string
  reward_name: string
  amount: number
  status: "pending" | "sent" | "failed" | "claimed"
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description: string
  active: boolean
  start_date: string
  end_date: string
  target_responses: number
  meta: Record<string, any>
  created_at: string
  updated_at: string
}

export interface RewardClaim {
  id: string
  reward_id: string
  customer_phone: string
  claimed_at: string
  claim_status: "pending" | "claimed" | "expired"
  claim_code: string
}
