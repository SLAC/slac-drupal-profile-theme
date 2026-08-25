# Phase 4 — `lib/` rewrite and Twig extensions

**Goal:** split `lib/` into ESM (`.js`) and CommonJS (`.cjs`) halves as required by
`"type": "module"`, port the design-token pipeline to `yaml` v2, and add the Twig extensions
that `.storybook/preview.js` will need in Phase 5.

**Diff reference:** lines 3400–5258.

**Blocking:** Phase 2 (`webpack.theme-config.js` points at `lib/configLoader.cjs`) and
Phase 5 (`preview.js` imports the new extensions).

---

## 4.0 How to source file contents

Every file below is fully specified in `gesso-update-diff.diff`. For each one the exact diff
line range is given. Extract the post-image with:

```bash
sed -n '<START>,<END>p' gesso-update-diff.diff | grep -E '^\+' | sed '1,2d' | sed 's/^+//'
```

(The `sed '1,2d'` drops the `+++ b/…` header line.) Verify the result compiles / parses
before moving on. For the short files the full content is inlined below.

---

## 4.1 The CJS / ESM split — why, and the mapping

`"type": "module"` makes every `.js` file in the repo ESM. Two `lib/` consumers cannot be
ESM:

1. **`lib/configLoader.*`** is a webpack loader referenced by absolute path from
   `webpack.theme-config.js`. Webpack loads loaders through Node's CJS resolver; an ESM
   loader would need `import()` plumbing upstream chose not to add.
2. Everything `configLoader` requires transitively (`readSource`, `transform`, `renderSass`,
   `renderJs`, `CodeMap`, `SassValue`, `cleanValue`) must therefore also be CJS.

Everything else in `lib/` is imported by ESM consumers (`.storybook/preview.js`,
`.stylelintrc.yml`, `npm run component`) and stays `.js`.

| Current file | Action | New name | Module system | Diff lines |
| --- | --- | --- | --- | --- |
| `lib/CodeMap.js` | rename + edit | `lib/CodeMap.cjs` | CJS | 3400–3450 |
| `lib/SassValue.js` | rename + rewrite | `lib/SassValue.cjs` | CJS | 3451–3545 |
| `lib/cleanValue.js` | delete, replace | `lib/cleanValue.cjs` | CJS | new: 3666–3756 / del: 3757–3791 |
| `lib/configLoader.js` | delete, replace | `lib/configLoader.cjs` | CJS | new: 3941–4016 / del: 4017–4050 |
| `lib/readSource.js` | delete, replace | `lib/readSource.cjs` | CJS | new: 4108–4147 / del: 4148–4191 |
| `lib/renderJs.js` | delete, replace | `lib/renderJs.cjs` | CJS | new: 4192–4227 / del: 4228–4260 |
| `lib/renderSass.js` | rename + rewrite | `lib/renderSass.cjs` | CJS | 4261–4364 |
| `lib/transform.js` | delete, replace | `lib/transform.cjs` | CJS | new: 4504–4861 / del: 4862–5162 |
| `lib/uniqueId.js` | **delete** | → `lib/cleanUniqueId.js` | — | del: 5249–5258 |
| `lib/keysort.js` | edit | same | CJS → ESM | 4090–4107 |
| `lib/fieldValue.js` | edit | same | CJS → ESM | 4077–4089 |
| `lib/component.js` | edit | same | CJS → ESM | 3792–3940 |
| `lib/stylelintLVHFA.js` | edit | same | CJS → ESM | 4365–4484 (**done in Phase 3**) |
| — | **new** | `lib/cleanUniqueId.js` | ESM | 3647–3665 |
| — | **new** | `lib/addAttributesTwigExtension.js` | ESM | 3546–3646 |
| — | **new** | `lib/createAttributeTwigExtension.js` | ESM | 4051–4076 |
| — | **new** | `lib/subheadingLevelTwigExtension.js` | ESM | 4485–4503 |
| — | **new** | `lib/tsconfig.json` | — | 5163–5189 |
| `lib/types.d.ts` | edit | same | — | 5190–5248 |

Use `git mv` for the renames so history is preserved.

---

## 4.2 The `yaml` v1 → v2 port (CJS side)

