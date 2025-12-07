
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getUserSubscription } from '../lib/firestore-subscriptions';
import type { Subscription } from '../lib/types';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      setIsTrialActive(false);
      setTrialDaysRemaining(null);
      return;
    }

    const fetchSubscription = async () => {
      setIsLoading(true);
      try {
        const sub = await getUserSubscription(user.uid);
        setSubscription(sub);
        
        // Check if trial is active
        if (sub.status === 'trial' && sub.trial_end) {
          const now = Date.now();
          if (now < sub.trial_end) {
            setIsTrialActive(true);
            const daysRemaining = Math.ceil((sub.trial_end - now) / (24 * 60 * 60 * 1000));
            setTrialDaysRemaining(daysRemaining);
          } else {
            setIsTrialActive(false);
            setTrialDaysRemaining(null);
          }
        } else {
          setIsTrialActive(false);
          setTrialDaysRemaining(null);
        }
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
        setSubscription(null);
        setIsTrialActive(false);
        setTrialDaysRemaining(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
    
    // Refresh subscription status every minute to check for trial expiration
    const interval = setInterval(fetchSubscription, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Helper to check if user has Pro access (either Pro status or active trial)
  const hasProAccess = subscription?.status === 'pro' || isTrialActive;

  return { 
    subscription, 
    isLoading, 
    isTrialActive, 
    trialDaysRemaining,
    hasProAccess 
  };
}
