# System Health Check Guide

## Quick Health Check

Visit `/api/system-health` to get a comprehensive system status report.

## Common Issues and Solutions

### 1. Campaigns Not Showing

**Symptoms:**
- Admin dashboard shows "No campaigns yet"
- API returns empty array

**Diagnosis:**
\`\`\`bash
# Check if campaigns exist in database
curl https://your-app.vercel.app/api/system-health
\`\`\`

**Solutions:**

1. **Run RLS Fix Script:**
   \`\`\`sql
   -- Execute scripts/07-fix-rls-policies.sql
   \`\`\`

2. **Verify Service Role Key:**
   - Check that `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables
   - Verify it's the correct key from Supabase dashboard

3. **Seed Sample Data:**
   \`\`\`sql
   -- Execute scripts/02-seed-sample-data.sql
   \`\`\`

### 2. Africa's Talking Integration

**Symptoms:**
- Rewards stuck in "processing" status
- "Failed to send data bundle" errors

**Diagnosis:**
\`\`\`bash
# Check environment variables
curl https://your-app.vercel.app/api/system-health
\`\`\`

**Solutions:**

1. **Verify Credentials:**
   - `AFRICAS_TALKING_API_KEY` - Your API key
   - `AFRICAS_TALKING_USERNAME` - Your username (not "sandbox")
   - `AFRICAS_TALKING_PRODUCT_NAME` - "Darajaplus"

2. **Test Endpoint:**
   \`\`\`bash
   curl -X POST https://bundles.africastalking.com/mobile/data/request \
     -H "Content-Type: application/json" \
     -H "apiKey: YOUR_API_KEY" \
     -d '{
       "username": "YOUR_USERNAME",
       "productName": "Darajaplus",
       "recipients": [{
         "phoneNumber": "+254712345678",
         "quantity": 100,
         "unit": "MB",
         "validity": "Day"
       }]
     }'
   \`\`\`

### 3. RLS (Row Level Security) Issues

**Symptoms:**
- Empty results from API calls
- "permission denied" errors

**Solution:**
Run the RLS fix script to ensure service role can access all tables:
\`\`\`sql
-- scripts/07-fix-rls-policies.sql
\`\`\`

## Monitoring

### Key Metrics to Watch

1. **Database Health:**
   - All tables accessible
   - Row counts increasing

2. **API Response Times:**
   - `/api/campaigns` < 500ms
   - `/api/products` < 500ms

3. **Reward Processing:**
   - Pending rewards processed within 5 minutes
   - Success rate > 95%

### Debug Logs

Enable debug logging by checking the server logs for:
- `[SERVER][INFO]` - Successful operations
- `[SERVER][ERROR]` - Failed operations
- `[SERVER][DEBUG]` - Detailed debugging info

## Emergency Procedures

### Reset RLS Policies

If campaigns/products are not accessible:

\`\`\`sql
-- Disable RLS temporarily (NOT for production)
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus DISABLE ROW LEVEL SECURITY;

-- Then re-enable with correct policies
-- Run scripts/07-fix-rls-policies.sql
\`\`\`

### Clear Stuck Rewards

If rewards are stuck in "processing":

\`\`\`sql
-- Reset stuck rewards to pending
UPDATE rewards 
SET status = 'pending', 
    updated_at = NOW()
WHERE status = 'processing' 
  AND updated_at < NOW() - INTERVAL '1 hour';
\`\`\`

## Support

For additional help:
1. Check debug logs in Vercel dashboard
2. Review `/api/system-health` output
3. Verify all environment variables are set
4. Ensure database migrations are run in order
