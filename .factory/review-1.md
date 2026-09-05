# Review the six-minute multiplayer market — review 1

**Verdict: FAIL**

**Finding count:** 1

**Untested claim count:** 0

**Implementation candidate:** `2901a2c58613946e2884f3de6b7a81bffcf2ec55`

**Documentation checkout:** `9fab156b256cc4b09060c69c4642b673cae2cd21`

**Live static build:** `715dc82f1b5141f1358c7787ff4b9e275c54210f`

**Realtime implementation:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`

**Live URL:** <https://closing-bell.sociobot.in>

**Reviewed:** 2026-09-05 UTC from a fresh GitHub clone and fresh browser
contexts.

The game, backend, accessibility, performance, and all declared claims pass.
The review is still a FAIL because the live 404 page does not use the required
shared header and footer. No product code, deployment, or service configuration
was changed during this review.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 DPR2 phone browsers showed the job, audience,
first action, and game preview without prior state.

- Job: **Trade goods together before the bell.**
- Audience: **Three to eight friends who want one six-minute market round.**
- First action: **Try it with sample data.** The adjacent text says it starts a
  private 90-second practice round.
- The game preview shows the timer, public headline, three goods, 180 tickets,
  and the two-robot goal. It is not a menu wall.
- The three facts are no account needed, no real money, and free to play.

Both first screens had zero horizontal overflow and no console or page errors.
Evidence: `live-first-screen-desktop.png` and
`live-first-screen-phone.png` under `.factory/evidence/review-1/`.

## Finding

### P2 — the 404 page omits the required shared site header and footer

The deliberate missing URL correctly returns HTTP 404 and shows a designed,
working page. The 404 response itself is expected and is not the defect.

The site-structure contract requires the consistent header and complete footer
on every route. The live 404 header contains only the linked wordmark; it omits
the Rooms, Demo, and Privacy navigation shown on every other route. Its footer
contains only “Closing Bell · Built by Param Factory”; it omits the product
one-liner, Privacy, Terms, and build ID.

This is visible at
`https://closing-bell.sociobot.in/review-1-missing` and in
`.factory/evidence/review-1/live-404.png`. The page remains keyboard reachable,
console clean, and accessible; this finding is about the mandatory shared site
structure. Make the static 404 use the same navigation and required footer
content as the other routes while retaining its real HTTP 404 response.

## Declared claims

After `npm ci` in the clean checkout, every exact command from
`.factory/claims.json` was run with a 90-second outer limit. All commands exited
successfully. There are zero untested claims.

| Claim | Exact command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS — the scripted practice run reached the winning report. |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS — play again restored 180 tickets and zero holdings; the server suite also covered a clean host restart. |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS — reload, storage isolation, request origins, and exit cleanup passed. |
| `ninety-second-demo` | `npm test -- --grep @claim:ninety-second-demo` | PASS — one click opened the active 90-second board. |
| `online-authority` | `npm run test:server -- --test-name-pattern @claim:online-authority` | PASS — three clients shared server-checked price impact and reconnect state. |
| `timed-private-rumors` | `npm test -- --grep @claim:timed-private-rumors` | PASS — all three seats received the update and other seats' private fields stayed hidden. |
| `six-minute-round` | `npm run test:server -- --test-name-pattern @claim:six-minute-round` | PASS — the command exited promptly after checking 360 seconds and the 3–8 seat limits. |
| `60-fps` | `npm test -- --grep @claim:60-fps` | PASS — the 390 px, 4× CPU measurement stayed within 50–70 FPS. |
| `text-reflow` | `npm test -- --grep @claim:text-reflow` | PASS — 200% text stayed within 390 px and a trade completed. |
| `fictional-free` | `npm test -- --grep @claim:fictional-free` | PASS — a fresh visitor traded the fictional sample without an account or payment step. |
| `settings-persist` | `npm test -- --grep @claim:settings-persist` | PASS — the demo sound choice survived reload without writing the real mute key. |

The live pages and README were cross-checked against the claim inventory. No
missing, false, incomplete, or untested public claim was found. Individual
command logs are under `.factory/evidence/review-1/claims/`.

## Clean-checkout gates

