# Phase 5 — Storybook 6.5 → 8.6

**Goal:** migrate the Storybook configuration to SB8 (`react-webpack5` framework, SWC
compiler, ESM config, `preview-api`/`manager-api` packages, stub modules, MDX 3) while
preserving every SLAC-specific setting.

**Diff reference:** lines 172–931 (`.storybook/**`), plus `.stories.mdx` → `.mdx` renames.

**Blocking:** nothing downstream, but Storybook is completely broken between Phase 1 and the
end of this phase.

**Storybook does not affect Drupal's rendered output.** Everything in this phase is
design-system-tooling only. That makes it lower-risk than it looks — but it *is* the only
place the theme's components get rendered in CI, so a broken Storybook removes your main
verification tool.

---

## 5.1 SLAC-specific values that must survive

Before touching anything, note these. They are **not** in the diff and must be preserved
verbatim:

| File | What to preserve |
| --- | --- |
| `.storybook/preview-head.html` | Lato + Merriweather Google Fonts links, the `document.body id="top"` shim, the `yurts.slac.stanford.edu/SearchWidget.js` module script. **Do not touch this file.** |
| `.storybook/manager-head.html` | Lato + Merriweather font links. **Do not touch this file.** |
| `.storybook/theme.js` | SLAC brand colours (`#8c1515`, `#2e2d29`), `brandTitle: 'SLAC'`, `brandUrl`, `brandImage: './images/logo.svg'`, `fontBase: '"Lato", Arial, sans-serif'`. Only add `barHoverColor` (see 5.6). |
| `.storybook/preview.js` | `storySort.order` includes `'Paragraphs'` between `'Components'` and `'Templates'`. `parameters.viewport = { viewports: INITIAL_VIEWPORTS }`. |
| `.storybook/_drupal.js` | `drupalSettings.gesso = { gessoImagePath: 'images' }` — this theme's key is `gessoImagePath`, **not** upstream's `imagePath`. |
| `.storybook/main.js` | Twig namespaces include `pages: source/05-pages` (upstream's list is the same set — verify). |

---

## 5.2 `.storybook/main.js`

Rewrite as ESM. Base on the diff (lines 194–339) with SLAC adjustments marked:

```js
import path, { resolve } from 'path';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

const isProdBuild = process.env.NODE_ENV === 'production';

const config = {
  stories: ['../source/**/*.mdx', '../source/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: {
    name: '@storybook/react-webpack5',
  },
  typescript: {
    check: false,
  },
  addons: [
    '@storybook/addon-links',
    {
      name: '@storybook/addon-essentials',
      options: {
        actions: false,
      },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-webpack5-compiler-swc',
  ],
  staticDirs: ['../dist'],
  webpackFinal: async (config, { configType }) => {
    // Storybook 8 removes fast-refresh as a framework option and instead
    // requires manual set-up.
    // Adapted from https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#frameworkoptionsfastrefresh-for-webpack5-based-projects-removed
    // and https://github.com/pmmmwh/react-refresh-webpack-plugin?tab=readme-ov-file#usage.
    const swcLoaderRule = config.module.rules.find(
      rule =>
        (rule.loader && rule.loader.toString().includes('swc-loader')) ||
        (rule.use &&
          rule.use.some(
            subRule =>
              subRule.loader && subRule.loader.toString().includes('swc-loader')
          ))
    );
    if (swcLoaderRule) {
      swcLoaderRule.sideEffects = true;
      let swcLoaderConfig =
        swcLoaderRule.loader ||
        swcLoaderRule.use.find(
          subRule =>
            subRule.loader && subRule.loader.toString().includes('swc-loader')
        );
      if (swcLoaderConfig) {
        swcLoaderConfig.options = {
          ...swcLoaderConfig?.options,
          jsc: {
            ...swcLoaderConfig?.options?.jsc,
            transform: {
              ...swcLoaderConfig?.options?.jsc?.transform,
              react: {
                ...swcLoaderConfig?.options?.jsc?.transform?.react,
                development: !isProdBuild,
                refresh: !isProdBuild,
                runtime: 'automatic',
              },
            },
          },
        };
      }
    }

    config.module.rules.push({
      test: /\.twig$/,
      use: [
        {
          loader: 'twig-loader',
          options: {
            twigOptions: {
              namespaces: {
                global: resolve(__dirname, '../', 'source/01-global'),
                layouts: resolve(__dirname, '../', 'source/02-layouts'),
                components: resolve(__dirname, '../', 'source/03-components'),
                templates: resolve(__dirname, '../', 'source/04-templates'),
                pages: resolve(__dirname, '../', 'source/05-pages'),
              },
            },
          },
        },
      ],
    });

    config.module.rules.push({
      test: /config\.design-tokens\.yml$/,
      exclude: /node_modules/,
      use: ['js-yaml-loader', path.resolve(__dirname, '../lib/configLoader.cjs')],
    });

    config.module.rules.push({
      test: /\.ya?ml$/,
      exclude: /config\.design-tokens\.yml$/,
      loader: 'js-yaml-loader',
    });

    config.module.rules.push({
      test: /\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            esModule: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            implementation: require('sass-embedded'),
            webpackImporter: false,
            sassOptions: {
              loadPaths: [path.resolve(__dirname, '../source')],
              // Hiding mixed declaration warnings for now.
              // https://sass-lang.com/documentation/breaking-changes/mixed-decls/
              silenceDeprecations: ['mixed-decls'],
            },
          },
        },
      ],
    });

    config.externals = {
      drupal: 'Drupal',
      drupalSettings: 'drupalSettings',
      once: 'once',
      // DEVIATION: this theme uses jQuery (dropbutton, addtocal-a11y).
      jquery: 'jQuery',
    };

    config.resolve.modules.push(path.resolve(__dirname, '../source'));
    config.stats = 'errors-warnings';

    if (configType === 'DEVELOPMENT') {
      config.plugins.push(function readyToGoPlugin() {
        this.hooks.beforeCompile.tap('ReadyToGoPlugin', () => {
          console.log(
            `\n${new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              timeZoneName: 'short',
            })}: Storybook's webpack beginning compilation.`
          );
        });
        this.hooks.afterCompile.tap('ReadyToGoPlugin', () => {
          console.log(
            `\n${new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              timeZoneName: 'short',
            })}: Storybook's compilation complete. Watching for changes.`
          );
        });
      });
    }

    config.plugins = [
      !isProdBuild &&
        new ReactRefreshWebpackPlugin({
          overlay: {
            sockIntegration: 'whm',
          },
        }),
      ...config.plugins,
    ].filter(Boolean);

    return config;
  },
};

