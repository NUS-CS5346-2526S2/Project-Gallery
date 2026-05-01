# Migration Globe

A scrollytelling 3D globe showing migrant stock flows from 15 origin countries
to Singapore across seven UN DESA snapshots (1990, 1995, 2000, 2005, 2010, 2015, 2020).

## Overview

As the user scrolls, the globe interpolates between years, with animated arcs and
flying-plane icons representing the rate of change in migrant stock. The visualization
answers: _Where do Singapore's foreign-born residents come from, and how has that
composition shifted over 30 years?_

## Data Source

**UN DESA International Migrant Stock 2020**, Table 1 (destination × origin).
"Migrant" = foreign-born resident at mid-year (workers, students, dependents, PRs).

15 origin countries are visualized individually; smaller origins are aggregated
into an "Other" category (~286K in 2020, not shown as arcs).

## Interaction

| Action | Effect |
|--------|--------|
| **Scroll** | Advance year (scroll position 0→1 maps to 1990→2020) |
| **Hover arc/country** | Sparkline popup showing stock trend across all years |
| **Click arc/country** | Pin selection for comparison |
| **Drag** | Rotate globe |
| **Projection toggle** | Switch between Globe (orthographic) and Equal Earth |
| **Country filters** | Show/hide individual origin countries |

## Technology

| Component | Version / Notes |
|-----------|----------------|
| React | 19 |
| TypeScript | Strict mode |
| D3-geo | Projections + great-circle arcs |
| Canvas API | Single rAF render loop |
| Tailwind CSS | Utility styling |
| Vite | Build tool (output pre-built) |

## Viewing

The globe is **pre-built** — `index.html` + `assets/` contain the Vite production
output. No build step is needed. Serve the `output/` directory and navigate to
`/src/globe/` or view it embedded in the combined `index.html` via iframe.

```bash
cd output/
python3 -m http.server 8000
# Open http://localhost:8000/src/globe/
```

## File Structure

```
globe/
├── index.html           # Vite build entry point
├── assets/              # Bundled JS + CSS (Vite output)
├── migration.json       # UN DESA migrant stock data
├── countries-110m.json  # TopoJSON world basemap (Natural Earth 110m)
├── icons.svg            # Plane + UI icons
└── favicon.svg
```

## Further Reading

- [Globe design documentation](../../docs/globe/) — interpolation, arc geometry, performance
- [Data dictionary](../data/README.md)
- [Combined project page](../index.html)
