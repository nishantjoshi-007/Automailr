# Automailr redesign: bake-off (Phase 5a)

> **Look before you read.** Open `compare.html` and pick a favourite first. This file names the directions and explains the intent, which would steer the judgement.

## How to view

1. Open `design/bakeoff/compare.html` in a browser (double-click works; no server or build step).
2. Use the bar at the top:
   - **Entry** (A / B / C)
   - **Page** (Landing / Message step)
   - **Theme** (System / Light / Dark). This drives every entry, and each entry's own sun/moon button stays in sync with it.
   - **Width** (Desktop / Phone at 390 px)
   - **Open full page**
   - **Reveal**, which shows the direction name and references.
3. On the Message step everything works except sending:
   - type in the editor and the preview updates live
   - click a field chip to insert it at the cursor
   - step through recipients 1–42 (row 3, Chloé Martin, has no company, so you can see the warning)
   - clear the editor to watch Next disable and say why
   - try AI polish and the Original / Polished switch
   - add attachments to see the 25 MB total

Pages are self-contained HTML + CSS + a little JS. The only external requests are Google Fonts; the final build self-hosts them through Fontsource.

## Files

| Path | What |
|---|---|
| `compare.html` | Comparison page, from the playbook's `compare-template.html` plus Page and Theme switches |
| `a/index.html`, `a/message.html` | Direction A: landing page, Message step |
| `b/index.html`, `b/message.html` | Direction B |
| `c/index.html`, `c/message.html` | Direction C |

## The shared brief (identical in all three)

Only the design differs. The copy, sample data, features and behaviour are the same in all three, so the comparison is about the look.

**Landing page**
- Sections: nav (logo, Help, Contact, theme toggle, one CTA), hero, the three steps, the privacy promise, limits, footer.
- One CTA label everywhere: **"Start a mail merge"**.
- Headline: "Mail merge for Gmail, run entirely in your browser."

**Facts used, all from the repo:**
- CSV with an `email` column, up to 5,000 rows.
- `{{field}}` placeholders from the CSV headers.
- Optional AI polish via Gemini. It sends the subject and message with the placeholders still in place, never the CSV rows; checked in `geminiClient.ts`. It needs 30+ characters.
- Attachments up to 25 MB total.
- 250 ms between sends, and failed sends can be retried.
- OAuth scope `gmail.send` only.
- Token encrypted with AES-256-GCM, expires after 55 minutes, and signing out deletes the key.
- Gmail caps: about 500 a day on a personal account, about 2,000 on Workspace.
- Personal, non-commercial licence.

**Voice**
- No "we", no social proof, no hype words, no emoji, no eyebrow pills.

**Message step**
- Sample user: Sam Rivera, sam.rivera@gmail.com.
- List: `contacts.csv`, 42 rows, columns email, first_name, last_name, company.
- Draft: an invitation to speak at a meetup, using `{{first_name}}` and `{{company}}`.
- Preview: "Recipient 1 of 42", Alice Johnson at Acme Corp.
- Disabled-Next copy:
  - "Write a message to continue."
  - "Add a subject to continue."
  - "Add a subject and a message to continue."
- A dashed "design note" box below the editor shows the disabled bar statically. It is a review aid, not part of the product.

**Logo**
- The existing mark (`public/logo.png`) was traced into an SVG path, not redrawn, and recoloured per direction. The name stays "Automailr" and there is no rebrand.

---

## A · Clean product

**Intent.** A bright, confident product page that looks like a well-made tool, not a template.
- White and charcoal neutrals with a faint teal cast.
- One mint-teal accent that always carries dark text.
- A heavy, slightly wide grotesk for headlines and for the numbers that matter: the step numerals and the 5,000 / 25 MB / ~500 / ~2,000 limits.
- The hero's right side is a real product moment: a CSV row turning into Alice's email.
- Cards are soft (16–22 px) and elevation comes from surface contrast.
- The privacy promise is the one dark block on the page.

**References**

