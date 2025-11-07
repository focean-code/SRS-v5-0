# Setup Guide - Shopper Reward System v5.0

## Quick Start (5 minutes)

### Step 1: Clone & Install

\`\`\`bash
# Install dependencies
npm install

# or with yarn
yarn install
\`\`\`

### Step 2: Configure Environment Variables

Create \`.env.local\`:

\`\`\`env
# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin Credentials (Optional - uses defaults if not set)
NEXT_PUBLIC_ADMIN_USERNAME=admin
ADMIN_PASSWORD=RewardHub2025!

# Africa's Talking API (Optional - uses mock mode if not set)
AFRICAS_TALKING_API_KEY=your_api_key_here
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_PRODUCT_NAME=Darajaplus
\`\`\`

### Step 3: Set Up Database

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy the connection details

2. **Run Database Schema**
   - Open Supabase SQL Editor
   - Copy the entire content from \`scripts/01-create-tables.sql\`
   - Execute the SQL

3. **Seed Sample Data** (Optional)
   - Run \`scripts/02-seed-sample-data.sql\` for test data

### Step 4: Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit \`http://localhost:3000\`

---

## Detailed Setup

### Supabase Configuration

#### 1. Get Your Credentials

1. Create project on [supabase.com](https://supabase.com)
2. Go to **Settings → API**
3. Copy:
   - **Project URL** → \`NEXT_PUBLIC_SUPABASE_URL\`
   - **anon public** → \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - **service_role secret** → \`SUPABASE_SERVICE_ROLE_KEY\`

#### 2. Create Database Tables

**Method A: Using SQL Editor**
- Go to Supabase Dashboard → SQL Editor
- Click "New Query"
- Paste content from \`scripts/01-create-tables.sql\`
- Click "Run"

**Method B: Using psql**
\`\`\`bash
psql postgresql://user:password@host:5432/database < scripts/01-create-tables.sql
\`\`\`

#### 3. Enable Row Level Security (RLS)

Already configured in the SQL schema. Verify:
- Go to **Database → Tables**
- Check each table has RLS enabled
- Policies are configured for service role access

#### 4. Seed Initial Data

\`\`\`bash
# Via SQL Editor or psql
psql postgresql://user:password@host:5432/database < scripts/02-seed-sample-data.sql
\`\`\`

### Africa's Talking Setup

#### 1. Create Account

1. Visit [africastalking.com](https://africastalking.com)
2. Sign up and verify email
3. Create sandbox account for testing

#### 2. Get API Key

1. Go to **Settings → API Keys**
2. Copy **API Key**
3. Add to \`.env.local\`:
   \`\`\`env
   AFRICAS_TALKING_API_KEY=your_key_here
   AFRICAS_TALKING_USERNAME=your_username
   \`\`\`

#### 3. Test Integration

\`\`\`bash
# Test API connection
curl http://localhost:3000/api/health
\`\`\`

Expected response:
\`\`\`json
{
  "status": "healthy",
  "hasAfricasTalking": true
}
\`\`\`

### Admin Setup

#### Default Credentials

- **Username**: \`admin\`
- **Password**: \`RewardHub2025!\`

#### Change Credentials

Update \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_ADMIN_USERNAME=custom_username
ADMIN_PASSWORD=custom_strong_password
\`\`\`

#### First Login

1. Navigate to \`http://localhost:3000/admin/login\`
2. Enter credentials
3. Click "Login"
4. You'll be redirected to admin dashboard

---

## Testing Setup

### 1. Create Test Product

\`\`\`bash
# Get product SKU from sample data
# Use in QR generation: 550e8400-e29b-41d4-a716-446655440001
\`\`\`

### 2. Generate Test QR Codes

1. Go to Admin Dashboard → QR Codes tab
2. Enter SKU: \`550e8400-e29b-41d4-a716-446655440001\`
3. Quantity: \`5\`
4. Click "Generate QR Codes"

### 3. Test Full Flow

1. Copy a generated QR URL
2. Open in browser
3. Should redirect to feedback form
4. Fill and submit form
5. Should show success page
6. Check Rewards page for your reward

### 4. Test Reward Processing

\`\`\`bash
curl -X POST http://localhost:3000/api/rewards/process-batch \
  -H "Authorization: Bearer your_admin_secret_key"
\`\`\`

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | - | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | - | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Yes | - | Supabase service role key |
| NEXT_PUBLIC_APP_URL | Yes | - | Base URL for QR links |
| NEXT_PUBLIC_ADMIN_USERNAME | No | admin | Admin login username |
| ADMIN_PASSWORD | No | RewardHub2025! | Admin login password |
| AFRICAS_TALKING_API_KEY | No | - | Data bundle API key |
| AFRICAS_TALKING_USERNAME | No | sandbox | API username |
| AFRICAS_TALKING_PRODUCT_NAME | No | Darajaplus | Mobile data product name in Africa's Talking |
| ADMIN_SECRET_KEY | No | - | For admin API protection |

### Feature Flags

Features can be controlled via environment variables:

\`\`\`env
# Enable/disable features
ENABLE_AFRICAS_TALKING=true
ENABLE_ANALYTICS=true
ENABLE_CAMPAIGNS=true
\`\`\`

---

## Deployment

### Vercel Deployment

#### 1. Prepare Repository

\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

#### 2. Connect to Vercel

1. Visit [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository
4. Select project

#### 3. Add Environment Variables

In Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add all variables from \`.env.local\`
3. Select appropriate environments (Production, Preview, Development)

#### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit deployment URL

#### 5. Post-Deployment

- Run database setup (same SQL scripts)
- Test all features
- Configure custom domain if needed

### Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

Build and run:
\`\`\`bash
docker build -t reward-system .
docker run -p 3000:3000 --env-file .env.local reward-system
\`\`\`

---

## Troubleshooting

### Common Issues

#### Issue: "Database connection failed"

**Solution:**
- Verify \`NEXT_PUBLIC_SUPABASE_URL\` is correct
- Check \`SUPABASE_SERVICE_ROLE_KEY\` is valid
- Ensure tables exist (run schema script)
- Check Supabase project status

#### Issue: "Invalid phone number format"

**Solution:**
- Kenyan phone numbers must match: \`/^(?:\+254|0)[17]\d{8,10}$/\`
- Valid formats: \`+254712345678\` or \`0712345678\`
- Ensure no spaces or special characters

#### Issue: "QR codes not generating"

**Solution:**
- Verify SKU exists in database
- Check quantity doesn't exceed 10,000
- Ensure \`NEXT_PUBLIC_APP_URL\` is set
- Check server logs for errors

#### Issue: "Rewards not processing"

**Solution:**
- If using Africa's Talking, verify API key is valid
- Check customer phone number format
- Monitor server logs
- Test with mock mode first (no API key)

#### Issue: "Admin login fails"

**Solution:**
- Clear browser cookies
- Verify username and password match env vars
- Check \`ADMIN_PASSWORD\` is set
- Ensure browser accepts cookies

### Debug Mode

Enable debug logging:

\`\`\`typescript
// In your code
console.log("[v0] Debug message:", variable)
\`\`\`

Check logs:
- Browser: DevTools → Console
- Server: Terminal output
- Supabase: Dashboard → Logs

---

## Performance Optimization

### Database

- Indexes are pre-created on commonly filtered fields
- Use pagination for large result sets
- Limit query results appropriately

### Caching

Add caching headers to static assets:

\`\`\`typescript
// next.config.mjs
export default {
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
}
\`\`\`

### Monitoring

Track metrics:
- Response times
- Error rates
- Database queries
- API usage

---

## Security Checklist

- [ ] All environment variables set securely
- [ ] Admin credentials are strong
- [ ] Database RLS policies enabled
- [ ] SSL/HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] No sensitive data in logs
- [ ] Regular security updates
- [ ] Backup strategy in place

---

## Support

For issues or questions:
1. Check this documentation
2. Review error messages
3. Check server logs
4. Review Supabase documentation
5. Contact support

\`\`\`
