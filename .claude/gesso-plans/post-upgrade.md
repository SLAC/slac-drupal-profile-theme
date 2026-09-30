# Post-upgrade series

After hop 23 (Gesso 5.4.6, `cb90684`). One evidenced commit per item from STATE's list; W6-D9's equivalents are `7cf12e4a..12de09d0` and `73f02b22`.

## 1. `slac/common` on the libraries that wait on the common chunk

W6-D9 `252b003d`. `addtocal_a11y`, `back_to_top` and `dropbutton` load `dist/js` entries that need the webpack runtime chunk `dist/js/common.js` but did not declare `slac/common`; they worked only because `slac/global` (attached site-wide) depends on it. `alert_bar` gets it too, for uniformity (its entry does not need it today). Each now lists `slac/common` first, like the other 15 libraries.
- `libcheck`: "every chunk-dependent library declares it OK" (was 3 flagged); baseline re-recorded with `record-libcheck`.
- Sub-themed sites (trap S7): `slac/common` is defined only for the active theme, but 15 libraries already depend on it, so this adds no new behaviour there. The static `common:` library (upstream 5.4.6) is the real fix, recorded as a follow-up.
- Not exercised in Drupal (no site here); on every page the dependency is already satisfied through `slac/global`.

## 8. `theme-settings.php`: typed signature and `$theme` from `config_key`

The user's decision (STATE, "PHP layer"): the old branch's hunk from `f712137`, applied unchanged (its base blob is our file). Upstream ships the same logic at 5.4.4 (signature) and 5.4.6 (`config_key`). Details and the core call-site check in `php-review-notes.md` → "Post-upgrade: theme-settings.php". Flag F-26.
- `php -l` clean. Front-end output unaffected (a settings-form change): `verify` PASS.

## 8b. The SLAC package README

`git show f712137:README.md`, corrected against this tree (every factual claim checked), then `README.md` moved from `TOOLCHAIN` to `REVIEW` in `gesso-hop.sh` (a `take` of it is now refused; tried) and its watch row updated. Flag F-01.

