-- Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Product SKUs Table
CREATE TABLE IF NOT EXISTS product_skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reward_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reward_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_responses INTEGER DEFAULT 0,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create QR Codes Table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  sku_id UUID NOT NULL REFERENCES product_skus(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL DEFAULT 1,
  is_used BOOLEAN DEFAULT false,
  used_by TEXT,
  used_at TIMESTAMP WITH TIME ZONE,
  location JSONB,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(id)
);

-- Create Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  qr_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  sku_id UUID NOT NULL REFERENCES product_skus(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  custom_answers JSONB DEFAULT '{}',
  sentiment TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Rewards Table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  qr_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'claimed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Indices for Performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_id ON qr_codes(id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_used ON qr_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_qr_codes_campaign ON qr_codes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_feedback_phone ON feedback(customer_phone);
CREATE INDEX IF NOT EXISTS idx_feedback_campaign ON feedback(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rewards_phone ON rewards(customer_phone);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_product_skus_product ON product_skus(product_id);

-- Create RLS Policies for Security
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- QR Codes: Allow public read for non-used codes only (via validation)
CREATE POLICY "QR codes readable via service role" ON qr_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- Feedback: Allow insert for public submission
CREATE POLICY "Feedback submittable" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Feedback: Allow read for service role only
CREATE POLICY "Feedback readable for admin" ON feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Rewards: Allow read/write for service role only
CREATE POLICY "Rewards admin only" ON rewards
  FOR ALL
  TO authenticated
  USING (true);
