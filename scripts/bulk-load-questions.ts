
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const QUESTIONS_COLLECTION = 'interviewQuestions';

type Question = {
  question: string;
  category: 'Behavioral' | 'Technical';
  type: 'General' | 'Backend' | 'Frontend' | 'Full Stack' | 'DevOps';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  company?: string;
  tags?: string[];
};

async function bulkLoadQuestions(fileName: string = 'sample-questions.json') {
  try {
    const filePath = path.resolve(__dirname, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions: Question[] = JSON.parse(fileContent);

    const batch = writeBatch(db);
    const questionsRef = collection(db, QUESTIONS_COLLECTION);

    // Use doc() to create document references for batch operations
    questions.forEach((question) => {
      const docRef = doc(questionsRef); // Create a new doc reference
      batch.set(docRef, question);
    });

    await batch.commit();
    console.log(`✅ Successfully uploaded ${questions.length} questions to Firestore from ${fileName}!`);

  } catch (error) {
    console.error('❌ Error during bulk load:', error);
    process.exit(1);
  }
}

// Allow command line argument for file name
const fileName = process.argv[2] || 'sample-questions.json';
bulkLoadQuestions(fileName).then(() => process.exit(0));

