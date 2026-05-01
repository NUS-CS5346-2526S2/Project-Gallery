# CS5346 Information Visualization Project Gallery

This repository is organized as a public static gallery for CS5346 final projects.

## Local Preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages Deployment

1. Push this folder to a GitHub repository.
2. In the repository settings, open `Pages`.
3. Set the source to deploy from the main branch `/docs` folder.
4. Save. The public URL will look like `https://<username>.github.io/<repo>/`.

## Structure

- `index.html` - gallery homepage
- `assets/` - gallery CSS and JavaScript
- `projects.json` - project metadata used by the homepage
- `projects/` - packaged local project builds and static submissions
- `submissions/` - original student submissions
- `docs/` - public deployment copy for GitHub Pages

The gallery uses relative paths so it can be deployed under a GitHub Pages project URL. Use the `/docs` deployment source to avoid publishing the original submission archives and generated dependency folders.
