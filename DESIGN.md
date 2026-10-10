# Automailr design

The system behind every page of Automailr. Chosen by a blind bake-off on
2026-10-10 (`design/bakeoff/`): direction A's layout,
type and white/charcoal neutrals, with C's ink blue as the one accent.
Tokens live in `src/index.css`; this file explains them.

## What it should feel like

A well-made tool, not a template. Bright canvas, confident type, one blue.
The product itself is the argument: real CSV rows turning into real emails,
real limits in big numerals. Nothing shimmers, glows or floats.

References: Wise (heavy numerals, surface contrast instead of shadows, one
dark inverted block), Supabase (white canvas, one scarce accent, the UI as the
pitch), Cal (real product fragments inside marketing cards), IBM Carbon /
Vercel (the ink blue, kept at screen hue ~210°, well clear of purple).

## Colour

Light values on `:root`, dark on `.dark`. Every pair below is ≥ 4.5:1 in both
themes; accent fills carry white text in light (6.7:1) and dark text in dark
(7.8:1).

| Token | Job | Light | Dark |
|---|---|---|---|
| `bg` | page canvas | `oklch(0.985 0.002 190)` #f9fafa | `oklch(0.165 0.006 220)` #0c0f10 |
| `surface` | cards, inputs, bars | `oklch(1 0 0)` #ffffff | `oklch(0.205 0.007 220)` #141819 |
| `surface-2` | toolbars, hover, disabled fills | `oklch(0.965 0.004 190)` #f1f4f4 | `oklch(0.235 0.008 220)` #1a1f21 |
| `line` | every border | `oklch(0.915 0.005 190)` #dfe4e3 | `oklch(0.29 0.008 220)` #272c2e |
| `line-strong` | hover borders, idle stepper dots | `oklch(0.62 0.01 200)` #808888 | `oklch(0.55 0.01 220)` #6b7376 |
| `ink` | headings, body | `oklch(0.2 0.012 220)` #10171a | `oklch(0.95 0.004 190)` #ecefef |
| `ink-2` | secondary copy, icons | `oklch(0.38 0.012 220)` #3c4447 | `oklch(0.82 0.006 200)` #c0c5c5 |
| `ink-3` | labels, hints, captions | `oklch(0.5 0.01 220)` #5d6567 | `oklch(0.7 0.008 210)` #99a0a1 |
| `accent` | primary button fill, current step | `oklch(0.47 0.15 255)` #0859ac | `oklch(0.72 0.12 250)` #67aaed |
| `accent-hover` | hover on the above | `oklch(0.42 0.14 255)` #004b97 | `oklch(0.77 0.11 250)` #7cb9f8 |
| `on-accent` | text on accent | `oklch(0.99 0.002 250)` #fbfcfd | `oklch(0.17 0.012 258)` #0c1015 |
| `accent-ink` | links, tokens, focus ring | `oklch(0.47 0.15 255)` #0859ac | `oklch(0.76 0.11 250)` #79b6f4 |
| `accent-soft` | token / chip tint, selection | `oklch(0.935 0.025 250)` #ddebfa | `oklch(0.29 0.05 255)` #1a2c44 |
| `pos` / `pos-soft` | success text / tint | #137738 / #dcf7e1 | #5dc879 / #122d19 |
| `neg` / `neg-soft` | error text / tint | #c22826 / #ffe7e4 | #f97770 / #421c18 |
| `invert-*` | the one dark block (privacy promise) | bg #10171a, ink #ecefef, muted #acb3b3, line #2d3436, accent #67aaed | surface-2 tones |

Rules:
- One accent. Blue is for the primary action, the current step, links and
  `{{tokens}}`. It never tints a section background.
- Green and red are state only (email column found, a field is empty, a send
  failed). Errors always carry an icon and words, never just the colour.
- Depth comes from `surface` on `bg` and 1 px `line` borders. The only
  shadow is `shadow-elev`, for the hero product card and popovers.
