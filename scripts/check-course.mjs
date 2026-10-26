import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const files = ["learn.html", ...fs.readdirSync(path.join(dist, "learn")).filter(f => f.endsWith(".html")).map(f => `learn/${f}`)];
assert.equal(files.length, 11, "Expected 10 teaching chapters and a source reader");
const decode = value => value.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
let linkCount = 0, excerptCount = 0;
const testFiles = ["internal/order/service_test.go", "internal/httpapi/api_test.go", "internal/app/app_test.go", "internal/memory/store_test.go", "internal/sqlite/store_test.go"];
const testNames = new Set(testFiles.flatMap(file => [...fs.readFileSync(path.join(root, "examples/orders", file), "utf8").matchAll(/func (Test\w+)\(/g)].map(match => match[1])));
for (const file of files) {
  const html = fs.readFileSync(path.join(dist, file), "utf8");
  assert(!html.includes("@@ROOT@@"), `${file}: unexpanded path`);
  assert.equal([...html.matchAll(/<h1(?:\s[^>]*)?>/g)].length, 1, `${file}: expected one h1`);
  const heading = html.match(/<h1>([^<]+)<\/h1>/)?.[1];
  assert(heading, `${file}: missing page heading`);
  assert.equal(html.match(/<title>([^<]+)<\/title>/)?.[1], `${heading} · KPro 项目教程`, `${file}: inconsistent browser title`);
  if (file !== "learn/source.html") {
    const currentChapter = html.match(/<a href="[^"]+" aria-current="page"><span class="lesson-index">\d{2}<\/span><span>([^<]+)<\/span>/)?.[1];
    assert.equal(currentChapter, heading, `${file}: contents and chapter title must match`);
  }
  assert(html.includes('<dialog class="contents-dialog"'), `${file}: missing accessible chapter dialog`);
  assert(html.includes('aria-labelledby="contents-title"'), `${file}: dialog must have a name`);
  assert(html.includes('<noscript>'), `${file}: navigation must work without JavaScript`);
  const sidebar = html.match(/<aside class="course-sidebar"[\s\S]*?<\/aside>/)?.[0];
  assert(sidebar?.includes('aria-label="全部章节"'), `${file}: missing persistent chapter navigation`);
  assert.equal((sidebar.match(/class="lesson-index"/g) || []).length, 10, `${file}: navigation must include the overview and all nine chapters`);
  const activeLink = sidebar.match(/<a href="([^"]+)" aria-current="page">/)?.[1];
  assert(activeLink, `${file}: sidebar must mark the current page`);
  assert.equal(new URL(activeLink, `https://local.test/${file}`).pathname, `/${file}`, `${file}: sidebar marks the wrong page`);
  if (/^learn\/\d{2}-/.test(file)) {
    assert(html.includes('id="exercise"'), `${file}: missing hands-on exercise`);
    assert(html.includes('class="code-block output"'), `${file}: missing observable expected result`);
    for (const match of html.matchAll(/\b(Test[A-Za-z0-9_]+)/g)) {
      assert(testNames.has(match[1]), `${file}: referenced test ${match[1]} does not exist`);
    }
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
  assert(html.includes('aria-current="page"'), `${file}: missing current navigation`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(decode(match[1]), `https://local.test/${file}`);
    if (url.origin !== "https://local.test") continue;
    const target = path.resolve(dist, "." + decodeURIComponent(url.pathname));
    assert(target.startsWith(dist + path.sep), `${file}: link escapes dist`);
    assert(fs.existsSync(target), `${file}: missing ${url.pathname}`);
    if (url.hash && target.endsWith(".html")) {
      const destination = fs.readFileSync(target, "utf8");
      assert(destination.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${file}: missing anchor ${url.href}`);
    }
    linkCount++;
  }
  const codeBlocks = [...html.matchAll(/<figure class="code-block"><figcaption><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a><span>(?:节选 · )?L(\d+)<\/span>[\s\S]*?<pre[^>]*><code>([\s\S]*?)<\/code><\/pre><\/figure>/g)];
  assert.equal(codeBlocks.length, (html.match(/<figure class="code-block">/g) || []).length, `${file}: every source block must expose its file and starting line`);
  for (const match of codeBlocks) {
    const filename = decode(match[2]);
    const actual = fs.readFileSync(path.join(root, "examples/orders", filename), "utf8").replace(/\r\n/g, "\n");
    const excerpt = decode(match[4].replace(/<[^>]*>/g, ""));
    const firstLine = Number(match[3]);
    const fileAnchor = filename.replace(/[^a-zA-Z0-9]/g, "-");
    assert(actual.split("\n").slice(firstLine - 1).join("\n").startsWith(excerpt), `${file}: excerpt does not match ${filename} at L${firstLine}`);
    assert.equal(new URL(decode(match[1]), `https://local.test/${file}`).hash, `#${fileAnchor}-L${firstLine}`, `${file}: excerpt link must target its actual source line`);
    if (file === "learn/source.html") {
      assert.equal(excerpt, actual.trimEnd(), `${filename}: source anchors changed the copied text`);
      const renderedLines = match[4].split("\n"), actualLines = actual.trimEnd().split("\n");
      assert.equal(renderedLines.length, actualLines.length, `${filename}: source line count drifted`);
      for (const [i, line] of renderedLines.entries()) {
        assert(line.startsWith(`<span class="code-line source-line" id="${fileAnchor}-L${i + 1}">`), `${filename}: missing source anchor L${i + 1}`);
        assert.equal(decode(line.replace(/<[^>]*>/g, "")), actualLines[i], `${filename}: source line L${i + 1} changed`);
        assert.equal((line.match(/<span\b/g) || []).length, (line.match(/<\/span>/g) || []).length, `${filename}: unbalanced syntax markup at L${i + 1}`);
      }
    }
    excerptCount++;
  }
}
const httpLesson = fs.readFileSync(path.join(dist, "learn/03-http.html"), "utf8");
assert(httpLesson.includes('class="code-line highlighted"'), "HTTP lesson must highlight discussed code");
assert(httpLesson.includes('class="request-trace"'), "HTTP lesson must connect the actual source files");
assert(httpLesson.includes('id="exercise"') && httpLesson.includes('Cache-Control'), "HTTP lesson must include a concrete change exercise");
assert(httpLesson.includes('重新创建一笔订单'), "Memory-mode exercise must explain restart data loss");
// Read each local ZIP entry and compare it byte-for-byte with the published code.
const zip = fs.readFileSync(path.join(dist, "downloads/orders.zip"));
let pos = 0, zipCount = 0;
while (zip.readUInt32LE(pos) === 0x04034b50) {
  assert.equal(zip.readUInt16LE(pos + 8), 0, "ZIP must use stored entries");
  const size = zip.readUInt32LE(pos + 18), nameLen = zip.readUInt16LE(pos + 26), extraLen = zip.readUInt16LE(pos + 28);
  const name = zip.subarray(pos + 30, pos + 30 + nameLen).toString();
  assert(name.startsWith("orders/") && !name.includes(".."), `Unsafe ZIP entry: ${name}`);
  const dataStart = pos + 30 + nameLen + extraLen;
  const actual = fs.readFileSync(path.join(root, "examples", name), "utf8").replace(/\r\n/g, "\n");
  assert.equal(zip.subarray(dataStart, dataStart + size).toString(), actual, `Stale ZIP entry: ${name}`);
  pos = dataStart + size;
  zipCount++;
}
assert.equal(zipCount, 24);
assert.equal(zip.readUInt32LE(pos), 0x02014b50);
console.log(`PASS: ${files.length} pages, ${linkCount} local links, ${excerptCount} source excerpts, ${zipCount} ZIP entries.`);
