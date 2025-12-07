import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs';

let adminApp: App | null = null;

export function initializeFirebaseAdmin(): App | null {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Option 1: Use service account JSON file from FIREBASE_SERVICE_ACCOUNT_PATH
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
        return adminApp;
      }
    }

    // Option 2: Try to load serviceAccountKey.json from project root
    const defaultServiceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(defaultServiceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(defaultServiceAccountPath, 'utf8'));
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      return adminApp;
    }

    // Option 3: Use service account credentials from environment variables
    if (projectId && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      adminApp = initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      return adminApp;
    }

    // Option 4: Use service account key from FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        if (serviceAccount.project_id) {
          adminApp = initializeApp({
            credential: cert(serviceAccount),
          });
          return adminApp;
        }
      } catch (e) {
        // Invalid JSON, continue to next option
      }
    }

    // Option 5: Use application default credentials with project ID
    if (projectId) {
      adminApp = initializeApp({
        projectId: projectId,
      });
      return adminApp;
    }

    // Option 6: Try application default credentials
    try {
      adminApp = initializeApp();
      return adminApp;
    } catch (e) {
      console.warn('Firebase Admin initialization failed. Some features may not work.');
      return null;
    }
  } catch (error: any) {
    console.warn('Firebase Admin initialization error:', error.message);
    return null;
  }
}

export function getFirebaseAdminAuth() {
  const app = initializeFirebaseAdmin();
  if (!app) {
    throw new Error('Firebase Admin not initialized');
  }
  return getAuth(app);
}

