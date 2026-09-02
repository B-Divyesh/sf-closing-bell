# Demo sandbox

Open /demo or /?demo=1 for the practice market. It starts with 180 tickets,
three fictional goods, a fixed headline deck, and a 90-second round. It never
opens a WebSocket connection or reads a shared room.

The demo uses the demo:closing-bell:* localStorage namespace. Resetting the
demo removes its best score and starts fresh. Demo mode never reads or writes
the real room-seat namespace.

For automated checks only, /demo?duration=2 makes the same deterministic
practice round last two seconds. The real entry point / is the 3–8 player
room-code game; each shared seat is recovered through an anonymous local token.
