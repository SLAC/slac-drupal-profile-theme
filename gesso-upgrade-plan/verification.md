# Verification — proving "no visual change"

The stated goal is that rendered output stays identical. This file is how you prove it.
The theme has no test suite, so verification is build-artifact diffing plus Storybook
rendering plus one manual pass on a consuming site.

---

## 0. Capture the baseline FIRST

Do this on the **base commit**, before any phase work, on the **old** toolchain
(Node 22 works fine with the 5.0.9 dependency set).

```bash
git switch --detach <base-commit>
rm -rf node_modules && npm ci
npm run build
npm run build-storybook

mkdir -p /tmp/gesso-baseline
cp -r dist                                          /tmp/gesso-baseline/dist
cp -r storybook                                     /tmp/gesso-baseline/storybook
cp source/00-config/_design-tokens.artifact.scss    /tmp/gesso-baseline/
cp source/00-config/_GESSO.es6.js                   /tmp/gesso-baseline/
```

- [ ] Confirm the baseline is complete: `ls /tmp/gesso-baseline/dist/css | wc -l`,
      `ls /tmp/gesso-baseline/dist/js | wc -l`, and that
      `/tmp/gesso-baseline/dist/js/common.js` exists.
- [ ] Consider copying the baseline somewhere durable — `/tmp` may not survive a reboot, and
      this upgrade spans several PRs.

> If the base-commit build fails on Node 22, use `nvm use 20` (or 18) just for the baseline.
> The old dependency set predates Node 22.

---

## 1. Design tokens — must be byte-identical

The highest-leverage check in the whole upgrade. `_design-tokens.artifact.scss` feeds every
SCSS file via `@use '00-config'`; a single changed number moves the whole theme.

```bash
npm run build
diff /tmp/gesso-baseline/_design-tokens.artifact.scss source/00-config/_design-tokens.artifact.scss
diff /tmp/gesso-baseline/_GESSO.es6.js source/00-config/_GESSO.es6.js
```

- [ ] **Expected: no output.**
- [ ] Acceptable exceptions, and only these: a value that was previously wrapped in quotes
      and now is not (or vice versa), caused by `lib/cleanValue.cjs`'s new `isCssVar` /
      `isColorSyntax` / `isNumberLike` checks. Verify each such value is still valid Sass and
      compiles to the same CSS.
- [ ] **Any numeric difference is a bug** in the Phase 4 `yaml` v2 port. Stop and fix it
      before continuing.

For `dist/design-tokens.js`, `yaml` v2 stringifies differently, so compare parsed structures
rather than text:

```bash
node -e "
const y=require('yaml'), fs=require('fs');
const a=y.parse(fs.readFileSync('/tmp/gesso-baseline/dist/design-tokens.js','utf8'));
const b=y.parse(fs.readFileSync('dist/design-tokens.js','utf8'));
console.log(JSON.stringify(a)===JSON.stringify(b) ? 'MATCH' : 'DIFFER');
"
```

- [ ] Expected: `MATCH`.

---

## 2. Compiled CSS

```bash
diff -r /tmp/gesso-baseline/dist/css dist/css
```

### Before Phase 3's autofix commit

- [ ] **Expected: no differences.** Phases 1, 2, 4, 5 should not touch a single CSS byte.
      If they do, something in the Sass pipeline changed unintentionally — check
      `sass-embedded` version, `loadPaths`, and `postcss.config.js`.

### After Phase 3's autofix commit

Prettier 3 and `order/properties-alphabetical-order` reformat SCSS source, which changes CSS
**whitespace** (multi-line `font-family`, `grid-template-areas`) and **declaration order
within blocks**.

- [ ] Diff with whitespace normalized to isolate real changes:

```bash
for f in dist/css/*.css; do
  b="/tmp/gesso-baseline/$f"
  [ -f "$b" ] || { echo "NEW: $f"; continue; }
  if ! diff -q <(tr -s ' \n\t' ' ' < "$b") <(tr -s ' \n\t' ' ' < "$f") >/dev/null; then
    echo "CHANGED: $f"
  fi
done
```

- [ ] For every `CHANGED` file, inspect the real diff and confirm each change is either
      pure whitespace or a **safe** declaration reorder.
