# Phase 1 — Node version and npm dependencies

**Goal:** get `package.json` and `.nvmrc` to the 5.4.2 dependency set, without touching
SLAC-only packages, and install cleanly.

**Diff reference:** `gesso-update-diff.diff` lines 158–164 (`.nvmrc`), 5259–5431 (`package.json`).

**Blocking:** everything.

---

## 1.1 `.nvmrc`

Upstream sets `20`. **This repo already has `22`.** Node 22 is newer than upstream's floor
and satisfies every engine constraint in the new dependency set.

- [ ] **Leave `.nvmrc` at `22`.** Do not downgrade to 20.
- [ ] Note it in the PR description as a deliberate deviation.

> The diff shows `.nvmrc` as a *new* file (upstream did not have one at 5.0.9). This repo
> added one ahead of upstream. No action.

---

## 1.2 `package.json` — top-level fields

Apply these edits to `package.json`:

- [ ] `"version": "5.0.9"` → `"version": "5.4.2"`
- [ ] Add `"type": "module"` immediately after `"description"`:

```json
  "description": "Drupal starter theme",
  "type": "module",
  "main": "js/scripts.min.js",
```

- [ ] **Keep `"name": "gesso"`.** The upgrade tooling reads it. Do not change to `"slac"`.
- [ ] Leave `"author"`, `"license"`, `"browserslist"` untouched (the diff does not change them).

> `"type": "module"` is what forces Phases 2 and 4. Nothing will run between this edit and
> the end of Phase 4.

---

## 1.3 `package.json` — `scripts`

Replace the `scripts` block. Upstream's version, **minus the React entries** (see
`README.md` § "Not applicable"):

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "webpack --config ./webpack.theme-config.js --mode=development",
    "build": "webpack --config ./webpack.theme-config.js && webpack --config ./webpack.production.js",
    "storybook": "storybook dev -p 6006",
    "watch-theme": "webpack watch --config ./webpack.dev.js",
    "watch-design-tokens": "webpack watch --config ./webpack.theme-config.js --mode=development",
    "watch": "npm run start && concurrently --raw \"npm:watch-theme\" \"npm:watch-design-tokens\"",
    "eslint": "eslint source/**/!\\(*.stories\\).js",
    "stylelint": "stylelint \"source/**/*.scss\"",
    "build-storybook": "npm run build && storybook build -o storybook",
    "dev": "npm run start && concurrently --raw \"npm:watch-theme\" \"npm:watch-design-tokens\" \"npm:storybook\"",
    "component": "node lib/component.js"
  },
```

Deltas from upstream and why:

| Upstream | Here | Why |
| --- | --- | --- |
| `build` includes `&& webpack --config ./webpack.react-config.js` | omitted | No `source/07-react/index.tsx`; webpack would exit non-zero and break the release workflow. |
| `watch-react` script | omitted | Same. |
| `watch` / `dev` include `npm:watch-react` | omitted | Same. |
| `deploy-storybook` script | **removed entirely** | `@storybook/storybook-deployer` is dropped upstream; `.github/workflows/publish-demo-site.yml` is rewritten to use `upload-pages-artifact` (Phase 9). Removing the script **breaks the current workflow** — Phase 9 must land with this. |

- [ ] Apply the block above.
- [ ] **Cross-check:** `grep -rn "deploy-storybook" .github/` must be addressed in Phase 9.
      Do not leave the repo with a workflow calling a deleted script.

> `start` no longer runs `webpack.dev.js` — it only builds design tokens. The theme build
> is now `watch-theme` / `build`. This changes local dev ergonomics; document in Phase 10.

---

## 1.4 `package.json` — `devDependencies`

Target block (upstream 5.4.2's `devDependencies`, adjusted for this repo — see notes below):

```json
  "devDependencies": {
    "@forumone/eslint-config-es5": "^3.0.0",
    "@forumone/eslint-config-react": "^3.0.0",
    "@forumone/twig-drupal-filters": "^3.2.0",
    "@pmmmwh/react-refresh-webpack-plugin": "^0.5.15",
    "@storybook/addon-a11y": "^8.6.6",
    "@storybook/addon-actions": "^8.1.6",
    "@storybook/addon-docs": "^8.1.6",
    "@storybook/addon-essentials": "^8.6.6",
    "@storybook/addon-links": "^8.6.6",
    "@storybook/addon-webpack5-compiler-swc": "^3.0.0",
    "@storybook/blocks": "^8.1.6",
    "@storybook/preview-api": "^8.1.6",
    "@storybook/react": "^8.1.6",
    "@storybook/react-webpack5": "^8.6.6",
    "@storybook/theming": "^8.1.6",
    "@swc/cli": "^0.6.0",
    "@swc/core": "^1.11.10",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@typescript-eslint/eslint-plugin": "^8.26.1",
    "@typescript-eslint/parser": "^8.26.1",
    "autoprefixer": "^10.4.21",
    "chalk": "^5.4.1",
    "concurrently": "^9.1.2",
    "core-js": "^3.41.0",
    "css-loader": "^7.1.2",
    "eslint": "^9.23.0",
    "eslint-webpack-plugin": "^5.0.0",
    "file-loader": "^6.2.0",
    "fork-ts-checker-webpack-plugin": "^9.0.2",
    "glob": "^11.0.1",
    "inquirer": "^9.3.7",
    "js-yaml-loader": "^1.2.2",
    "mkdirp": "^3.0.1",
    "nani": "^3.2.3",
    "postcss": "^8.5.3",
    "postcss-loader": "^8.1.1",
    "postcss-selector-parser": "^7.1.0",
    "prettier": "^3.5.3",
    "react-refresh": "^0.16.0",
    "sass-loader": "^16.0.5",
    "style-loader": "^4.0.0",
    "stylelint": "^16.16.0",
    "stylelint-config-sass-guidelines": "^12.1.0",
    "stylelint-order": "^6.0.4",
    "stylelint-prettier": "^5.0.3",
    "stylelint-webpack-plugin": "^5.0.1",
    "svgo-loader": "^4.0.0",
    "swc-loader": "^0.2.6",
    "ts-loader": "^9.5.2",
    "twig-loader": "https://github.com/fourkitchens/twig-loader/archive/6f04fedf24f13b69b62c457f971d80b06522ed34.tar.gz",
    "typescript": "^5.8.2",
    "webpack": "^5.98.0",
    "webpack-cli": "^6.0.1",
    "webpack-merge": "^6.0.1"
  },
