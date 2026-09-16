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

- Inventory data refreshes every 30 seconds. Regular users see devices and sensors for their role/location; administrators, including accounts identified by `isAdmin`, see all available locations.
- `Locations` is derived from the available device and sensor metadata.
- Sensor charts show temperature, humidity, and pressure for 1 hour, 24 hours, 7 days, or 30 days. Live API data is the default.
- DEMO mode starts off. When enabled, it generates samples only in browser memory and never sends them to an API write route.
- Without connected ESP hardware, registered sensors have no real readings; the dashboard shows an empty or waiting state.
- Device charts use persisted `DeviceState.states`. Unknown state before the first observation remains blank, and truncated history does not bridge the omitted leading interval.

History requests use authenticated `GET /api/sensor/history/:id` and `GET /api/state/history/:id` calls with ISO `from`/`to` values and `limit=1000`. The API defaults to 24 hours when the range is omitted, accepts at most 31 days, and permits limits from 1 to 2000. State history is additionally authorized against the device location.
