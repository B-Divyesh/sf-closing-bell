# Closing Bell visual system

## Direction

**Neo-brutalist utility.** Closing Bell is a short social market game, so it
uses the visual language of a noisy trading floor and a punched timecard: hard
black rules, paper surfaces, oversized numbers, and bright commodity colours.
It makes the closing countdown and the next trade obvious on a small phone.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| ink | `#171717` | text, borders, shadows |
| paper | `#f7f2e7` | page background |
| panel | `#fffdf7` | cards and controls |
| signal | `#e83d35` | bell, sell, urgency |
| signal text | `#a92a25` | accessible red text on paper |
| electric | `#1464d2` | buy, links, focus |
| lime | `#c9ed58` | gains and active states |
| plum | `#6a3c84` | third commodity |
| muted | `#5e5a52` | supporting copy |

The interface is deliberately single-mode: warm paper keeps the black type and
electric blue controls legible in the fast, playful setting.

## Type, space, and shapes

The display face is system `Arial Black`; body copy is system `Arial` /
`Helvetica`, so no remote font request is required. Headings use heavy,
compressed-feeling uppercase labels only where a market-board label is useful.
Body type starts at 16 px. Spacing follows an 8 px scale. Panels use 3 px black
borders and offset black shadows; the game price tiles use tabular figures.

## Interaction and motion

Buy and sell are big, labelled controls with instant confirmation. A newly
arrived headline pops once from the board and a price tick shifts one or two
pixels. The bell is a single short shake on round end. Under
`prefers-reduced-motion: reduce`, transitions, tick shifts, and the bell shake
are disabled. No flashing effect is used.

## Game arc

The standard shared round is six minutes. A public headline arrives every 45
seconds; late news makes larger moves. Buying raises that good's shared price
by two tickets, while selling lowers it by two. Each room derives a different
deterministic sequence from its room code and creation time. A player wins by
holding two units of their assigned good at the bell. The host can immediately
restart the group with clean balances and a new sequence.

The one-click demo starts an active 90-second rehearsal. It uses a fixed
headline deck and a two-tin-robot objective, so the complete decision, result,
and restart loop is easy to understand and automate. A 60 Hz fixed-step loop
keeps its timing stable; rendering pauses when the tab is hidden.

## Art direction and provenance

The first screen uses a hand-built HTML market board so the game is legible in
the product capture. The generated illustration shows three fictional crates
and a closing bell in the same ink, red, blue, lime, and plum palette. It is
used for the social preview and contains no words, brands, people, or financial
symbols. It was generated with the factory image tool on 2026-09-02. Generated
imagery is disclosed in the footer. Prompt and model metadata are recorded in
`public/assets/market-floor.png.json`.
