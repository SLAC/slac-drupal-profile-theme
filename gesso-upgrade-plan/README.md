# Gesso 5.0.9 → 5.4.2 upgrade plan — `slac` theme

**Theme machine name:** `slac`
**Current Gesso base:** 5.0.9 (`package.json` → `"name": "gesso"`, `"version": "5.0.9"`)
**Target Gesso release:** 5.4.2
**Diff source:** `gesso-update-diff.diff` at the repo root (26,943 lines, 630 changed files,
generated from `forumone/gesso` `5.0.9...5.4.2` via the GitHub compare API, `package-lock.json` excluded)

---

## READ THIS FIRST — changes in the diff that will NOT be implemented

The diff spans four minor releases of upstream Gesso and includes a large amount of
upstream *component authoring* (new components, restyled components, retuned design
tokens). This theme is a heavily diverged Gesso descendant, and the stated goal for
this upgrade is:

> Bring dependencies, tooling, and conventions up to date with the newest Gesso, but
> keep rendered output identical.

Everything below is therefore **deliberately excluded**. Each exclusion is either
(a) inapplicable to this repo, or (b) a change to rendered markup/CSS, which the
no-visual-change constraint forbids.

### A. Not applicable — the file or directory does not exist in this repo

| Diff path(s) | Why excluded |
| --- | --- |
| `gesso_helper/**` (19 files) | This repo contains no `gesso_helper` directory. The equivalent code lives in the separate **`slac_helper`** Drupal module (declared in `slac.info.yml` `dependencies`). Triaged in [`cross-repo-slac-helper.md`](cross-repo-slac-helper.md) — two items there are worth porting (an `AddAttributesTwigExtension` defensive fix and a `drupal_get_path()` D10 incompatibility), the rest is feature work or docblock noise. |
| `config/install/block.block.gesso_page_title.yml`, `config/install/block.block.gesso_tools.yml`, `config/install/gesso.settings.yml`, `config/install/block.block.gesso_search.yml` → `config/optional/…` | Modified (not added) in the diff. This repo has **no `config/install/` directory** — only `config/schema/slac.schema.yml`. Per the "do not create modified-but-missing files" rule, these are skipped. |
| `.buildkite/build.sh` (deleted), `.buildkite/pipeline.yml` | No `.buildkite/` directory here; this repo uses GitHub Actions. |
| `source/07-react/**`, `webpack.react-config.js` | Upstream adds a React micro-app scaffold. This theme has no React app. Adding it would emit an unused `dist/js/react/main.js` artifact and an unused `slac/react` library. See Phase 2 for how to add it later if wanted. |
| `source/06-utility/build-test/**` | Upstream's own toolchain smoke-test fixtures. Not useful in a consumer theme. |
| `source/@types/drupal/index.d.ts` | Ships with upstream's TypeScript component conversions, which are excluded (below). Optional; see Phase 2 note. |
| `dist/images/forumone.svg`, `dist/video/sample.mp4` | Forum One branding/demo assets. This theme has its own Storybook brand image (`.storybook/theme.js` → `./images/logo.svg`). |
| `source/01-global/global.stories.mdx` → `global.mdx` content edits beyond the `Meta` import | The rename **is** applied (Storybook 8 requirement, Phase 5); the upstream body text is Gesso-specific documentation. |

### B. Applicable but excluded — would change rendered output

