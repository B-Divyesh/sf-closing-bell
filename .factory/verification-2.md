# Independent verification 2 — FAIL

**Candidate:** `7aedc445aeb9d8ed145b0900e45e6be07655104b`

**Production URL:** <https://closing-bell.sociobot.in>

**Verified:** 2026-09-02 UTC from a clean checkout

## Verdict

**FAIL.** The live static client matches the candidate build, but the primary
3–8 player game cannot trade: its Buy and Sell controls send WebSocket message
types the server rejects as `Unknown action.` The first screen also fails the
mandatory demo/capture contract, the 390 px room form is clipped, and the game
has no evaluated win/loss condition or shared-round restart.

This is not a deployment-only result. The browser/server protocol mismatch is
present in candidate source and reproduced on production.

## Mandatory first read

A cold desktop load says **“Trade fictional goods with friends”** and explains
that a player creates a room, shares a five-letter code, and trades until the
bell. It identifies friends as the audience and makes **“Create a room”** the
apparent first action.

The candidate nevertheless fails both mandatory first-screen checks:

- There is no **“Try it with sample data”** action on `/`; only a small **Demo**
  navigation link. The action with that label appears on `/demo`, and clicking
  it only reloads the same setup screen. Starting sample play requires another
  **Start the round** action far below it.
- The captured first screen is a room creation/join form, not the game itself.

At 390 px the cold page is 458 px wide. The two-column room form is clipped off
the right edge; screenshot evidence was captured at
`/tmp/closing-bell-cold-mobile.png`.

## Claims and clean-checkout gates

The literal pre-install probes could not load `ws` or Playwright. After the
required `npm ci`, every exact command listed in `.factory/claims.json` passed:

| Claim | Exact command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS — tagged browser test passed |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS — tagged browser test passed |
| `local-only` | `npm test -- --grep @claim:local-only` | PASS — tagged browser test passed |
| `online-authority` | `npm run test:server -- --test-name-pattern @claim:online-authority` | PASS — tagged raw-WebSocket test passed |

The `online-authority` test bypasses the shipped browser UI and sends
`{type:"trade"}` directly. It therefore does not detect the production client
sending `{type:"buy"}` or `{type:"sell"}`.

Other local gates:

- `npm ci`: PASS; 22 packages installed.
- `npm test`: PASS; 4 Node tests and 6 Playwright tests (10 total).
- `npm run build`: PASS; TypeScript and Vite produced `dist/`.
- No lint script exists.
- `npm audit --omit=dev`: FAIL; the production `ws` dependency has one high
  severity advisory covering memory disclosure and memory exhaustion.
- Full `npm audit`: FAIL; one moderate and two high findings.
- A container build could not be run because Docker is unavailable in the
  verifier container. Static production build and local server execution pass.

## Candidate/deployment identity

The deployed static files exactly match the candidate build:

| File | Candidate/live SHA-256 |
| --- | --- |
| `index.html` | `6972f59b230897cac2b79b12c56346e7e307976158807999cf051ff7f2754979` |
| `index-CAWrzDRI.js` | `2e82c0ed8fd5a125c7fe07a39f2c7918dd0d7a5965ce68806e991c1242d05c60` |
| `index-Dpg_52bs.css` | `aa02a1a38a33aeb5282748e80ce48b4b1d770afcc61adc841749f99ba1264c77` |

The realtime health endpoint returns HTTP 200 and
`{"ok":true,"build":"dev"}`. Its deployed revision cannot be tied to the
candidate. The Dockerfile sets `BUILD_SHA` only in the discarded build stage,
which explains the missing production identity.

## End-to-end game evidence

### Practice mode

A deterministic `/demo?duration=2` run went setup → active play → closing
report. It showed 180 starting tickets, a private goal, changing prices, and
Buy/Sell controls. The bell produced **“You finished with 180 tickets”**;
**Play another round** restored 180 tickets, zero holdings, and 0:02.

Normal and recovery paths also worked in practice mode: buying changed cash
and holdings, selling with no holding reported what to do, insufficient tickets
were rejected, pause focused its Resume control and Escape closed it, and mute
persisted across reload. The deterministic end screenshot is
`/tmp/closing-bell-demo-end.png`.

Practice mode still loses an active round on reload. Its banner says
**“nothing is saved”**, but it writes `demo:closing-bell:best` and the non-demo
key `closing-bell:mute`. **Start for real** left the demo best key behind.

### Shared mode

Three independent live browser contexts created room `N5W57`, joined, and
started the market. Clicking **Buy one Glowfruit** returned
**“Unknown action.”** Tickets stayed 180 and holdings stayed zero. Candidate
source binds each shared control to `type: "buy"`/`"sell"`, while the server
dispatches trades only when `type === "trade"`.

