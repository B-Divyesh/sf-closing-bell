# Independent verification 4 — FAIL

**Candidate:** `6381d5acb2c8a47437755275f21f799e661fefb7`  
**Production URL:** <https://closing-bell.sociobot.in>  
**Verified:** 2026-09-02 UTC from the candidate checkout  
**Work order:** `closing-bell-verify-4`

## Verdict

**FAIL.** The static site is byte-for-byte the candidate build and the core
game is playable, but the product-owned realtime service identifies itself as
build `020b0f1af4bea51ed0daafb14527361406b5c2da`, not the requested candidate.
The candidate's own release-identity command fails for `6381d5ac...`.

There are three further release-blocking contract defects: the shared game has
no timed private rumors required by the researched brief, the active game
clips content at 200% text size on a 390 px screen, and the public claims
inventory/test sandbox is incomplete. No product code was modified during
verification.

## Mandatory first read — PASS

A cold 1440×900 browser load says **“Trade goods together before the bell”**
and **“For three to eight friends who want one six-minute market round.”** The
first action is **“Try it with sample data”**, with the adjacent explanation
**“Starts a private 90-second practice round.”** The same first viewport shows
the practice market, timer, headline, prices, tickets, and goal rather than a
menu wall. It therefore explains what to play, who it is for, and what to click
first in plain words. No console or page error occurred.

Evidence: `.factory/evidence-first-screen-live.png` and
`.factory/evidence/verification-4/live-first-screen-mobile.png`.

## Claims gate and clean-checkout gates

The literal claim commands were probed before installation as instructed; as
expected in a dependency-free checkout, they could not import `ws`. After the
required clean `npm ci` (25 packages, zero vulnerabilities), every exact
command in `.factory/claims.json` passed:

| Claim | Exact command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS |
| `ninety-second-demo` | `npm test -- --grep @claim:ninety-second-demo` | PASS |
| `online-authority` | `npm run test:server -- --test-name-pattern @claim:online-authority` | PASS |
| `six-minute-round` | `npm run test:server -- --test-name-pattern @claim:six-minute-round` | PASS |
| `60-fps` | `npm test -- --grep @claim:60-fps` | PASS |
| `fictional-free` | `npm test -- --grep @claim:fictional-free` | PASS |
| `settings-persist` | `npm test -- --grep @claim:settings-persist` | PASS |

Other local gates:

- `npm run lint`: PASS (`tsc -b --pretty false`).
- `npm test`: PASS — 11 Node server tests and 17 Playwright tests.
- `npm run build`: PASS — exact production build produced `dist/`.
- `npm audit`: PASS — zero vulnerabilities.
- Docker is unavailable in this verifier container, so the Dockerfile itself
  could not be built. The Node 22 server was started and exercised directly.

Production bundle sizes are 18.41 KB JS / 6.71 KB gzip and 11.51 KB CSS /
3.10 KB gzip. There are no web fonts. These are below the 200 KB JS, 50 KB
CSS, and 120 KB font budgets.

## Candidate/deployment identity

The static deployment exactly matches the candidate build:

| Artifact | Candidate/live SHA-256 |
| --- | --- |
| `index.html` | `7f6d1f53bdcc6b17f71f940ad7a852c36cdf3b86d0f4f6062436bf945ca24c66` |
| `index-CSnmLOei.js` | `2e805bbc3da0c553bcffb34bc44e9c63cbd1d5a3a07adc2a6bd872a6ce94dcd3` |
| `index--OnCqnG7.css` | `a57e3fa41730b5a2cb68aafc8766b750bb6a7ca36db39a6069098a4f8dfdf8ee` |

The live footer says `Build 6381d5acb2c8`. In contrast, fresh realtime health
evidence is:

```json
{"ok":true,"service":"closing-bell-realtime","build":"020b0f1af4bea51ed0daafb14527361406b5c2da"}
```

The response is HTTP 200 with `Cache-Control: no-store`, but this command
fails:

```sh
EXPECTED_BUILD_SHA=6381d5acb2c8a47437755275f21f799e661fefb7 \
  npm run verify:realtime-release
```

It reports: `Realtime release mismatch: expected 6381d5ac..., received
020b0f1a...`. Later candidate commits did not alter runtime server source, but
source equivalence is not an exact deployed-build identity and does not meet
the acceptance instruction to confirm the live deployment matches the
candidate.

## End-to-end game evidence

### Practice game

- `/` → **Try it with sample data** opened the active 90-second board in one
  click.
- Deterministic `/demo?duration=4` play bought two tin robots and reached
  **You met your goal** with a final ticket report.
- `/demo?duration=1` without the objective reached **The goal slipped away**
  and explained that two tin robots were required.
- **Play another round** restored 180 tickets and three zero holdings.
- Selling an unheld good explained “Buy one first.” Buying until tickets were
  insufficient left 36 tickets and explained “Sell a holding first.”
- Reload restored a bought holding and the demo sound setting using only
  `demo:closing-bell:run` in session storage. **Start for real** cleared demo
  state.
- Pointer/touch controls, keyboard Enter trading, Space pause, Escape resume,
  pause focus restoration, and persistent sound controls were exercised.

### Real shared game

