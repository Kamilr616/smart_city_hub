// Included only when Metro is explicitly run with SCH_E2E_FIREBASE=1.
import {initializeApp} from 'firebase/app';
import {connectAuthEmulator, getAuth} from 'firebase/auth';
import {connectFirestoreEmulator, getFirestore} from 'firebase/firestore';

export const FIREBASE_APP = initializeApp({
  apiKey: 'demo-key',
  projectId: 'demo-smart-city-hub',
  appId: 'demo-app',
});
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const db = getFirestore(FIREBASE_APP);
connectAuthEmulator(FIREBASE_AUTH, 'http://127.0.0.1:9099');
connectFirestoreEmulator(db, '127.0.0.1', 8080);
