# 🏙️ Smart City Hub

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-API-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-dashboard-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-mobile-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🇵🇱 [Polish version](README.pl.md)

Smart City Hub is an integrated system for managing and monitoring urban infrastructure. It combines ESP32-based IoT devices, a central Node.js/TypeScript API, a React web dashboard, and a React Native mobile app.

The web dashboard and ESP32 firmware share the Node.js/MongoDB API. The React Native app was planned as another client of this system, but that integration was not completed; the retained mobile prototype uses Firebase Auth and Firestore independently.

📄 A detailed description of the architecture and API is available in the [technical documentation](docs/DOCUMENTATION.md) ([Polish version](docs/DOCUMENTATION.pl.md)).

**🗓️ Project period:** 2024

## 🎥 Demo — LEGO smart city

The system was built and demonstrated on a **physical LEGO city model** at the KI AT student club: ESP32 field modules polled desired states from the API and drove the model's lights and devices.

<p align="center">
  <img src="docs/media/lego-city-day.jpg" alt="LEGO smart-city model in daylight" width="49%"/>
  <img src="docs/media/lego-city-connected.jpg" alt="Connected ESP32 lighting prototype on the LEGO model" width="49%"/>
</p>

<p align="center">
  <img src="docs/media/lego-city.jpg" alt="Illuminated LEGO smart-city model" width="72%"/>
</p>

🎬 [Watch the combined LEGO lighting demo](docs/media/lego-city-demo.mp4) *(33 s, with music)*

Music: “Soft Corporate” by MusicLFiles (CC BY 4.0). See [Third-party notices](docs/THIRD_PARTY_NOTICES.md).

## Screenshots

The React web client starts with a JWT login screen before opening the user or administrator dashboard:

<p align="center">
  <img src="docs/media/web-login.png" alt="Smart City Hub web login" width="49%"/>
  <img src="docs/media/web-admin-dashboard.png" alt="Smart City Hub administrator device dashboard" width="49%"/>
</p>

The dashboard screenshot was rendered from the current client with representative local device data.

## Architecture

```mermaid
flowchart LR
    WEB["React web dashboard<br/>admin / user"] <-->|"REST + JWT"| API["Express API<br/>TypeScript"]
    ESP["ESP32 + 6x MCP23017<br/>96 outputs"] <-->|"HTTP state polling"| API
    API <-->|"Mongoose"| DB[("MongoDB")]
    MOBILE["React Native app"] <-->|"Firebase SDK"| FIREBASE[("Auth + Firestore")]
```

## Repository structure

```
smart_city_hub/
├── source/
│   ├── server/api/            # REST API (Node.js, Express, TypeScript, Mongoose)
│   ├── web/react/             # Web dashboard (React 18, Vite, Tailwind CSS)
│   ├── mobile/react-native/   # Mobile app (React Native + Firebase)
│   └── embedded/esp32_arduino/ # ESP32 firmware (Arduino, MCP23017)
├── docs/                      # Documentation, hardware references, and media
├── LICENSE                    # MIT
└── README.md
```

## Features

- **Device control** — up to 96 digital outputs (6 MCP23017 expanders × 16 pins) controlled remotely from the web dashboard; the ESP32 periodically polls the API for states and drives the outputs.
- **Sensor readings** — temperature, pressure, and humidity stored in the database with a reading date and device ID.
- **Roles and authentication** — JWT login with separate `admin` / `user` roles; admins manage users and devices, users control their assigned devices.
- **State history** — every device keeps a timestamped on/off history.

## Requirements

- Node.js 18+ and npm
- A MongoDB Atlas account (or a local MongoDB instance)
- For the firmware: Arduino IDE with ESP32 board support and `ArduinoJson` 7.x; MCP23017 registers are controlled directly over I2C
- For the retained mobile app: macOS with Xcode, a React Native environment, and a Firebase project

## Quick start

### 1. API (backend)

```bash
cd source/server/api
npm ci
```

Copy `.env.example` to `.env`, then replace the placeholder values:

```env
PORT=4200
JWT_SECRET_KEY=<random_secret>
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>
CORS_ORIGIN=http://localhost:5173
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_NAME=admin
INITIAL_ADMIN_PASSWORD=<at_least_12_characters>
```

For a fresh database, create the first administrator once:

```bash
npm run seed:admin
```

The command is idempotent for an existing complete administrator and refuses to overwrite a conflicting user. Remove `INITIAL_ADMIN_PASSWORD` from `.env` after the account has been created.

Run the API:

```bash
npm run dev     # development mode (ts-node)
npm run watch   # development mode with auto-restart (nodemon)
npm run build   # compile TypeScript to dist/
npm test        # build and run API route regression tests
```

The API listens on `http://localhost:4200` by default.

### 2. Web dashboard

```bash
cd source/web/react
npm ci
```

Copy `.env.example` to `.env` and adjust it if the API uses a different address:

```env
VITE_API_URL=http://localhost:4200/api
```

Run:

```bash
npm run dev      # Vite dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

The Vite development server is available at `http://localhost:5173` by default.

### 3. ESP32 firmware

1. Open `source/embedded/esp32_arduino/smart_city_iot/smart_city_iot.ino` in the Arduino IDE.
2. Copy `secrets.example.h` to the git-ignored `secrets.h` in the same directory.
3. Set the WiFi credentials, API URL, and a valid bearer token generated by the API.
4. Compile and flash to the ESP32 board (I2C bus: SDA=21, SCL=22, serial at 9600 baud).

### 4. Mobile app (optional)

Integration with the shared Node.js API was planned but not completed. The retained mobile prototype therefore uses its own **Firebase** backend (Auth + Firestore).

Only the iOS native project is retained. Building it requires macOS with Xcode; this repository does not contain an Android native project.

```bash
cd source/mobile/react-native
npm ci
npm start        # Metro bundler
npm run ios
```

`npm ci` creates the ignored `firebaseConfig.local.ts` from the placeholder template when it is missing. Fill that local file with your Firebase project configuration before running the app.

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | Node.js, Express 4, TypeScript, Mongoose 8, JWT, bcrypt, Joi |
| Database | MongoDB (Atlas) |
| Web | React 18, Vite, React Router 6, axios, Tailwind CSS, react-toastify |
| Mobile | React Native 0.73, React Navigation, Firebase (Auth, Firestore) |
| Embedded | ESP32 (Arduino), MCP23017, ArduinoJson, WiFi + HTTPClient |

## 👥 Team

| Member | Role |
|--------|------|
| **Kamil Rataj** ([@Kamilr616](https://github.com/Kamilr616), [LinkedIn](https://www.linkedin.com/in/kamil-r-153ab7121/)) | Author & maintainer |
| **Mateusz Ciszek** ([@Matix351](https://github.com/Matix351)) | Co-author |

## Security

Keep JWT, MongoDB, Firebase, and Wi-Fi values in the local files described above; commit only the provided templates. Report vulnerabilities using [SECURITY.md](SECURITY.md), not a public issue.

## License

Project-authored code and documentation are released under the [MIT](LICENSE) license. Bundled and referenced third-party materials remain under their respective terms; see [Third-party notices](docs/THIRD_PARTY_NOTICES.md).
