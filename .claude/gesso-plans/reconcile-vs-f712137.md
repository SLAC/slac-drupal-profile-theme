# Reconcile: the old upgrade (`f712137`) against the rebuild

The old squash-style upgrade branch, `f712137` (`667a195..f712137`, 13 commits), compared with the rebuild on `gesso-upgrade-hop-by-hop` at `deab886`. `.claude/` is excluded on both sides (the old branch's `gesso-upgrade-plan/` was deleted in `4e1bfdd`). STATE's rule: every difference must be a scope reversion (A), a W6-D9-aligned decision (B), a bug fix (C) or a dependency-resolution difference (D).

**Result: every differing path is A–D** (208 at `deab886`: the first pass's 211 less three `lib/` files that differed only by mode). The first pass (below, written against the working tree at `c50a18d` plus the uncommitted card-story fix) left 8 paths in four items it could not place (E); each was then resolved, and the commits after it (`5fb3806`, `857c851`, `ff5483f`, `deab886`) change nothing else the first pass classified:

| Item | Resolution | Now |
| --- | --- | --- |
| E-1 `build-assets.yml` keeps `main`'s `npm i -g npm@10` | Left as `main` has it: the rebuild's CI/release edits are the recorded hop-0 step E set (F-03), and the line is harmless under Node 22 (it installs an npm 10.x over npm 10.9.8). Dropping it, as the old branch did, is an optional follow-up. | A |
| E-2 five `lib/` files lost upstream's executable bit | A bug in `gesso-hop.sh take` (temp file + `mv`); fixed in `857c851`, which also makes `take` set upstream's mode. `CodeMap.cjs`, `readSource.cjs`, `renderSass.cjs` no longer differ; `transform.cjs` and `types.d.ts` differ only by their B content hunks. | C (fixed) |
| E-3 `slac.libraries.yml`: the old branch's `core/*` declarations on 8 libraries | Not carried, as W6-D9 `252b003d`, which adds only the common chunk (post-upgrade item 1). Every page has `core/drupal`, `core/drupalSettings` and `core/once` through `slac/global`, and `addtocal_a11y` (attached only by `libraries-extend` of `addtocal/addtocal`) gets `core/jquery` from the addtocal module's library, so nothing is missing at run time (checked read-only in the profile checkout). Declaring them is a recommended follow-up (a library-definition change for consumers, like the static `common:` library in the register's Known issues). | B |
| E-4 `card.stories.jsx`: `twigTemplate({ ...args })` in two stories | The fix for the item-10 finding (Twig.js writes `{% set %}` into the object it is given, and in Storybook 10 these two stories render with an args object that `card.twig`'s `{% set modifier_classes = '' %}` has already emptied): committed in `deab886` with its evidence (`post-upgrade.md` §10). | C |

The first pass also found two direct packages off upstream's tested version without a record (inside D): `postcss-selector-parser` is re-pinned to 7.1.4 (`5fb3806`), and `@typescript-eslint/*` 8.71.0 is flagged F-28; `directcheck.cjs` now catches this. (Correction to the first pass: `postcss-selector-parser` moved at hop 22 s4, `a45e8f2`, not hop 23.)

Observations, not differences to reconcile (pre-existing on `main`, kept): an unused `alertBarPlayFn` import in `05-pages/page-wrappers/default.jsx` and an unused `ReactDOMServer` import in `faq-landing.stories.jsx`; `publish-demo-site.yml`'s stale "4.x branch" comment. `ci.yml` triggers on pushes to `gesso-upgrade-hop-by-hop`, which goes stale after the merge (PR "Needs your action").

---

## First pass: scope and method

- **Differing paths: 211** (not the "about 207" estimated beforehand). 150 are `*.stories.jsx` files.
- **The rebuild changed during the analysis.**
  - `source/03-components/card/card.stories.jsx` was modified at 20:38 EDT, after the analysis started. It was already a differing path (CSF3 vs CSF2); its new hunk is item E-4, and it is still uncommitted.
  - Three commits landed while the analysis ran: `edf03d6` (post-upgrade item 2, `preview.js`), `c6968e0` (item 4, the 11 story imports) and `c50a18d` (item 5, the four Twig templates, flag F-27). They committed working-tree content that had already been analysed, and added `post-upgrade.md` sections 2, 4 and 5, flag F-27 and register updates, which this draft cites.
  - The 211 working-tree hashes were snapshotted at 20:49 and re-checked at 20:52 and 20:58, with no change. Anything edited after 20:58 is not covered.
- **Toolchain files** were compared by blob hash against upstream 5.4.6 (`~/.cache/gesso-slac/upstream`), against `main` (`667a195`) and between the two sides, then diffed by hand.
- **Story files** were checked mechanically with `storycmp.cjs`, a TypeScript-parser canonicaliser (committed at `.claude/gesso-harness/reconcile/`).
  - Each file is reduced to:
    - its imports;
    - its default export;
    - its export list;
    - per story, the render function and every property (`args`, `argTypes`, `parameters`, `storyName`/`name`, …);
    - helper declarations;
    - its comments.
  - Formatting, trailing commas and quote style are normalised away, as are the idioms the conversion itself changes: `X.render(…)` ↔ `X(…)`, `Template.bind({})` ↔ `Template`, `name` ↔ `storyName`, and arrow-body parentheses.
  - A second pass (`strcmp.cjs`, same directory) compares the multiset of every string, template, JSX-text and numeric literal per file, so string content cannot hide behind the normalisation.
  - A third run without the `f({ ...args })` ↔ `f(args)` normalisation isolated E-4.
  - **Result:** every old story file is CSF3, and every new one is CSF2. Beyond that conversion, the only differences are:
    - the 11 added side-effect imports;
    - 16 `eslint-disable` pragmas in 12 files, which the old branch removed;
    - one unused `ReactDOMServer` import, which the old branch removed;
    - E-4.
- **Category rule:** a path is **E** if any of its differences cannot be placed in A–D with evidence. Otherwise its category is the one that best describes the path, and the other hunks are named in its row.

## First pass: summary

| Category | Paths | What |
| --- | --- | --- |
| A. Scope reversion | **148** | 137 story files (CSF3 not redone), `page-wrappers/default.jsx` (CSF3 calls), the 6 `includes/*.inc` (PHP documented only), 4 Sass files (the unused container-query and svg-mask-image mixins) |
| B. W6-D9-aligned decision | **26** | 16 toolchain files (upstream-verbatim takes plus register rows, review-scope files hand-applied per STATE, and old-only files the register declines), 4 Sass forced edits (instead of the old branch's switched-off checks), 2 JS forced edits, 3 `.mdx` files, the deleted dead `mega-menu.stories.jsx` |
| C. Bug fix | **27** | `.storybook/main.js` (indexer), `.storybook/preview.js` (global behaviours), README corrections, CI/release fixes (`ci.yml`, `.gitattributes`), 7 stale `dist/images`, 4 Twig.js template fixes, 11 story files with per-story imports |
| D. Dependency resolution | **2** | `package.json`, `package-lock.json` |
| **E. Unexplained** | **8** | `build-assets.yml`, 5 `lib/` file modes, `slac.libraries.yml`, `card.stories.jsx` |
| Total | **211** | |

Not differing paths, because both sides agree: `theme-settings.php` (the re-landed fix, F-26), `source/03-components/card/_card.scss` (both sides use `math.div`), `slac.info.yml` (`'^10.3 || ^11'` on both), `tsconfig.json`, `eslint.config.js`, `webpack.production.js`, `webpack.dev.js`, all of `templates/`, and `includes/paragraph.inc`.

---

## First pass: E (unexplained), all resolved above

### E-1. `.github/workflows/build-assets.yml`: `npm i -g npm@10` kept

```diff
@@ -21,6 +21,7 @@ jobs:
           node-version-file: '.nvmrc'
           cache: npm
       - run: |
+          npm i -g npm@10
           npm ci
           npm run build
```

- **The two sides.** The rebuild keeps `main`'s line. The old branch dropped it, with a reason: old `phase-09-ci-and-release.md` §9.2 says "Node 22 ships npm 10 already, so the pin is redundant at best… drop the line (preferred)". The old README status table also says "`npm i -g npm@10` dropped".
- **No record.** No rebuild record mentions the line: STATE, the register, F-03 and `hop-00-prep.md` step E were all searched for `npm@10` and `npm i -g`. The rest of this file's diff is explained (C, F-03).
- **Inferred:** harmless under Node 22. `hop-00-prep.md` step B measured Node 22.23.2 with npm 10.9.8, so the line re-installs an npm 10.x. It is an unrecorded retention, not a decision.

### E-2. Five `lib/` files lost their executable bit

```diff
diff --git a/lib/CodeMap.cjs b/lib/CodeMap.cjs
old mode 100755
new mode 100644
diff --git a/lib/readSource.cjs b/lib/readSource.cjs
old mode 100755
new mode 100644
diff --git a/lib/renderSass.cjs b/lib/renderSass.cjs
old mode 100755
new mode 100644
diff --git a/lib/transform.cjs b/lib/transform.cjs
old mode 100755
new mode 100644
diff --git a/lib/types.d.ts b/lib/types.d.ts
old mode 100755
new mode 100644
```

- **Everyone else has 100755:** upstream (5.0.9 through 5.4.6), `main` (as the `.js` predecessors), W6-D9's tip and `f712137`.
- **Where the rebuild dropped it:**
  - at hop 1 (`c705c40`) for `lib/transform.js`;
  - at hop 12 (`e45ec2c`) for `CodeMap.js`, `readSource.js`, `renderSass.js` and `types.d.ts`.

  The modes carried through the later `.cjs` renames.
- **Content:**
  - `CodeMap.cjs`, `readSource.cjs` and `renderSass.cjs` are byte-identical on both sides and to upstream, so the mode is their only difference.
  - `transform.cjs` and `types.d.ts` also have content hunks, which are B (see the toolchain table).
- **Inferred cause:** `gesso-hop.sh` `cmd_take` (line 269) writes `git show … > "$p.take.$$"` and then `mv`s it over the target, so the new file gets the umask mode instead of upstream's. No record, flag or register row mentions file modes.
- **Inferred impact:** none at run time. Nothing executes these files directly: they are `require`d or imported by Node, or read by `tsc`.

### E-3. `slac.libraries.yml`: the old branch's `core/*` dependency declarations are neither carried nor addressed

`git diff f712137 -- slac.libraries.yml` (`-` is old, `+` is new):

```diff
@@ -38,7 +38,7 @@ addtocal_a11y:
   js:
     dist/js/addtocal-a11y.es6.js: {}
   dependencies:
-    - core/jquery
+    - slac/common
 
 alert_bar:
   css:
@@ -46,6 +46,8 @@ alert_bar:
       dist/css/alert-bar.css: {}
   js:
     dist/js/alert-bar.es6.js: {}
+  dependencies:
+    - slac/common
 
 back_to_top:
   css:
@@ -54,8 +56,7 @@ back_to_top:
   js:
     dist/js/back-to-top.es6.js: {}
   dependencies:
-    - core/drupal
-    - core/drupalSettings
+    - slac/common
 
 drawer:
   css:
@@ -65,7 +66,6 @@ drawer:
     dist/js/drawer.es6.js: {}
   dependencies:
     - slac/common
-    - core/drupal
 
 dropbutton:
   js:
@@ -74,6 +74,7 @@ dropbutton:
     component:
       dist/css/dropbutton.css: {}
   dependencies:
+    - slac/common
     - core/jquery
     - core/drupal
     - core/drupalSettings
@@ -88,9 +89,6 @@ dropdown_menu:
   dependencies:
     - slac/common
     - slac/mobile_menu
-    - core/drupal
-    - core/drupalSettings
-    - core/once
 
 dropdown_widget:
   js:
@@ -98,7 +96,6 @@ dropdown_widget:
   dependencies:
     - slac/common
     - core/drupal
-    - core/drupalSettings
     - facets/widget
     - core/once
 
@@ -197,7 +194,6 @@ overlay_menu:
   dependencies:
     - slac/common
     - slac/hamburger_button
-    - core/drupal
 
 people_profile:
   css:
@@ -224,7 +220,6 @@ social_share:
     dist/js/social-share.es6.js: {}
   dependencies:
     - slac/common
-    - core/drupal
 
 tabs:
   css:
@@ -244,7 +239,6 @@ tooltip:
     dist/js/tooltip.es6.js: {}
   dependencies:
     - slac/common
-    - core/drupal
     - core/once
 
 views-toggle:
```

- **The `+` lines are explained (C).** They are post-upgrade item 1: `slac/common` on `addtocal_a11y`, `alert_bar`, `back_to_top` and `dropbutton`. See `post-upgrade.md` §1 and the register's Known issues (first row). It is the same change as W6-D9 `252b003d`. W6-D9's commit also covered a fifth library, `filter_modal`; SLAC's `libcheck` reports every chunk-dependent library OK without it (`post-upgrade.md` §1).
- **The `-` lines are not explained.** The old branch (`6c15040`, old `phase-08-drupal-php-and-twig.md` §8.6) added `core/*` dependencies to 8 libraries whose `dist/js` entries import `drupal`, `once` or `jquery` without declaring them. It called `back_to_top`'s gap "a genuine latent bug".
- **The dependencies match the source.** Checked in this analysis:
  - `addtocal-a11y.es6.js` imports `jquery`;
  - `back-to-top`, `drawer`, `overlay-menu` and `social-share` import `drupal`;
  - `dropdown-menu`, `tooltip` and `dropdown-widget` import `drupal` and `once`.
- **The rebuild keeps `main`'s declarations.** These libraries rely on `slac/global`, which is attached site-wide and declares `core/drupal`, `core/drupalSettings` and `core/once`. `addtocal_a11y` is attached through `libraries-extend` (old plan §8.6).
- **No record weighs it.** No rebuild record mentions or evaluates these additions. STATE trap S9 ("the old branch is an oracle, not a source") says why nothing was taken, not whether this change should be.
  - Candidate category A: `slac.libraries.yml` is SKIP scope, and W6-D9 added only `gesso/common`. That needs a recorded decision to count.
  - Candidate category C: a follow-up that declares the `core/*` dependencies.

### E-4. `source/03-components/card/card.stories.jsx`: an uncommitted render change with no record of the fix

This change appeared in the working tree during this analysis (modified 20:38 EDT). Against `HEAD`:

```diff
@@ -52,7 +52,7 @@ Default.argTypes = {
   },
 };
 
-const CardWithIcon = args => parse(twigTemplate(args));
+const CardWithIcon = args => parse(twigTemplate({ ...args }));
 CardWithIcon.args = {
   ...Default.args,
   media: false,
@@ -64,7 +64,7 @@ CardWithIcon.argTypes = {
   ...Default.argTypes,
 };
 
-const CardNoImage = args => parse(twigTemplate(args));
+const CardNoImage = args => parse(twigTemplate({ ...args }));
 CardNoImage.args = { ...Default.args, media: false, icon: false };
 CardNoImage.argTypes = {
   ...Default.argTypes,
```

- **Old against new.** The old side is a clean CSF3 conversion of `main`: `render: args => parse(twigTemplate(args))` for both stories. So, apart from CSF3 (A), this hunk is the only difference.
- **Not a per-story import.** It is not one of the 11 one-line side-effect imports (`c6968e0`).
- **The records name the problem but not this fix.** `post-upgrade.md` §2 says the two stories that still miss a class the 6.5 reference renders are "Card With Icon and Card No Image, `c-card--no-link`: a Storybook 10 args issue, item 10". No record describes this edit as the fix, or proves it.
- **It is not a file-wide change.** `News` in the same file still calls `twigTemplate(args)`.
- **Other files use these stories.** `CardWithIcon`/`CardNoImage` are used by `card--small.stories.jsx` and `05-pages/page-2.stories.jsx`.
- **Inferred:** it is the in-progress fix for that item-10 finding. Once it is committed with a `post-upgrade.md` entry it becomes C.

### Record gaps inside paths classified A–D (not reclassified; listed so nothing is hidden)

1. **`package-lock.json` (D): two direct-dependency resolutions no record explains.**
   - **`@typescript-eslint/eslint-plugin` and `parser` 8.71.0.** Upstream 5.4.6 tests 8.63.0, and `f712137` has 8.68.0. They moved 8.29.0 → 8.71.0 at hop 20 s3 (`f9a65e5`), where upstream 5.4.3 tested 8.38.0. `hop-20-5.4.3-stage3.md` says "every moved direct package at upstream 5.4.3's tested version, except the standing advisory carve-outs", and these packages are not in that carve-out list.
   - **`postcss-selector-parser` 7.1.6.** Upstream 5.4.6 tests 7.1.4. It moved 7.1.3 → 7.1.6 at hop 22 s4 (`a45e8f2`; the first pass said hop 23), and no hop plan lists it as a carve-out after F-16's 7.1.3.
   - Both are lint tooling that never reaches `dist/`.
2. **Resolved during the analysis.** Two gaps found earlier were closed by commits `edf03d6`, `c6968e0` and `c50a18d`:
   - the pager capture placement, which departs from W6-D9 `631e47ef`, now has flag **F-27**;
   - `post-upgrade.md` now has sections for items 2, 4 and 5.

### Observations (not reconcile differences)

- **Two unused imports the old branch removed, and the rebuild keeps as `main` had them:**
  - `source/05-pages/page-wrappers/default.jsx` imports `alertBarPlayFn`, which `alert-bar.stories.jsx` does not export on either side;
  - `source/05-pages/faq-landing.stories.jsx` imports `ReactDOMServer` and never uses it.

  Both are pre-existing, and neither is in the register's Known issues.
- **`publish-demo-site.yml`** keeps `main`'s stale comment "…only for the 4.x branch". The old branch corrected it.
- **`ci.yml`** triggers on pushes to `gesso-upgrade-hop-by-hop`. That trigger goes stale after the merge.

---

## Toolchain

Here "up" means upstream 5.4.6, "old" is `f712137` and "new" is the rebuild's working tree.

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `.dockerignore` | B | Old deleted it (with the Dockerfile). New keeps it; new = up = main | `hop-09-5.2.2.md` ("kept; byte-identical to upstream"), STATE hop table row 9, as W6-D9 `9d605a07`. Old's reason: old phase-09 §9.3 |
| `.gitattributes` | C | New only: `/.claude export-ignore` | `hop-00-prep.md` step E3; F-03; STATE Decisions "Records" (committed records must not ship). Old deleted its plan directory instead (`4e1bfdd`) |
| `.github/workflows/build-assets.yml` | **E** | (a) Zip exclusions become `'*.git* *node_modules* .editorconfig *.claude*'` with a comment; old has `'… source/* gesso-upgrade-plan*'`. (b) New "Check release zip contents" step. (c) `notify-satis` gains `needs: build_gesso`. (d) New keeps `npm i -g npm@10`, which old dropped | (a)–(c) C: `hop-00-prep.md` E2/E3 (old's `source/*` pattern excluded nothing; measured there), F-03. (d) **E-1** |
| `.github/workflows/ci.yml` | C | New only: `npm ci`, build, lint, `build-storybook` on PRs and pushes | `hop-00-prep.md` E1; F-03; STATE Decisions "CI/release fixes" |
| `.github/workflows/publish-demo-site.yml` | B | Neither side = up; both hand-apply upstream's `upload-pages-artifact` → `deploy-pages` workflow. New: `upload-pages-artifact` v5.0.0 and `deploy-pages` v5.0.1 SHA pins (old: v3.0.1 / v4.0.5); build job `permissions: contents: read` (old declares none); setup-node step unnamed; `main`'s `branches: [ main ]` and comment line kept (old rewords the comment and reformats `branches` as a block list) | REVIEW scope (STATE Scope rules); `hop-13-5.2.6.md` Applied table; register "publish-demo-site.yml: SLAC edits"; F-12; A-1 |
| `.gitignore` | B | New = main + `debug-storybook.log`. Old lacks that line and adds a `gesso-update-diff.diff` block ("Generated by the gesso-upgrader skill") | F-21; register row "`.gitignore`: `debug-storybook.log`". The old block ignores output of the gesso-upgrader plugin, which the rebuild does not use (STATE Environment: "Do not use that plugin"; inferred link) |
| `.nvmrc` | B | Old `24`; new `22` (= main, no trailing newline; up and W6-D9 are also 22) | STATE Decisions "Node"; register row "`.nvmrc` is 22, never upstream's" |
| `.storybook/decorators.jsx` | B | New only; new = up (`withGlobalWrapper`, used by no story) | `hop-10-5.2.3.md` (taken verbatim, as W6-D9 `b6ad1671`). Old skipped it on purpose (old plan README, phase 5 row) |
| `.storybook/main.js` | C | New = up + the export-list story-name indexer: `readFile`/`storyNameFromExport` imports, `nameExportListStories`, `experimental_indexers`. Old = up with local edits the rebuild does not carry: an 11-line `__dirname` comment (it says `createRequire` breaks the build; the rebuild uses upstream's shim, and `hop-23-5.4.6.md` records `build-storybook` exit 0 and the dev smoke test PASS); no `createRequire` shim and a bare `'path-browserify'` fallback; `embeddedSass`/`storybookConfig`/`config` names; addon order; no DDEV comment; `silenceDeprecations: ['if-function']`; a Storybook `jquery: 'jQuery'` external; `config.performance = { hints: false }` | C: `post-upgrade.md` §3; register Storybook row "export-list story names" (W6-D9 `9eb93a52`). The rest is B: register "Deliberately not adopted" (the `if-function` silence); register `preview.js` row ("no Storybook jQuery external"); STATE W2 (the `createRequire` shim is atomic with SB10, hop 21 s2); the register says `main.js` is otherwise upstream's |
| `.storybook/preview.js` | C | New imports `arrow-link.es6`, `external-link.es6` and `06-utility/transitions.es6`. Old also imports `subheadingLevel` and `./stubs/jquery`, puts `layout` before `controls`, and uses `viewport: { viewports: … }`. New uses up's order and `viewport: { options: … }`. Neither = up: new is up without `html.es6` and `subheadingLevel`, plus viewports, `'Paragraphs'` and the three imports | C: `post-upgrade.md` §2, commit `edf03d6` (W6-D9 `136d9207`); register `preview.js` row; the README documents it. B hunks: register Twig-parity row (`subheadingLevel` not adopted); register `preview.js` row (no jQuery stub); F-19 (SB9 renamed `viewports` → `options` and ignores the old key, so old's device list would not apply; inferred from F-19) |
| `.storybook/stubs/drupal.js` | B | New = up except `imagePath` → `gessoImagePath`. Old also drops up's three `externalLink*` keys and destructures `const { behaviors } = Drupal` | `hop-01-5.0.10.md`, `hop-14-5.2.7.md`, `hop-19-5.4.2.md` ("upstream's three `externalLink*` keys come along (nothing reads them)"); register "gessoImagePath in the Drupal stub and @types"; trap S11 |
| `.storybook/stubs/jquery.js` | B | Old only (it publishes `window.jQuery` for old's Storybook external). Up, main and W6-D9 have none | Register `preview.js` row ("no Storybook jQuery external or `stubs/jquery.js` (W6-D9 and `main` have none)"); `post-upgrade.md` §8b |
| `.storybook/theme.js` | B | Only the `brandImage` line wrap differs: new keeps main's two-line layout, old joins it. Both carry SLAC branding; neither = up | Register "Branding" row (take only Storybook API/key changes) |
| `.stylelintrc.yml` | B | Same rule on both sides (`selector-max-compound-selectors: null`); old adds a 4-line `# DEVIATION:` comment. New = up + that rule | Register row "`.stylelintrc.yml` `selector-max-compound-selectors: null`"; STATE standing instructions (one-line markers, detail in the register; the old README's "say why inline" convention is superseded) |
| `.swcrc` | B | New = up byte-for-byte (its indentation and trailing commas); old re-indented | `hop-16-5.3.2-stage3.md` (taken verbatim); as W6-D9 `7a837508` |
| `README.md` | C | New = old's SLAC README, corrected. Node 22; a CSF2 section; story naming and per-story imports; `decorators.jsx` exists; `common.js` comes from both builds and `splitChunks` is in `webpack.common.js`; no Storybook jQuery external; token examples `cardinal` / `4`; the container-query and svg-mask-image sections removed; `unique_id` renamed at 5.4.0 and reverted at 5.4.5; `subheading_level` in neither Storybook nor Drupal; the register convention; the release zip and Satis text | `post-upgrade.md` §8b (every hunk maps to a correction listed there); F-01; STATE Decisions "README.md". Several corrections follow from A/B decisions (CSF2, mixins, jQuery). The others fix statements that were wrong in the old text too (release numbers, token names) |
| `lib/CodeMap.cjs` | **E** | Mode only: old 100755 (= up), new 100644; content = up on both sides | **E-2** |
| `lib/component.js` | B | New = up + the four theme-name sites, each with a `// Local:` marker except the missing-file message ("not called slac"). Old lacks up's `/* eslint-env node */` line, has no markers, and keeps "not called gesso" | Register `lib/component.js` row; F-22 (hop 21 s3) |
| `lib/readSource.cjs` | **E** | Mode only, as `CodeMap.cjs` | **E-2** |
| `lib/renderSass.cjs` | **E** | Mode only, as `CodeMap.cjs` | **E-2** |
| `lib/subheadingLevelTwigExtension.js` | B | Old only (= up). It is registered in old's `preview.js`, with no Drupal counterpart | Register Twig-parity row "`subheadingLevelTwigExtension.js` not adopted" (hop 17): `slac_helper` has no PHP half, so both halves or neither. W6-D9's tip has no copy either |
| `lib/transform.cjs` | **E** | Content: new = up + the `font-feature-settings` branch with a one-line `// Local:` marker. Old has the branch without a marker and drops up's three `eslint-disable-next-line` comments. Mode: old 100755 (= up), new 100644 | Content B: register row "`lib/transform.js` / `.cjs` font-feature-settings branch", F-06. Mode: **E-2** |
| `lib/types.d.ts` | **E** | Content: new = up; old adds Prettier trailing commas to two type-parameter lists. Mode: old 100755 (= up and main), new 100644 | Content B: `hop-16-5.3.2-stage2.md` (taken verbatim). Mode: **E-2** |
| `webpack.common.js` | B | New = up + two `// Local:` lines (StylelintPlugin `files: 'source'` and the `jquery` external). Old has the same two settings with multi-line comments, and also: `SvgSpritemapPlugin` import and `ForkTsCheckerWebpackPlugin` moved; `optimization` moved after `module`; an svgo comment; `silenceDeprecations: ['if-function']` | Register rows StylelintPlugin (F-04) and `jquery` external; `hop-23-5.4.6.md` ("Residual against upstream 5.4.6: those two lines"); register "Deliberately not adopted" (the `if-function` silence) |
| `webpack.react-config.js` | B | New only; new = up. Neither side's scripts run it | Register row "`webpack.react-config.js` taken but wired into nothing" (hop 12, as W6-D9) |
| `webpack.theme-config.js` | B | New = up; old adds `/* eslint no-console: "off" */` | `hop-11-5.2.4.md` (taken verbatim); STATE Scope rules (take, don't hand-merge) |
| `source/@types/drupal/index.d.ts` | B | New only; = up with `imagePath?` → `gessoImagePath?` | `hop-01-5.0.10.md` (taken; TOOLCHAIN includes `source/@types`), `hop-14-5.2.7.md`, `hop-19-5.4.2.md`; register "gessoImagePath" row |

## Dependencies

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `package.json` | D | 11 dependency entries differ, plus `overrides` (table below). `version`, `scripts`, `browserslist` and every other field are identical. Neither side runs upstream's React build steps | Per entry below: register Dependencies section; STATE Dependency policy |
| `package-lock.json` | D | Both are lockfile v3. Old 1161 package entries, new 1051 (upstream 5.4.6: 1151). Paths only in old: 212; only in new: 102; same path, different version: 328. 103 package names are only in old, 5 only in new. Direct dependencies at upstream 5.4.6's tested versions: new 58 of the 63 that upstream's lockfile has; old 36 of 65. Of new's 793 top-level transitive entries, 554 equal upstream's and 236 equal `main`'s. Old's history regenerated the lockfile (STATE trap S9); the rebuild's evolved from `main`'s, with rewinds (F-08) | STATE Decisions "Lockfile"; register "Lockfile never regenerated", "Transitive lockfile drift rewound" (F-08), "Output-generating packages pinned", and the carve-out rows (F-09, F-10, F-16). Two resolutions have no record (see Record gaps, item 1) |

**`package.json`: every dependency whose range, section or presence differs**

| Package | Old | New | Upstream 5.4.6 | Why / where recorded |
| --- | --- | --- | --- | --- |
| `@forumone/eslint-config-es5` | dev `^4.0.0` | dev `4.0.0` (exact) | dev `^4.0.0` | Register "`@forumone/eslint-config-es5` / `-react` pinned exactly" (W6-D9's second reason: the eslint config decides whether `build` passes) |
| `@forumone/eslint-config-react` | dev `^3.0.7` | dev `3.0.7` (exact) | dev `^3.0.7` | Same row |
| `@swc/cli` | dev `^0.8.1` | absent | dev `^0.8.1` | Register "Not introduced: `@swc/cli`, `svgo`" (as W6-D9; nothing runs the swc CLI) |
| `svgo` | dev `^4.0.2` | absent (resolves 4.1.0 as the sprite plugin's peer) | dev `^4.0.2` | Same row, plus `svgo` 4.1.0 carve-out (F-16) |
| `@types/jquery` | absent | dev `3.2` | absent | Register "`jquery` kept" row ("`@types/jquery` 3.2 kept with it"); introduced with upstream 5.0.10's TypeScript packages at hop 1 (`c705c40`) and kept when upstream dropped jQuery at 5.2.5 |
| `jquery` | dep `^3.6.0` (= main) | dep `^3.6.3` | absent | Register "`jquery` kept" row: `^3.6.3`, upstream's last range before removal, as W6-D9 |
| `eslint-webpack-plugin` | dev `^6.0.0` | dep `^6.0.0` | dev | Section placement kept as `main`'s: `hop-16-5.3.2-stage4.md` ("package sections left where they were (W6-D9 kept them)"), `hop-18-5.4.1.md`, `hop-22-5.4.5-stage3.md` |
| `fork-ts-checker-webpack-plugin` | dev `^9.1.0` | dep `^9.1.0` | dev | Same (upstream 5.0.10 declared it in `dependencies`; moved at 5.3.2) |
| `glob` | dev `^13.0.6` | dep `^13.0.6` | dev | Same (`hop-18-5.4.1.md`) |
| `stylelint-webpack-plugin` | dev `^5.1.0` | dep `^5.1.0` | dev | Same (`hop-16-5.3.2-stage1.md`: "`^5.0.0` in our `dependencies`, as W6-D9") |
| `webpack-merge` | dev `^6.0.1` | dep `^6.0.1` | dev | Same (`hop-18-5.4.1.md`) |
| `overrides.terser` | absent | `5.49.0` | absent | Register "Output-generating packages pinned…" (W6-D9's decision from 5.4.3 s3; upstream 5.4.6's lockfile version) |
| `overrides.minimizer-webpack-plugin` | absent | `5.6.1` | absent | Register row "`overrides`: `minimizer-webpack-plugin` 5.6.1"; F-25 |

**`package-lock.json`: direct dependencies whose resolution differs**

| Package | Old | New | Upstream 5.4.6 | Note |
| --- | --- | --- | --- | --- |
| Storybook set (`storybook`, `@storybook/addon-a11y`, `-docs`, `-links`, `react-webpack5`, `eslint-plugin-storybook`) | 10.5.10 | 10.5.0 | 10.5.0 | New at upstream's tested version (`hop-23-5.4.6.md`) |
| `webpack` | 5.110.0 | 5.108.4 | 5.108.4 | Output-generating, pinned (register) |
| `sass-embedded` | 1.103.1 | 1.100.0 | 1.100.0 | Output-generating, pinned |
| `terser` (transitive) / `minimizer-webpack-plugin` (transitive) | 5.51.2 / 5.8.0 | 5.49.0 / 5.6.1 | 5.49.0 / 5.6.1 | `overrides`; F-25 |
| `autoprefixer`, `caniuse-lite`, `browserslist` | 10.5.4, 1.0.30001810, 4.28.8 | 10.5.2, 1.0.30001805, 4.28.6 | the same as new | Output-generating, pinned (`hop-23-5.4.6.md` driftcheck) |
| `@swc/core`, `core-js` | 1.16.1, 3.50.0 | 1.15.43, 3.49.0 | the same as new | Upstream's tested versions |
| `react`, `react-dom`, `@types/react`, `@types/react-dom`, `html-react-parser` | 19.2.8, 19.2.8, 19.2.18, 19.2.5, 6.1.7 | 19.2.7, 19.2.7, 19.2.17, 19.2.3, 6.1.4 | the same as new | Upstream's tested versions |
| `@forumone/eslint-config-es5` / `-react` | 4.0.1 / 3.0.8 | 4.0.0 / 3.0.7 | 4.0.0 / 3.0.7 | Exact pins (register) |
| `prettier`, `stylelint`, `webpack-cli`, `@inquirer/prompts`, `@pmmmwh/react-refresh-webpack-plugin` | 3.9.6, 17.14.1, 7.2.2, 8.7.0, 0.6.3 | 3.9.5, 17.14.0, 7.2.1, 8.5.2, 0.6.2 | the same as new | Upstream's tested versions |
| `concurrently` | 10.0.5 | 10.0.4 | 10.0.3 | Carve-out: upstream's 10.0.3 pins `shell-quote` 1.8.4 (GHSA-395f); F-16 |
| `postcss` | 8.5.26 | 8.5.28 | 8.5.19 | Already newer, never downgraded (`hop-19-5.4.2.md`: "`postcss` and `svgo`, which were already newer") |
| `@typescript-eslint/eslint-plugin`, `parser` | 8.68.0 | 8.71.0 | 8.63.0 | **No record** (Record gaps, item 1) |
| `postcss-selector-parser` | 7.1.5 | 7.1.6 | 7.1.4 | **No record** for 7.1.6 (the register's carve-out row is for 7.1.3; Record gaps, item 1) |
| `gsap`, `jquery` | 3.15.0, 3.7.1 | 3.11.5, 3.6.4 (= main) | absent | Site-only dependencies left at `main`'s resolution (`hop-00-prep.md` E4: "Leave gsap and jquery alone; W6-D9 did"). `gsap` is bundled into `dist/js`, so old's float would have changed output (inferred) |
| `@swc/cli` / `@types/jquery` | 0.8.1 / absent | absent / 3.2.18 | 0.8.1 / absent | Follow the `package.json` entries above |

## Stories (150 `*.stories.jsx`, 3 `.mdx`, `page-wrappers/default.jsx`)

**Mechanical result** (method under "Scope and method"):
- all 150 old story files use CSF3 object stories, and all 150 new ones CSF2 function stories;
- export lists and default exports are identical in every file present on both sides;
- after canonicalisation, the story bodies and properties are identical in every file except `card.stories.jsx` (E-4);
- every string, template, JSX-text and numeric literal is identical, except the 11 added imports and the one removed `react-dom/server` import;
- the only comment differences are 16 `eslint-disable` pragmas in 12 files, which the old branch removed (its phase-06 definition of done required `npx eslint source` to pass; the rebuild never fixes story lint: STATE standing instructions, W6-D9 trap 3).

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `source/01-global/global.mdx` | B | Old adds the header `{ /* global.mdx */ }`; new has none. Both import `Meta` from `"@storybook/addon-docs/blocks"` | Register forced edits 16 s4 and 20 s2 (the `.stories.mdx` → `.mdx` rename and the import swaps, as W6-D9, "our quote styles kept"). Old's header comes from old `phase-05-storybook-8.md` §5.7 (inferred to be modelled on upstream's `{ /* Global.stories.mdx */ }`) |
| `source/03-components/dropdown-menu/dropdown-menu.mdx` | B | New = up (single quotes, no header); old adds `{ /* dropdown-menu.mdx */ }` and uses double quotes | Same rows |
| `source/03-components/mega-menu/mega-menu.mdx` | B | New = up; old adds a header and uses double quotes | Same rows |
| `source/05-pages/page-wrappers/default.jsx` | A | Old calls the stories as CSF3 objects (`AlertBar.render(AlertBar.args)` and 7 more) and drops the dangling `alertBarPlayFn` import. New = main (CSF2 calls, import kept) | STATE Decisions "Stories" (CSF2). Old README phase 6 row: "30 modules called stories as functions … rewritten to `X.render(...)`, incl. … `default.jsx`" |
| `source/01-global/00-colors/color.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/01-typography/fonts.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/01-typography/line-height.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/01-typography/text-styles.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/01-typography/typographic-scale.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/02-spacing/space.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/03-box-shadow/shadows.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/04-transitions/duration.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/04-transitions/easing.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/13-headings/headings.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/14-paragraph/paragraph.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/15-inline-elements/inline-elements.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/16-blockquote/blockquote.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/17-preformatted-text/preformatted-text.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/18-horizontal-rule/horizontal-rule.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/19-address/address.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/20-unordered-list/unordered-list.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/21-ordered-list/ordered-list.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/23-definition-list/definition-list.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/24-table/table-with-column-and-row-headers.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/24-table/table-with-row-headers.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/html-elements/24-table/table.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/images/hero-image.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/01-global/images/thumbnail-image.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/constrain/constrain.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/content/content.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/footer/footer.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/global-header/global-header.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/grid/grid.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/header/header.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/inline-form/inline-form.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/internal-header/internal-header.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/media/media.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/nav/nav.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/region/region.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/responsive-table/responsive-table.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/section/section.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/sidebar/sidebar.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/site-container/site-container.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/02-layouts/subfooter/subfooter.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../../03-components/back-to-top/back-to-top.stories'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/accordion/accordion.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/alert-bar/alert-bar.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 1 eslint-disable pragma(s) (eslint-disable) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/03-components/arrow-link/arrow-link.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/article-hero/article-hero.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../tooltip/tooltip.stories'`; old also dropped 1 eslint-disable pragma(s) (react/destructuring-assignment) | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/article/article.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/author/author.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/back-to-top/back-to-top.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/block/block.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); both sides export these once-dead stories (old in CSF3; new in CSF2 via hop-00 D8 `6d705b3`, F-02) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/breadcrumb/breadcrumb.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/button-group/button-group.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/button/button.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/callout-box/callout-box.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/card/card--link/card--link.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/card/card--small/card--small.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/card/card.stories.jsx` | **E** | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); **new (uncommitted, appeared during this analysis): `CardWithIcon`/`CardNoImage` render `twigTemplate({ ...args })` instead of main's and old's `twigTemplate(args)`** | **E-4** (the CSF3 part is A) |
| `source/03-components/citation/citation.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/cookie-banner/cookie-banner.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/copyright/copyright.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/cta-link/cta-link.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/details/details.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/drawer/drawer.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/dropbutton/dropbutton.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); both sides export these once-dead stories (old in CSF3; new in CSF2 via hop-00 D8 `6d705b3`, F-02) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/dropdown-menu/dropdown-menu.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/embed/embed.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/event-date/event-date.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/event-details/event-details.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/event-list/event-list.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/expandable-grid/cards-with-show-more.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../drawer/drawer.stories'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/expandable-grid/expandable-grid.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../drawer/drawer.stories'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/expandable-list/expandable-list.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../drawer/drawer.stories'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/external-link/external-link.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/feedback-form/feedback-form.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/field/field.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); both sides export these once-dead stories (old in CSF3; new in CSF2 via hop-00 D8 `6d705b3`, F-02) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/fieldset/fieldset.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); both sides export these once-dead stories (old in CSF3; new in CSF2 via hop-00 D8 `6d705b3`, F-02) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/fifty-fifty/fifty-fifty.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/figure/figure.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../media-lightbox/media-lightbox.stories'`; old also dropped 3 eslint-disable pragma(s) (react/destructuring-assignment) | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/file/file.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/filter-modal/filter-modal.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/form-item/form-item--checkbox/form-item--checkbox.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/form-item/form-item--checkboxes/form-item--checkboxes.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/form-item/form-item--radio/form-item--radio.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/form-item/form-item--radios/form-item--radios.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/form-item/form-item--select/form-item--select.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/form-item/form-item--textarea/form-item--textarea.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/form-item/form-item--textfield/form-item--textfield.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/hero-bg-image/hero-bg-image.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../tooltip/tooltip.stories'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/icon/icon.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/kicker/kicker.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/lede/lede.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/lightbox/lightbox.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import './lightbox.es6'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/list/list.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/logo/logo.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/map/map.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/media-grid/media-grid.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/media-lightbox/media-lightbox.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 1 eslint-disable pragma(s) (camelcase) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/03-components/mega-menu/mega-menu.stories.jsx` | B | Deleted in the rebuild. Old kept the file (every line commented out) and appended `export default {};` | STATE hop table row 7 and register Known issues (last row): SB7 rejects a file with no default export; deleted as W6-D9 deleted its dead stories; `record-stories` at hop 7 (register Compiled-output row "7 (5.2.0) story baseline") |
| `source/03-components/menu/menu--account/menu--account.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/menu/menu--footer-utility/menu--footer-utility.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/menu/menu--footer/menu--footer.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/menu/menu--side/menu--side.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/menu/menu--subfooter/menu--subfooter.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/menu/menu.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/message/message.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/overlap-image/overlap-image.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../tooltip/tooltip.stories'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/overlay-menu/overlay-menu.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../hamburger-button/hamburger-button.scss'` | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/03-components/page-title/page-title.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/pager/pager.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/progress/progress.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/promo-box/promo-box.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/quote/quote.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/readmore-link/readmore-link.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/rss-feed/rss-feed.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/search-result/search-result.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/search/search.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/section-search/section-search.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/site-name/site-name.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/site-slogan/site-slogan.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/small-paragraph/small-paragraph.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/social-links/social-links.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/social-share/social-share.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/tabs/tabs.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/tag-list/tag-list.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/tag/tag.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/text-block/text-block.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/tooltip/tooltip.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/two-column-hero/two-column-hero.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/video/video.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/view/views-view--accordion/views-view--accordion.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/view/views-view--toggle/views-view--toggle.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/view/views-view-grid/views-view-grid.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/view/views-view-list/views-view-list.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/view/views-view-unformatted/views-view-unformatted.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/view/views-view/views-view.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/wide-card/wide-card.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/03-components/wysiwyg/wysiwyg.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/04-templates/event-detail/event-detail.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/04-templates/faq/faq.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/04-templates/news-article-detail/news-article-detail.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/04-templates/page/page.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/04-templates/people-profile/people-profile.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/04-templates/publication-detail/publication-detail.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/05-pages/article.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 1 eslint-disable pragma(s) (camelcase) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/05-pages/event-detail.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 1 eslint-disable pragma(s) (camelcase) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/05-pages/faq-landing.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped the unused `import ReactDOMServer from 'react-dom/server'` (new keeps main's); old also dropped 1 eslint-disable pragma(s) (camelcase) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/05-pages/homepage.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3) |
| `source/05-pages/news-landing.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 1 eslint-disable pragma(s) (camelcase) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/05-pages/page-2.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 2 eslint-disable pragma(s) (camelcase, react/jsx-props-no-spreading) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/05-pages/page.stories.jsx` | C | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); new adds `import '../03-components/tabs/tabs.stories'`; old also dropped 2 eslint-disable pragma(s) (camelcase, react/jsx-props-no-spreading) | `post-upgrade.md` §4, per-story component imports, commit `c6968e0` (W6-D9 `aa9d08f1`; list computed by `gesso-harness/storydeps.mjs`). The rest is the CSF3 scope reversion (A) |
| `source/05-pages/people-profile.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 1 eslint-disable pragma(s) (camelcase) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |
| `source/05-pages/publication-detail.stories.jsx` | A | Old: CSF3 object stories (`render`/`args`); new: CSF2 function stories with `.args` (main's form); old also dropped 1 eslint-disable pragma(s) (camelcase) | STATE Decisions "Stories" (stay CSF2, as W6-D9); register "Deliberately not adopted" (CSF3); story lint is not fixed (STATE standing instructions, W6-D9 trap 3); old phase-06 DoD required `npx eslint source` clean |

## Sass

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `source/00-config/_config.settings.scss` | A | Old adds `$container-queries-rems: true !default;` | Belongs to the container-query mixin: register "Deliberately not adopted"; STATE reconcile list ("the unused mixins"); old README phase 7 row |
| `source/00-config/functions/_iff.scss` | B | New = up (`if(sass($condition): $if-true; else: null)`). Old = main (`if($condition, $if-true, null)`), with the deprecation silenced in both webpack configs | Register forced edit 21 s4; register "Deliberately not adopted" (`silenceDeprecations: ['if-function']`); STATE Scope rules ("never switch off a check") |
| `source/00-config/mixins/_button.scss` | B | New: upstream's `order/order` reorder (the `@if` border blocks after the plain declarations). Old: the original order under a `stylelint-disable order/properties-alphabetical-order` block with a 6-line comment | Register forced edit 16 s1 ("taken, not disabled") and "Deliberately not adopted"; `hop-16-5.3.2-stage1.md`; pinned in `expected-since-5.3.2/` (cssequiv EQUIVALENT) |
| `source/00-config/mixins/_container-query.scss` | A | Old only: 87 lines, forwarded, used nowhere (checked with `git grep` at `f712137`) | Register "Deliberately not adopted"; STATE reconcile list |
| `source/00-config/mixins/_grids.scss` | B | New: two `if()` calls in the Sass 1.97 `if(sass(…): …; else: …)` form. Old = main's classic form (silenced) | Register forced edits 21 s4, 22 s4 and 23 (byte-identical CSS) |
| `source/00-config/mixins/_index.scss` | A | Old forwards `container-query` and `svg-mask-image` | As `_container-query.scss` |
| `source/00-config/mixins/_svg-mask-image.scss` | A | Old only: 8 lines, used nowhere | As `_container-query.scss` |
| `source/03-components/site-name/_site-name.scss` | B | New: the second hover/focus/active group moves into its own `.c-site-name__acronym` block, with a one-line comment. Old keeps it in place under `stylelint-disable-next-line plugin/selector-pseudo-class-lvhfa`, with a 4-line comment | Register forced edit 13; F-13; "never switch off a check" (byte-identical CSS) |

## JS

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `source/03-components/accordion/accordion.es6.js` | B | New: W6-D9's `const target = … ? event.target : event.target.parentElement` ternary. Old: `let target` plus if/else with `({ target } = event)` | Register forced edit 19 (`prefer-destructuring`, W6-D9's ternary); pinned in `expected-since-5.4.2/` |
| `source/03-components/lightbox/lightbox.es6.js` | B | Both sides carry the same `@typescript-eslint/no-use-before-define` disable; old adds an explanatory comment line above it | Register forced edit 1; STATE standing instructions (one-line comments, detail in the register) |

## Twig (committed during the analysis in `c50a18d`)

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `source/03-components/expandable-grid/expandable-grid.twig` | C | `grid_items[:3]` / `[3:]` → `grid_items\|slice(0, 3)` / `\|slice(3)`. Old = main | `post-upgrade.md` §5 (W6-D9 `46b8f718`); register Known issues ("Twig.js / twig-loader limitations", now struck through as fixed) |
| `source/03-components/filter-modal/filter-modal.twig` | C | The close-icon include is captured with `{% set %}` before the `{% apply spaceless %}` block and printed inside it. Old = main | `post-upgrade.md` §5 (W6-D9 `631e47ef`, extended to this SLAC template); register Known issues (the 9 failing stories, now struck through as fixed); F-27 |
| `source/03-components/pager/pager.twig` | C | Both icon includes are captured right after `<nav …>` and printed inside the `apply` blocks. Old = main | `post-upgrade.md` §5 (W6-D9 `631e47ef`); register Known issues. Captures placed after `<nav>` rather than at the top, as W6-D9 has them, because slac_helper's `add_attributes()` consumes the context's `attributes`: **F-27** |
| `source/03-components/pager/pager--mini/pager--mini.twig` | C | As `pager.twig` | As `pager.twig` |

## PHP

All six files are byte-identical to `main` on the new side; theme-settings.php is not in the diff.

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `includes/html.inc` | A | Old drops `'slac'` from three `theme_get_setting()` calls (`include_back_to_top` in `slac_preprocess_html()`, `threshold`, `smooth_scroll`) | STATE Decisions "PHP layer" (not re-landed); trap S7 (without the argument a sub-theme's settings are read); `php-review-notes.md` "`includes/html.inc`: … second argument dropped (not applied)" |
| `includes/media.inc` | A | Old: `FilteredMarkup` → `Markup`, and the call to `_add_regions_to_template()` renamed `_slac_add_regions_to_template()` | STATE Decisions "PHP layer"; `php-review-notes.md` summary table and "`includes/media.inc`: `FilteredMarkup::create()` → `Markup::create()` (not applied)" (`@internal`, not deprecated) |
| `includes/navigation.inc` | A | Old drops `'slac'` from `theme_get_setting('include_current_page_in_breadcrumb', 'slac')` | As `html.inc` |
| `includes/node.inc` | A | Old renames the helper's definition and its call to `_slac_add_regions_to_template()` | STATE Decisions "PHP layer"; `php-review-notes.md` "`includes/node.inc`, `taxonomy.inc`, `user.inc`: … (not applied)" (a public-function rename could break sub-themes) |
| `includes/taxonomy.inc` | A | Old renames the helper call | As `node.inc` |
| `includes/user.inc` | A | Old renames the helper call | As `node.inc` |

## Other

| Path | Category | Difference | Why / where recorded |
| --- | --- | --- | --- |
| `dist/images/2bf86343832acf8e391e.svg` | C | Deleted in new; old = main | `post-upgrade.md` §6 (seven content-hashed files unreferenced since 2022, W6-D9 `73f02b22` analogue); register Known issues; commit `1176bbe` |
| `dist/images/377b4ed5ac402fdf29b3.svg` | C | As above | As above |
| `dist/images/590958fe9f55e2951d50.jpg` | C | As above | As above |
| `dist/images/9a4b53ace5ae1718c034.svg` | C | As above | As above |
| `dist/images/d8ca53f827b80237b863.svg` | C | As above | As above |
| `dist/images/d9800eb102736ccb53a2.jpg` | C | As above | As above |
| `dist/images/e28fe0be1121729d6010.jpg` | C | As above | As above |
| `slac.libraries.yml` | **E** | New adds `slac/common` to `addtocal_a11y`, `alert_bar`, `back_to_top` and `dropbutton`. Old instead adds `core/*` dependencies to 8 libraries, which the rebuild neither carries nor addresses | The `slac/common` hunks are C (`post-upgrade.md` §1, W6-D9 `252b003d`, `libcheck` re-recorded). The `core/*` hunks are **E-3** |
