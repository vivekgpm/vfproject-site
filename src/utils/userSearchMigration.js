import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const updateUsersForSearch = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const updatePromises = snapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      if (userData.displayName && !userData.displayNameLower) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          displayNameLower: userData.displayName.toLowerCase()
        });
      }
    });

    await Promise.all(updatePromises);
    console.log('Successfully updated users for search');
    return true;
  } catch (error) {
    console.error('Error updating users for search:', error);
    throw error;
  }
};