- A fresh three-browser live room started at exactly 6:00. A host trade moved
  another browser's shared price from 46 to 48; host reload restored the held
  good. Empty names, four-character codes, unknown room codes, and selling an
  unheld good all produced corrective recovery messages.
- Full live room `UQFLR` ran from the title screen through the real six-minute
  bell. The scripted host bought its assigned Glowfruit objective and reached
  **You met your goal**. Both other browsers reached **The goal slipped away**;
  all three received final ticket reports.
- A second full live room, `YZ47B`, used a tin-robot goal. After its closing
  report, the host restarted. Injected assertions required all clients to see
  6:00 again and required the host to have 180 tickets and three zero holdings;
  the runner exited 0.
- An eight-seat live room accepted all eight seats, rejected seat nine with
  “This room already has eight players,” started at 360 seconds, serialized
  two concurrent buys from price 36 to 40, gave each buyer one holding, and
  rejected a forged seat token.
- A local production-server persistence boundary used an isolated temporary
  SQLite directory. After a real process stop/start, reconnect recovered the
  same playing room and holding.

### Rate limits

The observed live upgrade allowance is **20 WebSocket upgrades per IP per
one-second window**. Of 21 attempts, 20 upgraded and the over-limit request
received HTTP 429 with `Retry-After: 1`.

The connected-client allowance is **20 messages per socket per one-second
window**. Message 21 received an in-band `{status:429,retryAfter:1}` error and
the server closed with code 1013 and reason `429 Too Many Messages;
Retry-After=1`. HTTP headers cannot be added after a WebSocket has upgraded;
the required HTTP 429/header behavior is present at the upgrade endpoint.

## Accessibility, mobile, privacy, and performance

- The factory `verify-url.sh` passed `/` and `/demo`: title, `lang=en`, one h1,
  main landmark, labels/alt text, and no console errors.
- Fresh Playwright Axe scans at 390×844 found no serious or critical issue on
  `/`, `/demo`, `/privacy`, `/terms`, or an HTTP 404 route. Normal 390 px pages
  have no horizontal overflow; visible targets are at least 44 px tall.
- Keyboard focus uses a visible 4 px blue outline. The skip link, all trade
  controls, pause dialog, and route focus behavior worked. Reduced motion
  removed the preview transform.
- A fresh 390×844 DPR2 run under 4× CPU throttling measured 181 animation
  frames in 3007.5 ms: **60.18 FPS**.
- Fresh mobile Lighthouse on `/demo`: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 964 ms, CLS 0, TBT 74 ms, total transfer
  11,614 bytes.
- A complete demo request log contained only
  `https://closing-bell.sociobot.in`. Shared play added only the product-owned
  `wss://closing-bell-realtime.sociobot.in/`. There were no third-party
  scripts, fonts, analytics, ads, AI calls, payment calls, console errors, or
  page errors.
- HTML responses include HSTS, CSP, `nosniff`, strict referrer policy, and a
  restrictive permissions policy. HTML uses 30-second revalidation; hashed
  JS/CSS use one-year immutable caching. Internal links returned 200 and an
  unknown path returned the designed page with HTTP 404.
- This product has no sign-in and is not a PWA, library, or CLI. No service
  worker is registered and no offline claim is made.

## Defects by severity

### P0 — release blocking

1. **The realtime deployment does not identify as candidate `6381d5ac...`.**
   Static bytes match, but live authoritative health reports `020b0f1a...`,
   and the candidate's exact identity verifier fails. The complete deployed
   browser game therefore is not proven to be the requested candidate.

### P1 — release blocking

1. **The required 45-second private rumor stream is absent.** The researched
   brief requires each 45-second beat to include a public headline and a
   private rumor affecting the three goods. Live room `T5EKZ` changed its
   public headline between 6:00 and 5:15, but private text remained `Your goal:
   Finish with two Glowfruit.` Source implements public headline changes and
   hidden drift only; the private goal never becomes timed market information.
2. **The active game fails 200% text reflow at 390 px.** `/demo` grows from
   390 to 433 CSS px; `.timer` ends at x=433 and is clipped 43 px beyond the
   viewport. The root landing page reflows correctly. Evidence:
   `.factory/evidence/verification-4/live-demo-200-percent-text.png`.
3. **Claims coverage does not match the claims contract.** The
   `@claim:60-fps` test applies 4× CPU throttling but never sets the 390 px
   viewport required by its declared sandbox; Playwright therefore runs it at
   the desktop default. Independent mobile measurement proves the behavior,
   but the mandatory claim test does not. Public copy also makes unlisted
   promises including no analytics/ads/prizes/betting/financial advice and
   anonymous browser/server storage; no claim IDs map to and test those
   sentences as required by the attached claims contract.

## Evidence

- `.factory/evidence-first-screen-live.png`
- `.factory/evidence/verification-4/live-first-screen-mobile.png`
- `.factory/evidence/verification-4/live-demo-active.png`
- `.factory/evidence/verification-4/live-demo-win.png`
- `.factory/evidence/verification-4/live-demo-mobile.png`
- `.factory/evidence/verification-4/live-demo-200-percent-text.png`
- `.factory/evidence/verification-4/lighthouse-demo.json`
- `.factory/evidence/verification-4/verify-root/verify.json`
- `.factory/evidence/verification-4/verify-demo/verify.json`

