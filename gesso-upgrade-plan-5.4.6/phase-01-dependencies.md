# Phase 1 — `package.json` dependency and script updates

Goal: bring `package.json` in line with upstream Gesso 5.4.6's dependency set. This is a pure
manifest change — no source files are touched in this phase, so it cannot affect rendered
output. The **only** functional consequence is which package versions `npm install` resolves,
which feeds into Phases 2–4 below.

## 1.1 Version bump

- [x] `"version": "5.4.2"` → `"version": "5.4.6"`.

## 1.2 `test` script

- [x] `"test": "echo \"Error: no test specified\" && exit 1"` →
      `"test": "npm run eslint && npm run stylelint"`.
      This matches upstream exactly and both `npm run eslint` / `npm run stylelint` already
      exist as scripts in this theme's `package.json` — no other script needs to change.
      (Upstream's own `"build"` script also runs `webpack.react-config.js`; this theme's
      `"build"` script already omits that, per the prior plan, because `source/07-react/`
      doesn't exist here. Leave `"build"` untouched.)

## 1.3 `devDependencies` — replace the block

Replace the current `devDependencies` object with:

```json
"devDependencies": {
  "@forumone/eslint-config-es5": "^4.0.0",
  "@forumone/eslint-config-react": "^3.0.7",
  "@forumone/tiny-mustache": "^3.0.5",
  "@forumone/twig-drupal-filters": "^4.0.0",
  "@forumone/twig-loader": "^2.0.0",
  "@inquirer/prompts": "^8.5.2",
  "@pmmmwh/react-refresh-webpack-plugin": "^0.6.2",
  "@storybook/addon-a11y": "^10.5.0",
  "@storybook/addon-docs": "^10.5.0",
  "@storybook/addon-links": "^10.5.0",
  "@storybook/addon-webpack5-compiler-swc": "^3.0.0",
  "@storybook/react-webpack5": "^10.5.0",
  "@swc/cli": "^0.8.1",
  "@swc/core": "^1.15.43",
  "@types/react": "^19.2.17",
  "@types/react-dom": "^19.2.3",
  "@typescript-eslint/eslint-plugin": "^8.26.1",
  "@typescript-eslint/parser": "^8.26.1",
  "autoprefixer": "^10.5.2",
  "chalk": "^5.6.2",
  "change-case": "^5.4.4",
  "concurrently": "^10.0.3",
  "core-js": "^3.49.0",
  "css-loader": "^7.1.4",
  "eslint": "^9.39.5",
  "eslint-plugin-storybook": "^10.5.0",
  "eslint-webpack-plugin": "^6.0.0",
  "file-loader": "^6.2.0",
  "fork-ts-checker-webpack-plugin": "^9.1.0",
  "glob": "^13.0.6",
  "js-yaml-loader": "^1.2.2",
  "nani": "^3.2.3",
  "path-browserify": "^1.0.1",
  "postcss": "^8.5.19",
  "postcss-loader": "^8.2.1",
  "postcss-selector-parser": "^7.1.4",
  "prettier": "^3.9.5",
  "react-refresh": "^0.18.0",
  "sass-loader": "^17.0.0",
  "style-loader": "^4.0.0",
  "stylelint": "^17.14.0",
  "stylelint-config-sass-guidelines": "^13.0.0",
  "stylelint-order": "^8.1.1",
  "stylelint-prettier": "^5.0.3",
  "stylelint-webpack-plugin": "^5.1.0",
  "svg-spritemap-webpack-plugin": "^5.1.4",
  "svgo": "^4.0.2",
  "swc-loader": "^0.2.7",
  "ts-loader": "^9.6.2",
  "twig": "^3.0.0",
  "typescript": "^6.0.3",
  "webpack": "^5.108.4",
  "webpack-cli": "^7.2.1",
  "webpack-merge": "^6.0.1"
}
```

Net effect vs. the current 5.4.2 block:

- **Removed**: `inquirer` (replaced by `@inquirer/prompts`, used by the new `lib/component.js` —
  Phase 4), `mkdirp` (no longer used — Phase 4 rewrites the one call site to use
  `node:fs/promises` directly), `svgo-loader` and the version-pinned `twig-loader` git tarball
  (both replaced below).
- **Added**: `@forumone/tiny-mustache`, `@inquirer/prompts`, `@forumone/twig-loader` (replaces
  the git-tarball `twig-loader` dependency — this also removes the last unpinned GitHub tarball
  dependency, called out as a goal in the 5.0.9→5.4.2 plan's follow-up notes), `change-case`,
  `path-browserify`, `svg-spritemap-webpack-plugin`, `svgo`, `eslint-plugin-storybook`.
- **Moved**: `twig` moves from `dependencies` to `devDependencies` (see 1.4) and jumps
  `^1.17.1` → `^3.0.0` — a major version bump. It is only used by `lib/component.js` and
  Storybook's Twig loader chain; Twig.js 3's API is what `@forumone/twig-loader` ^2 and the
  Storybook `.twig` loader rule expect, so this has to move together with the loader bump.
- **Version-only bumps** (no behavior change expected, just newer releases): everything else in
  the list above — most notably Storybook-related packages jump from the 8.x line to 10.5.0
  (see Phase 3), and `eslint`/`stylelint`/`webpack`/`typescript` all take minor-to-major bumps
  within their existing major-version lines except where noted.

## 1.4 `dependencies` — replace the block

Replace the current `dependencies` object with:

```json
"dependencies": {
  "@drupal/once": "^1.0.1",
  "html-react-parser": "^6.1.4",
  "mini-css-extract-plugin": "^2.10.2",
  "react": "^19.2.7",
  "react-dom": "^19.2.7",
  "remove-files-webpack-plugin": "^1.5.0",
  "sass-embedded": "^1.100.0",
  "storybook": "^10.5.0",
  "terser-webpack-plugin": "^5.6.1",
  "yaml": "^2.9.0"
}
```

Net effect: `svg-sprite-loader`, `svg-transform-loader`, and `twig` are removed from this block
(the first two are replaced in `devDependencies` per 1.3's SVG note below; `twig` moved to
`devDependencies`, see 1.3). Everything else is a version bump only.

**Deviation — do not remove:** `jquery` is not present in upstream's dependency list at all
(upstream dropped jQuery entirely, long before this diff). This theme still needs it —
`source/03-components/dropbutton/dropbutton.es6.js` and
`source/03-components/addtocal/addtocal-a11y.es6.js` both `import jQuery from 'jquery'`. Keep
the existing `"jquery": "^3.6.0"` entry (and its matching `externals`/`libraries.yml` entries)
exactly as-is. It is easy to delete by accident while replacing the surrounding block — don't.

**Also not in the diff, so not touched:** `gsap`, `imagesloaded`, `isotope-layout`,
`isotope-packery`, `tiny-slider`, `lodash` — SLAC-only dependencies with no upstream equivalent.
Leave them exactly where they are in the `dependencies` block.

## 1.5 `overrides` — new field

- [x] Add a top-level `"overrides"` field (after `dependencies`, matching upstream's position):

  ```json
  "overrides": {
    "storybook": "$storybook"
  }
  ```

  This pins every package's own nested `storybook` peer/dependency to the root `storybook`
  version via npm's `$storybook` self-reference syntax — needed because Storybook 10 is stricter
  about a single deduplicated `storybook` package version across the whole addon graph than 8.x
  was. Without it, `npm install` can silently resolve two copies of `storybook` and Storybook
  fails at runtime with duplicate-instance errors.

## 1.6 Install

- [x] Delete `node_modules` and `package-lock.json`, then run `npm install` (not `npm ci` — the
      lockfile doesn't exist yet for the new dependency set). Commit the regenerated
      `package-lock.json`.
- [x] Confirm `npm ls` reports no unmet peer dependency errors. `.npmrc`'s
      `legacy-peer-deps=true` (not in the diff, kept as-is per the prior plan) should still cover
      any React 19 / Storybook 10 peer graph friction, but note any new warnings for the
      Phase 3 Storybook work to double-check.

**Phase 1 status: complete.** `npm install` ran clean (1030 packages, no peer-dependency
errors beyond pre-existing deprecation warnings); `npm ls storybook --all` confirmed the
`overrides` field dedupes every nested `storybook` copy to a single `10.5.10`.
`package-lock.json` was regenerated but not committed (commit left to the user per this
session's standing policy of not committing without an explicit request).

**Correction found during the Test phase (`npm run build` failing with `Cannot find module
'ajv/dist/compile/codegen'`):** this plan's 1.3 block replacement dropped a repo-specific
`"ajv": "^8.17.1"` devDependency entry that a *prior* upgrade round (commit `5f6f9c8`, "Fix npm
ci producing a broken tree that fails the build") had added specifically to pin `ajv@8` to the
top of the dependency-hoisting order, ahead of `ajv-keywords@5` (which requires `ajv ^8.8.2` via
`peerDependencies`, ignored under this repo's load-bearing `legacy-peer-deps=true`). Because
`ajv` isn't part of upstream's own diff at all, it wasn't in this plan's "replace the block"
snippet, and got silently reverted when the whole block was swapped in. **`ajv: ^8.17.1` has
been re-added to `devDependencies`** (alphabetically, after `@typescript-eslint/parser`) and
confirmed via `npm ls ajv` that `ajv@8.20.0` now hoists to the top level correctly. Do not
remove this entry in a future dependency-block replacement without re-verifying
`npm ci && npm run build` from a clean checkout first — see that commit's message for the full
mechanism.
