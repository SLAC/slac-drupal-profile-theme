# Phase 2 — ESM build toolchain (Babel → SWC, webpack configs)

**Goal:** convert every webpack/PostCSS config to ESM, replace Babel with SWC, add the
TypeScript plumbing, and update loader options — with no change to emitted CSS/JS behaviour.

**Diff reference:** lines 987–1024 (`.swcrc`), 1302–1321 (`babel.config.json` deleted),
5432–5448 (`postcss.config.js`), 26421–26451 (`tsconfig.json`), 26452–26943 (all `webpack.*.js`).

**Blocking:** Phases 3, 5.

---

## 2.1 Delete `babel.config.json`

- [ ] `git rm babel.config.json`

Its role (`@babel/preset-env` with `useBuiltIns: 'usage'`, `corejs: 3`, `loose: true`, plus
`@babel/preset-react`) is taken over by `.swcrc`.

---

## 2.2 Create `.swcrc`

Copy verbatim from the diff (lines 993–1024):

```json
[
  {
    "test": ".*\\.jsx?$",
    "env": {
      "mode": "usage",
      "loose": true,
      "corejs": "3"
    },
    "jsc": {
      "loose": true,
      "parser": {
        "syntax": "ecmascript",
        "jsx": true
      }
    }
  },
  {
    "test": ".*\\.tsx?$",
    "env": {
      "mode": "usage",
      "loose": true,
      "corejs": "3"
    },
    "jsc": {
      "loose": true,
      "parser": {
        "syntax": "typescript",
        "tsx": true
      }
    }
  }
]
```

> **Note:** the upstream file as it appears in the diff has trailing commas after the `jsc`
> objects (`},\n},`). That is not valid JSON. The block above has them removed. If SWC
> complains about the config, this is why.

- [ ] Create the file with the content above.
- [ ] Sanity check: `node -e "JSON.parse(require('fs').readFileSync('.swcrc','utf8'))"` exits 0.

`browserslist` in `package.json` continues to drive `env.mode: "usage"` targets, exactly as
it did for `@babel/preset-env`. `core-js@^3.41.0` (added in Phase 1) supplies the polyfills.

---

## 2.3 Create `tsconfig.json`

Copy from the diff (lines 26427–26451):

```json
{
  "compilerOptions": {
    "target": "es2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "jsx": "react",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true,
    "paths": {
      "jquery": ["./node_modules/jquery/dist/jquery.js"],
      "drupal": ["./.storybook/stubs/drupal.js"],
      "drupalSettings": ["./.storybook/stubs/drupalSettings.js"],
      "once": ["./.storybook/stubs/once.js"]
    }
  },
  "exclude": [
    "node_modules",
    "lib/**"
  ]
}
```

Notes:
- The `paths` mappings reference `.storybook/stubs/*` — those files are created in Phase 5.
  Land Phases 2 and 5 together, or create the stubs first.
- `"jquery"` is in `paths` because this theme keeps jQuery. Upstream has the same entry
  (upstream ships it for consumers who add jQuery back), so no deviation.
- `allowJs: true` + `checkJs: false` means existing `.js`/`.jsx` are resolved but not
  type-checked. No new type errors from existing code.
- Upstream ships `source/@types/drupal/index.d.ts` to type the `drupal` external. It is
  excluded (see `README.md`); nothing here imports types from it. If a future `.ts`
  component needs it, add it then.

- [ ] Create `tsconfig.json`.
- [ ] **Fallback:** if `fork-ts-checker-webpack-plugin` errors with
      `error TS18003: No inputs were found in config file`, either (a) add
      `"include": ["source/**/*", ".storybook/**/*"]`, or (b) drop
      `new ForkTsCheckerWebpackPlugin()` from `webpack.common.js` until the first `.ts`
      file exists. Prefer (a).

---

## 2.4 Rewrite `postcss.config.js` as ESM

Replace the whole file (diff lines 5442–5448):

```js
import autoprefixer from 'autoprefixer';

const config = {
  plugins: [autoprefixer],
};

export default config;
```

- [ ] Apply.

Output is identical — same single plugin, same `browserslist` source.

---

## 2.5 Rewrite `webpack.common.js`

Full target file. This is the upstream version (diff lines 26464–26692) with **two
deviations**, both marked inline:

