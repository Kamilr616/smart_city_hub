# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project
**Smart City Hub** — a multi-client IoT platform demoed on a physical LEGO-city model.
A **Node/Express/TypeScript** API (MongoDB) serves the **React** web client and
**ESP32 (Arduino)** devices; the **React Native** client uses Firebase as an
independent backend.

## Layout
- `source/server/api/` — Express + TypeScript backend (auth, device state).
- `source/web/react/` — web client · `source/mobile/react-native/` — mobile client.
- `source/embedded/esp32_arduino/` — device firmware.
- `docs/DOCUMENTATION.md` (+ `.pl.md`) — API/architecture notes.
- `docs/media/` — LEGO-city photos + demo video.

## Build / run
- Each client builds independently (see README / DOCUMENTATION for commands).
- Backend config comes from **env vars** (`MONGODB_URI`, `JWT_SECRET_KEY`); the mobile
  Firebase config is imported from a **gitignored** `firebaseConfig.local.ts`; ESP32
  secrets live in a **gitignored** `secrets.h`.

## Conventions & good practices
- **Never commit secrets** (Mongo connection strings, JWT secret, Firebase keys, Wi-Fi
  credentials) — commit only `*.example` templates.
- Auth: passwords are compared with **bcrypt**; JWTs are verified **and** checked against
  the token store (supports revocation). Don't weaken these checks.
- Batched device-state writes use `bulkWrite` — keep it batched.
- Update **both** language versions of README / DOCUMENTATION together.

## Documentation
- [README.md](README.md) · [README.pl.md](README.pl.md)
- [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)
- License: **MIT** — see [LICENSE](LICENSE).

_Educational / portfolio project._
