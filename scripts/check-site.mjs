import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { siteHeader } from "./site-shell.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const read = name => fs.readFileSync(path.join(dist, name), "utf8");
const pages = ["index.html", "learn.html", ...fs.readdirSync(path.join(dist, "learn")).filter(f => f.endsWith(".html")).map(f => `learn/${f}`)];
for (const page of pages) {
  const html = read(page);
  const home = page === "index.html";
  const prefix = page.startsWith("learn/") ? "../" : "./";
  const expected = siteHeader({ prefix, current: home ? "home" : page === "learn/source.html" ? "source" : "learn", english: home });
  assert(html.includes(expected), `${page}: drifted from shared navigation`);
  for (const asset of ["site.css", "site.js"]) {
    assert(html.includes(`${prefix}${asset}?v=`), `${page}: missing shared/versioned ${asset}`);
  }
  assert.equal((html.match(/class="theme-toggle"/g) || []).length, 1);
  assert.equal((html.match(/class="site-header"/g) || []).length, 1);
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = new URL(value, `https://test.local/${page}`);
    if (url.origin !== "https://test.local") continue;
    const target = path.join(dist, decodeURIComponent(url.pathname));
    assert(fs.existsSync(target), `${page}: missing ${url.pathname}`);
    if (url.hash) assert(read(path.relative(dist, target)).includes(`id="${url.hash.slice(1)}"`), `${page}: broken anchor ${url.hash}`);
  }
}
for (const css of ["styles.css", "learn.css"]) {
  assert(!/:root|\.site-header\s*\{|--bg:|--accent:/.test(read(css)), `${css}: shared styles must not be redefined`);
}
assert(!/opacity:\s*0\b/.test(read("styles.css")), "Homepage must remain visible without JavaScript");
for (const id of ["architecture", "project-guide", "transports", "start", "readiness"]) assert(read("index.html").includes(`id="${id}"`));

const element = (dataset = {}) => {
  const classes = new Set();
  return {
    dataset, listeners: {}, attributes: {}, textContent: "", innerHTML: "",
    addEventListener(name, fn) { this.listeners[name] = fn; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    click() { return this.listeners.click?.({ currentTarget: this }); },
    focus() { this.focused = true; },
    classList: { contains: value => classes.has(value), add: value => classes.add(value), remove: value => classes.delete(value), toggle(value) { if (classes.has(value)) classes.delete(value); else classes.add(value); } },
  };
};
const themeSource = read("site.js");
function themePage(storage, lang = "zh-CN", blocked = false) {
  const root = { dataset: {}, lang }, button = element(), meta = element(), docEvents = {}, winEvents = {};
  const context = {
    document: { documentElement: root, querySelectorAll: () => [button], querySelector: () => meta, addEventListener: (type, fn) => { docEvents[type] = fn; } },
    window: { addEventListener: (type, fn) => { winEvents[type] = fn; } },
    localStorage: { getItem: key => { if (blocked) throw Error("denied"); return storage.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw Error("denied"); storage.set(key, value); } },
  };
  vm.runInNewContext(themeSource, context);
  docEvents.DOMContentLoaded();
  return { root, button, meta, docEvents, winEvents };
}
const preferences = new Map([["kpro-learn-theme", "dark"]]);
const first = themePage(preferences);
assert.equal(first.root.dataset.theme, "dark", "Migrate legacy reading preference");
first.button.click();
assert.equal(preferences.get("kpro-theme"), "light");
assert.equal(preferences.get("kpro-learn-theme"), "dark", "Do not overwrite legacy data");
const second = themePage(preferences, "en");
assert.equal(second.root.dataset.theme, "light", "New preference wins over legacy on navigation");
second.button.click();
assert.equal(second.button.attributes["aria-label"], "Switch to light theme");
assert.equal(second.meta.attributes.content, "#111111");
first.winEvents.pageshow();
assert.equal(first.root.dataset.theme, "dark", "Back/forward restores the latest preference");
first.winEvents.storage({ key: "kpro-theme", newValue: "light" });
assert.equal(first.root.dataset.theme, "light", "Theme updates across open tabs");
first.winEvents.storage({ key: "unrelated", newValue: "dark" });
assert.equal(first.root.dataset.theme, "light");
const denied = themePage(new Map(), "zh-CN", true);
assert.equal(denied.root.dataset.theme, "light");
denied.button.click();
assert.equal(denied.root.dataset.theme, "dark", "Theme switching works without storage");
assert.equal(themePage(new Map([["kpro-theme", "invalid"]])).root.dataset.theme, "light");

// Existing homepage interactions, including async clipboard event lifetime.
const nodes = new Map();
for (const selector of ["[data-language]", "[data-selected-list]", "[data-selected-count]", "[data-composition-copy]", "[data-command]", "[data-terminal-output]", "[data-copy]", "#start-panel"]) nodes.set(selector, element());
const protocols = [element({ protocol: "TCP", kind: "message" }), element({ protocol: "HTTP/2", kind: "native" })];
protocols.forEach(button => button.classList.add("active"));
const tabs = ["install", "create", "run"].map(step => Object.assign(element({ step }), { id: `step-${step}` }));
const translated = [element({ i18n: "navHome" }), element({ i18n: "navLearn" }), element({ i18n: "navSource" })];
const root = { lang: "" }, storage = new Map();
let copied, selected, reject = false;
const timers = [];
const context = {
  document: { documentElement: root, querySelector: selector => nodes.get(selector), querySelectorAll: selector => ({ "[data-protocol]": protocols, "[data-step]": tabs, "[data-i18n]": translated })[selector] || [], dispatchEvent() {}, createRange: () => ({ selectNodeContents: node => { selected = node.textContent; } }) },
  window: { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) },
  navigator: { language: "zh-CN", clipboard: { writeText: async text => { if (reject) throw Error("denied"); copied = text; } } },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  Event: class { constructor(type) { this.type = type; } },
  setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {},
};
vm.runInNewContext(read("app.js"), context);
assert.equal(root.lang, "zh-CN");
assert.equal(protocols[0].attributes["aria-pressed"], "true");
protocols[0].click();
assert.equal(nodes.get("[data-selected-count]").textContent, 1);
assert.equal(protocols[0].attributes["aria-pressed"], "false");
nodes.get("[data-language]").click();
assert.equal(root.lang, "en");
assert.equal(storage.get("kpro-language"), "en");
assert.equal(translated[1].innerHTML, "Learn");
tabs[0].listeners.keydown({ key: "End", preventDefault() {} });
assert.equal(tabs[2].focused, true);
assert.equal(nodes.get("#start-panel").attributes["aria-labelledby"], "step-run");
assert(nodes.get("[data-command]").textContent.includes("go run"));
const button = nodes.get("[data-copy]");
const event = { currentTarget: button };
const copying = button.listeners.click(event);
event.currentTarget = null; // Native browser events clear this after dispatch.
await copying;
assert.equal(copied, nodes.get("[data-command]").textContent);
assert.equal(button.textContent, "Copied");
timers.at(-1)();
assert.equal(button.textContent, "Copy");
reject = true;
await button.click();
assert.equal(selected, nodes.get("[data-command]").textContent);
assert(button.textContent.includes("Ctrl+C"));
console.log(`PASS: ${pages.length} shared headers/assets, local links, theme persistence/migration, storage fallback, language, composer, keyboard tabs and clipboard.`);
