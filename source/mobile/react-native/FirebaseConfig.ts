import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'; // Importuj getFirestore

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "expennsesapp.firebaseapp.com",
  projectId: "expennsesapp",
  storageBucket: "expennsesapp.appspot.com",
  messagingSenderId: "REMOVED",
  appId: "REMOVED",
  measurementId: "REMOVED"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const db = getFirestore(FIREBASE_APP); // Inicjuj db przy użyciu getFirestore
export const auth =getAuth(FIREBASE_APP);

const analytics = getAnalytics(FIREBASE_APP);
