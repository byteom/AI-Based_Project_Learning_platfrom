
'use server';

import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { Subscription } from "./types";

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const ref = doc(db, "subscriptions", userId);
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    const subscription = snap.data() as Subscription;
    
    // Check if trial has expired
    if (subscription.status === 'trial' && subscription.trial_end) {
      const now = Date.now();
      if (now > subscription.trial_end) {
        // Trial expired, downgrade to free
        const expiredSubscription: Subscription = {
          ...subscription,
          status: 'free',
          plan: 'free_tier',
        };
        await setUserSubscription(userId, expiredSubscription);
        return expiredSubscription;
      }
    }
    
    return subscription;
  }
  
  // If no subscription document exists, create a 30-day free trial
  const now = Date.now();
  const trialEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
  
  const trialSubscription: Subscription = {
      userId,
      status: 'trial',
      plan: 'pro_tier',
      trial_start: now,
      trial_end: trialEnd,
  };
  
  // Save the trial subscription for the user
  await setUserSubscription(userId, trialSubscription);
  return trialSubscription;
}

export async function setUserSubscription(userId: string, data: Subscription) {
  await setDoc(doc(db, "subscriptions", userId), data, { merge: true });
}

export async function updateUserSubscription(userId: string, data: Partial<Subscription>) {
    const subRef = doc(db, "subscriptions", userId);
    // Use setDoc with merge to create the doc if it doesn't exist, or update it if it does.
    await setDoc(subRef, data, { merge: true });
}
