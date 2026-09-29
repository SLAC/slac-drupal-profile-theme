# Pins: expected since Gesso 5.2.7 (hop 14)

## js/back-to-top.es6.js

- **Cause.** Upstream 5.2.7's dependency wave, installed at upstream's tested resolutions: `@babel/core` 7.23.7, `@babel/preset-env` 7.23.8, `webpack` 5.89.0, `terser` 5.27.0 (via `terser-webpack-plugin` 5.3.10), `browserslist` 4.22.2 / `caniuse-lite` 1.0.30001579. With the newer usage data the theme's browserslist now includes targets (e.g. Edge 87) for which `@babel/preset-env` transpiles optional chaining, so `back-to-top.es6.js` goes from
  `const r=e?.gesso?.backToTopThreshold??750,n=e?.gesso?.backToTopSmoothScroll??!0`
  to
  `var r,n;const o=(null==e||null==(r=e.gesso)?void 0:r.backToTopThreshold)??750,i=(null==e||null==(n=e.gesso)?void 0:n.backToTopSmoothScroll)??!0`.
  The rest of the file differs only in minifier identifier allocation (`d` → `l` in webpack's runtime, `r,n,o,i` → `o,i,s,u` in the behaviour).
- **Proof it is inert.**
  - `astequiv.cjs --names` (structure, ignoring identifier names): the only structural difference is that one statement (the added `var r,n;` for the two temporaries) and the rewritten optional chains.
  - The rewrite is Babel's exact desugaring of `a?.b?.c`. Old and new expressions were evaluated on 14 inputs (`undefined`, `null`, `{}`, `{gesso:null|undefined|{}|0|''}`, thresholds `0`/`null`/`300`/`'x'`, `0`, `''`): identical results for both settings.
  - `behaviors.cjs`: 29/29 entries register identical behaviours. Every other `dist/js` file and all of `dist/css` are byte-identical.
