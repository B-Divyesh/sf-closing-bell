# Closing Bell repair handoff

## Release status

Release blockers from independent verification commit
`c646a26fb2073fde0b611ba45cbbd3ac044f5461` are repaired. The exact failing
browser path was reproduced before the fix: three browser contexts started
room `MHKQ5`, the host clicked **Buy one Glowfruit**, and the UI remained at
`Held: 0` because it sent `type: "buy"` to a server accepting `type: "trade"`.

The retained regression now creates three browser seats through the real UI,
starts the room, clicks Buy, checks the buyer's holding, and checks the changed
price in another browser.

## Product repairs

- The browser now sends `type: "trade"` with `side: "buy"` or `"sell"`.
  Authoritative trades raise or lower the shared price by two tickets.
- Each shared room gets a distinct seeded headline and goal sequence. The
  server evaluates every private holding goal at the bell and records the
  final ticket value before liquidating holdings.
- Shared end screens say win or loss. The host can start another clean round;
  other seats see the restarted state immediately.
- `/demo` opens directly into an active 90-second practice game. Its explicit
  goal can be won or lost, and its end screen has a one-tap restart.
- Active demo state and sound live only in `sessionStorage` under
  `demo:closing-bell:*`. Reload restores it. Reset replaces it. Leaving demo
  deletes it without reading or changing real room state.
- The landing first screen now includes the game board, a one-click demo, and
  a responsive room form. At 390 px its scroll width is exactly 390 px.
- Every shared state has one h1. SPA navigation updates title and canonical,
  focuses the new h1, and announces it. All visible controls are at least
  44 px high on the tested phone viewport.
- Unknown static routes now return the designed external-CSS 404 with status
  404. Known SPA routes are explicit, so the fallback cannot mask missing
  pages. Hashed assets retain one-year immutable caching.
- Production WebSockets accept only the product origin. Untrusted origins get
  403. Upgrade bursts get HTTP 429 with `Retry-After: 1`. Connected clients get
  a JSON 429 with `retryAfter: 1`, followed by close code 1013 carrying
  `Retry-After=1`.
- `ws` is upgraded to 8.21.3 and Vite to 6.4.3. Both production and full npm
  audits report zero vulnerabilities.
- The container carries the source commit through `BUILD_SHA`; `/health`
  returns it with `Cache-Control: no-store`. The static footer shows the same
  build source when built from that commit.
- The bell now sounds after a player gesture. Mute persists in the correct
  real or demo namespace. Reduced motion disables movement.

## Verification evidence

Run from a clean checkout:

~~~sh
npm ci
npm run lint
npm test
npm run build
npm audit
~~~

Results on 2026-09-02:

- Clean `npm ci`: passed; 25 packages installed; zero vulnerabilities.
- `npm run lint`: passed (`tsc -b --pretty false`).
- `npm test`: passed 25/25 checks: 8 Node server/core tests and 17 Playwright
  browser tests. This includes the exact three-browser protocol regression and
  a scripted shared run through score and restart.
- Every command in `.factory/claims.json`: passed independently. Each claim
  tag occurs in exactly one test.
- `npm run build`: passed and produced `dist/`. Initial JavaScript is 18.41 KB
  raw / 6.72 KB gzip. CSS is 11.51 KB raw / 3.10 KB gzip.
- Playwright axe: no serious or critical issues on `/`, `/demo`, `/privacy`,
  `/terms`, or the designed `404.html` at 390×844.
- Keyboard: Enter trades; Space opens Pause; Escape closes it and restores
  focus. Route changes focus and announce the new h1.
- Mobile: `/` and `/demo` have 390 px document width at a 390 px viewport.
  Visible links, buttons, and inputs measured at least 44 px high.
- Scripted end proof: `/demo?duration=2` bought two tin robots, displayed
  **You met your goal**, showed final tickets, and restarted at 180 tickets
  with zero holdings. A no-trade run displayed **The goal slipped away**.
- Shared end proof: three browser contexts started an eight-second test room,
  bought the host's two goal goods, reached **You met your goal**, restarted,
  and observed 180 tickets and zero holdings.
- Frame rate: Chromium at 390×844, DPR 2, and 4× CPU throttling produced 302
  callbacks over 5.016 seconds: 60.21 fps.
- Production-preview Lighthouse on `/demo`: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; LCP 928 ms, CLS 0,
  total blocking time 0 ms.
- `verify-url.sh` on the production preview: title, `lang`, h1, main, alt,
  labels, and console checks passed; load 532 ms and no console errors.
- Azure Static Web Apps emulator: `/`, `/demo`, `/privacy`, and `/terms`
  returned 200; `/404` and an arbitrary missing path returned the designed
  page with 404; hashed assets returned
  `Cache-Control: public, max-age=31536000, immutable`.
- Response-policy tests: invalid WebSocket origin returned 403; a message
  burst returned status 429, retry-after 1, and close code 1013; health
  returned the injected test build SHA.

## Deployment

The static client is deployed to `sf-closing-bell`. The realtime service is
deployed to the product-owned `sf-closing-bell-realtime` container with its
existing `/data` mount and single replica:

~~~sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh closing-bell-realtime /work/repo Dockerfile 8080
/opt/fleet/lib/deploy-static.sh closing-bell /work/repo/dist
~~~

The deployed `/health` build value is checked against the release commit. Live
desktop, 390 px, keyboard, console, status, headers, identity, and a three-seat
trade are checked after publish.

## Known limits

Shared play needs a network connection. The practice game is local to the
current tab but is not packaged as an installable offline PWA. No paid service,
account system, analytics, or external AI call is present.