- The dark theme is designed, not inverted: surfaces step up in lightness,
  the accent lightens and takes dark text.
- No purple, no gradients, no glass, no glow, no aurora.

Realtime Colors previews:
[light](https://www.realtimecolors.com/?colors=10171a-f9fafa-0859ac-dfe4e3-0859ac&fonts=Archivo-Geist),
[dark](https://www.realtimecolors.com/?colors=ecefef-0c0f10-67aaed-272c2e-67aaed&fonts=Archivo-Geist).

### Using the tokens

Tailwind utilities: `bg-bg`, `bg-surface`, `bg-surface-2`, `border-line`,
`text-ink`, `text-ink-2`, `text-ink-3`, `bg-accent text-on-accent`,
`text-accent-ink`, `bg-accent-soft`, `text-pos`, `bg-neg-soft`,
`bg-invert-bg text-invert-ink`, `shadow-elev`.

The shadcn names (`bg-background`, `text-primary`, `text-muted-foreground`,
`border-border`, `ring-ring`…) are aliases onto the same values so the Radix
primitives in `src/components/ui/` work. New code uses the direction names.

## Type

| Role | Face | How |
|---|---|---|
| Display | **Archivo** (variable, width axis) | 750–850 weight, 104–118% width, tight tracking. Headlines, step numerals, limits, the wordmark. |
| UI and body | **Geist** (variable) | 400 body, 500–650 labels and buttons. 16 px / 1.55 body. |
| Data | **Geist Mono** (variable) | `{{tokens}}`, CSV cells, counts, file sizes. |

Self-hosted through Fontsource (`@fontsource-variable/archivo/wdth.css`,
`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`), imported in
`src/main.tsx`. No Google Fonts; the CSP `font-src` is `'self'`.

Utilities: `font-display`, `font-sans`, `font-mono`; `heading` (800 / 104% /
-0.03em / 1.05, balanced wrap) for h1–h2; `numeral` (850 / 112% / -0.04em /
tabular) for the numbers that carry meaning; `num` for tabular figures
anywhere. Width beyond the defaults: `font-stretch-[118%]`.

Scale (desktop → phone with `clamp`):
- Hero h1 `clamp(2.6rem, 1.6rem + 3vw, 4.4rem)`, line-height 0.98,
  tracking -0.035em, width 106 %, `max-width: 13ch`
- Page h1 (wizard) `clamp(1.7rem, 1.3rem + 1vw, 2.2rem)`
- Section h2 `clamp(2rem, 1.3rem + 2vw, 3.1rem)`, line-height 1.02
- Card h3 1.45rem at 750 / 104%
- Big numerals `clamp(2.8rem, 1.7rem + 2.6vw, 4.4rem)`
- Body 16 px, secondary 15–15.5 px, hints and captions 13.5–14 px

Sentence case everywhere. Numbers get a thin space before units (`25 MB`,
`250 ms`) and never wrap.

## Shape, space, elevation

- Radius ladder: `rounded-sm` 8 (chips, toolbar buttons, tokens 6),
  `rounded-md` 12 (buttons, inputs, editor box), `rounded-lg` 16 and
  `rounded-xl` 22 (cards), `rounded-2xl` 28 (hero product card), `rounded-full`
  for stepper dots and avatars.
- Control heights: 36 (toolbar, chips), 38 (small button), 44 (button, input),
  52 (large CTA).
- Page container 1240 px, side padding `clamp(16px, 4vw, 48px)`. Sections
  breathe: 96–128 px between landing sections at 1440, 56–72 on phones.
- Card padding 20–28 px. Gaps 8 / 12 / 16 / 24.
- Focus: 2 px `accent-ink` outline, 2 px offset, on everything focusable.
- Shadow: `shadow-elev` only. Everything else is flat on `line` borders.

## Components

**Buttons.** Primary: `accent` fill, `on-accent` text, 600 weight, 15 px,
12 px radius, 44 high, hover `accent-hover`, active nudges 1 px down.
Quiet: `surface` fill, `line` border, hover `line-strong`. Disabled: `surface-2`
fill, `ink-3` text, no transform, and the UI says why nearby ("Add a subject
to continue."). Large CTA 52 high, 24 px side padding, 14 px radius. Icon
buttons 40 square, `line` border. Labels say what happens: "Start sending",
"Next: Review & send", "Polish with AI", "Retry 3 failed".

**Inputs.** 44 high, `surface`, 1 px `line`, 12 px radius; focus = border
`accent` plus a 3 px `accent-soft` ring (`focus-within` on composite boxes
like the editor). Placeholder `ink-3`, ending in "…".

**Cards.** `surface`, 1 px `line`, 16–22 px radius, no shadow. The hero
product card is the exception (`shadow-elev`, 28 px radius).

**Tokens and chips.** `{{field}}` tokens: `.tok`, mono, `accent-soft` on
`accent-ink`, inset 1 px ring at 22%. Field chips: 36 high, mono 13.5 px,
`surface` + `line`, hover and "linked" = `accent-soft` + `accent` border.
Hovering a chip highlights its value in the preview.

**Stepper.** Three dots, 32 px, display face at 110% width. Idle: `line-strong`
ring, `ink-3` number. Current: `accent` fill. Done: `accent-soft` fill with a
check, and the name is a link back. A 1.5 px `line` connects them; done
segments use `accent-ink` at 50%. `aria-current="step"` on the current one.

**Bottom bar.** Sticky, `surface`, 1 px `line` top, 76 min height, safe-area
padding. Step label left in `ink-3`, Back (quiet) and Next (primary) right.
When Next is disabled the reason sits beside it in `aria-live="polite"`.

**Preview card.** Sticky beside the editor at ≥ 1024 px. From/To rows in
mono, subject in display 750, body as the recipient will see it. A pager
("Recipient 1 of 42") with 34 px icon buttons. Per-recipient status line:
green check when every field is filled, red alert naming the empty ones.

**The inverted block.** One per page at most (the privacy promise on the
landing): `invert-bg`, `invert-ink`, `invert-accent` for its one highlight.

**Theme toggle.** Icon button in the top bar, sun in dark, moon in light.
`aria-label` says what pressing does ("Switch to dark theme"),
`aria-pressed` reflects dark. Follows the OS until toggled, then remembers
(`localStorage` key `automailr.theme`, applied before first paint by the
inline script in `index.html`).

## Motion

CSS only. 150 ms colour and border transitions on controls; 200 ms opacity
for step changes and the editor's busy state; View Transitions for route
changes where supported. No infinite animations, no parallax, no scroll
reveals, no spring libraries. `prefers-reduced-motion` collapses everything.

## Logo

The mark is an "A" cut by a forward arrow: the letter and the send in one
shape. Files in `public/`: `logo.svg` (mark, `currentColor`), `favicon.svg`,
`favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
`og-image.png`. In the top bar it sits in a 32 px `accent` tile (9 px radius)
in `on-accent`, next to the wordmark "Automailr" set in Archivo 750 / 108% /
-0.02em at 19 px. Minimum size 16 px; clear space one tile-quarter. Never
recolour the mark outside `ink`, `on-accent` or `accent`.

## Voice

Plain, specific, first-person-free. Say what the thing does and the number
that matters: "Up to 5,000 recipients", "250 ms between sends", "`gmail.send`
is the only permission asked for". No "we", no social proof, no "seamless",
"powerful", "effortless", no emoji, no exclamation marks. Buttons name the
outcome. Errors say what happened and what to do next.

## Before showing anything

1. Run my taste-check script (a small Python script, not in this repo,
   that flags these) on the built CSS / page: no purple, one accent
   family, no eyebrow pills, dark theme and toggle present, no external
   resources.
2. Screenshots at 1440 and 390 in light and dark; no horizontal scroll.
3. A pass against Vercel's web interface guidelines; keyboard-only run
   through the wizard.
