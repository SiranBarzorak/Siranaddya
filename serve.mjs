// Local preview: builds, serves dist/ on http://localhost:8080, rebuilds when files change.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { build } from "./build.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const PORT = process.env.PORT || 8080;
const TYPES = { ".html": "text/html", ".css": "text/css", ".xml": "application/xml", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };

build();

let timer;
for (const dir of ["content", "static"]) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { build(); } catch (err) { console.error(err.message); }
    }, 100);
  });
}

http
  .createServer((req, res) => {
    let file = path.join(OUT, decodeURIComponent(req.url.split("?")[0]));
    if (!file.startsWith(OUT)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end("Not found");
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
