# Closing Bell repair 4 handoff

## Release status: PASS

**Implementation SHA:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`
**Documentation and evidence SHA:** the final handoff commit following this
implementation commit.
**Static deployment:** `https://closing-bell.sociobot.in`
**Realtime deployment:** `https://closing-bell-realtime.sociobot.in`

The static files match the implementation build exactly. The current realtime
health response identifies the same implementation SHA and has
`Cache-Control: no-store`.

## What changed

- Added deterministic per-seat private rumours. At each 45-second shared-game
  update, a public headline and every seat's private rumour move shared prices.
  Only the receiving seat sees its rumour, goal, cash, holdings, and outcome.
- Added the same public/private update concept to the deterministic 90-second
  practice rehearsal.
- Kept durable pre-rumour rooms compatible. Their private fields are added at
  the first timed update.
- Reflowed the board header below 500 px so enlarged text moves the timer below
  the status instead of clipping it.
- Added outcome tests for timed private rumours, 200% text reflow, reduced
  motion, real browser protocol use, tenant isolation, and actual SQLite
  process-restart recovery. Server claim filters now place Node's pattern flag
  before test files, so the documented claim commands really select their tags.
- Added the live rate-limit verifier and a verb-first catalog description.

## Verification

From a clean dependency install (`npm ci`):

- `npm run lint`: PASS.
- `npm test`: PASS — 14 server tests and 20 browser tests.
- `npm run build`: PASS — `dist/` produced; JS 19.33 KB raw / 6.96 KB gzip and
  CSS 12.02 KB raw / 3.20 KB gzip.
- `npm audit`: PASS — zero vulnerabilities.
- Every command in `.factory/claims.json`: PASS. This includes the exact
  server-tag commands and browser tests for bell/end screen, reset, demo
  isolation, 90-second sample, private rumours, 60 FPS, 200% reflow, no-account
  sample play, and sound persistence.
- `verify-url.sh` passed on fresh local and HTTPS root/demo pages. Fresh live
  390 px Axe scans found no serious or critical violations on `/`, `/demo`,
  `/privacy`, `/terms`, and the deliberate 404 route. Each had one h1 and the
  correct route title.
- Fresh live 390×844 DPR2 / 4× CPU measurement: 181 frames in 3009.9 ms,
  **60.13 FPS**. The 200% text check had `scrollWidth: 390`, timer right edge
  326.2 px, and completed a Glowfruit trade.
- Live mobile Lighthouse `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 784.9 ms, CLS 0, TBT 0.
- Fresh demo requests stayed on `https://closing-bell.sociobot.in`; no
  third-party request or shared-room WebSocket was used in demo mode.
- `npm run verify:realtime-release` passed with the implementation SHA.
- `npm run verify:live-rate-limit` observed 20 accepted upgrades, then HTTP
  429 with `Retry-After: 1`; connected message 21 received in-band 429 with
  `retryAfter: 1`.

## Live multiplayer evidence

`npm run verify:live-shared-run` used three independent fresh browser contexts
against production. Room `GEQWZ` ran from lobby through the real six-minute
bell. The host bought two Glowfruit, received a private rumour at the first
45-second update, and reached **You met your goal**. The other two seats saw
different private rumour text and received scored loss reports. All three end
reports contained final ticket totals.

Evidence is stored in:

- `.factory/evidence/repair-4-live-shared-run.json`
- `.factory/evidence/repair-4-live/`
- `.factory/evidence/repair-4-local/`

## Deployment configuration preserved

The static deployment used the built `dist/` directory. The product-owned
realtime image was built as `sf-closing-bell-realtime:bfbbfb4a69a1` with
`BUILD_SHA` set to the full implementation SHA. The deployed container keeps
its Azure File `/data` mount, one minimum and one maximum replica, existing
resources, existing ingress, and its existing product hostname. The active
revision is `sf-closing-bell-realtime--bfbbfb4`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing authoritative 3–8 room game | Already fixed; rechecked by browser authority, seat-limit, isolation, and live three-seat run tests. |
| Client/server trade protocol mismatch | Fixed before this repair; browser protocol regression remains green. |
| CSP progress errors | Fixed before this repair; local and live console checks are clean. |
| Refresh, goal result, host restart | Rechecked by reconnect, restart-reset, and SQLite restart tests. |
| First-screen/demo, 390 px targets, route metadata, cache policy, frame-rate | Rechecked by browser routes, fresh screenshots, response headers, 200% reflow, and live FPS/Lighthouse checks. |
| Stale realtime identity | Fixed: static hash and realtime `BUILD_SHA` both match the implementation SHA. |
| Missing timed private rumours | Fixed and observed in real production room `GEQWZ`. |
| Incomplete or falsely filtered claims | Fixed: every listed claim has one tagged outcome test; server pattern forwarding is verified. |

## Known gaps

None. The game does not claim offline play or use a service worker. Shared play
requires a network connection, as documented.
