-- Add additional performance indexes
-- Indexes for phone number lookups (frequently queried)
CREATE INDEX IF NOT EXISTS idx_feedback_phone_qr ON feedback(customer_phone, qr_id);
CREATE INDEX IF NOT EXISTS idx_rewards_phone_status ON rewards(customer_phone, status);

-- Indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_created ON rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created ON qr_codes(created_at DESC);

-- Indexes for campaign analytics
CREATE INDEX IF NOT EXISTS idx_feedback_campaign_rating ON feedback(campaign_id, rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_codes_campaign_used ON qr_codes(campaign_id, is_used);

-- Composite index for reward processing
CREATE INDEX IF NOT EXISTS idx_rewards_status_created ON rewards(status, created_at) WHERE status = 'pending';

-- Index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_qr_codes_sku ON qr_codes(sku_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sku ON feedback(sku_id);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(active, start_date, end_date) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
