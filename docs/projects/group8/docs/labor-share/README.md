# Foreign Labor Share — Visualization

**"The Changing Face of Singapore's Workforce"** — A scroll-driven animated dashboard showing how Singapore's foreign workforce share evolved across GDP sectors from 1990 to 2025. In the narrative arc, this is Viz 4: it delivers the data-driven answer to whether foreign migration has displaced resident workers.

---

## Layout

The visualization is a single self-contained HTML file (`labor-share.html`) using a `position: sticky` scroll-sync pattern. As the user scrolls, the year advances from 1990 to 2025 and all charts update in lockstep. When embedded in `index.html`, it receives narrative text from `content.js` via `window.parent.CONTENT`.

### Panels

| Panel | Chart Type | What It Shows |
|-------|-----------|---------------|
| **Overview** | Stacked area | Economy-wide resident vs. non-resident employment over time |
| **Sector bars** | Vertical stacked bar | Per-sector breakdown for the current scroll year |
| **KPI cards** | Numeric badges | Total employment, non-resident share %, and year-on-year deltas |
| **Timeline track** | Dual-handle timeline | Visual anchor showing the current year position within 1990–2025; click to compare two years |

### Comparison Mode

Clicking the timeline track opens a dual-handle comparison mode (OWID Grapher pattern). Two bar chart panels display side by side showing start and end year, with delta labels on the right panel. The area chart shows two cursors with an amber band spanning the comparison interval.

## Narrative Context

This visualization is the fourth and final evidence panel in the story. It follows:
1. **"What Are People Actually Saying?"** (Viz 1 — Stance Chart) — public perception
2. **"The Language of Division"** (Viz 2 — Word Clouds) — language analysis
3. **"Where Do They Come From?"** (Viz 3 — Globe) — migration origins

The Conclusion section in `index.html` synthesizes findings from all four vizzes, drawing on data points from this dashboard (e.g., 82% construction foreign share, 173K lost in COVID, resident employment grew +111%).

## Visual Encoding

| Element | Encoding |
|---------|----------|
| Blue fill | Resident employment |
| Orange fill | Non-resident employment |
| Bar width | Sector total employment |
| Bar segment | Resident / non-resident split |
| KPI delta badge | Green (↑) / red (↓) year-on-year change |

## Data

Draws from MOM, SingStat, and DOS sources covering 12 SSIC 2020 sectors. Pre-2009 sector-level resident/non-resident splits are reconstructed from cumulative employment-change data.

## Related

- Source code: [`../../src/labor-share.html`](../../src/labor-share.html)
- Data: [`../../data/`](../../data/) (`d3_overview.json`, `d3_timeseries.json`, `d3_sectors.json`)
- Pipeline: [`../../pipeline/labor-share/`](../../pipeline/labor-share/)
