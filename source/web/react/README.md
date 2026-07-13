# Smart City Hub web dashboard

React 18 and Vite client for the Smart City Hub Node.js API. The application provides JWT-based login, role-aware user and administrator dashboards, device assignment, and remote device-state control.

The architecture, screenshots, and full setup are documented in the [repository README](../../../README.md).

## Run locally

Create `.env` in this directory and point it at the API prefix:

```env
VITE_API_URL=http://localhost:4200/api
```

Then run:

```bash
npm ci
npm run dev
```

Use `npm run lint` and `npm run build` before committing frontend changes.
