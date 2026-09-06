# Review the six-minute multiplayer market — review 3

**Verdict: PASS**

**Finding count:** 0

**Untested claim count:** 0

**Implementation candidate:** `9d1f3d75eb56afc3c3b439c815480f4d39e6dfb2`

**Documentation checkout reviewed:** `9889eec8f468fa096d2fb359107cc6a49804a5d3`

**Realtime implementation:** `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`

**Live static build label:** `8a37244d0fe1`

**Live URL:** <https://closing-bell.sociobot.in>

Reviewed on 2026-09-06 UTC. This was a fresh strict review of the live phone
and desktop product plus a detached clean checkout of the implementation
candidate. The researched brief came from the work order; `.factory/brief.json`
is not present. No product code, deployment, service, existing room, or real
user data was changed. The review created only new anonymous test rooms.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 phone contexts state the job, audience, and
first action in plain words:

- Job: **Trade goods together before the bell**.
- Audience: **For three to eight friends who want one six-minute market
  round.**
- First action: **Try it with sample data**. The adjacent text says it starts a
  private 90-second practice round.

The visible facts are no account, no real money, and free play. The populated
practice board is visible in both initial viewports with a timer, headline,
three goods, 180 tickets, and the two-robot goal. It is the game, not a menu
wall. Both layouts stayed within their viewport and logged no errors.

The live neo-brutalist market board matches `.factory/design.md`: warm paper,
hard black rules, red urgency, blue actions, lime state, large prices, and
labelled controls. The identity is product-specific, uses system fonts, and
loads no third-party font or script.

## Declared claims

After `npm ci` in a detached checkout at the implementation candidate, every
exact command in `.factory/claims.json` ran independently. All 11 passed. Each
claim ID occurs on exactly one tagged test.

| Claim | Exact command | Result |
| --- | --- | --- |
| `reaches-bell` | `npm test -- --grep @claim:reaches-bell` | PASS — the scripted practice game reached a scored win report. |
| `restart-resets` | `npm test -- --grep @claim:restart-resets` | PASS — restart restored 180 tickets and zero holdings; the server suite also checked host restart. |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS — reload, storage separation, same-origin requests, and exit cleanup passed. |
| `ninety-second-demo` | `npm test -- --grep @claim:ninety-second-demo` | PASS — one click opened the populated 1:30 game. |
| `online-authority` | `npm run test:server -- --test-name-pattern @claim:online-authority` | PASS — three clients shared checked price impact and reconnect state. |
| `timed-private-rumors` | `npm test -- --grep @claim:timed-private-rumors` | PASS — all three seats received the timed state and could not read another seat's private fields. |
| `six-minute-round` | `npm run test:server -- --test-name-pattern @claim:six-minute-round` | PASS — 360 seconds and the 3–8 seat limits were checked; the command exited normally. |
| `60-fps` | `npm test -- --grep @claim:60-fps` | PASS — the 390 px, 4× CPU result stayed inside 50–70 FPS. |
| `text-reflow` | `npm test -- --grep @claim:text-reflow` | PASS — 200% text stayed within 390 px and a trade completed. |
| `fictional-free` | `npm test -- --grep @claim:fictional-free` | PASS — a new player traded without an account or payment step. |
| `settings-persist` | `npm test -- --grep @claim:settings-persist` | PASS — demo sound state survived reload without entering real storage. |

The live pages, README, legal pages, demo guide, and 404 were cross-checked
against the inventory. No missing, false, incomplete, or untested public claim
was found.

## Clean-checkout gates

- `npm ci`: PASS; 25 packages installed and zero vulnerabilities.
- `npm run lint`: PASS.
- `npm test`: PASS; 14 server tests and 20 browser tests.
- `npm run build`: PASS; `dist/` was produced.
- `npm audit`: PASS; zero vulnerabilities.
- Built JS is 19,329 bytes raw and 6.96 kB gzip. CSS is 12,021 bytes raw and
  3.20 kB gzip.

## Sample game and recovery

Fresh live browser checks, separate from the local suite, covered these paths:

- The first-screen action opened an active 90-second game with 180 tickets,
  three fictional goods, a headline, a private goal, a rumor area, and working
  trade controls.
- **Demo — sample data, nothing is saved** stayed visible after play and
  reload. A holding survived reload. **Reset demo** restored 180 tickets and
  three zero holdings.
- A seeded real-data key stayed unchanged. The demo opened no WebSocket and
  requested only `closing-bell.sociobot.in`. **Start for real** removed every
  demo key and kept the seeded real key unchanged.
