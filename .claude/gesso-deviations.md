# Standing deviations from upstream Gesso (SLAC theme)

These are the deliberate, ongoing divergences between this theme (the repo root) and upstream `forumone/gesso`. **Check this before applying any hop.** Several sit on lines upstream keeps touching, and re-applying upstream's version would silently undo a decision.

**Status: seeded 2026-09-29, before hop 1.** Rows marked *(seed)* come from the SLAC vs W6-D9 comparison (`gesso-plans/alignment-analysis.md`). **Confirm each seed row at the hop where it first matters.** Then remove the *(seed)* marker, or strike the row through if it turns out not to apply.

**Keeping it current:**
- **Growing it.** W6-D9's register is the template: `git -C /Users/btschu/Development/W6-D9 show "gesso-upgrade-hop-by-hop:.claude/gesso-deviations.md"`. When a hop touches a W6-D9 row, add the SLAC equivalent here once you've confirmed it applies. Rows transfer almost one-for-one, because both themes started from near-identical 5.0.9 toolchains.
- **Resolved rows.** Strike them through and keep them for history, as W6-D9 does.
- **The watch list.** Adding a row means adding a `DEVIATION_WATCH` entry in `gesso-hop.sh` in the same change. The pattern must match **upstream's** spelling.
- **Flags.** A row that departs from a W6-D9 decision also needs an entry in `gesso-review-flags.md`.

**Scope reminder:** upstream changes to the following are ours and are never applied, so they are not listed here; only toolchain-scope deviations are.
- `source/` (except `@types`), `templates/`, `dist/`, `config/`;
- the PHP layer (`includes/`, `slac.theme`, `theme-settings.php`);
- `slac.libraries.yml`, `slac.*.yml`, `composer.json`, `build-assets.yml`.

## Build configuration

