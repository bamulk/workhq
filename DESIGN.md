---
name: Finances
description: An owner's key-figures page. One net figure on a yellow plate, then every entity ranked on one axis.
colors:
  paper: "#f7f7f4"
  surface: "#ffffff"
  ink: "#111312"
  ink-2: "#464a47"
  ink-3: "#676c68"
  rule: "#d9dad5"
  rule-strong: "#111312"
  hover: "#efefea"
  plate: "#ffd23f"
  plate-ink: "#111312"
  plate-ink-2: "#4a3f12"
  gain: "#0b7a3e"
  loss: "#c8231b"
  gain-bar: "#0b7a3e"
  loss-bar: "#d7261e"
  paper-dark: "#0e100f"
  surface-dark: "#161917"
  ink-dark: "#f2f2ee"
  ink-2-dark: "#bdc0ba"
  ink-3-dark: "#959a93"
  rule-dark: "#2b2f2c"
  hover-dark: "#1d211e"
  gain-dark: "#4cc785"
  loss-dark: "#ff7a6e"
  gain-bar-dark: "#3fb877"
  loss-bar-dark: "#f0574b"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  body-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  badge: "3px"
  sm: "4px"
spacing:
  row-tight: "10px"
  row: "12px"
  gutter: "16px"
  plate: "20px"
  gutter-wide: "24px"
  stack: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-2}"
  button-primary-sm:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.loss}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  key-figures-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.sm}"
    padding: "16px 20px 20px"
  period-tab:
    textColor: "{colors.ink-3}"
    typography: "{typography.body-sm}"
    height: "44px"
    padding: "0 12px"
  period-tab-active:
    textColor: "{colors.ink}"
  badge:
    textColor: "{colors.ink-2}"
    typography: "{typography.caption}"
    rounded: "{rounded.badge}"
    padding: "0 6px"
    height: "20px"
  tab-bar-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-3}"
    height: "64px"
  tab-bar-item-active:
    textColor: "{colors.ink}"
---

# Design System: Finances

## Overview

**Creative North Star: "The Key-Figures Page"**

The app reads like the key-figures spread of an annual report. Each screen leads with one number on a chrome-yellow plate, and everything below it is printed on paper: ink type, 1px rules, and a ranked chart. The page is built from type, rules, and figures. It has no cards, no shadows, no gradients, and no decorative imagery. Depth comes from the rules and from contrast in type size.

Density is moderate and phone-first. Rows are about 44 to 52px tall. A page has one column inside a 1024px measure, and everything sits on a 16px gutter (24px from `sm` up). Hierarchy comes from the size gap between the 56px display figure and 15px body text, and only two weights are used. Colour is scarce on purpose. Yellow marks the single figure the screen exists to show. Green and red tell you which way money moved, and they appear only where money is printed.

Dark mode follows `prefers-color-scheme`. Paper and ink swap, while the yellow plate keeps the same yellow and the same dark ink, so the figure you came for looks the same in either mode.

**Key Characteristics:**
- One yellow plate per screen, holding the net figure.
- 1px rules are the only containers. Corners are 4px or less, and nothing casts a shadow.
- Geist with tabular figures throughout, in two weights (400 and 600).
- Gain/loss colour appears on figures and bars only.
- Signature: the ranked diverging entity chart on one continuous centre axis.

## Colors

The palette is paper and ink with one chrome-yellow plate and a strict money pair of green and red.

### Primary
- **Chrome Yellow Plate** (`plate`): the background of the Key Figures plate and nothing else, apart from text selection. Text on it uses Plate Ink, and its secondary labels use Plate Umber (`plate-ink-2`). The value does not change in dark mode.

### Secondary
- **Ledger Green** (`gain`, `gain-bar`): positive figures and bars that run right. Dark mode lifts it to `gain-dark` and `gain-bar-dark`.
- **Ledger Red** (`loss`, `loss-bar`): negative figures and bars that run left. The bar is slightly brighter than the type (`loss-bar`). Loss red also marks error notes and the danger button, which are its only uses outside money.

### Neutral
- **Paper** (`paper`): the page ground, the top bar, the tab bar, and the backing behind chart labels.
- **Sheet White** (`surface`): inputs, secondary buttons, and ruled form boxes.
- **Ink** (`ink`): body text, primary buttons, active-tab marks, the focus outline, and the strong section rule (`rule-strong`).
- **Graphite** (`ink-2`): field labels, ghost buttons, and back links.
- **Pencil** (`ink-3`): metadata lines, inactive tabs, placeholders, and the em-dash shown when a value is empty.
- **Hairline** (`rule`): every 1px divider and container border.
- **Press** (`hover`): the hover wash on rows and ghost buttons.

