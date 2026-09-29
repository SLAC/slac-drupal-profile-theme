# Pins: expected since Gesso 5.3.2

## Stage 1 (lint/format toolchain): css/addtocal.css, css/dropbutton.css, css/styles.css, css/editor-styles.css

- **Cause.** stylelint 16 + `stylelint-order` 6 + prettier 3 (upstream 5.3.2's tested versions). `npm run stylelint -- --fix` applied two kinds of forced edit to our SCSS that reach the output:
  1. `order/order` moves plain declarations ahead of `@if` blocks in `00-config/mixins/_button.scss` (`color: $color-text-hover` before the `@if $border-width` block, and the same in the disabled state), which reorders declarations in every button-derived rule. Same edit W6-D9 took (not disabled).
  2. `shorthand-property-no-redundant-values` collapses two shorthands: `hr` `margin: rem(gesso-spacing(4)) 0 rem(gesso-spacing(4))` → `margin: rem(gesso-spacing(4)) 0`, and `_card.scss` `inset: auto 0 0 0` → `inset: auto 0 0`.
  The other `--fix` edits are Prettier 3 whitespace in the source only.
- **Proof it is inert.** `gesso-harness/cssequiv.cjs` (per rule: identical declaration multiset with 1–4-value box shorthands normalised, identical rule sequence, and preserved relative order among declarations that set overlapping longhands):
  - `addtocal.css`: 19 rules, 3 reordered, EQUIVALENT
  - `dropbutton.css`: 22 rules, 1 reordered, EQUIVALENT
  - `styles.css`, `editor-styles.css`: 1125 rules each, 3 reordered, EQUIVALENT (7 bytes smaller: the two collapsed shorthands)
  - negative control: swapping `margin` and `margin-top` in one rule is reported; `border` vs `border-radius` is correctly not a family.
- `styles.css` / `editor-styles.css` supersede the `expected-since-5.2.6` copies (which already carried the button-group reorder and the 5.2.5 prefix drops).

## Stage 2 (ESM, `"type": "module"`): 27 files in js/, and design-tokens.js

- **Cause.** With `"type": "module"` webpack treats our `*.es6.js` as real ES modules instead of `javascript/auto` with CommonJS interop, so the `__webpack_require__.n()` wrappers disappear (37 calls → 0), module IDs are rehashed, and entries whose code had no module wrapper gain the `!function(){"use strict";…}()` envelope ESM requires. The loader path `lib/configLoader.js` → `.cjs` is part of the design-token module's identifier, so `dist/design-tokens.js`'s single module ID changes (191 → 350); its payload is byte-identical. Same mechanism and outcome as W6-D9's stage 2 (`3e5ae942`).
- **Proof it is inert.**
  - `behaviors.cjs`, stage-1 build vs stage 2: **29/29 entries register identical `Drupal.behaviors`**, no errors.
  - The six entries that register no behaviour, one by one: `MegaMenu.es6.js`, `SearchFlyout.es6.js`, `YurtsHelpers.es6.js` (28-byte helper stubs) AST-equivalent; `alert-bar.es6.js` identical code inside the new `"use strict"` IIFE (+28 bytes; no sloppy-mode construct in it); `addtocal-a11y.es6.js` drops `t.n(jQuery)()` for `jQuery` directly (for a non-`__esModule` module `.n()` returns the module itself, so the same object is used) and renames identifiers; `sprite.js` carries the same 37 sprite fragment URLs, and **`dist/images/sprite.artifact.svg` is byte-identical** to the baseline (W6-D9's sprite broke at exactly this step; here `sprite.js` became upstream's `sprite.cjs` in the same stage).
  - Total `dist/js` size 281,068 → 277,909 bytes (−1.1%). `dist/css` and the two source token artifacts identical.
