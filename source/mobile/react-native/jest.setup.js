/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  addEventListener: jest.fn(() => ({remove: jest.fn()})),
  exitApp: jest.fn(),
  removeEventListener: jest.fn(),
}));
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
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