The design-token loader parses `source/00-config/config.design-tokens.yml` with a custom
`!sass` YAML tag and emits three artifacts. `yaml` v2 replaced the entire custom-tag API
(`parseMap`/`stringifyString`/`cst` are gone; tags now declare `nodeClass` + `collection`
and receive resolved nodes). Upstream rewrote all six files together — **port them as a set,
not one at a time.**

- [ ] `lib/CodeMap.cjs` (3400–3450) — `git mv lib/CodeMap.js lib/CodeMap.cjs`, then apply the
      diff hunks: drop `'use strict'`, rewrite the `while` loop to avoid assignment-in-condition,
      change `errorForRange` to destructure a 3-tuple `[start, end, _nodeEnd]` (yaml v2 ranges
      are 3-element).
- [ ] `lib/SassValue.cjs` (3451–3545) — `git mv`, then rewrite. `SassValue` now **extends
      `YAMLMap`**, carries `tag = '!sass'`, takes `(schema, sass, fallback)`, and gains
      `toJSON()` returning `this.fallback`. The exported tag object gains `nodeClass`,
      `collection: 'map'`, and a `resolve(value)` using `isMap()`. Export shape changes from
      `module.exports = SassValue` to `module.exports = { SassValue, tag }` — **every
      consumer's require must be updated** (`readSource.cjs`, `transform.cjs`,
      `renderSass.cjs`, `configLoader.cjs` all do this in their own hunks).
- [ ] `lib/cleanValue.cjs` (3666–3756) — new file. Substantially expanded: adds `isCssVar`,
      `isColorSyntax` (rgb/hsl/lab/lch/oklab/oklch/color/color-mix/light-dark/…),
      `isNumberLike`, and only quotes values that are neither. Exports
      `{ cleanValue, isCssVar, isColorSyntax, isNumberLike }`.
      Then `git rm lib/cleanValue.js`.
- [ ] `lib/readSource.cjs` (4108–4147) — new file. `yamlError.source.range` →
      `yamlError.pos`; range passed as a 3-tuple. Then `git rm lib/readSource.js`.
- [ ] `lib/transform.cjs` (4504–4861, 352 lines) — new file. The biggest single rewrite:
      uses `isMap`/`isSeq`/`isPair`/`isScalar` from `yaml` v2 instead of walking the v1 CST.
      **Extract verbatim from the diff.** Then `git rm lib/transform.js`.
- [ ] `lib/renderSass.cjs` (4261–4364) — `git mv lib/renderSass.js lib/renderSass.cjs`, then
      apply: `for…of` → `Object.entries().forEach`, template-literal concatenation, double
      → single quotes, and the new destructured requires
      (`const { SassValue } = require('./SassValue.cjs')`,
      `const { cleanValue } = require('./cleanValue.cjs')`).
- [ ] `lib/renderJs.cjs` (4192–4227) — new file. **Behaviour change:** the v1 version passed a
      `JSON.stringify` replacer to unwrap `SassValue` → `value.fallback`. The v2 version
      relies on `SassValue.toJSON()` instead. Then `git rm lib/renderJs.js`.
- [ ] `lib/configLoader.cjs` (3941–4016) — new file. Adds a `try/catch`, JSDoc types, and a
      `yaml.stringify` replacer that serialises `SassValue` to `{ sass, fallback }` with
      `customTags: [sassTag]`. Then `git rm lib/configLoader.js`.

### Verification for 4.2 — do this before moving on

The design-token pipeline is the single highest-risk part of this phase: it generates
`source/00-config/_design-tokens.artifact.scss`, which every SCSS file consumes through
`@use '00-config'`. A silent regression here changes computed values everywhere.

- [ ] Before starting Phase 4, stash a reference copy of the current artifacts:

```bash
npm run build   # on the pre-upgrade toolchain, i.e. from the base commit
cp source/00-config/_design-tokens.artifact.scss /tmp/tokens-before.scss
cp source/00-config/_GESSO.es6.js /tmp/GESSO-before.js
cp dist/design-tokens.js /tmp/design-tokens-before.js
```

- [ ] After Phase 4, rebuild and diff:

```bash
npx webpack --config ./webpack.theme-config.js
diff /tmp/tokens-before.scss source/00-config/_design-tokens.artifact.scss
diff /tmp/GESSO-before.js source/00-config/_GESSO.es6.js
diff /tmp/design-tokens-before.js dist/design-tokens.js
```

- [ ] **`_design-tokens.artifact.scss` must be byte-identical** (or differ only in ways you
      can explain from the `cleanValue` quoting changes — e.g. a `color-mix(...)` value that
      was previously quoted and now is not). Any numeric difference is a bug in the port.
- [ ] `dist/design-tokens.js` may differ in YAML formatting (yaml v2 stringifies differently).
      Parse both and deep-compare instead of diffing text:

```bash
node -e "const y=require('yaml');const fs=require('fs');const a=y.parse(fs.readFileSync('/tmp/design-tokens-before.js','utf8'));const b=y.parse(fs.readFileSync('dist/design-tokens.js','utf8'));console.log(JSON.stringify(a)===JSON.stringify(b)?'MATCH':'DIFFER')"
```

---

## 4.3 ESM conversions (short files, full content)

### `lib/keysort.js` (4090–4107)

Change the export only:

```js
function keysort(twigInstance) {
  // JS ksort via https://stackoverflow.com/a/31102605
  twigInstance.extendFilter('keysort', value => {
    // ... body unchanged ...
  });
}

export default keysort;
```

- [ ] `module.exports = function keysort(…) {…};` → `function keysort(…) {…}` +
      `export default keysort;`. Body untouched.

### `lib/fieldValue.js` (4077–4089)

Upstream lists this as a *new* file; **it already exists here** with identical logic. Only
the export changes:

```js
// Stub the field_value filter provided by Twig Field Value in Drupal.
// For Storybook purposes, return the value unchanged.
function fieldValue(twigInstance) {
  twigInstance.extendFilter('field_value', value => value);
}

export default fieldValue;
```

- [ ] Apply.

### `lib/cleanUniqueId.js` (3647–3665) — NEW

```js
function cleanUniqueId(twigInstance) {
  // unique ID generator via https://stackoverflow.com/a/48593447
  twigInstance.extendFilter(
    'clean_unique_id',
    value =>
      `${value}--${(Date.now() * 1000 + Math.random() * 1000)
        .toString(16)
        .replace(/\./g, '')
        .padEnd(14, '0')}`
  );
}

export default cleanUniqueId;
```

- [ ] Create it.
- [ ] **Do NOT delete `lib/uniqueId.js` yet.** Upstream deletes it because upstream renamed
      the filter everywhere. This theme has **28 `|unique_id` usages** across `source/` and
      `templates/`, and the Drupal-side filter is provided by the separate `slac_helper`
      module. See §4.6.

### `lib/addAttributesTwigExtension.js` (3546–3646) — NEW

Replaces the `add-attributes-twig-extension` npm package (removed in Phase 1). Extract
verbatim from the diff — 95 lines. It implements `mergeAttributes` (array-merges `class`,
overwrites scalars) and `handleAddAttributes`, then registers
`Twig.extendFunction('add_attributes', handleAddAttributes)`.

- [ ] Create it.
- [ ] **Behaviour check.** This is the one new `lib/` file that can change Storybook output.
      The npm package and this fork are close but not identical (this fork always coerces
      `class` to an array before merging, and skips `null`/`false`/`undefined` attributes).
      This theme uses `add_attributes` in ~173 Twig files. After Phase 5, spot-check
      Storybook renders for: a component that passes `class` as a string
      (`{{ add_attributes({ class: classes }) }}` where `classes` is a joined string), and
      one that passes an array. Compare against a pre-upgrade Storybook build.
- [ ] It does **not** affect Drupal — Drupal's `add_attributes` comes from the PHP Twig
      extension in `slac_helper`.

### `lib/createAttributeTwigExtension.js` (4051–4076) — NEW

```js
/**
 * Mocks the Drupal create_attribute() Twig function.
 * For Storybook, just returns an object containing any attributes you put it.
 * @see https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal/functions-in-twig-templates#s-create-attributeattributes
 * @param startingAttributes
 * @returns {{}}
 */
function createAttributes(startingAttributes = {}) {
  return startingAttributes;
}

/**
 * Creates the Twig extension for create_attribute.
 * @param Twig
 */
function createAttributesTwigExtension(Twig) {
  Twig.extendFunction('create_attribute', createAttributes);
}

export default createAttributesTwigExtension;
```

