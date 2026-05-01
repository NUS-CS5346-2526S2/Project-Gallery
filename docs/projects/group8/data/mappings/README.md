# Mappings

Lookup tables used to harmonize raw data across sources with different industry classification schemes.

## `industry_code_mapping.csv`

The master mapping that standardizes industry names across MOM XLSX headers, SingStat JSON row labels, and data.gov.sg categories into a single `sector_key` vocabulary.

**54 rows** covering all sectors at 4 hierarchy levels.

| Column | Type | Description |
|--------|------|-------------|
| `sector_key` | string | Canonical identifier (e.g. `manufacturing`, `construction`, `info_comms`) |
| `level` | int | Hierarchy depth: 0 = economy-wide, 1 = broad sector, 2 = sub-sector, 3 = sub-sub-sector |
| `parent_sector_key` | string | Parent sector (empty for level 0) |
| `ssic_2020_code` | string | SSIC 2020 classification code range (e.g. `C10-32`, `F41-43`) |
| `total_emp_xlsx_name` | string | Matching row label in `mom_emp_level_by_ind.xlsx` |
| `resident_emp_json_name` | string | Matching `rowText` in SingStat M182131 JSON |
| `gdp_json_name` | string | Matching `rowText` in SingStat M015731 JSON |
| `emp_by_sector_json_name` | string | Matching `rowText` in SingStat M182841 JSON |
| `emp_change_csv_name` | string | Matching `industry1` value in `mom_emp_by_ind_and_res_stat.csv` |
| `notes` | string | Additional context |

### Hierarchy Example

```
total (level 0)
├── manufacturing (level 1)
├── construction (level 1)
├── services (level 1)
│   ├── wholesale_retail (level 2)
│   ├── accomm_food (level 2)
│   │   ├── accomm (level 3)
│   │   └── food_bev (level 3)
│   ├── info_comms (level 2)
│   └── ...
└── others (level 1)
```

### Purpose

Each pipeline step uses this mapping to translate source-specific labels into `sector_key`, ensuring all interim and processed files share a consistent vocabulary regardless of which raw source they were extracted from.
