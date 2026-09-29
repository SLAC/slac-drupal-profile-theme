# Post-upgrade series

After hop 23 (Gesso 5.4.6, `cb90684`). One evidenced commit per item from STATE's list; W6-D9's equivalents are `7cf12e4a..12de09d0` and `73f02b22`.

## 1. `slac/common` on the libraries that wait on the common chunk

W6-D9 `252b003d`. `addtocal_a11y`, `back_to_top` and `dropbutton` load `dist/js` entries that need the webpack runtime chunk `dist/js/common.js` but did not declare `slac/common`; they worked only because `slac/global` (attached site-wide) depends on it. `alert_bar` gets it too, for uniformity (its entry does not need it today). Each now lists `slac/common` first, like the other 15 libraries.
- `libcheck`: "every chunk-dependent library declares it OK" (was 3 flagged); baseline re-recorded with `record-libcheck`.
- Sub-themed sites (trap S7): `slac/common` is defined only for the active theme, but 15 libraries already depend on it, so this adds no new behaviour there. The static `common:` library (upstream 5.4.6) is the real fix, recorded as a follow-up.
- Not exercised in Drupal (no site here); on every page the dependency is already satisfied through `slac/global`.
