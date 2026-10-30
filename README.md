# Personal website

A small static blog: Markdown in, plain HTML out. No framework, no client-side JavaScript.

## Use it

```bash
npm install
npm run dev     # http://localhost:8080, rebuilds on change
npm run build   # writes the site to dist/
```

## Make it yours

- `site.config.json`: your name, handle, tagline, site URL, and links.
- `content/about.md`: the About page.
- `content/posts/YYYY-MM-DD-slug.md`: one file per post. Frontmatter takes `title`, `description`, and optionally `draft: true`.
- `static/`: copied as-is into the site. Put `style.css`, images, and a favicon here.

## Deploy

**GitHub Pages:** this repo deploys automatically on every push to `main` (Settings → Pages → Source: "GitHub Actions"). The live site is at https://siranbarzorak.github.io/Siranaddya/.

**Netlify / Cloudflare Pages / Vercel:** build command `npm run build`, output directory `dist`.
