// Builds the site from content/ into dist/. Run with `npm run build`.
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Splits "---\nkey: value\n---\nbody" into { data, body }.
function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { data, body: src.slice(m[0].length) };
}

function readingTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function loadPosts() {
  const dir = path.join(ROOT, "content/posts");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, file), "utf8"));
      // Filenames look like 2026-10-30-my-post.md; frontmatter can override date and slug.
      const m = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
      return {
        title: data.title || file,
        description: data.description || "",
        date: data.date || (m ? m[1] : ""),
        slug: data.slug || (m ? m[2] : file.replace(/\.md$/, "")),
        draft: data.draft === "true",
        minutes: readingTime(body),
        html: marked.parse(body),
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function layout({ title, description, body, active, root = "" }) {
  const nav = [
    ["home", "index.html", "home"],
    ["blog", "blog.html", "blog"],
  ]
    .map(
      ([key, href, label]) =>
        `<a href="${root}${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`
    )
    .join("");
  const links = config.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || config.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600;800&display=swap">
<link rel="stylesheet" href="${root}style.css">
<link rel="alternate" type="application/rss+xml" title="${esc(config.name)}" href="${root}feed.xml">
</head>
<body>
<div class="wrap">
<header class="site-header">
  <a class="brand" href="${root}index.html"><span class="prompt">~/</span>${esc(config.handle)}<span class="caret" aria-hidden="true"></span></a>
  <nav>${nav}<a href="${root}feed.xml">rss</a></nav>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <span>&copy; ${new Date().getFullYear()} ${esc(config.name)}</span>
  <span class="footer-links">${links}</span>
</footer>
</div>
</body>
</html>
`;
}

function postList(posts, root = "") {
  if (!posts.length) return `<p class="muted">No posts yet. Add a Markdown file to content/posts.</p>`;
  return `<ol class="post-list">${posts
    .map(
      (p) => `<li>
  <time datetime="${p.date}">${p.date}</time>
  <a href="${root}posts/${p.slug}.html">${esc(p.title)}</a>
  <span class="minutes">${p.minutes} min</span>
</li>`
    )
    .join("")}</ol>`;
}

function rss(posts) {
  const base = config.url.replace(/\/$/, "");
  const items = posts
    .map(
      (p) => `<item>
<title>${esc(p.title)}</title>
<link>${base}/posts/${p.slug}.html</link>
<guid>${base}/posts/${p.slug}.html</guid>
<pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
<description>${esc(p.description)}</description>
</item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(config.name)}</title>
<link>${base}/</link>
<description>${esc(config.description)}</description>
${items}
</channel></rss>
`;
}

function write(file, contents) {
  const target = path.join(OUT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

export function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  const posts = loadPosts();
  const about = parseFrontmatter(fs.readFileSync(path.join(ROOT, "content/about.md"), "utf8"));

  write(
    "index.html",
    layout({
      title: config.name,
      active: "home",
      body: `<section class="intro">
  <div class="intro-text">
    <h1>${esc(config.name)}</h1>
    <p class="tagline">${esc(config.tagline)}</p>
  </div>
  ${config.photo ? `<img class="portrait" src="${esc(config.photo)}" alt="Portrait of ${esc(config.name)}" width="640" height="640">` : ""}
</section>
<section id="about">
  <h2 class="section-label">About</h2>
  <div class="prose">${marked.parse(about.body)}</div>
</section>
<section>
  <h2 class="section-label">Latest posts</h2>
  ${postList(posts.slice(0, 5))}
  ${posts.length > 5 ? `<p><a class="more" href="blog.html">All ${posts.length} posts &rarr;</a></p>` : ""}
</section>`,
    })
  );

  write(
    "blog.html",
    layout({
      title: `Blog · ${config.name}`,
      active: "blog",
      body: `<h1 class="page-title">Blog</h1>
<p class="muted">${posts.length} post${posts.length === 1 ? "" : "s"}. Also available as an <a href="feed.xml">RSS feed</a>.</p>
${postList(posts)}`,
    })
  );

  // The About text now lives on the home page; keep old about.html links working.
  write(
    "about.html",
    `<!doctype html>
<meta charset="utf-8">
<title>About · ${esc(config.name)}</title>
<meta http-equiv="refresh" content="0; url=index.html#about">
<link rel="canonical" href="index.html#about">
<p><a href="index.html#about">About ${esc(config.name)}</a></p>
`
  );

  for (const p of posts) {
    write(
      `posts/${p.slug}.html`,
      layout({
        title: `${p.title} · ${config.name}`,
        description: p.description,
        active: "blog",
        root: "../",
        body: `<article>
  <header class="post-header">
    <h1>${esc(p.title)}</h1>
    <p class="meta"><time datetime="${p.date}">${p.date}</time> · ${p.minutes} min read</p>
  </header>
  <div class="prose">${p.html}</div>
  <p class="back"><a href="../blog.html">&larr; All posts</a></p>
</article>`,
      })
    );
  }

  write("feed.xml", rss(posts));
  fs.cpSync(path.join(ROOT, "static"), OUT, { recursive: true });
  console.log(`Built ${posts.length} posts into dist/`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) build();
