# Raw Sentiment Data

Online forum posts about foreign workers in Singapore, scraped and classified for sentiment analysis.

## Source

| Platform | Subreddits / Site | Scraper | Posts |
|----------|-------------------|---------|-------|
| Reddit (recent) | r/singapore, r/askSingapore, r/SingaporeRaw | `reddit_scraper.py` (public JSON API) | ~14,600 |
| Reddit (historical) | Same subreddits | `arcticshift_scraper.py` (Arctic Shift / Pushshift replacement) | ~4,470 |
| Reddit (extra) | Same subreddits | Additional scrape pass | ~25,170 |
| The Independent SG | theindependent.sg | `independent_scraper.py` (requests + BeautifulSoup) | ~300 |

Coverage: **2015–2025**. Search terms: `foreign worker`, `CECA`, `foreign talent`, `work permit`, `PMET`, etc.

## Raw Scraped Files

| File | Rows | Description |
|------|------|-------------|
| `reddit_raw.csv` | 14,606 | Reddit posts via public JSON API |
| `arcticshift_raw.csv` | 4,470 | Historical Reddit posts (2015–2019) via Arctic Shift API |
| `reddit_extra_raw.csv` | 25,171 | Extended Reddit scrape |
| `independent_sg_raw.csv` | 298 | The Independent Singapore articles |

**Schema (all raw files):**

| Column | Type | Description |
|--------|------|-------------|
| `id` | string | Post/article unique ID |
| `text` | string | Full post body or article text |
| `title` | string | Post title or article headline |
| `score` | int | Reddit score (0 for articles) |
| `date` | string | Publication date (`YYYY-MM-DD`) |
| `author` | string | Username or site name |
| `source` | string | `reddit` or `independent_sg` |
| `type` | string | `post`, `comment`, or `article` |

## Processed Files

These files are outputs of the cleaning and LLM classification pipeline, stored here alongside the raw data for convenience.

| File | Rows | Description |
|------|------|-------------|
| `combined_clean.csv` | 4,164 | Deduplicated, cleaned, filtered posts from all sources |
| `llm_labeled.csv` | 4,164 | Same posts with LLM-assigned stance, topic, themes |

**Additional columns in `llm_labeled.csv`:**

| Column | Type | Description |
|--------|------|-------------|
| `stance` | string | `pro`, `anti`, or `neutral` toward foreign workers |
| `topic` | string | Primary topic category (e.g. "Identity & Culture", "Jobs & Economy") |
| `themes` | string | JSON array of theme tags (e.g. `["cultural integration", "empathy"]`) |
| `confidence` | float | LLM confidence score (0–1) |

## Pipeline

Raw → `processing/clean.py` → `combined_clean.csv` → `processing/llm_classify.py` → `llm_labeled.csv` → `processing/build_viz_data.py` → `src/sentiment/viz_data.json`

See `pipeline/sentiment/` for full source code.
