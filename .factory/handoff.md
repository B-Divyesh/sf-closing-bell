# Closing Bell repair 3 handoff

## Release status: PASS

The only release-blocking finding in verifier commit `7642b650fed9fb2927343aefc5347a77d3b0c705` was a stale authoritative realtime deployment. It has been reproduced, guarded by a regression test, and repaired without changing the already-approved static candidate.

## What changed

- Reproduced the P0 before repair: asking live `/health` to match candidate `020b0f1af4bea51ed0daafb14527361406b5c2da` failed because it returned stale build `165a64c2158821296bd796efc53eec52ce0f4cd9`.
- Added `server/release-identity.mjs`, fixture regression coverage, and `npm run verify:realtime-release`. The regression explicitly rejects the verifier's stale build when the candidate SHA is required. The command also requires `Cache-Control: no-store`.
- Added `npm run verify:live-shared-run`, a production runner that creates a real three-browser room, reads the authoritative host objective, buys two of that good, and verifies every browser's closing report after the actual six-minute server timer.
- Redeployed only the product-owned `sf-closing-bell-realtime` service from a detached checkout at exact commit `020b0f1af4bea51ed0daafb14527361406b5c2da`:

~~~sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh \
  closing-bell-realtime /tmp/closing-bell-candidate-020b0f1 Dockerfile 8080
~~~

The resulting image is `sociobotregistry.azurecr.io/sf-closing-bell-realtime:020b0f1af4be`; the service remains one replica with its existing `/data` Azure Files mount. The static client was already byte-matched to the requested candidate, so it was deliberately not redeployed from the later test-only repair commits.

## Verification

From a clean dependency install on 2026-09-02 UTC:

~~~sh
npm ci
npm run lint
npm test
npm run build
npm audit
~~~

- `npm ci`: 25 packages installed; zero audit vulnerabilities.
- `npm run lint`: passed.
- `npm test`: passed 11 Node checks and 17 Playwright checks. This includes the release-identity stale-build regression, three-seat authority/reconnect, scripted shared end/restart, keyboard, 390 px layout, route focus, local Axe, privacy, and update-worker checks.
- All nine literal commands in `.factory/claims.json` passed independently.
- `npm run build`: passed, producing `dist/`; JS is 18.41 KB raw / 6.71 KB gzip and CSS is 11.51 KB raw / 3.10 KB gzip.
- `npm audit`: zero vulnerabilities.

Live deployment evidence:

- `GET https://closing-bell-realtime.sociobot.in/health` returned 200, `Cache-Control: no-store`, and `{"ok":true,"service":"closing-bell-realtime","build":"020b0f1af4bea51ed0daafb14527361406b5c2da"}`.
- `EXPECTED_BUILD_SHA=020b0f1af4bea51ed0daafb14527361406b5c2da npm run verify:realtime-release` passed against live production.
- The deterministic live run completed in room `7XBPH`: three independent browsers reached their closing reports after the server's six-minute timer. The host bought two Tin robots and received **You met your goal**; both other browsers received closing reports with final tickets. Exact output: [repair-3-live-three-browser.json](evidence/repair-3-live-three-browser.json).
- `/opt/fleet/lib/verify-url.sh https://closing-bell.sociobot.in/demo` passed: 604 ms load, title/lang, one h1, main landmark, labels and alt text present, no console errors.
- Live Playwright Axe at 390×844 passed with no serious or critical issue on `/`, `/demo`, `/privacy`, `/terms`, and `/404`; each has one h1 and one main.
- A full live demo request log contained only `https://closing-bell.sociobot.in` and no console errors. The product registers zero service workers and makes no offline claim.
- Live static assets retain immutable cache, HSTS, CSP limited to self plus the product-owned realtime socket, strict referrer policy, and `nosniff`; realtime health uses `no-store`.

## Known limits

Shared rooms require a network connection. Practice play is isolated to the current tab, but the product is not an installable offline PWA. There are no accounts, payments, analytics, ads, real money, or external AI calls.
