import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const script = fs.readFileSync(new URL("../dist/learn.js", import.meta.url), "utf8");
const elements = new Map();
function element() {
  return {
    listeners: {}, attributes: {},
    addEventListener(name, handler) { this.listeners[name] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    classList: { add() {}, remove() {} },
  };
}
for (const selector of [".contents-dialog", ".contents-toggle", ".close-contents", ".toast"]) {
  elements.set(selector, element());
}
const dialog = elements.get(".contents-dialog");
dialog.showModal = () => { dialog.open = true; };
dialog.close = () => { dialog.open = false; dialog.listeners.close(); };
const events = {};
const root = { dataset: { theme: "light" } };
const saved = new Map();
let copied, selected, rejectCopy = false;
const context = {
  document: {
    documentElement: root,
    querySelector: selector => elements.get(selector),
    addEventListener: (name, handler) => { events[name] = handler; },
    createRange: () => ({ selectNodeContents: pre => { selected = pre.textContent; } }),
  },
  window: { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) },
  navigator: { clipboard: { writeText: async value => {
    if (rejectCopy) throw new Error("permission denied");
    copied = value;
  } } },
  localStorage: { setItem: (key, value) => saved.set(key, value) },
  setTimeout: () => 1,
  clearTimeout() {},
};
vm.runInNewContext(script, context);
elements.get(".contents-toggle").listeners.click();
assert.equal(dialog.open, true);
elements.get(".close-contents").listeners.click();
assert.equal(dialog.open, false);
assert.equal(elements.get(".contents-toggle").focused, true);
assert.equal(saved.size, 0, "Theme ownership belongs to shared site.js, not the reader");
const source = "\tvar input order.CreateInput\n\tdecoder.Decode(&input)\n";
const pre = { textContent: source };
const button = { closest: () => ({ querySelector: () => pre }) };
await events.click({ target: { closest: () => button } });
assert.equal(copied, source, "Copy must preserve exact source, including tabs and line breaks");
assert.equal(elements.get(".toast").textContent, "已复制");
rejectCopy = true;
await events.click({ target: { closest: () => button } });
assert.equal(selected, source, "Denied clipboard access must select the same source");
assert(elements.get(".toast").textContent.includes("Ctrl+C"));
console.log("PASS: reader dialog hooks, shared-theme ownership, exact copy, clipboard-denied fallback.");
