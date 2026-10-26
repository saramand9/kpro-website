import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const script = fs.readFileSync(new URL("../dist/learn.js", import.meta.url), "utf8");
const elements = new Map();
let focused;
function element(attributes = {}) {
  const classes = new Set();
  return {
    listeners: {}, attributes: { ...attributes },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    focus(options) { focused = this; this.focusOptions = options; },
    closest() { return null; },
    classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, contains(name) { return classes.has(name); } },
  };
}
for (const selector of [".contents-dialog", ".contents-toggle", ".close-contents", ".page-dialog", ".page-contents-toggle", ".close-page-contents", ".toast"]) {
  elements.set(selector, element());
}
const dialogs = [
  [".contents-dialog", ".contents-toggle", ".close-contents"],
  [".page-dialog", ".page-contents-toggle", ".close-page-contents"],
].map(selectors => selectors.map(selector => elements.get(selector)));
for (const [dialog, toggle] of dialogs) {
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { if (!dialog.open) return; dialog.open = false; dialog.listeners.close(); };
  dialog.getBoundingClientRect = () => ({ left: 20, top: 40, right: 620, bottom: 700 });
  toggle.setAttribute("aria-expanded", "false");
}
const events = {}, windowEvents = {}, frames = [];
const root = { dataset: { theme: "light" }, scrollHeight: 2200 };
const saved = new Map();
let scrollPaddingTop = "100px";
const window = {
  scrollY: 0, innerHeight: 800,
  location: { hash: "" },
  addEventListener: (name, handler) => { windowEvents[name] = handler; },
  getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
};
const sectionOffsets = { intro: 220, request: 920, exercise: 1750 };
const sections = new Map(Object.entries(sectionOffsets).map(([id, top]) => [id, {
  id,
  contains: node => node?.sectionId === id,
  getBoundingClientRect: () => ({ top: top - window.scrollY }),
}]));
const sourceLine = {
  id: "request-L12", sectionId: "request", offset: 1680,
  getBoundingClientRect() { return { top: this.offset - window.scrollY }; },
};
sections.set(sourceLine.id, sourceLine);
// The desktop outline and mobile dialog must agree on the current section.
const outlines = Array.from({ length: 2 }, () => Object.keys(sectionOffsets).map(id => element({ href: `#${id}` })));
const staleLink = element({ href: "#removed-section" });
const pageLinks = [...outlines.flat(), staleLink];
let copied, selected, rejectCopy = false;
const context = {
  document: {
    documentElement: root,
    querySelector: selector => elements.get(selector),
    querySelectorAll: selector => selector === "[data-page-toc] a[href^='#']" ? pageLinks : [],
    getElementById: id => sections.get(id) ?? null,
    addEventListener: (name, handler) => { events[name] = handler; },
    createRange: () => ({ selectNodeContents: pre => { selected = pre.textContent; } }),
  },
  window,
  getComputedStyle: () => ({ scrollPaddingTop }),
  requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
  navigator: { clipboard: { writeText: async value => {
    if (rejectCopy) throw new Error("permission denied");
    copied = value;
  } } },
  localStorage: { setItem: (key, value) => saved.set(key, value) },
  setTimeout: () => 1,
  clearTimeout() {},
};
vm.runInNewContext(script, context);

for (const [dialog, toggle, closeButton] of dialogs) {
  const [otherDialog, otherToggle] = dialogs.find(pair => pair[0] !== dialog);
  const assertClosed = () => {
    assert.equal(dialog.open, false);
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(focused, toggle, "Each dialog must return focus to its own opener");
    assert.equal(toggle.focusOptions.preventScroll, true, "Closing a menu must preserve the reading position");
    assert.equal(otherDialog.open, false, "The other dialog must remain closed");
    assert.equal(otherToggle.getAttribute("aria-expanded"), "false");
  };
  toggle.listeners.click();
  assert.equal(dialog.open, true);
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(otherDialog.open, false, "Opening one menu must not open the other");
  closeButton.listeners.click();
  assertClosed();
  toggle.listeners.click();
  dialog.listeners.click({ target: dialog, clientX: 50, clientY: 60 });
  assert.equal(dialog.open, true, "Clicking empty space inside the dialog must not close it");
  dialog.listeners.click({ target: { closest: selector => selector === "a" ? {} : null } });
  assertClosed();
  toggle.listeners.click();
  dialog.listeners.click({ target: dialog, clientX: 10, clientY: 10 });
  assertClosed();
}

function flushFrame() {
  assert.equal(frames.length, 1, "Scroll and viewport events must share one pending animation frame");
  frames.shift()();
}
function assertCurrent(id) {
  for (const outline of outlines) {
    assert.deepEqual(outline.filter(link => link.getAttribute("aria-current") === "location").map(link => link.getAttribute("href")), [`#${id}`], "Every outline must identify exactly the same visible section");
  }
  assert.equal(staleLink.getAttribute("aria-current"), null, "Missing section targets must not become current");
}
flushFrame();
assertCurrent("intro");
window.scrollY = 900;
windowEvents.scroll();
windowEvents.scroll();
windowEvents.resize();
assertCurrent("intro"); // Do not recompute layout for every event in a burst.
flushFrame();
assertCurrent("request");
window.scrollY = 750;
windowEvents.scroll();
flushFrame();
assertCurrent("intro");
scrollPaddingTop = "192px"; // A mobile sticky header leaves a larger reading offset.
windowEvents.resize();
flushFrame();
assertCurrent("request");
window.scrollY = 0;
windowEvents.hashchange();
flushFrame();
assertCurrent("intro");
window.scrollY = 900;
windowEvents.pageshow();
flushFrame();
assertCurrent("request");
window.scrollY = 1400;
windowEvents.scroll();
flushFrame();
assertCurrent("exercise"); // The final heading is still below the offset at the page end.
window.location.hash = "#request-L12";
windowEvents.hashchange();
flushFrame();
assertCurrent("request"); // A visible line in the penultimate file stays current at the page end.
sourceLine.offset = 1000; // The same hash now refers to a line above the visible viewport.
windowEvents.scroll();
flushFrame();
assertCurrent("exercise");
sourceLine.offset = 1680;
windowEvents.pageshow();
flushFrame();
assertCurrent("request");
window.location.hash = "";
windowEvents.hashchange();
flushFrame();
assertCurrent("exercise"); // Clearing the explicit target restores normal end-of-page behavior.
assert.equal(saved.size, 0, "Theme ownership belongs to shared site.js, not the reader");

const source = "\tvar input order.CreateInput\n\tdecoder.Decode(&input)\n";
const pre = { textContent: source };
const button = { closest: () => ({ querySelector: () => pre }) };
await events.click({ target: { closest: () => button } });
assert.equal(copied, source, "Copy must preserve exact source, including tabs and line breaks");
assert.equal(elements.get(".toast").textContent, "已复制");
assert(elements.get(".toast").classList.contains("visible"));
rejectCopy = true;
await events.click({ target: { closest: () => button } });
assert.equal(selected, source, "Denied clipboard access must select the same source");
assert(elements.get(".toast").textContent.includes("Ctrl+C"));
console.log("PASS: independent chapter/page dialogs and focus, synchronized section outlines, scroll/resize/hash/history updates, end-of-page source-line anchors, frame coalescing, shared-theme ownership, exact copy and denied-clipboard fallback.");
