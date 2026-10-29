---
version: 1
slug: "src-app-app-page-tsx"
primary_target: "src/app/(app)/page.tsx"
related_targets: ["src/app/(app)/layout.tsx","src/app/login/page.tsx"]
---

---
version: 1
slug: "src-app-app-page-tsx"
primary_target: "src/app/(app)/page.tsx"
related_targets: ["src/app/(app)/layout.tsx","src/app/login/page.tsx"]
---

# Surface: Finances app (all signed-in screens + login)

Mode: Operate. Audience: Brett and his partner, owners checking their own money on a phone in short check-ins. Job: know "am I up or down?" for a period, then see which entity drives it. Secondary: add a transaction, import a CSV, manage entities. Constraint: all existing functions and routes stay; no invented figures.

## Direction contract

THESIS: The app reads like an annual report's key-figures page: one decisive net figure, then every entity ranked on a single axis. Refuses the category default of rounded white cards, soft shadows, a trend line and a card per entity.

OWN-WORLD: Paper white #F7F7F4 ground, ink #111312, chrome yellow #FFD23F used on exactly one reversed plate per screen (the number you came for). Gain green #0B7A3E, loss red #D7261E only on figures and bars. 1px ink/grey rules are the only containers: no cards, no shadows, no radius above 4px. Geist with tabular figures; hierarchy by size contrast (display figure vs 15px body), two weights.

STORY: Open, see overall net for this month at once; scan the ranked entity chart to spot who is earning or losing; tap a row to drill into that entity's figures and lines; change the period with tabs.

FIRST VIEWPORT: Phone 390px: slim top bar (wordmark only; Add lives in the tab bar on phones and in the top bar from md up). Period tabs as a ruled row with a solid underline mark on the active tab. Full-width yellow plate: "Net · October 2026" label, net figure ~56px, money in / money out in two ruled columns beneath. Then "By entity" ranked diverging bar chart from a centre axis, one ruled row per entity, value right-aligned. Bottom tab bar: Overview, Activity, Add, Entities, More (Reports and Import sit under More: checking numbers happens on Overview and entity screens, so Entities earned the tab slot).

FORM: Swiss annual-report key-figures spread, candidate 4 of 7 on the ordered list; seed key 371891ab. Signature move: the ranked diverging entity bar chart on one centre axis, reused on the Entities list and at the top of Reports.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