### Named Rules
**The One Plate Rule.** Each screen has at most one yellow plate, and it holds the net figure for the current scope. Yellow is never used on buttons, badges, tabs, or highlights.

**The Money Colour Rule.** Green and red appear only on signed money figures and chart bars, plus red for errors and destructive actions. Labels, status words, icons, and control fills stay in ink.

**The Constant Plate Rule.** Dark mode swaps paper and ink and leaves the plate as it is: same yellow, same dark ink.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui fallback)
**Body Font:** Geist
**Label/Mono Font:** Geist with `font-variant-numeric: tabular-nums` set globally. There is no separate mono face.

**Character:** One neo-grotesque used in two weights. Contrast comes from size. Tight negative tracking on the large sizes gives figures a printed-report look, and tabular numerals keep columns aligned.

### Hierarchy
- **Display** (600, 3.5rem / 56px, line-height 1, -0.035em): the net figure on the plate only. If the formatted figure is longer than 10 characters, it steps down to 44px on phones.
- **Headline** (600, 28px, 1.25, -0.02em): page titles, the sign-in title, and the amount input on the transaction form.
- **Title** (600, 17px, -0.01em): section titles, the wordmark, and the money in / money out sub-figures on the plate.
- **Body** (400, 15px, 1.5): row names, form values, and paragraph text. Inputs use 16px on phones so iOS does not zoom.
- **Body Small** (400 or 600, 14px): period tabs, desktop nav, report tables, and error notes.
- **Label** (400, 13px): field labels, metadata lines under row names, plate labels, section asides, and small buttons.
- **Caption** (400, 12px): badges and the chart's ±max scale. The phone tab bar uses 11px labels.

### Named Rules
**The Two Weights Rule.** Only 400 and 600 exist. Signed figures, titles, buttons, and active tabs use 600. Everything else uses 400.

**The No Kicker Rule.** No uppercase, letter-spaced labels. A label is sentence-case 13px text in Graphite or Pencil.

## Layout

The layout is a single column inside a 1024px measure (`max-w-5xl`), with a 16px gutter on phones and 24px from 640px up. Page sections stack 24px apart. Forms are capped at about 576px (`max-w-xl`) and sign-in at 384px. Rows use 10 to 14px vertical padding and are divided by 1px Hairline rules. A list closes with a bottom rule and needs no box around it.

Responsive behaviour:
- **Below 768px:** a slim 48px top bar shows only the wordmark. A fixed 64px bottom tab bar (Overview, Activity, Add, Entities, More) respects the safe-area insets, and the main content has extra bottom padding to clear it.
- **From 768px:** the tab bar goes away. The top bar grows to 56px and holds inline nav (Overview, Activity, Entities, Reports, Import), the user's name, sign-out, and an ink Add button.
- **Entity chart:** on phones the bar track spans the full row, under the name. From 640px up, the chart becomes a four-column grid: name (up to 14rem), bar track, value (7.5rem), and chevron.
- **Period tabs:** on phones the row scrolls sideways and bleeds to the screen edge. No core answer ever needs horizontal scrolling.

## Elevation & Depth

The system is completely flat. No element casts a shadow. Depth comes from rules: 1px Hairline rules separate and contain, 2px ink rules open a section, and a 3px ink bar marks the active tab. The sticky top bar and the fixed tab bar are separated from content by a 1px rule, not a shadow. Input focus adds a 1px inset ink ring that thickens the border. This is a stroke, not elevation.

### Named Rules
**The Ruled Page Rule.** Containers are 1px rules. Lists, figures, and charts sit directly on the paper. Only forms and the plate are enclosed.

## Shapes

Corners are nearly square: 4px on buttons, inputs, form boxes, error notes, and the plate, and 3px on badges. Nothing goes above 4px, and no shape is a pill or a circle. Rules come in three weights, each with one job: 1px Hairline to divide or contain, 2px ink to open a section or close a table's total row, and 3px ink to mark the active tab. The wordmark is a 10px solid ink square next to the word "Finances".

## Components

