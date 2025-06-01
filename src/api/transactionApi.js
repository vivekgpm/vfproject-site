import { collection, getDocs, addDoc, doc, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Create a new transaction
export const createTransaction = async (transactionData) => {
  try {
    const timestamp = new Date();
    const dataWithTimestamp = {
      ...transactionData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // For asset purchases, create in both collections
    if (transactionData.type === 'assetPurchase') {
      // Create in assetPurchases collection
      const assetPurchaseRef = await addDoc(collection(db, "assetPurchases"), dataWithTimestamp);      // Also create in transactions collection
      await addDoc(collection(db, "transactions"), dataWithTimestamp);
      
      return assetPurchaseRef.id;
    } 
    // For asset payments, just create in transactions collection
    else if (transactionData.type === 'asset_payment') {
      const docRef = await addDoc(collection(db, "transactions"), dataWithTimestamp);
      return docRef.id;
    }
    // For any other type of transaction
    else {
      const docRef = await addDoc(collection(db, "transactions"), dataWithTimestamp);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

// Get a transaction by ID
export const getTransactionById = async (transactionId) => {
  try {
    // First check assetPurchases collection
    const assetPurchaseRef = doc(db, "assetPurchases", transactionId);
    const assetPurchaseSnap = await getDoc(assetPurchaseRef);
    
    if (assetPurchaseSnap.exists()) {
      return { id: assetPurchaseSnap.id, ...assetPurchaseSnap.data() };
    }

    // If not found in assetPurchases, check transactions collection
    const transactionRef = doc(db, "transactions", transactionId);
    const transactionSnap = await getDoc(transactionRef);
    
    if (transactionSnap.exists()) {
      return { id: transactionSnap.id, ...transactionSnap.data() };
    }

    throw new Error("Transaction not found in either collection");
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

// Get transaction by ID and collection type
const getDocumentByIdAndType = async (transactionId) => {
  // First check assetPurchases collection
  const assetPurchaseRef = doc(db, "assetPurchases", transactionId);
  const assetPurchaseSnap = await getDoc(assetPurchaseRef);
  
  if (assetPurchaseSnap.exists()) {
    return {
      ref: assetPurchaseRef,
      type: 'assetPurchase',
      data: assetPurchaseSnap.data()
    };
  }

  // Check transactions collection
  const transactionRef = doc(db, "transactions", transactionId);
  const transactionSnap = await getDoc(transactionRef);
  
  if (transactionSnap.exists()) {
    return {
      ref: transactionRef,
      type: 'transaction',
      data: transactionSnap.data()
    };
  }

  throw new Error("Document not found in either collection");
};

// Update a transaction
export const updateTransaction = async (transactionId, updateData) => {
  try {
    const timestamp = new Date();
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: timestamp
    };

    // Get the document reference and type
    const document = await getDocumentByIdAndType(transactionId);

    if (document.type === 'assetPurchase') {
      // For asset purchases, update both collections
      const assetPurchaseRef = doc(db, "assetPurchases", transactionId);
      await updateDoc(assetPurchaseRef, dataWithTimestamp);

      // Check if there's a matching record in transactions collection
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("assetId", "==", document.data.assetId),
        where("type", "==", "assetPurchase")
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      
      // Update the matching transaction record if it exists
      transactionsSnap.forEach(async (transactionDoc) => {
        await updateDoc(doc(db, "transactions", transactionDoc.id), dataWithTimestamp);
      });
    } else {
      // For regular transactions, just update the transactions collection
      const transactionRef = doc(db, "transactions", transactionId);
      await updateDoc(transactionRef, dataWithTimestamp);
    }

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