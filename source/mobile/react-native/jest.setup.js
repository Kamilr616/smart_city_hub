/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

require('react-native-reanimated').setUpTests();
jest.mock('./FirebaseConfig', () => ({FIREBASE_AUTH: {}, FIREBASE_DB: {}}));
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getFirestore: jest.fn(),
  setDoc: jest.fn(),
}));
