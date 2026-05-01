# Sleep Signals: A Guided Information Visualization of Student Sleep Patterns and Academic Outcomes

Interactive information visualization project for CS5346 on how sleep-related behaviors, daytime strain, and academic pressure relate to student outcomes.

## Repository Structure

```
.
├── index.html                  # Landing page — problem framing and navigation into audience tracks
├── student.html                # Student track — plain-language factor cards and outcome chart
├── educator.html               # Educator track — ranked factors and row-normalized heatmap
├── context.html                # Global context — interactive benchmark scatter plot and country ranking
├── method.html                 # Data and method — dataset provenance, glossary, caveats
├── assets/
│   ├── site.css                # Shared stylesheet for all pages
│   ├── theme.js                # Dark/light theme toggle logic
│   ├── data.js                 # Loads and parses survey and benchmark data
│   ├── charts.js               # Reusable D3 chart components
│   ├── index.js                # Scripts for index.html
│   ├── student.js              # Scripts for student.html
│   ├── educator.js             # Scripts for educator.html
│   ├── context.js              # Scripts for context.html (benchmark interaction)
│   ├── method.js               # Scripts for method.html
│   └── vendor/
│       └── d3.v7.min.js        # Vendored D3 v7 (no CDN dependency)
├── data/
│   ├── local-survey-bundle.js  # Survey responses (996 rows) bundled as a JS module
│   ├── global-sleep-benchmarks.js  # 17 country-level student-sleep benchmark records
│   └── Student Insomnia and Educational Outcomes Dataset_version-2.csv  # Raw survey CSV
├── prototype/
│   └── index_v2.html           # Archived earlier prototype (not part of the live site)
└── progress.md                 # Project status notes and feedback synthesis
```

## How to Launch

Open [index.html](index.html) directly in your browser — no build step or server required.

> If any charts fail to load (some browsers block local `file://` requests for JS modules), serve the folder with a simple local server instead:
> ```bash
> python3 -m http.server 8000
> ```
> Then visit `http://localhost:8000` in your browser.
