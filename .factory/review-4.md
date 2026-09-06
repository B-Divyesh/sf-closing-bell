# Review the six-minute multiplayer market — review 4

**Verdict: PASS**

**Finding count:** 0

**Untested claim count:** 0

**Implementation candidate:** `9d1f3d75eb56afc3c3b439c815480f4d39e6dfb2`

**Documentation checkout:** `fa3c3acbb5ec35d17871e776d5e0d619578559dd`

**Live static build label:** `8a37244d0fe1`

**Realtime implementation:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`

**Live URL:** <https://closing-bell.sociobot.in>

**Reviewed:** 2026-09-06 UTC from a detached clean checkout and fresh live
browser contexts. No product code, deployment, service configuration, existing
room data, or non-product service was changed.

## Job, audience, and first action

Before scrolling, fresh 1366×900 desktop and 390×844 phone browsers showed the
game board rather than a menu wall.

- Job: **Trade goods together before the bell.**
- Audience: **Three to eight friends who want one six-minute market round.**
- First action: **Try it with sample data.** It says it starts a private
  90-second practice round.

Both views displayed the populated practice board (timer, headline, three
fictional goods, 180 tickets, and two-robot goal), had no horizontal overflow,
and had no normal-load console or page errors. Their title was `Closing Bell —
Play a room-code market game`.

## Live sample and full game runs

The phone sample action opened the active 90-second board in one click. Its
**Demo — sample data, nothing is saved** label remained visible. A Glowfruit
purchase survived reload in the demo session; **Reset demo** returned the board
to 180 tickets and three zero holdings; **Start for real** removed the demo
key while a seeded real key remained unchanged. Requests stayed on
`closing-bell.sociobot.in`. A two-second deterministic phone run reached the
recorded **You met your goal** report, and **Play another round** restored 180
tickets and zero holdings.

The independent production-room run created room `CRWQK` with three live
clients: desktop host, desktop second seat, and a 390×844 touch seat. It ran
through the real six-minute bell. All seats received the first timed private
rumor; the host bought its assigned tin robots and reached **You met your
goal**; the other two seats reached **The goal slipped away**; all had final
ticket reports. End-screen images and `live-shared-run.json` are in
`/work/.evidence/closing-bell-review-4/`.

A separate real room `L4SW7` confirmed authority and recovery: the host's
Glowfruit buy changed a second client from 38 to 40 tickets, and reloading the
buyer restored its holding. The clean server suite separately passed cross-room
tenant/seat isolation and an actual authoritative SQLite process restart.

## Declared claims and clean gates

After `npm ci` in detached checkout `fa3c3ac`, every exact command in
`.factory/claims.json` passed. There are zero untested claims.

| Claim | Result |
| --- | --- |
| reaches-bell | PASS — scripted practice play reached a win report. |
| restart-resets | PASS — restart restored 180 tickets and no holdings. |
| demo-isolation | PASS — temporary storage, reload, same-origin traffic, and exit cleanup passed. |
| ninety-second-demo | PASS — one click opened the populated 1:30 board. |
| online-authority | PASS — three seats shared checked price impact and reconnect state. |
| timed-private-rumors | PASS — all three seats received private state while other private fields stayed absent. |
| six-minute-round | PASS — 360 seconds and the three-to-eight boundary passed and exited normally. |
| 60-fps | PASS — the declared 390px, 4× CPU range passed. |
| text-reflow | PASS — 200% text at 390px remained playable. |
| fictional-free | PASS — a sample trade required neither account nor payment. |
| settings-persist | PASS — demo sound persisted only in demo storage. |

`npm run lint`, `npm test` (14 server and 20 browser tests), `npm run build`,
and `npm audit` all passed. The build produced `dist/`; game JavaScript is
19.33 KB raw and 6.97 KB gzip. A fresh live 390px Chromium run with 4× CPU
throttling measured 181 frames in 3008 ms, or 60.17 FPS.

## Accessibility, privacy, routes, and limits

- The factory `verify-url.sh` passed `/`, `/demo`, `/privacy`, and `/terms`:
  each returned 200 with a title, `lang=en`, one h1, main landmark, image alt
  coverage, labelled controls, and no normal-load console errors.
- Live Playwright Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and the
  designed missing route had zero serious or critical violations. This is the
  installed equivalent of the requested Axe audit.
- Keyboard Enter traded, Space opened pause, and Escape restored focus to
  Pause. Reduced motion made the market preview transform `none`. The demo
  and live route checks had no 390px overflow.
- Privacy and Terms load normally. The product has no analytics, payment,
  service worker, offline promise, or update promise. Practice requests are
  same-origin and demo state is isolated; shared play uses only the
  product-owned realtime service. No account or privacy-request workflow is
  promised.
- Every root-page internal link (`/`, `/demo`, `/privacy`, `/terms`) returned
  200. The missing route returned the designed HTTP 404, with shared header,
  legal footer, back path, one h1, and a 404-specific title. Its browser
  network console message for the deliberate 404 status is expected; the page
  itself is usable and is not a defect.
- Live health returned HTTP 200, `Cache-Control: no-store`, product service
  identity, and realtime SHA `bfbbfb4…`. `verify:realtime-release` passed.
  `verify:live-rate-limit` passed: 20 of 21 upgrades opened, then HTTP 429
  returned `Retry-After: 1`; the connected-message limit also returned 429
  with `retryAfter: 1`.

## Candidate comparison and earlier findings

`9d1f3d7` is the final runtime implementation. The revisions through `fa3c3ac`
are QA evidence and reports only. Building the clean checkout with
`VITE_BUILD_SHA=8a37244d0fe1` matched deployed `index.html`, JavaScript, CSS,
`404.html`, and `404-build.js` byte for byte. The live runtime is therefore
source-equivalent to the implementation candidate with its later
documentation-derived label.

All earlier review and verification findings, including minor ones, were
rechecked and remain resolved: missing authoritative 3–8 rooms; browser/server
protocol and shared price impact; scored win/loss and restart; timed private
rumors and their all-seat/private-field coverage; reload recovery; first-screen
sample flow; touch, 390px, and 200% text layout; CSP-safe progress; titles,
canonicals, h1s, route focus, and complete static 404 shell; cache policy and
dependency audit; measured FPS and sound isolation; realtime identity and both
429 responses; claim-inventory completeness; and termination of the
six-minute claim command. The fresh clean claims, live sample, fresh
multi-client six-minute room, reconnect run, routes, and release checks above
prove the current dispositions.

## Final decision

**PASS — 0 findings and 0 untested claims.**
