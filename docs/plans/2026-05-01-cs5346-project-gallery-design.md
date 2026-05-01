# CS5346 Project Gallery Design

## Goal

Create a public, deployable gallery website for all CS5346 Information Visualization final projects in `submissions/`.

## Recommended Architecture

Use a static GitHub Pages-compatible portal at the repository root. The portal owns only the course-level index UI and metadata. Each student project stays isolated under `projects/groupX/` or remains an external link when the submission is already hosted elsewhere.

## Project Handling

- Static HTML submissions are copied with their original assets intact.
- React/Vite/Create React App submissions are built into static production assets where possible.
- External-link submissions are represented as cards that open the submitted URL.
- PDF submissions are copied and opened directly from the gallery.

## UI

The gallery homepage presents all groups as project cards with title, short summary, topic tags, submission type, and launch buttons. The UI is intentionally quiet and directory-like so the student visualizations remain the focus.

## Deployment

The final structure is suitable for GitHub Pages: publish the repository root from the selected branch. Asset paths are kept relative so the site can work from a GitHub Pages project path such as `https://username.github.io/repo/`.
