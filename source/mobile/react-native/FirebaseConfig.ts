import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'; // Importuj getFirestore

const firebaseConfig = {
  apiKey: "AIzaSyCc6C6_OMvBWymvPymicvlednK7TwVZBRM",
  authDomain: "expennsesapp.firebaseapp.com",
  projectId: "expennsesapp",
  storageBucket: "expennsesapp.appspot.com",
  messagingSenderId: "441118432337",
  appId: "1:441118432337:web:7f1aa64297122e3fd22c70",
  measurementId: "G-E2YFHNXE5Q"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const db = getFirestore(FIREBASE_APP); // Inicjuj db przy użyciu getFirestore
export const auth =getAuth(FIREBASE_APP);

const analytics = getAnalytics(FIREBASE_APP);
