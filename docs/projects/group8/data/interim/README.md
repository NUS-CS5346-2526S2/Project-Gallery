# Interim Data

Standardized intermediate outputs from pipeline steps 01–03. Each file extracts and normalizes one dimension from the raw sources into a consistent `year × sector_key` format.

## Files

### `total_employment_by_industry.csv`

**Produced by:** `pipeline/labor-share/step01_extract_total_employment.py`
**Source:** `raw/labor/mom_emp_level_by_ind.xlsx`

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year |
| `sector_key` | string | Standardized sector identifier (e.g. `manufacturing`, `construction`) |
| `total_employment_thousands` | float | Total employment (residents + non-residents) in thousands |

846 rows. Covers 2008–2025 (SSIC2020 sheet), with additional rows from SSIC1996/2005 for historical coverage.

### `resident_employment_by_industry.csv`

**Produced by:** `pipeline/labor-share/step02_extract_resident_employment.py`
**Source:** `raw/labor/employed_residents_by_industry.json` (SingStat M182131)

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year (mid-year June survey) |
| `sector_key` | string | Standardized sector identifier |
| `resident_employment_thousands` | float | Resident employment (citizens + PRs) in thousands |

442 rows. Covers 2000–2025.

### `gdp_by_industry_annual.csv`

**Produced by:** `pipeline/labor-share/step03_extract_gdp.py`
**Source:** `raw/labor/gdp_by_industry_annual.json` (SingStat M015731)

| Column | Type | Description |
|--------|------|-------------|
| `year` | int | Calendar year |
| `sector_key` | string | Standardized sector identifier |
| `gdp_current_million_sgd` | float | GDP at current market prices in million SGD |

1,308 rows. Covers 2005–2025 for industry-level, 1960–2025 for aggregate GDP.

## Sector Key Mapping

All three files use the same `sector_key` vocabulary defined in `mappings/industry_code_mapping.csv`. Examples: `manufacturing`, `construction`, `info_comms`, `finance_insurance`, `accomm_food`.
