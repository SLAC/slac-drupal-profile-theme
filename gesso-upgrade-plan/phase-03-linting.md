# Phase 3 — Linting (ESLint 9 flat config, Stylelint 16, Prettier 3)

**Goal:** replace the eslintrc/airbnb setup with ESLint 9 flat config + Forum One shared
configs, bring Stylelint to 16, and absorb the Prettier 3 reformat — without changing any
runtime behaviour.

**Diff reference:** lines 56–105 (`.eslintrc*` deleted), 165–171 (`.prettierignore`),
932–986 (`.stylelintrc.yml`), 1382–1431 (`eslint.config.js`, `eslint.dev.config.js`),
4365–4484 (`lib/stylelintLVHFA.js`).

**Blocking:** `npm run build` — `eslint-webpack-plugin` and `stylelint-webpack-plugin` both
run inside webpack and fail the build on errors.

---

## 3.1 Delete the eslintrc files

- [ ] `git rm .eslintrc.js .eslintrc-dev.js`

---

## 3.2 Create `eslint.config.js`

Copy from the diff (lines 1388–1409):

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import f1BaseConfig from '@forumone/eslint-config-es5';
import f1ReactConfig from '@forumone/eslint-config-react';

const config = defineConfig([
  globalIgnores(['**/_GESSO.es6.js']),
  f1BaseConfig,
  {
    files: ['*.tsx', '*.jsx'],
    extends: [f1ReactConfig],
  },
  {
    // allow require() in webpack config files, which use CommonJS,
    // and in lib files, which are used by Node.js
    files: ['webpack.*.js', 'lib/**/*.[j|t]s'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]);

export default config;
```

- [ ] Create the file.
- [ ] `globalIgnores(['**/_GESSO.es6.js'])` is important — that file is a gitignored
      generated artifact containing a huge JSON blob.

### Likely additions needed for this repo

The upstream config assumes upstream's source tree. This repo has extra shapes to account
for. Add these **only if the initial lint run demands them**, and add one block at a time so
each is justifiable in review:

```js
  {
    // Storybook story files and helpers are JSX-flavoured .jsx already covered above,
    // but the storybookHelper module uses React without a .jsx-only rule scope.
    files: ['source/**/*.stories.jsx', 'source/06-utility/storybookHelper.jsx'],
    extends: [f1ReactConfig],
  },
  {
    // .es6.js component behaviours import the webpack externals `drupal`, `once`,
    // `drupalSettings`, and (for two files) `jquery`. If the base config's
    // import/no-unresolved equivalent flags these, allow them here.
    files: ['source/**/*.es6.js'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
```

- [ ] Add `.storybook/**` to `globalIgnores` **only** if `.storybook/stubs/once.js`
      (a verbatim vendored copy of `@drupal/once`) produces unfixable errors. Prefer a
      targeted ignore for that single file:
      `globalIgnores(['**/_GESSO.es6.js', '.storybook/stubs/once.js'])`.

---

## 3.3 Create `eslint.dev.config.js`

Copy from the diff (lines 1416–1431):

```js
import { defineConfig } from 'eslint/config';
import gessoConfig from './eslint.config.js';

const devConfig = defineConfig([
  gessoConfig,
  {
    rules: {
      'no-console': 'off',
      'no-empty-function': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'off',
    },
  },
]);

export default devConfig;
```

- [ ] Create the file. `webpack.dev.js` (Phase 2, Step 2.8) points at it.

---

## 3.4 Create `.prettierignore`

Diff lines 165–171:

```
_GESSO.es6.js
```

- [ ] Create the file with that single line.

---

## 3.5 Rewrite `.stylelintrc.yml`

Apply the diff's changes (lines 936–986) to this repo's file. This repo's `.stylelintrc.yml`
has two extra rules upstream lacks (`selector-max-compound-selectors: null` and
`scss/percent-placeholder-pattern`) — **keep both**.

Target file:

```yaml
extends:
  - stylelint-config-sass-guidelines

plugins:
  - stylelint-prettier
  - './lib/stylelintLVHFA.js'
  - stylelint-order
rules:
  block-no-empty: null
  color-named:
    - never
    - ignore:
      - 'inside-function'
  max-nesting-depth: 4
  order/order:
    - - type: at-rule
        hasBlock: false
      - custom-properties
      - declarations
    - unspecified: ignore
      disableFix: true
  order/properties-alphabetical-order: error
  plugin/selector-pseudo-class-lvhfa: true
  prettier/prettier: true
  property-no-vendor-prefix: null
  selector-class-pattern:
    # "piece" regex:
    # [a-zA-Z0-9]+
    # dash-separated pieces:
    # [a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z][a-zA-Z0-9]*)*
    #
    #   Block                                              Element (optional)                                   Modifier (also optional)
    #   ----------------------------------------------     -----------------------------------------------      -----------------------------------------------
    - '^[a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?$'
  selector-max-compound-selectors: null
  selector-no-qualifying-type:
  string-no-newline: true
  scss/at-import-partial-extension-disallowed-list:
    - 'less'
    - 'sass'
  scss/at-mixin-pattern:
    # "piece" regex:
    # [a-zA-Z0-9]+
    # dash-separated pieces:
    # [a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z][a-zA-Z0-9]*)*
    #
    #   Block                                              Element (optional)                                   Modifier (also optional)
    #   ----------------------------------------------     -----------------------------------------------      -----------------------------------------------
    - '^[a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?$'
  scss/percent-placeholder-pattern:
    # "piece" regex:
    # [a-zA-Z0-9]+
    # dash-separated pieces:
    # [a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z][a-zA-Z0-9]*)*
    #
    #   Block                                              Element (optional)                                   Modifier (also optional)
    #   ----------------------------------------------     -----------------------------------------------      -----------------------------------------------
    - '^[a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?$'
  # Rule clashes with new syntax needed to handle mixed nesting declarations
  scss/selector-no-redundant-nesting-selector: null
  # Conflicts with prettier
  '@stylistic/function-parentheses-space-inside': null
  # Conflicts with prettier
  '@stylistic/indentation': null
```

> **Careful with the three regex patterns** (`selector-class-pattern`,
> `scss/at-mixin-pattern`, `scss/percent-placeholder-pattern`). All three are identical in
> this repo and in upstream, and the diff does not change them — but they are long and easy
> to corrupt by hand. Do not retype them; leave those lines untouched and edit only the rules
> listed in the checklist below. Verify with
> `git diff .stylelintrc.yml | grep -E '^\+.*\[a-zA-Z\]'` (should be empty).

### Checklist

- [ ] Remove `stylelint-config-prettier` from `extends` (the package is deleted in Phase 1;
      Stylelint 16 no longer needs it).
- [ ] Add `stylelint-order` to `plugins`. `stylelint-config-sass-guidelines` 12 no longer
      bundles it, but `order/order` is used here, so it must be declared explicitly.
- [ ] Add `order/properties-alphabetical-order: error`.
- [ ] Remove `no-empty-first-line: true` (rule removed in Stylelint 16).
- [ ] Remove `selector-attribute-brackets-space-inside: never` (moved to
      `@stylistic/` namespace and now conflicts with Prettier).
- [ ] Rename `scss/at-import-partial-extension-blacklist` →
      `scss/at-import-partial-extension-disallowed-list`.
- [ ] Add `scss/selector-no-redundant-nesting-selector: null`.
- [ ] Add `'@stylistic/function-parentheses-space-inside': null` and
      `'@stylistic/indentation': null`.
- [ ] **Keep** `selector-max-compound-selectors: null` and `scss/percent-placeholder-pattern`
      (SLAC-only, not in the diff).

---

## 3.6 Rewrite `lib/stylelintLVHFA.js`

This is the custom LVHFA pseudo-class ordering plugin. Stylelint 16 removed the internal
`stylelint/lib/utils/parseSelector` export, so the plugin vendors it via
`postcss-selector-parser` (added to `devDependencies` in Phase 1).

Apply the diff at lines 4365–4484. Target file:

```js
import stylelint from 'stylelint';
import selectorParser from 'postcss-selector-parser';

const ruleName = 'plugin/selector-pseudo-class-lvhfa';
const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: 'Expected pseudo class selectors to follow LVHFA order.',
});
const correctOrder = [
  ':link',
  ':visited',
  ':hover',
  ':focus',
  ':focus-visible',
  ':focus-within',
  ':active',
];

/**
 * Imported from https://github.com/stylelint/stylelint/blob/main/lib/utils/parseSelector.js
 *
 * @param {string} selector
 * @param {import('stylelint').PostcssResult} result
 * @param {import('postcss').Node} node
 * @param {(root: import('postcss-selector-parser').Root) => void} callback
 * @see https://github.com/stylelint/stylelint/blob/main/lib/utils/parseSelector.js
 * @returns {string | undefined}
 */
function parseSelector(selector, result, node, callback) {
  try {
    return selectorParser(callback).processSync(selector);
  } catch (err) {
    result.warn(`Cannot parse selector (${err})`, {
      node,
      stylelintType: 'parseError',
    });

    return undefined;
  }
}

const plugin = stylelint.createPlugin(ruleName, primaryOption => {
  return function (postCssRoot, postCssResult) {
    const validOptions = stylelint.utils.validateOptions(
      postCssResult,
      ruleName,
      {
        actual: primaryOption,
        possible: [true, false],
      }
    );

    if (!validOptions || !primaryOption) {
      return;
    }

    let selectorOrder = [];
    let parent = postCssRoot;
    let nestedPseudo = false;

    postCssRoot.walkRules(rule => {
      const currentRuleIsNestedPseudo = rule.selector.indexOf('&:') === 0;
      if (
        !rule.parent ||
        rule.parent !== parent ||
        nestedPseudo !== currentRuleIsNestedPseudo
      ) {
        selectorOrder = [];
        parent = rule.parent;
      }
      nestedPseudo = currentRuleIsNestedPseudo;
      parseSelector(rule.selector, postCssResult, rule, fullSelector => {
        if (
          fullSelector.type === 'pseudo' &&
          correctOrder.indexOf(fullSelector.value) !== -1 &&
          selectorOrder[selectorOrder.length - 1] !== fullSelector.value
        ) {
          selectorOrder.push(fullSelector.value);
        } else {
          fullSelector.walkPseudos(pseudo => {
            if (pseudo.value === ':not') {
              return false;
            }
            if (
              correctOrder.indexOf(pseudo.value) !== -1 &&
              selectorOrder[selectorOrder.length - 1] !== pseudo.value
            ) {
              selectorOrder.push(pseudo.value);
            }
            return true;
          });
        }
      });
      if (selectorOrder.length > 1) {
        const testOrder = correctOrder.filter(pseudo =>
          selectorOrder.includes(pseudo)
        );
        const finalResult = testOrder.every((pseudo, index) => {
          return pseudo === selectorOrder[index];
        });
        if (!finalResult || selectorOrder.length > testOrder.length) {
          stylelint.utils.report({
            message: messages.expected,
            node: rule,
            result: postCssResult,
            ruleName,
          });
        }
      }
    });
  };
});

export default plugin;
export { ruleName, messages };
```

### Notes

- The rule now also tracks `:focus-visible` and `:focus-within`, and no longer inspects
  `:not()` contents. **It is stricter** — expect new violations in this theme's SCSS.
  These are lint-only; fix by reordering pseudo-class blocks.
- The file stays `.js` (ESM) because `"type": "module"` is set and Stylelint 16 loads ESM
  plugins. Do **not** rename it to `.cjs` — `.stylelintrc.yml` references
  `./lib/stylelintLVHFA.js`.

---

## 3.7 Run the linters and absorb the fallout

This is the largest unbounded chunk of work in the upgrade. Do it as **three separate
commits** so the mechanical churn is separable from the judgement calls.

### 3.7a Prettier/Stylelint autofix (mechanical)

```bash
npx stylelint "source/**/*.scss" --fix
```

- [ ] Run it. Expect large whitespace diffs from Prettier 3 (multi-line `font-family`,
      `grid-template-areas`, long `calc()` values) and from
      `order/properties-alphabetical-order`.
- [ ] Commit as its own commit: `style: stylelint 16 / prettier 3 autofix`.
- [ ] **Verify no declaration was reordered across a `!important` or cascade-sensitive
      boundary.** `order/properties-alphabetical-order` reorders declarations within a
      block; for pure-property blocks that is output-equivalent, but shorthand-then-longhand
      pairs (`margin` then `margin-top`, `background` then `background-size`,
      `font` then `font-size`, `border` then `border-color`, `flex` then `flex-basis`,
      `grid-area` then `grid-row`) **are order-sensitive**. Alphabetical ordering puts
      `margin` before `margin-top` (correct) but `background-size` before `background`
      (**wrong** — the shorthand resets it). Grep the autofix diff for these pairs:

```bash
git diff -U0 -- 'source/**/*.scss' | grep -E '^\+\s+(background|border|font|flex|grid-area|margin|padding|transition|animation|inset|mask|list-style|overflow|place-items):'
```

      Manually re-check every block that contains both a shorthand and one of its longhands.
      Add `/* stylelint-disable-next-line order/properties-alphabetical-order */` where the
      original order is load-bearing.

### 3.7b ESLint autofix (mechanical)

```bash
npx eslint . --fix
```

- [ ] Run it. Prettier 3 formatting changes will land across `source/**/*.es6.js`,
      `source/**/*.stories.jsx`, `.storybook/*`, `lib/*`.
- [ ] Commit separately: `style: eslint 9 / prettier 3 autofix`.

### 3.7c Remaining errors (judgement)

- [ ] `npx eslint .` — triage what's left. `@forumone/eslint-config-es5` is a different rule
      set from airbnb; expect real differences, not just formatting.
- [ ] Fix genuinely. Where a rule is wrong for this codebase, disable it **in
      `eslint.config.js` with a comment explaining why**, scoped by `files:` — not with
      scattered inline `eslint-disable` comments.
- [ ] `npx stylelint "source/**/*.scss"` — same triage for the stricter LVHFA rule.
- [ ] Commit: `fix: resolve eslint 9 / stylelint 16 violations`.

### Escape hatch if 3.7c blocks the build

`eslint-webpack-plugin` fails the build on errors. If the error count is large enough to
stall the upgrade, temporarily add `failOnError: false` to the `ESLintPlugin` options in
`webpack.production.js`, land Phases 1–5 with a green build, then remove it in a follow-up
that fixes the violations. **Record this in the PR description if you do it** — a silently
non-failing linter in the release path is worse than a red build.

---

## Definition of done

- `.eslintrc.js`, `.eslintrc-dev.js` deleted.
- `eslint.config.js`, `eslint.dev.config.js`, `.prettierignore` created.
- `.stylelintrc.yml` updated, SLAC-only rules preserved.
- `lib/stylelintLVHFA.js` rewritten as ESM using `postcss-selector-parser`.
- `npx eslint .` and `npx stylelint "source/**/*.scss"` both exit 0 (or the escape hatch is
  documented).
- Shorthand/longhand ordering hazards from the alphabetical-order autofix have been
  manually reviewed.