export default config;
```

### Checklist

- [ ] `stories` glob: `'../source/**/*.stories.mdx'` → `'../source/**/*.mdx'`, and
      `@(js|jsx)` → `@(js|jsx|ts|tsx)`. Storybook 8 **dropped `.stories.mdx` support** —
      this is why the renames in 5.7 are mandatory.
- [ ] Add `framework: { name: '@storybook/react-webpack5' }`; **remove** the old
      `core: { builder: 'webpack5' }` block.
- [ ] Add `typescript: { check: false }` (Fork TS Checker handles the webpack build; SB
      doesn't need to duplicate it).
- [ ] Add `'@storybook/addon-webpack5-compiler-swc'` to `addons`.
- [ ] Keep `staticDirs: ['../dist']` and the `actions: false` option on
      `addon-essentials` — both already correct here.
- [ ] `configLoader.js` → `configLoader.cjs` in the design-tokens rule.
- [ ] Add `esModule: false` to `css-loader`.
- [ ] Add `silenceDeprecations: ['mixed-decls']` to `sassOptions`.
- [ ] Add the SWC/react-refresh block, the `readyToGoPlugin`, `config.stats`, and the
      `ReactRefreshWebpackPlugin` prepend.
- [ ] **Add `jquery: 'jQuery'` to `config.externals`** (deviation). Currently this theme's
      Storybook resolves `import jQuery from 'jquery'` against the real npm package, which
      bundles jQuery into the story. Making it external is more faithful to Drupal — but it
      then requires the jQuery stub in 5.5. *If you would rather not add the stub, leave
      `jquery` out of `externals` and skip 5.5's jQuery step.* Either is defensible; pick one
      and be consistent.

> **`__dirname` in an ESM file.** The block above uses `__dirname`, which does not exist in
> ESM. Storybook's config loader transpiles `main.js`, so upstream gets away with it — but
> if you hit `__dirname is not defined`, add at the top:
> ```js
> import { fileURLToPath } from 'node:url';
> import { dirname } from 'node:path';
> const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
> ```
> Same for the `require('sass-embedded')` call — replace with
> `import * as embeddedSass from 'sass-embedded';` and `implementation: embeddedSass` if
> `require` is not defined.

---

## 5.3 `.storybook/manager.js`

Diff lines 344–349. One-line change:

```js
import { addons } from '@storybook/manager-api';
import theme from './theme';

