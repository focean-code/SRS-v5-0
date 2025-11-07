# Domain Configuration Guide

## Setting Your Custom Domain for QR Codes

The Shopper Reward System generates QR codes with URLs that point to your application. By default, these URLs use the `NEXT_PUBLIC_APP_URL` environment variable.

### Current Issue
QR codes are currently being generated with `http://localhost:3000` URLs instead of your custom domain `mobiwavesrs.co.ke`.

### Solution

#### Step 1: Set the Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add or update the following variable:

   \`\`\`
   NEXT_PUBLIC_APP_URL = https://mobiwavesrs.co.ke
   \`\`\`

   **Important**: Use `https://` (not `http://`) for production

#### Step 2: Redeploy Your Application

After setting the environment variable, you need to redeploy:

1. Go to your Vercel project dashboard
2. Click **Deployments**
3. Click the three dots menu on the latest deployment
4. Select **Redeploy**

Alternatively, push a new commit to your GitHub repository to trigger an automatic deployment.

#### Step 3: Generate New QR Codes

After redeployment, generate new QR code batches:

1. Login to your admin dashboard: `https://mobiwavesrs.co.ke/admin/login`
2. Go to **QR Codes** tab
3. Generate a new batch of QR codes

These new QR codes will now contain URLs like:
\`\`\`
https://mobiwavesrs.co.ke/qr/[unique-id]
\`\`\`

### Verifying the Configuration

You can verify the QR code URLs are correct by:

1. Generating a test QR code batch
2. Downloading the QR codes
3. Checking the "URL" column in the downloaded HTML file
4. It should show `https://mobiwavesrs.co.ke/qr/[id]` instead of `http://localhost:3000/qr/[id]`

### Development vs Production

- **Development**: Keep `http://localhost:3000`
- **Production**: Use `https://mobiwavesrs.co.ke` (or your actual domain)

You can create separate environment variables for different environments if needed:
- `NEXT_PUBLIC_APP_URL_DEV` for development
- `NEXT_PUBLIC_APP_URL_PROD` for production

Then update the code to use the appropriate one based on `process.env.NODE_ENV`.

### Troubleshooting

**Problem**: QR codes still show localhost after redeployment
- **Solution**: Clear your browser cache or open in incognito mode
- Verify the environment variable is set in Vercel dashboard
- Check that the redeployment completed successfully

**Problem**: QR codes not scanning
- **Solution**: Ensure your domain is publicly accessible and HTTPS is working
- Test: `https://mobiwavesrs.co.ke` should load your application

**Problem**: Can't access admin dashboard with new domain
- **Solution**: Update any bookmarks or links to use the new domain
- Clear browser cookies if login issues persist
