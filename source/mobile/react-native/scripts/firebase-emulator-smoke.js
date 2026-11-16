const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {createRequire} = require('node:module');
const net = require('node:net');
const {initializeApp, deleteApp} = require('firebase/app');
const {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} = require('firebase/auth');
const {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  setDoc,
  terminate,
} = require('firebase/firestore');

const host = '127.0.0.1';
const projectId = 'demo-smart-city-hub';

function requireEmulator(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({host, port});
    socket.setTimeout(3000);
    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.once('timeout', () =>
      socket.destroy(new Error(`Timed out connecting to ${host}:${port}`)),
    );
    socket.once('error', error =>
      reject(
        new Error(`Emulator unavailable at ${host}:${port}: ${error.message}`),
      ),
    );
  });
}

async function main() {
  await Promise.all([requireEmulator(9099), requireEmulator(8080)]);

  // The Node entry point uses gRPC. The React Native entry point uses WebChannel.
  const firestoreRequire = createRequire(
    require.resolve('@firebase/firestore/package.json'),
  );
  const grpcPath = firestoreRequire.resolve('@grpc/grpc-js');
  assert.ok(
    require.cache[grpcPath],
    'The Firestore Node entry did not load grpc-js',
  );
  const grpcVersion = firestoreRequire('@grpc/grpc-js/package.json').version;

  const app = initializeApp({
    apiKey: 'demo-api-key',
    projectId,
    appId: 'demo-app',
  });
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${host}:9099`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, host, 8080);

  try {
    const email = `test-${randomUUID()}@example.test`;
    const password = 'emulator-only-password';
    const registered = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const ref = doc(db, 'users', registered.user.uid);
    const profile = {
      uid: registered.user.uid,
      username: 'Emulator User',
      email,
    };
    await setDoc(ref, profile);
    assert.deepEqual((await getDocFromServer(ref)).data(), profile);

    await signOut(auth);
    await assert.rejects(
      getDocFromServer(ref),
      error => error.code === 'permission-denied',
    );

    const signedIn = await signInWithEmailAndPassword(auth, email, password);
    assert.equal(signedIn.user.uid, profile.uid);
    assert.deepEqual((await getDocFromServer(ref)).data(), profile);
    await deleteDoc(ref);
    await deleteUser(signedIn.user);
    console.log(
      `Auth and Firestore emulator smoke passed using grpc-js ${grpcVersion}`,
    );
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
}

const timeout = setTimeout(() => {
  console.error('Firebase emulator smoke timed out');
  process.exit(1);
}, 60000);
main().then(
  () => clearTimeout(timeout),
  error => {
    clearTimeout(timeout);
    console.error(error);
    process.exitCode = 1;
  },
);
