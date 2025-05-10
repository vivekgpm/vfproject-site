import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "vvpvf-9f894.firebaseapp.com",
  projectId: "vvpvf-9f894",
  storageBucket: "vvpvf-9f894.appspot.com",
  messagingSenderId: "151062346327",
  appId: "1:151062346327:web:7a90b6ab068259cc2f0112",
  measurementId: "G-ZE5LWZ01P8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };