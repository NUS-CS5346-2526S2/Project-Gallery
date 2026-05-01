# Raw Migration Data

Geographic migration stock data for the globe visualization.

## Files

### `migration.json`

Cleaned and structured output from the UN DESA International Migrant Stock **2020** release (Table 1: destination × origin). Produced by `pipeline/globe/prep_data.js` from the original XLSX.

**Schema:**

| Key | Type | Description |
|-----|------|-------------|
| `years` | `int[]` | 7 snapshot years: `[1990, 1995, 2000, 2005, 2010, 2015, 2020]` |
| `singapore` | `{lon, lat}` | Singapore centroid (`103.8198, 1.3521`) |
| `countries` | `object[]` | Array of 15 origin countries |

**Country object:**

| Field | Type | Description |
|-------|------|-------------|
| `m49` | int | UN M49 country code |
| `name` | string | Country name (e.g. "Bangladesh") |
| `iso3` | string | ISO 3166-1 alpha-3 code |
| `continent` | string | Continent name |
| `lon`, `lat` | float | Country centroid coordinates |
| `stock` | `int[]` | Foreign-born migrant stock in Singapore for each of the 7 years |
| `delta` | `(int\|null)[]` | Net change between consecutive snapshots (`null` for 1990) |

**Origin countries (15):** Malaysia, China, Indonesia, India, Pakistan, Bangladesh, Hong Kong SAR, Philippines, Sri Lanka, Thailand, Macao SAR, United States, Australia, Canada, New Zealand.

**Source:** [UN DESA International Migrant Stock 2020](https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2020_ims_stock_by_sex_destination_and_origin.xlsx)

> The 2020 release was chosen over 2024 because the 2024 edition only itemises 10 origins for Singapore, folding Philippines, Bangladesh, Pakistan, Thailand and others into an unattributed "Others" bucket. The 2020 release preserves all 15 origins across 7 snapshots.

"Migrant" in this dataset means foreign-born residents at mid-year — workers, students, dependents, and permanent residents all counted together.

### `countries-110m.json`

World-atlas TopoJSON (110m resolution) providing the base map geometry.

**Schema:** Standard TopoJSON with `type: "Topology"`, containing `objects.countries` (country polygons) and `objects.land` (merged land mass).

**Source:** [world-atlas](https://github.com/topojson/world-atlas) npm package (`countries-110m.json`), derived from Natural Earth 1:110m data.
