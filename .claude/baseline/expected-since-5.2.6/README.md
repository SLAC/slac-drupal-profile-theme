# Pins: expected since Gesso 5.2.6 (hop 13)

## css/styles.css, css/editor-styles.css

- **Cause.** Upstream 5.2.6 rewrites `lib/stylelintLVHFA.js`, which adds `:focus-visible` and `:focus-within` to the enforced pseudo-class order. `_button-group.scss`'s `&:focus-within, &:hover` became a violation and failed `npm run build`. Fixed with **upstream's own same-release edit** (our file was byte-identical to upstream's): `&:hover, &:focus-within`. Same forced edit and pin as W6-D9 (`549101f0`).
- **The change.** One selector list, reordered, in each file:
  `.c-button-group__item:focus-within,.c-button-group__item:hover{z-index:2}` → `.c-button-group__item:hover,.c-button-group__item:focus-within{z-index:2}`.
- **Proof it is inert.** The order of selectors in a list affects neither the cascade, specificity nor matching (`a,b{x}` is `b,a{x}`). File sizes unchanged (145038 / 146681 bytes); nothing else differs from the 5.2.5 pins.
- The second forced edit of this hop (`_site-name.scss`, one block split in two so the rule's sibling-rule check passes) compiles to byte-identical CSS.