- A deterministic phone run bought two tin robots and reached **You met your
  goal** with 186 tickets. Another run reached **The goal slipped away** with
  180 tickets. **Play another round** reset each end state.
- Selling an unheld good explained that the player must buy one first. Spending
  to the ticket boundary explained that a holding must be sold; selling then
  restored normal play.
- Keyboard Enter traded. Space opened the pause dialog, focus entered it, and
  Escape returned focus to Pause. Touch controls worked at phone size.
- Sound-off survived reload. Instrumented live runs confirmed one bell start
  when enabled and none when muted.
- Taking the room service offline produced a clear connection message.
  Restoring the connection and retrying created room `AEF3R`.

## Live shared game

Three independent production browser contexts, including a 390×844 phone,
created room `6B8ZT` and opened at 6:00. The host bought two weather vanes for
its assigned goal. All clients received timed private-rumor and shared-price
updates. The authoritative clock ran through the actual six-minute bell.

The host reached **You met your goal**. Both other seats reached **The goal
slipped away**. Every seat received a final ticket report. Screenshots record
the active and end states for all three real clients.

Additional fresh live rooms covered normal, invalid, boundary, and recovery
paths:

- Room `K8W86` rejected a start below three seats, opened at 6:00 after three
  joined, changed another client's Glowfruit price from 36 to 38 after a buy,
  and restored the buyer's holding after reload.
- At 1:29 in that same production room, a weather-vane buy changed another
  client's shared price from 81 to 83. Price-changing play therefore remained
  available inside the final 90 seconds.
- Room `BQA8Q` accepted eight independent clients, rejected seat nine with
  **This room already has eight players**, and opened at 6:00.
- Empty names and four-character codes focused the invalid field with native
  explanations. Unknown code `ZZZZZ` returned **Room code not found. Check the
  five characters and try again.**

The clean server suite also proved foreign-token and room isolation,
authoritative insufficient-balance handling, clean host restart, and SQLite
room recovery across an actual local process stop and start.

## Backend and request limits

- Live health returned HTTP 200 with `Cache-Control: no-store` and identified
  `closing-bell-realtime` build `bfbbfb4a69a1a279f7e247657c7303d355f38cb6`.
- `EXPECTED_BUILD_SHA=bfbbfb4… npm run verify:realtime-release`: PASS.
- `npm run verify:live-rate-limit`: PASS. Twenty of 21 WebSocket upgrades
  opened; the extra upgrade returned HTTP 429 with `Retry-After: 1`.
- Message 21 on an established socket received an in-band 429 with
  `retryAfter: 1` and clear one-second retry text.
- The product uses its own SQLite data path. Local isolation and restart tests
  passed without connecting to another product or shared datastore.

## Accessibility, routes, privacy, and performance

- The factory URL verifier passed `/`, `/demo`, `/privacy`, and `/terms` for
  HTTP 200, title, `lang=en`, one h1, main landmark, alternatives, labels, and
  console cleanliness.
- Fresh Playwright Axe scans found zero serious or critical issues on those
  routes and on a real missing route. The single documented light treatment
  passed automated contrast checks.
- The skip link was first, visible when focused, and its next Tab target was
  the first game action rather than header navigation. Focus uses a 4 px blue
  outline. All visible phone controls were at least 44 px high.
- SPA navigation updated title and canonical, focused and announced the new
  h1, and restored root title and focus with browser Back.
- Reduced motion removed the preview transform. At 200% text on 390 px, the
  document stayed 390 px wide and remained playable.
- Privacy and Terms returned 200 with route-specific titles and plain text.
  There is no account or identified profile, so no identity-backed privacy
  request path is advertised or applicable.
- No service worker is registered and no offline or automatic-update claim is
  made. Shared play accurately requires a connection and recovered after the
  tested outage.
- Every discovered internal link returned 200. A missing URL returned the
  designed page with HTTP 404, one h1, shared navigation, complete footer, and
  a route back. That deliberate 404 is expected, not a console defect.
- CSP, HSTS, `nosniff`, strict referrer policy, and a restrictive permissions
  policy were present. Hashed assets use immutable caching; HTML revalidates.
- Fresh live phone-class rendering at 390 px under 4× CPU throttling measured
  167 frames in 3000.3 ms, or **55.66 FPS**, inside the declared 50–70 range.
