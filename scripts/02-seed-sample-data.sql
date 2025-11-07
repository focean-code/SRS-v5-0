-- Seed sample data for testing

-- Insert sample product
INSERT INTO products (id, name, category, description, active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Premium Kenya Coffee',
  'Beverages',
  'High-quality single-origin coffee from the highlands of Kenya',
  true
);

-- Insert sample SKU
INSERT INTO product_skus (id, product_id, weight, price, reward_amount, reward_description)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '250g',
  450.00,
  50,
  '50MB Data Bundle'
);

-- Insert sample campaign
INSERT INTO campaigns (id, name, description, start_date, end_date, target_responses, active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'Q1 Feedback Campaign',
  'Customer feedback campaign for Q1 2025',
  '2025-01-01'::date,
  '2025-03-31'::date,
  1000,
  true
);
