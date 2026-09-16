# React panel charts implementation plan

> For agentic workers: use the dispatching-parallel-agents workflow for the independent ownership groups below, then integrate and review.
Goal: deliver the requested React sensor/history dashboard and repair observed usability and data errors.
Spec: 2026-09-16-react-panel-charts-design.md.
Architecture: bounded history endpoints in existing Express service/controller layers; shared browser request/session handling; independent chart components; one dashboard shell and route composition.
Stack: existing React18/Vite6/Express/TypeScript/MongoDB plus Chart.js4/react-chartjs-2 and Playwright test tooling.

- [x] API owner: source/server/api only. First write failing history authorization/range/order/baseline tests. Implement exact contracts in spec, preserve existing endpoints and bulk writes; npm test. Report fields and limitations.
- [x] Auth owner: src/api.js, src/context/auth.jsx (+ context file if needed), Login.jsx, AddDevice.jsx, AddNewUser.jsx, privateRoute.jsx only. First test pure session/API helpers; use native form labels, CSS classes specified by integration owner; no shell edits.
- [x] Charts owner: src/components/HistoryChart.jsx, SensorPanel.jsx, DeviceHistory.jsx, chart helpers/tests only. Consume shared request exported apiRequest(path,{token,signal,...options}), context {user,expireSession}; sensor catalog + latest + history; device history receives device {deviceId,name}, user via context. Root integrates under /sensors and selected-device section. Use class names panel, panel-heading, metrics-grid, metric-card, field, button, button-secondary, error-message, empty-state, chart-wrap, badge, toolbar, select. Graph accessibility and optional isolated demo. Write pure data tests.
- [x] Root integration: App.jsx dashboard shell/device list/overview/CSS, dependency installation/scripts/ESLint, Playwright tests written before screens. Fix derived filters, unknown states, pending requests, error feedback, refresh polling/unmount handling, logout and mobile menus. Forms use shared conventions.
- [x] Root: review independent results, run API npm test, panel node tests/lint/build/e2e, visual inspect desktop+mobile screenshots, fix substantive issues, bilingual docs.
- [ ] Root: independent review, create PR, verify preview and prepare merge/deployment according to existing user authorization. Production checks read-only; never toggle physical outputs or insert synthetic telemetry.
