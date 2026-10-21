import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { chapters } from "../course/chapters.mjs";
import { siteHeader } from "./site-shell.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sample = path.join(root, "examples/orders");
const dist = path.join(root, "dist");
const assetTag = name => createHash("sha256").update(fs.readFileSync(path.join(dist, name))).digest("hex").slice(0, 12);
// Explicit list: never include runtime databases, unrelated files or credentials.
const files = [
  ".gitignore", "README.md", "go.mod", "go.sum",
  "cmd/hello/main.go", "cmd/orders/main.go", "cmd/check/main.go", "cmd/ordercli/main.go",
  "internal/app/app.go", "internal/app/app_test.go",
  "internal/httpapi/api.go", "internal/httpapi/api_test.go",
  "internal/order/service.go", "internal/order/service_test.go",
  "internal/memory/store.go", "internal/memory/store_test.go",
  "internal/sqlite/store.go", "internal/sqlite/store_test.go", "internal/sqlite/schema.sql",
  "internal/messageapi/api.go", "internal/tcpclient/client.go", "internal/storetest/contract.go",
  "requests/create.json", "requests/invalid.json",
];
const source = new Map(files.map(name => [name, fs.readFileSync(path.join(sample, name), "utf8").replace(/\r\n/g, "\n")]));
const escape = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const goKeywords = new Set("break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var".split(" "));
const goTypes = new Set("bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr".split(" "));
function highlightGo(value) {
  const tokens = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b/g;
  let html = "", position = 0;
  for (const match of value.matchAll(tokens)) {
    const token = match[0];
    let kind = "";
    if (token.startsWith("//") || token.startsWith("/*")) kind = "comment";
    else if (/^["'`]/.test(token)) kind = "string";
    else if (/^\d/.test(token) || ["true", "false", "nil"].includes(token)) kind = "literal";
    else if (goKeywords.has(token)) kind = "keyword";
    else if (goTypes.has(token)) kind = "type";
    else if (/^\s*\(/.test(value.slice(match.index + token.length))) kind = "function";
    html += escape(value.slice(position, match.index));
    html += kind ? `<span class="syntax-${kind}">${escape(token)}</span>` : escape(token);
    position = match.index + token.length;
  }
  return html + escape(value.slice(position));
}
const icons = {
  book: '<path d="M4 4.5h6a3 3 0 0 1 3 3v13a4 4 0 0 0-3-1H4zM20 4.5h-4a3 3 0 0 0-3 3m7-3v15h-4a4 4 0 0 0-3 1"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 20"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  folder: '<path d="M3 6h7l2 3h9v11H3zM3 9h18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  github: '<path d="M9 19c-4 1.2-4-2-6-2m12 5v-3.4c0-1 .1-1.4-.5-2 3.3-.4 6.5-1.6 6.5-7A5.4 5.4 0 0 0 19.5 6c.1-.9.1-2.4-.3-3 0 0-1.2-.4-4.2 1.5a15 15 0 0 0-6 0C6 2.6 4.8 3 4.8 3c-.4.6-.4 2.1-.3 3A5.4 5.4 0 0 0 3 9.6c0 5.4 3.2 6.6 6.5 7-.6.6-.5 1.2-.5 2V22"/>',
};
const icon = (name, extra = "") => `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const anchor = name => name.replace(/[^a-zA-Z0-9]/g, "-");
const link = name => {
  if (!source.has(name)) throw new Error(`Unknown source file: ${name}`);
  return `<a class="file-link" href="@@ROOT@@learn/source.html#${anchor(name)}">${escape(name)}</a>`;
};
function code(name, from, to, focus = []) {
  let text = source.get(name);
  if (text == null) throw new Error(`Unknown source file: ${name}`);
  const start = from ? text.indexOf(from) : 0;
  const end = to ? text.indexOf(to, start + (from?.length || 0)) : text.length;
  if (start < 0 || end < start) throw new Error(`Missing excerpt boundary in ${name}: ${from} / ${to}`);
  const firstLine = text.slice(0, start).split("\n").length;
  text = text.slice(start, end).trimEnd();
  for (const needle of focus) {
    if (!text.includes(needle)) throw new Error(`Missing highlighted code in ${name}: ${needle}`);
  }
  const highlighted = name.endsWith(".go") ? highlightGo(text) : escape(text);
  const lines = text.split("\n");
  const rendered = focus.length ? highlighted.split("\n").map((line, i) => `<span class="code-line${focus.some(needle => lines[i].includes(needle)) ? " highlighted" : ""}">${line}</span>`).join("\n") : highlighted;
  return `<figure class="code-block"><figcaption>${link(name)}<span>${from || to ? "节选 · " : ""}L${firstLine}</span><button class="copy" type="button" aria-label="复制代码">${icon("copy")}<span>复制</span></button></figcaption><pre tabindex="0"><code>${rendered}</code></pre></figure>`;
}
const terminal = (title, value) => `<figure class="code-block terminal"><figcaption><span class="terminal-label"><span aria-hidden="true">❯_</span> ${escape(title)}</span><button class="copy" type="button" aria-label="复制命令">${icon("copy")}<span>复制</span></button></figcaption><pre tabindex="0"><code>${escape(value)}</code></pre></figure>`;
const output = (title, value) => `<figure class="code-block output"><figcaption><span class="output-label">${escape(title)}</span></figcaption><pre tabindex="0"><code>${escape(value)}</code></pre></figure>`;
const note = (title, value) => `<aside class="note"><strong>${title}</strong><p>${value}</p></aside>`;
const table = (head, rows) => `<div class="table-wrap"><table><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const lessons = chapters({ code, terminal, output, note, table, link });
const href = c => c.slug === "overview" ? "@@ROOT@@learn.html" : `@@ROOT@@learn/${c.slug}.html`;
function chapterLinks(current) {
  return lessons.map((c, i) => `<a href="${href(c)}"${c.slug === current ? ' aria-current="page"' : ""}><span class="lesson-index">${String(i).padStart(2, "0")}</span><span>${c.title}</span>${icon("arrow")}</a>`).join("");
}
function contents(current) {
  return `<dialog class="contents-dialog" id="course-nav" aria-labelledby="contents-title"><div class="contents-heading"><div><p>项目教程</p><h2 id="contents-title">构建一个订单服务</h2></div><button class="close-contents" type="button" aria-label="关闭目录">×</button></div><nav class="chapter-list" aria-label="教程章节">${chapterLinks(current)}</nav><div class="contents-footer"><a href="@@ROOT@@learn/source.html"${current === "source" ? ' aria-current="page"' : ""}>${icon("code")}完整源码</a><a href="@@ROOT@@downloads/orders.zip" download>${icon("download")}下载工程</a><span>KPro v0.2.1</span></div></dialog>`;
}
function shell({ title, current, body, prefix, description, next, index }) {
  const isOverview = current === "overview";
  const dock = `<nav class="reading-dock" aria-label="阅读导航"><button class="contents-toggle" type="button" aria-label="章节目录" aria-haspopup="dialog" aria-controls="course-nav">${icon("menu")}<span>目录</span></button><div class="dock-current"><span>${index == null ? "参考资料" : isOverview ? "项目概览" : `第 ${index} 章`}</span><strong>${isOverview ? "构建一个订单服务" : title}</strong></div>${next ? `<a class="dock-next" href="${href(next)}">${isOverview ? "开始学习" : "下一章"}${icon("arrow")}</a>` : `<a class="dock-next" href="@@ROOT@@learn.html">项目概览${icon("arrow")}</a>`}</nav>`;
  return `<!doctype html>
<html lang="zh-CN" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="description" content="${escape(description)}"><title>${escape(title)} · KPro 项目教程</title><script src="@@ROOT@@site.js?v=${assetTag("site.js")}"></script><link rel="stylesheet" href="@@ROOT@@site.css?v=${assetTag("site.css")}"><link rel="stylesheet" href="@@ROOT@@learn.css?v=${assetTag("learn.css")}"></head>
<body><a class="skip-link" href="#main">跳到正文</a>${siteHeader({ prefix: "@@ROOT@@", current: current === "source" ? "source" : "learn" })}
<main id="main" class="article${isOverview ? " overview-article" : ""}" tabindex="-1">${body}<footer class="doc-footer"><span>KPro v0.2.1 · 项目教程</span><a href="@@ROOT@@index.html">返回框架首页 ${icon("arrow")}</a></footer></main>${dock}${contents(current)}<noscript><style>.reading-dock,.theme-toggle,.copy{display:none}</style><nav class="nojs-contents" aria-label="教程目录">${chapterLinks(current)}</nav></noscript><div class="toast" role="status" aria-live="polite"></div><script src="@@ROOT@@learn.js?v=${assetTag("learn.js")}" defer></script></body></html>`.replaceAll("@@ROOT@@", prefix);
}
// Only the marked shared navigation and asset hashes are generated on the homepage.
const homePath = path.join(dist, "index.html");
const homeSource = fs.readFileSync(homePath, "utf8");
const headerRegion = /<!-- site-header:start -->[\s\S]*?<!-- site-header:end -->/;
if (!headerRegion.test(homeSource)) throw new Error("Homepage shared-header markers are missing");
fs.writeFileSync(homePath, homeSource
  .replace(headerRegion, `<!-- site-header:start -->${siteHeader({ english: true })}<!-- site-header:end -->`)
  .replace(/((?:src|href)="\.\/(site\.js|site\.css|styles\.css|app\.js))(?:\?v=[^"]*)?"/g, (_, lead, name) => `${lead}?v=${assetTag(name)}"`));
fs.mkdirSync(path.join(dist, "learn"), { recursive: true });
fs.mkdirSync(path.join(dist, "downloads"), { recursive: true });
for (const [i, chapter] of lessons.entries()) {
  const localToc = [...chapter.body.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)].map(m => `<a href="#${m[1]}">${m[2]}</a>`).join("");
  const prev = lessons[i - 1], next = lessons[i + 1];
  const pagination = `<nav class="pagination" aria-label="前后章节">${prev ? `<a href="${href(prev)}"><small>← 上一章</small><span>${prev.title}</span></a>` : "<span></span>"}${next ? `<a href="${href(next)}"><small>下一章 →</small><span>${next.title}</span></a>` : `<a href="@@ROOT@@learn/source.html"><small>随时查阅 →</small><span>完整源码索引</span></a>`}</nav>`;
  const overviewActions = `<div class="hero-actions"><a class="primary-action" href="@@ROOT@@learn/01-first-request.html">开始学习 ${icon("arrow")}</a><a class="text-action" href="@@ROOT@@downloads/orders.zip" download>下载示例工程 ${icon("download")}</a></div><p class="course-meta">Go 1.26.9+<span>·</span>KPro v0.2.1<span>·</span>9 个章节，1 个完整项目</p>`;
  const syllabus = i === 0 ? `<section class="syllabus" id="chapters"><div class="section-eyebrow">从运行到理解，再到独立修改</div><h2>学习路线</h2><nav class="chapter-list" aria-label="课程安排">${lessons.slice(1).map((c, n) => `<a href="${href(c)}"><span class="lesson-index">${String(n + 1).padStart(2, "0")}</span><span><strong>${c.title}</strong><small>${c.outcome || c.intro}</small></span>${icon("arrow")}</a>`).join("")}</nav></section>` : "";
  const body = `<header class="chapter-header"><div class="breadcrumb"><a href="@@ROOT@@learn.html">项目教程</a><span>/</span><span>${i === 0 ? "Go 多协议应用开发" : `第 ${i} 章`}</span></div><h1>${chapter.title}</h1><p class="lede">${chapter.intro}</p>${i === 0 ? overviewActions : ""}</header>${i === 0 ? "" : `<details class="chapter-toc"><summary>本章内容</summary><nav aria-label="本章内容">${localToc}</nav></details>`}<div class="prose">${chapter.body}</div>${syllabus}${pagination}`;
  const filename = chapter.slug === "overview" ? "learn.html" : `learn/${chapter.slug}.html`;
  fs.writeFileSync(path.join(dist, filename), shell({ title: chapter.title, current: chapter.slug, body, prefix: i === 0 ? "./" : "../", description: chapter.intro, next, index: i }));
}
const fileCards = files.map(name => `<section class="source-file" id="${anchor(name)}"><h2>${escape(name)}</h2>${code(name)}</section>`).join("");
const sourceBody = `<header class="chapter-header"><div class="breadcrumb"><a href="@@ROOT@@learn.html">项目教程</a><span>/</span><span>源码</span><span class="chapter-number">${files.length} FILES</span></div><h1>完整源码</h1><p class="lede">这里列出下载包中的全部文件，包括业务代码、存储、协议入口和测试。教程正文的代码节选也从同一份工程提取。</p></header><a class="download" href="@@ROOT@@downloads/orders.zip" download>下载 orders 工程 <span>ZIP ↓</span></a><nav class="source-index" aria-label="源码文件">${files.map(name => `<a href="#${anchor(name)}">${escape(name)}</a>`).join("")}</nav>${fileCards}`;
fs.writeFileSync(path.join(dist, "learn/source.html"), shell({ title: "完整源码", current: "source", body: sourceBody, prefix: "../", description: "KPro 订单教学工程的所有源文件，包含业务、协议、存储、运行与测试。" }));

// Deterministic ZIP with stored entries, UTF-8 names and fixed DOS timestamps.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const entries = [], central = [];
let offset = 0;
for (const [name, text] of source) {
  const filename = Buffer.from(`orders/${name}`), data = Buffer.from(text), crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6); local.writeUInt16LE(33, 12);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26);
  const index = Buffer.alloc(46);
  index.writeUInt32LE(0x02014b50, 0); index.writeUInt16LE(20, 4); index.writeUInt16LE(20, 6);
  index.writeUInt16LE(0x800, 8); index.writeUInt16LE(33, 14);
  index.writeUInt32LE(crc, 16); index.writeUInt32LE(data.length, 20); index.writeUInt32LE(data.length, 24);
  index.writeUInt16LE(filename.length, 28); index.writeUInt32LE(offset, 42);
  entries.push(local, filename, data); central.push(index, filename);
  offset += local.length + filename.length + data.length;
}
const centralBytes = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(source.size, 8); end.writeUInt16LE(source.size, 10);
end.writeUInt32LE(centralBytes.length, 12); end.writeUInt32LE(offset, 16);
fs.writeFileSync(path.join(dist, "downloads/orders.zip"), Buffer.concat([...entries, centralBytes, end]));
console.log(`Built ${lessons.length} chapters, ${source.size} source files and orders.zip from examples/orders.`);