```js
import path, { dirname } from 'node:path';
import { Glob } from 'glob';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import RemovePlugin from 'remove-files-webpack-plugin';
import StylelintPlugin from 'stylelint-webpack-plugin';
import SpriteLoaderPlugin from 'svg-sprite-loader/plugin.js';
import * as embeddedSass from 'sass-embedded';
import { fileURLToPath } from 'node:url';

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));

async function gatherProjectFiles() {
  const jsFiles = {};
  const scssFiles = {};
  const jsGlob = new Glob('source/**/!(*.stories).{cjs,js,ts}', {
    ignore: ['**/_*', 'source/@types/**', 'source/07-react/**'],
  });
  const scssGlob = new Glob('source/**/*.scss', jsGlob);
  for await (const currentFile of jsGlob.iterate()) {
    const filePaths = currentFile.split(path.sep);
    const sourceDirIndex = filePaths.indexOf('source');
    if (sourceDirIndex >= 0) {
      const fileName = path.basename(currentFile).replace(/\.c?[jt]s$/, '');
      const newFilePath = `js/${fileName}`;
      // Throw an error if duplicate files detected.
      if (jsFiles[newFilePath]) {
        throw new Error(`More than one file named ${fileName}.[jt]s found.`);
      }
      jsFiles[newFilePath] = {
        import: path.resolve(__dirname, currentFile),
      };
    }
  }

  for await (const currentFile of scssGlob.iterate()) {
    const filePaths = currentFile.split(path.sep);
    const sourceDirIndex = filePaths.indexOf('source');
    if (sourceDirIndex >= 0) {
      const fileName = path.basename(currentFile, '.scss');
      const newFilePath = `css/${fileName}`;
      // Throw an error if duplicate files detected.
      if (scssFiles[newFilePath]) {
        throw new Error(`More that one file named ${fileName}.scss found.`);
      }
      scssFiles[newFilePath] = {
        import: `./${currentFile}`,
      };
    }
  }
  return {
    ...jsFiles,
    ...scssFiles,
  };
}

const commonConfig = {
  entry: () => gatherProjectFiles(),
  plugins: [
    new MiniCssExtractPlugin(),
    new RemovePlugin({
      after: {
        test: [
          {
            folder: './dist/css',
            method: absolutePath => /\.js(\.map)?$/m.test(absolutePath),
            recursive: true,
          },
        ],
        log: false,
        logError: true,
        logWarning: false,
      },
    }),
    new StylelintPlugin({
      exclude: ['node_modules', 'dist', 'storybook'],
    }),
    new SpriteLoaderPlugin(),
    new ForkTsCheckerWebpackPlugin(),
  ],
  context: __dirname,
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          // We will check types in fork plugin
          transpileOnly: true,
        },
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['swc-loader'],
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.scss$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../',
            },
          },
          {
            loader: 'css-loader',
            options: {
              esModule: false,
              // Ignore /core/ URLs
              url: {
                filter: url => !url.includes('/core/'),
              },
            },
          },
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: embeddedSass,
              webpackImporter: false,
              sassOptions: {
                loadPaths: [path.resolve(__dirname, 'source')],
                // Hiding mixed declaration warnings for now.
                // https://sass-lang.com/documentation/breaking-changes/mixed-decls/
                silenceDeprecations: ['mixed-decls'],
              },
            },
          },
        ],
      },
      {
        test: /images\/_sprite-source-files\/.*\.svg$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              extract: true,
              spriteFilename: 'sprite.artifact.svg',
              outputPath: 'images/',
            },
          },
          'svg-transform-loader',
          // DEVIATION (2.7): explicit SVGO config so v3's default preset cannot
          // strip viewBox from sprite symbols.
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      {
        test: /fonts\/.*\.(woff2?|ttf|otf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/i,
        exclude: ['/node_modules/'],
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]',
        },
      },
      {
        test: /\.(png|svg|jpg|gif|webp)$/i,
        exclude: [/images\/_sprite-source-files\/.*\.svg$/, '/node_modules/'],
        type: 'asset',
        generator: {
          filename: 'images/backgrounds/[hash][ext][query]',
        },
      },
    ],
  },
  externals: {
    // DEVIATION: jquery retained — used by dropbutton.es6.js and
    // addtocal-a11y.es6.js. Upstream removed this entry.
    jquery: 'jQuery',
    drupal: 'Drupal',
    drupalSettings: 'drupalSettings',
    once: 'once',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    extensionAlias: {
      '.es6': ['.es6.ts', '.es6.js'],
    },
    modules: [path.resolve(__dirname, 'source'), 'node_modules'],
    enforceExtension: false,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: false,
  },
  stats: 'minimal',
};

export default commonConfig;
```