| Diff path(s) | Why excluded |
| --- | --- |
| `source/00-config/config.design-tokens.yml` | Retunes the whole type scale (`font-size` 4–10 changed, 11–15 added), replaces `line-height` keys (`tight`→`short`, `loose`→`tall`, adds `shortest`/`taller`/`tallest`), adds `letter-spacing` tokens, changes `blockquote`/`body-large` sizes, adds `facet`/`table` colors. **Every one of these changes computed CSS values.** This theme's token file is independently tuned. |
| ~110 `source/**/*.scss` component/layout/global files | Upstream converted physical properties to logical properties (`margin-bottom` → `margin-block-end`, `padding-left` → `padding-inline-start`, `border-right` → `border-inline-end`, `left/right` → `inset-inline`) and restyled components. Logical properties render identically in LTR, but this is per-component upstream authoring against upstream markup — this theme's components are different files. |
| `source/00-config/mixins/_grids.scss` | **Removes** `set-flex-column`, `flex-grid`, `css-grid-reset` and the `$flex-override` params. This theme calls `flex-grid` (6×), `set-flex-column` (8×) and `css-grid-reset` (3×). Applying this breaks the build. |
| `source/00-config/mixins/_layout.scss` | Rewrites `layout-constrain` (adds `width: 100%`), `layout-full-bleed` (now depends on a `--scrollbar-width` custom property set by new upstream JS), `layout-align-*`. All change layout. |
| `source/00-config/mixins/_list.scss`, `_aspect-ratio.scss` | Physical → logical property conversion inside shared mixins; changes emitted CSS for every consumer. |
| `source/00-config/mixins/_responsive-font-size.scss` | Refactor is output-neutral **only if** the new `ideal-font-size()` function is added and tokens are unchanged. Deferred to keep the token/typography surface frozen; revisit separately. |
| New upstream components: `accordion`* , `modal`, `external-link`, `facet`, `facet-list`, `file`, `filters`, `icon-link`, `read-more-link`, `rss-feed`, `call-to-action`, `table`, `teaser`, `letter-spacing`, `messages-and-tabs`, `content-placeholder`, `button-group-item`, `icon--exit`, `table--sortable`, `wysiwyg.es6`, `universal.es6`, `html.es6`, `_setScrollbarProperty.es6`, `_getClosestSibling.es6` | Adds new CSS/JS to the bundle and, for name collisions, **overwrites this theme's own implementations**. `source/03-components/accordion/*` in particular exists here with different markup, data keys and JS. |
| ~107 `templates/**/*.html.twig` files | Upstream's Drupal template overrides. This theme's `templates/` tree is diverged (13 subdirectories, many theme-specific overrides). Wholesale application would change rendered markup everywhere. |
| `gesso.libraries.yml` new library entries (`accordion_step_list`, `block`, `breadcrumb`, `call_to_action`, `card`, `details`, `external-link`, `facets`, `file`, `filters`, `icon_link`, `image_teaser`, `message`, `modal`, `pager`, `pager_mini`, `progress`, `react`, `read_more_link`, `rss_feed`, `tag`, `tag_list`, `teaser`, `video`, `wysiwyg`) | These reference the excluded components' `dist/` artifacts. Adding them yields libraries pointing at nonexistent CSS/JS. |
| `gesso.info.yml` → `libraries-override: system/base` (disabling core `align.module.css`, `clearfix.module.css`, `hidden.module.css`) | Removes core CSS from every page — a real visual change. |
| `gesso.info.yml` → new `title` region | Adds a region; requires block placement config (also excluded) and changes `page.html.twig`. |
| `gesso.info.yml` → `core_version_requirement: '^10.1'` | This theme declares `^9 || ^10`. Narrowing it is a **product decision**, not a tooling one. Flagged in Phase 8 as a decision point, not applied by default. |
| `gesso.info.yml` → `ckeditor_stylesheets: dist/css/ckeditor4-styles.css` | Requires a `source/ckeditor4-styles.scss` that does not exist here, and this theme deliberately loads its own font stack into both CKEditor 4 and 5. |
| `includes/facets.inc` (new), `includes/file.inc` (new), `includes/form.inc` → `gesso_form_alter` + `gesso_preprocess_field_multiple_value_form` + `gesso_preprocess_links__dropbutton`, `includes/field.inc` → `gesso_preprocess_field` paragraph index + `gesso_theme_suggestions_gesso_icon_alter`, `includes/navigation.inc` → `preprocess_menu`/`menu_local_tasks`/`menu_local_task`, `includes/media.inc` → `u-align` class rewrite, `includes/views.inc` → auto-title, `includes/libraries.inc` → `gesso_element_info_alter`, `includes/paragraph.inc` → `gesso_preprocess_paragraph`, `includes/html.inc` → external-link settings | All add or change classes/markup/variables in rendered output. Several also depend on excluded components (`c-facet`, `c-file`, `c-button-group__link`) or on `slac_helper` render elements that do not exist. |
| `theme-settings.php` → External Links settings group | Ships the excluded `external-link` component. Would also need matching keys in `config/schema/slac.schema.yml`. |
| `includes/form.inc` → `form-element__` → `form_element__` suggestion rename | Changes which template files Drupal picks up. This theme has `templates/form/form-element*.html.twig` overrides keyed on the current naming; renaming silently drops overrides. |