- Fresh clone SHA: `9fab156b256cc4b09060c69c4642b673cae2cd21`.
- `npm ci`: PASS; 25 packages installed and zero vulnerabilities.
- `npm run lint`: PASS.
- `npm test`: PASS; 14 server tests and 20 browser tests.
- `npm run build`: PASS; `dist/` produced.
- `npm audit`: PASS; zero vulnerabilities.
- Built JS: 19.33 KB raw / 6.97 KB gzip.
- Built CSS: 12.02 KB raw / 3.20 KB gzip.
- No web fonts or third-party runtime scripts load.

## Sample and deterministic run

The live one-click sample opened a populated 1:30 board with 180 tickets, three
fictional goods, a public headline, a private goal, a private-rumor area, and
working Buy and Sell controls.

- **Demo — sample data, nothing is saved** remained visible after a trade and
  reload.
- Reload restored the sample holding.
- **Reset demo** restored 180 tickets and three zero holdings.
- **Start for real** removed all `demo:` keys while a seeded real-data key
  remained unchanged.
- The complete sample flow contacted only the product origin and opened no
  WebSocket.
- Selling an unheld good explained that the player must buy one first.
- An unknown five-character room code explained how to recover.
- `/demo?duration=2` reached **You met your goal** after two Tin robot buys.
- `/demo?duration=1` reached **The goal slipped away** without the holding.
- **Play another round** restored the opening state.

This proves normal, invalid, win, loss, reload, reset, exit, and restart paths.
The structured result is `.factory/evidence/review-1/live-qa.json` and the end
screen is `live-demo-win-phone.png`.

## Full production round

Three independent fresh clients, including a 390×844 phone, played production
room `75KZE` from entry through the six-minute closing report.

- The room opened with three seats and a 6:00 clock.
- At 5:15, every seat displayed a newly delivered private rumor and the public
  market had changed. Two seats legitimately received the same deck entry; the
  claim promises private delivery, not globally unique text.
- The host bought its assigned Tin robot holding and reached **You met your
  goal** with 300 final tickets.
- The other two clients reached **The goal slipped away**.
- Every client received a final ticket report and all three screenshots show
  the 0:00 closing state.

A separate three-client room `SCTYE` rejected an unheld sale, propagated a
Glowfruit price move from 39 to 41, and restored the buyer's holding after a
browser reload. Boundary room `DJZ9Q` accepted eight independent seats,
rejected seat nine with **This room already has eight players**, and started at
6:00. Browser error logs were empty.

Evidence includes `live-shared-run.json`,
`live-reconnect-boundary.json`, and active/end screenshots for all three seats.

## Accessibility, routes, privacy, and performance

- The factory URL verifier passed `/`, `/demo`, `/privacy`, and `/terms` with
  no browser errors.
- Fresh Playwright Axe scans found zero serious or critical issues on those
  routes and the deliberate 404.
- Each checked page has `lang=en`, one h1, a main landmark, its own title and
  canonical URL, and no horizontal overflow. Visible controls are at least
  44 px high.
- Keyboard checks covered the skip link, Enter trading, Space pause, Escape
  close, dialog focus entry and return, and a visible 4 px blue focus outline.
- Reduced motion removes the market-preview transform.
- At 200% text on a 390 px screen, scroll width stayed 390 px and a trade
  completed.
- Privacy and Terms load normally. Demo traffic is same-origin only, demo state
  is isolated and cleared on exit, and shared play uses only the product-owned
  realtime service. There are no analytics or third-party scripts. No account
  or profile exists, and no data-request workflow is promised.
- No service worker is registered and no offline or update behavior is
  promised. Shared play is documented as needing a network connection.
- Fresh live phone-class rendering under 4× CPU throttling measured 181 frames
  in 3006.2 ms: **60.21 FPS**.
