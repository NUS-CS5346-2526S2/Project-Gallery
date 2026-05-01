# Where Singapore's migrants come from

A scroll-driven data dashboard on foreign-born migrant stock into Singapore, 1990–2020, built from the UN DESA International Migrant Stock dataset. Scrolling advances the year continuously; every panel — a ranked bar race, a time-series line chart, a rotating globe with animated flight arcs, and a "concrete inspector" — updates live and lets you compare any two years you like.

## Stack

- Vite + React + TypeScript + Tailwind
- D3 (`d3-geo`, `d3-geo-projection`, `d3-scale`, `d3-shape`, `d3-interpolate`) for projections, scales, and line generators
- `topojson-client` + world-atlas countries-110m for the base map
- SVG for the base map, charts, and UI; Canvas + `requestAnimationFrame` for the plane layer
- `xlsx` (Node) for the data prep script

## Data source

UN DESA International Migrant Stock **2020** release, Table 1 (destination × origin):
<https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2020_ims_stock_by_sex_destination_and_origin.xlsx>

**Why 2020 and not 2024?** The 2024 release only itemises 10 origins for Singapore (China, Hong Kong, Taiwan, India, Indonesia, Malaysia, the US, Canada, Australia, New Zealand) and folds Philippines, Bangladesh, Pakistan, Thailand and others into an unattributed "Others" bucket. The 2020 release itemises **15** country origins including all of those. We lose the 2024 snapshot but keep a much fuller picture of Singapore's migrant composition across the other 7 snapshots (1990, 1995, 2000, 2005, 2010, 2015, 2020).

"Migrant" in this dataset means foreign-born residents at mid-year — workers, students, dependents, and permanent residents all counted together.

## Development

```bash
npm install

# Regenerate public/migration.json from the UN DESA xlsx.
# Downloads the xlsx into .cache/ on first run, reuses the cache after.
node scripts/prep_data.js

npm run dev      # start the dev server on :5173
npm run build    # typecheck and build for production
npm run preview  # serve the production build locally
```

The committed `public/migration.json` is the output of `scripts/prep_data.js`, so the dev server works without re-running the prep script unless you want to refresh the data.

## Layout

The pinned stage is a three-column dashboard under a thin header:

- **Header** — big year readout, a compare-year picker (dropdown + running Δ versus the scrubbed year), and the filter drawer.
- **Left column** — ranked bar race of all visible countries, sorted by the current year's value. Each row has a dashed "ghost" bar at the pinned-year value and a signed delta label, so you can read where each country started versus where it is now without waiting for animation.
- **Centre column** — trajectory line chart on top (all 15 countries over time, with a scrubber at the current year and a dashed pin at the compare year), origin globe below with Singapore-centred flight arcs animating in Canvas.
- **Right column** — the choropleth colour legend on top, then the "concrete inspector": 100-square pictogram showing the share of Singapore residents coming from the active country, a "change since pinned year" card (absolute Δ, percent Δ, and rate-of-change with an accelerating / steady / slowing tag), and a sparkline of that country's own trajectory.

## Interaction

- **Scroll** the pinned section: the year advances continuously from 1990 to 2020. All four panels update live.
- **Hover** a country anywhere (bar row, line, or globe shape) to light it up everywhere else. The inspector on the right switches to that country.
- **Click** a country to lock the selection so it stays active when you stop hovering. Click the same country again to unlock. Hover still overrides a locked selection while you're pointing at something else.
- **Click the line chart** anywhere on its empty plot area to snap the **pinned comparison year** to the nearest snapshot year. Clicking on a line itself selects that country instead — line hit targets are widened so the clicks are reliable even on thin curves. The header dropdown sets the same pin.
- **Drag** the globe to rotate. The gentle auto-breathing continues underneath so the globe never looks frozen when you let go.
- **Filters drawer** (top right): narrow the dashboard to a subset of countries (chip list with `all` / `none` shortcuts) and switch the display mode.

## Display modes

The normalization filter rewrites what every panel renders — bar race widths, choropleth fills, the line chart, and the inspector sparkline all re-derive off the same mode.

