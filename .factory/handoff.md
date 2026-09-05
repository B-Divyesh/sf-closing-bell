# Closing Bell repair 6 handoff

## Status

The strict-review finding is fixed and deployed.

- Product implementation: `9d1f3d75eb56afc3c3b439c815480f4d39e6dfb2`
  (`fix: align static 404 build label`)
- Realtime implementation: `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`
  (unchanged by this static repair)
- Deployment target: <https://closing-bell.sociobot.in>
- Documentation evidence revision: `c5825b8886fb563c468b1144a6b834f9f739c104`
  (this later commit only identifies that report revision)

## What changed

- Added the shared Rooms, Demo, and Privacy navigation to the static 404 page.
- Completed the 404 footer with the product one-liner, Privacy, Terms, Param
  Factory credit, generated-art disclosure, and the same generated build ID
  shown on the app routes.
- Matched the game’s touch targets, focus treatment, responsive header, and
  neo-brutalist visual tokens on the 404 page.
- Replaced the old source/config-string 404 regression with a browser outcome
  test. It verifies the rendered shell at 390 px, follows Terms and Demo, and
  checks for console errors, overflow, and the same build ID as the app footer.
- Emit a CSP-safe `/404-build.js` during Vite builds so the static 404 uses the
  exact deployment revision without an inline script or a fixed placeholder.

## Verification

From a clean dependency install (`npm ci`), the final local gates passed:

```sh
npm run lint
npm test                 # 14 server tests and 20 browser tests
npm run build            # dist/ produced
npm audit                # 0 vulnerabilities
```

Every exact command in `.factory/claims.json` passed, including the eleven
claim commands for the practice end screen/restart/isolation, 90-second demo,
authoritative multiplayer, private rumors, six-minute/seat boundary, FPS,
text reflow, fictional free sample, and isolated sound setting.

The Static Web Apps emulator returned the designed page with HTTP 404 for an
unknown route. `verify-url.sh` passed `/`, `/demo`, `/privacy`, and `/terms`
with route titles, `lang`, one h1, main landmark, alt checks, and no page
errors. Playwright Axe found no serious or critical violations on those routes
or the 404. The standalone Axe CLI could not launch Selenium Chrome in this
container; the repository’s Playwright Axe integration is the successful
accessibility check used here.

Fresh production desktop and phone contexts showed:

- Job: **Trade goods together before the bell.**
- Audience: **Three to eight friends who want one six-minute market round.**
- First action: **Try it with sample data.** It opens the populated 90-second
  practice board in one click.
- The live sample kept its **Demo — sample data, nothing is saved** banner and
  reached **You met your goal** after two Tin robot trades.
- `https://closing-bell.sociobot.in/repair-6-missing` returned HTTP 404 with
  the completed header/footer, no horizontal overflow, and no accessibility
  violations. The browser’s network-status message for the intentional 404 is
  expected, not a page error.
- The final cold check showed `Build 9d1f3d75eb56` on desktop, phone, and the
  static 404. The live `/404-build.js` byte-matched the candidate build.

The live realtime identity and limits passed:

```sh
EXPECTED_BUILD_SHA=bfbbfb4a69a1a279f7e247657c7303d355f38cb6 npm run verify:realtime-release
npm run verify:live-rate-limit
```

The rate test observed 20 accepted upgrades, then HTTP 429 with
`Retry-After: 1`; the 21st connected message returned in-band status 429 with
`retryAfter: 1`.

The evidence-enabled production run used room `DBDHW` with three fresh client
contexts. All seats received the first timed private rumor. The host bought two
Glowfruit and reached **You met your goal**; the other two received
**The goal slipped away**; all three got final ticket reports. See
`.factory/evidence/repair-6/live-shared-run.json` and the active/end seat
screenshots.

## Earlier finding disposition

All pre-review findings remain covered by the final local suite and the live
production checks: authoritative 3–8 seat rooms, trade protocol/price impact,
timed private rumors, reconnect persistence, result/restart handling, demo
isolation, mobile/reflow, route metadata, caching, dependency audit, FPS,
sound setting isolation, and realtime release identity. The sole review-1
finding — missing shared navigation and complete footer on the deliberate 404
— is now fixed and checked locally and live.

## Evidence

`.factory/evidence/repair-6/` contains fresh live first-screen desktop/phone,
sample active/end, 404 phone, Axe summary, and three-client shared-round
evidence. The catalog description remains verb-first and is copied to
`/work/.evidence/catalog-description.txt`.

## Known gaps

None in the product. The standalone Axe CLI’s Selenium launcher is incompatible
with the container’s Chrome binary; the Playwright Axe integration passed and
is retained as the accessibility gate.