### C. Deliberate deviations from upstream (upstream removes it; we keep it)

| Item | Reason |
| --- | --- |
| `jquery` in `package.json` dependencies | Upstream drops jQuery entirely. This theme **uses it**: `source/03-components/dropbutton/dropbutton.es6.js` and `source/03-components/addtocal/addtocal-a11y.es6.js` both `import jQuery from 'jquery'`. |
| `jquery: 'jQuery'` in `webpack.common.js` `externals` | Same. Removing it inlines jQuery into `dist/js/dropbutton.es6.js`. |
| `core/jquery` in `slac.libraries.yml` `dropbutton` deps | Same. |
| SLAC-only npm dependencies: `gsap`, `imagesloaded`, `isotope-layout`, `isotope-packery`, `tiny-slider`, `lodash`, `@drupal/once` | Not present in the upstream diff at all, so untouched (per the "only change packages the diff changes" rule). |
| `.storybook/preview-head.html`, `.storybook/manager-head.html`, `.storybook/theme.js` brand values | SLAC-specific; not in the diff. Preserve verbatim. |
| `.npmrc` (`legacy-peer-deps=true`) | Not in the diff. Keep — it is likely load-bearing for the Storybook 8 + React 19 peer graph. |
| Extra `storySort` order entry `'Paragraphs'` in `.storybook/preview.js` | SLAC-specific; must survive the rewrite in Phase 5. |
| `viewport: { viewports: INITIAL_VIEWPORTS }` parameter in `.storybook/preview.js` | SLAC-specific; must survive the rewrite in Phase 5. |

---

## Packaging context — this theme is a Composer dependency

This repo is **not** checked out at `web/themes/custom/slac` in a Drupal project. It is
a standalone `drupal-theme` Composer package (`composer.json` → `slac/slac-drupal-profile-theme`),
distributed as a tagged zip via GitHub Releases and a Satis instance
(`.github/workflows/build-assets.yml`).

Consequences the implementing agent must respect:

1. **`dist/` is built in CI, not committed.** `.gitignore` excludes `dist/css`, `dist/js`,
   `dist/fonts/*`, `dist/design-tokens.js`, `dist/images/backgrounds`,
   `dist/images/sprite.artifact.svg`, `source/00-config/_design-tokens.artifact.scss`,
   `source/00-config/_GESSO.es6.js`, and `storybook`. `npm run build` must succeed on a
   clean checkout with only `npm ci`.
2. **`.github/workflows/build-assets.yml` is the release gate.** It runs
   `npm i -g npm@10 && npm ci && npm run build`, then `rm -rf node_modules`, then zips
   with `exclusions: '*.git* /*node_modules/* .editorconfig source/*'`. Any new root-level
   config file added by this upgrade (`.swcrc`, `eslint.config.js`, `eslint.dev.config.js`,
   `tsconfig.json`, `.prettierignore`) will be shipped inside the release zip. That is
   harmless but worth knowing; see Phase 9 if you want to prune them.
3. **`npm run build` must not depend on directories that don't exist.** This is why
   `webpack.react-config.js` is excluded from the `build` script (Phase 2) — upstream's
   version of the script would fail on `source/07-react/index.tsx`.
4. **The zip `exclusions` list drops `source/*` but keeps `lib/`, `.storybook/`,
   `webpack.*.js`.** Adding `lib/*.cjs` files (Phase 4) is safe. Note `npm i -g npm@10`
   in CI must be reconciled with the Node 22 in `.nvmrc` — see Phase 9.
