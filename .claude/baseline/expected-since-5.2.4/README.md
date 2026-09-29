# Pins: expected since Gesso 5.2.4 (non-hop commit after hop 11)

## js/search.es6.js

- **Cause.** Upstream 5.2.4's `webpack.common.js` builds its entry list with glob 10's `Glob.iterate()`. glob 8's `sync()` returned sorted paths; glob 10 yields filesystem-enumeration order, and webpack assigns module IDs in entry order. Taken verbatim, as W6-D9 decided (`57e1f95c`); no local sort. W6-D9 saw the same effect in `sprite.js` and `topic-grid.es6.js`; in SLAC's tree it lands in `search.es6.js`.
- **Proof it is inert.**
  - Same length (9465 bytes) and the same character multiset.
  - With string literals masked, the token streams align and the only difference is two module IDs swapped (`908` ↔ `8915`), a consistent bijection; all string literals are identical.
  - Every other `dist/js` file, including `common.js`, is byte-identical, so the references resolve the same way. `behaviors.cjs` 29/29.
  - Reproducible locally: 3 production builds gave the same bytes. Across machines the order is filesystem-dependent; CI builds on Linux, which is why the pin records content, not a filename.
