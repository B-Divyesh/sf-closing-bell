# Closing Bell

Trade fictional goods with 3–8 friends in one six-minute room-code market game.
Create a room, share its five-letter code, and trade before the closing bell.

There are no accounts, real money, prizes, betting, or financial advice. A
90-second practice market is available at /demo.

## Run

~~~sh
npm install
npm run dev
npm run realtime
~~~

Open http://127.0.0.1:5173 for shared rooms or /demo for the isolated sample.
The WebSocket server listens on port 8080 and uses SQLite under /data when
deployed. Locally it falls back to ./closing-bell.db.

## Verify

~~~sh
npm test
npm run build
~~~

npm test covers server-side trade checks, three-player start, reconnect and
reload recovery, a deterministic game ending, the CSP-safe countdown, demo
claims, keyboard operation, and accessibility. dist/ is the static client
build. Run individual claims with commands in .factory/claims.json.

## Deployment

Deploy dist/ as the static client and deploy the included Dockerfile as the
product-owned sf-closing-bell-realtime WebSocket service with /data mounted.
The production client connects only to wss://closing-bell-realtime.sociobot.in;
CSP explicitly permits that origin.

## Privacy

The practice demo uses only demo:closing-bell:* browser keys and never calls
the room service. Shared rooms retain only room state and anonymous seat tokens
so a player can reconnect after refresh. Closing Bell has no analytics, ads,
or account system.

## License

MIT. See [LICENSE](LICENSE).