Corrections, beyond the ones STATE listed:
- **Node 22**, not 24 (`.nvmrc`; CI reads it). (There was no `.npmrc` paragraph to drop.)
- **Stories are CSF2**: the CSF3 section is rewritten with the real `menu.stories.jsx` form; story names from export names or `storyName` (the `main.js` indexer wrapper, item 3); `npm run component` scaffolds upstream's CSF3 template, to be converted.
- **Per-story imports and the global behaviours** (items 2 and 4) documented.
- `.storybook/decorators.jsx` **does** exist (upstream's `withGlobalWrapper`, unused); the old text said it did not.
- `dist/js/common.js` comes from the dev watcher too since 5.4.6, and `splitChunks` now lives in `webpack.common.js`.
- **jQuery**: Storybook has no jQuery external or `stubs/jquery.js` (register; the old branch had both); `tsconfig.json`'s `jquery` path points at the real package, not a stub.
- Token examples that used tokens SLAC does not have: `gesso-brand(blue, light)` → `cardinal`, `gesso-spacing(md)` → `4`.
- **Removed**: the container-query mixins and `svg-mask-image` sections (the old branch's mixins, not carried; STATE: a scope reversion).
- `unique_id`: renamed upstream at **5.4.0**, reverted at **5.4.5** (the old text said 5.4.2 / 5.4.6).
- `subheading_level`: available in **neither** Storybook nor Drupal (we took neither half; the old text said Storybook had it).
- "Relationship to upstream": the "say why inline" convention replaced by the register (`.claude/gesso-deviations.md`) plus one-line `// Local:` markers; the `if-function` silence and `_button.scss` suppression it cited do not exist here (both fixed at source).
- Releases: zip exclusions as they are since hop 0 (`source/` ships; `.claude/` excluded; contents checked), Satis notified after the build job; `dist/design-tokens.js` is no longer built.

## 9. Sass deprecations from our own source

Mostly done inside the hops: the three `if()` calls at 5.4.4 s4 and every global built-in at 5.4.5 s4 (F-24). The last one here: `_card.scss`'s `padding: $card-padding/2 $card-padding` → `math.div($card-padding, 2)` (`sass:math` was already imported). `dist/css` byte-identical; build warnings **2 → 0**.

## 6. Stale `dist/images` files

W6-D9 `73f02b22` analogue (its commit also adopted the `images/backgrounds` output path, which we took at hop 6, F-07). The seven content-hashed files tracked in `dist/images/` (`2bf86343….svg`, `377b4ed5….svg`, `590958fe….jpg`, `9a4b53ac….svg`, `d8ca53f8….svg`, `d9800eb1….jpg`, `e28fe0be….jpg`) were committed by the initial theme build (`a21bcfe`, 2022-10-18), from the old output path. None is referenced by the repo, by a fresh `dist/css`, `dist/js` or Storybook build, or by the profile checkout's custom themes, modules or config (read-only grep). The build writes no images there any more (SLAC's CSS inlines its images). Removed. Kept: the six hand-placed files (`DOE.svg`, `DOE_logo.png`, `SLAC_Logo_W.svg`, `StanfordUniversity.svg`, `logo.svg`, `placeholder_image.jpg`). `verify` PASS, `dist/css` identical.

## 3. Export-list story names

W6-D9 `9eb93a52`, byte-identical (plus our one-line `// Local:` marker; register row). Storybook 10's CSF indexer names a story exported through an `export { A, B }` list after its raw export name ("ColorPalette"), and drops an `A.storyName = '…'` that comes before the list. All our story files use export lists, so `.storybook/main.js` wraps the indexers: a story whose name is still its export name gets its string-literal `storyName` from the file, or else `storyNameFromExport` (CSF2 works unchanged).
- Fresh `build-storybook`: 233 index entries, **every ID unchanged**; 132 names change ("ColorPalette" → "Color Palette", "TableWithRowHeaders" → "Table with Row Headers").
- Against the Storybook 6.5 reference (`$BASE/extra/storybook`, names read from its client API): **229 / 229** story names match (the 230th, Accordion View, is not in that build's story list, and its FAQ Landing Page renders there without the view's FAQs, pager and filter; see item 5).

## 2. Storybook global behaviours

W6-D9 `136d9207`. Storybook 6 bundled every story file eagerly, so each component's behaviour ran in every story; Storybook 7+ loads only the current story's imports. `.storybook/preview.js` now imports the three site-wide scripts of `slac/global`: `arrow-link.es6`, `external-link.es6` and `06-utility/transitions.es6` (SLAC has no pdf-link; upstream's `preview.js` imports its own global `html.es6`, which SLAC does not have). `slac/global`'s component scripts are imported by their stories, as before: `header.stories`, `search.stories` and `embed.stories` already import `header.es6`, `search.es6` and `embed.es6` (W6-D9 had to add two of these). Register row updated.
- Render sweep of all 230 stories (`gesso-harness/storysweep.mjs`: headless Chrome over the DevTools protocol; each story loaded directly and captured once its DOM has been stable for 1 s, at least 3 s in), compared with `sweepcmp.mjs` against the Storybook 6.5 reference, HEAD → this commit: stories missing `c-arrow-link__word` **47 → 0**, missing `external-link__word` **34 → 0**, missing any `data-once` **53 → 11** (the 11 render tooltips or lightboxes, whose scripts item 4 imports); stories missing any class that 6.5 renders **69 → 2** (Card With Icon and Card No Image, `c-card--no-link`: a Storybook 10 args issue, item 10).
- Harness: `rendercheck.browser.js` (the browser-pane version) gains feature counts, a DOM-stability wait, per-story class sets, localStorage results and `__rcCompare`; `storysweep.mjs` and `sweepcmp.mjs` are new. Hidden browser-pane tabs throttle timers, so the recorded numbers come from the headless sweep.

## 4. Per-story component imports

W6-D9 `aa9d08f1`. Storybook 7+ loads only the current story's imports, so a story that renders another component's Twig lost that component's CSS and JS, which Storybook 6 loaded globally. The list is recomputed for SLAC with **`gesso-harness/storydeps.mjs`** (new): per story file, the `slac/*` libraries Drupal would load for its Twig tree (`attach_library()` calls, closed over `slac.libraries.yml` dependencies), and whether the story imports each one's own source or stories file, directly or through the stories files it imports. It also checks `slac/global`'s component scripts that `preview.js` does not load (header, search, embed) for stories whose Twig tree uses that component. 11 story files were missing imports (W6-D9: 26 of 160); each gets one bare side-effect import, the stories file of the component where there is one, as upstream does:
- `drawer.stories`: Cards With Show More, Expandable Grid, Expandable List
- `tooltip.stories`: Hero Without Overlay (`article-hero`), Hero With Overlay (`hero-bg-image`), Overlap Image
- `media-lightbox.stories` (brings `lightbox.es6`): Figure
- `back-to-top.stories`: Subfooter; `tabs.stories`: Basic Page 1 (`05-pages/page`)
- own or stylesheet-only: `lightbox.es6` in Lightbox; `hamburger-button.scss` in Overlay Menu

- `storydeps`: 11 files missing → **0**; negative controls: the HEAD tree reports the 11, and deleting `header.stories`' own `header.es6` import is reported.
- Render sweep (`storysweep.mjs` / `sweepcmp.mjs`, as item 2) against the Storybook 6.5 reference, item 2 → this commit: stories missing any `data-once` **11 → 0** (Hero With Overlay ×2, Hero Without Overlay, Lightbox, Fifty Fifty ×3, Figure ×3, Overlap Image: their tooltip and lightbox scripts now load); stories missing a class 6.5 renders stay at 2 (item 10). The stylesheets' effect does not show in class sets; the pixel comparison is item 10.

## 5. Twig.js 3 fixes

Two Storybook-only template problems. Drupal renders these templates with PHP Twig, and its output is unchanged (below).

**`expandable-grid.twig`: `[:3]` / `[3:]` → `|slice(0, 3)` / `|slice(3)`** (W6-D9 `46b8f718`, the same two lines). In our Storybook 10 build (Twig.js 3.0) both halves came back whole: Expandable Grid showed items 1–6 collapsed and 1–6 twice expanded, Cards With Show More 6 / 12 cards (6.5 reference: 3 / 6). Now 3 / 6 in both, as in the 6.5 reference. PHP Twig compiles `a[:3]` to `a|slice(0, 3)`; with the site's Twig 3.29.0 old and new expressions give identical output for 6, 4, 3, 2 and 0 items, a keyed and a sparse array. (A standalone Twig.js 3.0.0 check had passed for six items; only the Storybook DOM showed the problem.) No other template uses the slice shorthand.

**Icon includes inside `{% apply %}`: `pager.twig`, `pager--mini.twig` and `filter-modal.twig`** (W6-D9 `631e47ef`, extended to SLAC's `filter-modal.twig`). `@forumone/twig-loader` bundles a template's includes by walking its tags and does not look inside `{% apply %}`, so Twig.js fell back to reading `icon.twig` from disk ("Unable to find template file … fs.statSync is not a function"). Each icon is now captured with `{% set %}…{% endset %}` outside the `apply` block and printed inside it, with upstream's `pager_icon_left_angle` / `pager_icon_right_angle` names.
- **Placement: after the `<nav>` tag, not at the top of the template** as upstream and W6-D9 put it (flag F-27). slac_helper's `add_attributes()` takes the context's `attributes` and removes them, so whichever `add_attributes()` runs first gets Drupal's attributes; at the top, that is the first icon's `<svg>`. `filter-modal.twig`'s capture sits just before its `apply` block.
- **Drupal output**: rendered with Twig 3.29.0, core's `Attribute` and slac_helper's `AddAttributesTwigExtension`, old and new templates are byte-identical in all 40 cases (pager: middle, first, last, no-href; mini: both, prev, next, none; filter-modal with and without a title; each with `attributes` absent, `false`, empty and non-empty). W6-D9's top placement, rendered the same way, differs in the 7 non-empty cases.
- **`gesso-harness/applyscan.py`** (new): 157 templates, 7 includes inside `apply` in these 3 files at HEAD, 0 after.
- **Storybook**: the 9 stories that failed (Filter Modal, Pager, Mini Pager, Accordion View, Toggleable View, View, FAQ / News Landing Page, People Profile) render, each pager with its two arrow icons; the headless sweep (item 2) finds **0 of 230** stories in error (HEAD 9; the 6.5 reference 8). 7 of them fail the same way in the 6.5 reference, and its FAQ Landing Page renders without the Accordion View content (FAQs, pager, filter), which it now has.

## Lockfile: two direct packages that floated within their range

Found by the reconcile against `f712137`: `postcss-selector-parser` 7.1.6 (upstream 5.4.6 tests 7.1.4) and `@typescript-eslint/eslint-plugin` / `-parser` 8.71.0 (upstream 8.63.0) are direct packages that npm floated within unchanged ranges, at hop 22 s4 and hop 20 s3. Neither `pinbump` nor `lockmin` looks at a direct package that still fits its range; the new `gesso-harness/directcheck.cjs` does (at 5.4.6 it now lists only SLAC-only packages, the recorded carve-outs `concurrently` 10.0.4 and `postcss` 8.5.28, and F-28).
- `postcss-selector-parser` → **7.1.4** (`npm install` of it with the Storybook set held, `package.json` restored, `lockfix` 1 round, `lockcheck` 0): exactly one lockfile entry changes; clean `npm ci`; `npm audit` 14 → 14; `verify` PASS (build 0 warnings, stylelint 0, eslint 40 files 0/0, `dist/` identical). Only stylelint and `lib/stylelintLVHFA.js` use it.
- `@typescript-eslint/*` **left at 8.71.0**, flag F-28: re-pinning the two direct packages alone left the shared transitive family at 8.71.0 (held by `eslint-plugin-storybook`) and 35 nested 8.63.0 duplicates, so it was reverted.

## File modes of taken files

Found by the reconcile against `f712137`: five taken `lib/` files had lost upstream's executable bit (`CodeMap.cjs`, `readSource.cjs`, `renderSass.cjs`, `transform.cjs`, `types.d.ts`: upstream, `main`, W6-D9 and the old branch have 100755; ours 100644 since hop 1 and hop 12). `gesso-hop.sh take` writes a temp file and `mv`s it over the target, which drops the mode; it now sets upstream's mode after the move (tested: a `take` of `CodeMap.cjs` with the bit cleared restores 100755, content unchanged). The five files are 100755 again. Nothing executes them directly, so there is no build change. No other path shared with upstream 5.4.6 differs in mode except five `templates/paragraph/*.html.twig`, which are ours (100755 since `main`) and untouched.

## 7. Optional: `attachBehaviors` decorator and sitewide-alert stub (measured)

**Sitewide-alert stub (W6-D9 `dbd469b5`): not needed, not adopted.** W6-D9's alert bar sits at `height: var(--gesso-alert-bar-height)` (0px until sitewide_alert's `sitewide-alert-rendered` event), so in Storybook the header covered the alert text. SLAC's `alert-bar.scss` uses `min-height` with that variable, so the bar sizes to its content without the event. Measured in headless Chrome (1280 px): in Basic Page 1 and Homepage the bar is 106 px tall with its text uncovered (a hit test at the text lands inside the bar) and the variable is `0px`, identically in the Storybook 6.5 reference and this build; the Alert Bar story measures the same here. The variable's other reader, the search panel's offset in `_search.scss`, is `0px` in the 6.5 build too.

**React-effect `attachBehaviors` decorator (W6-D9 `51fca15e`): measured, not adopted (flag F-29).** W6-D9 found Storybook 10 holding `STORY_RENDERED`, after which the preview decorator's Storybook `useEffect` runs, for up to 5 s while CSS animations ran (Image Hero, Our Story at 5.2 s); its wrapper calls `attachBehaviors()` from a React effect instead. Measured here with `storysweep.mjs --timing` (one headless Chrome, all 230 stories, first `attachBehaviors()` call after navigation start; the machine's backup job was loading the CPU, equally for every run):
- Storybook 6.5 reference: median **75 ms**, max 651 ms.
- This build (upstream 5.4.6's hook): median **1168 ms**, p90 1366 ms, max 2117 ms.
- A trial build with W6-D9's decorator applied as-is (minus its `eslint-disable` line): median **1070 ms**, p90 1247 ms, max 2347 ms; once per story, as before.
- Per story, hook minus decorator: median 94 ms, p10 −86 ms, p90 269 ms: no story is held, and the difference is within the run-to-run spread. The decorator's effect runs right after React commits the story, so the ~1 s is Storybook 10 getting the story rendered at all, not the animation hold.

Not worth a local deviation in two upstream files (`decorators.jsx`, and `preview.js` dropping upstream's hook) for ~0.1 s; `preview.js` keeps upstream 5.4.6's decorator. Adopt `51fca15e` if a story ever starts a long CSS animation at load.
