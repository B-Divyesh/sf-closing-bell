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

The standard round is six minutes. A public headline arrives every 45 seconds;
early news makes small moves, while the final 90 seconds makes larger moves.
The app’s demo uses a 90-second rehearsal so one-click testing can reach the
bell; it is clearly labelled and has the same deterministic deck rules.

## Art direction and provenance

The hero illustration shows three fictional commodity crates on a condensed,
paper-textured trading floor with a closing bell, screen-printed in ink, red,
electric blue, lime, and plum. It contains no words, logos, brands, people, or
financial symbols. It is generated with the factory image tool on 2026-09-02,
then converted to WebP for the site. Generated imagery is disclosed in the
footer. Prompt sidecar: `public/assets/market-floor.prompt.json`.
