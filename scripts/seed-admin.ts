import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config(); // Also load from .env

// Get project ID from environment (supports both FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_PROJECT_ID)
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Helper function to load service account from file
function loadServiceAccountFromFile(filePath: string): admin.ServiceAccount {
  const resolvedPath = path.isAbsolute(filePath) 
    ? filePath 
    : path.resolve(__dirname, '..', filePath);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account file not found: ${resolvedPath}`);
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  return serviceAccount;
}

// Initialize Firebase Admin SDK
// You can use either service account or application default credentials
if (!admin.apps.length) {
  try {
    // Option 1: Use service account JSON file from FIREBASE_SERVICE_ACCOUNT_PATH
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = loadServiceAccountFromFile(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Initialized Firebase Admin with service account from file');
    }
    // Option 2: Try to load serviceAccountKey.json from project root
    else {
      const defaultServiceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
      if (fs.existsSync(defaultServiceAccountPath)) {
        const serviceAccount = loadServiceAccountFromFile(defaultServiceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Initialized Firebase Admin with serviceAccountKey.json');
      }
      // Option 3: Use service account credentials from environment variables
      else if (projectId && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        console.log('✅ Initialized Firebase Admin with service account credentials from environment variables');
      }
      // Option 4: Use service account key file via GOOGLE_APPLICATION_CREDENTIALS
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const initOptions: admin.AppOptions = {
          credential: admin.credential.applicationDefault(),
        };
        if (projectId) {
          initOptions.projectId = projectId;
        }
        admin.initializeApp(initOptions);
        console.log('✅ Initialized Firebase Admin with service account from GOOGLE_APPLICATION_CREDENTIALS');
      }
      // Option 5: Use application default credentials with project ID from env
      else if (projectId) {
        admin.initializeApp({
          projectId: projectId,
        });
        console.log('✅ Initialized Firebase Admin with application default credentials (project ID from env)');
      }
      // Option 6: Try application default credentials without explicit project ID
      else {
        admin.initializeApp();
        console.log('✅ Initialized Firebase Admin with application default credentials');
      }
    }
  } catch (error: any) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.error('\nPlease ensure you have one of the following configured:');
    console.error('\n1. Place serviceAccountKey.json in the project root (easiest):');
    console.error('   Save your service account JSON file as: serviceAccountKey.json');
    console.error('   (This file is automatically ignored by git)');
    console.error('\n2. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable:');
    console.error('   FIREBASE_SERVICE_ACCOUNT_PATH=path/to/serviceAccountKey.json');
    console.error('\n3. Environment variables in .env.local:');
    console.error('   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id (or FIREBASE_PROJECT_ID)');
    console.error('   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com');
    console.error('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.error('\n4. Set GOOGLE_APPLICATION_CREDENTIALS environment variable:');
    console.error('   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json');
    console.error('\n5. Use application default credentials with project ID:');
    console.error('   Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local');
    console.error('   Run: gcloud auth application-default login');
    console.error('\nTo get service account credentials:');
    console.error('   1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('   2. Click "Generate New Private Key"');
    console.error('   3. Save the JSON file as serviceAccountKey.json in the project root');
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

const USERS_COLLECTION = 'users';

interface SeedAdminOptions {
  email: string;
  password?: string;
  displayName?: string;
  uid?: string; // If provided, will update existing user
}

async function seedAdmin(options: SeedAdminOptions) {
  const { email, password, displayName, uid } = options;

  if (!email) {
    throw new Error('Email is required');
  }

  try {
    let userId: string;
    let userRecord: admin.auth.UserRecord;

    // Check if user already exists
    if (uid) {
      // Update existing user
      try {
        userRecord = await auth.getUser(uid);
        userId = uid;
        console.log(`Found existing user with UID: ${userId}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          throw new Error(`User with UID ${uid} not found in Firebase Auth`);
        }
        throw error;
      }
    } else {
      // Try to find user by email
      try {
        userRecord = await auth.getUserByEmail(email);
        userId = userRecord.uid;
        console.log(`Found existing user with email: ${email} (UID: ${userId})`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create new user
          if (!password) {
            throw new Error('Password is required to create a new user');
          }
          const createUserData: admin.auth.CreateRequest = {
            email,
            password,
            emailVerified: true,
            displayName: displayName || 'Admin User',
          };
          userRecord = await auth.createUser(createUserData);
          userId = userRecord.uid;
          console.log(`Created new admin user: ${email} (UID: ${userId})`);
        } else {
          throw error;
        }
      }
    }

    // Update user profile in Firestore
    const userProfileRef = db.collection(USERS_COLLECTION).doc(userId);
    const userProfileDoc = await userProfileRef.get();

    const userProfile = {
      uid: userId,
      email: userRecord.email,
      roles: ['user', 'admin'] as ('user' | 'admin')[],
      status: 'active' as const,
      createdAt: userProfileDoc.exists ? userProfileDoc.data()?.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await userProfileRef.set(userProfile, { merge: true });

    console.log(`\n✅ Successfully seeded admin user!`);
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${userId}`);
    console.log(`   Roles: ${userProfile.roles.join(', ')}`);
    console.log(`\nThe user can now sign in with their email and password.`);

    return { userId, email, roles: userProfile.roles };
  } catch (error: any) {
    console.error('Error seeding admin:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const emailIndex = args.indexOf('--email');
  const passwordIndex = args.indexOf('--password');
  const uidIndex = args.indexOf('--uid');
  const nameIndex = args.indexOf('--name');

  const email = emailIndex !== -1 && args[emailIndex + 1] 
    ? args[emailIndex + 1] 
    : process.env.ADMIN_EMAIL || 'admin@example.com';
  
  const password = passwordIndex !== -1 && args[passwordIndex + 1]
    ? args[passwordIndex + 1]
    : process.env.ADMIN_PASSWORD || undefined;

  const uid = uidIndex !== -1 && args[uidIndex + 1]
    ? args[uidIndex + 1]
    : undefined;

  const displayName = nameIndex !== -1 && args[nameIndex + 1]
    ? args[nameIndex + 1]
    : 'Admin User';

  if (!email) {
    console.error('Error: Email is required');
    console.error('\nUsage:');
    console.error('  npm run seed-admin -- --email admin@example.com --password yourpassword');
    console.error('  npm run seed-admin -- --email admin@example.com --password yourpassword --name "Admin Name"');
    console.error('  npm run seed-admin -- --uid existing-user-uid  # Promote existing user to admin');
    console.error('\nOr set environment variables:');
    console.error('  ADMIN_EMAIL=admin@example.com');
    console.error('  ADMIN_PASSWORD=yourpassword');
    process.exit(1);
  }

  try {
    await seedAdmin({ email, password, displayName, uid });
    process.exit(0);
  } catch (error: any) {
    console.error('\nFailed to seed admin user:', error.message);
    process.exit(1);
  }
}

main();


