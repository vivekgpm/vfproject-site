import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Get all investment plans
export const getAllPlans = async () => {
  try {
    const snapshot = await getDocs(collection(db, "planMaster"));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
};

// Get plan by ID
export const getPlanById = async (planId) => {
  try {
    const planDoc = await getDoc(doc(db, "planMaster", planId));
    if (!planDoc.exists()) {
      throw new Error("Plan not found");
    }
    return { id: planDoc.id, ...planDoc.data() };
  } catch (error) {
    console.error("Error fetching plan:", error);
    throw error;
  }
}; 