# Verify the six-minute multiplayer market — verification 7

**Verdict: PASS**

**Finding count:** 0

**Untested claim count:** 0

**Implementation candidate:** `9d1f3d75eb56afc3c3b439c815480f4d39e6dfb2`

**Documentation checkout:** `8a37244d0fe1034b2d0097aa87d94c9084d1f300`

**Realtime implementation:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`

**Live URL:** <https://closing-bell.sociobot.in>

**Verified:** 2026-09-05 UTC from the clean checkout and fresh browser
contexts. No product code, deployment, or service configuration was changed.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 DPR2 phone browsers showed the game and a
clear first action.

- Job: **Trade goods together before the bell.**
- Audience: **Three to eight friends who want one six-minute market round.**
- First action: **Try it with sample data.** The adjacent text says it starts a
  private 90-second practice round.
- The visible market preview shows the timer, public headline, three fictional
  goods, 180 tickets, and the two-robot goal. It is not a menu wall.
- The three facts are no account needed, no real money, and free to play.

Both viewports had zero horizontal overflow and no console or page errors.
Screenshots are in `/work/.evidence/closing-bell-verification-7/`.

## Declared claims

After `npm ci`, every exact command in `.factory/claims.json` was run from the
clean checkout with a 120-second outer limit. Every command exited zero.

| Claim | Exact command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS — the scripted sample reached its winning report. |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS — restart restored 180 tickets and zero holdings. |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS — reload, request, storage, real-key, and exit checks passed. |
| `ninety-second-demo` | `npm test -- --grep @claim:ninety-second-demo` | PASS — one click opened the active 1:30 board. |
| `online-authority` | `npm run test:server -- --test-name-pattern @claim:online-authority` | PASS — three clients shared checked price impact and reconnect state. |
| `timed-private-rumors` | `npm test -- --grep @claim:timed-private-rumors` | PASS — all three seats updated and could not read another seat's private fields. |
| `six-minute-round` | `npm run test:server -- --test-name-pattern @claim:six-minute-round` | PASS — 360 seconds and the 3–8 seat limits were checked; the command exited in about 0.2 seconds. |
| `60-fps` | `npm test -- --grep @claim:60-fps` | PASS — the 390 px, 4× CPU result stayed within 50–70 FPS. |
| `text-reflow` | `npm test -- --grep @claim:text-reflow` | PASS — 200% text stayed within 390 px and a trade completed. |
| `fictional-free` | `npm test -- --grep @claim:fictional-free` | PASS — a new visitor traded without an account or payment step. |
| `settings-persist` | `npm test -- --grep @claim:settings-persist` | PASS — the demo sound choice survived reload without writing the real mute key. |

The live pages, README, privacy page, terms page, and 404 were cross-checked
against the inventory. No missing, false, incomplete, or untested public claim
was found. There are **zero untested claims**.

## Clean-checkout gates

- `npm ci`: PASS; 25 packages installed and zero vulnerabilities.
- `npm run lint`: PASS.
- `npm test`: PASS; 14 server tests and 20 browser tests.
- `npm run build`: PASS; `dist/` produced.
- `npm audit`: PASS; zero vulnerabilities.
- Built JS: 19.33 KB raw / 6.96 KB gzip.
- Built CSS: 12.02 KB raw / 3.20 KB gzip.
- No web fonts or third-party runtime scripts load.

## Sample game and recovery

The live one-click sample opened a populated 1:30 board with 180 tickets,
three fictional goods, a public headline, a private goal, a private-rumor
area, and working Buy and Sell controls.

- **Demo — sample data, nothing is saved** remained visible after a trade and
  reload.
- Reload restored the sample holding.
- **Reset demo** restored 180 tickets and zero holdings for all goods.
- **Start for real** removed every `demo:` key. A seeded real-data key remained
  unchanged.
- The complete sample flow contacted only the product origin and opened no
  WebSocket.
- Selling an unheld good explained how to recover. An unknown room code gave a
  clear correction.
- `/demo?duration=2` reached **You met your goal** after two Tin robot buys.
- `/demo?duration=1` reached **The goal slipped away** without that holding.
- **Play another round** restored 180 tickets and zero holdings.
- The audible end started one bell oscillator. A muted second run started no
  additional oscillator.

This covers normal, invalid, win, loss, reload, reset, exit, restart, and sound
settings paths without changing real data.

## Full production round

Three independent fresh clients, including a 390×844 touch client, played room
`HCSNW` through the production six-minute clock.

- Every seat received the first timed private-rumor update.
- The host bought its assigned Tin robots and reached **You met your goal**.
- Both other seats reached **The goal slipped away**.
- Every seat received a final ticket report.
- Active and end screenshots for all three clients are in the external
  evidence directory. `live-shared-run.json` records the run.

A separate room `8ZJDC` rejected an unheld sale, moved another client's shared
Glowfruit price from 39 to 41, and restored the buyer's holding after reload.
Boundary room `ZM4LA` accepted eight independent seats, rejected seat nine
with **This room already has eight players**, and started at 6:00. All client
error logs were empty.

## Backend, persistence, and limits

- Live `/health`: HTTP 200, `Cache-Control: no-store`, service
  `closing-bell-realtime`, build `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`.
- `EXPECTED_BUILD_SHA=bfbbfb4… npm run verify:realtime-release`: PASS.
- `npm run verify:live-rate-limit`: PASS. Twenty of 21 upgrades opened; the
  next returned HTTP 429 with `Retry-After: 1`. Connected message 21 returned
  status 429 with `retryAfter: 1`.
- The clean server suite passed cross-room tenant and seat isolation,
  authoritative invalid-balance handling, and actual SQLite process
  stop/start persistence.
- The live service was not restarted or reconfigured.

## Accessibility, privacy, routes, and performance

- The factory `verify-url.sh` passed `/`, `/demo`, `/privacy`, and `/terms`.
- Fresh Playwright Axe scans found zero serious or critical issues on those
  routes and the deliberate HTTP 404.
- Every checked route had `lang=en`, one h1, a main landmark, its own title and
  canonical URL, no horizontal overflow, and 44 px minimum visible targets.
- The 404 returned HTTP 404 with Rooms, Demo, and Privacy navigation, the full
  legal/footer links, one h1, and a working return action. Its expected network
  status message is not a page defect.
- Every crawled internal link returned 200. Privacy and Terms loaded normally.
- Keyboard checks covered the skip link, Enter trading, Space pause, Escape
  close, dialog focus entry and return, and a visible 4 px blue focus outline.
- Reduced motion removed the market-preview transform. At 200% text on a
  390 px screen, scroll width remained 390 px and a trade completed.
- Demo traffic was same-origin only and stayed in its temporary namespace.
  Shared play used only the product-owned realtime service. No analytics or
  third-party script was observed.
- No account or identified profile exists, and no privacy-request workflow is
  advertised. The privacy page accurately states browser and server storage.
- No service worker is registered and no offline or update promise is made.
  Shared play is correctly documented as requiring a network connection.
- Fresh 390×844 Chromium under 4× CPU throttling rendered 181 frames in
  3011.8 ms: **60.10 FPS**.
- Fresh mobile Lighthouse on `/demo`: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 788 ms, TBT 0 ms, CLS 0, transfer 11.7 KB.
- Security headers include CSP, HSTS, `nosniff`, referrer policy, and a
  restrictive permissions policy. Hashed JS and CSS use one-year immutable
  caching; HTML uses 30-second revalidation.

The researched job does not imply a useful runtime AI action. Deterministic,
server-checked market events are the correct product behavior, so the AI
missed-leverage check found no gap.

## Candidate and live comparison

`9d1f3d7…` is the last commit that changes product runtime files. The two later
commits through documentation checkout `8a37244…` change only handoff/evidence
files. The deployed static footer reports `Build 8a37244d0fe1`, and the app and
404 labels match.

A clean build of `8a37244…` matched the deployed files byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `1b25cc49f906024e0ee426a27c77eefee3333432109f50d2756e2a549cce5ca0` |
| `index-DfmbzZnE.js` | `61d2d45ec5cc7c9bb8cf65f353a234d5e4ce3ed90b3aff5fc68d8d24f9d64f96` |
| `index-DYMhejC_.css` | `91343bd51a7394583d75ce369d4a20b142216f1c4f0443df30e6042326456bb6` |
| `404.html` | `c9c1be209a0859cd9aa3a4c3210cf327474df01f53c3e6657fddaed303904978` |
| `404-build.js` | `2590550fd82bc8186d8d429e6a28cb5b05b5a63c832cee8131a874d31577bcf9` |

An arbitrary missing route returned the exact `404.html` bytes with HTTP 404.
The live image is therefore source-equivalent to implementation candidate
`9d1f3d7…`, with only the later documentation-derived build label. Realtime
health identifies its unchanged implementation exactly.

## Earlier finding disposition

| Earlier finding | Current evidence and disposition |
| --- | --- |
| Missing authoritative 3–8 player game | Fixed. Fresh full play, eight-seat acceptance, ninth-seat rejection, and server tests passed. |
| Browser/server trade protocol mismatch | Fixed. A live trade changed another client's price from 39 to 41. |
| No shared price impact, goal scoring, win/loss, or restart | Fixed. Live price impact and scored reports passed; sample and server restart checks reset state. |
| CSP errors and stuck countdown progress | Fixed. The semantic progress value changes without inline styles; live error logs were empty. |
| Active state lost on refresh | Fixed. Demo reload and live shared-seat reconnect restored holdings. |
| First screen was a menu wall or lacked one-click sample play | Fixed on fresh desktop and phone; the game preview and sample action are visible. |
| Touch targets, 390 px overflow, and 200% text clipping | Fixed. Targets are at least 44 px and both normal and 200% layouts stayed within 390 px. |
| Missing h1, route focus, titles, canonicals, correct 404, or full 404 shell | Fixed. Fresh route, keyboard, real HTTP 404, navigation, footer, and build-parity checks passed. |
| Weak caching and vulnerable `ws` dependency | Fixed. Immutable asset caching and zero audit vulnerabilities passed. |
| Missing frame-rate claim and phone measurement | Fixed. The tagged claim and fresh live 60.10 FPS measurement passed. |
| Sound setting had no sound | Fixed. The bell oscillator ran when enabled and was suppressed when muted. |
| Missing or stale realtime identity and rate response | Fixed. Health matches `bfbbfb4…`; upgrade and in-band 429 responses include retry timing. |
| Missing 45-second private rumors | Fixed. All three live seats and the tagged private-field isolation checks passed. |
| Unlisted or incomplete public claims | Fixed. Eleven current claims cover the public copy and all commands passed. |
| Six-minute claim command hung | Fixed. The exact command exited zero in about 0.2 seconds. |
| Rumor claim omitted seat three and private isolation | Fixed. The tagged test checks all three seats and every received private snapshot. |

## Evidence

Fresh evidence is under `/work/.evidence/closing-bell-verification-7/` and
includes first-screen, sample-end, text-reflow, 404, shared-active, and
shared-end screenshots; structured live QA and multiplayer results; factory
URL reports; and Lighthouse JSON.

## Final decision

**PASS — 0 findings and 0 untested claims.**
