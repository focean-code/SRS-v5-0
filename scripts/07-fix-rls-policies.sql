-- Fix RLS policies to work with service role
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Campaigns admin only" ON campaigns;
DROP POLICY IF EXISTS "Products admin only" ON products;
DROP POLICY IF EXISTS "Product SKUs admin only" ON product_skus;

-- Create new policies that allow service role access
-- Campaigns: Allow service role full access, authenticated users full access
CREATE POLICY "Campaigns full access" ON campaigns
  FOR ALL
  USING (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated'
  );

-- Products: Allow service role full access, authenticated users full access  
CREATE POLICY "Products full access" ON products
  FOR ALL
  USING (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated'
  );

-- Product SKUs: Allow service role full access, authenticated users full access
CREATE POLICY "Product SKUs full access" ON product_skus
  FOR ALL
  USING (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated'
  );

-- Allow public read access to active campaigns for feedback form
CREATE POLICY "Campaigns public read active" ON campaigns
  FOR SELECT
  TO anon
  USING (active = true);

-- Allow public read access to active products
CREATE POLICY "Products public read active" ON products
  FOR SELECT
  TO anon
  USING (active = true);

-- Allow public read access to product SKUs
CREATE POLICY "Product SKUs public read" ON product_skus
  FOR SELECT
  TO anon
  USING (true);
