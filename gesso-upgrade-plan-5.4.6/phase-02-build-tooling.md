# Phase 2 — webpack and ESLint config

Depends on Phase 1 (new packages must be installed first). These are all build-pipeline
changes: they affect *how* `dist/css`/`dist/js` get produced, not what ends up in them, so they
satisfy the "no rendered-output change" constraint as long as 2.1's SVGO options are carried
over correctly (see below).

## 2.1 `webpack.common.js` — SVG sprite loader migration

Upstream drops `svg-sprite-loader` + `svg-transform-loader` + `svgo-loader` (a Webpack-rule
pipeline) for the `svg-spritemap-webpack-plugin` (a standalone plugin that globs the source SVGs
directly, independent of the module rules). This is a real toolchain change, not a version
bump, so read carefully.

- [x] Remove the import:
      `import SpriteLoaderPlugin from 'svg-sprite-loader/plugin.js';`
- [x] Add the import:
      `import SvgSpritemapPlugin from 'svg-spritemap-webpack-plugin';`
- [x] In the `plugins` array, remove `new SpriteLoaderPlugin(),` and add, in its place:

  ```js
  new SvgSpritemapPlugin('source/images/_sprite-source-files/*.svg', {
    output: {
      filename: 'images/sprite.artifact.svg',
      svg4everybody: false,
      svgo: true,
    },
    sprite: {
      prefix: '',
      generate: {
        title: false,
        use: true,
      },
    },
  }),
  ```

  **Correction found during the Test phase — the "deviation" originally specified here was
  wrong, and has been reverted to plain `svgo: true`.** This plan originally called for an
  explicit `overrides: { removeViewBox: false }` object, reasoning that SVGO's `preset-default`
  still strips `viewBox` by default the way it did in the SVGO 2/3 line this theme's old
  `svgo-loader` config was written against. That's no longer true: **SVGO 4 removed
  `removeViewBox` from `preset-default` entirely** (verified by reading
  `node_modules/svgo/plugins/preset-default.js` — it's not in the plugin list at all; the
  standalone `removeViewBox` plugin still exists but is opt-in only). Passing the old override
  object at all — even correctly reproducing the old option shape — makes SVGO 4 print
  `You are trying to configure removeViewBox which is not part of preset-default` and refuse to
  apply it, which is harmless as a warning but fails the "zero warnings" bar. With bare
  `svgo: true`, a full `npm run build` was verified to still preserve `viewBox` on all 37 sprite
  symbols (`grep -o '<symbol[^>]*viewBox' dist/images/sprite.artifact.svg | wc -l` → 37, matching
  the symbol count). **Do not re-add the `overrides` block** — there is nothing to override
  under SVGO 4's preset-default for this concern.

- [x] Remove the whole webpack rule for
      `test: /images\/_sprite-source-files\/.*\.svg$/` (the `use: ['svg-sprite-loader',
      'svg-transform-loader', 'svgo-loader']` block) from `module.rules` — the new plugin
      handles these files directly, outside the loader pipeline.
- [x] Verify the sibling rule `test: /\.(png|svg|jpg|gif|webp)$/i` still has
      `exclude: [/images\/_sprite-source-files\/.*\.svg$/, '/node_modules/']` — unchanged, this
      exclusion still needs to keep sprite-source SVGs out of the generic asset-emitter rule.
- [x] **Missing from this plan's original checklist — delete
      `source/images/_sprite-source-files/sprite.cjs`.** This file exists only to force webpack
      to process every sprite-source SVG through a module loader
      (`require.context('.', true, /\.svg$/)`, itself picked up as a webpack entry point by
      `gatherProjectFiles()`'s `.cjs` glob). It was needed for the *old* `svg-sprite-loader`
      pipeline, which worked by intercepting webpack module resolution for those files. The new
      `SvgSpritemapPlugin` reads the sprite-source SVGs directly off disk via its own glob,
      completely outside webpack's module graph, so this shim is now dead weight — worse, with
      the old loader rule removed (previous checklist item), webpack has no loader left to
      handle `sprite.cjs`'s forced `require()` of 37 raw `.svg` files, and the build fails with
      37 `Module parse failed: Unexpected token` errors. Upstream's own diff deletes this exact
      file for the same reason (`git show` on the diff: `deleted file mode 100644`). Confirmed
      after deletion: `npm run build` compiles cleanly and `dist/images/sprite.artifact.svg`
      still contains all 37 symbols.
- [x] **Missing from this plan's original checklist — scope `StylelintPlugin` to `source/`.**
      Add `files: 'source'` to the `new StylelintPlugin({...})` options (alongside the existing
      `exclude` array). Without an explicit `files` option, the plugin's default is to glob
      `**/*.{css,scss,sass}` from the **entire project root**, not just `source/`. In this repo
      that swept up stray, gitignored build-artifact snapshots left over from a previous
      upgrade's manual verification (`.claude/baseline-542/`, `.claude/gesso-baseline/` —
      compiled, minified `.css` files), and linting minified CSS against this theme's
      formatting rules produced so many violations that stylelint's `string` formatter crashed
      with `RangeError: Invalid string length` trying to build the results table, which in turn
      manifested as a `JavaScript heap out of memory` webpack build failure. This isn't a new
      bug introduced by this upgrade (the missing `files` scope predates it), but it only
      surfaced now because those leftover directories exist in this checkout. Scoping to
      `source/` matches exactly what the `stylelint` npm script already lints
      (`stylelint "source/**/*.scss"`) and has no effect on which *real* source files get
      linted — confirmed via a full `npm run stylelint` pass (still clean) and `npm run build`
      (no longer touches anything under `.claude/`).

