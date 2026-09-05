# Verify the six-minute multiplayer market — verification 5

**Verdict: FAIL**

**Finding count:** 2

**Untested claim count:** 0

**Implementation candidate:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`

**Documentation checkout:** `d68b51b5b12816e18c617a488b1bfb7b9a584013`

**Live URL:** <https://closing-bell.sociobot.in>

**Verified:** 2026-09-05 UTC from a fresh clone

The live game works from entry through a real six-minute multiplayer result.
It is not accepted because one declared claim command does not finish and a
second tagged claim test does not prove all of its wording. The claims contract
makes both release-blocking findings even though the independently observed
live outcomes passed.

No product code was changed during verification.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 DPR2 phone browsers showed the same clear
first action and market preview.

- Job: **“Trade goods together before the bell.”**
- Audience: **“For three to eight friends who want one six-minute market
  round.”**
- First action: **“Try it with sample data.”** The adjacent text says it starts
  a private 90-second practice round.
- The first viewport contains the game preview with a timer, headline, three
  goods, ticket balance, and goal. It is not a menu wall.
- The three visible facts are no account needed, no real money, and free to
  play.

Both viewports had zero horizontal overflow and no console or page errors.
Evidence: `live-first-screen-desktop.png` and
`live-first-screen-phone.png` in `.factory/evidence/verification-5/`.

## Findings

### P1 — the declared six-minute claim command never finishes

From the fresh clone, after a successful `npm ci`, this exact command was run:

```sh
npm run test:server -- --test-name-pattern @claim:six-minute-round
```

The tagged assertion passes, then the process stops producing output and does
not exit. The first attempt was stopped after more than 90 seconds. A fresh
second attempt reproduced the hang and was stopped after more than 30 seconds.
The output ends after the matching game test and the zero-test release identity
file. It never reports the server test file or a final process result.

`server/run-tests.mjs` always loads `server/server.test.mjs`. That file has
file-level hooks which start the realtime child even when the name filter
selects none of its tests. The normal unfiltered suite exits, so `npm test`
passes while this required claim command does not.

This is a failed declared claim command. It must exit successfully from the
documented clean setup, for example by isolating the claim test file or avoiding
server lifecycle hooks when no server test matches.

### P1 — the timed private-rumor claim test does not assert every seat

Claim `timed-private-rumors` says **“Every 45-second shared-market update gives
each seat a private rumor while prices change.”** Its tagged browser test opens
three contexts but waits only for seat 1's rumor, checks the price change from
seat 1, and compares seat 1 with seat 2. It never reads or asserts seat 3's
rumor. The related untagged server test likewise inspects only the host and
second seat.

The fresh live room did show a private rumor in every one of three independent
browsers, so this is not a demonstrated runtime failure. It is an incomplete
mandatory claim test. The tagged test must assert that all three seat views
receive the timed update and that other players' private fields remain absent
from every seat snapshot.

## Declared claims

Every command in `.factory/claims.json` was attempted literally after `npm ci`.

| Claim | Result | Evidence |
| --- | --- | --- |
| `reaches-bell` | PASS | Tagged run reached the winning report. |
| `restart-resets` | PASS | Tagged run restored 180 tickets and zero holdings. |
| `demo-isolation` | PASS | Tagged storage and request assertions passed. |
| `ninety-second-demo` | PASS | Tagged one-click 1:30 start passed. |
| `online-authority` | PASS | Tagged three-client authority and reconnect test passed. |
| `timed-private-rumors` | **FAIL** | Command exits zero, but its assertion omits seat 3. |
| `six-minute-round` | **FAIL** | Matching assertion passes, but the declared command hangs and never exits. |
| `60-fps` | PASS | Tagged 390 px, 4× CPU test passed. |
| `text-reflow` | PASS | Tagged 390 px, 200% text trade passed. |
| `fictional-free` | PASS | Tagged no-account sample trade passed. |
| `settings-persist` | PASS | Tagged isolated sound-setting reload passed. |

There are zero untested claims. The live pages and README were cross-checked
against the inventory. No additional unlisted functional claim was found.

## Clean-checkout gates

The fresh clone was at documentation SHA `d68b51b5b12816e18c617a488b1bfb7b9a584013`.

- `npm ci`: PASS — 25 packages installed; zero vulnerabilities.
- `npm run lint`: PASS.
- `npm test`: PASS — 14 Node tests and 20 browser tests.
- `npm run build`: PASS — `dist/` produced.
- `npm audit`: PASS — zero vulnerabilities.
- Built JS: 19.33 KB raw / 6.96 KB gzip.
- Built CSS: 12.02 KB raw / 3.20 KB gzip.
- No web fonts are shipped.

The passing unfiltered suite does not cancel a failing exact claim command.

## Live sample and deterministic game

The one-click action opened a populated 90-second sample with 180 tickets,
three fictional goods, a public headline, a private goal, and trade controls.
The **“Demo — sample data, nothing is saved”** label stayed visible after a
trade and reload.

- Reload restored the demo holding.
- **Reset demo** restored 180 tickets and zero holdings.
- **Start for real** removed all `demo:` session/local keys.
- A seeded real-data key remained unchanged throughout.
- The complete demo request log contained only
  `https://closing-bell.sociobot.in`; no WebSocket opened.
