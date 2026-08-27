# Gesso 5.4.2 → 5.4.6 upgrade plan — `slac` theme

**Theme machine name:** `slac`
**Current Gesso base:** 5.4.2 (`package.json` → `"name": "gesso"`, `"version": "5.4.2"`)
**Target Gesso release:** 5.4.6 (the latest upstream release as of this plan)
**Diff source:** `gesso-update-diff.diff` at the repo root (6,570 lines, 179 changed files,
generated from `forumone/gesso` `5.4.2...5.4.6` via the GitHub compare API, `package-lock.json`
excluded)

This plan is the sequel to [`gesso-upgrade-plan/`](../gesso-upgrade-plan/), which took the
theme from 5.0.9 to 5.4.2 and is already merged. Read that plan's README first if you haven't
— it documents the theme's overall relationship to upstream (tooling merged, components/
templates/tokens deliberately diverged) and this plan follows the same rules.

## Hard constraint: zero rendered-output change

**The user has explicitly confirmed: this upgrade must not change any generated/rendered
output.** CSS, HTML markup, and JS-driven DOM behavior must come out byte-for-byte identical
to today. This is stricter than "no *visible* difference" — a change that only affects
whitespace-insignificant markup or cache metadata still counts as a change and must be
excluded unless it is provably a no-op. When in doubt, exclude and note it below rather than
apply it.

Everything in this plan was screened against that constraint. Phases 1–5 are dependency,
build-tooling, and dev-tooling changes with no runtime effect on Drupal- or Storybook-rendered
output. Phase 6 documents this in the README.

## READ THIS FIRST — changes in the diff that will NOT be implemented

### A. Not applicable — the file or the referenced code does not exist in this repo