- [x] Move `splitChunks` from `webpack.production.js` into `webpack.common.js`'s top-level
      `optimization` key:

  ```js
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'all',
          name: 'js/common',
          minChunks: 2,
        },
      },
    },
  },
  ```

  This makes the shared-chunk extraction run in dev builds too, not just production. It changes
  which `dist/js/*.js` files exist during `npm run start`/`watch` (a new `js/common.js` may
  appear in dev that previously only appeared in `npm run build`), but does not change the
  *production* `npm run build` output, since production already ran this exact config via
  `webpack.production.js`. If this theme's CI/release process only ever ships the production
  build (it does — see `.github/workflows/build-assets.yml`), this is safe under the
  no-output-change constraint for the shipped artifact.

- [x] Do **not** remove the `silenceDeprecations: ['if-function']` comment/option already
      present in this file (added during the 5.0.9→5.4.2 upgrade). Upstream's diff removes its
      own `silenceDeprecations: ['mixed-decls']` line, which this theme doesn't have — nothing
      to do there.

## 2.2 `webpack.production.js`

- [x] Remove the `splitChunks` block from `optimization` (moved to `webpack.common.js` in 2.1
      above — `webpack-merge` will still merge `webpack.production.js`'s `minimizer` array in on
      top of the base config, so production builds are unaffected).

## 2.3 `eslint.config.js`

- [x] Add the import: `import f1StorybookConfig from '@forumone/eslint-config-es5/storybook';`
- [x] Add `f1StorybookConfig` to the `defineConfig([...])` array, immediately after
      `f1BaseConfig` (matching upstream's ordering).

**Correction, made after this plan's initial "Test" pass, at the user's explicit direction —
read before assuming the rest of this file's SLAC-specific entries are load-bearing.** This
checklist originally said to leave every other entry untouched, reasoning that they were all
necessary SLAC deviations. That reasoning was checked against the wrong yardstick: I verified
each block was *safe to keep* (removing it reintroduces real lint errors) by running `eslint`
against ad hoc broader globs (`source/**/*.jsx`, `.storybook/stubs/**`, etc.), but the actual
gate — `npm run eslint`, i.e. `eslint source/**/!(*.stories).js` — only ever lints **42 files,
every one a bare `.es6.js` file directly under `source/`**. It never touches `.jsx`, `.tsx`,
anything under `lib/`, or anything under `.storybook/`. So most of those blocks were solving a
problem the real gate never has:

- The `**/*.tsx`/`**/*.jsx` glob widening on the `extends: [f1ReactConfig]` block, and the
  React-specific rule overrides (`react/react-in-jsx-scope`, `react/prop-types`,
  `react/no-unescaped-entities`, `settings.react.version`) — **removed**, reverted to upstream's
  exact `files: ['*.tsx', '*.jsx']`. Upstream's own glob has the same "only matches the repo
  root" bug this widening fixed, but it's inert for both repos: `.jsx` is never linted by either
  project's own `npm run eslint`.
- The `files: ['source/**/*.stories.jsx']` carve-out (`storybook/story-exports`,
  `@typescript-eslint/no-unused-vars` off) — **removed** entirely (upstream has no equivalent
  block at all). `.stories.jsx` is excluded from the glob by name (`.stories.js` isn't even the
  right extension) and `.jsx` isn't linted regardless.
- The `files: ['.storybook/stubs/**']` carve-out (`no-shadow`, `no-param-reassign` off) —
  **removed** entirely (upstream has no equivalent). `.storybook/` is outside `source/`, never
  linted.
- The require-imports carve-out — **reverted to upstream's exact form**:
  `files: ['webpack.*.js', 'lib/**/*.[j|t]s']` with rule `@typescript-eslint/no-var-requires`
  (not the widened `{js,cjs,ts}` glob / renamed `no-require-imports` this theme had). `lib/` and
  `webpack.*.js` are outside `source/`, never linted by the gate either way; upstream's stale
  rule name (deprecated but still valid in `@typescript-eslint/eslint-plugin@8.26.1`, confirmed
  by testing — it doesn't error, just doesn't do anything useful) is harmless for the same
  reason.

**Kept, and re-verified as genuinely necessary against the real gate** (removing it reproduces
real errors on `source/03-components/accordion/accordion.es6.js`, which **is** one of the 42
files `npm run eslint` actually lints): the final `prefer-destructuring` override block. Also
kept, since it wasn't part of this specific question: the extra `globalIgnores` entries
(`.storybook/stubs/once.js`, `dist/**`, `storybook/**`) — these guard against someone running an
*unscoped* `eslint .`, a different scenario from the removed rule-override blocks above.

Re-verified after these removals: `npm run eslint` (0 problems), `npm run stylelint` (0
problems), `npm run build` (0 warnings), `npm run build-storybook` (0 warnings) — all still
clean. If `.jsx`/`.tsx`/`lib/**`/`.storybook/**` files are ever linted by something other than
`npm run eslint` (an editor's ESLint integration, a future widened script, a pre-commit hook),
the specific errors these blocks used to suppress will reappear — see the git history of this
file (pre-dating this note) for exactly which rules and why, if that coverage is wanted back.

**Phase 2 status: complete**, including two fixes found during the Test phase and documented
inline above: deleting the now-dead `sprite.cjs` shim, and scoping `StylelintPlugin` to
`source/`. The SVGO `svgo` option ended up as plain `true` (not the originally-planned
`removeViewBox: false` override) — verified against SVGO 4's actual `preset-default` source and
against the built sprite's `viewBox` attributes, see 2.1 above.
