# User Guide - Shopper Reward System

## For Customers

### How to Get Started

1. **Purchase a Product**
   - Look for products with QR codes on their packaging
   - Any RewardHub partner product will have the QR code

2. **Scan the QR Code**
   - Open your phone's camera or any QR code scanner app
   - Point at the QR code on the package
   - Tap the notification that appears

3. **Fill Out the Feedback Form**
   - Enter your full name
   - Enter your Kenyan phone number (format: +254712345678 or 0712345678)
   - Rate the product (1-5 stars)
   - Add any additional comments (optional)

4. **Submit and Receive Reward**
   - Click "Submit Feedback & Claim Reward"
   - You'll see a confirmation page
   - Your reward will be processed immediately
   - Check your phone for the data bundle within 24 hours

### Checking Your Rewards

1. Go to the **Rewards** page
2. Enter your phone number
3. Click "Check Rewards"
4. View all your available rewards
5. Click "Claim Reward" to activate a data bundle

### Phone Number Format

Make sure your phone number is in one of these formats:
- `+254712345678` (with +254 country code)
- `0712345678` (starting with 0)

Both formats will work! Just make sure it's a valid Kenyan number.

### Rewards

When you complete the feedback form, you'll receive:
- **Mobile Data Bundle** - Directly to your phone
- **Instant Processing** - Usually received within 24 hours
- **Amount Varies** - Based on the product you purchased

### Frequently Asked Questions

**Q: When will I receive my reward?**
A: Most rewards are processed within 24 hours. Check your phone for a notification from your mobile provider.

**Q: Can I submit feedback for the same product twice?**
A: No, each QR code can only be used once and your phone number can only submit feedback for each product once.

**Q: What if I don't receive my reward?**
A: Check that:
1. You used the correct phone number
2. Your phone number is in Kenyan format
3. Your phone balance allows receiving data
4. Wait 24 hours for processing

**Q: Can I share my reward?**
A: No, rewards are tied to your phone number and can only be claimed by you.

---

## For Administrators

### Admin Dashboard Access

1. Navigate to `/admin/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `RewardHub2025!` (default)
3. Click "Login"

### Dashboard Overview

The admin dashboard has 4 main sections:

#### 1. Overview Tab
View key metrics at a glance:
- **Total Feedback** - Number of customer submissions
- **Average Rating** - Overall customer satisfaction (out of 5)
- **Rewards Sent** - Number of processed rewards
- **Conversion Rate** - % of QR codes that have been used

#### 2. Analytics Tab
Detailed campaign performance:
- **Total QR Codes Generated** - All QR codes created
- **QR Codes Used** - How many have been scanned
- **Usage Progress** - Visual progress bar

#### 3. QR Codes Tab
Generate new QR code batches:

**Steps:**
1. Enter the Product SKU ID (must already exist in system)
2. Set the Quantity (1-10,000 codes per batch)
3. Set the Batch Number (for organization)
4. Click "Generate QR Codes"
5. View the generated codes and their URLs
6. Download as CSV for distribution

**Example:**
- SKU ID: `123e4567-e89b-12d3-a456-426614174000`
- Quantity: `100`
- Batch: `1`

#### 4. Rewards Tab
Manage reward distribution:
- View reward status (pending, processing, sent, failed, claimed)
- Process pending rewards
- Monitor data bundle distribution

### Creating QR Code Batches

1. Get the Product SKU ID from your inventory system
2. Go to QR Codes tab
3. Fill in:
   - **Product SKU ID**: The unique identifier for your product variant
   - **Quantity**: How many codes to generate (max 10,000)
   - **Batch Number**: Sequence number (auto-increments)
4. Click "Generate QR Codes"
5. Download the CSV with all URLs
6. Print QR codes and apply to product packaging

### Managing Campaigns

To create or manage campaigns:

1. Contact your system administrator
2. Campaigns are created via API or database
3. Each campaign can have:
   - Name and description
   - Start and end dates
   - Target number of responses
   - Associated QR codes

### Analytics Reports

**Key Metrics:**
- **Feedback Count** - Total customer submissions
- **Average Rating** - Sentiment indicator (1-5)
- **Conversion Rate** - Success rate of marketing
- **QR Code Usage** - Distribution and redemption tracking

### Best Practices

1. **QR Code Distribution**
   - Generate batches aligned with product runs
   - Track batch numbers for accountability
   - Use meaningful batch numbers for organization

2. **Campaign Management**
   - Set realistic response targets
   - Monitor analytics weekly
   - Adjust products based on ratings

3. **Reward Processing**
   - Monitor pending rewards regularly
   - Ensure rewards are processed within 24 hours
   - Check failure logs if issues occur

4. **Data Security**
   - Use strong, unique passwords
   - Log out after each session
   - Don't share admin credentials

### Troubleshooting

**Problem: QR codes not generating**
- Check that SKU ID is valid
- Verify quantity doesn't exceed 10,000
- Check system logs for errors

**Problem: Rewards not being processed**
- Verify Africa's Talking API key is configured
- Check customer phone number format
- Monitor system logs for failures

**Problem: Can't log in**
- Check username and password
- Verify caps lock is off
- Clear browser cookies if needed

### Account Management

- **Change Password**: Contact system administrator
- **Session Timeout**: Sessions last 7 days
- **Multiple Logins**: One admin at a time
- **Reset Credentials**: Contact support
