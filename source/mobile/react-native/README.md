# Smart City Hub mobile app

React Native client with Firebase Authentication and Firestore. It was planned as a client of the shared Smart City Hub Node.js API, but that integration was not completed. The retained app is therefore an independent Firebase-backed prototype and does not use the repository's Node.js API. It includes login and registration, device, statistics, settings, and project-information screens.

The full system description is in the [repository README](../../../README.md).

## Firebase configuration

`npm ci` copies `firebaseConfig.local.example.ts` to the git-ignored `firebaseConfig.local.ts` when the local file is missing. Replace the placeholder values in that local file with the configuration of your Firebase project; do not commit real credentials.

## Run locally

The retained native project targets iOS 15.1 and later. Building it requires macOS with Xcode and CocoaPods; an Android native project is not included in this repository. Use Node.js 26.13.1 or later in the 26.x line and npm 11.20.0 or later in the 11.x line.

```bash
npm ci
npm start
npm run ios
```

Use `npm test -- --runInBand` for the Jest tests, `npm run typecheck` for TypeScript, and `npm run lint` for the React Native lint configuration.

## Firebase emulator smoke test

With Java 21 and the Firebase CLI available, run the local Auth and Firestore emulators from this directory:

```bash
firebase emulators:exec --config firebase.emulator.json --project demo-smart-city-hub --only auth,firestore "node scripts/firebase-emulator-smoke.js"
```

The script uses a demo project and localhost emulators. It exercises registration, profile writes and reads, sign-out and sign-in using the Node SDK and its gRPC transport. This does not validate the React Native WebChannel transport or a simulator build.
