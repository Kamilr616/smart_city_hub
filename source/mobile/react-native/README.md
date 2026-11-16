# Smart City Hub mobile app

React Native client with Firebase Authentication and Firestore. It was planned as a client of the shared Smart City Hub Node.js API, but that integration was not completed. The retained app is therefore an independent Firebase-backed prototype and does not use the repository's Node.js API. It includes login and registration, device, statistics, settings, and project-information screens.

The full system description is in the [repository README](../../../README.md).

## Firebase configuration

`npm ci` copies `firebaseConfig.local.example.ts` to the git-ignored `firebaseConfig.local.ts` when the local file is missing. Replace the placeholder values in that local file with the configuration of your Firebase project; do not commit real credentials.

The app opens its drawer after an explicit successful login and closes it when Firebase reports sign-out or a different user. Registration returns to the login screen. The auth-state listener does not by itself guarantee immediate detection of remotely revoked tokens; access to real backend data must also be protected by Firebase Security Rules and appropriate server-side revocation checks.

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

## iOS simulator UI test

The separate `expennsesappUITests` scheme uses a real simulator and the local Auth emulator. The test creates a disposable demo account and exercises the login form, drawer gestures, device control, chart rendering and logout. It uses the app's example device and chart data, not real devices. Run on macOS after installing Pods, with the simulator destination available:

```bash
firebase emulators:exec --config firebase.emulator.json --project demo-smart-city-hub --only auth \
  'SCH_E2E_FIREBASE=1 xcodebuild test -configuration Release -workspace ios/expennsesapp.xcworkspace -scheme expennsesappUITests -destination "platform=iOS Simulator,name=iPhone 16" -derivedDataPath "$TMPDIR/sch-ui-test-derived" CODE_SIGNING_ALLOWED=NO'
```

Choose a simulator installed on the machine and a fresh derived-data directory. The environment variable replaces the Firebase configuration only when Metro creates this test bundle, directing it to localhost and the demo project. Do not distribute that bundle. The regular scheme and production bundle use the normal Firebase configuration.