- [ ] Create it. Purely additive — makes `create_attribute()` available in Storybook, where
      it previously would have thrown.

### `lib/subheadingLevelTwigExtension.js` (4485–4503) — NEW

```js
function subheadingLevelTwigExtension(twigInstance) {
  twigInstance.extendFilter('subheading_level', value => {
    const lowerValue = value.toLowerCase();
    const matches = lowerValue.match(/^h(\d)$/);
    if (matches !== null && matches.length >= 2) {
      const newLevel = Math.min(Number(matches[1]) + 1, 6);
      return `h${newLevel}`;
    }
    return lowerValue;
  });
}

export default subheadingLevelTwigExtension;
```

- [ ] Create it. Additive, Storybook-only. Note the Drupal-side `subheading_level` filter
      would need to come from `slac_helper` — nothing in this theme uses the filter today,
      so this is forward-looking only.

---

## 4.4 `lib/component.js` (3792–3940)

The `npm run component` scaffolder. Convert to ESM and apply upstream's generator changes.

- [ ] `require` → `import`:

```js
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import inquirer from 'inquirer';
import path from 'node:path';
import { mkdirp } from 'mkdirp';
import { EOL } from 'node:os';
```

  (`mkdirp` 3 exports a named `mkdirp`, not a default.)
- [ ] `cssPrefix()`: remove the `utility` → `u-` branch (upstream dropped it, and
      `06-utility` is now excluded from the component-directory list anyway).
- [ ] SCSS stub template: now emits `@use '00-config' as *;`.
- [ ] Twig stub template: classes array now ends `]|join(' ')|trim %}` instead of `] %}`.
      **This matches this theme's dominant convention already** — 78 files here use
      `|join(' ')|trim`. Good change.
- [ ] JSX stub template: emits CSF3 (`const X = { render: args => …, args: { ...data } };`)
      instead of CSF2. Consistent with Phase 6.
- [ ] `getDirectories()`: filter out `['@types', '00-config', '05-pages', '06-utility', 'fonts', 'images']`.
- [ ] Prompt copy fix: "What is the name your component?" → "What is the name of your component?"
- [ ] `library` prompt default `false` → `true`.
- [ ] New: when `library` is false and a sibling `_index.scss` exists, append
      `@use '<path>/<name>';` to it. This theme uses `_index.scss` aggregation throughout, so
      this is a genuine ergonomics win.
- [ ] Smoke-test: `npm run component`, create a throwaway component, confirm the four files
      land and `_index.scss` is appended, then delete them.

---

## 4.5 `lib/types.d.ts` and `lib/tsconfig.json`

- [ ] `lib/types.d.ts` (5190–5248) — apply the diff. Types are updated for `yaml` v2
      (`ParsedNode`, `Range`) and the new `SassValue` shape. Type-only; no runtime effect.
- [ ] `lib/tsconfig.json` (5163–5189) — new file. Scopes `checkJs` to the `lib/` CJS files
      (the root `tsconfig.json` excludes `lib/**`). Additive; extract verbatim.

---

## 4.6 The `unique_id` → `clean_unique_id` rename — DEFERRED to its own PR

### What upstream actually did

Upstream did **not** rename its custom filter. It **deleted** it:

- `gesso_helper/src/TwigExtension/UniqueIdTwigExtension.php` — deleted (diff 2883–2917). It
  registered `unique_id` → `\Drupal\Component\Utility\Html::getUniqueId`.
- `gesso_helper/gesso_helper.services.yml` — the `unique_id.twig_extension` service entry
  removed (diff 1847–1850).
- Nothing in the diff registers `clean_unique_id` in PHP.

The reason: **`clean_unique_id` is a Drupal core Twig filter**, provided by
`Drupal\Core\Template\TwigExtension` and bound to the same `Html::getUniqueId()` callable.
Upstream's custom filter was redundant, so they dropped it and moved to core's.

That makes the rename functionally a no-op at the Drupal level — same callable, same output —
**and it does not require a `slac_helper` release.**

### Why it's still deferred

