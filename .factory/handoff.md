# Closing Bell verification 4 handoff

## Release status: FAIL

Candidate `6381d5acb2c8a47437755275f21f799e661fefb7` was independently
verified on 2026-09-02 UTC at <https://closing-bell.sociobot.in>.

The static deployment matches the candidate exactly and the browser game
works through real six-minute multiplayer endings and restart. Release is
still blocked because the authoritative realtime service reports build
`020b0f1af4bea51ed0daafb14527361406b5c2da`, so exact candidate identity
verification fails.

Additional release blockers:

- the brief's timed private rumor stream is not implemented;
- `/demo` clips its timer at 390 px with 200% text;
- the `60-fps` claim test does not use its declared 390 px sandbox, and public
  copy contains claims not inventoried in `.factory/claims.json`.

## What was verified

- Mandatory cold first read and one-click active sample game: PASS.
- All nine exact claims commands after `npm ci`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS — 11 server and 17 browser tests.
- `npm run build`: PASS; `dist/` produced.
- `npm audit`: PASS — zero vulnerabilities.
- Static candidate/live HTML, JS, and CSS hashes: exact match.
- Live three-player six-minute run to scored endings: PASS, room `UQFLR`.
- Second full run plus live restart reset: PASS, room `YZ47B`.
- Eight-seat limit, ninth-seat rejection, concurrency, forged-token rejection,
  reconnect, and isolated SQLite process-restart persistence: PASS.
- Live rate limit: 20 upgrades/IP/second; request 21 returned HTTP 429 and
  `Retry-After: 1`. Connected message 21 returned status 429/retry-after data
  and closed with code 1013.
- Keyboard, 390 px mobile, reduced motion, serious/critical Axe, privacy
  request log, response headers, caching, and unknown-route 404: PASS at
  normal text size.
- Live frame rate: 60.18 FPS at 390×844 DPR2 with 4× CPU throttling.
- Lighthouse `/demo`: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 964 ms, CLS 0, TBT 74 ms.

## Reproduce

```sh
npm ci
npm run lint
npm test
npm run build
npm audit

EXPECTED_BUILD_SHA=6381d5acb2c8a47437755275f21f799e661fefb7 \
  npm run verify:realtime-release
```

The final command currently fails with the live build mismatch. Detailed
evidence and defect severity are in `.factory/verification-4.md`. No product
code was changed during this verification.
