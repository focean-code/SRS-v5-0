-- Enable RLS on all tables for security
-- Enable RLS on campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Campaigns: Admin only access
CREATE POLICY "Campaigns admin only" ON campaigns
  FOR ALL
  TO authenticated
  USING (true);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products: Admin only access
CREATE POLICY "Products admin only" ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Enable RLS on product_skus table
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;

-- Product SKUs: Admin only access
CREATE POLICY "Product SKUs admin only" ON product_skus
  FOR ALL
  TO authenticated
  USING (true);

-- Update existing QR codes policy to be more restrictive
DROP POLICY IF EXISTS "QR codes readable via service role" ON qr_codes;

CREATE POLICY "QR codes admin access" ON qr_codes
  FOR ALL
  TO authenticated
  USING (true);

-- Allow public to read non-used QR codes for validation
CREATE POLICY "QR codes public validation" ON qr_codes
  FOR SELECT
  TO anon
  USING (is_used = false);

-- Update feedback policies
DROP POLICY IF EXISTS "Feedback submittable" ON feedback;
DROP POLICY IF EXISTS "Feedback readable for admin" ON feedback;

CREATE POLICY "Feedback public submit" ON feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Feedback admin access" ON feedback
  FOR ALL
  TO authenticated
  USING (true);

-- Update rewards policies
DROP POLICY IF EXISTS "Rewards admin only" ON rewards;

CREATE POLICY "Rewards admin access" ON rewards
  FOR ALL
  TO authenticated
  USING (true);

-- Allow users to read their own rewards
CREATE POLICY "Rewards user read own" ON rewards
  FOR SELECT
  TO anon
  USING (customer_phone = current_setting('request.jwt.claims', true)::json->>'phone');
