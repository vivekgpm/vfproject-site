// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "",
  authDomain: "vvpvf-9f894.firebaseapp.com",
  databaseURL: "https://vvpvf-9f894-default-rtdb.firebaseio.com",
  projectId: "vvpvf-9f894",
  storageBucket: "vvpvf-9f894.firebasestorage.app",
  messagingSenderId: "151062346327",
  appId: "1:151062346327:web:7a90b6ab068259cc2f0112",
  measurementId: "G-ZE5LWZ01P8"
};
const fbapp = initializeApp(firebaseConfig);
// Initialize Firebase
export const auth = getAuth(fbapp);
export default fbapp;