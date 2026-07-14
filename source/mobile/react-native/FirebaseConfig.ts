import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore'; // Importuj getFirestore

// Real config lives in the git-ignored `firebaseConfig.local.ts`.
// Copy `firebaseConfig.local.example.ts` -> `firebaseConfig.local.ts` and fill it in.
import {firebaseConfig} from './firebaseConfig.local';

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const db = getFirestore(FIREBASE_APP); // Inicjuj db przy użyciu getFirestore
