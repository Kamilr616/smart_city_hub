# Smart City Hub web dashboard

React 18 and Vite client for the Smart City Hub Node.js API. JWT sessions provide role-aware access to the overview, `Devices`, sensor charts, `Locations`, and administrator forms. `Devices` replaces the former `Home Lights` view.

The architecture, API contracts, and full setup are documented in the [repository README](../../../README.md) and [technical documentation](../../../docs/DOCUMENTATION.md).

## Run locally

Create `.env` in this directory and set the API base URL:

```env
VITE_API_URL=http://localhost:4200
```

The client normalizes values with or without the `/api` suffix, so `http://localhost:4200/api` is equivalent.

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

`npm test` covers session/API helpers and chart-data rules. `npm run test:e2e` starts Vite and runs Playwright against a mocked API; it does not write to a real backend.

## Dashboard behavior

The interface uses English for navigation, forms, messages, charts, and date/number formatting (en-GB). Names, descriptions, and location identifiers entered by users are displayed as stored.

- Inventory data refreshes every 30 seconds. Regular users see devices and sensors for their role/location; administrators, including accounts identified by `isAdmin`, see all available locations.
- `Locations` is derived from the available device and sensor metadata.
- Sensor charts show temperature, humidity, and pressure for 1 hour, 24 hours, 7 days, or 30 days. Live API data is the default.
- DEMO mode starts off. When enabled, it generates samples only in browser memory and never sends them to an API write route.
- Without connected ESP hardware, registered sensors have no real readings; the dashboard shows an empty or waiting state.
- Device charts use persisted `DeviceState.states`. Unknown state before the first observation remains blank, and truncated history does not bridge the omitted leading interval.

History requests use authenticated `GET /api/sensor/history/:id` and `GET /api/state/history/:id` calls with ISO `from`/`to` values and `limit=1000`. The API defaults to 24 hours when the range is omitted, accepts at most 31 days, and permits limits from 1 to 2000. State history is additionally authorized against the device location.

## Administrator views

- **User administration** — `Users` lists accounts and lets administrators edit name, email, role/location, administrator access, active status, and an optional new password. Saving an edit revokes that account’s sessions; inactive accounts cannot log in.
- **Device metadata** — administrators edit a device’s name, type, description, and location. Its ID and saved state history remain unchanged.
- **ESP credentials** — `ESP tokens` creates credentials for one existing location with an expiry of 1–365 days. The value is shown once; the API stores its hash and supports revocation.

New passwords require at least 12 characters and at most 72 UTF-8 bytes. Leaving the new-password field empty keeps the current password. User edits revoke all sessions for the edited account, including the current session when editing yourself. Self-deactivation, removing your own administrator access, and removing the last active administrator are rejected. User updates require MongoDB Atlas or a replica set for transactions.

Account actions use `GET /api/user/list`, `PATCH /api/user/:id`, and `POST /api/user/create`; device edits use `PATCH /api/device/:id`. ESP management uses `GET`/`POST /api/esp-tokens` and `DELETE /api/esp-tokens/:id`. ESP token values are shown only after creation, are not stored in browser session storage, and are stored only as hashes in MongoDB. Configure firmware with `API_TOKEN="Bearer sch_..."` using the complete generated token. These tokens grant only location-scoped state polling and registered-sensor ingestion, not dashboard or general administrator access.

The panel retains the original white/gray palette, blue navigation, black buttons, and KI logo, with concise headings and responsive forms and tables.
