# Developer Guide - Shopper Reward System v5.0

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Africa's Talking account (optional for development)

### Installation

1. **Clone/Download Project**
\`\`\`bash
cd shopper-reward-system
npm install
\`\`\`

2. **Environment Setup**

Create a `.env.local` file:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
NEXT_PUBLIC_ADMIN_USERNAME=admin
ADMIN_PASSWORD=RewardHub2025!

# Africa's Talking (optional)
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=sandbox
\`\`\`

3. **Database Setup**

Connect to your Supabase database and run the SQL from `scripts/01-create-tables.sql`:

\`\`\`bash
# Run via Supabase UI or psql
psql -h your_host -U your_user -d your_database -f scripts/01-create-tables.sql
\`\`\`

4. **Start Development Server**

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 14+ with React 19
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom session-based
- **External API**: Africa's Talking
- **UI Components**: shadcn/ui

### Project Structure

\`\`\`
├── app/                    # Next.js app directory
├── lib/                    # Utility functions and clients
├── types/                  # TypeScript interfaces
├── components/ui/          # shadcn components
├── middleware.ts           # Auth middleware
└── scripts/               # Database scripts
\`\`\`

### Key Files

- **middleware.ts** - Auth protection for admin routes
- **lib/auth-utils.ts** - Session management
- **lib/africas-talking.ts** - Data bundle API
- **lib/db-utils.ts** - Database operations
- **types/database.ts** - Type definitions

## API Development

### Creating New Endpoints

Template for new API routes:

\`\`\`typescript
// app/api/[resource]/[action]/route.ts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const param = searchParams.get("param")

    if (!param) {
      return Response.json({ error: "Missing required parameter" }, { status: 400 })
    }

    // Your logic here

    return Response.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error:", error)
    return Response.json(
      { error: "Operation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
\`\`\`

### Error Handling Pattern

\`\`\`typescript
try {
  // Attempt operation
} catch (error) {
  console.error("[v0] Context:", error)
  return Response.json(
    {
      error: "User-friendly message",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  )
}
\`\`\`

## Database Operations

### Query Pattern

\`\`\`typescript
import { createServiceRoleClient } from "@/lib/supabase-server"

export async function getExample(id: string) {
  const client = await createServiceRoleClient()

  const { data, error } = await client
    .from("table_name")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Error:", error)
    throw new Error("Operation failed")
  }

  return data
}
\`\`\`

### Mutation Pattern

\`\`\`typescript
const { data, error } = await client
  .from("table_name")
  .insert([{ ...values }])
  .select()
  .single()
\`\`\`

## Africa's Talking Integration

### Configuration

1. Get API key from [https://africastalking.com](https://africastalking.com)
2. Add to environment:

\`\`\`env
AFRICAS_TALKING_API_KEY=your_key
AFRICAS_TALKING_USERNAME=your_username
\`\`\`

3. Use in code:

\`\`\`typescript
import { sendDataBundle } from "@/lib/africas-talking"

// Send a single bundle
const result = await sendDataBundle(phoneNumber, "50MB")

// Send multiple bundles (used for 340g = 2x50MB, 500g = 3x50MB)
const result = await sendDataBundle(phoneNumber, "50MB", 2) // Sends 50MB twice
const result = await sendDataBundle(phoneNumber, "50MB", 3) // Sends 50MB three times
\`\`\`

**Important:** The reward system automatically determines bundle strategy based on SKU weight:
- **340g SKUs**: Sends 50MB × 2 = 100MB total (customer sees 100MB)
- **500g SKUs**: Sends 50MB × 3 = 150MB total (customer sees 150MB)
- Multiple transactions are transparent to customers

### Production Mode

**⚠️ This function sends REAL data bundles and charges your Africa's Talking account.**

The `sendDataBundle` function requires valid API credentials:
- `AFRICAS_TALKING_API_KEY` - Your Africa's Talking API key
- `AFRICAS_TALKING_USERNAME` - Your Africa's Talking username
- `AFRICAS_TALKING_PRODUCT_NAME` - Your product name (defaults to "Darajaplus")

If these are not configured, the function will throw an error. There is **NO mock mode** - all calls are real API requests to Africa's Talking.

## Authentication System

### Session Management

\`\`\`typescript
import { setAdminSession, getAdminSession, clearAdminSession } from "@/lib/auth-utils"

// Set session after login
await setAdminSession(username)

// Check session
const session = await getAdminSession()

// Clear on logout
await clearAdminSession()
\`\`\`

### Middleware Protection

Protected routes automatically redirect to login:

\`\`\`typescript
// middleware.ts already configured
// Any route starting with /admin is protected
\`\`\`

## Testing Guide

### Manual Testing

1. **QR Flow**
   - Generate QR codes via admin
   - Scan with phone
   - Submit feedback
   - Verify reward creation

2. **Reward Processing**
   - Check reward status
   - Verify Africa's Talking integration
   - Confirm data bundle delivery

3. **Admin Functions**
   - Login/logout
   - Generate batches
   - View analytics

### API Testing (curl)

\`\`\`bash
# Login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"RewardHub2025!"}'

# Generate QR codes
curl -X POST http://localhost:3000/api/admin/generate-qr-batch \
  -H "Content-Type: application/json" \
  -d '{
    "skuId":"123e4567-e89b-12d3-a456-426614174000",
    "quantity":10,
    "batchNumber":1
  }'

# Submit feedback
curl -X POST http://localhost:3000/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{
    "qrId":"qr-id-here",
    "customerName":"John Doe",
    "customerPhone":"+254712345678",
    "rating":5,
    "comment":"Great product!"
  }'

# Check rewards
curl "http://localhost:3000/api/rewards/check?phone=%2B254712345678"

# Get analytics
curl "http://localhost:3000/api/analytics"
\`\`\`

## Performance Optimization

### Database Optimization

- Indexed queries on frequently filtered fields
- Select specific columns needed
- Limit result sets appropriately

### Client Optimization

- Use React's built-in memoization
- Lazy load components when needed
- Cache analytics data

### Example Query Optimization

\`\`\`typescript
// Good: specific columns, indexed field, limit
const { data } = await client
  .from("rewards")
  .select("id, customer_phone, amount, status")
  .eq("status", "pending")
  .limit(100)

// Avoid: selecting all columns on large tables
// const { data } = await client.from("rewards").select("*")
\`\`\`

## Debugging

### Enable Debugging

Use console.log with "[v0]" prefix:

\`\`\`typescript
console.log("[v0] Variable name:", variableValue)
console.error("[v0] Error context:", error)
\`\`\`

### Check Supabase Logs

1. Go to Supabase dashboard
2. Check Database → Query Performance
3. Monitor API calls in browser DevTools

### Common Issues

**Web Crypto API Not Working**
- Ensure using global `crypto` object
- Verify not importing Node.js `crypto` module

**Database Errors**
- Check RLS policies
- Verify service role key has access
- Check table names and columns

**Phone Number Validation**
- Regex: `/^(?:\+254|0)[17]\d{8,10}$/`
- Must start with +254, 0, or 254
- Must be 10-13 digits total

## Deployment

### Environment Setup

Set these environment variables in Vercel:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ADMIN_PASSWORD=strong_password_here
AFRICAS_TALKING_API_KEY=...
\`\`\`

### Pre-Deployment Checklist

- [ ] Database schema created
- [ ] All environment variables set
- [ ] Admin credentials configured
- [ ] Africa's Talking account configured
- [ ] Test all flows in staging
- [ ] Security review completed

### Deployment Steps

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

## Contributing

### Code Style

- Use TypeScript for type safety
- Follow existing patterns
- Add error handling to all API routes
- Use descriptive variable names
- Comment complex logic

### Adding Features

1. Create branch: `feature/description`
2. Update types if needed
3. Add API routes
4. Update UI components
5. Test thoroughly
6. Submit PR

## Support & Troubleshooting

### Common Questions

**Q: How do I reset the admin password?**
A: Update the `ADMIN_PASSWORD` environment variable and redeploy.

**Q: Can I use a different phone provider?**
A: Yes, Africa's Talking supports multiple providers. Configure in `getMobileDataOptions()`.

**Q: How do I backup the database?**
A: Use Supabase's built-in backup feature in the dashboard.

### Getting Help

- Check documentation
- Review error logs in console
- Check Supabase status
- Review API response details
