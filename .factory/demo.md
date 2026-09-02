# Demo sandbox

Open `/demo` or `/?demo=1` for the practice market. It starts with 180 tickets,
three fictional goods, a fixed headline deck, and a 90-second round.

The demo uses the `demo:closing-bell:*` localStorage namespace. The persistent
banner’s **Reset demo** button clears its demo best score and starts fresh.
Demo mode never reads or writes the real-mode `closing-bell:*` namespace.

For automated checks only, `/demo?duration=2` makes the same deterministic
practice round last two seconds.
