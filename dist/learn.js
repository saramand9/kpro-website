const contentsDialog = document.querySelector(".contents-dialog");
const contentsToggle = document.querySelector(".contents-toggle");
contentsToggle?.addEventListener("click", () => contentsDialog.showModal());
document.querySelector(".close-contents")?.addEventListener("click", () => contentsDialog.close());
contentsDialog?.addEventListener("click", event => {
  if (event.target.closest("a")) contentsDialog.close();
  if (event.target !== contentsDialog) return;
  const { left, top, right, bottom } = contentsDialog.getBoundingClientRect();
  if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) contentsDialog.close();
});
contentsDialog?.addEventListener("close", () => contentsToggle?.focus({ preventScroll: true }));

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
