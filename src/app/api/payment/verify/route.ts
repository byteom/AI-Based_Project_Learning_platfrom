import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = body;

    // Get the authorization token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    let userId: string;
    try {
      const auth = getFirebaseAdminAuth();
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Verify payment with Razorpay
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return NextResponse.json(
          { error: 'Payment not successful' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error verifying payment with Razorpay:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      );
    }

    // Get plan details
    const plan = await getPricingConfigById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
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
      subscriptionId: razorpay_payment_id,
      current_period_end: currentPeriodEnd,
    };

    await setUserSubscription(userId, subscription);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: subscription,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

