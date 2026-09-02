# Demo sandbox

Open `/demo` or `/?demo=1`. The active practice board appears immediately.
It starts with 180 tickets, three fictional goods, a fixed headline deck, and
a 90-second timer. The objective is to hold two tin robots at the bell.

The demo never opens the shared-room WebSocket. It stores its active run and
sound choice only in `sessionStorage` under `demo:closing-bell:run`. It does
not read or write the real room-seat or sound keys in `localStorage`.

Reload restores the active demo in the same tab. **Reset demo** replaces it
with a clean run. **Start for real** removes every `demo:closing-bell:*` key
before opening the shared-room screen.

For automated checks only, `/demo?duration=2` uses the same deterministic loop
with a two-second timer. The scripted claim test buys two tin robots, reaches
the win screen, and restarts.
