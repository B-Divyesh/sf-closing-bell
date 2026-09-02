# Closing Bell

Trade fictional goods with 3–8 friends in one six-minute room-code game.
News and player trades move shared prices until the closing bell.

Each player gets a private holding goal. The end screen reports a win or loss,
final tickets, and a one-tap restart for the host.

The one-click demo at `/demo` starts a 90-second practice round. It uses an
isolated temporary state, survives reload in the same tab, and clears on exit.
The sound setting also survives a demo reload without entering real storage.

Closing Bell is free. It has no accounts, real money, prizes, betting,
analytics, ads, or financial advice.

## Run

Use Node 22 or newer.

~~~sh
npm ci
npm run dev -- --port 4173
npm run realtime
~~~

Open `http://127.0.0.1:4173/` for shared rooms. Open
`http://127.0.0.1:4173/demo` for the isolated sample.

The realtime service listens on port 8080. It stores room state in SQLite
under `DATA_DIR`, which defaults to `/data` in production.

## Verify

~~~sh
npm run lint
npm test
npm run build
npm audit
~~~

After each realtime deployment, prove that the live service is the exact
source revision that was released:

~~~sh
EXPECTED_BUILD_SHA=<git-sha> npm run verify:realtime-release
~~~

The suite covers the browser-to-server trade protocol, shared price impact,
reconnect, demo isolation, keyboard play, 390 px layout, route focus,
accessibility, response policy, rate limiting, release identity, and the full
title-to-end-screen loop. The fixed-step renderer targets 60 frames per second
and is measured under 4× CPU throttling.

Every public claim and its exact command is listed in
`.factory/claims.json`.

## Deployment

Build and deploy `dist/` to the `sf-closing-bell` static app. Deploy the
included Dockerfile to the product-owned `sf-closing-bell-realtime` service
with `/data` mounted. The production client connects only to
`wss://closing-bell-realtime.sociobot.in`.

## Privacy and limits

Practice play uses only the `demo:closing-bell:*` session namespace. Shared
rooms store an anonymous seat token in the browser and room state on the
product server. Shared play needs a network connection.

See `/privacy` and `/terms` for the user-facing policies.

## License

MIT. See [LICENSE](LICENSE).
