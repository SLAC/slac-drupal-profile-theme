# Phase 3 — Storybook 8 → 10 migration

**Correction, made during the Test phase — read this before 3.1 below.** This phase originally
warned that upstream's `__dirname` rewrite in `.storybook/main.js` (using `import.meta.url`)
would reintroduce a `ReferenceError: require is not defined` crash, based on an existing
comment in this file written against Storybook 8's `esbuild-register` behavior. That turned out
to be backwards for Storybook 10: with a bare `__dirname` and no `import.meta` at all (as this
plan originally instructed), the Storybook 10 build failed immediately with
`ReferenceError: __dirname is not defined` — Storybook 10's `esbuild-register` no longer
auto-supplies one the way Storybook 8's did. Switching to
`const __dirname = dirname(fileURLToPath(import.meta.url));` was then tested directly and
**works fine** under this Storybook version — `npm run build-storybook` completed successfully
with it. The original comment's *specific* claim (that `import.meta` itself triggers a
require-polyfill crash) does not reproduce here; what actually still matters is not calling
`require(...)`/`createRequire(...)` anywhere in this file (the `path-browserify` fallback below
already avoids that by using a bare string). 3.1 below has been corrected to reflect this.

Depends on Phase 1 (new Storybook 10 packages installed). This is the highest-risk phase in
this plan: it's a two-major-version jump (Storybook skipped 9 entirely between what this theme
has and what upstream now ships). Read 3.1 in full before editing `main.js`.

None of these changes touch `dist/css`/`dist/js` (the files Drupal actually serves) — they only
affect the Storybook dev/build tool. They're in scope for this plan because Storybook has to
keep working, but a broken Storybook build doesn't violate the "no rendered output change"
constraint by itself; getting it wrong in a way that silently changes *Storybook's rendering* of
stories would (e.g., the SVGO viewBox issue in Phase 2, or the deferred `unique_id` issue in
Phase 4). Treat this phase as "make it build correctly," and verify by eye afterward.

## 3.1 `.storybook/main.js` — read this before editing

This file used to carry a comment block explaining that it deliberately avoided
`import.meta.dirname`/`import.meta.url`, based on Storybook 8-era `esbuild-register` behavior.
**That premise did not hold under Storybook 10** (see the correction note at the top of this
phase file) — a bare, unshimmed `__dirname` now fails outright. The fix actually needed and
verified working:

```js
import { fileURLToPath } from 'node:url';
import path, { resolve, dirname } from 'node:path';
import * as embeddedSass from 'sass-embedded';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

This is upstream's own approach for the `__dirname` derivation, minus one thing: **do not**
add upstream's `import { createRequire } from 'node:module';` /
`const require = createRequire(import.meta.url);` lines. Nothing in this file needs `require`
now that the `path-browserify` fallback below uses a bare string instead of
`require.resolve(...)` — and `createRequire`/actual `require()` calls are the part that's
genuinely still risky to introduce here (untested in this pass, since it was never needed).

- [x] **Keep** the existing bare `const isProdBuild = ...` line. Replace the old plain
      `import path, { resolve } from 'path';` with the `fileURLToPath`/`dirname`-based preamble
      shown above (module-style `node:path`/`node:url` imports, no `createRequire`).
- [x] **Keep** `import * as embeddedSass from 'sass-embedded';` / `implementation: embeddedSass`
      exactly as they are. This theme already made the ESM-import change upstream is making here
      (during the 5.0.9→5.4.2 upgrade) — upstream's `implementation: sass` is the same fix under
      a different local variable name. Nothing to change.
- [x] Update the addon list:
  - Remove the `{ name: '@storybook/addon-essentials', options: { actions: false } }` object
    entry from `addons`.
  - Add `'@storybook/addon-docs'` to `addons` (needed for the `.mdx` doc pages — see 3.4).
  - Add a new top-level key: `features: { actions: false }` (replaces the `options` that used to
    live on the `addon-essentials` entry).
  - Leave `'@storybook/addon-links'`, `'@storybook/addon-a11y'`,
    `'@storybook/addon-webpack5-compiler-swc'` as-is.
- [x] Add a new top-level `core` key for DDEV compatibility (harmless if this environment isn't
      using DDEV — it only changes which `Host` headers the dev server accepts):

  ```js
  const ddevHostname = process.env.DDEV_HOSTNAME || process.env.VIRTUAL_HOST;
  // ...
  core: {
    allowedHosts: ddevHostname ? [ddevHostname] : ['.ddev.site'],
  },
  ```

- [x] In the Twig loader rule inside `webpackFinal`, change `loader: 'twig-loader'` to
      `loader: '@forumone/twig-loader'` (matches the Phase 1 dependency swap). Leave the
      `namespaces` object exactly as-is, **including** the `pages:` entry this theme has that
      upstream's own `main.js` doesn't — that's a pre-existing SLAC addition, not part of this
      diff, don't remove it.
- [x] Add a `resolve.fallback` entry for `path`, needed because Storybook 9+'s webpack5 builder
      stopped providing a `path` polyfill that `twig.js` (used inside stories at browser-run
      time) depends on. Upstream writes this as
      `fallback: { path: require.resolve('path-browserify') }` — which depends on the `require`
      this file must not introduce (see above). Use the bare package specifier instead, which
      webpack's resolver handles identically without needing an absolute path:

  ```js
  webpackConfig.resolve.fallback = {
    ...webpackConfig.resolve.fallback,
    path: 'path-browserify',
  };
  ```

  (`path-browserify` is already added as a `devDependency` in Phase 1.)
- [x] Cosmetic-only, skip: upstream renames the `webpackFinal` callback's `config` parameter to
      `webpackConfig` throughout the function, apparently to avoid shadowing something at module
      scope. This theme's outer Storybook config object is already named `storybookConfig` (not
      `config`, unlike upstream's own file), so there's no shadowing to fix here. If you do rename
      the parameter for consistency with the snippets above, do it throughout the whole function
      — don't leave a mix of `config.` and `webpackConfig.` references.
- [x] **Added during the Test phase, not in the original checklist — disable webpack's asset/
      entrypoint size-limit hints.** `npm run build-storybook` otherwise succeeds but prints
      `asset size limit` / `entrypoint size limit` warnings (several bundles exceed the default
      244 KiB advisory threshold — expected for a component library with this many stories,
      React, and addons bundled). These are informational only, not a real regression, but they
      fail the "zero warnings" bar. Add, alongside the other `config.*` assignments in
      `webpackFinal`: `config.performance = { hints: false };`. Storybook's iframe bundle is a
      dev/preview tool, never shipped to site visitors, so webpack's asset-size performance
      advice doesn't apply to it.

## 3.2 `.storybook/manager.js`

- [x] `import { addons } from '@storybook/manager-api';` → `import { addons } from 'storybook/manager-api';`
      (mandatory for Storybook 10 — `@storybook/manager-api` as a standalone import path is gone).

## 3.3 `.storybook/theme.js`

- [x] `import { create } from '@storybook/theming';` → `import { create } from 'storybook/theming';`
      (same reason as 3.2). No other change — the SLAC-specific brand colors/logo/font values in
      this file are untouched by the diff.

## 3.4 `.storybook/preview.js`

- [x] `import { useEffect } from '@storybook/preview-api';` →
      `import { useEffect } from 'storybook/preview-api';`
- [x] `import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';` →
      `import { INITIAL_VIEWPORTS } from 'storybook/viewport';` — `@storybook/addon-viewport` is
      not in the new `devDependencies` list (Phase 1) because the viewport feature moved into
      Storybook core; `INITIAL_VIEWPORTS` is now exported from the bare `storybook/viewport`
      subpath. **Keep** the `viewport: { viewports: INITIAL_VIEWPORTS }` parameter under
      `preview.parameters` — that's a pre-existing SLAC addition (per the prior plan's notes)
      that upstream's own `preview.js` doesn't have; only the import source changes.