| Mode                  | What it shows                                                   | Use it when                                                |
| --------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| **Rate / yr** *(default)* | Year-over-year change in stock (additions per year, can be negative) | You want to see whether a flow is accelerating, stagnating, or reversing. A curve falling toward the zero baseline is the visual signal for stagnation. |
| Raw counts            | Absolute migrant stock (foreign-born residents)                 | You want the headline "how many people" number, log-scaled so small and large origins share the chart. |
| Per total pop         | Migrants per million total Singapore residents                  | You want shares comparable across years as Singapore's population grows. |

In rates mode the line chart switches to a signed linear y-axis with a visible zero baseline, and ticks read `+50K`, `−10K`, etc. In stock modes the chart uses a log scale with positive-only ticks (`1K`, `10K`, `100K`, `1M`).

## Compare two years

Two years are always on screen at once: the **scrubber year** (driven by scroll) and the **pinned year** (default: 1990). Consequences:

- The bar race draws a dashed ghost outline at each country's pinned-year value behind the live bar, plus a ± delta label in the right gutter.
- The line chart shades the range between the two years and drops a grey dashed vertical at the pin with a triangle marker.
- The inspector's "change since pinned" card spells out `192K → 1.13M, +940K (+489%)` plus the per-year rate at both endpoints with an accel/steady/slowing tag.
- The header shows the running Δ on totals.

## Design notes

- **Year interpolation.** Scroll progress 0→1 maps linearly to year 1990→2020. Stocks are linearly interpolated between the 7 official snapshots; the instantaneous delta is the slope of the current 5-year segment (migrants per year). A pure helper `buildFrameAt(data, year)` computes an interpolated frame at any year — used both by the scroll-driven hook and by the pinned-year memo, so both paths agree exactly.
- **Plane counts** are proportional to `log10(|Δ|+1) * 2` per arc, clamped to 1..20, capped at 300 globally. Small rates still show one plane so the arc is visible.
- **Plane speed responds to rate.** Each arc carries its own phase advanced per frame by `PLANE_SPEED * speedMul(delta)`, where `speedMul` is a log-based multiplier (stagnant rates crawl at 0.3×, big rates sprint at up to 3×). Hover a country and scroll — the dots visibly speed up or slow down as the year moves into and out of high-flow periods.
- **Arc geometry.** Arcs on the globe are 50-sample great circles projected each frame. Back-hemisphere segments are clipped automatically.
- **Short-arc stubs.** Countries whose on-screen great circle is shorter than 40px (Malaysia, nearby Indonesian islands) would collapse into a blob on the Singapore marker. They're replaced with a 15px straight stub from Singapore in the direction of the origin so the "right next door" flows still animate legibly.
- **Visual hierarchy on the globe.** Only the active country's arc and its planes are drawn, in Singapore yellow with a white-ringed active dot and longer motion-blur tail. Every other arc is hidden. The globe is a geographic anchor now that the other panels carry the quantitative load.
- **Origin markers.** Every data country gets a solid orange dot (`#fb923c`) overlaid on its centroid, so the 15 clickable origins stay visible against both the slate land fill and the teal choropleth shading.
- **Choropleth.** Origin countries are tinted by stock magnitude on a sqrt scale. The domain is stable across all years in the current mode so e.g. Malaysia always anchors the bright end. In rates mode, colour encodes `|rate|` — direction (positive vs negative) is conveyed by bar colours elsewhere (cyan = inbound, rose = outbound).
- **Trajectory chart.** Each country's line is coloured from a fixed palette keyed by iso3 so the same country is the same colour everywhere (end-of-line labels and scrubber value-dots included). Wide transparent hit paths underneath each visible line make clicking a thin line reliable.
- **Bar race animation.** Row Y-positions and bar widths tween with a simple 0.22-lerp toward the current target, so rankings rearrange smoothly on scroll without re-rendering React.
- **Performance.** Planes and arcs draw on a single `<canvas>` in a `requestAnimationFrame` loop; React only re-renders when scroll progress, filters, pinned year, or selection change. Per-country great-circle samples are precomputed and reprojected each frame (so rotation stays cheap).

## File layout

