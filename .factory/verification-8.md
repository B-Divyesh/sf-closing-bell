# Verify room-code market play across three engines — verification 8

**Verdict: PASS**

**Finding count:** 0

**Untested claim count:** 0

**Implementation candidate:** 9d1f3d75eb56afc3c3b439c815480f4d39e6dfb2

**Documentation checkout:** df2212da73f92c775978f566c4f6f1a5b7fc7f97

**Live static build label:** 8a37244d0fe1

**Realtime implementation:** bfbbfb4a69a1a279f7e247657c7303d355f38cb6

**Live URL:** https://closing-bell.sociobot.in

**Verified:** 2026-09-06 UTC from a clean checkout and fresh browser contexts. No product code, deployment, service configuration, or existing room data was changed.

## Job, audience, and first action

Before scrolling, fresh 1366×900 desktop and 390×844 phone browsers showed the game rather than a menu wall.

- Job: **Trade goods together before the bell.**
- Audience: **Three to eight friends who want one six-minute market round.**
- First action: **Try it with sample data.** It says it starts a private 90-second practice round.
- The visible board preview showed its timer, public headline, three fictional goods, 180 tickets, and two-robot goal. Neither viewport overflowed.

## Browser qualification

Installed documented Playwright 1.58.2 prerequisites first: npx playwright install firefox webkit and npx playwright install-deps. The README does not promise a narrower browser list, so all supplied evergreen engine families were tested.

| Engine | Version | Desktop and 390px phone result |
| --- | --- | --- |
| Chromium | 145.0.7632.6 | PASS |
| Firefox | 146.0.1 | PASS |
| WebKit | 26.0 | PASS |

Each fresh engine completed a desktop sample win through **You met your goal** and a final ticket report. Each also completed one-click sample play at 390px: persistent **Demo — sample data, nothing is saved** label, touch trade, no horizontal overflow, demo reload recovery, reset to 180 tickets and three zero holdings, and Enter-key trade. Sound toggling persisted only in the demo state.

An AudioContext probe found zero contexts before input and one immediately after the first click in every engine; the bell then used that context. Audio therefore does not begin before user input. Fresh-load, normal-play, and page errors were absent.

## Real multiplayer run

Three independent live clients completed one real six-minute production room: Chromium host, Firefox second seat, and a 390×844 WebKit touch seat. Room 2HQVM began at 2026-09-06T06:49:33Z.

- The host bought two Glowfruit for its objective.
- The first real 45-second update delivered a private-rumor field to all three clients and changed shared prices from 30/53/43 to 22/47/48.
- At 2026-09-06T06:55:33Z Chromium showed **You met your goal** and 140 tickets. Firefox and WebKit showed **The goal slipped away**, each with its own objective and a 180-ticket closing report.
- All clients reached an end screen. Chromium and Firefox had no console or page errors in the full run.

WebKit recorded CSP messages only at Playwright full-page screenshot time. A focused probe reproduces the message exactly on page.screenshot(): Playwright injects a stylesheet that the site correctly rejects under style-src self. Fresh WebKit load/reload, touch, keyboard, and ordinary play are clean. This is test-runner behavior, not a product finding.

Fresh room GKKHA additionally proved real shared recovery: a Firefox buyer held one Glowfruit, reloaded, and recovered that holding. Invalid room ZZZZZ gave the clear Room code not found. Check the five characters and try again. message. Only anonymous test rooms were created.

Evidence is in /work/.evidence/closing-bell-verification-8/, including mixed-engine-live-success.json and mixed-*-{active,end}.png.

## Declared claims and clean gates

After npm ci, every exact command in .factory/claims.json was run. All eleven exited zero; no public claim is missing, false, incomplete, or untested.

| Claim | Result |
| --- | --- |
| reaches-bell | PASS — scripted sample reached a win report. |
| restart-resets | PASS — next round started with 180 tickets and no holdings. |
| demo-isolation | PASS — reload, isolated storage, same-origin traffic, and exit cleanup passed. |
| ninety-second-demo | PASS — one click opened a populated 1:30 board. |
| online-authority | PASS — three checked seats shared price impact and reconnect state. |
| timed-private-rumors | PASS — all seats received timed private state; other seats' private fields were absent. |
| six-minute-round | PASS — 360 seconds and three-to-eight boundary passed. |
| 60-fps | PASS — declared Chromium 390px/4× CPU range passed. |
| text-reflow | PASS — 200% text at 390px still completed a trade. |
| fictional-free | PASS — sample trade needed no account or payment. |
| settings-persist | PASS — demo sound reload did not enter real storage. |

npm run lint, npm test (14 server and 20 browser tests), npm run build (produced dist), and npm audit (zero vulnerabilities) all passed. Built game JavaScript is 19.33 KB raw / 6.96 KB gzip.

## Accessibility, privacy, routes, and backend

- Factory verify-url.sh passed /, /demo, /privacy, and /terms: title, lang=en, one h1, main, image alt text, and browser console were clean.
- Live Playwright Axe scans for /, /demo, /privacy, /terms, and /404 had zero violations.
- The requested standalone Axe CLI was attempted after browser setup but cannot run in this worker: its ChromeDriver supports Chrome 152 while supplied Playwright Chromium is 145. Retrying with that Chromium proved the mismatch. The installed Axe Playwright integration ran the equivalent live audit. This is unavailable worker infrastructure, not a product defect or an untested public claim.
- A missing route returned its designed HTTP 404. That deliberate status is expected and is not a defect. Legal routes and privacy copy loaded normally.
- The labelled demo reset cleanly and the declared isolation test preserved a seeded real key. It made no third-party request. No analytics, payment, service worker, offline promise, or update promise is present; shared play correctly requires a network connection.
- Realtime health returned 200/no-store and bfbbfb4. verify:realtime-release passed. verify:live-rate-limit passed: 20 of 21 upgrades opened, then HTTP 429 had Retry-After: 1; the connected-message limit returned status 429 and retryAfter: 1.
- The clean server suite passed room/tenant isolation, invalid balance rejection, authoritative SQLite restart persistence, and health identity.

## Candidate comparison and prior findings

9d1f3d7 is the final runtime implementation commit. df2212d is later QA documentation only. A clean build stamped VITE_BUILD_SHA=8a37244d0fe1 matched live index.html, app JavaScript, CSS, 404.html, and 404-build.js byte for byte. The live game is source-equivalent to the implementation candidate with its report-derived build label.

Every prior review or verification finding, including minor ones, remains fixed: authoritative 3–8 rooms, browser/server trade protocol, price impact, goals, win/loss and restart, private rumors, reload recovery, first-screen sample flow, touch/reflow, titles/canonical/focus/404 shell, CSP safety, cache/audit, FPS claim, sound persistence, realtime identity/rate responses, command termination, and complete claim inventory. The exact clean claims, fresh live URL checks, new mixed-engine room, reconnect path, build comparison, and current service checks above prove those dispositions.

## Final decision

**PASS — 0 findings and 0 untested claims.**

