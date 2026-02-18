# Promotional site for sk-mockAPI

Static landing page to promote the Chrome extension. Uses [Tailwind CSS](https://tailwindcss.com) via the Play CDN — no build step required.

- **assets/logo.png** — Extension logo (sk-mockAPI branding).
- **assets/popup-list.png** — Screenshot of the popup with groups and global toggle.
- **assets/popup-rules.png** — Screenshot of the popup with a group expanded (list of rules).
- **assets/rule-editor.png** — Screenshot of the expanded rule editor (URL pattern, method, response payload).

## Run locally

Open `index.html` in a browser, or use a simple server:

```bash
# From repo root
npx serve site
# or
python3 -m http.server 8000 --directory site
```

Then visit `http://localhost:3000` (or 8000).

## Deploy

Upload the `site/` folder to any static host:

- **GitHub Pages**: Enable Pages for the repo and set source to the `site` folder (or push `site` contents to `gh-pages`).
- **Netlify / Vercel**: Drag the `site` folder or connect the repo and set publish directory to `site`.

## Customize

- **Chrome Web Store link**: When the extension is published, set the CTA button href in `index.html` (element with `id="chrome-store-link"`) to your store URL.
- **Repo link**: Add a “Source” or “GitHub” link in the footer or CTA section pointing to your repository.