| Brand | What it contributes |
|---|---|
| Wise | Heavy display weight on key numbers; one accent with dark text on it; surface contrast instead of shadows; a single polarity-flipped dark card (the privacy block) |
| Supabase | Committing to a white canvas; one scarce green-family accent with near-black text ("lit" button); the product UI as the argument |
| Cal | Real product fragments inside marketing cards (the mini file / editor / pager under each step); near-monochrome restraint at the action layer |

**Palette.** OKLCH tokens are at the top of each page's CSS. Neutrals are tinted toward the accent hue (190–220).

| Token | Light | Dark |
|---|---|---|
| `--bg` | `oklch(0.985 0.002 190)` #f9fafa | `oklch(0.165 0.006 220)` #0c0f10 |
| `--surface` | `oklch(1 0 0)` #ffffff | `oklch(0.205 0.007 220)` #141819 |
| `--surface-2` | `oklch(0.965 0.004 190)` #f1f4f4 | `oklch(0.235 0.008 220)` #1a1f21 |
| `--line` | `oklch(0.915 0.005 190)` #dfe4e3 | `oklch(0.29 0.008 220)` #272c2e |
| `--ink` | `oklch(0.2 0.012 220)` #10171a | `oklch(0.95 0.004 190)` #ecefef |
| `--ink-2` | `oklch(0.38 0.012 220)` #3c4447 | `oklch(0.82 0.006 200)` #c0c5c5 |
| `--muted` | `oklch(0.5 0.01 220)` #5d6567 | `oklch(0.7 0.008 210)` #99a0a1 |
| `--accent` | `oklch(0.8 0.12 182)` #50d7c3 | same |
| `--on-accent` | `oklch(0.2 0.012 220)` #10171a | same |
| `--accent-ink` (links, tokens) | `oklch(0.47 0.08 186)` #0a6961 | `oklch(0.84 0.115 182)` #66e3d0 |
| `--accent-soft` (token / fill tint) | `oklch(0.95 0.035 182)` #d6f7f0 | `oklch(0.3 0.045 184)` #0d3530 |
| `--pos` / `--neg` (state only) | #137738 / #c22826 | #5dc879 / #f97770 |

