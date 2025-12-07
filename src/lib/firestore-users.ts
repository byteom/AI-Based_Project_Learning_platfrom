import { db } from "./firebase";
import { doc, getDoc, setDoc, getDocs, collection, updateDoc } from "firebase/firestore";
import type { UserProfile } from "./types";
import type { User } from "firebase/auth";

const USERS_COLLECTION = "users";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { ...docSnap.data(), uid: docSnap.id } as UserProfile;
  } else {
    return null;
  }
}

export async function createUserProfile(user: User): Promise<UserProfile> {
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    roles: ['user'], // Default role
    status: 'active', // Default status
    createdAt: Date.now(),
  };
  await setDoc(doc(db, USERS_COLLECTION, user.uid), userProfile);
  
  // Automatically create a 30-day free trial subscription
  const { setUserSubscription } = await import('./firestore-subscriptions');
  const now = Date.now();
  const trialEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
  
  await setUserSubscription(user.uid, {
    userId: user.uid,
    status: 'trial',
    plan: 'pro_tier',
    trial_start: now,
    trial_end: trialEnd,
  });
  
  return userProfile;
}

export async function getAllUsers(): Promise<UserProfile[]> {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, data);
}

/**
 * Promote a user to admin role or create admin profile
 * This function updates the user's roles to include 'admin'
 */
export async function promoteToAdmin(userId: string): Promise<UserProfile> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentProfile = userDoc.data() as UserProfile;
    const updatedRoles = currentProfile.roles?.includes('admin') 
        ? currentProfile.roles 
        : [...(currentProfile.roles || ['user']), 'admin'];
    
    const updatedProfile: Partial<UserProfile> = {
        roles: updatedRoles as ('user' | 'admin')[],
    };
    
    await updateDoc(userRef, updatedProfile);
    
    return { ...currentProfile, ...updatedProfile } as UserProfile;
}

/**
 * Seed admin user - creates or updates a user profile with admin role
 * Note: This only creates/updates the Firestore profile. 
 * For creating the Firebase Auth user, use the seed-admin script.
 */
export async function seedAdminProfile(email: string, uid: string): Promise<UserProfile> {
    const userProfile: UserProfile = {
        uid,
        email,
        roles: ['user', 'admin'],
        status: 'active',
        createdAt: Date.now(),
    };
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
        // Update existing user to admin
        await updateDoc(userRef, {
            roles: ['user', 'admin'],
            email, // Update email in case it changed
        });
        return { ...userDoc.data(), ...userProfile } as UserProfile;
    } else {
        // Create new admin profile
        await setDoc(userRef, userProfile);
        return userProfile;
    }
}