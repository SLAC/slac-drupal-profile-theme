# Baseline provenance
- commit: e385018 (Bump lodash out of its advisory range)
- gesso version: 5.0.9
- node: v22.23.2 / npm: 10.9.8
- captured: 2026-09-29 14:11 EDT

Storybook reference build (not committed): /Users/btschu/.cache/gesso-slac/storybook-reference

Pins: put post-change copies in expected-since-<version>/{css,js}/ with a
README.md explaining the cause and the proof it is inert; list artifacts
deliberately no longer produced in expected-since-<version>/no-longer-emitted.txt.

## Pass bars at the baseline (hop 0, Gesso 5.0.9)

- build: exit 0, **246 warnings** (theme-config run 0 + production run 246; Sass deprecations from our own source).
- lint: eslint (fallback scope, no scripts until 5.1.2) **42 files, 0 errors, 0 warnings**; stylelint **0 problems**.
- build-storybook: exit 0 (Storybook 6.5.16, no `index.json`); source inventory **233 rows** (228 at `main`, -1 Video Hero in D1, +6 in D8).
- sprite: 19957 bytes, **37 symbols**, 37 with viewBox, ids == source files, 29 referenced fragments resolve.
- libcheck: 29 libraries (19 with dist/js), all declared dist paths present; 3 known common-chunk findings (`addtocal_a11y`, `back_to_top`, `dropbutton`; fixed post-upgrade).
- artifacts: 36 `css/`, 32 `js/` (incl. LICENSE files), `_design-tokens.artifact.scss`, `_GESSO.es6.js`, `extra/design-tokens.js`, `extra/sprite.artifact.svg`.
- stories re-recorded @ 248c2df: index.json 233 entries; inventory 233 rows
- libcheck re-recorded @ 9152c4d