- Fresh mobile Lighthouse on `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 902.93 ms, TBT 24 ms, CLS 0, transfer 12,011
  bytes.
- Security headers include CSP, HSTS, `nosniff`, referrer policy, and a
  restrictive permissions policy. Hashed assets use one-year immutable
  caching; HTML uses 30-second revalidation.

The 404 returns the correct status, has a unique title, one h1, a main
landmark, a working return link, and no Axe or console failure. Its missing
shared shell is recorded separately as the sole finding.

## Backend and live release evidence

- Live `/health` returned HTTP 200, `Cache-Control: no-store`, service
  `closing-bell-realtime`, and exact build
  `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`.
- `EXPECTED_BUILD_SHA=bfbbfb4… npm run verify:realtime-release`: PASS.
- `npm run verify:live-rate-limit`: PASS. Twenty of 21 upgrade attempts opened;
  attempt 21 returned HTTP 429 with `Retry-After: 1`. Connected message 21
  returned status 429 with `retryAfter: 1`.
- The clean server suite passed untrusted-origin rejection, invalid-balance
  handling, cross-room seat isolation, authoritative price changes, and an
  actual SQLite process stop/start recovery.
- No live service was restarted or reconfigured.

## Candidate and live comparison

The implementation under review is `2901a2c…`; the requested documentation
checkout is `9fab156…`. Later commits add QA evidence, reports, copy-audit
documentation, and verification tooling, with no product runtime change.

The deployed static footer identifies build `715dc82f1b51`. A clean detached
build of that documentation revision matched the live files byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `add4172e53a37c3bc4cf7f1368111251518cdb539f94d95cd1f4ab27100f2939` |
| `index-B2t397W4.js` | `35dd847fb4462c4400d3b20da5af50a228ebbb86b8ff0ede6000bbc244570a93` |
| `index-DYMhejC_.css` | `91343bd51a7394583d75ce369d4a20b142216f1c4f0443df30e6042326456bb6` |

The live client is source-equivalent to candidate `2901a2c…`; the only later
build difference is documentation/build-label input. The realtime source last
changed at `bfbbfb4…`, which live health reports exactly.

## Earlier finding disposition

| Earlier finding | Current evidence and disposition |
| --- | --- |
| Missing authoritative 3–8 player room game | Fixed. Fresh three-client full play, eight-seat acceptance, ninth-seat rejection, and authoritative server tests passed. |
| Browser/server trade protocol mismatch | Fixed. A live buy changed another client's price from 39 to 41. |
| Market lacked shared price impact and scored goals | Fixed. Live price impact and three closing reports passed. |
| CSP errors and a stuck countdown bar | Fixed. The semantic progress value changes without inline styles; live error logs are empty. |
| Active state was lost on refresh | Fixed. Demo reload and live shared-seat reconnect restored holdings. |
| Missing win/loss evaluation and restart | Fixed. Fresh win/loss screens and demo restart passed; the clean server suite proves a host-only clean restart. |
| First screen was a menu wall or lacked a sample action | Fixed on fresh desktop and phone; the game preview and sample action are visible. |
| Touch targets and 390 px clipping | Fixed. Minimum observed target height is 44 px and overflow is zero. |
| Missing route titles, canonicals, h1, route focus, and correct 404 response | Functional parts fixed. Titles, canonicals, focus, h1, and the deliberate HTTP 404 pass; the separate shared-shell omission is this review's one finding. |
| Weak asset caching | Fixed. Hashed JS and CSS return one-year immutable caching. |
| Vulnerable production WebSocket dependency | Fixed. `npm audit` reports zero vulnerabilities. |
| Missing frame-rate claim and phone measurement | Fixed. Tagged and fresh live measurements pass. |
| Sound setting had no sound | Fixed. Gesture-armed Web Audio exists and the mute setting persists in the correct namespace. |
| Stale or unknown realtime release identity | Fixed. Live health and the exact verifier report `bfbbfb4…`. |
| Missing 45-second private rumors | Fixed. The live three-seat update and tagged protocol/browser checks pass. |
| 200% phone text clipping | Fixed. Fresh 390 px reflow remains playable without overflow. |
| Unlisted or incomplete public claims | Fixed. Eleven declared commands cover current functional copy; all pass. |
| Six-minute claim command hung | Fixed. The exact command exits successfully in under one second. |
| Rumor claim omitted seat three and private-field isolation | Fixed. The tagged test checks all three seats and every received protocol snapshot. |

## Evidence

Evidence is under `.factory/evidence/review-1/` and includes:

- first-screen, sample-end, text-reflow, 404, shared-active, and shared-end
  screenshots;
- `live-qa.json`, `live-shared-run.json`, and
  `live-reconnect-boundary.json`;
- every exact claim command log and the full lint, test, build, and audit logs;
- factory URL verifier output for root, demo, privacy, and terms;
- Lighthouse JSON, live health/headers, rate-limit output, release identity,
  and static artifact hashes.

## Final decision

**FAIL — 1 finding and 0 untested claims.** The complete game and every claim
pass, but PASS requires zero findings. The static 404 must use the required
shared header and footer before the product can pass this strict review.
