# Pins: expected since Gesso 5.4.5

## Stage 4 (CSS toolchain and the rest): 3 files in js/

- **Cause.** Upstream 5.4.5's tested webpack **5.107.2** (from 5.104.1) and terser **5.48.0** (`overrides.terser`, from 5.44.1). `dist/css` is byte-identical (sass-embedded 1.100.0, sass-loader 17, stylelint 17 and our SCSS module migration all neutral), as are the token artifacts and every other JS file.
- **Proof it is inert.**
  - `behaviors.cjs`: **28/28 entries identical**; `syntaxscan.cjs` against the hop-0 baseline: the same 55 syntax features.
  - **`mega-menu.es6.js`, `search.es6.js`**: same size and the same character multiset; `modtable.cjs` EQUIVALENT. webpack emits the module table in a different order; nothing else moved.
  - **`common.js`** (118,970 → 119,025 bytes), compared module by module (same five module IDs):
    - `6345` (hamburger button), `8846` (mobile menu): byte-identical.
    - `6575` (the scroll-lock library): identical once identifier names are masked.
    - `5880` (GSAP): besides terser's parentheses, one token: the last remaining `Infinity` is printed as `1/0`, as terser already does for every other occurrence in the file (`Infinity` is not shadowed there).
    - `9807` (the `_GESSO` breakpoints and z-index maps): webpack 5.107 makes the two exports runtime-conditional again: `LO` (breakpoints) is populated only in runtimes `1746|2202|311|7386|7753`, `Mu` (z-index) only in `1746`, and `null` elsewhere. Every read of them is inside those sets: `Mu` by `dropdown-menu.es6.js` (`r.j` 1746); `LO` by `header.es6.js` (7386), `social-share.es6.js` (2202), `transitions.es6.js` (311), and through the shared mobile-menu module used by `dropdown-menu` (1746) and `mega-menu` (7753). No other bundle imports module 9807.
    - Code outside the module table: identical.
