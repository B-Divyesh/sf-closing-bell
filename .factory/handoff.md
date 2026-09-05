# Closing Bell verification 6 handoff

## Status

Independent verification passed with **0 findings** and **0 untested claims**.

- Implementation candidate: `2901a2c58613946e2884f3de6b7a81bffcf2ec55`
- Documentation checkout tested: `715dc82f1b5141f1358c7787ff4b9e275c54210f`
- Realtime implementation: `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`
- Live URL: <https://closing-bell.sociobot.in>
- Full report: `.factory/verification-6.md`
- Evidence: `.factory/evidence/verification-6/`

No product code, deployment, or service configuration was changed. The demo
left a seeded real-storage key untouched; multiplayer checks created only new
QA rooms and did not read or change another room.

## What was verified

- All 11 exact claim commands pass from a fresh clone.
- `npm run lint`, `npm test`, `npm run build`, and `npm audit` pass.
- The full suite reports 14 server tests and 20 browser tests passing.
- Fresh desktop and phone first screens show the job, audience, sample action,
  and market preview before scrolling.
- The one-click sample is populated, persistently labelled, resettable,
  isolated from real storage, and completes win, loss, and restart paths.
- Three real clients completed production room `VXSNL`; all seats received a
  timed private rumor and final report. The host won and the other seats lost.
- A second live room proved cross-client price impact and reload recovery. A
  third accepted eight seats and rejected seat nine.
- Live health, exact realtime identity, HTTP 429/`Retry-After`, local SQLite
  restart persistence, and cross-room isolation pass.
- Live routes, legal pages, expected 404, keyboard use, focus, reduced motion,
  200% text, Axe, privacy traffic, link checks, and cache/security headers pass.
- Live phone-class rendering measured 60.23 FPS. Lighthouse scored
  100/100/100/100 with LCP 991.13 ms, TBT 25 ms, and CLS 0.
- The live static files exactly match a clean build of documentation checkout
  `715dc82…`. No runtime source changed after implementation `2901a2c…`.

## Run the verification

```sh
npm ci
npm run lint
npm test
npm run build
npm audit
EXPECTED_BUILD_SHA=bfbbfb4a69a1a279f7e247657c7303d355f38cb6 npm run verify:realtime-release
npm run verify:live-rate-limit
npm run verify:live-shared-run
```

Run each `test` command in `.factory/claims.json` literally for the independent
claims gate. The production shared-round command takes about six minutes.

## Known gaps

None. Shared play requires a network connection; the product does not promise
offline play.