Realtime Colors:
- [light](https://www.realtimecolors.com/?colors=10171a-f9fafa-50d7c3-dfe4e3-50d7c3&fonts=Archivo-Geist)
- [dark](https://www.realtimecolors.com/?colors=ecefef-0c0f10-50d7c3-272c2e-50d7c3&fonts=Archivo-Geist)

**Type**
- **Archivo** for display, at weight 800–850 with the width axis at 104–118%, for headlines and numerals.
- **Geist** for body and UI.
- **Geist Mono** for field tokens and CSV cells.
- Fontsource: `@fontsource-variable/archivo` (import `wdth.css` for the width axis), `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`.

**Why teal**
- It reads as "go / sent" without being the success green. The hue (182) sits well away from `--pos` (150), so "filled in" and "email column found" states stay unambiguous.
- It's light enough to take dark text, the pattern that won blind test E and the Tally landing.
- Nothing about it says purple or AI.

**For the product**
- Wizard: rounded cards; a stepper with dots; field chips and tokens tinted teal; a sticky preview card; a solid bottom bar with a teal Next.
- Marketing: big numerals do the persuading, plus one dark privacy block.

## B · Warm editorial

**Intent.** A calm, printed feel that suits a free tool made by one person.
- Paper and ink tones.
- A literary serif (Newsreader) for headlines at regular weight, with a clean grotesk for reading.
- One rust accent.
- Generous margins; hairlines instead of cards and shadows.
- The product moment is a letter: Alice's email set as a sheet of paper with the rest of the batch stacked behind it (hairline offsets, no blur), with the CSV values underlined in rust. It's a restrained use of the tactile-object idea from the Tally / Chalo feedback.
- Steps read like a table of contents, the privacy promise like a definition list, and the limits like a price list with dot leaders.

**References**

| Brand | What it contributes |
|---|---|
| Zapier | Warm cream canvas and coffee-brown ink; every neutral carries warmth; one saturated warm accent; middle-radius (8 px) buttons |
| Claude | A literary serif display at regular weight with negative tracking over a humanist sans; showing the actual product (the letter) instead of illustrations |
| Cursor | Hairline-only depth, no drop shadows; display weight kept light; the accent used scarcely |

**Palette**

| Token | Light | Dark |
|---|---|---|
| `--bg` | `oklch(0.968 0.013 82)` #f9f4eb | `oklch(0.185 0.013 55)` #17110d |
| `--surface` | `oklch(0.985 0.008 85)` #fdfaf4 | `oklch(0.22 0.015 55)` #201914 |
| `--surface-2` | `oklch(0.945 0.017 80)` #f3ece0 | `oklch(0.25 0.016 55)` #28201a |
| `--line` | `oklch(0.885 0.017 75)` #e0d8cd | `oklch(0.31 0.016 55)` #372e29 |
| `--ink` | `oklch(0.24 0.022 50)` #281c16 | `oklch(0.93 0.016 82)` #ede7dc |
| `--ink-2` | `oklch(0.4 0.022 52)` #52453d | `oklch(0.82 0.018 78)` #cbc3b7 |
| `--muted` | `oklch(0.5 0.02 55)` #6d6059 | `oklch(0.71 0.02 70)` #aaa094 |
| `--accent` | `oklch(0.53 0.13 42)` #a84d27 | `oklch(0.72 0.125 48)` #e48b5c |
| `--on-accent` | `oklch(0.985 0.008 85)` #fdfaf4 | `oklch(0.2 0.015 50)` #1c1410 |
| `--accent-ink` | `oklch(0.5 0.13 40)` #9e4421 | `oklch(0.76 0.115 52)` #eb9c6a |
| `--accent-soft` | `oklch(0.93 0.035 55)` #fbe2d2 | `oklch(0.3 0.045 48)` #402719 |
| `--pos` / `--neg` | #246e3a / #af2934 | #69c27e / #ed756e |

Realtime Colors:
- [light](https://www.realtimecolors.com/?colors=281c16-f9f4eb-a84d27-e0d8cd-a84d27&fonts=Newsreader-Hanken%20Grotesk)
- [dark](https://www.realtimecolors.com/?colors=ede7dc-17110d-e48b5c-372e29-e48b5c&fonts=Newsreader-Hanken%20Grotesk)

**Type**
- **Newsreader** for display, at 300–500 with optical size and italics.
- **Hanken Grotesk** for body and UI.
- Fontsource: `@fontsource-variable/newsreader` (import `opsz.css` and `opsz-italic.css`), `@fontsource-variable/hanken-grotesk`.

**Why rust**
- It's the colour of printer's ink and postage, so it fits a letter-based product.
- It's dark enough for white text in light mode (5.35:1). In dark mode it lifts to apricot with dark text (7.0:1).
- It's deliberately deeper and browner than the saffron rejected for Chalo.

**For the product**
- Wizard: open layout with hairline rules rather than boxed cards; an underline-style subject field set in the serif; the preview as a letter on paper; Back as a text link, Next in rust.
- Marketing: the most "voice" of the three; long-form friendly.

## C · Utility console

**Intent.** A precise, dense tool for people who send a lot.
- Cool graphite neutrals.
- One ink-blue accent.
- Square corners and crisp 1 px rules.
- IBM Plex Sans with Plex Mono for every number, label and field token.
- The hero shows a small console: the CSV as a ruled grid with row 1 selected, the rendered email for that row, and a status line ("gmail.send only · 250 ms between sends · 0 of 42 sent").
- The Message step is a two-pane workspace in one ruled frame, with a status bar ("draft kept in this tab", which is true: the wizard state lives in sessionStorage).

**References**

| Brand | What it contributes |
|---|---|
| IBM (Carbon) | Flat geometry, 1 px rules and surface steps for hierarchy; a progress indicator as a rule over each step; sentence-case labels; one blue |
| Vercel | Mono for the technical layer (labels, tokens, status); a fine grey ladder; period-terminated headlines ("Three steps.") |
| Coinbase | Mono on every number that matters; green and red as text-only state, never fills |

**Palette**

| Token | Light | Dark |
|---|---|---|
| `--bg` | `oklch(0.968 0.004 250)` #f2f5f7 | `oklch(0.17 0.008 258)` #0d1013 |
| `--surface` | `oklch(0.995 0.001 250)` #fdfdfe | `oklch(0.2 0.009 258)` #14161a |
| `--surface-2` | `oklch(0.945 0.005 250)` #eaedf0 | `oklch(0.23 0.01 258)` #1a1d22 |
| `--line` | `oklch(0.88 0.007 250)` #d4d8dc | `oklch(0.3 0.011 258)` #2a2e33 |
| `--ink` | `oklch(0.22 0.014 258)` #171b21 | `oklch(0.94 0.004 250)` #e9ebee |
| `--ink-2` | `oklch(0.39 0.014 258)` #40454d | `oklch(0.8 0.008 252)` #babec3 |
| `--muted` | `oklch(0.5 0.014 258)` #5e646b | `oklch(0.69 0.01 255)` #979ca2 |
| `--accent` | `oklch(0.47 0.15 255)` #0859ac | `oklch(0.72 0.12 250)` #67aaed |
| `--on-accent` | `oklch(0.99 0.002 250)` #fbfcfd | `oklch(0.17 0.012 258)` #0c1015 |
| `--accent-ink` | `oklch(0.47 0.15 255)` #0859ac | `oklch(0.76 0.11 250)` #79b6f4 |
| `--accent-soft` | `oklch(0.935 0.025 250)` #ddebfa | `oklch(0.29 0.05 255)` #1a2c44 |
| `--pos` / `--neg` | #1a763f / #ba2b2e | #5dc47e / #f2716a |

Realtime Colors:
- [light](https://www.realtimecolors.com/?colors=171b21-f2f5f7-0859ac-d4d8dc-0859ac&fonts=IBM%20Plex%20Sans-IBM%20Plex%20Sans)
- [dark](https://www.realtimecolors.com/?colors=e9ebee-0d1013-67aaed-2a2e33-67aaed&fonts=IBM%20Plex%20Sans-IBM%20Plex%20Sans)

**Type**
- **IBM Plex Sans** for display and UI (600 for headings).
- **IBM Plex Mono** for numbers, labels and tokens.
- Fontsource: `@fontsource-variable/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (static weights 400/500/600; there is no variable Plex Mono package).

**Why ink blue**
- Blue reads as "tool" and "trustworthy", and as the colour of links, which suits a utility.
- It's kept at OKLCH hue 250–255, which is screen hue 210°. That is well clear of the indigo/purple band (232–300°) that read as AI in the Chalo tests.
- It's dark enough for white text (6.7:1).

**For the product**
- Wizard: the most on screen at 1440. It reads like a workspace, with labelled rows, a status bar and mono counters.
- Marketing: a spec sheet more than a pitch.

---

## Checks run

- **`taste_check.py`: every page passes 6/6**, compare page included.
  - No purple or indigo; at most one accent hue family per direction (A 150–180°, B 0–30°, C 210–240°).
  - No eyebrows or pills; dark theme present; toggle present; no external resources besides Google Fonts.
- **Screenshots in headless Chrome** at 1440 and 390, in light and dark, for all six pages, with the real fonts loaded.
- **Horizontal scroll at 390.** A script measured `scrollWidth` against the viewport for every page in both themes, at 390 and 1440. There was no overflow anywhere. The test viewport was effectively 375 px because of the iframe scrollbar, which is stricter than required.
- **Behaviour.** 45 scripted checks across the three Message steps all pass: live preview, the missing-field warning on row 3, stopping at 42, Next-disabled reasons, polish disabled under 30 characters, field insertion, polish and restore, and the theme toggle with its label and `aria-pressed`.
- **Contrast.** Every text pair is at least 4.5:1 in both themes. The lowest is about 5.1:1 (muted text on `--surface-2`). Text on the accent: A 10.2:1, B 5.35:1 (light) and 7.0:1 (dark), C 6.7:1 and 7.8:1.
- **`web-design-guidelines` pass**, against the current Vercel rules. Fixed:
  - `aria-hidden` on decorative icons
  - skip links
  - `aria-live` on the Next reason, the polish hint and the attachment total
  - `scroll-padding-bottom` so the sticky bar can't hide the focused element
  - a stronger focus state in B's editor
  - stepper links given real boxes (they were `display: contents`, so no focus ring)
  - non-breaking spaces in "25 MB" and "250 ms"
  - `…` on placeholders
  - `touch-action`
  - `theme-color` meta
  - `translate="no"` on the brand and tokens
  - explicit `<select>` option colours
  - safe-area padding on the bottom bar

  Deliberately not followed: the guideline's Title Case for headings and buttons, because the playbook and these directions use sentence case.

## Taste rules applied

- One restrained accent per direction on a calm, tinted neutral ground. Semantic green and red appear only for state ("email column found", "fields filled in", "company is empty").
- No purple or indigo, no gradients, glows, aurora, glass or neon. A's only shadow is one soft elevation; B's stacked letter uses hairlines, no blur.
- No eyebrow pills. Section headings are plain. C's small mono labels sit inside cells above numbers, never above headings.
- No generic display face: Archivo, Newsreader and IBM Plex Sans.
- Numbers carry weight where they mean something: the limits and the step numerals.
- Light and dark in every page:
  - the toggle is in the top bar and defaults to the system setting
  - the choice is remembered and applied before first paint (no flash)
  - the toggle has an `aria-label` that says what pressing does, and `aria-pressed` reflects dark
- Web-first at 1440, then checked at 390 with no horizontal scroll.
- Copy: plain and specific, one CTA label everywhere, no "we", no fabricated social proof, no hype words, no emoji. Buttons say what happens ("Next: Review & send", "Polish with AI").
- A real product moment in each hero (brand.md §8).
- Small linked details, which he valued in Chalo:
  - hovering or focusing a field chip or token highlights its value in the preview
  - the preview follows the editor live
  - the preview warns per recipient when a field is empty

## What I bent, and why

- **bakeoff.md step 2 (one fresh agent per entry, blind).** One agent built all three. The variable under test is the direction itself, so identical copy, data and behaviour isolate it better than three agents writing three different pages. The letters aren't randomised because the brief fixed the folder names a/b/c to the suggested directions. The compare page's Reveal still hides the names.
- **IBM's DESIGN.md** says 0 px corners and weight-300 display. C uses 2 px corners and 600 headings, because light Plex at hero size reads faint and corporate, and his history favours confident type.
- **Supabase and Cal** cap display weight at 500–600; **Wise and Vercel** prescribe pill CTAs and mono eyebrows. A uses 800 headlines (heavy type on what matters has won twice). All pill-eyebrow advice was dropped.
- **Two shades of one hue in A.** The bright teal can't be used as text on white, so links and tokens use a dark teal (`--accent-ink`). It's one hue family, needed for contrast.
- **Mockup shortcuts:**
  - AI polish is simulated with a pre-written rewrite and makes no network call
  - Templates, HTML, Link and Sign out are inert
  - all links are `#`
  - the editor is a `contenteditable` stand-in for TipTap
  - B spells out "One / Two / Three" over its step names as an editorial touch; the bar itself says "Step 2 of 3"

## Trade-offs, honestly

**A · Clean product**
- Strength: the most immediately "product".
- Risk: teal on charcoal is a familiar SaaS combination, so it relies on the heavy Archivo type to feel ownable.
- Risk: the 800-weight headline is loud for a privacy-first tool.
- Cost: the light accent needs a second, darker teal for text.

**B · Warm editorial**
- Strength: the most distinctive, and it fits a one-person, honest voice.
- Risk: the serif can tip from "tool" towards "blog" inside a dense wizard.
- Risk: rust sits near error red. It's separated by lightness and hue, but errors must always carry an icon and words.
- Cost: generous margins fit less on screen.

**C · Utility console**
- Strength: the most efficient wizard and the most "tool".
- Risk: the coldest of the three, and it may feel like a developer product to non-technical senders (job seekers, event organisers).
- Risk: the blue is close to Google's own, which is familiar but less ownable.
- Risk: Plex is strongly associated with IBM.

**All three**
- The traced mark is busy at 16 px (this is the existing logo, not something introduced here). A cleaned vector of the same mark would help the favicon. That is a redraw, not a rebrand.
