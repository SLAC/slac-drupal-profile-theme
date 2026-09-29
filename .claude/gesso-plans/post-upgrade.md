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
