# Independent verification 3 — FAIL

**Candidate:** `020b0f1af4bea51ed0daafb14527361406b5c2da`  
**Production URL:** <https://closing-bell.sociobot.in>  
**Verified:** 2026-09-02 UTC from the candidate checkout

## Verdict

**FAIL — release blocking deployment identity mismatch.** The static client is
the candidate build, but its required product-owned realtime service reports
build `165a64c2158821296bd796efc53eec52ce0f4cd9`, not the candidate SHA. The
3–8 player authoritative game therefore is not evidenced as deployed from the
candidate commit. No product code was modified during verification.

## Required first read

PASS. A cold desktop load plainly says **“Trade goods together before the
bell”**, identifies **“three to eight friends”**, states a six-minute round,
and puts **“Try it with sample data”** first. Its adjacent explanation says it
starts a private 90-second practice round; the visible facts are no accounts,
no real money, and free to play. The same first screen contains a legible
practice-market board rather than only a menu.

## Clean-checkout gates

- `npm ci`: PASS — 25 packages installed; `npm audit`: 0 vulnerabilities.
- `npm run lint`: PASS (`tsc -b --pretty false`).
- `npm test`: PASS — 8 Node tests and 17 Playwright tests; Playwright's final
  result is recorded as `passed` in `test-results/.last-run.json`.
- `npm run build`: PASS and produced `dist/`.
- Exact production assets match the newly built candidate artifacts:
  `index-DY3Se9TF.js` SHA-256
  `66efd6be46940e629dd73642a01da14ebdec8922a18310a77e0d9d21b08bfa81`, and
  `index--OnCqnG7.css` SHA-256
  `a57e3fa41730b5a2cb68aafc8766b750bb6a7ca36db39a6069098a4f8dfdf8ee`.
- Bundle budget: JS 18.41 KB raw / 6.71 KB gzip; CSS 11.51 KB raw / 3.10 KB
  gzip.

## Claims

All nine literal commands in `.factory/claims.json` passed independently:

| Claim | Result |
| --- | --- |
| `reaches-bell` | PASS |
| `restart-resets` | PASS |
| `demo-isolation` | PASS |
| `ninety-second-demo` | PASS |
| `online-authority` | PASS |
| `six-minute-round` | PASS |
| `60-fps` | PASS |
| `fictional-free` | PASS |
| `settings-persist` | PASS |

## Live functional QA

- The canonical landing flow was played: `/` → **Try it with sample data** →
  active 90-second market → two Tin robot purchases → **You met your goal**.
  It ended with “You finished with 224 tickets” and no console/page errors.
- A deterministic live loss (`/demo?duration=1`) showed **The goal slipped
  away**; **Play another round** reset to 180 tickets and zero holdings.
- Invalid recovery worked: selling an unheld Glowfruit displayed “You do not
  hold Glowfruit yet. Buy one first.” An unknown five-character room code
  displayed a corrective error.
- Three independent live browser seats created room `H92QN`. Starting below
  three players was rejected. After all three joined, a host Buy changed the
  other player's Glowfruit price from 38 to 40; reloading the host restored
  `Held: 1`.
- Keyboard focus reached the skip link with a visible 4 px blue outline;
  reduced motion removed the preview transform. At 390×844, `/`, `/demo`,
  `/privacy`, `/terms`, and `/404` had one h1, no horizontal overflow, and no
  axe serious or critical findings. No console/page errors occurred.
- The local 4× CPU-throttled claim check passed its 50–70 fps requirement.

## Privacy, headers, caching, and limits

- The full demo request log contained only `https://closing-bell.sociobot.in`
  (HTML, the local JS, and CSS); no third-party request or WebSocket occurred.
- Live HTML and assets send HSTS, `X-Content-Type-Options: nosniff`, strict
  referrer policy, and a CSP limited to self plus the product-owned realtime
  WebSocket. The static client has the expected build `020b0f1af4be` in its
  footer.
- Hashed assets send `Cache-Control: public, max-age=31536000, immutable`;
  HTML uses 30-second must-revalidate caching. An unknown path returns the
  designed 404 with HTTP 404.
- A single client made 21 realtime upgrade attempts inside one second: 20
  opened and attempt 21 returned HTTP 429 with `Retry-After: 1`. Observed
  allowance: 20 upgrades/IP/second.
- No sign-in, PWA, library, CLI, analytics, payment flow, or external AI call
  is present.

## Deployment identity evidence

`GET https://closing-bell-realtime.sociobot.in/health` returned HTTP 200 with
`Cache-Control: no-store` and this body:

```json
{"ok":true,"service":"closing-bell-realtime","build":"165a64c2158821296bd796efc53eec52ce0f4cd9"}
```

That is not candidate `020b0f1af4bea51ed0daafb14527361406b5c2da`. The static
asset match does not establish that the authoritative backend used by the game
is at the candidate revision.

## Defects by severity

### P0 — release blocking

1. **Realtime deployment is stale.** Deploy `sf-closing-bell-realtime` from
   candidate `020b0f1af4bea51ed0daafb14527361406b5c2da` (including its
   `BUILD_SHA`) and repeat the health/build-identity and three-seat checks.

## Evidence

- `.factory/evidence/live-cold-desktop.png`
- `.factory/evidence/live-demo-mobile.png`
- `.factory/evidence/live-full-demo-end.png`
- `/tmp/closing-bell-live.headers`
