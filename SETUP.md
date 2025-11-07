# RewardHub - Shopper Reward System Setup Guide

## Overview

This is a complete customer feedback reward system that:
- Generates unique QR codes for product packages
- Customers scan QR codes and fill out feedback forms
- System validates submissions and prevents duplicates
- Rewards are processed and tracked
- Comprehensive analytics dashboard

## System Flow

1. **Customer Purchases Product** → Physical package has QR code
2. **Scans QR Code** → Opens `/qr/[id]` page
3. **Fills Feedback Form** → `/feedback?qr=id` page with product pre-filled
4. **Submits Feedback** → System verifies data (no duplicates, valid phone)
5. **Receives Reward** → Reward created and marked for processing
6. **Admin Tracks** → View analytics and manage campaigns

## Environment Setup

### Required Environment Variables

Add these to your project (.env):

\`\`\`
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For development, use your deployed URL in production

# Optional Admin Security
ADMIN_SECRET_KEY=your_secure_admin_token
\`\`\`

### Database Setup

1. **Create Database Tables**
   - Run the SQL script at `/scripts/01-create-tables.sql` in your Supabase SQL editor
   - This creates all required tables with proper indexes and RLS policies

2. **Initialize Sample Data**
   - Make a POST request to `/api/admin/init-db` with your admin token
   - This creates a sample campaign, product, and SKU for testing

## API Endpoints

### QR Code Validation
- **GET** `/api/qr/validate?id=<qr_id>`
- Validates QR code and returns product information
- Response includes product details and reward information

### Feedback Submission
- **POST** `/api/feedback/submit`
- Body: `{ qrId, customerName, customerPhone, rating, comment }`
- Validates phone number, checks for duplicates, creates reward
- Returns feedback and reward IDs

### Analytics
- **GET** `/api/analytics?campaignId=<optional>`
- Returns metrics: feedback count, average rating, rewards sent, conversion rate
- Optional campaign filter

### QR Code Generation (Admin)
- **POST** `/api/admin/generate-qr-batch`
- Body: `{ skuId, quantity, batchNumber }`
- Generates and returns QR codes
- Max 10,000 per request

## Pages

### Public Pages
- `/` - Homepage with how-it-works
- `/qr/[id]` - QR code validation and redirect
- `/feedback?qr=id` - Feedback form (pre-filled with product)
- `/feedback/success` - Success page with reward details
- `/analytics` - Public analytics dashboard

### Admin Pages
- `/admin` - QR code generation interface
- `/admin/init-db` - Database initialization (API only)

## Data Validation

### Phone Number Validation
- Format: Kenyan numbers only
- Accepts: +254712345678 or 0712345678
- Validates using regex: `/^(?:\+254|0)[17]\d{8,10}$/`

### Duplicate Prevention
- Checks if customer phone + QR ID combination exists
- Prevents multiple submissions for same product per customer
- Prevents multiple rewards for same QR code

### QR Code Status
- Marks as `is_used: true` after successful feedback submission
- Stores phone number and timestamp of use
- Prevents reuse of same QR code

## Database Schema

### Tables
- **products** - Product catalog
- **product_skus** - Product variants with reward amounts
- **campaigns** - Marketing campaigns
- **qr_codes** - QR code tracking and usage
- **feedback** - Customer feedback submissions
- **rewards** - Reward records and processing status

### Key Fields
- `qr_codes.is_used` - Tracks QR code usage
- `feedback.verified` - Marks valid submissions
- `rewards.status` - pending, sent, failed, claimed
- `products.*` - SKU linked to rewards

## Error Handling

### Common Issues

1. **"Failed to load json from blob"**
   - Ensure NEXT_PUBLIC_APP_URL is set correctly
   - Check Supabase environment variables

2. **"QR code not found"**
   - Verify QR code exists in database
   - Check qr_codes table for correct ID

3. **"Invalid phone number format"**
   - Use +254 or 0 prefix
   - Ensure 10-13 digits total

4. **"Already submitted feedback"**
   - Duplicate check prevents multiple submissions
   - Same phone number + QR code = duplicate

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm build

# Start production server
npm start
\`\`\`

## Deployment

1. Connect repository to Vercel
2. Add environment variables
3. Run database schema creation in Supabase
4. Initialize sample data via `/api/admin/init-db`
5. Deploy and test with sample QR codes

## Security Notes

- RLS (Row Level Security) enabled on sensitive tables
- Service role key used only for server operations
- Phone numbers are PII - consider adding encryption
- Add rate limiting to prevent abuse
- Validate all user inputs server-side

## Future Enhancements

- SMS notification for rewards
- Email confirmations for feedback
- Multi-language support
- Mobile app integration
- Advanced fraud detection
- Batch reward processing
- Third-party reward integration (M-Pesa, Airtime)