| Deviation | Since | Why |
| --- | --- | --- |
| **StylelintPlugin `files: 'source'`** in `webpack.common.js` | hop 0 | The theme is the repo root, so `.claude/` (and anything copied into it) sits inside the lint context. stylelint-webpack-plugin globs dot-directories; at 5.0.9 it swept copied Storybook CSS under `.claude/` and crashed with `RangeError: Invalid string length` (2026-09-29). **Re-apply after every `take webpack.common.js`.** Flag F-04. |
| **`jquery: 'jQuery'` in `webpack.common.js` `externals`** *(seed)* | 5.2.5 | Upstream drops jQuery at 5.2.5. Two of our components import it (`dropbutton.es6.js`, `addtocal-a11y.es6.js`), and Drupal supplies it via `core/jquery`. Same deviation as W6-D9. |
| **`images/backgrounds` output path taken at 5.1.4, not post-upgrade** | hop 6 | Upstream 5.1.4 moves the `type: 'asset'` image output to `images/backgrounds/[hash][ext][query]`. W6-D9 skipped it at its hop 6 and adopted it post-upgrade (`73f02b22`). Taken at the hop here: SLAC's CSS has no non-`data:` `url()`, nothing is emitted to `dist/images/backgrounds/`, `dist/css` is byte-identical, and `.gitignore` already ignores that directory. Flag F-07. Not a deviation from upstream any more; the row records the timing. |
| **`.nvmrc` is 22, never upstream's** | always | Decided 2026-09-29. `build-assets.yml` (the release) and the new `ci.yml` use `node-version-file: '.nvmrc'`, and `publish-demo-site.yml` does from hop 13, so this file *is* the CI runtime. Upstream walks 14.17 → 16 → 18 → 20 → 22 (22 from 5.4.4). In the helper's REVIEW list, not TOOLCHAIN. |
| **sass-loader options: ~~`implementation: sass-embedded`, `webpackImporter: false`~~ (resolved 5.1.3, hop 5), `sassOptions.loadPaths`** | pre-existing | Present at `main` in **both** `webpack.common.js` and `.storybook/main.js`. **Since hop 5 only `loadPaths` remains**: upstream adopts `sass-embedded` and `webpackImporter: false` at the options level at 5.1.3 (SLAC never had W6-D9's misplaced-`webpackImporter` bug). Upstream uses `sass` and `includePaths` until it converges: 5.1.3 for the implementation (upstream adopts sass-embedded), 5.4.1 for `loadPaths`. **After any `take` of either file, re-apply all three to both files.** A verbatim take at 5.0.10 would `require('sass')`, which is not installed. One row covers two files (W6-D9 trap 9). Same deviation W6-D9 carried as its "oldest". |
| ~~**`.eslintrc.js`: `react/prop-types` and `react/jsx-props-no-spreading` off**~~ | pre-existing → **resolved hop 1** | SLAC-only lines at `main` ("React is only being used for Storybook"). **Dropped at hop 1** when `.eslintrc.js` was taken verbatim: lint is 42 files / 0 errors without them, because the eslint scope is `.js` without stories. Do not re-add. |
| **README.md: taken verbatim during the rebuild; SLAC-owned afterwards** | 2026-09-29 | `main`'s README is upstream 5.0.9's, byte-identical. It is taken like any toolchain file through hop 23, exactly as W6-D9 did. After the hops, one commit replaces it with the SLAC package README (from `f712137`, corrected), and README then moves to the helper's REVIEW list. Flag F-01. |
| **`publish-demo-site.yml`: SLAC edits on top of upstream's** *(seed)* | 5.2.6 | Upstream moves to `upload-pages-artifact` + `deploy-pages` at 5.2.6 (`4383dc74`) and bumps action versions at 5.3.2. Keep SLAC's `branches: [ main ]`, SHA-pinned actions, and an added `setup-node` step with `node-version-file: '.nvmrc'`. Needs the Pages source switch (review-flags A-1). |
| **`.stylelintrc.yml` `selector-max-compound-selectors: null`** | pre-existing | 4-deep nested list selectors in `_unordered-list.scss` / `_ordered-list.scss`. Same local relaxation as W6-D9. |

## Dependencies

| Deviation | Since | Why |
| --- | --- | --- |
| **Lockfile never regenerated** | always | W6-D9 trap 1. `deps --apply` → `install` → `driftcheck`. |
| **`jquery` kept** *(seed)* | 5.2.5 | See the `externals` row. Range: take upstream's last range before removal (W6-D9 carries `^3.6.3`). |
| **`sass-loader` ahead of upstream** *(seed)* | pre-existing | `main` has `^16`, while upstream 5.0.10 has `^12`, so `deps` says KEEP-OURS-NEWER. Resolved when upstream passes us (W6-D9: 5.4.5, `^17`). |
| **`deploy-storybook --source-branch=main`** | 5.0.10 | Upstream switches to `5.x`; keep `main`. The script and `@storybook/storybook-deployer` go away at 5.2.6. |
| **Storybook lockfile pinned to 7.0.x** | 5.2.0 (hop 7) → lifted 5.2.5 | As W6-D9's hop-07 plan: a fresh caret resolve lands 7.6.x, where upstream 5.2.0's own `@storybook/client-api`/`@storybook/addons` imports no longer exist. All 48 `@storybook/*` 7.x packages at 7.0.10 (upstream's lockfile), `package.json` at upstream's `^7.0.10`. |
| **Transitive lockfile drift rewound at dependency-bump hops** | hop 7 | SLAC addition, flag F-08. When a hop raises a range the lockfile no longer satisfies, `npm install` re-resolves the affected transitive tree to the newest versions allowed (hop 7: Babel helpers 7.29, browserslist 4.29, caniuse-lite …813, which changed `dist/css` and `dist/js`). `gesso-harness/lockfix.sh` rewinds each moved top-level package to its previous resolution, else upstream's tested one, never into an advisory range except for output-generating build tooling (recorded per hop), and hoists orphaned nested entries. W6-D9's lineage was already past upstream's tested versions, so it never met this. |
| **Advisory-range resolutions kept in output-generating build tooling** | hop 7 | SLAC addition, flag F-08. webpack 5.82.0 (GHSA-4vvj: gadget emitted only into the never-loaded `dist/js/sprite.js`; `buildHttp` unused), `@babel/helpers` 7.21.5 (GHSA-968p: affects only named capture groups in `.replace`, which our source does not use), browserslist 4.21.5 (`main`'s; stats-file/cache advisories, build-time only). Each resolves as upstream moves (webpack ≥5.94 at 5.4.2; Babel ≥7.26.10 at 5.4.2). Re-check at every hop that moves them. |
| **`@storybook/preview-api` introduced** *(seed)* | 5.2.5 → resolved 5.4.3 | W6-D9's load-bearing exception to never-introduce (the `preview.js` decorator's `useEffect`). It folds back into `storybook` at SB9. |
| **`twig-drupal-filters` GitHub tarball declined** *(seed)* | 5.2.5 → resolved 5.4.2 | W6-D9 declined upstream's kmonahan tarball (no registry integrity, in the deploy path) and took `@forumone/twig-drupal-filters` at 5.4.2. `deps` shows it as REVIEW-NON-SEMVER. |
| **`.npmrc` deleted** *(seed)* | non-hop after hop 11 (5.2.4) | `main` carries `legacy-peer-deps=true`. W6-D9 found it **caused** the glob 10 breakage (glob-promise fell through to glob 10) and removed it in `57e1f95c`, together with glob 10 and upstream's webpack entry function. Do the same, with `npm install` against the existing lockfile rather than a fresh resolve. |
| **Site-only runtime deps** *(seed)* | pre-existing | `gsap`, `imagesloaded`, `isotope-layout`, `isotope-packery`, `lodash`, `tiny-slider`. Untouched by upstream diffs. `imagesloaded`, `isotope-*` and `tiny-slider` are imported by nothing in this theme; removing them is a separate cleanup, not part of the rebuild. |
| ~~**`sass-embedded`, never `sass`/`fibers`**~~ | pre-existing → **resolved 5.1.3 (hop 5)** | Upstream drops `sass`/`fibers` and declares `sass-embedded ^1.57.1` (our range). The lockfile keeps `main`'s 1.80.5, newer than upstream's tested 1.57.1; never downgraded. |
| **Output-generating packages pinned to upstream's tested versions** *(seed)* | as each hop needs | sass-embedded, webpack, and terser (via `overrides`, from 5.4.3), as W6-D9 did. **SLAC addition, at hop 23:** `minimizer-webpack-plugin` first appears in upstream's lockfile at 5.4.6 (5.6.1, pulled in by webpack 5.108.4). Pin it via `overrides` alongside terser 5.49.0, because `minimizer-webpack-plugin ≥5.8` requires `terser ^5.51.0` (W6-D9's tip carries that out-of-range conflict). Flag it. |
| **`@forumone/eslint-config-es5` / `-react` pinned exactly** *(seed)* | 5.4.2 | To upstream's lockfile versions (4.0.0 / 3.0.7 at 5.4.6), as W6-D9 did. `deps --apply` re-carets them every time, so re-assert after running it. |
| **Security bumps of site-only deps** | hop 0 (E4) | SLAC addition; flag F-05. `main`'s lodash 4.17.21 had high advisories (GHSA-r5fr-rjxr-66jc and two moderates, all `<=4.17.23`) and is bundled into `dist/js/header.es6.js`. `npm update lodash` → 4.18.1 inside `^4` (lockfile only), before the baseline, so no pin. Behaviours 29/29 identical; `debounce`/`throttle` source unchanged. gsap has no advisory; jquery is an external. Never pin into an advisory range. |
| **Not introduced: `@swc/cli`, `svgo`** *(seed)* | 5.3.2 / 5.4.5 | As in W6-D9. Nothing runs the swc CLI, and svgo resolves as the sprite plugin's peer. |

## Storybook

| Deviation | Since | Why |
| --- | --- | --- |
| **`.storybook/preview.js` is hand-merged, never taken** | pre-existing | SLAC keeps `storySort` with `'Paragraphs'`, and `viewport: { viewports: INITIAL_VIEWPORTS }` (inside the default-exported `preview.parameters` since hop 7). That key **becomes `options` at Storybook 9** (5.4.3 s2); SB9+ ignores `viewports`. **No `../dist/js/universal.es6` or `../dist/js/html.es6` imports** (upstream adds both at 5.2.3, hop 10; SLAC has neither entry and `build-storybook` fails on the missing files; same as W6-D9). No `subheadingLevel` (see Twig parity), and no Storybook jQuery external or `stubs/jquery.js` (W6-D9 and `main` have none). |
| **Branding: `theme.js`, `manager-head.html`, `preview-head.html`** *(seed)* | pre-existing | SLAC brand values, fonts, the SearchWidget script, and the `if (document.body)` guard. Take only Storybook API or key changes. |
| **`gessoImagePath` in the Drupal stub** | pre-existing | At `main`, `.storybook/_drupal.js` line 37 has `drupalSettings.gesso.gessoImagePath: 'images'`, a SLAC addition that upstream 5.0.9 lacks. Upstream renames the file to `stubs/drupal.js` at 5.0.10; **moved with it at hop 1** (inside the IIFE, as W6-D9's). At 5.2.7 upstream adds `imagePath`; keep `gessoImagePath` there too. The external-link, mega-menu and dropdown-menu components build sprite paths from it, so losing it breaks icons **in Storybook only**, which `verify` cannot see. Skip the Twig `gesso_image_path` → `image_path` rename as W6-D9 did. |
| ~~**`fieldValue` in `preview.js`**~~ | pre-existing → **resolved 5.1.0 (hop 3)** | SLAC had backported upstream's `lib/fieldValue.js` and its `preview.js` wiring; upstream adopts both at 5.1.0, byte-identical. |

## lib/

| Deviation | Since | Why |
| --- | --- | --- |
| **`lib/transform.js` / `.cjs` font-feature-settings branch** | pre-existing | Take upstream **verbatim**, then re-add only this branch, with a one-line `// Local:` marker (after the `font-family` branch in `getScalarVisitor`). Our design tokens set `font-feature-settings`; without the branch the design-token build throws. Same end state as W6-D9 (`c50589d4`); done from hop 1 here, flag F-06. |
| **`lib/component.js` + `lib/templates/Javascript.hbs`: theme name `slac`** *(seed)* | 5.4.4 | Four sites hardcode the theme name: `attach_library('slac/…')`, the `slac.libraries.yml` path, `['slac/global']`, and the generated `Drupal.behaviors` key. Take upstream, then re-apply these four. |

## Twig runtime parity (Storybook vs Drupal)

`lib/*TwigExtension*.js` gives **Storybook** its Twig functions. `slac_helper` (in the slac-drupal-profile repo) gives **Drupal** its. A filter that exists on only one side renders in Storybook and fatals in Drupal, or the reverse.

| Deviation | Since | Why |
| --- | --- | --- |
| **`subheadingLevelTwigExtension.js` not adopted** *(seed)* | 5.4.0 | `slac_helper` has no PHP counterpart. Both halves or neither. |
| **`cleanUniqueId.js` not adopted** *(seed)* | 5.4.0–5.4.4 | Upstream reverts the rename at 5.4.5; skip it, as W6-D9 did. |

## Deliberately not adopted

- **CSF2 → CSF3 story conversion.** Stories stay CSF2; W6-D9's 160 story files build 264 stories on SB 10.6. The old branch's 153-file conversion is not redone.
- **Upstream component authoring** under `source/`: new components, the logical-property rewrites, token retuning, and the `container-query` / `svg-mask-image` mixins.
- **`source/06-utility/build-test/`** (it would add `dist/js` entries) and **`source/07-react/`** (we have no React app; `webpack.react-config.js` is taken but kept out of `build`).
- **The old branch's switched-off checks:** the `_button.scss` `stylelint-disable order/…` block, `silenceDeprecations: ['if-function']`, and the eslint `prefer-destructuring` override. Take the forced edits instead.

## Removed from the theme

The user's own product changes, replayed from the old branch at hop 0 (flag F-02):
- `df0ba0b`: tagline, tagline--long, video-hero, inverse-nav and transparent-nav sources (`ce9ea88`), with their `_index.scss`, `paragraph.inc`, `mega-menu.scss` and library (`tagline_long`, `inverse_nav`) companions;
- `2cedae3`: two templates (`87b2ba3`);
- `9df5d33`: dead library entries `grid_with_featured`, `hero_inline_image` and `icon_card` (their `dist/` files were never built), and the `attach_library` calls for the undefined `slac/embed` and `slac/search_result`.

Added or fixed in the same series: `3020d41` the `mega_menu` library; `0d9f0d0` the tags term page without its sidebar image; `a905ff6` the maintenance-page breadcrumb include; `b905363` `page--node--delete.html.twig`; `6d705b3` four dead story files exported (CSF2, +6 stories).

## Compiled-output expectations

One row per pinned artifact: the hop, the cause, the proof it is inert, and the pin location (`.claude/baseline/expected-since-<version>/`, each with a README). Deliberate story or library baseline changes (`record-stories`, `record-libcheck`) get a row too.

| Hop | Artifact | Cause | Proof | Pin |
| --- | --- | --- | --- | --- |
| 7 (5.2.0) | `js/sprite.js` | webpack 5.76.3 → 5.82.0 rewrites the auto-publicPath fallback loop | outside that one runtime function the file is byte-identical (module table, IDs, 238 string literals); file is loaded by nothing; behaviours 29/29 | `expected-since-5.2.0/` |
| 7 (5.2.0) | story baseline | `record-stories`: Storybook 7 writes `index.json`; the dead `mega-menu.stories.jsx` (all comments) is deleted | index 233 entries = inventory 233 rows | `extra/storybook-index.json` |
| 1 (5.0.10) | `js/sprite.js` | `context: __dirname` + `resolve.extensions` change webpack's module-ID hash | numeric renames form a consistent bijection (37 IDs, one per symbol); all 238 string literals identical; sprite artifact byte-identical; behaviours 29/29 | `expected-since-5.0.10/` — **retired at hop 3**: byte-identical to the baseline again after 5.1.0's theme-config split |

## Known pre-existing issues (at `main`, not caused by the upgrade)

| Issue | Plan |
| --- | --- |
| `addtocal_a11y`, `back_to_top` and `dropbutton` wait on the common chunk but don't declare `slac/common`. They work only because `slac/global` pulls it in. | Post-upgrade fix (W6-D9 `252b003d`); add `alert_bar` for uniformity |
| `slac_library_info_build()` defines `slac/common` only for the **active** theme, so sub-themed sites lose it. slac-today carries a workaround. | Document (php-review-notes 5.4.6: upstream's static `common:` library). Not applied in the rebuild; flagged as a recommended follow-up. |
| 7 content-hashed files in `dist/images/`, unreferenced since 2022 | Post-upgrade removal (W6-D9 `73f02b22` analogue) |
| Twig.js / twig-loader limitations: `[:3]` slices in `expandable-grid.twig`; icon includes inside `{% apply %}` in `pager.twig`, `pager--mini.twig` and `filter-modal.twig` | Post-upgrade fixes (W6-D9 `46b8f718`, `631e47ef`) |
| 13 story files hide their stories by commenting out the exports. 12 still keep `export default settings;` and are fine on SB7+. ~~**`mega-menu.stories.jsx` is commented out entirely**, which SB7 rejects.~~ | Leave the 12 alone. **Done at hop 7:** `mega-menu.stories.jsx` deleted (SB7: `NoMetaError: CSF: missing default export`), `record-stories` run (index.json 233 = 230 stories + 3 docs). |
