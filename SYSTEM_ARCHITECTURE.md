# Shopper Reward System v5.0 - Complete System Architecture

## Overview

The Shopper Reward System is a comprehensive platform that enables businesses to gather customer feedback through QR code scanning and reward participants with mobile data bundles via Africa's Talking API.

## System Flow

### Customer Journey

1. **Purchase Product** - Customer buys a product with a QR code on packaging
2. **Scan QR Code** - Customer scans the QR code with their phone
3. **Validation** - System validates the QR code via `/api/qr/validate`
4. **Feedback Form** - Customer fills out 4-step feedback form:
   - Full name
   - Phone number (Kenyan format validation)
   - Product rating (1-5 stars)
   - Additional comments
5. **Submission** - Form submits to `/api/feedback/submit`
6. **Verification** - System checks:
   - Duplicate prevention (same phone + QR combination)
   - Phone number validation
   - QR code status (must be unused)
7. **Reward Processing** - System creates reward record with "pending" status
8. **Instant Notification** - Reward page shows confirmation
9. **Background Processing** - Rewards are processed via Africa's Talking API
10. **Data Bundle Delivery** - Customer receives mobile data bundle

### Admin Workflow

1. **Login** - Admin accesses `/admin/login` with credentials
2. **Dashboard** - Views analytics and metrics on main dashboard
3. **QR Generation** - Creates new QR code batches for products
4. **Reward Management** - Monitors and processes pending rewards
5. **Analytics** - Views real-time campaign performance metrics

## API Endpoints

### Customer APIs

- `GET /api/qr/validate?id={qrId}` - Validate QR code and get product data
- `POST /api/feedback/submit` - Submit customer feedback
- `GET /api/rewards/check?phone={phoneNumber}` - Check available rewards
- `POST /api/rewards/claim` - Claim a reward (triggers data bundle send)

### Admin APIs

- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `POST /api/admin/generate-qr-batch` - Generate QR codes
- `GET /api/analytics` - Get campaign analytics

### Utility APIs

