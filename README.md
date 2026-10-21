# KPro website

Static website for KPro. The framework overview, project tutorial and source
reader share one design system and navigation.

## Tutorial

`examples/orders` is a standalone module pinned to KPro v0.2.1.
`course/chapters.mjs` assembles the overview and individual chapter modules. The builder extracts code
directly from the module and emits static chapter pages, a source reader, and
a deterministic ZIP download:

```powershell
node scripts/build-course.mjs
node scripts/check-course.mjs
node scripts/check-reader.mjs
node scripts/check-site.mjs
node scripts/check-exercises.mjs
```

Do not hand-edit generated `dist/learn.html` or `dist/learn/*.html`.
Shared colors, typography, controls and navigation live in `dist/site.css`.
`dist/site.js` owns the shared theme; `scripts/site-shell.mjs` renders the
same static header into every page. The builder updates only the marked header
region and asset hashes in `dist/index.html`; the rest is maintained directly.
Homepage layout and behavior live in `dist/styles.css` and `dist/app.js`.
Reading-specific styles and behavior live in `dist/learn.css` and `dist/learn.js`.

The tutorial uses a single reading column, theme-aware code, and an on-demand
native chapter dialog. The homepage retains its architecture map, protocol
composer and quick-start commands. The footer links to the project tutorial;
its order-service walkthrough, source map and chapters live on the Learn pages.
All nine chapters follow the same runnable project: first request, business
rules, HTTP, object wiring, persistence, TCP, state changes, lifecycle, and an
independent requirement change. Each connects concrete operations to source,
expected results, failure diagnosis, and a hands-on exercise. The approved HTTP
chapter remains the representative lesson; the other eight now have comparable
step-by-step explanations. Chapter titles, URLs and single-column layout remain.
The shared theme preference is `kpro-theme`, with a read-only fallback to the old
`kpro-learn-theme` value. New visits default to light. Homepage language is saved
separately as `kpro-language`; the tutorial remains Chinese.

Before handing off, check desktop and narrow-screen reading, chapter-dialog
keyboard navigation/Escape, copy buttons, source links, and both themes. The
static checker also verifies that syntax highlighting leaves source excerpts
byte-for-byte consistent with the downloadable project. It also checks that
named Go tests actually exist. `check-exercises.mjs` requires Go and verifies
10 exercise states using temporary Go overlays: the expected failures really
fail, completed changes pass, and the original sample remains unchanged. Its
temporary files are cleaned up after the check, including on failure.

Run sample verification from `examples/orders`:

```powershell
go test ./... -count=1
go test -race ./... -count=1
go vet ./...
```

The tutorial covers a complete teaching application, not production
certification. Preserve its explicit limits and do not describe unimplemented
payment, authorization, push/subscription or production capabilities as shipped.

## Preview

Serve `dist/` with any static HTTP server. For example:

```powershell
py -m http.server 4173 --directory dist
```

Then open `http://127.0.0.1:4173`.