### Checklist

- [ ] Replace the file wholesale with the above.
- [ ] **Removed rule:** the `config\.design-tokens\.yml` rule moves out of
      `webpack.common.js` and into `webpack.theme-config.js` (step 2.6). Make sure it is
      not left in both places — duplicate loaders will double-emit
      `_design-tokens.artifact.scss`.
- [ ] `resolve.extensionAlias` for `.es6` is **required**: this theme has many
      `import … from '../../06-utility/_slide.es6'` style imports. Without it, adding
      `.ts`/`.tsx` to `resolve.extensions` changes resolution order and breaks them.
- [ ] `generator.filename` changes: `fonts/[hash]…` → `fonts/[name]…` and
      `images/[hash]…` → `images/backgrounds/[hash]…`. Both are already reflected in
      `.gitignore` (`dist/fonts/*`, `dist/images/backgrounds`) — **no `.gitignore` change
      needed**. Verify after building that no CSS `url()` 404s: `grep -rn "url(" dist/css | grep images/`
      should resolve against `dist/images/backgrounds/`.

### Behaviour notes

| Change | Output impact |
| --- | --- |
| `babel-loader` → `swc-loader` | Different minifier/transpiler; emitted JS text differs, semantics identical for this code (no decorators, no Babel plugins beyond preset-env/react). |
| `glob.sync` → `new Glob().iterate()` | Same file set. The new ignore list adds `source/@types/**` and `source/07-react/**` — neither exists here, harmless. |
| `entry` now matches `{cjs,js,ts}` (was `js`) | Picks up `.cjs`/`.ts` entries if ever added. No current effect. |
| `esModule: false` on `css-loader` | Required by css-loader 7 for the `MiniCssExtractPlugin` + `style-loader` mix. No CSS text change. |
| `silenceDeprecations: ['mixed-decls']` | Suppresses Dart Sass warnings only. |
| `context: __dirname` | Makes relative globs deterministic regardless of cwd. Important for the release workflow. |
| `output.clean: false` | Explicitly preserves `dist/images/` (checked-in SVGs and logos) across builds. **Do not set to `true`** — this repo commits files under `dist/images/`. |
| `stats: 'minimal'` | Console output only. |

---

## 2.6 Rewrite `webpack.theme-config.js`

Replace the whole file (diff lines 26887–26943). Note it no longer merges
`webpack.common.js` — it is a standalone config with its own loader rule:

```js
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));

const themeConfig = (_env, argv) => ({
  mode: 'production',
  entry: {
    'design-tokens': './source/00-config/config.design-tokens.yml',
  },
  context: __dirname,
  plugins: [
    function readyToGoPlugin() {
      if (argv.mode === 'development') {
        this.hooks.beforeCompile.tap('ReadyToGoPlugin', () => {
          console.log(
            `${new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              timeZoneName: 'short',
            })}: ${chalk.magenta(
              'Webpack beginning design tokens compilation.'
            )}`
          );
        });
        this.hooks.afterCompile.tap('ReadyToGoPlugin', () => {
          console.log(
            `${new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              timeZoneName: 'short',
            })}: ${chalk.greenBright.bold(
              'Design tokens compilation complete. Watching for changes.'
            )}`
          );
        });
      }
    },
  ],
  module: {
    rules: [
      {
        test: /config\.design-tokens\.yml$/,
        exclude: /node_modules/,
        use: [path.resolve(__dirname, './lib/configLoader.cjs')],
        type: 'asset/source',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  stats: 'minimal',
});

export default themeConfig;
```

- [ ] Apply.
- [ ] `lib/configLoader.cjs` is created in Phase 4. This config will fail until then.
- [ ] Verify it still emits `dist/design-tokens.js`,
      `source/00-config/_design-tokens.artifact.scss` and `source/00-config/_GESSO.es6.js`.
      All three are gitignored; all three are required by `source/styles.scss` and by
      component JS that imports `GESSO` tokens.

> The `America/New_York` timezone in the console messages is upstream's. Harmless; leave it
> (or change to `America/Los_Angeles` — cosmetic, does not affect output).

---

## 2.7 SVGO 3 / `viewBox` — do this check first

`svgo-loader` 4 depends on SVGO 3. SVGO 3's `preset-default` includes `removeViewBox`.
The sprite pipeline is:

```
source/**/images/_sprite-source-files/*.svg
  → svg-sprite-loader (extract → dist/images/sprite.artifact.svg)
  → svg-transform-loader
  → svgo-loader
```

If `viewBox` is removed from the source symbols, every `<use xlink:href="…#icon">` in
`source/03-components/icon/icon.twig` renders at the wrong size. That is a visual
regression, and a subtle one.

The `webpack.common.js` block in 2.5 already pins `removeViewBox: false`. Verify it worked:

- [ ] Run `npm run build` (after Phases 3 and 4 land).
- [ ] `grep -c 'viewBox' dist/images/sprite.artifact.svg` — must be non-zero and should
      roughly match the symbol count.
- [ ] Compare against a pre-upgrade build of the same file if you kept one.

---

## 2.8 Rewrite `webpack.dev.js`

Replace the whole file (diff lines 26703–26747):

```js
/* eslint no-console: "off" */
import { merge } from 'webpack-merge';
import ESLintPlugin from 'eslint-webpack-plugin';
import path, { dirname } from 'node:path';
import chalk from 'chalk';
import common from './webpack.common.js';
import { fileURLToPath } from 'node:url';

const __dirname =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));

const devConfig = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  plugins: [
    new ESLintPlugin({
      overrideConfigFile: path.resolve(__dirname, 'eslint.dev.config.js'),
      extensions: ['js', 'jsx', 'ts', 'tsx'],
    }),
    function readyToGoPlugin() {
      this.hooks.beforeCompile.tap('ReadyToGoPlugin', () => {
        console.log(
          `${new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            timeZoneName: 'short',
          })}: ${chalk.magenta('Webpack beginning compilation.')}`
        );
      });
      this.hooks.afterCompile.tap('ReadyToGoPlugin', () => {
        console.log(
          `${new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            timeZoneName: 'short',
          })}: ${chalk.greenBright.bold(
            'Compilation complete. Watching for changes.'
          )}`
        );
      });
    },
  ],
});

export default devConfig;
```

- [ ] Apply.
- [ ] `useEslintrc: false` is gone (flat config has no eslintrc). `eslint.dev.config.js` is
      created in Phase 3.

---

## 2.9 Rewrite `webpack.production.js`

Replace the whole file (diff lines 26757–26792):

```js
import { merge } from 'webpack-merge';
import TerserJsPlugin from 'terser-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import common from './webpack.common.js';

const prodConfig = merge(common, {
  mode: 'production',
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
    minimizer: [
      new TerserJsPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
  devtool: false,
  plugins: [
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
    }),
  ],
});

export default prodConfig;
```

- [ ] Apply.
- [ ] **This file's `splitChunks` block is already in the `cacheGroups` form here** — this
      repo is ahead of upstream 5.0.9. The only real changes are the ESM conversion and the
      `extensions` option on `ESLintPlugin`.
- [ ] `dist/js/common.js` must still be produced. `includes/libraries.inc`
      (`slac_library_info_build()`) conditionally registers the `slac/common` library based
      on `file_exists($active_theme . '/dist/js/common.js')`, and **21 libraries in
      `slac.libraries.yml` depend on `slac/common`**. If `common.js` stops being emitted,
      every one of those libraries loses a dependency and JS breaks site-wide.
      Verify: `ls -la dist/js/common.js` after `npm run build`.

---

## 2.10 `webpack.react-config.js` — NOT added

Upstream adds this file (diff lines 26799–26879) with `entry: source/07-react/index.tsx`.

- [ ] **Do not create it.** Do not add it to the `build` script.
- [ ] If a React app is wanted later: create `source/07-react/index.tsx`, copy
      `webpack.react-config.js` from the diff verbatim, add
      `&& webpack --config ./webpack.react-config.js` to `build`, add `watch-react`, and add
      the `react` library entry from the `gesso.libraries.yml` diff (lines 1679–1688) —
      **including `preprocess: false`**, which is load-bearing for code-splitting under
      Drupal JS aggregation.

---

## Definition of done

- `babel.config.json` deleted; `.swcrc`, `tsconfig.json` created.
- `postcss.config.js`, `webpack.common.js`, `webpack.dev.js`, `webpack.production.js`,
  `webpack.theme-config.js` are all ESM and match the blocks above.
- `jquery` external retained.
- Explicit SVGO config pins `removeViewBox: false`.
- `output.clean` is `false`.
- `webpack.react-config.js` absent, and `build` does not reference it.
- Build will still fail (Phases 3 and 4 outstanding) — that is expected.