```

### To-do

- [ ] **Remove** these `devDependencies` (all removed by the diff):
      `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `@mdx-js/react`,
      `@storybook/addons`, `@storybook/builder-webpack5`, `@storybook/manager-webpack5`,
      `@storybook/storybook-deployer`, `babel-loader`, `eslint-config-airbnb`,
      `eslint-config-airbnb-base`, `eslint-config-prettier`, `eslint-import-resolver-webpack`,
      `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-prettier`,
      `eslint-plugin-react`, `eslint-plugin-react-hooks`, `stylelint-config-prettier`,
      `twig-drupal-filters`.
- [ ] **Add** the new packages from the block above.
- [ ] **Bump** versions of retained packages exactly as listed.
- [ ] **Move** these from `dependencies` to `devDependencies` (upstream did): `glob`,
      `inquirer`, `mkdirp`, `stylelint-webpack-plugin`, `svgo-loader`, `eslint-webpack-plugin`.
- [ ] **Update the `twig-loader` tarball hash** — `94126e3…` → `6f04fedf24f13b69b62c457f971d80b06522ed34`.
      This is a required change; the old commit does not support the Twig features used by
      the new `preview.js` setup.

### Repo-specific notes

- `nani` is already present here at `^3.2.1` (upstream's 5.0.9 also had it) → bump to `^3.2.3`.
- `sass-loader` is already `^16.0.0` here (ahead of upstream 5.0.9's `^12.0.0`) → bump to `^16.0.5`.
- `stylelint` is already `^14.15.0` → goes to `^16.16.0`.
- `@storybook/*` are already `^6.5.13` → go to `^8.x`.
- `autoprefixer`, `postcss`, `prettier`, `webpack`, `webpack-cli`, `css-loader`,
  `postcss-loader`, `style-loader`, `file-loader`, `js-yaml-loader`, `concurrently`,
  `stylelint-prettier`, `stylelint-config-sass-guidelines`: bump per the block.
- `fibers` appears in the diff's removal list but **is not present in this repo** — no action.

---

## 1.5 `package.json` — `dependencies`

Target block:

```json
  "dependencies": {
    "@drupal/once": "^1.0.1",
    "gsap": "^3.10.4",
    "html-react-parser": "^5.2.2",
    "imagesloaded": "^5.0.0",
    "isotope-layout": "^3.0.6",
    "isotope-packery": "^2.0.1",
    "jquery": "^3.6.0",
    "lodash": "^4.17.21",
    "mini-css-extract-plugin": "^2.9.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "remove-files-webpack-plugin": "^1.5.0",
    "sass-embedded": "^1.85.1",
    "storybook": "^8.6.6",
    "svg-sprite-loader": "^6.0.11",
    "svg-transform-loader": "^2.0.13",
    "terser-webpack-plugin": "^5.3.14",
    "tiny-slider": "^2.9.4",
    "twig": "^1.17.1",
    "yaml": "^2.7.0"
  }
```

### To-do

- [ ] **Remove** `add-attributes-twig-extension` — replaced by the in-repo
      `lib/addAttributesTwigExtension.js` created in Phase 4. Do not remove it before that
      file exists.
- [ ] **Add** `storybook` `^8.6.6` (the SB8 CLI package; `storybook dev` / `storybook build`
      come from it).
- [ ] **Bump** `html-react-parser` 1 → `^5.2.2`, `mini-css-extract-plugin` 1 → `^2.9.2`,
      `react`/`react-dom` 16 → `^19.0.0`, `remove-files-webpack-plugin` → `^1.5.0`,
      `sass-embedded` `^1.57.1` → `^1.85.1`, `svg-sprite-loader` → `^6.0.11`,
      `terser-webpack-plugin` → `^5.3.14`, `twig` → `^1.17.1`, `yaml` 1 → `^2.7.0`.
- [ ] **KEEP `jquery`** (deliberate deviation — see `README.md` § C).
- [ ] **KEEP** `@drupal/once`, `gsap`, `imagesloaded`, `isotope-layout`, `isotope-packery`,
      `lodash`, `tiny-slider` — SLAC-only, not in the diff.
- [ ] Note that `eslint-webpack-plugin`, `glob`, `inquirer`, `mkdirp`,
      `stylelint-webpack-plugin`, `svgo-loader` leave `dependencies` (they move to
      `devDependencies` per 1.4).
- [ ] Verify `sass` is **not** present (it isn't; this repo already uses `sass-embedded`).

### Breaking-change notes for the retained packages

| Package | 5.0.9 → 5.4.2 | What breaks |
| --- | --- | --- |
| `yaml` | 1 → 2 | Complete API rewrite (`parseMap`/`stringifyString` gone, custom tags now use `nodeClass`/`collection`). Drives the Phase 4 `lib/` rewrite. |
| `glob` | 7 → 11 | `glob.sync()` → `new Glob(...).iterate()`. Drives Phase 2's `webpack.common.js` entry rewrite. |
| `mkdirp` | 1 → 3 | Default export → named `{ mkdirp }`. Phase 4. |
| `inquirer` | 8 → 9 | ESM-only. Phase 4. |
| `react` / `react-dom` | 16 → 19 | `ReactDOMServer.renderToStaticMarkup` (used in `source/06-utility/storybookHelper.jsx`) still exists in 19 — no change needed. `React` import becomes optional under the SWC automatic JSX runtime but is harmless. |
| `html-react-parser` | 1 → 5 | `parse(html)` signature unchanged. No source changes expected. |
| `css-loader` | 6 → 7 | `esModule` default flipped; requires `esModule: false` (Phase 2). |
| `style-loader` | 3 → 4 | Requires webpack ≥5.27; no option changes needed. |
| `mini-css-extract-plugin` | 1 → 2 | `publicPath` loader option still supported; keep `publicPath: '../'`. |
| `svgo-loader` | 3 → 4 | **Pulls SVGO 3. Default preset strips `viewBox`.** See Phase 2, Step 2.7. |
| `webpack-cli` | 4 → 6 | Requires Node ≥18 and handles ESM config files. |
| `webpack-merge` | 5 → 6 | Named `{ merge }` export unchanged. |
| `stylelint` | 14 → 16 | Rule renames + `stylelint-config-prettier` removal. Phase 3. |
| `prettier` | 2 → 3 | Reformats source. Phase 3. |
| `concurrently` | 6 → 9 | `npm:script` shorthand supported (used in the new scripts). |

---

## 1.6 Install

- [ ] Delete `package-lock.json` and `node_modules`, then regenerate:

```bash
rm -rf node_modules package-lock.json && npm install
```

- [ ] Confirm `.npmrc` still contains `legacy-peer-deps=true`. It is very likely needed for
      the Storybook 8 + React 19 + `@types/react` 19 peer graph. If `npm install` still
      reports unresolvable peers, capture the output rather than force-resolving silently.
- [ ] `npm ls --depth=0` should show no `UNMET DEPENDENCY` lines.
- [ ] Commit the new `package-lock.json`. It is not gitignored and CI runs `npm ci`.

> Expect `npm install` to succeed while `npm run build` still fails — the build configs are
> not migrated until Phase 2.

---

## Definition of done

- `package.json` matches 1.2–1.5.
- `package-lock.json` regenerated and committed.
- `.nvmrc` unchanged at `22`.
- No SLAC-only package removed.
- `jquery` retained in `dependencies`.
