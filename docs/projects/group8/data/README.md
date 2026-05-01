# Data Dictionary

All datasets used by the four visualizations. Raw government and web data is
transformed through independent pipelines into the JSON files consumed by D3.js
and React.

---

## Directory Layout

```
data/
├── d3_overview.json        # Economy-wide employment (Viz 4)
├── d3_timeseries.json      # Sector-level employment (Viz 4)
├── d3_sectors.json         # Sector metadata (Viz 4)
├── migration.json          # UN DESA migrant stock (Viz 3)
├── countries-110m.json     # TopoJSON world basemap (Viz 3)
├── viz_data.json           # Sentiment aggregates (Viz 1+2)
├── raw/
│   ├── labor/              # MOM + SingStat + DataGov originals
│   ├── sentiment/          # Reddit + Independent SG scrapes
│   └── migration/          # UN DESA source files
├── interim/                # Standardized intermediaries (3 CSVs)
├── processed/              # Analytical outputs (6 CSVs)
└── mappings/               # Industry code mapping (54 rows)
```

---

## Raw Sources

### Labor (`raw/labor/`)

| File | Provider | Coverage | Format |
|------|----------|----------|--------|
| `mom_emp_level_by_ind.xlsx` | MOM Administrative Records | 2008–2025 | xlsx |
| `employed_residents_by_industry.json` | SingStat LFS (M182131) | 2000–2025 | JSON |
| `gdp_by_industry_annual.json` | SingStat (M015731) | 1960–2025 | JSON |
| `mom_emp_by_ind_and_res_stat.xlsx` | MOM | 1991–2025 | xlsx |
| `mom_emp_by_ind_and_res_stat.csv` | MOM (CSV export) | 1991–2025 | CSV |
| `mom_foreign_workforce_numbers.xlsx` | MOM | Various | xlsx |
| `datagov_total_fw.csv` | DataGov | Various | CSV |
| `datagov_fw_by_pass_type.csv` | DataGov | Various | CSV |
| `datagov_fw_excl_fdw.csv` | DataGov | Various | CSV |
| `datagov_fw_excl_fdw_const.csv` | DataGov | Various | CSV |
| `datagov_fdw_construction.csv` | DataGov | Various | CSV |
| `employment_by_sector_annual.json` | SingStat | Various | JSON |
| `labour_force_annual.json` | SingStat | Various | JSON |
| `gdp_by_industry_quarterly.json` | SingStat | Various | JSON |
| `nonresident_pass_types_annual.json` | SingStat | Various | JSON |

### Sentiment (`raw/sentiment/`)

| File | Source | Description |
|------|--------|-------------|
| `reddit_raw.csv` | Reddit API (PRAW) | Posts from r/singapore, r/askSingapore, r/SingaporeRaw (2020–2025) |
| `arcticshift_raw.csv` | Arctic Shift archive | Historical Reddit posts (2015–2019) |
| `reddit_extra_raw.csv` | Reddit API | Additional scrape runs |
| `independent_sg_raw.csv` | The Independent SG | Scraped articles (2015–2025) |
| `combined_clean.csv` | Pipeline output | Deduplicated + filtered corpus |
| `llm_labeled.csv` | Pipeline output | GPT-4o-mini classified posts |

### Migration (`raw/migration/`)

| File | Source | Description |
|------|--------|-------------|
| `migration.json` | UN DESA Migrant Stock 2020 | 15 origin countries × 7 snapshots |
| `countries-110m.json` | Natural Earth / TopoJSON | World basemap (110m resolution) |

---

## D3-Ready Outputs

These JSON files are loaded directly by the visualizations.

### `d3_overview.json` — Economy-Wide Employment

**36 rows** (1990–2025), one per year.

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year |
| `total_emp` | float (thousands) | Total employment |
| `resident_emp` | float (thousands) | Resident employment |
| `nonresident_emp` | float (thousands) | Derived: total − resident |
| `nonresident_share_pct` | float (%) | Non-resident / total × 100 |

### `d3_timeseries.json` — Sector-Level Employment

**399 rows** (19 sectors × variable year coverage).

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year |
| `sector_key` | string | Canonical sector identifier |
| `level` | int | 1 = broad sector, 2 = services sub-sector |
| `total_emp` | float (thousands) | Total employment |
| `resident_emp` | float (thousands) | Resident employment |
| `nonresident_emp` | float (thousands) | Derived: total − resident |
| `nonresident_share_pct` | float (%) | Non-resident share |
| `gdp_million_sgd` | float | GDP at current prices |
| `gdp_per_worker_thousand_sgd` | float | GDP / total employment |
| `data_source` | string | `"direct"` (2009+) or `"reconstructed"` (1990–2008) |

### `d3_sectors.json` — Sector Metadata

**19 rows**, one per sector.

Contains labels, display names, hierarchy level, colour assignments, and
sort order for the bar chart.

### `viz_data.json` — Sentiment Aggregates

Aggregated from ~4,063 classified posts. Contains:
- Counts by stance × topic × source
- Theme frequency lists per stance
- Example quotes per topic/stance combination

### `migration.json` — Migrant Stock by Origin

15 origin countries with stock values at 7 snapshots (1990–2020), plus
coordinates (lon/lat) and metadata (ISO3, continent, M49 code).

### `countries-110m.json` — World Basemap

TopoJSON features (~180 countries) from Natural Earth 110m. Used as the
globe/map background in the migration visualization.

---

## Interim Files (`interim/`)

Standardized intermediary CSVs produced by pipeline steps 01–03:

| File | Source Step | Description |
|------|-----------|-------------|
| `total_employment_by_industry.csv` | Step 01 | MOM total employment, standardized sectors |
| `resident_employment_by_industry.csv` | Step 02 | SingStat resident employment, standardized |
| `gdp_by_industry_annual.csv` | Step 03 | SingStat GDP, standardized sectors |

---

## Processed Files (`processed/`)

Analytical outputs from pipeline steps 04–06:

| File | Rows | Description |
|------|------|-------------|
| `merged_employment_gdp.csv` | 901 | Outer join of all sources on (year, sector_key) |
| `foreign_worker_share_by_industry.csv` | — | Non-resident share by sector and year |
| `summary_statistics.csv` | — | Descriptive statistics for QA |
| `d3_overview.csv` | 36 | CSV version of d3_overview.json |
| `d3_timeseries.csv` | 399 | CSV version of d3_timeseries.json |
| `d3_sectors.csv` | 19 | CSV version of d3_sectors.json |

---

## Mappings (`mappings/`)

### `industry_code_mapping.csv` — 54 rows

Maps between SSIC 2015 (MOM) and SSIC 2020 (SingStat) sector taxonomies.
The composite join key is `year × sector_key`, allowing the pipeline to resolve
classification changes that occurred across different data vintages.
