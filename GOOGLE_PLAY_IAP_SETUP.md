# In-App Purchase Setup Guide for Google Play Console

## Overview
This guide will walk you through setting up In-App Purchases (IAP) for your Government Billing Solution app on Google Play Console.

## Prerequisites
- Google Play Console account
- Your app published (at least in internal testing)
- Billing enabled for your Google Play Console account

## Step 1: Prepare Your App for IAP

### 1.1 Update App Information
1. Go to **Google Play Console** → Your App → **App information**
2. Ensure your app has:
   - Privacy Policy URL
   - App category set correctly
   - Target audience defined

### 1.2 Upload App Bundle
1. Build your app: `npm run build && npx cap sync && npx cap build android`
2. Navigate to **Release** → **Testing** → **Internal testing**
3. Create a new release and upload your `.aab` file from `android/app/build/outputs/bundle/release/`

## Step 2: Set Up In-App Products

### 2.1 Navigate to In-App Products
1. Go to **Monetize** → **Products** → **In-app products**
2. Click **Create product**

### 2.2 Create Premium Monthly Subscription
1. **Product ID**: `premium_monthly`
2. **Name**: Premium Monthly Subscription
3. **Description**: Access all premium features including unlimited exports and advanced templates for 30 days
4. **Status**: Active
5. **Product type**: Subscription
6. **Subscription period**: 1 month
7. **Price**: Set your desired price (e.g., $4.99)
8. **Free trial**: Optional (e.g., 7 days)
9. **Grace period**: 3 days (recommended)

### 2.3 Create Premium Yearly Subscription
1. **Product ID**: `premium_yearly`
2. **Name**: Premium Yearly Subscription
3. **Description**: Access all premium features including unlimited exports and advanced templates for 365 days. Best value - save 60%!
4. **Status**: Active
5. **Product type**: Subscription
6. **Subscription period**: 1 year
7. **Price**: Set your desired price (e.g., $49.99)
8. **Free trial**: Optional (e.g., 7 days)
9. **Grace period**: 3 days (recommended)

### 2.4 Create Unlimited Exports Product
1. **Product ID**: `unlimited_exports`
2. **Name**: Unlimited Exports
3. **Description**: Remove export limits and export unlimited invoices, PDFs, and Excel files
4. **Status**: Active
5. **Product type**: One-time product
6. **Price**: Set your desired price (e.g., $9.99)

### 2.5 Create Advanced Templates Product
1. **Product ID**: `advanced_templates`
2. **Name**: Advanced Templates
3. **Description**: Access professional invoice templates and advanced customization options
4. **Status**: Active
5. **Product type**: One-time product
6. **Price**: Set your desired price (e.g., $7.99)

## Step 3: Configure License Testing

### 3.1 Add Test Accounts
1. Go to **Setup** → **License testing**
2. Add email addresses of testers who can make test purchases
3. Set **License response** to "RESPOND_NORMALLY"

### 3.2 Test Account Configuration
1. Go to **Setup** → **Account details** → **License testing**
2. Add the Gmail accounts that will be used for testing
3. These accounts can make test purchases without being charged

## Step 4: App Signing & Licensing

### 4.1 App Signing
1. Go to **Release** → **Setup** → **App signing**
2. Let Google manage your app signing key (recommended)
3. Download the upload certificate if needed

### 4.2 API Access
1. Go to **Setup** → **API access**
2. Link your project to Google Cloud Platform
3. Create a service account if needed for server-side verification

## Step 5: Content Rating & Data Safety

### 5.1 Content Rating
1. Go to **Policy** → **App content** → **Content rating**
2. Complete the questionnaire
3. Since your app has in-app purchases, make sure to declare this

### 5.2 Data Safety
1. Go to **Policy** → **App content** → **Data safety**
2. Declare what data your app collects
3. For IAP, you typically collect:
   - Purchase history
   - Payment information (handled by Google)

## Step 6: Testing Your IAP Implementation

### 6.1 Internal Testing
1. Upload your app to **Internal testing**
2. Add testers using their Gmail addresses
3. Testers can download and test IAP functionality

### 6.2 Test Purchases
1. Use test accounts to make purchases
2. Verify that purchase states are saved correctly
3. Test restore purchases functionality
4. Test subscription renewal and cancellation

## Step 7: Production Deployment

### 7.1 Pre-launch Checklist
- [ ] All IAP products are active
- [ ] App has been tested with real test accounts
- [ ] Privacy policy includes IAP terms
- [ ] Content rating completed
- [ ] Data safety declaration completed

### 7.2 Release to Production
1. Go to **Release** → **Production**
2. Create a new release
3. Upload your signed app bundle
4. Complete the release notes
5. Submit for review

## Product IDs Summary
Your app is configured with these product IDs:

| Product ID | Type | Description |
|------------|------|-------------|
| `premium_monthly` | Subscription | Monthly premium access |
| `premium_yearly` | Subscription | Yearly premium access |
| `unlimited_exports` | One-time | Unlimited export feature |
| `advanced_templates` | One-time | Advanced template access |

## Testing Commands

### Build and Test
```bash
# Build the app
npm run build

# Sync with Capacitor
npx cap sync

# Build Android
npx cap build android

# Run on device for testing
npx cap run android
```

### Debug IAP (in browser during development)
The app includes test mode functionality. You can test purchases without the actual store by:
1. Opening browser dev tools
2. Going to Application → Local Storage
3. Setting test purchases manually

## Troubleshooting

### Common Issues
1. **Products not loading**: Ensure app is published (at least in testing)
2. **Test purchases not working**: Check test account setup
3. **"Item not found" error**: Verify product IDs match exactly
4. **Signature mismatch**: Ensure app is signed with upload certificate

### Debug Mode
The app includes comprehensive logging. Check browser console or Android logs:
```bash
# View Android logs
npx cap run android --livereload
```

## Support and Documentation
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [In-app Billing Overview](https://developer.android.com/google/play/billing)
- [Cordova Purchase Plugin Docs](https://github.com/j3k0/cordova-plugin-purchase)

## Security Notes
- Never store sensitive purchase data in local storage only
- Always verify purchases server-side for production apps
- Implement proper receipt validation
- Use Google Play's server-to-server notifications for real-time updates

---

**Important**: This implementation includes test mode for development. For production, ensure proper server-side validation of purchases is implemented.