- [ ] **The dangerous case is shorthand/longhand reordering.** Alphabetical order puts
      `background-size` *before* `background`, so the shorthand resets the longhand. Same for
      `border-color` vs `border`, `font-size` vs `font`, `flex-basis` vs `flex`,
      `margin-top` vs `margin` (this one is safe — `margin` sorts first), `inset-block` vs
      `inset`, `mask-image` vs `mask`, `list-style-type` vs `list-style`,
      `transition-duration` vs `transition`, `animation-name` vs `animation`,
      `grid-row` vs `grid-area`, `place-items` vs `align-items`.

      Find every block at risk:

```bash
git diff -U0 <phase3-parent> -- 'source/**/*.scss' \
  | grep -E '^\+\s*(background|border|font|flex|grid|inset|list-style|margin|mask|padding|transition|animation|place|overflow|gap)[a-z-]*:'
```

      Then for each such block, read the *compiled* CSS before and after and confirm the
      computed value is unchanged. Where the original order was load-bearing, add
      `/* stylelint-disable-next-line order/properties-alphabetical-order */`.
- [ ] File **count** must be identical:
      `ls /tmp/gesso-baseline/dist/css | wc -l` vs `ls dist/css | wc -l`. A missing file means
      a SCSS entry point stopped being picked up by the new `Glob` in `webpack.common.js`.
      Cross-check every `dist/css/*.css` path referenced in `slac.libraries.yml`:

```bash
grep -oE 'dist/css/[a-z0-9.-]+\.css' slac.libraries.yml | sort -u | while read p; do
  [ -f "$p" ] || echo "MISSING: $p"
done
```

### After Phase 7

- [ ] `diff -r /tmp/gesso-baseline/dist/css dist/css` — Phase 7 claims byte-identical output.
      Only `video-hero.css` (and possibly one responsive-font-size scale) may differ, and
      only in ways that are value-equivalent. See Phase 7, §7.9.

---

## 3. Compiled JS

`babel-loader` → `swc-loader` changes the emitted bytes, so a text diff is useless. Check
structure and behaviour instead.

- [ ] **File set must match exactly:**

```bash
diff <(ls /tmp/gesso-baseline/dist/js | sort) <(ls dist/js | sort)
```

      Any difference means the entry glob changed behaviour. Note upstream's glob adds
      `{cjs,js,ts}` and ignores `source/@types/**` and `source/07-react/**` — neither exists
      here, so the set should be unchanged.
- [ ] **`dist/js/common.js` must exist.** `slac_library_info_build()` gates the
      `slac/common` library on it, and 21+ libraries depend on `slac/common`. Without it,
      those dependencies silently resolve to nothing.
- [ ] Cross-check every `dist/js/*.js` path referenced in `slac.libraries.yml`:

```bash
grep -oE 'dist/js/[a-z0-9.-]+\.js' slac.libraries.yml | sort -u | while read p; do
  [ -f "$p" ] || echo "MISSING: $p"
done
```

- [ ] **jQuery must still be external, not bundled:**

```bash
grep -c 'jQuery' dist/js/dropbutton.es6.js       # small number = external reference
wc -c dist/js/dropbutton.es6.js                  # compare to baseline; a jump of ~90KB
                                                 # means jQuery got inlined
```

- [ ] Same check for `dist/js/addtocal-a11y.es6.js`.
- [ ] Confirm `Drupal`, `drupalSettings` and `once` are still external — spot-check a file
      that imports them (`dist/js/back-to-top.es6.js`) for bare global references rather than
      an inlined module.

---

## 4. SVG sprite — the icon regression check

`svgo-loader` 3 → 4 brings SVGO 3, whose default preset strips `viewBox`. If that happens,
**every icon in the theme scales wrong**.

```bash
diff /tmp/gesso-baseline/dist/images/sprite.artifact.svg dist/images/sprite.artifact.svg
```

- [ ] **Best case: identical.**
- [ ] If it differs:

```bash
grep -c '<symbol' dist/images/sprite.artifact.svg   # symbol count — must match baseline
grep -c 'viewBox' dist/images/sprite.artifact.svg   # must be > 0 and match symbol count
```

- [ ] Confirm the explicit `removeViewBox: false` config from Phase 2, §2.5 is present in
      `webpack.common.js`.
- [ ] Render check: open the Icon story in Storybook and compare against the baseline
      Storybook build. Icons rendering at the wrong size or clipped = `viewBox` was stripped.

---

## 5. Fonts and background images

Phase 2 changes two `generator.filename` patterns.

- [ ] Fonts: `fonts/[hash][ext]` → `fonts/[name][ext]`. Filenames change by design.
      Verify no CSS references a stale hashed name:

