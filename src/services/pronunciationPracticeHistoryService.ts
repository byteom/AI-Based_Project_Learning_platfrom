import { db, auth } from '@/lib/firebase';
import type { AccentAceHistoryItem } from '@/lib/types';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, where, limit } from 'firebase/firestore';

const HISTORY_COLLECTION = 'pronunciationPracticeHistory';

export async function addHistoryItem(
  itemData: Omit<AccentAceHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");

  try {
    const docRef = await addDoc(collection(db, HISTORY_COLLECTION), {
      ...itemData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Failed to add history item.");
  }
}

export async function updateHistoryItem(
  id: string,
  data: Partial<Omit<AccentAceHistoryItem, 'id' | 'userId'>>
): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");
    try {
        const docRef = doc(db, HISTORY_COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating document: ", error);
        throw new Error("Failed to update history item.");
    }
}

export async function getHistoryItems(): Promise<AccentAceHistoryItem[]> {
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const q = query(
        collection(db, HISTORY_COLLECTION), 
        where("userId", "==", user.uid),
        limit(50)
    );
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccentAceHistoryItem));

    // Sort items by createdAt date descending on the client-side
    return items.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt as any).toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt as string) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt as any).toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt as string) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

  } catch (error) {
    console.error("Error getting documents: ", error);
    throw new Error("Failed to retrieve history items.");
  }
}