- `POST /api/rewards/process` - Process pending rewards (internal)
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/products` - List all products
- `POST /api/products` - Create new product

## Database Schema

### Tables

#### products
- id: UUID (PK)
- name: string
- category: string
- description: text
- active: boolean
- created_at: timestamp
- updated_at: timestamp

#### product_skus
- id: UUID (PK)
- product_id: UUID (FK)
- weight: string
- price: number
- reward_amount: number
- reward_description: string
- created_at: timestamp
- updated_at: timestamp

#### campaigns
- id: UUID (PK)
- name: string
- description: text
- active: boolean
- start_date: date
- end_date: date
- target_responses: number
- meta: jsonb
- created_at: timestamp
- updated_at: timestamp

#### qr_codes
- id: UUID (PK)
- campaign_id: UUID (FK) [nullable]
- sku_id: UUID (FK)
- batch_number: number
- is_used: boolean
- used_by: string (phone number) [nullable]
- used_at: timestamp [nullable]
- location: jsonb [nullable]
- url: string
- created_at: timestamp

#### feedback
- id: UUID (PK)
- campaign_id: UUID (FK) [nullable]
- qr_id: UUID (FK)
- sku_id: UUID (FK)
- customer_name: string
- customer_phone: string
- rating: number (1-5)
- comment: text [nullable]
- custom_answers: jsonb
- sentiment: string [nullable]
- verified: boolean
- created_at: timestamp

#### rewards
- id: UUID (PK)
- feedback_id: UUID (FK)
- qr_id: UUID (FK)
- customer_phone: string
- reward_name: string
- amount: number
- status: enum ("pending", "processing", "sent", "failed", "claimed")
- sent_at: timestamp [nullable]
- created_at: timestamp
- updated_at: timestamp

## Key Features

### Authentication
- Admin login system with username/password
- Session-based authentication using HTTP-only cookies
- Automatic redirect to login for protected routes via middleware

### Data Bundle Integration
- Africa's Talking API integration for mobile data distribution
- Support for multiple bundle sizes (10MB to 5GB)
- Automatic pricing based on bundle size
- Mock mode when API key not configured (for development)

### QR Code Management
- Batch generation with configurable quantities
- UUID-based unique identifiers
- One-time use validation
- URL generation with NEXT_PUBLIC_APP_URL
- Batch tracking for organization

### Feedback Collection
- Multi-step form with validation
- Kenyan phone number validation
- Duplicate submission prevention
- Sentiment analysis ready (placeholder field)
- Custom answers support for campaigns

### Reward System
- Automatic reward creation on feedback submission
- Multiple reward statuses (pending, processing, sent, failed, claimed)
- Direct Africa's Talking integration for data distribution
- Reward claiming page for customers to check and activate rewards

### Analytics
- Real-time metrics dashboard
- Conversion rate tracking
- Average rating calculations
- Campaign-specific filtering
- QR code usage metrics

## Environment Variables

### Required

- `NEXT_PUBLIC_APP_URL` - Base URL for QR code links (e.g., http://localhost:3000)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Optional

- `ADMIN_PASSWORD` - Admin password (default: RewardHub2025!)
- `NEXT_PUBLIC_ADMIN_USERNAME` - Admin username (default: admin)
- `AFRICAS_TALKING_API_KEY` - Africa's Talking API key (if configured)
- `AFRICAS_TALKING_USERNAME` - Africa's Talking username (default: sandbox)
- `AFRICAS_TALKING_PRODUCT_NAME` - Mobile data product name (default: Darajaplus)

## File Structure

\`\`\`
├── app/
│   ├── admin/
│   │   ├── login/page.tsx          # Admin login page
│   │   └── page.tsx                # Admin dashboard
│   ├── api/
│   │   ├── admin/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── generate-qr-batch/route.ts
│   │   ├── feedback/
│   │   │   └── submit/route.ts
│   │   ├── qr/
│   │   │   └── validate/route.ts
│   │   ├── rewards/
│   │   │   ├── check/route.ts
│   │   │   ├── claim/route.ts
│   │   │   └── process/route.ts
│   │   ├── analytics/route.ts
│   │   ├── campaigns/route.ts
│   │   └── products/route.ts
│   ├── feedback/
│   │   ├── page.tsx                # Feedback form
│   │   ├── success/page.tsx        # Success page
│   │   └── success/loading.tsx
│   ├── qr/[id]/page.tsx            # QR validation redirect
│   ├── rewards/page.tsx            # Rewards claiming page
│   ├── page.tsx                    # Homepage
│   └── layout.tsx
├── lib/
│   ├── auth-utils.ts               # Authentication utilities
│   ├── africas-talking.ts          # Africa's Talking API client
│   ├── db-utils.ts                 # Database operations
│   ├── qr-utils.ts                 # QR utilities
│   ├── supabase.ts                 # Supabase client (browser)
│   └── supabase-server.ts          # Supabase client (server)
├── types/
│   └── database.ts                 # TypeScript types
├── middleware.ts                   # Auth middleware
└── scripts/
    └── 01-create-tables.sql        # Database schema
\`\`\`

## Security Features

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Service role bypass for server operations
- Public read access for QR validation only

### Input Validation
- Phone number format validation (Kenyan numbers)
- Rating constraints (1-5)
- Quantity limits (max 10,000 per batch)
- Required field validation

### Authentication
- Admin credentials required for protected routes
- Session-based auth with HTTP-only cookies
- Automatic redirect for unauthenticated admin access

### Data Protection
- Hashed passwords via authentication layer
- PII stored securely in Supabase
- API key not exposed to client

## Performance Considerations

- Batch QR generation for efficiency
- Analytics caching ready (can be implemented)
- Lazy loading for reward lists
- Indexed queries on frequently filtered fields
- Conversion of crypto module to Web Crypto API for browser compatibility

## Error Handling

All API endpoints include:
- Proper HTTP status codes
- Detailed error messages
- Try-catch error boundaries
- Console logging for debugging
- User-friendly error notifications

## Testing

### Manual Testing Checklist
- [ ] Admin login with correct/incorrect credentials
- [ ] QR code generation and validation
- [ ] Feedback form submission with duplicate prevention
- [ ] Reward creation and claim process
- [ ] Analytics calculations
- [ ] Africa's Talking integration (with mock mode)
- [ ] Mobile responsiveness
- [ ] Phone number validation