addons.setConfig({
  theme,
});
```

- [ ] `@storybook/addons` → `@storybook/manager-api`. `@storybook/addons` is removed in SB8.

---

## 5.4 `.storybook/preview.js`

Full rewrite. This is upstream's version (diff lines 355–438) **with the SLAC-specific
parameters restored** and the excluded upstream global-JS imports omitted:

```js
import Twig from 'twig';
import { useEffect } from '@storybook/preview-api';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import twigDrupal from '@forumone/twig-drupal-filters';
import twigAttributes from '../lib/addAttributesTwigExtension';
import keysort from '../lib/keysort';
import uniqueId from '../lib/uniqueId';
import cleanUniqueId from '../lib/cleanUniqueId';
import fieldValue from '../lib/fieldValue';
import subheadingLevel from '../lib/subheadingLevelTwigExtension.js';
import twigCreateAttributes from '../lib/createAttributeTwigExtension';
import './stubs/drupal';
import './stubs/once';

import '../dist/css/styles.css';

function setupTwig(twig) {
  twig.cache();
  twigDrupal(twig);
  twigAttributes(twig);
  keysort(twig);
  uniqueId(twig);
  cleanUniqueId(twig);
  twigCreateAttributes(twig);
  fieldValue(twig);
  subheadingLevel(twig);
  return twig;
}

setupTwig(Twig);

export const decorators = [
  storyFn => {
    useEffect(() => Drupal.attachBehaviors(), []);
    return storyFn();
  },
];

const preview = {
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Global',
          ['Color Palette', '*'],
          'Layouts',
          'Components',
          'Paragraphs',
          'Templates',
          'Pages',
        ],
        includeName: true,
      },
    },
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
  },
};

export default preview;
```

### Checklist

- [ ] `import { addDecorator } from '@storybook/react'` → removed; use the exported
      `decorators` array. `addDecorator` is deleted in SB8.
- [ ] `import { useEffect } from '@storybook/client-api'` → `'@storybook/preview-api'`.
      `@storybook/client-api` is deleted in SB8.
- [ ] `twig-drupal-filters` → `@forumone/twig-drupal-filters`.
- [ ] `add-attributes-twig-extension` → `'../lib/addAttributesTwigExtension'`.
- [ ] `import once from '@drupal/once'; global.once = once;` → `import './stubs/once';`
      (the stub sets `window.once` itself).
- [ ] `import './_drupal';` → `import './stubs/drupal';`
- [ ] `export const parameters = {…}` → `const preview = { parameters: {…} }; export default preview;`
- [ ] **Register both `uniqueId` and `cleanUniqueId`** (deviation from upstream). This keeps
      the 28 existing `|unique_id` Twig call sites working in Storybook while making
      `|clean_unique_id` available for the eventual rename. See Phase 4, §4.6.
- [ ] **Keep `'Paragraphs'` in `storySort.order`.**
- [ ] **Keep the `viewport` parameter.** In SB8, `INITIAL_VIEWPORTS` is still exported from
      `@storybook/addon-viewport`, which ships as a dependency of `addon-essentials` — no
      explicit `package.json` entry needed. If the import fails, change to
      `import { INITIAL_VIEWPORTS } from '@storybook/addon-essentials/viewport';`.
- [ ] **Omit** upstream's `import '../source/01-global/html-elements/00-universal/universal.es6';`
      and `import '../source/01-global/html-elements/01-html/html.es6';` — those files are
      part of the excluded upstream component set.

---

## 5.5 `.storybook/stubs/`

Create the directory and three files.

### `.storybook/stubs/drupalSettings.js` (diff 500–503) — NEW

```js
const drupalSettings = {};
window.drupalSettings = drupalSettings;

