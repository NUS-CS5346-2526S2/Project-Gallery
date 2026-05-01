# Sentiment Visualizations

Two linked D3.js visualizations analyzing public discourse on foreign labour in Singapore,
built from ~4,063 online posts (Reddit + The Independent SG, 2015–2025).

## Visualizations

### 1. The Overall Picture of Public Sentiment

A **diverging bar chart** showing how sentiment breaks down by topic. Each bar
extends left (concerned/anti) or right (supportive/pro) from a zero baseline,
with neutral posts anchored in the centre. Topics include Policy & Government,
Worker Welfare & Rights, Jobs & Employment, Identity & Culture, Economy & Wages,
and General.

### 2. Two Different Worldviews

A **word cloud pair** contrasting the vocabulary of concerned vs. supportive posts.
Word size encodes frequency; colour matches the red (concerned) / blue (supportive)
palette used throughout the project. Themes are extracted per-post by GPT-4o-mini
(1–3 themes each).

## Interaction

- **Source filter buttons** — toggle between Reddit, The Independent SG, or All
- **Hover tooltips** — show post count, percentage, and an example quote
- **Scroll-triggered rendering** — charts animate into view as the user scrolls

## Data

The visualization loads `viz_data.json`, an aggregated dataset produced by the
sentiment processing pipeline. Each record contains stance, topic, source, themes,
and confidence scores.

See [`../data/`](../data/) for the full data dictionary.

## Technology

| Component | Version |
|-----------|---------|
| D3.js | v7 |
| JavaScript | ES6 modules (IIFE pattern) |
| CSS | Vanilla, in `css/style.css` |

No build step — serve with any static HTTP server.

## File Structure

```
sentiment/
├── index.html       # Standalone sentiment page
├── viz_data.json    # Aggregated sentiment data
├── css/
│   └── style.css    # Chart and layout styles
└── js/              # D3 chart modules
```

> **Note:** On the combined page (`index.html` at root), these charts are rendered
> inline using D3 — the standalone `sentiment/index.html` is a development fallback.

## Classification Schema

Each of the ~4,063 posts was classified by GPT-4o-mini (temperature 0.1):

| Field | Values |
|-------|--------|
| **Stance** | anti (concerned), pro (supportive), neutral |
| **Topic** | 6 categories (Policy, Welfare, Jobs, Identity, Economy, General) |
| **Themes** | 1–3 free-text themes per post |
| **Confidence** | 0.0–1.0 |

## Further Reading

- [Sentiment pipeline & design documentation](../../docs/sentiment/)
- [Data dictionary](../data/README.md)
- [Combined project page](../index.html)

