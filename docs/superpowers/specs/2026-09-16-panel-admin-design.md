# Panel administration and original palette

User requests the original white/gray/blue/black palette, concise operational copy, location-bound ESP credentials, admin user management and device editing. Preserve Devices/Locations, sensor charts and stored-state history.

ESP: independent random opaque bearer credentials, SHA-256 digest stored in a separate collection, raw key returned once, explicit location and name, expiration and revocation. Admin-only list/create/revoke; ESP key accepted only on scoped IoT state-read and sensor-ingest routes. Fixed 96-position firmware response masks other locations to false. Ingest must reject any sensor outside key location before any writes. Existing JWT flows retain token-store revocation and bcrypt.

Users: admin-only list and PATCH by ID for name/email/role/isAdmin/active and optional password. Block self-demotion/deactivation; protect the last active admin. Changes revoke affected sessions, inactive accounts cannot log in. Return no hashes/tokens. Device PATCH edits only existing metadata fields name/location/type/description, immutable deviceId and preserved state history. UI forms have explicit labels, pending guards and actionable errors.

Views: Users list/edit, ESP tokens list/create/revoke with one-time secret and copyable firmware setting, Devices edit form. Remove promotional headings and invented brand copy, retain original KI asset. Dense usable layout, responsive tables, clear status colors and native controls.

Verification: negative permission tests, key expiry/revocation/location isolation, user session revocation and password behavior, metadata-only device edits, mock-API browser CRUD and one-time key flows, desktop/mobile screenshots. Production checks read-only apart from temporary login/logout; do not create real keys or alter users/devices. Bilingual docs, PR and authorized rebase merge after green checks.