```bash
grep -ohE "url\([^)]*fonts/[^)]*\)" dist/css/*.css | sort -u | while read u; do
  p=$(echo "$u" | sed -E "s|url\(['\"]?\.\./||; s|['\"]?\)||")
  [ -f "dist/$p" ] || echo "BROKEN: $u"
done
```

- [ ] Background images: `images/[hash][ext]` → `images/backgrounds/[hash][ext]`. New
      subdirectory. Same check for `url(...images/...)` references.
- [ ] `.gitignore` already covers `dist/fonts/*` and `dist/images/backgrounds` — confirm no
      new untracked build output appears in `git status`.

---

## 6. Storybook HTML diffing — the main render check

Stories are the only automated render surface for this theme's components, so use them as
the markup regression test. This matters most for Phase 6 (CSF3 conversion) and for the
`lib/addAttributesTwigExtension.js` swap in Phase 4.

```bash
npm run build-storybook
```

- [ ] **Story inventory must match.** Storybook writes an index to
      `storybook/index.json` (SB8; SB6 wrote `stories.json`). Compare the story IDs and
      names:

```bash
node -e "
const fs=require('fs');
const read=p=>{const j=JSON.parse(fs.readFileSync(p,'utf8'));
  return Object.values(j.entries ?? j.stories).map(s=>s.id+' | '+s.title+' | '+s.name).sort();};
const a=read('/tmp/gesso-baseline/storybook/stories.json');
const b=read('storybook/index.json');
const A=new Set(a), B=new Set(b);
a.filter(x=>!B.has(x)).forEach(x=>console.log('LOST: '+x));
b.filter(x=>!A.has(x)).forEach(x=>console.log('NEW:  '+x));
console.log('baseline='+a.length+' current='+b.length);
"
```

      Adjust the filenames if SB6's index lives elsewhere. A `LOST` entry after Phase 6
      almost always means a missed `.storyName` → `name` rename.

- [ ] **Rendered markup.** The static build does not emit per-story HTML files, so render
      them. Cheapest reliable approach: run `npm run storybook` and use the iframe endpoint
      per story ID, capturing `#storybook-root` innerHTML:

```
http://localhost:6006/iframe.html?id=<story-id>&viewMode=story
```

      Script it with any headless browser available to you, dump each story's
      `#storybook-root` innerHTML to `/tmp/render-<id>.html`, and diff the set against the
      same capture taken from the baseline Storybook. Normalize before diffing —
      `clean_unique_id` / `unique_id` inject timestamp-based IDs that differ every run:

```bash
sed -E 's/--[0-9a-f]{14}/--UNIQID/g'
```

