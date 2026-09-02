# Closing Bell handoff

## Repair delivered

Repaired verifier candidate 68d8e290379c1da90288512e4bdb45acd3c7b88b.

- Added product-owned sf-closing-bell-realtime WebSocket service source and
  Dockerfile. It uses SQLite at /data/closing-bell.db, accepts only Closing
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
- A direct three-client WebSocket smoke opened room RNAMA, started it, and
  verified the authoritative buy. Room codes are random, so this value is
  evidence only.

## Deployment

The static client must be deployed to sf-closing-bell. The websocket service
must be deployed with:

~~~sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh closing-bell-realtime /work/repo Dockerfile 8080
/opt/fleet/lib/deploy-static.sh closing-bell /work/repo/dist
~~~

The client uses wss://closing-bell-realtime.sociobot.in in production. No
secrets or other product resources are used.

## Known gaps

Deployment and final live Lighthouse/axe/response-policy checks have not yet
been recorded in this handoff. The client and server are committed ready for
those commands; deploy the realtime service before the static client so the
room entry point is immediately usable.
