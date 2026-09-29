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
