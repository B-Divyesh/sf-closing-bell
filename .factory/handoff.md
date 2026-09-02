# Closing Bell handoff

## Delivered

- A Vite + TypeScript browser game with a deterministic fixed-step market loop,
  three fictional goods, escalating news, private objectives, buy/sell feedback,
  automatic liquidation, closing report, pause, sound toggle, and replay.
- `/demo` is a 90-second seeded practice round with a persistent isolated demo
  banner and reset. `/demo?duration=2` exists only for automated verification.
- Local-only storage for mute and best scores, plus `/privacy`, `/terms`,
  `/404`, metadata, sitemap, security headers, mobile layout, keyboard paths,
  and reduced-motion handling.
- Original generated market-floor art. Source PNG, generation prompt sidecar,
  191 KB desktop WebP, 74 KB mobile WebP, and social crop are included.

## Verification

Run from a clean checkout:

```sh
npm install
npm test
npm run build
```

Verified on 2026-09-02:

- `npm test`: 5 passing Playwright tests, including the three claim tests,
  keyboard operation, and axe serious/critical accessibility check.
- `npm run build`: passes; `dist/index.html` is at the deploy root.
- Production bundle: JS 5.17 KB gzip; CSS 2.48 KB gzip. The responsive LCP art
  is 74 KB on mobile and 191 KB on desktop.
- Local Lighthouse run on `/demo`: accessibility 100, CLS 0.01. Its Chrome tab
  crashed during full-page screenshot capture after audits; the incomplete
  report recorded performance 89 and LCP 3.5 s in the container. Re-run on the
  deployment target before release for a stable performance number.

## Known gap / next step

The work order requests an authoritative online 3–8 player room. Static
deployment cannot host an authoritative WebSocket service, so this release is
an honest local practice table and does not imply cross-device play. Add a
product-owned WebSocket service with room state and server-side trade checks
before advertising a friend room-code mode. This is also needed to measure the
brief’s final-90-seconds and second-round retention targets.