export default drupalSettings;
```

### `.storybook/stubs/drupal.js` (diff 439–493) — renamed from `_drupal.js`

`git mv .storybook/_drupal.js .storybook/stubs/drupal.js`, then rewrite:

```js
import './drupalSettings';

// Simple Drupal.behaviors usage for Storybook
// via https://github.com/emulsify-ds/emulsify-drupal/

const Drupal = { behaviors: {} };

(function (Drupal, drupalSettings) {
  Drupal.throwError = error => {
    setTimeout(function () {
      throw error;
    }, 0);
  };

  Drupal.attachBehaviors = (context, settings) => {
    context = context || document;
    settings = settings || drupalSettings;
    const behaviors = Drupal.behaviors;

    Object.keys(behaviors).forEach(function (i) {
      if (typeof behaviors[i].attach === 'function') {
        try {
          behaviors[i].attach(context, settings);
        } catch (e) {
          Drupal.throwError(e);
        }
      }
    });
  };

  Drupal.t = string => string;

  Drupal.theme = (themeFunction, options) => {
    return Drupal.theme[themeFunction](options);
  };

  // DEVIATION: this theme's includes/html.inc sets `gessoImagePath`,
  // not upstream's `imagePath`. Keep the existing key.
  drupalSettings.gesso = {
    gessoImagePath: 'images',
  };
})(Drupal, window.drupalSettings);

window.Drupal = Drupal;
export default Drupal;
```

- [ ] Apply. **Do not** adopt upstream's `drupalSettings.gesso` block
      (`externalLinkExitDisclaimer`, `externalLinkAllowedDomains`,
      `externalLinkAllowedLinks`, `imagePath`) — those belong to the excluded
      `external-link` component, and `imagePath` would conflict with this theme's
      `gessoImagePath` key.
- [ ] If Phase 8's optional `gesso_image_path` → `image_path` rename is performed, change
      this key to `imagePath` at the same time.

### `.storybook/stubs/once.js` (diff 504–912) — NEW

A verbatim vendored copy of `@drupal/once` (403 lines), ending with `window.once = once;`
and `export default once;`.

- [ ] Extract from the diff.
- [ ] Note the theme still keeps `@drupal/once` in `dependencies` (upstream does too) — the
      stub exists so `once` can be a webpack external in Storybook without a global-assign
      side effect in `preview.js`.
- [ ] This file will likely fail lint (it is vendored third-party code with JSDoc-heavy
      formatting). Add it to `globalIgnores` in `eslint.config.js` rather than reformatting
      it — see Phase 3, §3.2.

### Optional: `.storybook/stubs/jquery.js`

Only if you added `jquery` to `config.externals` in 5.2:

```js
import jQuery from 'jquery';

window.jQuery = jQuery;
window.$ = jQuery;

export default jQuery;
```

- [ ] Create it and add `import './stubs/jquery';` to `preview.js` (before
      `import './stubs/drupal';`).
- [ ] The upstream README documents this exact pattern — see Phase 10.

---

## 5.6 `.storybook/decorators.jsx` and `.storybook/theme.js`

### `.storybook/decorators.jsx` (diff 172–186) — NEW

```jsx
import React from 'react';

const withGlobalWrapper = Story => (
  <div className="l-constrain u-spaced-4">
    <Story />
  </div>
);

