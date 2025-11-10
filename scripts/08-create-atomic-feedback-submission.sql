-- Create a PostgreSQL function for atomic feedback and reward creation
-- This ensures both records are created together or not at all (transaction)

CREATE OR REPLACE FUNCTION submit_feedback_atomic(
  p_campaign_id uuid,
  p_qr_id uuid,
  p_sku_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_rating integer,
  p_comment text,
  p_custom_answers jsonb,
  p_verified boolean,
  p_reward_name text,
  p_reward_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feedback_id uuid;
  v_reward_id uuid;
  v_qr_data record;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Check if QR code exists and is not used
  SELECT * INTO v_qr_data
  FROM qr_codes
  WHERE id = p_qr_id
  FOR UPDATE; -- Lock the row to prevent race conditions
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR code not found';
  END IF;
  
  IF v_qr_data.is_used THEN
    RAISE EXCEPTION 'QR code already used';
  END IF;
  
  -- Check for duplicate submission by same phone
  IF EXISTS (
    SELECT 1 FROM feedback 
    WHERE customer_phone = p_customer_phone 
    AND qr_id = p_qr_id
  ) THEN
    RAISE EXCEPTION 'Duplicate submission';
  END IF;
  
  -- Mark QR code as used
  UPDATE qr_codes
  SET 
    is_used = true,
    used_at = NOW(),
    used_by = p_customer_phone
  WHERE id = p_qr_id;
  
  -- Create feedback record
  INSERT INTO feedback (
    campaign_id,
    qr_id,
    sku_id,
    customer_name,
    customer_phone,
    rating,
    comment,
    custom_answers,
    verified
  ) VALUES (
    p_campaign_id,
    p_qr_id,
    p_sku_id,
    p_customer_name,
    p_customer_phone,
    p_rating,
    p_comment,
    p_custom_answers,
    p_verified
  )
  RETURNING id INTO v_feedback_id;
  
  -- Create reward record
  INSERT INTO rewards (
    feedback_id,
    qr_id,
    customer_phone,
    reward_name,
    amount,
    status
  ) VALUES (
    v_feedback_id,
    p_qr_id,
    p_customer_phone,
    p_reward_name,
    p_reward_amount,
    'pending'
  )
  RETURNING id INTO v_reward_id;
  
  -- Return both IDs
  RETURN jsonb_build_object(
    'feedback_id', v_feedback_id,
    'reward_id', v_reward_id,
    'success', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE;
END;
$$;
