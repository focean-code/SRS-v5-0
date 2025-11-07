# Quick Reference Guide

## URLs

### Customer
- **Home**: http://localhost:3000
- **Rewards**: http://localhost:3000/rewards
- **Feedback Form**: http://localhost:3000/feedback?qr={qrId}
- **Analytics**: http://localhost:3000/analytics

### Admin
- **Login**: http://localhost:3000/admin/login
- **Dashboard**: http://localhost:3000/admin

## Default Credentials

- **Username**: admin
- **Password**: RewardHub2025!

## API Endpoints

### Public
- POST /api/admin/login
- GET /api/qr/validate
- POST /api/feedback/submit
- GET /api/rewards/check
- POST /api/rewards/claim

### Admin
- POST /api/admin/logout
- POST /api/admin/generate-qr-batch
- GET /api/analytics

### Internal
- POST /api/rewards/process-batch
- GET /api/rewards/list
- GET /api/campaigns
- GET /api/products
- GET /api/skus

## Database Tables

1. **products** - Product information
2. **product_skus** - Product variants and rewards
3. **campaigns** - Marketing campaigns
4. **qr_codes** - QR code tracking
5. **feedback** - Customer feedback
6. **rewards** - Reward tracking

## Phone Number Format

Valid formats for Kenyan phone numbers:
- +254712345678 (with country code)
- 0712345678 (with leading zero)

## Reward Statuses

- **pending**: Created, awaiting processing
- **processing**: Being sent to customer
- **sent**: Successfully delivered
- **failed**: Failed to send
- **claimed**: Claimed by customer

## QR Code Statuses

- **is_used**: false - Available for scanning
- **is_used**: true - Already scanned, no longer valid

## File Structure Quick Guide

\`\`\`
app/
├── admin/login/page.tsx        # Admin login
├── admin/page.tsx              # Admin dashboard
├── feedback/page.tsx           # Feedback form
├── rewards/page.tsx            # Rewards page
├── qr/[id]/page.tsx           # QR redirect
├── api/                        # All API routes
│   ├── admin/                  # Admin operations
│   ├── feedback/               # Feedback operations
│   ├── qr/                     # QR operations
│   ├── rewards/                # Reward operations
│   └── ...
├── page.tsx                    # Home page
└── layout.tsx                  # Main layout

lib/
├── auth-utils.ts               # Authentication
├── africas-talking.ts          # Data bundle API
├── db-utils.ts                 # Database operations
├── qr-utils.ts                 # QR utilities
├── supabase.ts                 # Supabase client
└── supabase-server.ts          # Server-side Supabase

types/
└── database.ts                 # TypeScript types

scripts/
├── 01-create-tables.sql        # Database schema
└── 02-seed-sample-data.sql     # Sample data
\`\`\`

## Common Commands

### Development
\`\`\`bash
npm run dev              # Start dev server
npm run build           # Build for production
npm start              # Start production server
\`\`\`

### Testing
\`\`\`bash
# Test QR validation
curl http://localhost:3000/api/qr/validate?id={qrId}

# Test feedback submission
curl -X POST http://localhost:3000/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{...}'

# Check health
curl http://localhost:3000/api/health
\`\`\`

## Environment Variables Reference

\`\`\`env
# Required
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_ADMIN_USERNAME=admin
ADMIN_PASSWORD=RewardHub2025!
AFRICAS_TALKING_API_KEY=...
AFRICAS_TALKING_USERNAME=sandbox
\`\`\`

## Keyboard Shortcuts

None currently configured, but can be added in components using:
\`\`\`typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Handle escape
    }
  }
}, [])
\`\`\`

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| QR not validating | Check SKU exists in database |
| Rewards not sending | Verify phone number format |
| Admin login fails | Clear cookies, check credentials |
| Analytics not loading | Check database connection |
| Slow performance | Check database query performance |

## Support Resources

- Documentation: See SYSTEM_ARCHITECTURE.md
- Developer Guide: See DEVELOPER_DOCUMENTATION.md
- User Guide: See USER_DOCUMENTATION.md
- Setup: See SETUP_GUIDE.md
- Monitoring: See MONITORING_GUIDE.md