```
scripts/prep_data.js          # downloads UN DESA xlsx → public/migration.json
public/
  migration.json              # cleaned data (committed)
  countries-110m.json         # world-atlas base map (committed)
src/
  App.tsx                     # Hero → ScrollyViz → Methodology
  main.tsx
  types.ts                    # NormMode = 'rates' | 'raw' | 'per_pop'
  components/
    Hero.tsx
    ScrollyViz.tsx            # pinned 3-column stage; owns scroll year, pinned year, selection, filters
    RankedBarRace.tsx         # left column: sorted bar list with ghost + delta versus pinned year
    TrajectoryLines.tsx       # centre-top: multi-line chart; log scale (stock) or signed linear (rates)
    Globe.tsx                 # centre-bottom: SVG globe, orange origin dots, click-to-select, drag rotation
    PlaneCanvas.tsx           # canvas arc + plane renderer, per-arc phase + rate-driven speed
    ConcreteInspector.tsx     # right: 100-square pictogram, change-since-pinned card, sparkline
    CountrySparkline.tsx      # trajectory sparkline; values come from the normalized series
    Filters.tsx               # country chip list + mode toggle (rates / raw / per total pop)
    YearDisplay.tsx           # big year readout + running total for current mode
    Legend.tsx
    Methodology.tsx
  hooks/
    useScrollProgress.ts
    useInterpolatedData.ts    # useInterpolatedData(scroll) + pure buildFrameAt(data, year)
  lib/
    projections.ts            # orthographic + equalEarth factory (phi/lambda offsets)
    arcs.ts                   # great-circle sampling, visibility clipping, flat bezier fallback
    planes.ts                 # plane sprite, phase advance, computePlaneCount + computeSpeedMul
    colorscale.ts             # sqrt choropleth ramp
    population.ts             # SG population table, normalizeFrame, normalizeMigrationData, NORM_LABELS
    format.ts                 # formatStock, formatRate
    stream.ts                 # densify helper (legacy; currently unused by the line chart)
```

## Notes on data coverage

For Singapore in the UN DESA 2020 release, the itemised origins are: **Malaysia, China, Indonesia, India, Pakistan, Bangladesh, Hong Kong SAR, Philippines, Sri Lanka, Thailand, Macao SAR, United States, Australia, Canada, New Zealand**. Smaller origins are bundled into an "Other" aggregate (~286K in 2020) that isn't broken out on the map.

## Changelog (iteration 3 rewrite)

The current layout is a rewrite of the original single-globe + scroll-tooltip design. The headline changes, oldest → newest:

1. **Demoted the globe** from hero to one panel of four, and introduced the three-column dashboard layout. The globe is now a geographic anchor, not the sole storytelling surface.
2. **Added a ranked bar race** on the left (`RankedBarRace.tsx`). Sorts by the current-year value, tweens row positions on scroll, shows a ghost bar at the pinned-year value and a signed delta label.
3. **Added a trajectory line chart** on top of the globe (`TrajectoryLines.tsx`), replacing the old streamgraph. Each origin is its own coloured line across 1990–2020 with end-of-line name labels.
4. **Added a "concrete inspector"** on the right (`ConcreteInspector.tsx`): 100-square pictogram of the share of Singapore residents from the active origin, plus a change-since-pinned card and a sparkline.
5. **Added a pinned comparison year** with default 1990. Lives in a header dropdown, also settable by clicking empty plot area on the line chart. Ghost bars, chart range-shade, and the inspector card all read off the pin.
6. **Widened the line-chart hit targets** with invisible 12px stroke paths so clicking thin lines to select a country is reliable.
7. **Recoloured origin markers** on the globe from teal to orange (`#fb923c`) so they stay visible against the choropleth.
8. **Moved the colour-scale legend** from an absolute overlay inside the globe to its own slot at the top of the right column, with `overflow-x-hidden` on the column so the inspector never triggers horizontal scroll.
9. **Removed the Equal Earth toggle** — single globe mode now.
10. **Added a `rates` normalization mode and made it the default.** `NormMode` is now `'rates' | 'raw' | 'per_pop'` (the old `per_resident` option was dropped). Trajectory chart, sparkline, bar race, and choropleth all rerender off the current mode. In rates mode the line chart uses a signed linear y-axis with a visible zero baseline, so stagnation reads as a curve flattening toward zero instead of a stock curve continuing to rise.
11. **Tied plane speed to rate.** Per-arc phase replaced the old global phase; a log-based `computeSpeedMul(delta)` multiplier makes the dots visibly speed up or slow down as the scrubbed year changes a country's instantaneous rate. Count curve stayed log-based so counts remain readable across three orders of magnitude.
12. **Inspector "change since" card** now includes the per-year rate at both the pinned year and the current year, labelled *accelerating* / *steady* / *slowing*.
