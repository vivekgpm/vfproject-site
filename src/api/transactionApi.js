import { collection, getDocs, addDoc, doc, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Create a new transaction
export const createTransaction = async (transactionData) => {
  try {
    const docRef = await addDoc(collection(db, "transactions"), {
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

// Get a transaction by ID
export const getTransactionById = async (transactionId) => {
  try {
    const docRef = doc(db, "transactions", transactionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error("Transaction not found");
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

// Update a transaction
export const updateTransaction = async (transactionId, data) => {
  try {
    const docRef = doc(db, "transactions", transactionId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

// Get all transactions with optional filters
export const getTransactions = async (filters = {}) => {
  try {
    let q = collection(db, "transactions");

    // Apply filters if provided
    if (filters.userId) {
      q = query(q, where("userId", "==", filters.userId));
    }
    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters.projectId) {
      q = query(q, where("projectId", "==", filters.projectId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

// Get user's transactions
export const getUserTransactions = async (userId) => {
  try {
    const q = query(collection(db, "transactions"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    throw error;
  }
};