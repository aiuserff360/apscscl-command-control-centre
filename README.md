# APSCSCL Command Control Centre — restructured demo

Open `index.html` in Chrome, Edge or Safari (double-click; no server or build step needed). Google Fonts are loaded if online; the page falls back to system fonts offline.

## What this is

A rebuild of the client's demo with the same content and a top-down structure (see `../PLAN.md`). Every number, table, record, incident, suggestion and AI summary is computed by the client's own code, which is run headlessly underneath the new presentation. Nothing was re-typed.

## Layout

```
index.html          page shell and script order
app/engine.js       stub base class + headless host for the baseline view-model
app/ui.js           components (tiles, KPI table, data table, flow strip, stepper, map, charts, drawers)
app/pages.js        one renderer per section of the new information architecture
app/app.js          navigation, hash routing, event delegation, drawers (KPI / record / Act / Ask)
app/app.css         design tokens and styles (green-and-gold government look)
data/baseline.js    data constants and model functions extracted verbatim from the client's demo
data/component.js   the client's view-model builder class, unchanged
data/masters.js     rice mill / RSK / MLS / godown masters (from the client's xls)
data/adb.js         anomaly rule catalogue, anomalies, audit findings
data/imgdb.js       vehicle image grades per RSK, two seasons
assets/             the four reference photos (Good / Average / Bad / Unidentifiable)
```

## Navigation

`#/overview` · `#/chain/all` · `#/chain/proc|cmr|s1|s2|stor[/districts|entities|incidents|records]` · `#/districts[/District[/stage]]` · `#/finance[/stage]` · `#/prep[/compare|ranking|param|reports]` · `#/incidents[/cctv|gps|image]` · `#/voice[/press|youtube]` · `#/intel[/log|inbox]` · `#/reports` (pivot builder). A `?d=District` suffix scopes any page to a district.

Role switch (Commissioner / District Manager) is in the banner. The District Manager lands on their district with an Inbox under Intelligence & Decisions.

## How content maps

The baseline exposed everything as modules × stages. Here the stage spine (01 Procurement, 02 CMR, 03 Stage 1, 04 Stage 2, 05 Storage) is the Value Chain section, and Financials, Preparedness, Incidents & Monitoring, Service & Public Voice and Intelligence are cross-cutting sections that filter by stage or district. The retention map is in `../PLAN.md` section 3; the full inventory of the baseline is `../INVENTORY.md`.

## Known POC notes (inherited from the baseline)

Press clippings and YouTube comments are sample data; the decision log, inbox read-state and season selection live in the browser's local storage; CMR agency split, KPI 14a/14b/38 and the "Proposed" KPIs are marked as needing a source before go-live.

## Version 1 language alignment

The presentation follows the reference storyline: Executive Overview → Value Chain Performance → District Intelligence → District Deep Dive, with Financial Intelligence, Service & Compliance and Decisions & Interventions as supporting views. Preparedness and Incidents & Monitoring remain available as operational views. Route URLs and the five operational stage identifiers are preserved.

Labels follow the meaning of the available data: registered ration cards are not households served; Stage-I movement is progress against plan, not on-time delivery; storage utilisation is occupancy, not days of cover; farmer payment flow is not government fund release. District map headings describe the selected measure. District-wide status and the supply-chain score summarise nine operational measures, while widespread exceptions do not establish a critical service disruption. Missing decisions display “No action recorded”; rankings display as performance highlights when no time series is available.

Reference wording is used where supported without inventing reference-image figures, trends, scheme allocations or service outcomes. The underlying data, formulas, thresholds and drill-down paths remain unchanged.
