# Pins: expected since Gesso 5.2.0 (hop 7)

## js/sprite.js

- **Cause.** webpack 5.76.3 → **5.82.0** (upstream 5.2.0's `^5.82.0`, pinned to upstream's tested resolution). webpack 5.82 rewrote the `AutoPublicPathRuntimeModule` fallback: when `document.currentScript` is unavailable it now walks the `<script>` list backwards until it finds one with a `src` (`if(i.length)for(var s=i.length-1;s>-1&&!t;)t=i[s--].src`), instead of taking the last script's `src` (`i.length&&(t=i[i.length-1].src)`).
- **Proof it is inert.**
  - Cutting that one runtime function out of both files, the remainder is **byte-identical** (10075 bytes each): same module table, same module IDs, same 238 string literals.
  - `sprite.js` exists only so webpack emits `dist/images/sprite.artifact.svg`; no library in `slac.libraries.yml` and no template loads it. The sprite artifact is byte-identical to the baseline.
  - Every other `dist/js` file is byte-identical to the baseline under webpack 5.82.0; `behaviors.cjs` 29/29.
- **Security note.** This runtime is the webpack code covered by GHSA-4vvj-4cpr-p986 (DOM clobbering, webpack `<5.94.0`). It is present in the baseline too, and only in this never-loaded file. See `hop-07-5.2.0.md` and review flag F-08.