- Selling an unheld good gave a corrective message.
- `/demo?duration=2` reached **“You met your goal”** after two Tin robot buys.
- `/demo?duration=1` reached **“The goal slipped away.”**
- **Play another round** restored the initial state.

Evidence: `.factory/evidence/verification-5/live-qa.json` and
`live-demo-win-phone.png`.

## Live shared game

Three independent fresh browser contexts, including a phone context, played
production room `7FH3F`.

- The room started at 6:00.
- The host's two Glowfruit buys moved another client's price from 46 to 50.
- Host reload at 5:59 restored both holdings.
- At 5:15, every client displayed a private rumor and the public prices had
  changed. Seat 1 and seat 2 had different text. Seat 3 happened to receive
  the same first-rumor text as seat 1; the product does not claim every seat's
  text is globally unique.
- The authoritative run ended after 359.989 seconds.
- The host saw **“You met your goal”** and 208 tickets. Both other seats saw
  **“The goal slipped away”** and a final ticket report.
- Host restart returned the room to 6:00, 180 tickets, and zero holdings.
- All three browser error logs were empty.

A separate fresh production room `DNY9B` accepted eight independent seats,
rejected seat nine with **“This room already has eight players,”** and started
at 6:00.

Evidence: `.factory/evidence/verification-5/live-shared-evidence.json`,
`live-shared-active-phone.png`, `live-shared-end-host.png`, and
`live-shared-end-phone.png`.

## Backend, release identity, and request limits

- Live `/health`: HTTP 200, `Cache-Control: no-store`, service
  `closing-bell-realtime`, build
  `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`.
- `EXPECTED_BUILD_SHA=bfbbfb4… npm run verify:realtime-release`: PASS.
- `npm run verify:live-rate-limit`: PASS. Twenty of 21 upgrade attempts opened;
  attempt 21 returned HTTP 429 with `Retry-After: 1`. Connected message 21
  returned in-band status 429 with `retryAfter: 1`.
- The full local server suite passed room isolation, untrusted-origin rejection,
  authoritative invalid-balance handling, and actual SQLite process-stop/start
  recovery.
- The live service was not restarted because this verification work order has
  no deployment action. The isolated local process restart exercises the same
  server and SQLite path without disrupting players.

## Live release comparison

There are no client or server runtime source changes between implementation
SHA `bfbbfb4…` and documentation SHA `d68b51b…`. Later changes add reports,
evidence, and verification scripts/tests.