5. **No Drupal site is available for verification in this repo.** Visual regression must be
   done by the human reviewer in a consuming site, or by Storybook diffing. See
   [`verification.md`](verification.md).

---

## Version bump

`package.json` `"version"` moves `5.0.9` → `5.4.2` in Phase 1. Keep `"name": "gesso"` —
the upgrade tooling (`get-gesso-diff.sh`) detects the flavor and the base version from
these two fields, so changing `name` breaks the next upgrade run.

`slac.info.yml` has **no** `version:` key; it is injected at release time by the
`yaml-update-action` step in `build-assets.yml`. Do not add one.

---

## Phases

Execute in order. Each phase file lists concrete to-do items with file paths and the exact
content or transformation to apply.

| # | File | Scope | Blocking? |
| --- | --- | --- | --- |
| 1 | [`phase-01-node-and-dependencies.md`](phase-01-node-and-dependencies.md) | `.nvmrc`, `package.json` deps/scripts/`type: module`, version bump, `npm install` | Yes — everything else depends on it |
| 2 | [`phase-02-esm-build-toolchain.md`](phase-02-esm-build-toolchain.md) | Babel → SWC, CJS → ESM webpack configs, `.swcrc`, `tsconfig.json`, `postcss.config.js`, loader option updates | Yes |
| 3 | [`phase-03-linting.md`](phase-03-linting.md) | ESLint 9 flat config, Stylelint 16, Prettier 3, `.prettierignore`, `lib/stylelintLVHFA.js` | Yes (webpack runs both linters) |
| 4 | [`phase-04-lib-and-twig-extensions.md`](phase-04-lib-and-twig-extensions.md) | `lib/*.js` → `.cjs` splits, `yaml` v1→v2 rewrite, new Twig extensions, `lib/component.js` ESM | Yes |
| 5 | [`phase-05-storybook-8.md`](phase-05-storybook-8.md) | Storybook 6.5 → 8.6, `main.js`/`preview.js`/`manager.js`, `stubs/`, `decorators.jsx`, `.stories.mdx` → `.mdx` | Yes |
| 6 | [`phase-06-stories-csf3.md`](phase-06-stories-csf3.md) | 153 `*.stories.jsx` files: CSF2 → CSF3 | No (SB8 still runs CSF2) but strongly recommended |
| 7 | [`phase-07-sass-modernization.md`](phase-07-sass-modernization.md) | Sass global built-ins → `sass:*` modules, new additive functions/mixins, `silenceDeprecations` | No |
| 8 | [`phase-08-drupal-php-and-twig.md`](phase-08-drupal-php-and-twig.md) | `theme_get_setting()` signature cleanup; optional `gesso_image_path` → `image_path`; `core_version_requirement` decision | No |
| 9 | [`phase-09-ci-and-release.md`](phase-09-ci-and-release.md) | `publish-demo-site.yml` rewrite, `build-assets.yml` npm/Node reconciliation, `Dockerfile` removal | No |
| 10 | [`phase-10-readme.md`](phase-10-readme.md) | Merge upstream README changes into this theme's `README.md` | No |
| — | [`verification.md`](verification.md) | How to prove "no visual change" | — |
| — | [`cross-repo-slac-helper.md`](cross-repo-slac-helper.md) | `gesso_helper` → `slac_helper` follow-up (separate repo) | — |

### Suggested commit boundaries

Phases 1–5 are one interlocking change — the build and Storybook are broken between
Phase 1 and the end of Phase 5. Land them as a single PR (or a stacked branch with a
green build only at the end). Phases 6–10 are each independently landable.

---

## Highest-risk items — read before starting

1. **ESLint config swap will surface hundreds of new errors.** Moving from `eslint-config-airbnb`
   to `@forumone/eslint-config-es5` changes the rule set entirely, and `eslint-webpack-plugin`
   is wired into both `webpack.dev.js` and `webpack.production.js` — so lint failures
   **fail the release build**. Budget real time for Phase 3, Step 3.6.