### Buttons
- **Shape:** nearly square (4px). Medium is 44px tall at 15px; small is 36px tall at 13px. Labels are 600 weight.
- **Primary:** an ink fill with paper text. On hover the fill lightens to Graphite. The colour transition lasts 150ms.
- **Secondary:** Sheet White with a 1px Hairline border and ink text. On hover the border turns ink.
- **Ghost:** Graphite text with no border. On hover the text turns ink and the Press wash appears.
- **Danger:** Sheet White with a Hairline border and loss-red text. On hover the border turns red.
- **Focus / Disabled:** focus shows a 2px ink outline offset by 2px. Disabled sits at 45% opacity.

### Badges
- **Style:** 20px tall, 12px text, a 1px Hairline border at 3px radius, and Graphite text. A badge reads like a small printed label, not a pill.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** Sheet White, used for forms only.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 16 to 24px.

### Inputs / Fields
- **Style:** Sheet White, 44px tall, a 1px Hairline border at 4px radius, and 12px horizontal padding. The border darkens to Pencil on hover.
- **Focus:** the border turns ink and gains a 1px inset ink ring. There is no glow.
- **Label:** 13px Graphite above the field, with a 6px gap. Hints are 13px Pencil below it.
- **Error:** a 14px loss-red note with a red border at 40% opacity and 4px radius.

### Navigation
- **Period tabs:** a row of 44px tabs at 14px ruled with a Hairline underneath. Inactive tabs are Pencil and darken to ink on hover. The active tab is 600 ink with a 3px solid ink bar sitting on the bottom rule. "Custom" opens two date fields inline.
- **Desktop top bar:** the same tab treatment: a 3px ink underline marks the current section.
- **Phone tab bar:** five columns, each 64px tall with a 20px line icon over an 11px label. The active item is ink, with a 3px ink bar on the top rule and a heavier icon stroke. Add is a 40 × 28 ink block with a paper plus sign and gets no bar.

### Key Figures Plate (signature)
The chrome-yellow plate, 4px radius. It reads top to bottom:
- A 13px Plate Umber label giving the verdict and the period ("Up · October 2026").
- The 56px display figure, signed.
- A two-column `dl` (Money in, Money out) under a rule of Plate Ink at 15% opacity, with a matching rule between the columns.

The figure itself is printed in Plate Ink, not gain/loss colour. It appears once per screen, on Overview, Activity, entity detail, and Reports.

### Entity Ranking (signature)
Every entity in the scope, ranked by net and drawn on a diverging chart:
- A single continuous 1px ink centre axis runs the full height of the list.
- Each row shows the entity name and a 13px "in · out" line on a paper backing. That backing sits above the axis, so the axis breaks around the type the way a printed rule would.
- Bars are 10px tall. Gains grow right in `gain-bar` and losses grow left in `loss-bar`, scaled to the largest absolute net.
- The value sits right-aligned in 600, in gain/loss colour, followed by a chevron.
- Rows that have nothing recorded show Pencil text and an em dash, with no bar. When nothing in the scope is recorded, the axis is hidden.
- A 12px ±max scale sits under the axis.
- Under `prefers-reduced-motion: no-preference`, bars grow out from the axis (420ms, cubic-bezier(0.16, 1, 0.3, 1)).
- It is reused on Overview, Entities, and Reports.

### Lists
Transactions and More links appear as ruled rows. The description sits over a 13px Pencil meta line ("date · entity · category"), the signed amount sits on the right in 600 and money colour, and hovering a row shows the Press wash at 4px radius.

## Do's and Don'ts

### Do:
- **Do** give each screen at most one yellow plate, and put that screen's net figure on it.
- **Do** contain things with 1px Hairline rules, open sections with a 2px ink rule and a 17px title, and mark active tabs with a 3px ink bar.
- **Do** keep corners at 4px or less (3px on badges).
- **Do** set every figure in Geist with tabular numerals at 600, signed, with gain/loss colour off the plate.
- **Do** reuse the Entity Ranking for any comparison of entities, and keep its one continuous centre axis breaking around the labels.
- **Do** keep the plate's yellow and its dark ink unchanged in dark mode.

### Don't:
- **Don't** use any box-shadow for elevation, or rounded white cards to wrap lists, figures, or charts.
- **Don't** use a font weight other than 400 or 600.
- **Don't** put gain/loss colour on labels, status words, icons, or control fills.
- **Don't** use yellow anywhere except the one plate and text selection.
- **Don't** add uppercase tracked kickers or eyebrows above titles or figures.
