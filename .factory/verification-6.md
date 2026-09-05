# Verify the six-minute multiplayer market — verification 6

**Verdict: PASS**

**Finding count:** 0

**Untested claim count:** 0

**Implementation candidate:** `2901a2c58613946e2884f3de6b7a81bffcf2ec55`

**Documentation checkout:** `715dc82f1b5141f1358c7787ff4b9e275c54210f`

**Realtime implementation:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`

**Live URL:** <https://closing-bell.sociobot.in>

**Verified:** 2026-09-05 UTC from a fresh local clone and fresh browser contexts.

No product code was changed during verification.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 DPR2 phone browsers showed the game and
the same plain first action.

- Job: **Trade goods together before the bell.**
- Audience: **Three to eight friends who want one six-minute market round.**
- First action: **Try it with sample data.** The adjacent text says it starts
  a private 90-second practice round.
- The market preview shows the timer, public headline, all three goods, 180
  tickets, and the two-robot goal. It is not a menu wall.
- The three facts are no account needed, no real money, and free to play.

Both viewports had zero horizontal overflow and no console or page errors.
Evidence: `live-first-screen-desktop.png` and
`live-first-screen-phone.png` under `.factory/evidence/verification-6/`.

## Declared claims

After `npm ci` in a fresh clone at documentation SHA `715dc82…`, every exact
command in `.factory/claims.json` was run with a 90-second outer limit.

| Claim | Exact command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS — the scripted run reached the winning report. |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS — restart restored 180 tickets and zero holdings. |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS — isolated reload, request, real-key, and exit checks passed. |
| `ninety-second-demo` | `npm test -- --grep @claim:ninety-second-demo` | PASS — one click opened the active 90-second board. |
| `online-authority` | `npm run test:server -- --test-name-pattern @claim:online-authority` | PASS — three clients shared price impact and a reconnect restored the buyer. |
| `timed-private-rumors` | `npm test -- --grep @claim:timed-private-rumors` | PASS — all three browser seats updated; every received state hid other seats' private fields. |
| `six-minute-round` | `npm run test:server -- --test-name-pattern @claim:six-minute-round` | PASS — it exited 0 in about 0.2 seconds after checking 360 seconds and seat limits. |
| `60-fps` | `npm test -- --grep @claim:60-fps` | PASS — the 390 px, 4× CPU measurement stayed in the 50–70 FPS range. |
| `text-reflow` | `npm test -- --grep @claim:text-reflow` | PASS — 200% text stayed within 390 px and a trade completed. |
| `fictional-free` | `npm test -- --grep @claim:fictional-free` | PASS — a new visitor traded without an account or payment step. |
| `settings-persist` | `npm test -- --grep @claim:settings-persist` | PASS — the demo sound choice survived reload without writing the real mute key. |

The live pages and README were cross-checked against the inventory. No
unlisted public claim was found. There are **zero untested claims**.

## Clean-checkout gates

- `npm ci`: PASS; 25 packages installed and zero vulnerabilities.
- `npm run lint`: PASS.
- `npm test`: PASS; 14 server tests and 20 browser tests.
- `npm run build`: PASS; `dist/` produced.
- `npm audit`: PASS; zero vulnerabilities.
- Built JS: 19.33 KB raw / 6.96 KB gzip.
- Built CSS: 12.02 KB raw / 3.20 KB gzip.
- No web fonts or third-party scripts are loaded.

## Sample and deterministic game

The live one-click sample opened a populated 1:30 board with three fictional
goods, 180 tickets, a public headline, a private goal, a private rumor area,
and working trade controls.

- **Demo — sample data, nothing is saved** remained visible after a trade and
  reload.
- Reload restored the sample holding.
- **Reset demo** restored 180 tickets and three zero holdings.
- **Start for real** removed every `demo:` key. A seeded real-data key stayed
  unchanged throughout.
- The complete sample flow contacted only the product origin and opened no
  WebSocket.
- Selling an unheld good gave a corrective message. An unknown five-character
  room code also gave a corrective message.
- `/demo?duration=2` reached **You met your goal** after two Tin robot buys.
- `/demo?duration=1` reached **The goal slipped away** without that holding.
- **Play another round** restored 180 tickets and zero holdings.

This covers normal, invalid, loss, win, reset, reload, and exit paths. The
structured result is in `.factory/evidence/verification-6/live-qa.json`.

## Full production round

Three independent fresh clients, including a 390×844 phone, played room
`VXSNL` through the production clock.

- A separate boundary room started at 6:00. In the full run, the first-update
  screenshot was taken at 5:15 and the end screenshot 315.56 seconds later,
  accounting for the full six-minute round.
- Each seat received updated private rumor text at the first 45-second event.
  Two seats legitimately received the same deck entry; the product promises
  private delivery, not globally unique text.
- The host bought two assigned Weather vanes and reached **You met your
  goal**. The other seats reached **The goal slipped away**.
- Every seat received a final ticket report.
- A separate fresh three-client room rejected an unheld sale, propagated a
  Glowfruit price change from 46 to 48, and restored the host's holding after
  a browser reload.
- A fresh boundary room accepted eight seats, rejected seat nine with **This
  room already has eight players**, and started at 6:00.
- Fresh route, sample, and reconnect browser error logs were empty.

Active and end screenshots for all three seats, plus structured run and
reconnect results, are under `.factory/evidence/verification-6/`.

## Accessibility, routes, privacy, and performance

- The factory URL verifier passed `/`, `/demo`, `/privacy`, and `/terms`.
- Fresh Playwright Axe scans found zero serious or critical issues on those
  routes and the designed HTTP 404 route.
- Each checked page had `lang=en`, one h1, a main landmark, its own title and
  canonical URL, no horizontal overflow, and visible controls at least 44 px
  tall.
- An unknown URL returned the designed page with HTTP 404 and a route back.
  This expected 404 is not a defect.
- Every crawled internal link returned 200. Privacy and terms loaded normally.
- Keyboard checks covered the skip link, Enter trading, Space pause, Escape
  close, dialog focus entry and return, and a visible 4 px blue focus outline.
- Reduced motion removed the market-preview transform.
- At 200% text on a 390 px screen, scroll width remained 390 px and a trade
  completed.
- No service worker or offline/update claim exists. Shared play correctly
  needs a network connection.
- The demo request log was same-origin only. Shared play uses only the
  product-owned realtime service. There are no analytics or third-party
  runtime scripts.
- Fresh 390×844 Chromium under 4× CPU throttling rendered 181 frames in
  3005.1 ms: **60.23 FPS**.
- Fresh mobile Lighthouse on `/demo`: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 991.13 ms, TBT 25 ms, CLS 0, total transfer
  12,038 bytes.
- Security headers include CSP, HSTS, `nosniff`, referrer policy, and a
  restrictive permissions policy. Hashed assets use one-year immutable
  caching; HTML uses 30-second revalidation.

## Backend and release evidence

- Live health returned HTTP 200 with `Cache-Control: no-store` and exact
  realtime build `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`.
- `EXPECTED_BUILD_SHA=bfbbfb4… npm run verify:realtime-release`: PASS.
- `npm run verify:live-rate-limit`: PASS. Twenty of 21 upgrade attempts
  opened; attempt 21 returned HTTP 429 with `Retry-After: 1`. Connected
  message 21 returned in-band status 429 with `retryAfter: 1`.
- The clean server suite passed untrusted-origin rejection, invalid-balance
  handling, cross-room tenant/seat isolation, and actual SQLite process
  stop/start persistence.
- No live service was restarted or reconfigured.

## Candidate and live comparison

The implementation under review is `2901a2c…`. The checkout is `715dc82…`;
the commits after `2901a2c…` contain QA evidence, reports, a copy-audit update,
and a verifier-script update, with no product runtime file change.

The live footer reports documentation build `715dc82f1b51`. A clean build of
that checkout matched the live files byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `add4172e53a37c3bc4cf7f1368111251518cdb539f94d95cd1f4ab27100f2939` |
| `index-B2t397W4.js` | `35dd847fb4462c4400d3b20da5af50a228ebbb86b8ff0ede6000bbc244570a93` |
| `index-DYMhejC_.css` | `91343bd51a7394583d75ce369d4a20b142216f1c4f0443df30e6042326456bb6` |

The current live image is therefore source-equivalent to implementation
candidate `2901a2c…`, with only the later documentation build label changed.
The realtime source last changed at `bfbbfb4…`, which its live health endpoint
reports exactly.

## Earlier finding disposition

| Earlier finding | Current evidence and disposition |
| --- | --- |
| Missing authoritative 3–8 player room game | Fixed. Fresh three-client play, eight-seat acceptance, ninth-seat rejection, shared trades, and a full bell run passed. |
| Browser/server trade protocol mismatch | Fixed. A live buy changed another client's price from 46 to 48. |
| Market lacked shared price impact and scored goals | Fixed. Live price impact and win/loss reports passed. |
| CSP progress errors and stuck countdown | Fixed. The progress element changed without inline-style errors; all live error logs were empty. |
| Active rounds were lost on refresh | Fixed. Demo reload and live shared-seat reconnect restored holdings. |
| Missing win/loss and restart | Fixed. Fresh win, loss, restart-reset, and multiplayer closing reports passed. |
| First screen was a menu wall or lacked the sample action | Fixed on fresh desktop and phone; the market preview and one-click sample are visible. |
| Touch targets and 390 px clipping | Fixed. Minimum visible target height was 44 px and measured overflow was zero. |
| Canonical, route-title, route-focus, h1, and 404 issues | Fixed. Route checks, keyboard navigation, and the deliberate HTTP 404 passed. |
| Weak asset caching | Fixed. Hashed JS and CSS return one-year immutable caching. |
| Vulnerable production dependency | Fixed. `npm audit` reports zero vulnerabilities. |
| Missing frame-rate claim and phone measurement | Fixed. The tagged claim passed and live phone-class measurement was 60.23 FPS. |
| Sound control had no sound | Fixed. The bell uses gesture-armed Web Audio and the tested mute setting persists in the correct namespace. |
| Stale or unknown realtime release identity | Fixed. Live health and the exact release verifier report `bfbbfb4…`; server runtime is unchanged in `2901a2c…`. |
| Missing 45-second private rumors | Fixed. The live three-seat update and tagged browser/protocol checks passed. |
| 200% phone text clipping | Fixed. Fresh 390 px reflow stayed within 390 px and remained playable. |
| Unlisted or incomplete public claims | Fixed. Eleven declared commands cover current copy; all passed and none remain untested. |
| Six-minute claim command hung | Fixed. The exact command exits 0 in about 0.2 seconds. |
| Rumor claim omitted the third seat and private-field isolation | Fixed. The tagged test checks all three visible updates and every seat's received protocol snapshot. |

## Final decision

**PASS — 0 findings and 0 untested claims.**
