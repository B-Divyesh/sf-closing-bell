# Independent verification 1 — FAIL

**Candidate:** `68d8e290379c1da90288512e4bdb45acd3c7b88b` (`fix: label query demo routes correctly`)

**URL tested:** <https://closing-bell.sociobot.in> on 2026-09-02 UTC.

## Verdict

**FAIL.** The live deployment is byte-for-byte the production build of the
candidate, so this is not a deployment-only failure. It cannot be accepted as
the researched product because it is a one-player, local-only practice table,
not the required authoritative 3--8 player room-code auction game. It also
has release-blocking runtime errors and loses an active round on refresh.

## First read

Cold desktop load showed **“Trade funny goods before the bell”**, then
**“For friends who want one lively market round with a clear ending.”** The
first action is **“Try it with sample data”**, explained as opening a
90-second practice round. This plainly explains what the game does, who it is
for, and what to click. The one-click demo is present. The captured first
viewport is primarily a landing/seat-selection screen rather than an active
market board; the active game is only reached after starting the round.

## Required claim tests from the clean checkout

`npm ci` completed. Each command in `.factory/claims.json` was run against
the shipped Vite demo entry point and passed:

| Claim | Command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS (1 test, 5.9 s) |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS (1 test, 5.6 s) |
| `local-only` | `npm test -- --grep @claim:local-only` | PASS (1 test, 3.8 s) |

The full local suite passed: `npm test` — 5/5 in 10.3 s. Exact production
build passed: `npm run build` — `dist/` produced. No lint command exists.
`npm audit --omit=dev` found no runtime dependency vulnerabilities (the full
development dependency audit reports one moderate and one high issue).

## Live deployment and product checks

- The live `index-BeCEMBqQ.js` SHA-256 was
  `61b71f306457212d68fe14e73a6b1f3ca9fcb370ffb36b8a63ac9dfe86c75ff5`,
  exactly matching `dist/` from the candidate. The live CSS hash also matched.
- `/`, `/demo`, `/privacy`, `/terms`, `/404`, `robots.txt`, and `sitemap.xml`
  returned HTTP 200.
- The title, `lang`, one h1, landmark main, self-hosted assets, alt text,
  keyboard start/trade, invalid sell and insufficient-ticket recovery, pause,
  mute persistence, and reduced-motion fallback were exercised.
- At 390 px, the page had no horizontal overflow. Keyboard Enter started the
  demo and Space bought Glowfruit. Focus outline measured 4 px. The end report
  appeared from `/demo?duration=2`; **Play another round** restored 180
  tickets and `Held: 0` for all goods.
- Live axe scan reported no serious or critical findings. Lighthouse mobile
  on `/demo` reported Performance 99, Accessibility 100, Best Practices 100,
  SEO 92; LCP 1.926 s, CLS 0, and 204,951 total transferred bytes. Built JS is
  5.17 KB gzip and CSS 2.48 KB gzip.
- Full live demo request logging observed only
  `https://closing-bell.sociobot.in`; no third-party request was made. The
  static site has no product server endpoint, so a rate-limit allowance is
  not applicable. It has no sign-in.
- Live document headers included HSTS, `nosniff`, strict referrer policy, and
  CSP. Hashed JS, CSS, and WebP assets were nevertheless served with only
  `Cache-Control: public, must-revalidate, max-age=30`, not immutable caching.

## Defects

### P0 — required multiplayer/authoritative product does not exist

The brief’s smallest useful product is a **3--8 player room-code auction game**
with an authoritative server preventing client-side trade tampering. The
candidate has no server, WebSocket, room, room code, player list, joining
flow, or shared state. Repository search found no `fetch`, `WebSocket`, API,
or server implementation; the README and existing handoff explicitly call it
“a local practice table rather than a networked, authoritative 3–8 player
room.” Therefore the primary real job-to-be-done cannot work end to end.

### P1 — live CSP errors occur during normal game play; countdown progress is broken

Starting a live game produces repeated browser console errors: the CSP
`style-src 'self'` blocks the inline `style="width:…"` on the progress fill.
This violates the no-console-errors gate. On `/demo?duration=4`, after 1.2 s,
the 1,090 px bar still had a 1,084 px (full) fill and inline `width:100%`.
The render loop changes only the timer text, never the fill width, so the
progress display remains full even aside from the CSP block.

### P1 — active rounds are not persisted or recovered after refresh

In the real-mode live game, buying one Glowfruit changed cash/holding to
`134`/`1`. Reloading returned to **Open the market**, with no cash or holding
elements. Only mute and final best score are stored. This fails the game
recovery requirement to save progress locally and avoid data loss on refresh.

### P1 — no win/loss evaluation or active-board first screen

The private objective is never evaluated. Every ending is the same score-only
closing report, with no win or loss condition or feedback on the stated goal.
The default captured first viewport is a landing hero and seat-selection
panel, not the active market board, contrary to the browser-game capture
requirement.

### P2 — touch targets below 44 px

At 390 px, the persistent demo-banner actions measure 98×32 and 102×32 px;
header navigation measures 44×38, 99×38, and 57×38 px. These are below the
44 px minimum for touch targets.

### P2 — cache policy and route canonical metadata fall short

Live hashed assets use `max-age=30` rather than long-lived immutable caching.
The published `dist/staticwebapp.config.json` lacks the root config’s asset
cache route because the duplicate public configuration overwrites it. Also
`/demo` retains the root canonical URL; Lighthouse consequently reports the
canonical audit as failing and SEO 92. Privacy and terms likewise do not set
their own canonical URL.

### P2 — required frame-rate claim/measurement is absent

There is no claim test for the required “60 fps on a mid-range phone” game
claim and no measured frame-rate result in the handoff. The available
Lighthouse run is not a frame-rate measurement.

## Evidence files

Screenshots and the Lighthouse JSON were captured outside the repository:
`/tmp/closing-bell-live-desktop.png`, `/tmp/closing-bell-live-mobile.png`, and
`/tmp/closing-bell-lighthouse.json`.
