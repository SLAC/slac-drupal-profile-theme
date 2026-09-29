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

## Stage 3 (Babel → SWC): 25 files in js/ re-pinned

- **Cause.** `babel-loader` → `swc-loader` with upstream's `.swcrc` (`env.mode: usage`, `corejs: 3`, `loose`). The loader is part of each module's identifier, so webpack's deterministic module IDs renumber in every file; and SWC and Babel lower slightly different syntax for the same targets.
- **`@swc/core` 1.11.20, not upstream's tested 1.4.11.** `@swc/core` below 1.11.20 ignores the `browserslist` key in `package.json` (bisected: 1.4.11 … 1.11.18 ignore it, 1.11.20 onward read it). With no targets SWC compiles to **ES5** in loose mode and injects core-js polyfills: measured with 1.4.11, `dist/js` grew 277,909 → 365,945 bytes, every arrow and `const` disappeared, `filter-modal.es6.js` 2.2K → 24.6K, and `alert_bar` began depending on the common chunk. Loose-mode ES5 lowering changes semantics for iterables (spread/for-of over NodeLists), so that output is not provably inert. Upstream itself shipped such builds from 5.3.2 until 5.4.3 (1.13.3). 1.11.20 is the lowest version that honours the targets. Flag F-15.
- **Proof it is inert (with 1.11.20).**
  - Total `dist/js` 277,909 → 277,699 bytes. 25 files differ; **18 are identical once digits are masked** (module IDs only).
  - The other 7 (`accordion`, `back-to-top`, `dropdown-menu`, `mega-menu`, `search`, `tabs`, `common`) differ in module IDs plus syntax SWC leaves native where Babel lowered it: arrow functions, default parameters, and in `back-to-top` optional chaining.
  - `gesso-harness/syntaxscan.cjs`: against the Babel build the only syntax feature new to the bundle set is optional chaining (`back-to-top.es6.js`); against the **hop-0 baseline** the SWC bundles use **exactly the same 55 syntax features**, so no browser has to support anything `main` did not already require. (Optional chaining in `back-to-top` is how the baseline shipped it before hop 14's Babel data lowered it.)
  - `behaviors.cjs`: 29/29 identical. `libcheck` unchanged. `dist/css` and all token artifacts identical.
