import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Get the user's display name from their UID.
 * @param {string} uid - The UID to search for.
 * @returns {Promise<string|null>} The user's display name or null if not found.
 */
export async function getDisplayNameFromUid(uid) {
  if (!uid) return null;
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data().displayName || null;
  }
  return null;
}