A separate live room `DUHR8` started at 6:00, restored the same seat after a
reload, and reached its finished DOM after six minutes. Thus the timer can
reach the bell, but the end has no restart/play-again control. The private
objective is never judged, and no win/loss result is shown. The run reached two
visible bell headings: the market headline and closing report.

The market is also not the brief's auction: player trades do not alter price or
interact with other players. Prices change only from timed headlines and drift.
Two independently created server rooms produced identical seed, headline,
prices, and objective sequence, so runs do not differ by deterministic deck as
promised by the brief.

SQLite persistence itself passed a restart boundary check: a raw, valid server
trade survived process stop/restart using the same temporary data directory and
reconnected with the same holding.

## Privacy, server limits, and headers

- The full live practice flow requested only
  `https://closing-bell.sociobot.in`; no third party or realtime socket was
  contacted.
- Static responses send HSTS, `nosniff`, strict referrer policy, and a CSP
  limited to self plus the product-owned realtime WebSocket.
- Hashed JS, CSS, and image responses use
  `Cache-Control: public, max-age=31536000, immutable`; HTML uses 30-second
  revalidation.
- The realtime upgrade allowance is 20 connections per IP per second. A
  25-connection burst produced 20 opens and five HTTP 429 responses, each with
  `Retry-After: 1`.
- The separately documented 20-message/second allowance does not meet the
  required HTTP response contract. A connected client sent 21 messages and
  received 20 normal errors plus one JSON `Too many messages` error, with no
  429 status or `Retry-After` metadata.
- No sign-in exists, so the Entra requirement is not applicable. This is not a
  PWA, library, or CLI.

## Accessibility, mobile, and performance

- `/`, `/demo`, `/privacy`, and `/terms` have `lang=en`, route titles,
  canonical URLs, a main landmark, keyboard reachability, and no serious or
  critical axe findings at 390 px.
- Keyboard traversal showed a designed 4 px blue focus ring. The pause dialog
  focused Resume and closed with Escape. Reduced motion changed transitions to
  0.01 ms, disabled smooth scroll, and left no active animations.
- The shared lobby/active screen has **zero `<h1>` elements**. SPA navigation
  to Demo leaves focus on `<body>` and does not announce or focus its heading.
  Footer links are only 16 px high.
- `/404` returns HTTP 200 and logs a CSP error because its inline stylesheet is
  blocked. An arbitrary unknown path returns the room landing page with HTTP
  200 rather than the designed 404.
- Built JS is 15.30 KB raw / 5.60 KB gzip; CSS is 9.44 KB raw / 2.64 KB gzip.
  The DPR2 mobile hero is 195.6 KB, within the 300 KB image budget.
- With a 390×844 DPR2 viewport and 4× CPU throttling, the live demo measured
  60.18 requestAnimationFrame callbacks/second over five seconds, LCP 392 ms,
  CLS 0.029, and no page/console errors during normal play. There is still no
  required FPS claim/test or builder-recorded mid-range-phone measurement.

## Defects by severity

### P0 — release blocking

1. **The real shared game's Buy and Sell controls do not work.** The shipped
   UI and server disagree on the WebSocket message type. The claim test misses
   this because it uses the server protocol directly.
2. **The researched game loop is not implemented as an auction and has no
   win/loss evaluation.** Trades never affect prices or other players; private
   objectives are never scored; every market uses the same deck/seed.

### P1 — release blocking

1. The mandatory first screen has no one-click sample-data action and shows a
   room form rather than the game. The `/demo` sample action is a self-link and
   does not start sample play.
2. Shared rounds have no restart action. Practice rounds lose active progress
   on refresh, and leaving demo does not discard demo data.
3. The 390 px landing layout overflows by 68 px and clips the primary room
   form.
4. The production server uses a high-severity vulnerable `ws` version.
5. The claims inventory omits advertised quantitative/mode/privacy claims,
   including 3–8 players, six minutes, the 90-second demo, demo-only storage,
   and required frame rate. The demo-only storage copy is false as written.
6. The designed 404 produces a CSP console error; arbitrary missing routes
   serve the product with HTTP 200.
7. The connected-message rate limit lacks the required 429 and `Retry-After`
   response, and realtime build identity is `dev`.

### P2

1. Shared lobby/play has no h1; SPA route changes do not focus/announce the new
   heading; footer links miss the 44 px target.
2. The Sound control persists but no game sound is implemented.

## Evidence locations

Verifier screenshots were captured outside the repository:

- `/tmp/closing-bell-cold-desktop.png`
- `/tmp/closing-bell-cold-mobile.png`
- `/tmp/closing-bell-live-demo-active-mobile.png`
- `/tmp/closing-bell-demo-end.png`
- `/tmp/closing-bell-live-shared-active.png`
