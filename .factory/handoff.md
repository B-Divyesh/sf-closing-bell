# Closing Bell review 1 handoff

## Status

Strict review verdict: **FAIL — 1 finding and 0 untested claims.**

- Implementation candidate: `2901a2c58613946e2884f3de6b7a81bffcf2ec55`
- Documentation checkout: `9fab156b256cc4b09060c69c4642b673cae2cd21`
- Live static build: `715dc82f1b5141f1358c7787ff4b9e275c54210f`
- Realtime implementation: `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`
- Live URL: <https://closing-bell.sociobot.in>
- Report: `.factory/review-1.md`
- Evidence: `.factory/evidence/review-1/`

No product code, deployment, service configuration, or existing room was
changed. The review created only new QA rooms. Demo checks left seeded real
storage unchanged.

## Finding to fix

The live static 404 correctly returns HTTP 404 and is usable, but it does not
use the mandatory shared site shell. Add the Rooms, Demo, and Privacy
navigation to its header. Add the product one-liner, Privacy, Terms, Built by
Param Factory, and build ID to its footer. Keep the page static, console clean,
and served with a real 404 status.

## What passed

- All 11 exact claim commands pass from a fresh clone.
- `npm run lint`, `npm test`, `npm run build`, and `npm audit` pass.
- The full suite reports 14 server tests and 20 browser tests passing.
- Fresh desktop and phone first screens show the job, audience, sample action,
  and market preview before scrolling.
- The one-click sample is populated, persistently labelled, isolated from real
  storage, resettable, and completes win, loss, reload, and restart paths.
- Three fresh clients completed live room `75KZE`; the host won, the other two
  clients lost, and all received timed private rumors and closing reports.
- Live rooms also passed invalid trading, cross-client price impact, reconnect,
  eight-seat acceptance, and ninth-seat rejection.
- Live health, realtime identity, upgrade/message 429 responses, cross-room
  isolation, and SQLite process restart persistence pass.
- Routes, legal pages, links, keyboard play, focus, reduced motion, 200% text,
  Axe, privacy traffic, headers, and caching pass apart from the 404 shell gap.
- Live phone-class rendering measured 60.21 FPS. Lighthouse scored
  100/100/100/100 with LCP 902.93 ms, TBT 24 ms, and CLS 0.
- The live static bytes exactly match a clean build of `715dc82…`; later
  commits are report/tooling-only. The live runtime is source-equivalent to
  candidate `2901a2c…`.

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

Run each `test` command in `.factory/claims.json` literally. The production
shared-round command takes about six minutes.

## Next step

Repair only the static 404 shell, add a regression assertion for the required
header/footer links and build label, deploy the static client, then rerun the
route/404 checks and claim gates.
