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
