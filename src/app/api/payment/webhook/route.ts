import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { setUserSubscription } from '@/lib/firestore-subscriptions';
import { getPricingConfigById } from '@/lib/firestore-pricing';
import type { Subscription } from '@/lib/types';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const webhookSignature = request.headers.get('x-razorpay-signature');

    if (!webhookSignature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const text = JSON.stringify(body);
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== webhookSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = body.event;
    const payment = body.payload.payment?.entity;
    const order = body.payload.order?.entity;

    // Handle payment success events
    if (event === 'payment.captured' || event === 'payment.authorized') {
      if (payment && order) {
        const userId = order.notes?.userId;
        const planId = order.notes?.planId;

        if (!userId || !planId) {
          console.error('Missing userId or planId in order notes');
          return NextResponse.json({ received: true });
        }

        // Get plan details
        const plan = await getPricingConfigById(planId);
        if (!plan) {
          console.error('Invalid plan ID:', planId);
          return NextResponse.json({ received: true });
        }

        // Calculate subscription end date
        const now = Date.now();
        let currentPeriodEnd: number;
        
        if (plan.interval === 'monthly') {
          currentPeriodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days
        } else {
          currentPeriodEnd = now + (365 * 24 * 60 * 60 * 1000); // 365 days
        }

        // Update user subscription
        const subscription: Subscription = {
          userId: userId,
          status: 'pro',
          plan: plan.id === 'pro' ? 'pro_tier' : plan.id,
          subscriptionId: payment.id,
          current_period_end: currentPeriodEnd,
        };

        await setUserSubscription(userId, subscription);
      }
    }

    // Handle payment failure events
    if (event === 'payment.failed') {
      console.log('Payment failed:', payment?.id);
      // You can add logic here to notify the user or update records
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

