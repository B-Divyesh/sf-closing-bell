# Closing Bell repair 5 handoff

## Status

Repair checks pass. Both findings from `.factory/verification-5.md` are fixed.

- **Static implementation and test repair SHA:** `2901a2c58613946e2884f3de6b7a81bffcf2ec55`
- **Documentation and evidence SHA:** `ebcfb601cf94fdf7512dc74af195b69a5648fce3`
- **Realtime runtime SHA:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`
- **Static URL:** `https://closing-bell.sociobot.in`
- **Realtime URL:** `https://closing-bell-realtime.sociobot.in`

The realtime source did not change in this repair, so its healthy, previously
deployed image was not rebuilt. The static build was rebuilt at `2901a2c…`,
deployed, and matched byte-for-byte against the HTTPS files.

## What changed

- Made the realtime test service start lazily. A name-filtered run that selects
  no lifecycle tests no longer starts an unowned child process.
- Extended the timed-private-rumor browser claim to wait for all three seats,
  prove that each rumor changes, prove shared prices change in each view, and
  inspect each received server state for private-field isolation.
- Extended the deterministic server test to inspect the third seat and every
  other-seat record.
- Made the existing cold-live runner accept a separate evidence directory.
- Extended the full live-room runner to use desktop and phone clients, verify
  all three timed rumors, and capture active and end screens for every seat.

These checks assert player-visible and protocol outcomes. They do not inspect
source strings as a substitute for behavior.

## Finding disposition

| Verification 5 finding | Disposition |
| --- | --- |
| Six-minute claim command hangs after its assertion | Fixed. The exact command exits 0 in about 0.2 seconds after the matching assertion and zero-test files finish. |
| Private-rumor claim omits the third seat | Fixed. The tagged three-browser check asserts all three visible rumors, all three changed-price views, and private-field isolation in all three server snapshots. |

## Clean setup and claims

From this checkout:

```sh
npm ci
npm run lint
npm test
npm run build
npm audit
```

Results:

- `npm ci`: pass; 25 packages installed and zero vulnerabilities.
- Every one of the 11 commands in `.factory/claims.json`: pass exactly as
  written, each with a 90-second outer timeout.
- `npm run test:server -- --test-name-pattern @claim:six-minute-round`: pass
  and exit 0; Node reported about 201 ms.
- `npm test -- --grep @claim:timed-private-rumors`: pass with three independent
  browser contexts.
- `npm run lint`: pass.
- `npm test`: pass; 14 server tests and 20 browser tests.
- `npm run build`: pass; `dist/` produced.
- `npm audit`: pass; zero vulnerabilities.
- Built JS: 19.33 KB raw / 6.96 KB gzip.
- Built CSS: 12.02 KB raw / 3.20 KB gzip.

## Cold live checks

Fresh 1440×900 desktop and 390×844 DPR2 phone contexts loaded the HTTPS root
without saved state.

- Job: **Trade goods together before the bell.**
- Audience: **Three to eight friends who want one six-minute market round.**
- First action: **Try it with sample data.** The adjacent text explains the
  private 90-second practice round.
- The game preview, timer, public headline, three goods, tickets, and goal are
  visible on the first screen.
- There was no horizontal overflow, console error, or page error.

The one-click sample opened a populated 90-second board with three goods, 180
tickets, a public headline, and a two-tin-robot goal. The persistent demo label
remained after a trade and reload. Reset restored 180 tickets and zero
holdings. Start for real removed the demo namespace while a seeded real-data
key stayed unchanged. The complete sample request log used only the product
origin and opened no WebSocket.

The live practice flow also covered an invalid sell, a win, a loss, and an
immediate restart to 180 tickets and zero holdings.

## Full production round

Three independent fresh clients, including a 390×844 phone, played room
`JF6QR` through the production six-minute clock.

- All three seats received their first private rumor at 5:15.
- Seat 1 and seat 3 legitimately received the same deck entry; the product
  promises private delivery, not globally unique text.
- The host bought two assigned Glowfruit and reached **You met your goal**.
- The other two seats reached **The goal slipped away**.
- Every seat received a final ticket report.
- The first-update and end screenshot timestamps are 315.66 seconds apart,
  matching the remaining 5:15 of the six-minute round.

Screenshots and the structured result are in `.factory/evidence/repair-5/`.

## Accessibility, routes, privacy, and performance

- `verify-url.sh` passed the live root, demo, privacy, and terms routes.
- Playwright Axe found zero serious or critical issues on those routes and the
  designed HTTP 404 route.
- Every checked route had its own title, `lang=en`, one h1, a main landmark,
  canonical URL, zero horizontal overflow, and 44 px minimum visible targets.
- Keyboard checks covered the skip link, Enter trade, Space pause, Escape
  close, dialog focus return, and a visible 4 px blue focus outline.
- Reduced motion removed the market-preview transform.
- At 200% text on a 390 px screen, scroll width stayed 390 px and a trade
  completed.
- No service worker or offline claim is present.
- Fresh 390×844 DPR2 Chromium under 4× CPU throttling rendered 181 frames in
  3011.9 ms: **60.09 FPS**.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 834.2 ms, TBT 5 ms, CLS 0, transfer 12,019 bytes.

## Backend and deployment evidence

- Live health returned HTTP 200 with `Cache-Control: no-store` and exact
  realtime build `bfbbfb4…`.
- `EXPECTED_BUILD_SHA=bfbbfb4… npm run verify:realtime-release`: pass.
- `npm run verify:live-rate-limit`: pass; 20 upgrades opened and request 21
  returned HTTP 429 with `Retry-After: 1`. Message 21 returned in-band status
  429 with `retryAfter: 1`.
- Local server tests passed room isolation, invalid balance handling,
  untrusted-origin rejection, and actual SQLite process restart recovery.
- The live realtime app remains in single-revision mode with one minimum and
  one maximum replica. Its existing Azure File volume remains mounted at
  `/data`. No realtime configuration was changed.
- Live `index.html`, hashed JS, and hashed CSS SHA-256 values exactly matched
  the rebuilt `dist/`. The live footer reports build `2901a2c58613`.

## Earlier findings

The complete history in verification reports 1–5 was reviewed. The prior
multiplayer, protocol, CSP, persistence, win/loss, first-screen, mobile,
canonical, 404, cache, dependency, frame-rate, release identity, timed-rumor,
and 200% text findings remain fixed. The two remaining verification 5 test
findings are resolved above.

## Known gaps

None. Shared play intentionally needs a network connection; no offline support
is claimed.