- Fresh mobile Lighthouse scored 100 for Performance, Accessibility, Best
  Practices, and SEO. LCP was 916 ms, TBT 12.5 ms, CLS 0, and total transfer
  11,999 bytes.

There are no analytics, ads, payment calls, remote fonts, third-party scripts,
AI runtime calls, sign-in, public chat, real assets, or wagering. Import,
export, sync, or AI would not improve this short room-game job, so the
missed-leverage review found no gap.

## Candidate and live comparison

Product source last changed at implementation candidate `9d1f3d7…`. Changes
through documentation checkout `9889eec…` only add review evidence and handoff
documents. Building the candidate with `VITE_BUILD_SHA=8a37244d0fe1` produced
the six main live files byte for byte:

| File | SHA-256 |
| --- | --- |
| `index.html` | `1b25cc49f906024e0ee426a27c77eefee3333432109f50d2756e2a549cce5ca0` |
| `index-DfmbzZnE.js` | `61d2d45ec5cc7c9bb8cf65f353a234d5e4ce3ed90b3aff5fc68d8d24f9d64f96` |
| `index-DYMhejC_.css` | `91343bd51a7394583d75ce369d4a20b142216f1c4f0443df30e6042326456bb6` |
| `404.html` | `c9c1be209a0859cd9aa3a4c3210cf327474df01f53c3e6657fddaed303904978` |
| `404.css` | `7e18a1673f3cc41dd2a8199e191999b7956f1148718d7673002e77cb29e11879` |
| `404-build.js` | `2590550fd82bc8186d8d429e6a28cb5b05b5a63c832cee8131a874d31577bcf9` |

The live static runtime is therefore the reviewed implementation with a later
documentation label. Live health identifies the unchanged realtime source.

## Earlier finding disposition

| Earlier finding | Fresh disposition |
| --- | --- |
| Missing authoritative 3–8 player room game | Fixed. Fresh real three-client play, eight-seat acceptance, ninth-seat rejection, and server tests passed. |
| Browser/server protocol mismatch or missing shared price impact | Fixed. Live cross-client trades changed prices by two tickets at opening and 1:29. |
| Missing goal scoring, win/loss, end report, or restart | Fixed. Fresh live win/loss reports and demo reset/restart passed; the server suite checked host restart. |
| CSP errors or stuck countdown progress | Fixed. Normal live routes were console-clean and the game clock reached the bell. |
| Active state lost on refresh | Fixed. Fresh demo and shared-room reloads restored holdings. |
| First screen was a room form or lacked one-click sample play | Fixed. Fresh phone and desktop first screens show the game preview and sample action. |
| Touch targets, 390 px overflow, or 200% text clipping | Fixed. Fresh target measurements and normal/200% layouts passed. |
| Missing titles, canonical URLs, one h1, route focus, or correct 404 | Fixed. Fresh direct, SPA, Back, Axe, and real HTTP 404 checks passed. |
| Static 404 omitted shared navigation or footer | Fixed. The live 404 has Rooms, Demo, Privacy, Terms, product text, factory credit, and build ID. |
| Weak asset caching | Fixed. Live hashed JS and CSS use one-year immutable caching. |
| Vulnerable WebSocket dependency | Fixed. Fresh `npm audit` reported zero vulnerabilities. |
| Missing or incomplete frame-rate claim | Fixed. The exact claim and fresh live 390 px/4× CPU measurement passed. |
| Sound did not work or crossed storage namespaces | Fixed. Live bell on/off behavior and isolated persistence passed. |
| Missing or stale realtime identity | Fixed. Health and the exact identity verifier report `bfbbfb4…`. |
| Missing HTTP or in-band rate-limit response | Fixed. Both returned 429 with one-second retry guidance. |
| Missing 45-second private rumors | Fixed. The real full round and complete three-seat tagged test passed. |
| Unlisted or incomplete claims | Fixed. Eleven current claims cover the public functional copy, each has one tag, and every command passed. |
| Six-minute claim command hung | Fixed. The exact command exited normally after checking duration and seat bounds. |
| Rumor claim omitted seat three or private-field isolation | Fixed. The tagged test checks all clients and every private snapshot. |

## Evidence

Fresh screenshots, structured browser results, exact claim logs, gate logs,
URL-verifier results, Lighthouse output, live multiplayer results, response
headers, health output, and candidate/live hashes are in
`/work/.evidence/closing-bell-review-3/`.

The required copies are `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`.

## Final decision

**PASS — 0 findings and 0 untested claims.**
