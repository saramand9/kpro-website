function setupDialog(dialogSelector, toggleSelector, closeSelector) {
  const dialog = document.querySelector(dialogSelector);
  const toggle = document.querySelector(toggleSelector);
  if (!dialog || !toggle) return;
  toggle.addEventListener("click", () => {
    dialog.showModal();
    toggle.setAttribute("aria-expanded", "true");
  });
  document.querySelector(closeSelector)?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target.closest("a")) { dialog.close(); return; }
    if (event.target !== dialog) return;
    const { left, top, right, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus({ preventScroll: true });
  });
}
setupDialog(".contents-dialog", ".contents-toggle", ".close-contents");
setupDialog(".page-dialog", ".page-contents-toggle", ".close-page-contents");

const pageLinks = [...document.querySelectorAll("[data-page-toc] a[href^='#']")];
const pageSections = [...new Set(pageLinks.map(link => link.getAttribute("href").slice(1)))]
  .map(id => document.getElementById(id)).filter(Boolean);
if (pageSections.length) {
  let scheduled = false;
  let activeId;
  function updateCurrentSection() {
    scheduled = false;
    const offset = (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 100) + 16;
    let current = pageSections[0];
    for (const section of pageSections) {
      if (section.getBoundingClientRect().top <= offset) current = section;
      else break;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = pageSections.at(-1);
      // A short file near the end cannot always scroll up to the sticky header.
      const anchor = document.getElementById(window.location.hash.slice(1));
      if (anchor) {
        const box = anchor.getBoundingClientRect();
        const anchoredSection = pageSections.find(section => section === anchor || section.contains(anchor));
        if (anchoredSection && box.top >= 0 && box.top < window.innerHeight) current = anchoredSection;
      }
    }
    if (current.id === activeId) return;
    activeId = current.id;
    for (const link of pageLinks) {
      if (link.getAttribute("href") === `#${activeId}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    const rail = document.querySelector(".page-contents");
    const activeLink = rail?.querySelector('[aria-current="location"]');
    if (rail?.clientHeight && activeLink) {
      const bounds = rail.getBoundingClientRect();
      const item = activeLink.getBoundingClientRect();
      if (item.top < bounds.top + 40) rail.scrollTop += item.top - bounds.top - 40;
      else if (item.bottom > bounds.bottom - 8) rail.scrollTop += item.bottom - bounds.bottom + 8;
    }
  }
  function scheduleSectionUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateCurrentSection);
  }
  for (const event of ["scroll", "resize", "hashchange", "pageshow"]) window.addEventListener(event, scheduleSectionUpdate, { passive: true });
  scheduleSectionUpdate();
}

let noticeTimeout;
function notify(message) {
  const toast = document.querySelector(".toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => toast.classList.remove("visible"), 2600);
}
document.addEventListener("click", async event => {
  const button = event.target.closest("button.copy");
  if (!button) return;
  const pre = button.closest(".code-block").querySelector("pre");
  try {
    await navigator.clipboard.writeText(pre.textContent);
    notify("已复制");
  } catch {
    const range = document.createRange();
    range.selectNodeContents(pre);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    notify("已选中代码，请按 Ctrl+C / ⌘C 复制");
  }
});
