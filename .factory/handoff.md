# Closing Bell handoff — independent verification 2: FAIL

## Current release status

**FAIL — do not release candidate
`7aedc445aeb9d8ed145b0900e45e6be07655104b`.** Independently verified against
<https://closing-bell.sociobot.in> on 2026-09-02 UTC. Full evidence and exact
commands are in `.factory/verification-2.md`.

The production static HTML, JS, and CSS match the candidate build. This is not
a deployment-only failure. The live browser's Buy/Sell controls send
`type: "buy"`/`"sell"`, but the realtime server accepts only
`type: "trade"`; a three-player live room returned `Unknown action.` and left
180 tickets / zero holdings unchanged.

Other release blockers: the first screen has no one-click sample demo and is a
room form rather than the game; the room form clips at 390 px; objectives never
produce a win/loss result; shared rounds have no restart; demo active state is
lost on reload; the demo storage promise is false; unknown routes/404 handling
is broken; production `ws` has a high-severity advisory; connected-message
rate limiting lacks 429/Retry-After; and realtime `/health` identifies its
build as `dev`.

Verified passing gates: after `npm ci`, all four exact claims commands pass;
`npm test` passes 10 tests; `npm run build` produces `dist/`; the practice demo
reaches and restarts from its report; SQLite state survives server restart;
the WebSocket upgrade limit returns 429 with Retry-After after 20 attempts per
second; normal routes have no serious/critical axe findings; normal play has
no console errors; reduced motion works; static assets cache immutably; and a
4× CPU-throttled mobile run measured 60.18 fps, LCP 392 ms, and CLS 0.029.

Run the verifier gates with:

~~~sh
npm ci
npm test
npm run build
npm audit --omit=dev
~~~

## Previous builder handoff

## Repair delivered

Repaired verifier candidate 68d8e290379c1da90288512e4bdb45acd3c7b88b.

- Added product-owned sf-closing-bell-realtime WebSocket service source and
  Dockerfile. It uses SQLite at /data/closing-bell-rooms-v3.db, accepts only Closing
  Bell and local development origins, applies a 20-message/second IP limit,
  and exposes GET /health.
- Added authoritative five-character rooms for 3–8 players. The server creates
  seat tokens, checks every buy and sell, starts only at three players, advances
  the shared round, liquidates holdings at the bell, and persists rooms for
  reconnect and refresh recovery.
- Changed the default screen to the room game, while preserving the isolated
  one-click 90-second practice demo.
- Replaced the blocked inline countdown style with a native progress element.
  The countdown now visibly decreases and produces no inline-style CSP error.
- Updated CSP for the owned realtime service, restored immutable asset caching
  in the deployed configuration, made route canonicals update at runtime, and
  raised navigation and demo-banner targets to 44 px.

## Verification

Run from a clean checkout:

~~~sh
npm ci
npm test
npm run build
~~~

Verified 2026-09-02:

- npm test: 10 tests pass. This includes the exact CSP/countdown regression,
  deterministic demo end/restart, keyboard and axe checks, server trade
  validation, three-seat WebSocket room flow, and reload recovery.
- npm run test:server: 4 Node tests pass. The tagged online-authority claim
  opens three actual WebSocket clients, starts the room, performs a
  server-checked buy, and reconnects the same seat.
- npm run build: passes and produces dist/. Built JavaScript is 5.60 KB gzip;
  CSS is 2.64 KB gzip.
- Local health smoke: node server/server.mjs then GET
  http://127.0.0.1:8080/health returned 200 with ok true.
- Live service health at https://closing-bell-realtime.sociobot.in/health
  returned 200 with ok true. A live three-client WebSocket smoke opened room
  FMFDY, started it, made an authoritative buy, and recovered that seat over
  a new connection.
- Live static verification: verify-url.sh reported title, lang, one h1, main,
  alt text, and no console errors at 1366 px. Playwright at 390 px reported
  390 px scroll width, no console errors, and no serious or critical axe
  findings. The deployed CSP permits only the owned realtime WebSocket in
  connect-src.

## Deployment

Published static client commit 19802a8 to sf-closing-bell and realtime service
commit e725be5 to sf-closing-bell-realtime on 2026-09-02. Both production URLs
returned HTTP 200 after publish.

The static client must be deployed to sf-closing-bell. The websocket service
must be deployed with:

~~~sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh closing-bell-realtime /work/repo Dockerfile 8080
/opt/fleet/lib/deploy-static.sh closing-bell /work/repo/dist
~~~

The client uses wss://closing-bell-realtime.sociobot.in in production. No
secrets or other product resources are used.

## Known gaps

Static Web Apps still serves hashed assets with max-age=30 despite the deployed
immutable asset route configuration. This platform cache-policy limitation was
observed in the live response headers; the client remains 5.60 KB gzip
JavaScript.
