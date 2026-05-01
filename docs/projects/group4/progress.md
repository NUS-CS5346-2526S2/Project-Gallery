# Project Progress

## Snapshot

- Project: Sleep Signals
- Updated: March 26, 2026
- Status: redesigned site implemented, benchmark layer added, runtime fetch failures removed from the new pages

## What Was Reviewed

- [x] Midpoint slide deck in [research/Midpoint Presentation.pdf](research/Midpoint%20Presentation.pdf)
- [x] Teaching-team feedback in [research/Comments from teaching team.docx](research/Comments%20from%20teaching%20team.docx)
- [x] Archived prototype in [prototype/index_v2.html](prototype/index_v2.html)
- [x] Survey dataset in [data/Student Insomnia and Educational Outcomes Dataset_version-2.csv](data/Student%20Insomnia%20and%20Educational%20Outcomes%20Dataset_version-2.csv)

## Completed

- [x] Initialized a local Git repository in the project folder.
- [x] Reorganized the working files into `prototype/`, `data/`, and `research/`.
- [x] Added root project documentation: `README.md`, `BRD.md`, and `progress.md`.
- [x] Created the remote GitHub repository and pushed the local repo.
- [x] Built a new root site with `index.html`, `student.html`, `educator.html`, and `method.html`.
- [x] Added `context.html` as a dedicated cross-country benchmark page.
- [x] Replaced the split educator structure with a ranked shortlist plus one row-normalized heatmap.
- [x] Rewrote the student experience around four guided factors and one combined distribution chart.
- [x] Added a `Data & Method` page with respondent profile, glossary, and caveats.
- [x] Expanded the product scope from a single-survey MVP to a primary-survey-plus-benchmark architecture.
- [x] Bundled survey rows into `data/local-survey-bundle.js` so the redesigned pages no longer depend on runtime CSV fetches.
- [x] Vendored D3 under `assets/vendor/` so the redesigned pages no longer depend on a charting CDN at runtime.
- [x] Made the benchmark page interactive with hover tooltips, clickable bubbles, and clickable ranking rows.
- [x] Corrected the archived prototype auto-load path so it can find the current CSV in `data/` when served from the repo root.
- [x] Updated `README.md`, `BRD.md`, and `progress.md` to reflect the broader scope and current site structure.

## Current Structure

- [x] Root entry points:
  - `index.html`
  - `student.html`
  - `educator.html`
  - `context.html`
  - `method.html`
- [x] Shared logic and styling live in `assets/`.
- [x] Survey data is now delivered through `data/local-survey-bundle.js`.
- [x] Benchmark records are now delivered through `data/global-sleep-benchmarks.js`.
- [x] Shared chart rendering is now served from `assets/vendor/d3.v7.min.js`.
- [x] The archived prototype remains preserved in `prototype/` as a reference artifact rather than the target design.

## Teaching-Team Feedback Synthesis

Main themes from the written feedback:

- The current problem framing and audience definition are strong.
- Ordinal data deserves visualization choices that fit it better than generic dashboard charts.
- Student-facing content should be simpler and more guided.
- Educator-facing content should combine factor and outcome evidence instead of splitting them across disconnected views.
- The project should act more like a storyteller than a sandbox.
- Metric explanations must be more obvious.
- Typography was too small for presentation and readability.
- Color choices should improve accessibility, especially by avoiding red-green dependence.
- Limitations such as reverse causality should be stated clearly.
- The scope should not remain constrained to one dataset if a broader comparative context can be added responsibly.

## Data Notes

Observed from the local survey:

- 996 responses across 16 columns
- Year-of-study distribution is concentrated in `Graduate student` and `Third year`
- Gender distribution is skewed toward `Male`
- Academic performance responses are concentrated in `Poor` and `Below Average`
- Class-skipping and deadline-impact outcomes are also skewed toward worse categories
- Preliminary ordinal association checks still suggest the strongest story candidates are:
  - Daytime fatigue
  - Device use before bed
  - Caffeine use
  - Exercise frequency

Observed from the benchmark layer:

- 17 country-level records currently bundled
- 6 regions represented
- Benchmark metrics are useful for comparative framing, but source harmonization is incomplete

## Active Issues

- [ ] Benchmark source traceability still needs one cleaner citation pass before final presentation/submission.
- [ ] If the survey CSV changes, `data/local-survey-bundle.js` must be regenerated so the bundled data stays in sync.
- [ ] The benchmark layer is comparative, not fully harmonized, so copy and narration must keep that caveat visible.
- [ ] Mobile and projector-scale QA should be repeated after the final content pass.
- [ ] Final chart annotations and storytelling copy still need one presentation-focused polish pass.

## Next Milestones

- [ ] Tighten final chart annotations and section wording for the presentation narrative.
- [ ] Add or validate any extra country benchmark records the team decides to include.
- [ ] Clean up benchmark citations and source notes for submission readiness.
- [ ] Re-check projector readability and mobile responsiveness after content polishing.
- [ ] Run one more peer or instructor review on the updated site structure.

## Definition Of Done For This Phase

- [x] Repo is locally initialized, organized, and pushed.
- [x] Core documentation exists at the repository root.
- [x] The redesigned pages no longer fail because of missing survey fetches.
- [x] The site now supports guided student, educator, and global-context narratives.
- [x] The current prototype is preserved as a reference artifact instead of being treated as the final product.
