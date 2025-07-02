import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Get the user's UID from their BDA ID.
 * @param {string} bdaId - The BDA ID to search for.
 * @returns {Promise<string|null>} The user's UID or null if not found.
 */
export async function getUidFromBdaId(bdaId) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("bdaId", "==", bdaId));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  return null;
}

