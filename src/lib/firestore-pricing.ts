import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";

export interface PricingConfig {
  id: string;
  planName: string;
  price: number;
  currency: string; // 'USD', 'INR', etc.
  interval: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

const PRICING_COLLECTION = 'pricing';

// Default pricing configuration
const DEFAULT_PRICING: PricingConfig[] = [
  {
    id: 'free',
    planName: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    features: [
      "AI-Powered Tutorial Generation",
      "3 Projects",
      "3 Learning Paths",
      "Community Support",
      "5 interview questions per day",
    ],
    isActive: true,
  },
  {
    id: 'pro',
    planName: 'Pro',
    price: 199,
    currency: 'INR',
    interval: 'monthly',
    features: [
      "AI-Powered Tutorial Generation",
      "Unlimited Projects",
      "Unlimited Learning Paths",
      "Personalized Assistance",
      "Priority Support",
      "Unlimited interview questions",
      "Unlimited AI-Powered Tutorials",
    ],
    isActive: true,
  },
];

export async function getPricingConfig(): Promise<PricingConfig[]> {
  const pricingRef = collection(db, PRICING_COLLECTION);
  const snapshot = await getDocs(pricingRef);
  
  if (snapshot.empty) {
    // Initialize with default pricing if collection is empty
    await initializeDefaultPricing();
    return DEFAULT_PRICING;
  }
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingConfig));
}

export async function getPricingConfigById(id: string): Promise<PricingConfig | null> {
  const docRef = doc(db, PRICING_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PricingConfig;
  }
  return null;
}

export async function updatePricingConfig(id: string, data: Partial<PricingConfig>): Promise<void> {
  const docRef = doc(db, PRICING_COLLECTION, id);
  await setDoc(docRef, {
    ...data,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function createPricingConfig(data: Omit<PricingConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(collection(db, PRICING_COLLECTION));
  await setDoc(docRef, {
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
}

async function initializeDefaultPricing(): Promise<void> {
  const batch = writeBatch(db);
  for (const pricing of DEFAULT_PRICING) {
    const docRef = doc(db, PRICING_COLLECTION, pricing.id);
    batch.set(docRef, {
      ...pricing,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  await batch.commit();
}

