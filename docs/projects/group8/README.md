# Are Singaporeans Being Replaced by Foreign Labour?

**A multi-dimensional interactive data story combining 35 years of sector-level employment data, global migration flows, and public sentiment analysis.**

---

## Overview

This project investigates the recurring narrative that "foreigners are stealing Singaporean jobs" through data rather than rhetoric. Four interactive visualizations span government employment records (1990–2025), UN migration data (1990–2020), and ~4,000 classified online posts (2015–2025). Together they reveal that while Singapore's foreign workforce has grown substantially, the story is far more nuanced than headlines suggest — varying dramatically by sector, time period, and public framing.

## Quick Start

**Live site:** [ryanwng12.github.io/sg-foreign-labor-analysis](https://ryanwng12.github.io/sg-foreign-labor-analysis/)

To run locally instead:

```bash
git clone https://github.com/ryanwng12/sg-foreign-labor-analysis.git
cd sg-foreign-labor-analysis
python3 -m http.server 8000
# Open http://localhost:8000
```

No build step required — all visualizations are pre-built and self-contained. A local server is necessary because visualizations load JSON data via `fetch()`.

---

## Visualizations

All four visualizations are presented on a single scrollable page (`index.html`):

| # | Name | Type | Data Source |
|---|------|------|-------------|
| 1 | **What Are People Actually Saying?** | Diverging bar chart | Reddit + The Independent SG |
| 2 | **The Language of Division** | Word cloud pair | Same dataset, split by stance |
| 3 | **Where Do They Come From?** | 3D scrollytelling globe | UN DESA Migrant Stock 2020 |
| 4 | **The Changing Face of Singapore's Workforce** | Scroll-animated dashboard | MOM + SingStat (1990–2025) |

Visualizations 3 and 4 are embedded via iframes from `src/` (complex standalone apps with their own scroll/interaction logic). Visualizations 1 and 2 are rendered inline with D3.

A **Conclusion section** ("So, Are Singaporeans Being Replaced?") follows the four visualizations, synthesizing findings with 4 evidence blocks — one per viz — and concrete data points (23% anti-foreign sentiment, 46% anti on Identity & Culture, 930% growth from India/Pakistan, 82% construction foreign share, 173K lost in COVID, resident employment grew +111%).

---

## Project Structure

```
sg-foreign-labor-analysis/            # Repository root
├── index.html                       # Combined single-page view (all 4 vizzes + conclusion)
├── content.js                       # Editable narrative text for the combined page
│
├── src/                             # Visualization source files
│   ├── labor-share.html             #   Viz 4: Scroll-animated workforce dashboard
│   ├── globe/                       #   Viz 3: 3D migration globe (React/Vite build)
│   │   ├── index.html               #     Vite production entry point
│   │   ├── assets/                  #     Bundled JS + CSS
│   │   ├── migration.json           #     UN DESA migrant stock data
│   │   └── countries-110m.json      #     TopoJSON world basemap
│   └── sentiment/                   #   Viz 1+2: Stance chart + word clouds (D3)
│       ├── index.html               #     Standalone sentiment page
│       ├── viz_data.json            #     Aggregated sentiment data
│       ├── css/                     #     Styles
│       └── js/                      #     D3 chart modules
│
├── data/                            # All datasets
│   ├── d3_overview.json             #   Economy-wide employment (36 rows)
│   ├── d3_timeseries.json           #   Sector-level employment (399 rows)
│   ├── d3_sectors.json              #   Sector metadata (19 rows)
│   ├── migration.json               #   UN DESA migrant stock
│   ├── countries-110m.json          #   World basemap
│   ├── viz_data.json                #   Sentiment aggregates
│   ├── raw/                         #   Original source files
│   │   ├── labor/                   #     MOM, SingStat, DataGov
│   │   ├── sentiment/               #     Reddit + Independent SG scrapes
│   │   └── migration/               #     UN DESA source
│   ├── interim/                     #   Standardized intermediaries (3 CSVs)
│   ├── processed/                   #   Analytical outputs (6 CSVs)
│   └── mappings/                    #   Industry code mapping (54 rows)
│
├── pipeline/                        # All data transformation code
│   ├── labor-share/                 #   Python 6-step pipeline (steps 01–06)
│   ├── sentiment/                   #   Scraping + NLP processing
│   │   ├── scraper/                 #     Reddit + Independent SG scrapers
│   │   └── processing/              #     clean → LLM label → aggregate
│   └── globe/                       #   UN DESA xlsx → JSON converter
│
└── docs/                            # Visualization documentation
    ├── labor-share/                 #   Dashboard layout, encoding, interactions
    ├── globe/                       #   Globe viz overview, encoding, data
    └── sentiment/                   #   Chart descriptions, encoding, limitations
```

---

## Data Pipeline

Three independent pipelines transform raw data into visualization-ready JSON:

| Pipeline | Language | Input | Output | Run Command |
|----------|----------|-------|--------|-------------|
| **Labor Share** | Python | MOM xlsx + SingStat JSON | `d3_overview.json`, `d3_timeseries.json`, `d3_sectors.json` | `python -m pipeline.labor-share.run_pipeline` |
| **Sentiment** | Python | Reddit + Independent SG | `viz_data.json` | See `pipeline/sentiment/` scripts |
| **Globe** | Node.js | UN DESA xlsx | `migration.json` | `node pipeline/globe/prep_data.js` |

All pipeline outputs are committed — running the pipelines is only needed to reproduce or update the data. See [`pipeline/README.md`](pipeline/README.md) for full details.

---

## Data Sources

| Source | Provider | Coverage | Used By |
|--------|----------|----------|---------|
| Employment Level by Industry | MOM Administrative Records | 2008–2025 | Viz 4 |
| Resident Employment (M182131) | SingStat Labour Force Survey | 2000–2025 | Viz 4 |
| GDP by Industry (M015731) | SingStat | 1960–2025 | Viz 4 |
| Employment Changes by Industry & Residential Status | MOM | 1991–2025 | Viz 4 (pre-2009 reconstruction) |
| Foreign Workforce Numbers | DataGov / MOM | Various | Viz 4 (validation) |
| International Migrant Stock 2020 | UN DESA | 1990–2020 | Viz 3 |
| Reddit posts | r/singapore, r/askSingapore, r/SingaporeRaw | 2015–2025 | Viz 1+2 |
| News articles | The Independent SG | 2015–2025 | Viz 1+2 |

See [`data/README.md`](data/README.md) for the complete data dictionary.

---

## Technology Stack

| Technology | Version | Used In |
|------------|---------|---------|
| D3.js | v7 | Viz 1, 2, 4 — charts, scales, layouts |
| React | 19 | Viz 3 — globe UI and state management |
| TypeScript | Strict | Viz 3 — type-safe globe implementation |
| D3-geo | — | Viz 3 — projections and great-circle arcs |
| Canvas API | — | Viz 3 — high-performance globe rendering |
| Tailwind CSS | — | Viz 3 — utility styling |
| Vite | — | Viz 3 — build tool (pre-built output) |
| Python 3 | 3.10+ | Labor share + sentiment pipelines |
| GPT-4o-mini | — | Sentiment classification (stance, topic, themes) |

---

## Documentation

| Path | Contents |
|------|----------|
| [`docs/labor-share/`](docs/labor-share/) | Dashboard layout, encoding, interactions |
| [`docs/globe/`](docs/globe/) | Globe viz overview, encoding, data |
| [`docs/sentiment/`](docs/sentiment/) | Chart descriptions, encoding, limitations |
| [`pipeline/README.md`](pipeline/README.md) | Pipeline overview with run instructions and dependencies |
| [`data/README.md`](data/README.md) | Complete data dictionary with schemas |
| [`src/sentiment/README.md`](src/sentiment/README.md) | Sentiment visualization quick reference |
| [`src/globe/README.md`](src/globe/README.md) | Globe visualization quick reference |
