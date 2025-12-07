# Razorpay Payment Integration Setup Guide

This guide will help you set up Razorpay payment integration for the Project Code platform.

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com/)
2. Firebase Admin SDK configured (for server-side operations)

## Step 1: Get Razorpay API Keys

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** > **API Keys**
3. Generate a new API key pair (or use existing ones)
4. You'll get:
   - **Key ID** (starts with `rzp_`)
   - **Key Secret** (keep this secure!)

## Step 2: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Razorpay Webhook Secret (optional but recommended)
# Get this from Razorpay Dashboard > Settings > Webhooks
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important Notes:**
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are used server-side only
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is exposed to the client (required for Razorpay checkout)
- Never expose `RAZORPAY_KEY_SECRET` in client-side code

## Step 3: Set Up Webhook (Optional but Recommended)

Webhooks allow Razorpay to notify your server about payment events automatically.

1. Go to **Razorpay Dashboard** > **Settings** > **Webhooks**
2. Click **Add New Webhook**
3. Set the webhook URL to: `https://yourdomain.com/api/payment/webhook`
4. Select the following events:
   - `payment.captured`
   - `payment.authorized`
   - `payment.failed`
5. Copy the webhook secret and add it to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

## Step 4: Test the Integration

### Test Mode

1. Use Razorpay test keys (available in Dashboard > Settings > API Keys > Test Mode)
2. Use test card numbers:
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

### Production Mode

1. Switch to live mode in Razorpay Dashboard
2. Use your live API keys
3. Real payments will be processed

## Payment Flow

1. **User clicks "Upgrade to Pro"** on the pricing page
2. **Frontend** calls `/api/payment/create-order` to create a Razorpay order
3. **Razorpay checkout** opens with payment options
4. **User completes payment** in Razorpay checkout
5. **Frontend** calls `/api/payment/verify` to verify payment signature
6. **Backend** verifies payment with Razorpay and updates user subscription
7. **User is redirected** to `/payment/success` page

## API Routes

### POST `/api/payment/create-order`

Creates a Razorpay order for payment.

**Request:**
```json
{
  "planId": "pro",
  "amount": 199,
  "currency": "INR"
}
```

**Response:**
```json
{
  "orderId": "order_xxx",
  "amount": 19900,
  "currency": "INR",
  "key": "rzp_xxx"
}
```

### POST `/api/payment/verify`

Verifies payment signature and activates subscription.

**Request:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "planId": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and subscription activated",
  "subscription": { ... }
}
```

### POST `/api/payment/webhook`

Handles Razorpay webhook events (payment.captured, payment.failed, etc.)

## Troubleshooting

### Payment Not Processing

1. Check that all environment variables are set correctly
2. Verify Razorpay keys are valid (test vs live mode)
3. Check browser console for errors
4. Verify Firebase Admin is properly initialized

### Subscription Not Activating

1. Check server logs for errors
2. Verify payment verification endpoint is working
3. Check Firestore subscriptions collection for updates
4. Ensure user is authenticated

### Webhook Not Working

1. Verify webhook URL is accessible from internet
2. Check webhook secret matches in Razorpay dashboard
3. Review webhook logs in Razorpay dashboard
4. Check server logs for webhook processing errors

## Security Best Practices

1. **Never expose** `RAZORPAY_KEY_SECRET` in client-side code
2. **Always verify** payment signatures on the server
3. **Use HTTPS** in production
4. **Validate** all payment data before processing
5. **Log** all payment events for audit purposes
6. **Handle** payment failures gracefully

## Support

For Razorpay-specific issues, refer to:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

For application-specific issues, check the application logs and error messages.

