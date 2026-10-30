---
title: How this site is built
description: A Markdown folder, one build script, and plain HTML output.
draft: true
---

The whole site is about 200 lines of JavaScript. Here's the layout:

```text
content/
  about.md
  posts/
    2026-10-30-hello-world.md
static/
  style.css
site.config.json
build.mjs
```

## Writing a post

A post is a Markdown file in `content/posts/`, named with its date and a short slug:

```markdown
---
title: My new post
description: One line for previews and the RSS feed.
---

Write the post here.
```

Add `draft: true` to the frontmatter to keep a post out of the build.

## Building

`npm run build` writes everything to `dist/`, including an RSS feed. `npm run dev` serves it locally and rebuilds when a file changes.

> No framework, no client-side JavaScript. The pages are plain HTML and load fast.
