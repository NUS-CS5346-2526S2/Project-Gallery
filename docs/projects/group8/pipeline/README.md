# Data Pipelines

Three independent pipelines transform raw data into the JSON files consumed by
the visualizations. Each pipeline lives in its own subdirectory.

---

## 1. Labor Share (Python)

**Path:** `pipeline/labor-share/`

A six-step pipeline that merges government employment and GDP data into
D3-ready JSON files.

```
Step 01 — Standardize MOM total employment       (47 SSIC sectors, 2008–2025)
Step 02 — Standardize SingStat resident employment (M182131, 17 sectors, 2000–2025)
Step 03 — Standardize SingStat GDP by industry     (M015731, 28 sectors, 1960–2025)
Step 04 — Outer join on (year, sector_key)         → merged_employment_gdp.csv
Step 05 — Derive non-resident employment, shares, GDP/worker, YoY changes
Step 06 — Reconstruct 1990–2008 + emit D3 JSON    → d3_overview.json, d3_timeseries.json, d3_sectors.json
```

A manually curated **54-row mapping table** (`data/mappings/industry_code_mapping.csv`)
resolves mismatches between SSIC 2015 (MOM) and SSIC 2020 (SingStat) sector
taxonomies. The composite join key is `year × sector_key`.

### Running

```bash
pip install pandas openpyxl
python -m pipeline.labor-share.run_pipeline
```

### Dependencies

- `pandas` — data manipulation
- `openpyxl` — Excel file parsing (MOM xlsx sources)

### Outputs

| File | Records | Description |
|------|---------|-------------|
| `d3_overview.json` | 36 | Economy-wide employment (1990–2025) |
| `d3_timeseries.json` | 399 | Sector-level employment (19 sectors × years) |
| `d3_sectors.json` | 19 | Sector metadata (labels, hierarchy, colours) |

---

## 2. Sentiment (Python)

**Path:** `pipeline/sentiment/`

Two-phase pipeline: scraping → processing.

### Scraping (`scraper/`)

| Script | Source | Method |
|--------|--------|--------|
| `reddit_scraper.py` | Reddit (3 subreddits) | Reddit API (PRAW) |
| `arcticshift_scraper.py` | Reddit historical (2015–2019) | Arctic Shift archive |
| `independent_scraper.py` | The Independent SG | BeautifulSoup |

### Processing (`processing/`)

```
clean.py         — Dedup (SHA-256), language filter, normalize
llm_label.py     — GPT-4o-mini classification (stance, topic, themes)
aggregate.py     — Produce viz_data.json
```

### Running

```bash
pip install requests beautifulsoup4 langdetect openai
export OPENAI_API_KEY=sk-...

# Scrape (optional — raw data already included)
python pipeline/sentiment/scraper/reddit_scraper.py
python pipeline/sentiment/scraper/arcticshift_scraper.py
python pipeline/sentiment/scraper/independent_scraper.py

# Process
python pipeline/sentiment/processing/clean.py
python pipeline/sentiment/processing/llm_label.py
python pipeline/sentiment/processing/aggregate.py
```

> **Note:** `llm_label.py` requires an OpenAI API key and incurs API costs
> (~$2–5 for the full corpus at GPT-4o-mini rates).

### Dependencies

- `requests` — HTTP requests
- `beautifulsoup4` — HTML parsing
- `langdetect` — language detection
- `openai` — GPT-4o-mini API client

### Output

| File | Description |
|------|-------------|
| `viz_data.json` | Aggregated sentiment data for D3 visualization |

---

## 3. Globe (Node.js)

**Path:** `pipeline/globe/`

A single script that downloads the UN DESA International Migrant Stock 2020 xlsx,
extracts Table 1 (destination × origin), filters for Singapore, and outputs
`migration.json` with stock values for 15 origin countries across 7 snapshots.

### Running

```bash
npm install xlsx
node pipeline/globe/prep_data.js
```

### Dependencies

- `xlsx` — Excel file parsing

### Output

| File | Description |
|------|-------------|
| `migration.json` | 15 countries × 7 snapshots (1990–2020), with coordinates |
