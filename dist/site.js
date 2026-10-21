// Run in the head so every page paints with the same saved theme.
(() => {
  const key = "kpro-theme";
  const root = document.documentElement;
  const valid = value => value === "dark" || value === "light";
  function readTheme(fallback = "light") {
    try {
      const saved = localStorage.getItem(key);
      const legacy = localStorage.getItem("kpro-learn-theme");
      return valid(saved) ? saved : valid(legacy) ? legacy : "light";
    } catch { return fallback; }
  }
  root.dataset.theme = readTheme();
  function reflectTheme() {
    const dark = root.dataset.theme === "dark";
    const chinese = root.lang.startsWith("zh");
    const label = chinese ? (dark ? "切换为浅色主题" : "切换为深色主题") : (dark ? "Switch to light theme" : "Switch to dark theme");
    document.querySelectorAll(".theme-toggle").forEach(button => {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111111" : "#ffffff");
  }
  reflectTheme();
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".theme-toggle").forEach(button => button.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(key, root.dataset.theme); } catch { /* In-memory switching still works. */ }
      reflectTheme();
    }));
    reflectTheme();
  });
  document.addEventListener("kpro:languagechange", reflectTheme);
  window.addEventListener("pageshow", () => {
    root.dataset.theme = readTheme(root.dataset.theme);
    reflectTheme();
  });
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    root.dataset.theme = valid(event.newValue) ? event.newValue : "light";
    reflectTheme();
  });
})();
