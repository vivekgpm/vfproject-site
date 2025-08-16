import { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async (uid) => {
    try {
      console.log("Fetching user data for UID:", uid);
      const userDocRef = doc(db, "users", uid);
      console.log("User document reference:", userDocRef);

      const userDocSnap = await getDoc(userDocRef);
      console.log("Document snapshot exists:", userDocSnap.exists());

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log("User data retrieved:", userData);
        return userData;
      } else {
        console.error("No user document found for UID:", uid);
        return null;
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      try {
        setLoading(true);
        if (authUser) {
          console.log("Auth state changed - User authenticated:", authUser.uid);
          const userData = await fetchUserData(authUser.uid);

          if (userData) {
            setUser({
              uid: authUser.uid,
              email: authUser.email,
              ...userData,
            });
          } else {
            setError("User data not found in database");
            setUser(null);
          }
        } else {
          console.log("Auth state changed - No user");
          setUser(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (identifier, password) => {
    try {
      setError(null);
      setLoading(true);
      console.log("Attempting login for email:", identifier);
      let userCredential;
      if (identifier.includes("@")) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          identifier,
          password
        );
        console.log("User authenticated:", userCredential.user.uid);
      } else {
        const usernameDoc = await getDoc(doc(db, "usernames", identifier));

        if (!usernameDoc.exists()) {
          throw new Error("BDA ID not found");
        }
        const { email } = usernameDoc.data();
        console.log("Found email for bdaId:", email);

        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const userData = await fetchUserData(userCredential.user.uid);

      if (userData) {
        const user = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          ...userData,
        };
        setUser(user);
        return user;
      } else {
        throw new Error("User profile not found. Please contact support.");
      }
    } catch (err) {
      console.error("Login process error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    login,
    logout,
    error,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
