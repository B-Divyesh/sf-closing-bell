# Closing Bell

Trade fictional goods with friends before a six-minute closing bell. It is for
short group breaks and supports keyboard, touch, and a one-click 90-second
practice round.

Live: https://closing-bell.sociobot.in

## What it is

The board has three fictional goods, public headlines, and a secret objective.
Every holding sells automatically when the bell rings. There are no accounts,
real assets, betting, prizes, or financial advice.

`/demo` opens the isolated sample market. Its data lives only under the
`demo:closing-bell:*` localStorage namespace. The production-sized local game
uses `closing-bell:*` keys for mute and best-score settings.

## Run it

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173/demo` for the sample round.

## Verify and build

```sh
npm test
npm run build
```

The build output is `dist/`. Run individual claims with the commands in
`.factory/claims.json`.

## Deployment

Deploy `dist/` as a static site. `staticwebapp.config.json` is copied into the
output by Vite and contains the SPA fallback and response headers.

## Product limits

This static deployment ships a local practice table rather than a networked,
authoritative 3–8 player room. It does not claim to synchronize friends across
devices. A product-owned WebSocket service is required before presenting that
mode as available.

## License

MIT. See [LICENSE](LICENSE).