| Diff path(s) | Why excluded |
| --- | --- |
| `gesso_helper/**` (14 files: composer.json, drush.services.yml, gesso_helper.info.yml, gesso_helper.module, gesso_helper.services.yml, `src/**`) | No `gesso_helper` directory here — same as the 5.0.9→5.4.2 plan. The equivalent is the separate **`slac_helper`** Drupal module. Two items are worth cross-repo triage (see "Cross-repo follow-ups" below): the new `ThemeSettings` service (D10.3–11.2 / D11.3+ compatibility shim for `theme_get_setting()`) and the reinstated `UniqueIdTwigExtension`. |
| `gesso.libraries.yml` (this diff's changes) | SLAC's `slac.libraries.yml` is **not derived from `gesso.libraries.yml`'s structure** — verified by inspection. None of the entries upstream restructures in this diff (`accordion`, `breadcrumb`, `dropbutton`, `external-link`→`external_link`, `modal`, `pager`, etc.) exist in `slac.libraries.yml` at all; SLAC defines its own independent library set keyed to its own component names. There is nothing in this diff's `gesso.libraries.yml` hunk to port. |
| `includes/libraries.inc` (this diff's `hook_library_info_build()` → `hook_library_info_alter()` rewrite) | `slac_library_info_build()` is an independent implementation (still builds a dynamic `common` library keyed off `dist/js/common.js`) that has never mirrored gesso's. Upstream's new `gesso_library_info_alter()` sets `preprocess: false` on every `dist/js/*` file theme-wide to stop Drupal's JS aggregator from re-processing already-Terser-minified Webpack output — a real, sensible fix, but it changes which URLs Drupal serves scripts from (aggregated vs. not) and is out of scope for a "no output change" version bump. Worth a **follow-up, separately reviewed change** once this upgrade lands — flagged, not applied. |
| `theme-settings.php` (this diff's hunk) | Depends entirely on `gesso_helper_get_theme_setting()`, which doesn't exist here. SLAC's `theme-settings.php` (function `slac_form_system_theme_settings_alter`) is independently maintained, already excludes upstream's "External Links" settings group (per the prior plan), and calls `theme_get_setting()` directly. Nothing to port. |
| `gesso.info.yml` → `core_version_requirement: '^10.3 || ^11'` | SLAC's `slac.info.yml` currently declares `^9 || ^10`. Narrowing it is a **product decision**, not a tooling one — the prior plan flagged the same line at 5.4.2 and deferred it. Still deferred; see "Decision points" below. |
| New/renamed upstream components colliding with SLAC's own: **`tabs`** (`source/03-components/tabs/*` — new `tabs.es6.ts`, `modules/_Tabs.es6.js`, `tabs.scss`, `tabs.stories.jsx`, `tabs.twig`, `tabs.yml`; new `templates/paragraph/paragraph--tabs.html.twig`, `paragraph--tab.html.twig`; new `tabs:` library) | SLAC already has its own `source/03-components/tabs/` (different files: `tabs.es6.js` not `.ts`, no `modules/` subfolder, different twig/markup) and its own `templates/paragraph/paragraph--tabs.html.twig`. This is upstream shipping a *brand-new* component under a name SLAC has independently implemented — same collision pattern as `accordion` in the prior plan. Applying it would overwrite SLAC's tabs markup/JS/CSS with a different implementation. |
| `templates/paragraph/paragraph--call-to-action.html.twig`, `paragraph--cards.html.twig`, `paragraph--hero.html.twig`, `media/media--full.html.twig` (modified in the diff) | These files **do not exist** in this repo's `templates/` tree. Per the "don't create modified-but-missing files" rule, skipped. |

### B. Applicable but excluded — would change rendered markup, CSS, or cache behavior

| Diff path(s) | Why excluded |
| --- | --- |
| ~90 `source/**/*.scss` / `.twig` files (global styles, layouts, and the ~30 components listed in the diff's file list under `source/03-components/`) | Physical→logical CSS property conversions (`height`→`block-size`, `width`→`inline-size`, `max-width`→`max-inline-size`, `float: left/right`→`float: inline-start/inline-end`, `top`→`inset-block-start`, RTL `@if $support-for-rtl` blocks removed in favor of logical properties, etc.) plus real component-authoring changes (new `--gesso-scrollbar-width` custom property replacing `--scrollbar-width`, `container-type: inline-size` on `html`, `c-button-group__item`→`c-button-group-item` rename, new default-button-styled-as-link rules in `_inline-elements.scss`/`_normalize.scss`, breadcrumb/nav components dropping their hidden `<h2>` title element in favor of `aria-label`, accordion `step_list`→`is_step_list` param rename, `icon-link` gaining an `icon_modifier_classes` param, etc.). Every one of these either changes computed CSS values or changes emitted markup on upstream's own component files. Logical properties render identically in LTR browsers, but per the hard constraint above, "renders the same in practice" isn't the bar — "byte-identical" is, and SLAC's components are separate diverged files from the ones upstream is editing, so there's nothing to losslessly re-apply here anyway. |
| `source/00-config/config.design-tokens.yml` (`back-to-top` → `background: grayscale.gray-4` instead of `gray-3`) | Changes a computed color value. |
| `source/00-config/_config.settings.scss` (`$container-queries-rems: true !default;`), `source/00-config/functions/_iff.scss`, `source/00-config/mixins/_grids.scss` (`if($cond, $a, $b)` → `if(sass($cond): $a; else: $b)`) | The `iff()`/`if()` Sass-syntax migration is tied to a **newer minimum Dart Sass** than this theme currently pins (see `webpack.common.js`'s existing `silenceDeprecations: ['if-function']` comment, added in the 5.4.2 upgrade specifically to *avoid* this migration for now). Mixing the old and new `if()` forms in the same build is fine, but proactively rewriting `_iff.scss` isn't needed to consume 5.4.6 and risks the exact deprecation warning that comment was written to dodge. Deferred. |
| `source/01-global/00-colors/color.scss` (deletes the box-shadow/duration/easing Storybook demo styles — moved to their own files) | This is a refactor of upstream's own Storybook color-palette demo page. SLAC's `source/01-global/00-colors/` (if it exists at all in this diverged form) was not verified to match upstream 1:1; treated as component-authoring churn, same bucket as the rest of Category B. |
| `source/02-layouts/nav/nav.twig` / `nav.yml`, `source/03-components/breadcrumb/*`, `templates/block/block--system-menu-block.html.twig`, `templates/navigation/breadcrumb.html.twig` (drop `title`/`hide_title`/`nav_id` params for a single `label` param + `aria-label`) | Real markup change (removes a rendered, visually-hidden `<h2>` heading in nav/breadcrumb regions) on files that, per the prior plan, may or may not be the ones SLAC actually uses unmodified — not verified, and moot either way under the hard constraint. |
| `templates/paragraph/paragraph--accordion.html.twig`, `paragraph--accordion-item.html.twig`, `paragraph--card.html.twig`, `paragraph--wysiwyg.html.twig`, `content/node--*.html.twig`, `content/taxonomy-term--full.html.twig`, `media/media.html.twig`, `user/user--full.html.twig`, `layout/layout--onecol.html.twig`, `layout/layout--sidebar.html.twig`, `paragraph/paragraph.html.twig` (`{% set catch_cache = content|render %}` / `content|without(...)|render` → `{{ content|cache_metadata }}`, and `false`→`null` for unset Twig variables) | Where this is inside an **already-commented-out** line (most of the `content/*`, `media/*`, `user/*` full-view templates), it's a no-op comment edit and would be safe — but it's paired 1:1 with the `field_*` param renames on the same lines in the accordion/card templates (e.g. `field_accordion_heading`→`field_title`, `field_accordion_body`→`field_wysiwyg`, `field_accordion_items`→`field_paragraphs`), which are **upstream's own field-machine-name changes**, not applicable to SLAC's content model. Since the safe (comment-only) and unsafe (field-rename) edits are interleaved file-by-file, and `content|render` vs `content|cache_metadata` do differ in cache-metadata bubbling behavior on the *active* lines (`layout--onecol.html.twig`, `layout--sidebar.html.twig`), the whole group is excluded rather than picked apart. `false`→`null` for Twig variables is behaviorally identical in Twig's truthiness rules and could be cherry-picked later if desired, but isn't worth the diff-reading risk here. |
| `webpack.common.js` sass-loader `silenceDeprecations: ['mixed-decls']` removal | SLAC's `webpack.common.js` and `.storybook/main.js` already carry their own documented deviation here (`silenceDeprecations: ['if-function']`, added during the 5.0.9→5.4.2 upgrade specifically because this theme still uses the classic `if()` syntax). Upstream's `mixed-decls` line is not present in SLAC's file to remove. No action — already diverged correctly. |

### C. Deliberate deviations from upstream (upstream changes it; we keep our version)

| Item | Reason |
| --- | --- |
| `.nvmrc` staying at `24` | Upstream bumps `20`→`22`. SLAC is already on `24` (bumped independently, unrelated to this diff). Newer satisfies newer; no change needed. |
| `jquery` in `package.json` dependencies, `webpack.common.js`/`​.storybook/main.js` externals, `core/jquery` in `slac.libraries.yml` | Same deviation the 5.0.9→5.4.2 plan recorded: `dropbutton.es6.js` and `addtocal-a11y.es6.js` still `import jQuery from 'jquery'`. Nothing in this diff touches jQuery removal, but calling it out again since it's easy to "helpfully" clean up while touching `package.json`. |
| `svgo-loader`'s explicit `removeViewBox: false` override | Ported forward into the new `svg-spritemap-webpack-plugin` config in Phase 2 rather than dropped — see that phase for why. |

## Cross-repo follow-ups (for `slac_helper`, tracked separately — not part of this PR)

Two `gesso_helper` additions in this diff are worth a look in `slac_helper`'s own repo, the same
way the prior plan's `cross-repo-slac-helper.md` triaged the 5.0.9→5.4.2 gap:

1. **`ThemeSettings` service** (`gesso_helper/src/ThemeSettings.php`, new): a small wrapper that
   calls Drupal 11.3+'s `ThemeSettingsProvider` when available and falls back to
   `theme_get_setting()` on 10.3–11.2, with the fallback call deliberately routed through a
   `@phpstan-ignore function.deprecated` comment. SLAC's `theme-settings.php` and `includes/*.inc`
   call `theme_get_setting()` directly today. This only matters once `theme_get_setting()` is
   actually removed from a Drupal core version SLAC supports — worth tracking, not urgent.
2. **`unique_id.twig_extension` reinstated** — see the next section. If `slac_helper` still
   registers its own `unique_id` Twig filter (it should, since SLAC never did the
   `clean_unique_id` rename), there is nothing to do here. Confirm and close the loop.

## The `unique_id` / `clean_unique_id` story has resolved itself — read this before touching Twig

The 5.0.9→5.4.2 plan (see `gesso-upgrade-plan/phase-04-lib-and-twig-extensions.md` and this
repo's `README.md` §"Twig filters and functions") found that upstream Gesso had renamed its
`unique_id` Twig filter to `clean_unique_id` (backed by Drupal core's own filter of that name)
and **deliberately deferred** doing the same rename in this theme, because it would require a
matching change in the separate `slac_helper` module and a rewrite of 28 Twig call sites at the
same time. The theme kept `lib/uniqueId.js` as the live implementation and added
`lib/cleanUniqueId.js` alongside it, registering both filters in `.storybook/preview.js`, so
Storybook would be ready whenever that rename eventually happened.

**This diff shows upstream reversing that decision.** `lib/cleanUniqueId.js` is renamed back to
`lib/uniqueId.js` (`git`'s renamed-file detection, 73% similar — same body, `clean_unique_id`
filter renamed back to `unique_id`), `.storybook/preview.js` drops the `cleanUniqueId` import and
call, and `gesso_helper` gets a *new* `UniqueIdTwigExtension.php` + `unique_id.twig_extension`
service registering `unique_id` in PHP again (implemented differently than before —
`Html::getId($id) . '--' . Crypt::randomBytesBase64(8)` instead of the old Date.now()-based
approach — but same filter name). Every `|clean_unique_id` call site in upstream's own
components/templates in this diff (`nav.twig` removed it entirely, `overlay-menu.twig`,
`pager--mini.twig`, `side-menu.twig`, `form.html.twig`, `html.html.twig`,
`block--system-menu-block.html.twig`) is switched back to `|unique_id`.

**Consequence for this repo:** the future rename this theme was bridging toward is no longer
upstream's direction. `lib/uniqueId.js` needs zero changes — its content is already byte-identical
to what upstream's renamed `lib/uniqueId.js` will be (verified by diff). `lib/cleanUniqueId.js` and
the "register both filters" scaffolding in `.storybook/preview.js` are now dead-end prep for a
rename that isn't coming. See Phase 4.

## Phases

Execute in order; each phase file lists concrete to-do items with file paths and exact diffs
to apply or skip.

1. [`phase-01-dependencies.md`](phase-01-dependencies.md) — `package.json` version bumps, adds,
   and removals; the `test` script change; `npm install`.
2. [`phase-02-build-tooling.md`](phase-02-build-tooling.md) — `webpack.common.js` /
   `webpack.production.js` (SVG sprite loader migration, `splitChunks` relocation),
   `eslint.config.js`.
3. [`phase-03-storybook-10.md`](phase-03-storybook-10.md) — `.storybook/main.js`, `manager.js`,
   `preview.js`, `theme.js`. Storybook 8→10 is a two-major-version jump; read the risk notes
   before touching `main.js`.
4. [`phase-04-lib-and-component-generator.md`](phase-04-lib-and-component-generator.md) —
   `lib/component.js` rewrite (interactive + non-interactive CLI), new `lib/templates/*.hbs`,
   retiring `lib/cleanUniqueId.js`.
5. [`phase-05-php-hygiene.md`](phase-05-php-hygiene.md) — `includes/media.inc` (`FilteredMarkup`
   → `Markup`), the `_add_regions_to_template()` → `_slac_add_regions_to_template()` rename.
6. [`phase-06-readme.md`](phase-06-readme.md) — update this theme's `README.md`: version
   pointer, component-generator docs, DDEV/Storybook allowed-hosts note, `unique_id` section
   rewrite, maintainers credit line.

## Status: implemented and verified

All six phases above are implemented and marked complete in their own files. The full gate
below (clean `npm install`, `eslint`, `stylelint`, `npm run build`, `npm run build-storybook`)
passes with zero errors and zero warnings.

**Testing surfaced several corrections to this plan that weren't visible from reading the diff
alone** — each is documented inline in its phase file, but the short version:

- **Phase 1:** a repo-specific `ajv: ^8.17.1` devDependency pin (added by a *prior* upgrade
  round to fix an `ajv`-hoisting/webpack build failure, unrelated to upstream's own diff) was
  silently dropped by this plan's "replace the whole `devDependencies` block" instruction and
  had to be restored.
- **Phase 2:** this plan's originally-specified SVGO `removeViewBox: false` override doesn't
  apply under SVGO 4 (the plugin was removed from `preset-default` entirely, not just changed —
  passing the override at all now produces a warning). Plain `svgo: true` is correct and was
  verified to still preserve `viewBox` on every sprite symbol. Two required file changes were
  also missing from the original checklist: deleting the now-dead
  `source/images/_sprite-source-files/sprite.cjs` shim (upstream deletes it too, for the same
  reason — it exists only to force the *old* SVG loader pipeline to run), and scoping
  `StylelintPlugin` to `files: 'source'` (its unscoped default swept up unrelated, gitignored
  build-artifact snapshots left in this checkout by a previous upgrade's manual verification,
  crashing the lint formatter).
- **Phase 3:** the original guidance to avoid `import.meta` in `.storybook/main.js` was based on
  a Storybook 8-era comment and turned out to be backwards for Storybook 10, which no longer
  auto-supplies a bare `__dirname` at all. `import.meta.url`-based `__dirname` derivation is
  required and was verified safe — the risk that comment described doesn't reproduce under this
  Storybook version. Webpack's asset-size performance hints were also disabled for the Storybook
  build (advisory noise for a dev-only bundle, not a real regression).
- **Phase 4:** `lib/component.js`'s carried-over `/* eslint-env node */` comment triggers an
  ESLint 9.39 deprecation warning and was removed.

**A follow-up scope reduction, made at the user's direction after review, not part of the
original "Test" pass:** several `eslint.config.js` blocks that predated this upgrade (React JSX
rule overrides, a `.stories.jsx` carve-out, a `.storybook/stubs/**` carve-out, and a widened
require-imports glob/rule-name) were removed and one reverted to upstream's exact form. They
were originally verified as "safe to keep" against broad ad hoc `eslint` invocations, but the
*actual* gate — `npm run eslint`, i.e. `eslint source/**/!(*.stories).js` — only ever lints 42
files, all plain `.es6.js` under `source/`; it never reaches `.jsx`, `.tsx`, `lib/`, or
`.storybook/`. So those blocks were solving a problem the real gate never has. See Phase 2's
file for the full before/after and which one block (`prefer-destructuring`) was kept because
it's genuinely exercised by the real gate. Re-verified clean afterward: `eslint`, `stylelint`,
`build`, `build-storybook`.

None of these corrections changed any rendered Drupal or Storybook output — they're all build
tooling/config fixes, consistent with this plan's hard constraint.

## Verification

There is no Drupal site in this repo to render pages against. After each phase:

- `npm ci && npm run build` must succeed from a clean checkout.
- `npm run storybook` (or `npm run build-storybook`) must start/build without new console
  errors, and a visual spot-check of a handful of stories should show **no** difference from
  the pre-upgrade build (per the hard constraint above — if anything looks different, stop and
  investigate before continuing).
- `npm run eslint` / `npm run stylelint` should be clean (or show only pre-existing warnings).
- Diff `dist/css` and `dist/js` output before/after the full upgrade for a sample of files —
  they should be identical apart from incidental things like sourcemap hashes, if the tooling
  changes were genuinely output-neutral.
