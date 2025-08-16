import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "vvpvf-dev.firebaseapp.com",
  projectId: "vvpvf-dev",
  storageBucket: "vvpvf-dev.appspot.com",
  messagingSenderId: "961985301126",
  appId: "1:961985301126:web:753036ea17ee617ccc1f07",
  //measurementId: "G-ZE5LWZ01P8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
