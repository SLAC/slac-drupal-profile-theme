# Pins: expected since Gesso 5.0.10 (hop 1)

## js/sprite.js

- **Cause.** Upstream 5.0.10's `webpack.common.js` adds `context: __dirname` and `resolve.extensions`. Those are inputs to webpack's module-ID hash, so every internal module ID in the sprite entry is renumbered (e.g. `alert-announcement-usage` 9020 → 6236). W6-D9 saw the same at its hop 1 (`9c43deee`).
- **Proof it is inert.**
  - Masking the string literals, the two files tokenise identically except for numbers, and the numeric renames form a **consistent bijection**: 37 distinct IDs remapped (one per sprite symbol), 111 occurrences, no ID mapping to two values in either direction.
  - The multiset of all 238 string literals (symbol `id`, `viewBox`, `url`) is identical.
  - 10427 → 10421 bytes (shorter IDs).
  - Nothing outside the bundle references these IDs; `sprite.js` is not declared in `slac.libraries.yml`. `behaviors.cjs`: 29/29 entries identical.
  - The sprite artifact itself (`dist/images/sprite.artifact.svg`) is byte-identical to the baseline.