- [ ] **Expected: identical markup for every story**, modulo the normalized unique IDs.
- [ ] If you cannot script this, prioritize manual comparison of:
      - Icon (sprite `viewBox` + `gesso_image_path`)
      - Accordion, Tabs, Tooltip, Lightbox, Drawer (JS behaviours + `unique_id`)
      - Subfooter (three `gesso_image_path` logo concatenations)
      - Mega menu, Search, Social links (`gesso_image_path` passed through `include`/macro)
      - Any component whose Twig uses `add_attributes` with a **string** `class` value
        (the `lib/addAttributesTwigExtension.js` fork coerces these to arrays)
      - Facet label / facet list (this theme's diverged facet handling)

---

## 7. Storybook interactive smoke test

- [ ] `npm run storybook` — dev server starts.
- [ ] Fonts render as Lato / Merriweather → `preview-head.html` survived Phase 5.
- [ ] Sidebar brand is the SLAC logo, accent `#8c1515` → `theme.js` + `manager-head.html`
      survived.
- [ ] Sidebar groups in order: `Global`, `Layouts`, `Components`, `Paragraphs`, `Templates`,
      `Pages` → `storySort` including `Paragraphs` survived.
- [ ] Viewport toolbar shows the `INITIAL_VIEWPORTS` list → the `viewport` parameter survived.
- [ ] a11y addon panel present and reporting.
- [ ] Interact with every JS-backed component: Accordion, Tabs, Tooltip, Lightbox, Drawer,
      Filter modal, Icon card, Media grid, Grid with featured, Social share, Views toggle,
      Tagline long, Dropdown menu, Overlay menu, Back to top. Each must respond → proves
      `Drupal.attachBehaviors()` still fires from the new `decorators` export.
- [ ] Browser console: **zero** `Unknown "…" filter` / `Unknown "…" function` errors. Any
      such error means a Twig extension registration was missed in `.storybook/preview.js`.
- [ ] Browser console: zero uncaught exceptions from the React 19 upgrade (watch for
      `ReactDOMServer` warnings in `storybookHelper.jsx` consumers).
- [ ] The three converted `.mdx` docs pages render (Global, Dropdown menu, Mega menu).

---

## 8. Drupal-side verification (requires a consuming site)

Nothing in this repo can exercise the PHP or the Drupal templates. This step is the human
reviewer's, on a real site.

- [ ] Build a release zip (or point a local site's `composer.json` at this branch) and install
      it on a staging/local Drupal site.
- [ ] **Clear caches** — `drush cr`. Twig and library changes are cached aggressively.
- [ ] **`slac/common` must resolve.** Check the page source for
      `/themes/…/slac/dist/js/common.js`. If absent while other component JS is present,
      `dist/js/common.js` was not shipped (see §3).
- [ ] **Run with JS aggregation ON** (Performance → Aggregate JavaScript files). This is the
      configuration where a missing `slac/common` dependency actually breaks, and it is
      production-only. Verify the JS-backed components still work.
- [ ] Walk the page types that exercise this theme's diverged templates: article, event
      detail, people profile, media detail, FAQ landing, filtered-content views, search
      results, taxonomy term.
- [ ] Verify the four `theme_get_setting()` changes from Phase 8, §8.1 by toggling each
      setting in Appearance → SLAC settings and confirming the effect:
      Back to top on/off, threshold, smooth scroll, breadcrumb current page.
- [ ] Verify CKEditor: both CKEditor 4 and 5 stylesheets still load the Lato/Merriweather
      font URL and `dist/css/editor-styles.css` (`slac.info.yml` unchanged, but confirm the
      file still builds).
- [ ] Verify the icon sprite renders on the site, not just in Storybook — it is the artifact
      most likely to regress silently.
- [ ] Verify `dropbutton` (a jQuery consumer) works on an admin content listing.
- [ ] Verify `addtocal` (the other jQuery consumer) works on an event node.
- [ ] Compare against a pre-upgrade instance of the same site side by side. Where possible,
      capture screenshots of each page type before and after.

---

## 9. Release-path verification

- [ ] `rm -rf node_modules && npm ci && npm run build` — must succeed on a clean checkout.
      This is exactly what `build-assets.yml` does.
- [ ] `npm ci` (not `npm install`) — confirms `package-lock.json` is committed and consistent.
- [ ] Push a throwaway tag to a fork, or run the workflow manually, and inspect the resulting
      zip: it must contain `dist/css`, `dist/js` (incl. `common.js`), `dist/fonts`,
      `dist/images/sprite.artifact.svg`, `dist/images/backgrounds`, `dist/design-tokens.js`,
      plus `includes/`, `templates/`, `config/`, `*.yml`, `slac.theme`,
      `theme-settings.php`.
- [ ] `publish-demo-site.yml` succeeds and the Pages site serves the new Storybook
      (requires the manual Pages source change from Phase 9, §9.1).

---

## Sign-off checklist

| Check | Phase gate |
| --- | --- |
| `_design-tokens.artifact.scss` byte-identical | 4 |
| `dist/css` byte-identical (pre-lint-autofix) | 2, 4, 5 |
| `dist/css` differences all whitespace or verified-safe reorders | 3 |
| `dist/css` byte-identical again | 7 |
| `dist/js` file set identical; `common.js` present | 2 |
| jQuery still external in `dropbutton` / `addtocal-a11y` | 2 |
| Sprite `viewBox` intact, symbol count matches | 2 |
| All `dist/` paths in `slac.libraries.yml` resolve | 2 |
| Storybook story inventory identical | 5, 6 |
| Storybook rendered markup identical | 4, 5, 6 |
| Storybook interactive smoke test clean | 5 |
| Drupal site walkthrough clean, aggregation ON | 8 |
| `npm ci && npm run build` clean from scratch | all |
| Release zip contents verified | 9 |

---

# ACTUAL RESULTS — CSS baseline comparison

Baseline built with `sass-embedded@1.80.5`; post-upgrade build uses `1.103.1`.
**26 of 40 CSS files are byte-identical. 14 differ.** All 14 differences were analyzed and
are benign. Method: flatten each stylesheet to `(at-rule context, selector, property, value)`
tuples in document order, then check three things — (a) multiset difference of declarations,
(b) the ordered value list for every `(selector, property)` pair, which determines the cascade
winner, and (c) the document order of distinct selectors.

## Category 1 — Sass `mixed-decls` block splitting (11 files)

`addtocal`, `alert-bar`, `dropbutton`, `dropdown-menu`, `filter-modal`, `hamburger-button`,
`media-lightbox`, `mega-menu`, `overlay-menu`, `tabs`, `tagline--long`

Dart Sass used to hoist declarations that appeared *after* a nested rule up above it. Newer
Dart Sass keeps them in source order, emitting the parent selector twice:

```css
/* before */ .c-hamburger-button{outline:…;outline-offset:…;background-color:…;border:0}
             .c-hamburger-button:focus{outline-color:…}
/* after  */ .c-hamburger-button{outline:…;outline-offset:…}
             .c-hamburger-button:focus{outline-color:…}
             .c-hamburger-button{background-color:…;border:0}
```

Measured for all 11: **0 declarations added, 0 removed, selector document order preserved,
0 winner-sequence differences.** Provably cascade-equivalent — the text changed, the
resolved styles did not.

> Note: `silenceDeprecations: ['mixed-decls']` in `webpack.common.js` and `.storybook/main.js`
> is now **inert** — Sass 1.103 reports that deprecation as obsolete. It is harmless but no
> longer does anything, and it emits its own "obsolete" notice. Consider removing it.

## Category 2 — Autoprefixer dropped 5 vendor prefixes (3 files)

`styles.css`, `editor-styles.css`, `mobile-menu.css`

`autoprefixer` went 10.4.4 → 10.4.21, so its caniuse data is ~3 years newer. `browserslist`
in `package.json` is **unchanged**, but "last 2 versions and not dead" now resolves to newer
browsers, which no longer need these prefixes:

| Dropped declaration | Selector(s) |
| --- | --- |
| `-webkit-hyphens: none` | `abbr,blockquote,code,kbd,q,samp,tt,var` and the heading group |
| `-webkit-backdrop-filter: blur(4px)` | `.has-open-menu .l-site-container::after`, `.c-mobile-menu::after` |
| `-webkit-margin-start: 1.5rem` | `.c-cta-link+.c-cta-link` |
| `-webkit-padding-end: 48px` | `.c-form-item--select-filters .c-form-item__select` |

**This is the one place the "no visual change" claim is qualified.** For browsers inside the
current browserslist window, output is equivalent. Users on Safari older than the window
(roughly < 17 for `hyphens`, < 18 for `backdrop-filter`) lose hyphenation and the menu
backdrop blur. That is autoprefixer working as designed against refreshed support data, not a
regression introduced by this upgrade — but it is a real delta and someone should confirm the
browser-support target is still what SLAC wants.

## Category 3 — one color re-serialized (2 files)

`styles.css`, `editor-styles.css`: `.homepage .l-global-header` background
`hsla(0,0%,100%,.96)` → `rgba(255,255,255,.96)`. Same color (hsl(0,0%,100%) is white).
Newer Dart Sass emits the rgb form. Zero visual effect.

## Category 4 — two selector-order flips (2 files)

`styles.css`, `editor-styles.css`. A consequence of Category 1 where the source nests a rule
*before* any declaration:

| | base order | new order |
| --- | --- | --- |
| 361/362 | `.c-breadcrumb`, `.c-breadcrumb::after` | `.c-breadcrumb::after`, `.c-breadcrumb` |
| 505/506 | `.c-card__content--trimmed`, `.c-card__content--trimmed p:last-child` | reversed |

Both pairs target **disjoint element sets** (an element vs its `::after` pseudo-element; a
container vs a descendant `p`), so no property can conflict between them. The
winner-sequence check confirms every `(selector, property)` pair keeps its resolved value.
Inert.

## Conclusion

No CSS change in this upgrade alters rendering for browsers inside the configured
browserslist window. The only substantive delta is the intentional vendor-prefix reduction in
Category 2.

---

# ACTUAL RESULTS — final gate

```
stylelint      exit=0   0 problems
eslint         exit=0   0 problems
npm run build  exit=0   0 warnings, 0 errors
build-storybook exit=0  0 errors
```

Artifacts: 40 CSS, 32 JS (incl. `common.js`), sprite present with 37/37 symbols and
37/37 `viewBox` attributes, 228 Storybook entries (225 stories + 3 docs).
Story inventory 248/248 rows preserved; only the three `.stories.mdx` → `.mdx` filenames
changed. `npm ci` reproduces the tree from the committed lockfile.

## Two regressions found during verification, both fixed

### 1. The SVG sprite silently stopped being generated — CRITICAL

`source/images/_sprite-source-files/sprite.js` consists of a single
`require.context('.', true, /\.svg$/)` call, which is how all 37 icon SVGs get pulled through
`svg-sprite-loader`. Phase 1 added `"type": "module"` to `package.json`, which makes webpack
treat that `.js` file as ESM — and in ESM `require.context` is not a webpack construct.
Webpack emitted the call **verbatim as a runtime statement** and never traversed the SVGs.

Symptoms: `dist/js/sprite.js` went from 10,427 bytes to 61, and
`dist/images/sprite.artifact.svg` was not produced at all. **Zero errors, zero warnings.**
Every icon in the theme would have shipped broken, and because the sprite is gitignored and
built in CI, this would have surfaced only in a deployed environment.

Fix: renamed to `source/images/_sprite-source-files/sprite.cjs`. The `.cjs` extension is what
marks a file as CommonJS under `"type": "module"`. This is why upstream's entry glob is
`source/**/!(*.stories).{cjs,js,ts}` and its basename regex strips `/\.c?[jt]s$/` — that
support exists precisely for this file. The emitted bundle is still `dist/js/sprite.js`.

Post-fix: 37/37 symbols, every `viewBox` value identical to baseline, ~5% smaller because
SVGO 3 optimizes better than SVGO 2. **This also confirms the Phase 2 `removeViewBox: false`
pin works** — the risk the plan flagged did not materialize.

### 2. Storybook could not load its own config

`.storybook/main.js` used the `import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))`
shim that Phase 2 applies to the webpack configs. That shim is wrong for this file: Storybook
loads its config through `esbuild-register`, which transpiles to CJS and injects
`const __esbuild_register_import_meta_url__ = require('url')...`. Under `"type": "module"` the
file is evaluated as ESM, where `require` is undefined →
`ReferenceError: require is not defined` before any build starts.

Renaming to `.mjs` does **not** help — `esbuild-register` hooks `.mjs` too.

Fix: `.storybook/main.cjs`, written as genuine CommonJS (`require`, `module.exports`, real
`__dirname`). `.cjs` is the only extension Node treats as unambiguously CommonJS, which is
what esbuild-register's output requires. Added `.storybook/**/*.cjs` to the
`no-require-imports` exemption in `eslint.config.js`.

## Three additional fixes needed to reach zero build warnings

The build initially emitted 160 warnings:

- **117 × `if-function`** — Dart Sass 1.103 deprecates `if($cond, $a, $b)` in favour of
  `if(sass($cond): $a; else: $b)`. Sources: `00-config/functions/_iff.scss`,
  `00-config/mixins/_grids.scss` (×2). Upstream Gesso 5.4.2 still uses the classic form, so
  migrating would diverge from upstream and pin the theme to very new Sass. Silenced via
  `silenceDeprecations: ['if-function']` instead — the same mechanism upstream uses for
  `mixed-decls`.
- **40 × `mixed-decls deprecation is obsolete`** — the `silenceDeprecations: ['mixed-decls']`
  the plan told us to add is not merely inert on Sass 1.103, it emits its own warning.
  Removed from both `webpack.common.js` and `.storybook/main.cjs`.
- **3 × `slash-div`** — genuine deprecated divisions, fixed in source:
  `card/_card.scss` `$card-padding/2` → `math.div($card-padding, 2)`;
  `tagline--long.scss` `$c-tagline-gutter/2` → `math.div(...)` (plus a `@use 'sass:math'`).
  Verified output-identical: `width:calc(50% - 2.5rem)` before and after.

## Pre-existing issues confirmed, not caused by this upgrade

- `slac.libraries.yml` references three sets of assets that have no source and were absent
  from the **pre-upgrade** baseline build too: `grid_with_featured`, `icon_card`, and
  `hero_inline_image` (`dist/css/hero-inline-image.css`). Dead library entries; tracked
  separately.
- Storybook's webpack emits asset-size advisories (`244 KiB` limit). Present in the baseline
  Storybook 6 build as well. Informational, not upgrade-related.