It touches 28 Twig call sites for zero functional gain, and if the premise above is wrong on
the target Drupal version the failure mode is a hard `Twig\Error\SyntaxError: Unknown
"clean_unique_id" filter` on every affected page. That is a bad trade to bundle into an
already-large toolchain PR.

### This phase: register both filters, change no Twig

- [ ] Create `lib/cleanUniqueId.js` (§4.3).
- [ ] **Keep `lib/uniqueId.js`.** Do not delete it (upstream does, because upstream renamed
      all its call sites).
- [ ] Register **both** in `.storybook/preview.js` — covered in Phase 5, §5.4.
- [ ] Touch no Twig files.

### The follow-up PR, if you want the rename

1. **Verify the premise on the target Drupal version.** On a site running the lowest Drupal
   version this theme supports (`core_version_requirement: ^9 || ^10`), confirm the core
   filter exists:

   ```bash
   drush php:eval "print_r(array_map(fn(\$f) => \$f->getName(), \Drupal::service('twig')->getFilters()));" | grep unique
   ```

   You should see `clean_unique_id`. If you don't, stop — the rename then *does* need a
   `slac_helper` release and the risk analysis changes.
2. Confirm whether `slac_helper` still registers a `unique_id` filter. If it does, leaving it
   registered is harmless and gives you a rollback path; removing it is a separate cleanup.
3. Rewrite the 28 call sites. Files containing `|unique_id`:

   `source/03-components/overlap-image/overlap-image.twig`,
   `source/03-components/overlay-menu/overlay-menu.twig`,
   `source/03-components/tooltip/tooltip.twig`,
   `source/03-components/accordion/_accordion-item-content.twig`,
   `source/03-components/hero-bg-image/hero-bg-image.twig`,
   `source/03-components/search/search.twig`,
   `source/03-components/view/views-view--toggle/views-view--toggle.twig`,
   `source/03-components/breadcrumb/breadcrumb.twig`,
   `source/03-components/icon/icon.twig`,
   `source/03-components/pager/pager--mini/pager--mini.twig`,
   `source/03-components/article-hero/article-hero.twig`,
   `source/02-layouts/nav/nav.twig`,
   `templates/form/form.html.twig`,
   `templates/form/form--views-exposed-form-search-search-list.html.twig`,
   `templates/layout/html.html.twig`,
   `templates/views/views-view--landing-page-filtered-content--block-faqs-filtered-accordion-list.html.twig`,
   `templates/views/views-view--landing-page-filtered-content.html.twig`,
   `templates/block/block--system-menu-block.html.twig`,
   `templates/media/media--image--image-lightbox.html.twig`,
   `templates/media/media--image--media-grid.html.twig`
   (re-run `grep -rn "unique_id" source templates` for the authoritative list — 28 hits).
   Watch for the chained case: `derivative_plugin_id|clean_id|unique_id` in a menu template —
   the `clean_id` filter is separate and must not be touched.
4. Verify in Storybook **and** on a Drupal site that generated IDs still match their
   `aria-controls` / `aria-labelledby` / `for` references. These filters exist to make
   accessibility attribute pairs unique; a mismatch is an a11y regression that no CSS diff
   will catch.
5. Only then delete `lib/uniqueId.js` and drop it from `.storybook/preview.js`.

See [`cross-repo-slac-helper.md`](cross-repo-slac-helper.md).

---

## Definition of done

- `lib/` contains `CodeMap.cjs`, `SassValue.cjs`, `cleanValue.cjs`, `configLoader.cjs`,
  `readSource.cjs`, `renderJs.cjs`, `renderSass.cjs`, `transform.cjs` (CJS) and
  `addAttributesTwigExtension.js`, `cleanUniqueId.js`, `createAttributeTwigExtension.js`,
  `fieldValue.js`, `keysort.js`, `subheadingLevelTwigExtension.js`, `stylelintLVHFA.js`,
  `component.js`, `uniqueId.js` (ESM) + `types.d.ts`, `tsconfig.json`.
- Old `.js` counterparts of the `.cjs` files are deleted.
- `npx webpack --config ./webpack.theme-config.js` succeeds and emits all three artifacts.
- `_design-tokens.artifact.scss` is byte-identical to the pre-upgrade output (or every
  difference is explained).
- `npm run component` works.
- No Twig file changed.
