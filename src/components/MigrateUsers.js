
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function MigrateUsers() {
  // migration.js - Run this once to migrate existing users

  const migrateExistingUsersWithBdaId = async () => {
    try {
      console.log("Starting migration...");

      // Get all existing users
      const usersSnapshot = await getDocs(collection(db, "users"));
      let migrated = 0;
      let errors = 0;

      for (const userDoc of usersSnapshot.docs) {
        try {
          const userData = userDoc.data();
          const { bdaId, email } = userData;

          if (!bdaId) {
            console.log(`User ${userDoc.id} has no bdaId, skipping...`);
            continue;
          }

          // Create username mapping using bdaId
          await setDoc(doc(db, "usernames", bdaId), {
            uid: userDoc.id,
            email: email,
            createdAt: new Date(),
          });

          // Update user document to mark as migrated
          await updateDoc(userDoc.ref, {
            username: bdaId, // Store bdaId as username for reference
            migrated: true,
            migratedAt: new Date(),
          });

          migrated++;
          console.log(`Migrated user: ${bdaId}`);
        } catch (error) {
          console.error(`Error migrating user ${userDoc.id}:`, error);
          errors++;
        }
      }

      console.log(
        `Migration complete! Migrated: ${migrated}, Errors: ${errors}`
      );
    } catch (error) {
      console.error("Migration failed:", error);
    }
  };

  return (
    <div>
      <h1>Migrate Users</h1>
      <button onClick={migrateExistingUsersWithBdaId}>Migrate</button>
    </div>
  );
}
export default MigrateUsers;
