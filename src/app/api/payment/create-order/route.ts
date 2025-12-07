import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
import { getPricingConfigById } from '@/lib/firestore-pricing';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId } = body;

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

    // Get plan from Firestore - this ensures we use the latest pricing
    const plan = await getPricingConfigById(planId);
    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Use plan price and currency from Firestore
    const amount = plan.price;
    const currency = plan.currency;

    // Create Razorpay order
    // Receipt must be max 40 characters - use short format
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `${userId.slice(0, 20)}_${timestamp}`; // Max 29 chars (20 + 1 + 8)
    
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
      currency: currency,
      receipt: receipt,
      notes: {
        userId: userId,
        planId: planId,
        planName: plan.planName,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

