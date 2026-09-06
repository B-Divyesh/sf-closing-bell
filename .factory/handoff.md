# Closing Bell verification 8 handoff

## Status

Independent browser qualification 8 passed with zero findings and zero
untested claims. No product code, deployment, or service configuration changed.

- Product implementation: `9d1f3d75eb56afc3c3b439c815480f4d39e6dfb2`
- Documentation checkout reviewed: `df2212da73f92c775978f566c4f6f1a5b7fc7f97`
- Realtime implementation: `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`
- Live static build label: `8a37244d0fe1`
- Live URL: <https://closing-bell.sociobot.in>
- Full report: `.factory/verification-8.md`

No product code, deployment, or service configuration was changed. The review
created only fresh anonymous test rooms and did not inspect or alter existing
room data.

## What was verified

- Chromium 145.0.7632.6, Firefox 146.0.1, and WebKit 26.0 each completed a
  fresh desktop and 390px phone sample run through its end report. Keyboard,
  touch, reload/reset, isolated demo storage, and user-gesture audio start
  passed in all three engines.
- Chromium host, Firefox client, and 390px WebKit client completed room
  `2HQVM` through the real six-minute bell, including a 45-second update and
  three end reports. Firefox reload restored a real shared holding in separate
  room `GKKHA`.
- Live URL checks and live Axe Playwright scans passed. The standalone Axe CLI
  is unavailable only because its downloaded ChromeDriver requires Chrome 152
  while supplied Chromium is 145; the report records the worker limitation and
  the successful equivalent audit.

- Fresh desktop and 390 px phone first screens state the job, audience, and
  sample action, with the populated game preview visible before scrolling.
- All 11 exact claim commands passed from a detached clean candidate checkout.
- `npm run lint`, 14 server tests, 20 browser tests, `npm run build`, and
  `npm audit` passed.
- The live sample stayed labelled and isolated, reset cleanly, left seeded real
  data unchanged, and reached both win and loss reports with working restart.
- Three independent live clients completed room `6B8ZT` through the real
  six-minute bell. All received private updates and final reports.
- Live shared price impact, reconnect, the 1:29 late-trade path, eight seats,
  ninth-seat rejection, health, identity, and both 429 paths passed.
- URL verification, Axe, keyboard and route focus, touch targets, sound,
  reduced motion, 200% phone text, legal pages, links, and the designed HTTP
  404 passed.
- Live phone-class rendering measured 55.66 FPS. Lighthouse scored 100 in all
  four categories, with 916 ms LCP, 12.5 ms TBT, and zero CLS.
- A clean candidate build stamped with the live label matched the six main
  deployed files byte for byte.

## Run again

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

Every exact public-claim command is listed in `.factory/claims.json`.

## Evidence

Fresh evidence is under `/work/.evidence/closing-bell-verification-8/`. The required
report copy is `/work/.evidence/qa-report.md`; the machine verdict is
`/work/.evidence/qa-result.json`.

## Known gaps

None.