2. **`svgo-loader` 3 → 4 pulls in SVGO 3, whose default preset includes `removeViewBox`.**
   The SVG sprite (`dist/images/sprite.artifact.svg`) is built through
   `svg-sprite-loader` → `svg-transform-loader` → `svgo-loader`. If `viewBox` is stripped,
   **every icon in the theme scales wrong**. Phase 2, Step 2.7 covers pinning an explicit
   SVGO config. Verify the sprite before anything else.
3. **Prettier 2 → 3 reformats source.** `stylelint --fix` / `eslint --fix` will rewrite
   whitespace across `source/`. Compiled CSS text changes (whitespace inside multi-line
   values); rendering does not. Do the reformat as its own commit so the functional diff
   stays reviewable.
4. **`"type": "module"` is a repo-wide switch.** Every `.js` file loaded by Node
   (`webpack.*.js`, `postcss.config.js`, `lib/*.js`, `.storybook/*.js`) becomes ESM at once.
   Files that must stay CommonJS get renamed to `.cjs`. Phase 4 has the full mapping.
5. **The `unique_id` → `clean_unique_id` rename is safe, but verify it first.** Upstream
   *deletes* its custom `UniqueIdTwigExtension` (which mapped `unique_id` →
   `Html::getUniqueId()`) and switches call sites to `clean_unique_id`, which Drupal core
   provides out of the box via the same `Html::getUniqueId()` callable. So no `slac_helper`
   release is strictly required — but confirm the core filter exists on the target Drupal
   version before rewriting 28 Twig call sites, because a wrong assumption here is a hard
   `Unknown "clean_unique_id" filter` fatal, not a visual regression. Handled in Phase 4,
   §4.6; see [`cross-repo-slac-helper.md`](cross-repo-slac-helper.md).

---

## Implementation status

Baseline captured at `/Users/btschu/Development/slac-drupal-profile-theme/.claude/gesso-baseline`
(dist/, storybook/, `_design-tokens.artifact.scss`, `_GESSO.es6.js`, `story-inventory.txt`
= 248 rows, plus `story-inventory.mjs` to regenerate it).

Build environment: plain npm, local Node 22.9.0 / npm 11.17.0. No ddev config exists in this
repo, so `ddev gesso <cmd>` is not usable here.

