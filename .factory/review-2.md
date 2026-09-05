# Review the six-minute multiplayer market — review 2

**Verdict: PASS**

**Finding count:** 0

**Untested claim count:** 0

**Implementation candidate:** `9d1f3d75eb56afc3c3b439c815480f4d39e6dfb2`

**Documentation checkout:** `33da1f98d1a7bb541de1a7015ce6ffa2779d3c70`

**Realtime implementation:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`

**Live URL:** <https://closing-bell.sociobot.in>

Reviewed on 2026-09-05 UTC. This was an independent strict review from a
detached clean checkout of the implementation candidate. The researched brief
was supplied in the work order; `.factory/brief.json` is not present in this
checkout. No product code, deployment, or service configuration was changed.
The review created new anonymous test rooms through the public flow and did
not inspect or alter any existing room.

## First screen before scrolling

Fresh desktop and 390 px phone contexts both state the same information:

- Job: **“Trade goods together before the bell.”**
- Audience: **“For three to eight friends who want one six-minute market
  round.”**
- First action: **“Try it with sample data.”** The adjacent text says this
  starts a private 90-second practice round.

The three visible facts are no account, no real money, and free play. A
populated practice-market board is visible in the first phone and desktop
viewports, so the game appears before scrolling rather than behind a menu.
Both viewports had zero horizontal overflow and no console or page errors.

## Visual system

The implemented neo-brutalist market-board direction matches
`.factory/design.md`: warm paper, black rules, red urgency, blue actions, lime
state, tabular prices, and large labelled trade controls. The hand-built board
is recognisable at phone size and does not resemble a default framework page.
The generated market artwork has prompt and model provenance, stays within the
documented palette, appears only in product metadata, and is disclosed in the
footer. System fonts avoid third-party font requests. Motion is short and
functional, with a tested reduced-motion path.

## Declared claims

After `npm ci` in the detached candidate checkout, every exact command in
`.factory/claims.json` was run independently. All 11 passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS — the scripted practice run reached its winning report. |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS — restart restored 180 tickets and three zero holdings. |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS — reload, storage separation, request origins, and exit cleanup passed. |
| `ninety-second-demo` | `npm test -- --grep @claim:ninety-second-demo` | PASS — one click opened the active 1:30 market. |
| `online-authority` | `npm run test:server -- --test-name-pattern @claim:online-authority` | PASS — three seats shared checked price impact and reconnect state. |
| `timed-private-rumors` | `npm test -- --grep @claim:timed-private-rumors` | PASS — all three seats received the timed state and could not read another seat's private fields. |
| `six-minute-round` | `npm run test:server -- --test-name-pattern @claim:six-minute-round` | PASS — 360 seconds and the 3–8 seat limits were checked; the command exited normally. |
| `60-fps` | `npm test -- --grep @claim:60-fps` | PASS — the 390 px, 4× CPU result stayed inside the 50–70 FPS test range. |
| `text-reflow` | `npm test -- --grep @claim:text-reflow` | PASS — 200% text stayed inside 390 px and a trade completed. |
| `fictional-free` | `npm test -- --grep @claim:fictional-free` | PASS — a fresh player traded without an account or payment step. |
| `settings-persist` | `npm test -- --grep @claim:settings-persist` | PASS — the demo sound choice survived reload without writing the real mute key. |

The live pages and README were cross-checked against the inventory. No
missing, false, incomplete, or untested public claim was found. Each claim ID
maps to one tagged test. There are zero untested claims.

## Clean-checkout gates

- `npm ci`: PASS; 25 packages installed and zero vulnerabilities.
- `npm run lint`: PASS.
- `npm test`: PASS; 14 server tests and 20 browser tests.
- `npm run build`: PASS; `dist/` was produced.
- `npm audit`: PASS; zero vulnerabilities.
- Built JS is 19,329 bytes raw and 6.96 kB gzip. CSS is 12,021 bytes raw and
  3.20 kB gzip.

## Sample game and recovery

Live browser evidence, separate from the local claim suite:

- The first-screen sample action opened an already populated 90-second market
  with three goods, 180 tickets, a public headline, a private goal, and working
  trade controls.
- The **Demo — sample data, nothing is saved** label stayed present. A bought
  holding survived reload in the same tab. **Reset demo** returned 180 tickets
  and zero holdings.
- A seeded real-data key remained unchanged throughout demo use. **Start for
  real** removed all demo session keys and opened the room screen. The demo
  made only same-origin requests and opened no WebSocket.
- A deterministic two-second run bought two tin robots and reached **You met
  your goal**, with a final ticket report. A separate run reached **The goal
  slipped away**. **Play another round** restored the opening state.
- Selling an unheld good explained how to recover. Spending below the next
  purchase price explained that the player must sell a holding; selling then
  recovered normal play.
- The sound control changed to off, survived a live reload in demo storage,
  and did not create the real-mode mute key. Leaving demo cleared that state.
- With the room service taken offline after page load, creating a room showed
  a useful connection error. Restoring the network and retrying created a
  room normally.

## Live shared game

Three independent browser contexts, including a phone context, created room
`XL4DK`, joined it, and opened the market at 6:00. The host bought two units of
its assigned tin-robot goal. At 5:15 all three clients had received a timed
private rumor and shared price update. The authoritative clock then ran for
the full six minutes.

At the bell, the host received **You met your goal** and the other two clients
received **The goal slipped away**. Every client received a final ticket
report. This is fresh production evidence from entry through active play to
real win and loss screens, not an accelerated or mocked round.

Additional fresh live checks covered the advertised multiplayer boundaries:

- Room `98AFE`: a buy changed another client's shared price from 38 to 40;
  reloading the buyer restored one holding and the same active room.
- Room `ZP77Y`: eight independent clients joined, the ninth received **This
  room already has eight players**, and the host opened the market at 6:00.
- Room `D6JL5`: at 1:29, a Glowfruit buy changed the second client's shared
  price from 47 to 49. The decision loop therefore still accepts
  price-changing trades inside the final 90 seconds.
- Empty names and four-character room codes triggered native form validation
  and focused the invalid field. An unknown five-character code gave a clear
  correction.

The clean server suite separately proved room-code isolation, rejection of a
foreign seat token, authoritative insufficient-balance handling, a clean host
restart, and SQLite state recovery across an actual local server stop/start.
Production was not restarted during review.

## Backend and request limits

- Live health returned HTTP 200, `Cache-Control: no-store`, and identified
  `closing-bell-realtime` build `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`.
- `EXPECTED_BUILD_SHA=bfbbfb4… npm run verify:realtime-release`: PASS.
- `npm run verify:live-rate-limit`: PASS. Twenty of 21 WebSocket upgrades
  opened; the extra request received HTTP 429 with `Retry-After: 1`.
- Message 21 on an established socket received an in-band 429 with
  `retryAfter: 1`; the server then closed with its documented retry signal.
- The server uses its product-owned SQLite file. Local restart and room
  isolation tests passed without contacting another product or datastore.

## Accessibility, routes, privacy, and performance

- The factory URL verifier passed `/`, `/demo`, `/privacy`, and `/terms` for
  title, `lang=en`, one h1, main landmark, image alternatives, labelled
  buttons, and console cleanliness.
- Fresh Playwright Axe scans found zero serious or critical issues on those
  routes and a real missing URL. All visible controls measured at least 44 px
  high at 390 px.
- Keyboard checks covered the skip link, Enter trading, Space pause, Escape
  close, modal focus entry and return, and a visible 4 px blue focus outline.
- SPA navigation updated the title and canonical, focused and announced the
  route h1, and restored the root route correctly with browser Back.
- Reduced motion removed the preview transform. At 200% text on a 390 px
  viewport, document width stayed 390 px and a trade completed.
- `/privacy` and `/terms` load with route-specific titles and plain
  disclosures. The product has no account or identified profile, so there is
  no identity-backed privacy-request workflow to exercise.
- No service worker is registered and no offline or automatic-update claim is
  made. Shared play is correctly described as requiring a network connection.
- All discovered internal links returned 200. A missing path returned the
  designed page with HTTP 404, one h1, shared navigation, complete footer, and
  matching build label. The browser's expected failed-document message for
  the deliberate 404 is not an unexpected console defect.
- Security headers include CSP, HSTS, `nosniff`, strict referrer policy, and a
  restrictive permissions policy. Hashed JS and CSS use one-year immutable
  caching; HTML uses 30-second revalidation.
- Fresh phone-class rendering under 4× CPU throttling measured **60.28 FPS**.
  Fresh mobile Lighthouse on `/demo` scored 100 for Performance,
  Accessibility, Best Practices, and SEO; LCP was 921 ms, TBT 18 ms, CLS 0,
  and total transfer 12,005 bytes.

The product has no analytics, ads, payment calls, third-party fonts or scripts,
AI runtime feature, sign-in, public chat, real assets, or wagering. AI,
import/export, and sync would not improve the brief's short room-game job, so
the missed-leverage check found no product gap.

## Candidate and live comparison

Product source last changed at implementation candidate `9d1f3d7…`. Commits
after it only update factory evidence and handoff files. The live client shows
documentation build label `8a37244d0fe1`, while the current report checkout is
`33da1f9…`.

Building candidate `9d1f3d7…` with `VITE_BUILD_SHA=8a37244d0fe1` produced
files byte-for-byte equal to production:

| File | SHA-256 |
| --- | --- |
| `index.html` | `1b25cc49f906024e0ee426a27c77eefee3333432109f50d2756e2a549cce5ca0` |
| `index-DfmbzZnE.js` | `61d2d45ec5cc7c9bb8cf65f353a234d5e4ce3ed90b3aff5fc68d8d24f9d64f96` |
| `index-DYMhejC_.css` | `91343bd51a7394583d75ce369d4a20b142216f1c4f0443df30e6042326456bb6` |
| `404.html` | `c9c1be209a0859cd9aa3a4c3210cf327474df01f53c3e6657fddaed303904978` |
| `404.css` | `7e18a1673f3cc41dd2a8199e191999b7956f1148718d7673002e77cb29e11879` |
| `404-build.js` | `2590550fd82bc8186d8d429e6a28cb5b05b5a63c832cee8131a874d31577bcf9` |

The live static runtime is therefore the implementation candidate with its
later documentation label. The realtime source last changed at `bfbbfb4…`,
which live health reports exactly.

## Earlier finding disposition

| Earlier finding | Current evidence and disposition |
| --- | --- |
| Missing authoritative 3–8 player room game | Fixed. A fresh full production round, an eight-seat room, ninth-seat rejection, and server tests passed. |
| Browser/server trade protocol mismatch | Fixed. A live buy changed another client's price from 38 to 40. |
| Market lacked shared price impact, goal scoring, win/loss, or restart | Fixed. Live price impact and scored reports passed; clean tests prove both demo and host restart resets. |
| CSP errors and stuck countdown progress | Fixed. The semantic progress value changes without inline styles; normal-route error logs were empty. |
| Active state was lost on refresh | Fixed. Demo reload and a fresh live shared-seat reconnect restored holdings. |
| First screen was a menu wall or lacked one-click sample play | Fixed on fresh desktop and phone; the populated game preview and sample action are visible before scrolling. |
| Touch targets, 390 px overflow, and 200% text clipping | Fixed. Targets are at least 44 px; normal and 200% layouts stayed within 390 px and remained playable. |
| Missing h1, route titles, canonicals, route focus, correct 404, or full 404 shell | Fixed. Fresh route, focus, announcement, real HTTP 404, navigation, footer, and build-label checks passed. |
| Weak cache policy | Fixed. Hashed JS and CSS return one-year immutable caching. |
| Vulnerable production WebSocket dependency | Fixed. `npm audit` reports zero vulnerabilities. |
| Missing frame-rate claim and phone measurement | Fixed. The exact claim and fresh live 60.28 FPS measurement passed. |
| Sound setting had no sound or crossed storage namespaces | Fixed. The bell implementation is gesture-armed; live mute persistence and namespace isolation passed. |
| Missing or stale realtime identity | Fixed. Live health and the exact verifier identify `bfbbfb4…`. |
| Missing HTTP/in-band rate response | Fixed. Fresh upgrade and connected-client checks returned 429 with one-second retry guidance. |
| Missing 45-second private rumors | Fixed. All three live seats and the tagged protocol/browser checks received the update. |
| Unlisted or incomplete public claims | Fixed. Eleven current claims cover the public functional copy; every exact command passed. |
| Six-minute claim command hung | Fixed. The exact command exits normally after checking 360 seconds and the seat limits. |
| Rumor claim omitted seat three and private-field isolation | Fixed. The tagged test checks all three seats and every received private snapshot. |

## Evidence

Fresh review evidence is under `/work/.evidence/closing-bell-review-2/` and
includes first-screen, sample end, 200% text, 404, shared active, and shared
end screenshots; `live-qa.json`; `live-shared-run.json`; factory URL verifier
results; Lighthouse JSON; live static response copies; health headers; and the
live response body.

Required copies are `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`.

## Final decision

**PASS — 0 findings and 0 untested claims.**
