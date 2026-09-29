# Pins: expected since Gesso 5.2.5 (hop 12)

## css/styles.css, css/editor-styles.css

- **Cause.** Upstream 5.2.5 raises Babel to `^7.23.2`; `@babel/helper-compilation-targets` 7.22.15 requires `browserslist ^4.21.9`, and browserslist 4.22.1 requires `caniuse-lite ^1.0.30001541`. Both are pinned to upstream 5.2.5's tested resolutions (browserslist 4.22.1, caniuse-lite 1.0.30001551; were 4.21.5 / 1.0.30001469). With the newer data autoprefixer stops emitting two prefixed declarations, identically in both files:
  - `.c-cta-link+.c-cta-link`: `-webkit-margin-start:1.5rem` dropped (`margin-inline-start:1.5rem` stays);
  - `.c-form-item--select-filters .c-form-item__select`: `-webkit-padding-end:48px` dropped (`padding-inline-end:48px` stays).
  Nothing else changes (53 bytes smaller each).
- **Proof it is inert for every supported browser.** The theme's browserslist (`last 2 versions and not dead`, `>= 1%`, `>= 1% in US`) resolves to 31 browsers with either dataset. Under the new data **none of the 31 needs a prefix** for `css-logical-props`. Of the 23 browsers that aged out of the window, the only one that ever needed the prefix was **UC Browser for Android 13.4** (`a x`, partial and prefixed); its successor in the window, UC 15.5, supports the unprefixed properties. Every other dropped browser already had full unprefixed support.
- **Residual effect.** A visitor still on UC Browser for Android 13.4 (2020) would lose the 1.5rem gap between adjacent CTA links and the 48px right padding of the filter selects. That browser is outside the theme's declared support, and any rebuild with current caniuse data drops the same prefixes. Review flag F-10.