| Phase | Status |
| --- | --- |
| 1 — Node & dependencies | DONE — `add-attributes-twig-extension` removed early (Phase 4 must supply `lib/addAttributesTwigExtension.js`) |
| 2 — ESM build toolchain | DONE — jQuery external, SVGO `removeViewBox: false`, `output.clean: false` all verified present |
| 3 — Linting | CONFIGS DONE (3.1–3.6). **Step 3.7 autofix/triage deferred** to a single pass after Phases 4–7. LVHFA report threshold moved `>0`→`>1` per upstream post-image. |
| 4 — lib/ & Twig extensions | DONE — all three design-token artifacts **byte-identical** to baseline. Preserved a local `font-feature-settings` transformer in `transform.cjs` that upstream lacks (the plan's "extract verbatim" instruction would have dropped it). `lib/uniqueId.js` kept + converted to ESM; zero Twig files changed. |
| 5 — Storybook 8 | DONE — all SLAC values preserved (preview-head/manager-head untouched, `barHoverColor` the only theme.js change, `Paragraphs` sort order + INITIAL_VIEWPORTS survived, `gessoImagePath` kept). 3 `.stories.mdx`→`.mdx` renamed; all were prose-only, no `<Story>`/`<Canvas>` migration needed. `decorators.jsx` deliberately skipped. **`stubs/jquery.js` imports `jquery/dist/jquery.js`** (deep path) because the plan's bare `'jquery'` import would be captured by the new externals key and resolve to `undefined` — needs runtime confirmation in the Storybook smoke test. |
| 6 — Stories CSF3 | DONE — 150 story files converted (3 are fully commented out; nothing to convert). Inventory 248→248 rows, every `title|storyName` pair preserved. **Caught a gap in this plan:** 30 modules called stories as functions (`Card(Card.args)`), which breaks on object stories — rewritten to `X.render(...)`, incl. `source/05-pages/page-wrappers/default.jsx`. Also fixed 8 misplaced `eslint-disable-next-line` pragmas that restructuring would have silently un-suppressed. |
| 7 — Sass modernization | DONE — all deprecated global built-ins removed from `source/` (`global-builtin` warnings 23→0; total 27→4, the 4 remaining in excluded files). §7.5 correctly skipped: all 14 `responsive-font-size` tokens use `val: auto`, so this theme's impl is already equivalent. `_container-query.scss` + `_svg-mask-image.scss` added and forwarded, `$container-queries-rems` added. CSS proven unchanged against a reverted-control build (40/40 identical). |
| 8 — Drupal PHP & Twig | DONE — 4 `theme_get_setting()` calls simplified. 8.2 was already satisfied (no-op). 8.6 audit: added missing `core/*` deps to `back_to_top`, `addtocal_a11y`, `drawer`, `overlay_menu`, `social_share`, `tooltip`, `dropdown_menu`, `dropdown_widget`. Did **not** add `slac/common` anywhere — verified against built bundles that none of those files import a split-chunk module, so the plan's suggestion there was wrong. 8.3/8.4/8.5 skipped as planned. |
| 9 — CI & release | DONE — SHAs pinned: upload-pages-artifact `56afc609…` #v3.0.1, deploy-pages `d6db9016…` #v4.0.5. `npm i -g npm@10` dropped. Dockerfile + .dockerignore deleted. Zip `exclusions` deliberately untouched. **Manual step: switch GitHub Pages source to "GitHub Actions".** v5 of both actions exists as a follow-up. |
| 10 — README | DONE — 482→921 lines. Identity de-Gesso'd, install/release/settings sections rewritten against verified evidence (8 real theme settings), jQuery documented as retained, `common.js` + TypeScript + CSF3 + npm-scripts sections added. **Open TODOs left in the file (need a human):** demo-site GitHub Pages URL, maintainers list, Satis endpoint URL. **Must re-check:** it documents the container-query / svg-mask-image mixins, which only exist if Phase 7 landed them. |

### Findings outside the upgrade's scope

- **`slac.libraries.yml` declares two dead libraries.** `grid_with_featured` and `icon_card`
  reference `dist/css`/`dist/js` artifacts that have no source under `source/` and are absent
  from both the pre-upgrade and post-upgrade builds. Pre-existing, not caused by this upgrade.
  Drupal silently ignores missing files in a library definition. Tracked as a separate task;
  removal needs a check that nothing still attaches them.
- **Local Node is 22.9.0, below `eslint-visitor-keys@5.0.1`'s `^22.13.0` floor.** `.nvmrc` says
  `22`, so a fresh `nvm install 22` is fine, but this machine is under the floor. Watch for odd
  ESLint 9 behaviour during the step 3.7 pass.
- **`actions/upload-pages-artifact` and `actions/deploy-pages` both have a v5** now. Phase 9
  pinned v3/v4 per the plan; a bump is available as a follow-up.

---

## Post-implementation: fixes beyond the plan

The plan as written did not survive contact with the build. Five corrections were needed:

| # | Issue | Fix |
| --- | --- | --- |
| 1 | **SVG sprite silently stopped building.** `"type": "module"` made webpack treat `source/images/_sprite-source-files/sprite.js` as ESM, where its `require.context()` is not a webpack construct. Zero errors, zero warnings; every icon would have shipped broken. | Renamed to `sprite.cjs`. Upstream's `{cjs,js,ts}` entry glob exists for exactly this. |
| 2 | **Storybook could not load its config.** The plan's `import.meta.dirname` shim is wrong for `.storybook/main.js` — Storybook loads it via `esbuild-register`, which injects a CJS `require()` that fails under `"type": "module"`. `.mjs` does not help (esbuild-register hooks it too). | Converted to `.storybook/main.cjs`, genuine CommonJS. |
| 3 | **`silenceDeprecations: ['mixed-decls']`** (which the plan mandates) is obsolete on Sass 1.103 and emits its own warning — 40 of them. | Replaced with `silenceDeprecations: ['if-function']`, the deprecation that is actually live. |
| 4 | **`files: ['*.jsx']` in `eslint.config.js`** only matches the repo root in flat config, so the React config never reached `source/**`. | Widened to `**/*.jsx` / `**/*.tsx`. |
| 5 | **`eslint.config.js` did not ignore build output**, so an unscoped `eslint .` walks `dist/` and `storybook/`. | Added `dist/**`, `storybook/**` to `globalIgnores`. |

Also corrected in the plan's guidance, by the phase agents:
- Phase 4: `lib/transform.js` had a local `font-feature-settings` transformer with no upstream
  counterpart. "Extract verbatim from the diff" would have dropped it.
- Phase 8: the plan's advice to add `slac/common` to four libraries was unjustified — none of
  their JS imports a split-chunk module. Six *other* libraries were genuinely missing
  `core/drupal` / `core/once` / `core/jquery`.
- Phase 6: 30 modules call stories as functions (`Card(Card.args)`), which breaks on object
  stories. The plan did not anticipate it; call sites were rewritten to `X.render(...)`.

## Final state

All four gates green: `stylelint` 0, `eslint` 0, `npm run build` 0 warnings / 0 errors,
`npm run build-storybook` 0 errors. See `verification.md` for the full evidence, including the
cascade-equivalence analysis of every CSS difference.

**Nothing is committed.** No branch pushed, no PR opened.

### Open items needing a human

1. `README.md` has three marked TODOs that are not derivable from the repo: the GitHub Pages
   demo-site URL, the maintainers list, and the Satis endpoint URL.
2. **GitHub Pages must be switched** from "Deploy from a branch" to "GitHub Actions" in repo
   settings, or the rewritten `publish-demo-site.yml` fails on first run.
3. `core_version_requirement` left at `^9 || ^10` — narrowing it is a product decision.
4. Autoprefixer dropped 5 vendor prefixes because its caniuse data is ~3 years newer.
   Confirm the browser-support target is still right (see `verification.md`, Category 2).
5. Local Node is 22.9.0, below `eslint-visitor-keys@5.0.1`'s `^22.13.0` floor. `.nvmrc` says
   `22`, so CI is fine; this machine is under the floor.
6. `unique_id` → `clean_unique_id` rename deliberately deferred to its own PR.
7. Three dead library entries in `slac.libraries.yml` (pre-existing) tracked separately.

### Regenerating the upstream diff

`gesso-update-diff.diff` is gitignored — it is a 27k-line generated artifact. The phase files
cite it by line number. To recreate it:

```bash
bash ~/.claude/plugins/cache/f1-genai/gesso-upgrader/*/skills/plan-gesso-upgrade/scripts/get-gesso-diff.sh > gesso-update-diff.diff
```

Note that after this upgrade `package.json` reports version `5.4.2`, so the script will now
resolve the *next* release after 5.4.2. To reproduce the diff this plan was written against,
temporarily set `"version": "5.0.9"`, or fetch it directly:

```bash
curl -sf -H "Accept: application/vnd.github.v3.diff" \
  "https://api.github.com/repos/forumone/gesso/compare/5.0.9...5.4.2" > gesso-update-diff.diff
```

---

## Upstream drift audit (post-implementation)

Compared every file intended to match upstream against a fresh checkout of
`forumone/gesso` tag `5.4.2`. **25 of 36 are byte-identical.** The 11 that differ are each
accounted for below. Re-run this audit at the next upgrade:

```bash
curl -sfL https://codeload.github.com/forumone/gesso/tar.gz/refs/tags/<TAG> -o /tmp/g.tgz
mkdir -p /tmp/gesso-up && tar xzf /tmp/g.tgz -C /tmp/gesso-up
for f in .swcrc tsconfig.json postcss.config.js webpack.*.js eslint*.config.js .prettier* \
         .stylelintrc.yml .storybook/*.js .storybook/stubs/*.js lib/*; do
  u=/tmp/gesso-up/gesso-<TAG>/$f
  [ -f "$u" ] && { cmp -s "$f" "$u" && echo "same  $f" || echo "DIFF  $f"; }
done
```

| File | Δ lines | Why it differs |
| --- | --- | --- |
| `.swcrc` | 54 | Upstream's file has **trailing commas and is invalid JSON**. Ours is the same config, semantically identical when parsed, but valid. Strictly better. |
| `webpack.common.js` | 37 | jQuery retained in `externals`; explicit SVGO `removeViewBox: false`; `silenceDeprecations: ['if-function']` instead of the now-obsolete `['mixed-decls']`. |
| `webpack.theme-config.js` | 1 | Added `/* eslint no-console: "off" */`. Upstream's `readyToGoPlugin` logs to console and would fail our lint — they never lint this file (their `npm run eslint` is scoped to `source/`). |
| `eslint.config.js` | 91 | Build-output ignores (`dist/**`, `storybook/**`); the `*.jsx` → `**/*.jsx` glob fix (upstream's bare `*.jsx` only matches the repo root, so their React config never reaches `source/**`); SLAC-specific rule scoping. |
| `.stylelintrc.yml` | 1 | One extra rule this theme needs: `selector-max-compound-selectors: null`. (Correction to an earlier claim: `scss/percent-placeholder-pattern` is **not** SLAC-only — upstream has it too.) |
| `.storybook/main.js` | 30 | jQuery external; `if-function` silencing; ESM `import * as embeddedSass` rather than upstream's `require('sass-embedded')` (avoids a `no-require-imports` error); explanatory comment about the `import.meta` hazard. |
| `.storybook/preview.js` | 13 | `'Paragraphs'` in `storySort.order`; the `viewport`/`INITIAL_VIEWPORTS` parameter; both `uniqueId` and `cleanUniqueId` registered; upstream's `universal.es6`/`html.es6` imports omitted (those files are part of the excluded component set). |
| `.storybook/stubs/drupal.js` | 13 | `drupalSettings.gesso.gessoImagePath` — this theme's key — instead of upstream's `imagePath`, and none of upstream's `externalLink*` settings (that component is excluded). |
| `lib/transform.cjs` | 9 | Preserves a local `font-feature-settings` transformer that upstream has no equivalent for. Dropping it would break any `font-feature-settings` design token. |
| `lib/component.js` | 3 | Lint-forced: upstream's `let output = '';` trips `no-useless-assignment`, and its `/* eslint-env node */` is rejected by ESLint 10. Verified by reverting to upstream and re-linting. |
| `lib/types.d.ts` | 4 | Prettier-forced trailing commas in type-parameter lists. Notably upstream's file violates upstream's *own* `.prettierrc`, which is byte-identical to ours. |

Deliberately absent (documented exclusions): `.storybook/decorators.jsx`,
`webpack.react-config.js`, `source/@types/drupal/index.d.ts`.

### Drift removed by this audit

- **`.storybook/main.cjs` → `.storybook/main.js`.** The `.cjs` conversion was **not** necessary
  and was drift caused by an error in this plan. Phase 2's `import.meta.dirname` shim is
  correct for the webpack configs (loaded natively by webpack-cli) but wrong for
  `.storybook/main.js`, which Storybook loads through `esbuild-register`. esbuild injects a
  `require()`-based polyfill whenever it sees `import.meta`, and under `"type": "module"` Node
  evaluates the result as ESM where `require` is undefined. Upstream never hits this because it
  uses a **bare `__dirname`** and no `import.meta` at all. Verified: upstream's module style
  builds Storybook here successfully (228 entries). Now matches upstream's approach.
- **`lib/stylelintLVHFA.js` reverted to upstream exactly.** This plan's Phase 3 file specified
  "target content" containing three changes upstream does not have — a `possible: [true, false]`
  validation option, an extra `|| !primaryOption` guard, and `selectorOrder.length > 1` where
  upstream has `> 0`. The last of those makes the LVHFA rule **looser** than upstream. All
  three were transcription errors in the plan, not real upstream changes. Reverting to
  upstream leaves stylelint at 0 problems.

**Lesson for the next upgrade:** verify plan-file "target content" against the upstream tree,
not just against diff hunks. Two of the three real drift items found here originated in the
plan rather than in the implementation.
