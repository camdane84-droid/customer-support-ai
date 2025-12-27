# Stripe Integration Setup Guide

## Phase 2 Complete! 🎉

Your usage tracking and Stripe integration is now fully implemented. Follow these steps to complete the setup.

---

## Step 1: Create Stripe Account & Get API Keys

1. **Sign up for Stripe** (if you haven't already): https://dashboard.stripe.com/register
2. **Get your API keys**:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable key** (starts with `pk_test_...`)
   - Copy your **Secret key** (starts with `sk_test_...`)

---

## Step 2: Create Products & Prices in Stripe

1. Go to: https://dashboard.stripe.com/test/products
2. **Create Starter Plan**:
   - Click "Add Product"
   - Name: "Starter Plan"
   - Description: "500 AI suggestions/day, 500 conversations/month"
   - Pricing: $29/month (Recurring)
   - Save and **copy the Price ID** (starts with `price_...`)

3. **Create Pro Plan**:
   - Click "Add Product"
   - Name: "Pro Plan"
   - Description: "Unlimited AI suggestions and conversations"
   - Pricing: $79/month (Recurring)
   - Save and **copy the Price ID** (starts with `price_...`)

---

## Step 3: Set Up Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
   - For local testing: Use ngrok or similar to expose localhost
   - Example: `https://abc123.ngrok.io/api/stripe/webhook`
4. **Select events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy the Signing Secret** (starts with `whsec_...`)

---

## Step 4: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # Your secret key from Step 1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your publishable key from Step 1

# Stripe Price IDs (from Step 2)
STRIPE_STARTER_PRICE_ID=price_... # Starter plan price ID
STRIPE_PRO_PRICE_ID=price_... # Pro plan price ID

# Stripe Webhook Secret (from Step 3)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Change to your production URL when deploying
```

---

## Step 5: Test the Integration

### Test 1: View Usage Display
1. Start your dev server: `npm run dev`
2. Log into your dashboard
3. **Check**: You should see usage stats in the top bar (compact view)

### Test 2: Hit AI Limit
1. In your database, manually set your business's `ai_suggestions_used_today` to 20
2. Try to generate an AI suggestion
3. **Expected**: Upgrade prompt modal should appear

### Test 3: Checkout Flow (Test Mode)
1. Go to `/pricing`
2. Click "Upgrade to Starter"
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. **Expected**: Redirected to settings page with success message
5. **Check**: Your subscription_tier should be updated to 'starter' in database

### Test 4: Billing Portal
1. After subscribing (Test 3), go to Settings
2. Click "Manage Billing"
3. **Expected**: Redirected to Stripe billing portal
4. **Check**: Can view subscription, update payment method, cancel

### Test 5: Webhook Testing
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. **Expected**: Your server logs should show webhook received

---

## Step 6: Test Stripe Integration Locally

If testing locally, you'll need to expose your localhost:

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows (via Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Login to Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will give you a webhook secret starting with whsec_
# Add it to your .env.local as STRIPE_WEBHOOK_SECRET
```

---

## File Structure Overview

Here's what was created:

### Backend (API Routes)
- `app/api/stripe/checkout/route.ts` - Create checkout sessions
- `app/api/stripe/webhook/route.ts` - Handle Stripe events
- `app/api/stripe/portal/route.ts` - Customer billing portal
- `app/api/usage/route.ts` - Get usage status

### Frontend (Pages & Components)
- `app/pricing/page.tsx` - Pricing page with checkout
- `components/ui/UsageDisplay.tsx` - Usage stats component
- `components/ui/UpgradePrompt.tsx` - Limit reached modal
- `components/ui/BillingSection.tsx` - Billing management
- `components/inbox/AISuggestion.tsx` - **Updated** with upgrade prompt

### Library Code
- `lib/stripe/config.ts` - Stripe configuration
- `lib/usage/tracker.ts` - Usage tracking utilities

### Database
- Added columns to `businesses` table:
  - `subscription_tier` (free/starter/pro)
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `ai_suggestions_used_today`
  - `ai_suggestions_reset_at`
  - `conversations_used_this_month`
  - `conversations_reset_at`

---

## Going Live (Production Checklist)

Before deploying to production:

1. **Switch to Live Mode**:
   - Get **live** API keys from Stripe (start with `pk_live_` and `sk_live_`)
   - Create products and prices in **live mode**
   - Set up webhook in **live mode**
   - Update all environment variables with live keys

2. **Update APP_URL**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Enable Stripe Billing Portal**:
   - Go to: https://dashboard.stripe.com/settings/billing/portal
   - Customize your portal settings
   - Enable the features you want customers to access

4. **Tax Settings** (if applicable):
   - Set up Stripe Tax: https://dashboard.stripe.com/settings/tax
   - Configure tax collection rules

5. **Email Notifications**:
   - Stripe will send payment confirmation emails automatically
   - Customize email templates: https://dashboard.stripe.com/settings/emails

---

## Troubleshooting

### Webhook not receiving events?
- Check your webhook URL is correct
- Verify webhook secret in `.env.local`
- Check server logs for errors
- Use Stripe CLI for local testing

### Checkout not working?
- Verify price IDs are correct
- Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
- Open browser console for errors

### Subscription not updating in database?
- Check webhook is firing (Stripe dashboard → Webhooks → Events)
- Verify webhook handler doesn't have errors
- Check database logs

### Usage limits not working?
- Verify database migration was run
- Check `getUsageStatus()` is being called
- Inspect browser network tab for API errors

---

## Support

Need help? Check these resources:
- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli

---

## What's Next?

✅ Phase 1: Usage tracking & credit system - **COMPLETE**
✅ Phase 2: Stripe integration - **COMPLETE**

**Phase 3: Onboarding Tutorial (Optional)**
- Install Driver.js
- Create interactive walkthrough
- Guide users through first actions

Ready to test? Follow Step 5 above!