- [x] Remove the `import cleanUniqueId from '../lib/cleanUniqueId';` line and the
      `cleanUniqueId(twig);` call inside `setupTwig()`. See Phase 4 for why — upstream reversed
      the `unique_id`→`clean_unique_id` rename this was bridging toward, so the "register both
      filters" scaffolding is now removing dead code, not losing functionality. Keep
      `import uniqueId from '../lib/uniqueId';` and `uniqueId(twig);` exactly as they are — that
      filter stays the live one, unchanged.
- [x] In the `decorators` array, `useEffect(() => Drupal.attachBehaviors(), [])` →
      `useEffect(() => window.Drupal.attachBehaviors(), [])`. Verified as a no-op behavior
      change: `.storybook/stubs/drupal.js` does `window.Drupal = Drupal; export default Drupal;`
      — the imported `Drupal` and `window.Drupal` are the same object reference, so this only
      changes which reference is read, not what it points to. Applying it purely for parity with
      upstream.
- [x] Add `controls: { disableSaveFromUI: true }` as a new key under `preview.parameters`
      (sibling to the existing `layout`, `options`, `viewport` keys).
- [x] Leave the `storySort.order` array exactly as-is, **including** the `'Paragraphs'` entry —
      that's SLAC-specific and not in upstream's own list; it must survive this edit.

## 3.5 MDX doc-page import fix (three files, mechanical, identical change each)

Storybook 10 moves the `Meta` component's import path. This is required for these three
existing documentation pages to keep building under Storybook 10 — it does not change anything
these pages render.

- [x] `source/01-global/global.mdx`
- [x] `source/03-components/dropdown-menu/dropdown-menu.mdx`
- [x] `source/03-components/mega-menu/mega-menu.mdx`

In each: `import { Meta } from '@storybook/blocks';` → `import { Meta } from '@storybook/addon-docs/blocks';`.
Nothing else in these three files changes.

**Phase 3 status: complete**, after the Test-phase correction documented at the top of this
file and inline in 3.1/3.4: `main.js` now derives `__dirname` via `import.meta.url` (required
under Storybook 10, contrary to this plan's original instruction to avoid it), still contains no
`require`/`createRequire` calls, and disables webpack's performance-hint warnings for the
Storybook build. `preview.js` no longer imports or calls `cleanUniqueId` (ready for Phase 4's
deletion of `lib/cleanUniqueId.js`) and no longer imports an unused `Drupal` binding from
`./stubs/drupal` (switched to a side-effect-only import after the `window.Drupal.attachBehaviors()`
change surfaced an `@typescript-eslint/no-unused-vars` error). `npm run build-storybook`
verified clean (zero errors, zero warnings) from a clean `node_modules` install.
