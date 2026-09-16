# Panel administration implementation plan

For agentic workers: use dispatching-parallel-agents for independent owners, integrate and request review.
Goal: restore original palette and add missing device/user/ESP administration.
Architecture: Express/Mongoose admin endpoints and scoped IoT authentication; existing React request/session helpers and shell.
Stack: React18/Vite6, Express/TypeScript/Mongoose, Node tests/Playwright.
Spec: ../specs/2026-09-16-panel-admin-design.md

- [x] ESP owner: new key schema/service/controller/middleware; wire app and IoT routes; own EspTokens.jsx. Write failing authorization/hash/expiry/scoping tests, then implement and verify. GET/POST /api/esp-tokens and DELETE /api/esp-tokens/:id; list array, create {token,key}, safe metadata id/name/location/createdAt/expiresAt/revokedAt.
- [x] Admin API owner: user list/PATCH + active/session rules; PATCH existing device metadata. GET /api/user/list array, PATCH /api/user/:id {name,email,role,isAdmin,active,password?}, PATCH /api/device/:id {name,location,type,description}. Validate and test with mocked persistence; no production writes.
- [x] UI owner: CSS, Overview/PanelLayout and promotional copy only. Reuse original KI logo, white/gray/blue/black palette. Remove slogans/eyebrows. Root handles new routes/navigation links.
- [x] Root: write browser regressions, Users.jsx and DeviceEdit.jsx, integrate routes/navigation/API contracts; ensure pending, role gates, errors, refresh and state history preservation.
- [ ] Root: full API/web tests, independent review, browser screenshots, bilingual docs, PR/rebase merge, read-only production verification.
Validated: API typecheck/build and66 tests; React19 helper tests,17 browser scenarios,lint/build; independentreview and desktop/mobile screenshots. Remaining release: PR, rebase merge, read-only productionchecks. User creation/edit transactions require Atlas/replica set.
