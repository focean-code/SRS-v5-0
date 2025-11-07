-- Add transaction_id column to rewards table for tracking Africa's Talking transactions
-- This allows us to match webhook notifications to specific reward records

ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Create index for fast lookups by transaction_id
CREATE INDEX IF NOT EXISTS idx_rewards_transaction_id ON rewards(transaction_id);

-- Add comment for documentation
COMMENT ON COLUMN rewards.transaction_id IS 'Africa''s Talking transaction ID for tracking bundle delivery status';
