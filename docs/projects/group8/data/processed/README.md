# Processed Data

Final analysis-ready outputs from pipeline steps 04–06, plus D3-optimized files for the labor share visualization.

## Core Pipeline Outputs

### `merged_employment_gdp.csv`

**Produced by:** `pipeline/labor-share/step04_merge.py`
**Inputs:** All three interim files + `mappings/industry_code_mapping.csv`

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year |
| `sector_key` | string | Standardized sector identifier |
| `total_employment_thousands` | float | Total employment |
| `resident_employment_thousands` | float | Resident employment (null if unavailable) |
| `gdp_current_million_sgd` | float | GDP at current prices |
| `nonresident_employment_thousands` | float | Derived: total − resident |
| `data_quality_flag` | string | Quality indicator for the record |
| `level` | int | Hierarchy level (0=economy, 1=sector, 2=subsector, 3=sub-subsector) |
| `parent_sector_key` | string | Parent in sector hierarchy |
| `ssic_2020_code` | string | SSIC 2020 classification code |

901 rows.

### `foreign_worker_share_by_industry.csv`

**Produced by:** `pipeline/labor-share/step05_compute_shares.py`
**Input:** `merged_employment_gdp.csv`

Extends the merged data with derived analytical columns:

| Additional Column | Type | Description |
|-------------------|------|-------------|
| `nonresident_share_pct` | float | Non-resident share of total employment (%) |
| `gdp_per_worker_thousand_sgd` | float | GDP per worker (thousand SGD) |
| `yoy_total_change_pct` | float | Year-on-year total employment change (%) |
| `yoy_nonresident_change_pct` | float | Year-on-year non-resident employment change (%) |
| `yoy_resident_change_pct` | float | Year-on-year resident employment change (%) |

901 rows.

### `summary_statistics.csv`

**Produced by:** `pipeline/labor-share/step05_compute_shares.py`

One row per sector with latest-year snapshot and trend metrics:

| Column | Type | Description |
|--------|------|-------------|
| `sector_key` | string | Sector identifier |
| `level` | int | Hierarchy level |
| `nonresident_share_pct_2025` | float | Latest non-resident share (%) |
| `earliest_year` | int | First year with data |
| `nonresident_share_pct_earliest` | float | Non-resident share in earliest year |
| `share_change_pp` | float | Change in non-resident share (percentage points) |

12 rows.

## D3 Visualization Files

### `d3_overview.csv`

**Produced by:** `pipeline/labor-share/step06_build_d3_json.py`

Economy-wide time series for the overview bar chart.

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year (1990–2025) |
| `total_emp` | float | Total employment (thousands) |
| `resident_emp` | float | Resident employment (thousands) |
| `nonresident_emp` | float | Non-resident employment (thousands) |
| `nonresident_share_pct` | float | Non-resident share (%) |

36 rows.

### `d3_timeseries.csv`

**Produced by:** `pipeline/labor-share/step06_build_d3_json.py`

Sector-level time series for the detailed stacked-bar and bump charts.

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year |
| `sector_key` | string | Sector identifier |
| `level` | int | Hierarchy level |
| `total_emp`, `resident_emp`, `nonresident_emp` | float | Employment in thousands |
| `nonresident_share_pct` | float | Non-resident share (%) |
| `gdp_million_sgd` | float | GDP (million SGD) |
| `gdp_per_worker_thousand_sgd` | float | Labour productivity |
| `data_source` | string | `official` or `reconstructed` (pre-2009) |

399 rows.

### `d3_sectors.csv`

**Produced by:** `pipeline/labor-share/step06_build_d3_json.py`

Sector metadata for labels, colors, and hierarchy.

| Column | Type | Description |
|--------|------|-------------|
| `sector_key` | string | Sector identifier |
| `label` | string | Display name |
| `level` | int | Hierarchy level |
| `parent` | string | Parent sector key |
| `ssic_2020_code` | string | SSIC 2020 code range |
| `colour` | string | Hex color for charts |

19 rows.

> **Note:** The viz loads `d3_overview.json` and `d3_timeseries.json` (JSON versions) from the `data/` root. These are generated alongside the CSVs by `step06`.
