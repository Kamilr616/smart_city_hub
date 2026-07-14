# Smart City Hub mobile app

React Native client with Firebase Authentication and Firestore. It was planned as a client of the shared Smart City Hub Node.js API, but that integration was not completed. The retained app is therefore an independent Firebase-backed prototype and does not use the repository's Node.js API. It includes login and registration, device, statistics, settings, and project-information screens.

The full system description is in the [repository README](../../../README.md).

## Firebase configuration

`npm ci` copies `firebaseConfig.local.example.ts` to the git-ignored `firebaseConfig.local.ts` when the local file is missing. Replace the placeholder values in that local file with the configuration of your Firebase project; do not commit real credentials.

## Run locally

Set up the React Native environment for Android or iOS, then run:

```bash
npm ci
npm start
npm run android  # or: npm run ios
```

Use `npm test` for the Jest test and `npm run lint` for the React Native lint configuration.