The live static files exactly match a clean build of `d68b51b…`:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `82d11a44709d5c0bd56e6a780040e5945eeb8455680e7effc77e744f46bc4b5b` |
| `index-Cm8Jccey.js` | `3052fe16842fa7145c4cbdfc9e5db9a5efd25b5378f1b0fb4dc2c8fafc476526` |
| `index-DYMhejC_.css` | `91343bd51a7394583d75ce369d4a20b142216f1c4f0443df30e6042326456bb6` |

The footer build label is `d68b51b5b128`, while realtime health correctly
identifies the last runtime implementation `bfbbfb4…`. This matches the work
order's implementation/documentation split and is not a stale deployment.

## Accessibility, routes, privacy, and performance

- The factory URL verifier passed `/`, `/demo`, `/privacy`, and `/terms`.
- Fresh 390×844 Axe scans found zero serious or critical issues on those four
  routes and the deliberate missing route.
- Every checked route had `lang=en`, one h1, a main landmark, its own title and
  canonical URL, no horizontal overflow, and visible targets at least 44 px
  high.
- A missing URL returned the designed page with HTTP 404. That expected 404 is
  not a defect.
- All internal links returned 200.
- Keyboard checks covered the skip link, Enter trading, Space pause, Escape
  close, dialog focus entry/return, and a visible 4 px focus outline.
- Reduced motion removed the preview transform.
- At 200% text on a 390 px screen, `scrollWidth` stayed 390 px and a trade
  completed.
- The sample uses session storage, leaves real storage unchanged, and made no
  third-party request. Shared play uses only the product-owned realtime host.
- Privacy and terms pages loaded correctly. No account or identified profile
  exists, and no data-request feature is promised.
- No service worker is registered and no offline/update promise is made.
  Shared play is correctly documented as requiring a network connection.
- Fresh 390×844 DPR2 Chromium with 4× CPU throttling rendered 181 frames in
  3003.4 ms: **60.27 FPS**.
- Fresh mobile Lighthouse `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 971.94 ms, TBT 2.5 ms, CLS 0, transfer 12,018
  bytes.
- Hashed assets use one-year immutable caching. HTML uses 30-second
  revalidation. Security headers include CSP, HSTS, `nosniff`, referrer policy,
  and permissions policy.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing authoritative 3–8 player room game | Fixed; fresh three-client full round and eight-seat boundary passed. |
| Browser/server trade protocol mismatch | Fixed; live cross-client price impact passed. |
| CSP progress errors | Fixed; local regression and live console checks passed. |
| Active state, result, and restart recovery | Fixed; demo reload, shared reconnect, reports, and restart passed. |
| Missing win/loss evaluation | Fixed; fresh demo and shared win/loss reports passed. |
| Missing first-screen sample and game preview | Fixed on desktop and phone. |
| 390 px clipping and short touch targets | Fixed; zero overflow and 44 px minimum observed. |
| Canonical, 404, cache, and route-focus issues | Fixed; route and header checks passed. |
| Vulnerable production dependency | Fixed; audit reports zero vulnerabilities. |
| Missing frame-rate claim and measurement | Fixed; tagged and fresh live measurements passed. |
| Stale realtime identity | Fixed; live health exactly matches `bfbbfb4…`. |
| Missing timed private rumors | Runtime fixed and seen on all three live seats; tagged test coverage remains incomplete in finding 2. |
| 200% text clipping | Fixed; fresh live reflow and trade passed. |
| Incorrect server claim-filter placement | Partially fixed; the filter reaches the tag, but the six-minute exact command still hangs in finding 1. |

## Evidence

Evidence is under `.factory/evidence/verification-5/`:

- `live-qa.json`
- `live-shared-evidence.json`
- `lighthouse-demo.json`
- fresh desktop, phone, 200% text, practice-end, shared-active, and shared-end
  screenshots
- factory URL verifier output for root, demo, privacy, and terms
- `live-qa.mjs` and `live-shared-evidence.mjs`, the reproducible live runners

## Final decision

**FAIL — 2 findings, 0 untested claims.** The live product behavior is healthy,
but the mandatory claims gate is not complete and cannot support a PASS.
