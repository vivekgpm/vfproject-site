import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Get all users
export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(db, "users"), where("role", "==", role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching users by role:", error);
    throw error;
  }
};

// Search users by name with pagination
export const searchUsersByName = async (searchTerm, limitCount = 50) => {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "user"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter users client-side based on search term
    return users.filter(user => 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};
