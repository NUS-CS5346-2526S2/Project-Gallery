# Raw Labor Data

Employment, GDP, and foreign workforce source files from three Singapore government agencies.

## SingStat Table Builder (JSON)

All SingStat files share the same API envelope:
```json
{ "Data": { "id": "MXXXXXX", "title": "...", "row": [ { "rowText": "...", "uoM": "...", "columns": [ { "key": "YYYY", "value": "..." } ] } ] } }
```

| File | Table ID | Title | Unit | Rows | Period | Source Agency |
|------|----------|-------|------|------|--------|---------------|
| `employed_residents_by_industry.json` | M182131 | Employed Residents Aged 15 Years And Over By Industry And Age Group, (June), Annual | Thousand | 193 | 2000–2025 | MOM Labour Force Survey via SingStat |
| `gdp_by_industry_annual.json` | M015731 | Gross Domestic Product At Current Prices, By Industry (SSIC 2020), Annual | Million Dollars | 29 | 1960–2025 | DOS via SingStat |
| `employment_by_sector_annual.json` | M182841 | Employment (Persons) By Sector, (As At Year-End), Annual | Thousand | 13 | 2001–2023 | MOM via SingStat |
| `labour_force_annual.json` | M182331 | Labour Force Aged 15 Years And Over, End June, Annual | Thousand | 5 | 1970–2025 | MOM + DOS via SingStat |
| `nonresident_pass_types_annual.json` | M810791 | Share Of Non-Resident Population By Pass Types, At End June, Annual | Per Cent | 8 | 2000–2025 | DOS + MOM via SingStat |
| `gdp_by_industry_quarterly.json` | M015651 | Gross Domestic Product At Current Prices, By Industry (SSIC 2020), Quarterly | Million Dollars | 29 | varies | DOS via SingStat |

**API pattern:** `https://tablebuilder.singstat.gov.sg/api/table/tabledata/{TABLE_ID}`

### Pipeline Role

- **M182131** → `step02` resident employment extraction
- **M015731** → `step03` GDP extraction
- **M182841**, **M182331**, **M810791** → supplementary / cross-validation only

## MOM Statistics (XLSX / CSV)

| File | Schema | Source URL | Description | Period |
|------|--------|-----------|-------------|--------|
| `mom_emp_level_by_ind.xlsx` | Sheets: Contents, SSIC1996, SSIC2005, SSIC2020. Each sheet has industry rows × year columns. | [MOM Stats XLSX](https://stats.mom.gov.sg/iMAS_Tables1/Time-Series-Table/mrsd_65_annl_emp_lvl_by_ind.xlsx) | Total employment level by industry across SSIC revisions | 1990–2025 |
| `mom_emp_by_ind_and_res_stat.xlsx` | Single sheet: year, residential status (resident/non-resident), industry, employment change + employment level columns | [MOM Stats CSV](https://stats.mom.gov.sg/iMAS_Tables1/CSV/mrsd_39_annual_%20emp_chng_by_ind_and_res_stat_20032026.csv) | Employment change by industry × residential status | 1991–2025 |
| `mom_emp_by_ind_and_res_stat.csv` | `year, res_stat, industry1, employment_change` (280 rows) | Same as above (CSV export) | CSV version of the employment change data | 1991–2025 |
| `mom_foreign_workforce_numbers.xlsx` | Single sheet: pass-type breakdown (EP, S Pass, WP, FDW, etc.) by half-year snapshots | [MOM Foreign Workforce](https://www.mom.gov.sg/-/media/mom/documents/statistics-publications/foreign-workforce-numbers.xlsx) | Official foreign workforce numbers by pass type (ground truth) | Dec 2020–2025 |

### Pipeline Role

- **mom_emp_level_by_ind.xlsx** → `step01` total employment extraction
- **mom_emp_by_ind_and_res_stat.csv** → `step06` pre-2009 reconstruction via cumulative change
- **mom_foreign_workforce_numbers.xlsx** → supplementary / validation only

## data.gov.sg (CSV)

Five CSVs from [data.gov.sg Collection 694](https://data.gov.sg) ("Foreign Workforce Numbers, Annual"). Used for cross-validation only — figures match MOM's official XLSX exactly for overlapping years.

| File | Schema | Description |
|------|--------|-------------|
| `datagov_total_fw.csv` | `month, count` (6 rows) | Total foreign workforce, Dec snapshots 2017–2022 |
| `datagov_fw_by_pass_type.csv` | `month, work_pass_type, count` (24 rows) | Foreign workforce breakdown by EP/S Pass/WP/FDW |
| `datagov_fdw_construction.csv` | `month, work_pass_type, count` (12 rows) | FDW + construction WP breakdown |
| `datagov_fw_excl_fdw.csv` | `month, count` (6 rows) | Foreign workforce excluding domestic workers |
| `datagov_fw_excl_fdw_const.csv` | `month, count` (6 rows) | Foreign workforce excluding FDW and construction |

Month format: `YYYY-MM` (December snapshots). Counts use comma-formatted strings (e.g. `"1,368,000"`).