export { withGlobalWrapper };
```

- [ ] Create it **only if** you adopt the upstream story changes that use it. Upstream
      applies `withGlobalWrapper` to `01-global/html-elements/*` stories.
- [ ] **Verify the class names exist in this theme** before using it:
      `grep -rn "l-constrain\|u-spaced-4" source/02-layouts source/06-utility`. If
      `u-spaced-4` is not a utility class here, the decorator silently does nothing.
- [ ] This theme already has `source/06-utility/storybookHelper.jsx` exporting
      `SectionWrapper`, `GridWrapper`, `WysiwygWrapper`, `decorators`, `sectionTypeArg`.
      That is the established local pattern and it is richer than upstream's. **Prefer it.**
      Creating `decorators.jsx` is optional; if you skip it, also skip the `withGlobalWrapper`
      imports when doing Phase 6.

### `.storybook/theme.js` (diff 913–931)

- [ ] Add **only** `barHoverColor` — set it to this theme's accent, not Forum One's:

```js
  barSelectedColor: '#8c1515',
  barHoverColor: '#8c1515',
```

- [ ] **Do not** change `brandImage`, `brandTitle`, `brandUrl`, or any colour. Upstream's
      `brandImage: 'images/forumone.svg'` change goes with the excluded
      `dist/images/forumone.svg` asset; this theme already points at `./images/logo.svg`.

---

## 5.7 `.stories.mdx` → `.mdx` (mandatory)

Storybook 8 removed `.stories.mdx`. Three files here:

| Current | New |
| --- | --- |
| `source/01-global/global.stories.mdx` | `source/01-global/global.mdx` |
| `source/03-components/dropdown-menu/dropdown-menu.stories.mdx` | `source/03-components/dropdown-menu/dropdown-menu.mdx` |
| `source/03-components/mega-menu/mega-menu.stories.mdx` | `source/03-components/mega-menu/mega-menu.mdx` |

For each:

- [ ] `git mv <old> <new>`
- [ ] Add the MDX 3 preamble at the top (matching diff lines 7649–7653):

```mdx
{ /* <Name>.mdx */ }

import { Meta } from "@storybook/blocks";

<Meta title="…" />
```

- [ ] `<Meta>` must now be **explicitly imported** from `@storybook/blocks` (added to
      `devDependencies` in Phase 1). In SB6 it was auto-injected.
- [ ] **MDX 3 syntax rules are stricter.** Check each file for:
      - HTML comments (`<!-- … -->`) → must become `{ /* … */ }`
      - Bare `<`/`>` in prose → must be escaped or wrapped in backticks
      - Unclosed JSX tags
      - `<Story>`, `<Canvas>`, `<ArgsTable>` from `@storybook/addon-docs` → import from
        `@storybook/blocks`; `<ArgsTable>` is now `<ArgTypes>`
- [ ] Read each of the three files and fix accordingly. `dropdown-menu.stories.mdx` and
      `mega-menu.stories.mdx` are component docs and likely contain `<Story>`/`<Canvas>`
      blocks that need reworking — upstream's diff for `dropdown-menu.mdx` (lines 12655+)
      shows the target shape.
- [ ] Verify: `npm run storybook` and confirm all three docs pages render.

---

## 5.8 Build and verify

- [ ] `npm run build` must succeed first (Storybook imports `../dist/css/styles.css`).
- [ ] `npm run storybook` — dev server starts on 6006.
- [ ] `npm run build-storybook` — static build lands in `storybook/`.
- [ ] Walk the sidebar: every top-level group (`Global`, `Layouts`, `Components`,
      `Paragraphs`, `Templates`, `Pages`) should be present and ordered.
- [ ] Confirm `Drupal.attachBehaviors()` still fires: open a story with JS behaviour
      (Accordion, Tabs, Tooltip, Lightbox) and interact with it.
- [ ] Confirm fonts load (Lato/Merriweather) — proves `preview-head.html` survived.
- [ ] Confirm the a11y addon panel appears.
- [ ] Check the browser console for `Unknown "…" filter` / `Unknown "…" function` Twig
      errors. Any such error means a filter registration was missed in `preview.js`.

---

## Definition of done

- `.storybook/` contains `main.js`, `manager.js`, `preview.js`, `theme.js`,
  `preview-head.html`, `manager-head.html`, `stubs/drupal.js`,
  `stubs/drupalSettings.js`, `stubs/once.js` (+ optional `stubs/jquery.js`,
  `decorators.jsx`).
- `.storybook/_drupal.js` no longer exists.
- No `.stories.mdx` files remain.
- `npm run storybook` and `npm run build-storybook` both succeed.
- SLAC brand, fonts, `Paragraphs` sort order, viewport parameter, and `gessoImagePath` all
  preserved.
