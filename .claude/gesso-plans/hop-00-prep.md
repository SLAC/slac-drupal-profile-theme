# Hop 0: prep (before 5.0.10)

Everything that must land on `gesso-upgrade-hop-by-hop` before the first upstream hop, in this order. Each step is its own commit, or a small set of single-purpose commits. After step F the branch has a committed baseline; every later hop is measured against it.

**Every command below is written to run from any directory.** Keep it that way: the shell's working directory can reset between calls.

```bash
R=/Users/btschu/Development/slac-gesso-rebuild      # the rebuild worktree (never nested in another checkout)
H=$R/.claude/gesso-hop.sh
OLD=f712137                                          # old branch tip: source of the product changes ONLY
```

## A. Bootstrap (done 2026-09-29)

- Branch `gesso-upgrade-hop-by-hop` was cut from `main` `667a195`.
- Its first commit adds these records and the helper:
  - `.claude/gesso-STATE.md`, `gesso-review-flags.md`, `gesso-deviations.md`, `gesso-hop.sh`, `.gitignore`;
  - `.claude/settings.json` (W6-D9's permission allowlist, added in a follow-up commit, as W6-D9 did in `2860dc27`);
  - `gesso-harness/` (`behaviors.cjs`, `libcheck.mjs`, `story-inventory.mjs`);
  - `gesso-plans/` (this file, `php-review-notes.md`, `alignment-analysis.md`).
- The rebuild worktree `$R` was created on that branch.
- The helper was smoke-tested against `main` in a non-nested scratch copy: setup, diff, show, deviations, deps, driftcheck, the `take` refusal, ci, and a full `verify`. Without a baseline `verify` reports FAIL (rc 1); after `snapshot` it reports PASS (rc 0) with every artifact IDENTICAL.

## B. Setup and a measurement of `main`

1. `git -C $R status` (clean) and `git -C $R branch --show-current` (`gesso-upgrade-hop-by-hop`).
2. `bash $H setup`. It clones upstream to `~/.cache/gesso-slac/upstream`, or fetches if the clone exists.
3. `bash $H ci`, then `bash $H verify`. It reports **FAIL: no baseline**. That is expected here; read the rest of the output.

   Expected at `main`, measured 2026-09-29 on Node 22.23.2 / npm 10.9.8:
   - **build.** Exit 0, **267 warnings** (0 + 267 across the two webpack runs; Sass deprecations from our own source).
     - If it instead crashes with `RangeError: Invalid string length`, `.claude/` holds copied CSS. Do step C first.
   - **lint.** eslint (fallback; no scripts yet) **44 files, 0 errors**; stylelint 0 problems.
   - **Storybook.** build-storybook exit 0 (SB 6.5.16; no `index.json`); story inventory **228 rows**.
   - **sprite.** 37 symbols, 37 with viewBox, ids = source files, 29 referenced fragments resolve.
   - **libcheck:**
     - dist paths missing for `grid_with_featured`, `hero_inline_image` and `icon_card` (dead; removed in D3);
     - `addtocal_a11y`, `back_to_top` and `dropbutton` wait on the common chunk without `slac/common` (fixed post-upgrade).

## C. Commit: "Scope the StylelintPlugin to source/"

In `$R/webpack.common.js`:

```js
    new StylelintPlugin({
      files: 'source', // Local: theme root holds .claude/; see .claude/gesso-deviations.md
      exclude: ['node_modules', 'dist', 'storybook'],
    }),
```

- **Check** that output is unchanged, since this changes lint scope only. Use a **throwaway** baseline, not the real one:
  - Before the edit: `GESSO_BASELINE=/tmp/gesso-pre-c GESSO_SB_REF=/tmp/gesso-pre-c-sb bash $H snapshot --force`
  - After the edit: `GESSO_BASELINE=/tmp/gesso-pre-c bash $H verify`. It must report PASS.
- **Records.** The register row "StylelintPlugin `files: 'source'`" is already present; confirm it. Fill in flag **F-04**'s SHA. Commit trailer `Review-Flag: F-04`.

## D. The user's product changes (flag F-02; pre-approved, not stop conditions)

These are **only** the user's own post-upgrade product commits from the old branch. Nothing else is taken from `6c15040`, `2db019c` or `f712137`.

For each commit:
- The message says what it removes or adds and whether rendering changes.
- `bash $H verify` must pass everything except the baseline comparison (there is no baseline until F).
- `libcheck` must not get worse.

Record the SHAs in the register's "Removed from the theme" section.

| # | Commit subject | How |
| --- | --- | --- |
| D1 | Delete unused components (tagline, video-hero, transparent/inverse nav) | `git -C $R show --name-only --format= ce9ea88 \| xargs git -C $R rm` (16 files). Don't cherry-pick: the old branch rewrote some of these files first, so the pick conflicts. Then the `f712137` companions, which must travel with the deletion or the build breaks:<br>• `source/03-components/_index.scss`: remove `@use 'tagline/tagline';`<br>• `includes/paragraph.inc`: remove the `field_text_color` → `slac/inverse_nav` attach block in `slac_preprocess_paragraph__image_hero()`<br>• `source/03-components/mega-menu/mega-menu.scss`: remove both `.has-transparent-nav &` blocks<br>For those three, `git -C $R diff 87b2ba3 $OLD -- <path> \| git -C $R apply -3` works (checked 2026-09-29).<br>• `slac.libraries.yml`: **by hand**, delete only the `tagline_long:` and `inverse_nav:` blocks. Applying `f712137`'s whole libraries diff would also do D3 and D4.<br>Then `git -C $R grep -nE 'tagline\|video-hero\|transparent-nav\|inverse-nav\|transparent_nav\|inverse_nav'` must come back empty. |
| D2 | Delete unused templates | `git -C $R show --name-only --format= 87b2ba3 \| xargs git -C $R rm` (2 templates). |
| D3 | Remove dead library entries and dangling `attach_library` calls | `slac.libraries.yml`: remove `grid_with_featured:`, `hero_inline_image:` and `icon_card:` (their `dist/` files are never built; libcheck proves it). `source/03-components/embed/embed.twig`: remove `{{ attach_library('slac/embed') }}`. `search-result/search-result.twig`: remove `{{ attach_library('slac/search_result') }}` and the blank line after it. Neither library is defined. |
| D4 | Define the `mega_menu` library | Add `f712137`'s `mega_menu:` entry: `dist/css/mega-menu.css`, `dist/js/mega-menu.es6.js`, dependencies `slac/common`, `slac/mobile_menu`, `core/drupal`. `mega-menu.twig` already attaches it, but nothing in the base theme includes that template (the `menu--main` include is commented out). It matters only to sub-themes that enable the mega menu. Say so in the message. |
| D5 | Drop the sidebar image from the tags term page | `git -C $R diff 87b2ba3 $OLD -- templates/content/taxonomy-term--tags--full.html.twig \| git -C $R apply -3`. Intentional rendering change. |
| D6 | Fix the maintenance page breadcrumb region include | `f712137`'s hunk to `templates/layout/maintenance-page.html.twig` (same method as D5): `region--breadcrumb.html.twig` → `region.html.twig` with `'region': 'breadcrumb'`. |
| D7 | Add a `page--node--delete` template | `git -C $R show $OLD:templates/layout/page--node--delete.html.twig > $R/templates/layout/page--node--delete.html.twig`. |
| D8 | Export the block, dropbutton, field and fieldset stories | At `main` these four files define stories but export nothing, so they are dead. `f712137` revived them in CSF3; here, stay **CSF2**. Append `export default settings;` plus `export { Block };` / `export { Dropbutton };` / `export { Default, List, Tight };` / `export { Fieldset };`. The inventory goes up by 6. W6-D9 deleted its dead stories instead; mention that in F-02. |

## E. CI, release hygiene, and a security bump

**E1–E3 are one flag, F-03.**

**E1. "Build and lint every PR and every push to the rebuild branch."** New file `$R/.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [ gesso-upgrade-hop-by-hop ]
  workflow_dispatch:
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 #v7.0.0
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 #v7.0.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - run: npm run build
      # The lint scripts arrive with Gesso 5.1.2; lint after the build, which
      # generates _GESSO.es6.js (eslint reports phantom errors before it).
      - name: Lint
        run: |
          if jq -e '.scripts.eslint' package.json >/dev/null; then npm run eslint; fi
          if jq -e '.scripts.stylelint' package.json >/dev/null; then npm run stylelint; fi
      - run: npm run build-storybook
```

**E2. "Make the release zip exclusions work, and check the zip."** In `.github/workflows/build-assets.yml`:
- **Exclusions.** `thedoctor0/zip-release` runs `zip -r … -x $INPUT_EXCLUSIONS` **unquoted**, so bash expands each pattern first. `source/*` becomes directory names and excludes nothing, and the v2.1.10 zip ships 984 `source/` entries. **`source/` must ship**, because templates include `@components/...`, which lives in `source/03-components`.
  - Replace the exclusions with non-expanding patterns, e.g. `'*.git* *node_modules* .editorconfig *.claude*'`, the same trick as `*.git*`.
  - Add a comment that `source/` ships on purpose.
- **Contents check.** After "Archive Release", add a step that runs `unzip -l slac.zip` and fails the job unless:
  - `source/03-components/`, `templates/`, `dist/js/common.js`, `dist/css/styles.css`, `dist/images/sprite.artifact.svg` and `slac.info.yml` are present;
  - no `.claude/` or `node_modules/` entry is present.
- **Test locally.** Workflows can't run locally, so emulate the action. In a scratch copy of the **built** tree (outside any checkout): `bash -c 'E="<exclusions>"; zip -qr /tmp/slac.zip . -x $E'`, then inspect `unzip -l /tmp/slac.zip`. Also check how zip stores the paths (with or without a `./` prefix) before writing the `grep` patterns. Paste the listing summary into this plan.
- **Result (2026-09-29).** Confirmed from the action's `entrypoint.sh` at the pinned SHA: `zip -r "$INPUT_FILENAME" $INPUT_PATH -x $INPUT_EXCLUSIONS`, unquoted. Emulated on a built copy of the D8 tip (node_modules removed, as the workflow does; an extra `.claude/sub/y.css` planted):
  - old exclusions `'*.git* /*node_modules/* .editorconfig source/*'`: 1473 entries, **965 `source/`** (only the expanded directory entries dropped), **36 `.claude/`**;
  - new exclusions `'*.git* *node_modules* .editorconfig *.claude*'`: 1440 entries, 968 `source/`, 0 `.claude/`, 0 `.git*`; top level: dist 87, templates 314, includes 15, lib 15, `.storybook` 8, plus the root files.
  - zip stores paths **without** a `./` prefix, so the check matches from the start of the name.
  - The check step, run on each: new PASS; old FAIL (`.claude/`); new minus the sprite and `source/03-components/*` FAIL naming both. The script embedded in the YAML is byte-identical to the one tested.

**E3. "Publish to Satis only after a successful build."**
- Add `needs: build_gesso` to the `notify-satis` job.
- Add `$R/.gitattributes` with `/.claude export-ignore`, so `git archive` and GitHub source zipballs leave the records out.

Validate the YAML with node's `yaml` package, e.g. `cd $R && node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/ci.yml','utf8'))"`. The real proof of E1 is the first push (step G). E2 and E3 are proven by the first tag after the merge, which is the user's (review-flags A-3).

**E4. "Bump lodash out of its advisory range" (its own flag).**
- `main`'s lock resolves lodash 4.17.21, which has high advisories (`npm audit --package-lock-only`). It is bundled into `dist/js`; `header.es6.js` uses its debounce/throttle.
- Do it **before** step F, so the baseline already contains it and no pin is needed.

```bash
cd $R && npm run build && rm -rf /tmp/pre-lodash && cp -R dist/js /tmp/pre-lodash
cd $R && npm audit --package-lock-only | tail -5        # record the counts
cd $R && npm update lodash                               # stays inside the declared ^4 range: lockfile-only
cd $R && npm audit --package-lock-only | tail -5
bash $H verify                                           # FAIL only on "no baseline"
node $R/.claude/gesso-harness/behaviors.cjs /tmp/pre-lodash $R/dist/js   # must report no !! lines
```

- Record the before and after versions and advisory counts in the commit message.
- Leave gsap and jquery alone; W6-D9 did. Other advisories in **non-output** dev tooling are not part of this step. List them in the plan.
- **Result (2026-09-29).**
  - `npm update lodash`: 4.17.21 → **4.18.1** (latest in `^4`); the lockfile diff is that one entry. `package.json` is untouched (`^4.17.21` already admits it).
  - `npm audit --package-lock-only`: **115 → 114** (low 11, moderate 43, high 48 → 47, critical 13). lodash's three advisories (GHSA-r5fr-rjxr-66jc high, GHSA-f23m-r3pf-42rh and GHSA-xxjr-mmjv-4gpg moderate, all `<=4.17.23`) are gone.
  - Output: only `dist/js/header.es6.js` changes (75155 → 75440 bytes; it imports `{ debounce, throttle }` from the full `lodash` build). `behaviors.cjs` pre vs post: **29/29 entries identical**. `debounce` and `throttle` are byte-identical between the two `lodash.js` builds; the 70 changed lines are `baseUnset` (prototype-pollution guard), `fromPairs`, `_.template` imports validation, doc comments, one semicolon and `VERSION`, none of which `header.es6.js` calls. `verify` otherwise unchanged (246 warnings, eslint 42/0, stylelint 0, 233 stories, sprite 37/37).
  - **What reaches `dist/js`:** bare imports in theme JS are `drupal`, `drupalSettings`, `jquery` and `once` (all webpack externals) plus `gsap` and `lodash` (bundled). gsap has no advisory, so after this bump **no advisory reaches `dist/js`**.
  - **Remaining 114 are dev tooling only** and are not chased here: Storybook 6.5 and its webpack 4/5 builders (resolved by the SB7/8/9/10 hops), webpack `<=5.104.0`, `terser-webpack-plugin`, `postcss <=8.5.22`, `twig`/`twig-loader`/`twig-drupal-filters` (Storybook-only), `svg-sprite-loader`/`svg-baker` (replaced at 5.4.3 s1), `@storybook/storybook-deployer` (dropped at 5.2.6), `yaml` 1.x (v2 at 5.2.5), `remove-files-webpack-plugin`, `inquirer`, and their transitive trees. Each hop records the count before and after.

## F. Baseline (taken ONCE; never re-snapshot the real baseline after this)

On the tip after E4:

```bash
bash $H ci
bash $H verify            # build + storybook (FAIL: no baseline -- expected one last time)
bash $H snapshot          # -> $R/.claude/baseline (committed) + ~/.cache/gesso-slac/storybook-reference
bash $H verify            # must end "VERIFY: PASS", with dist/css, dist/js and every artifact IDENTICAL
git -C $R add .claude/baseline && git -C $R commit -m "Add the hop-0 compiled-output baseline"
```

- The Storybook 6.5 reference build in `~/.cache/gesso-slac/storybook-reference` is the reference for the post-upgrade DOM and story-name comparison. It already contains the D-step product changes.
- `snapshot` writes `NOTES.md` (provenance). Append the pass bars to it and to the Verification table below:
  - build warnings;
  - eslint files/errors and stylelint problems;
  - inventory rows (228 at `main`; plus 6 from D8, minus the tagline/video-hero stories removed in D1);
  - sprite;
  - libcheck.

## G. Push and confirm CI

```bash
git -C $R push -u origin gesso-upgrade-hop-by-hop
gh run list --repo SLAC/slac-drupal-profile-theme --branch gesso-upgrade-hop-by-hop --limit 3
gh run watch <id> --repo SLAC/slac-drupal-profile-theme
```

A red run blocks hop 1. The first push also publishes the branch; that is expected and was approved: push per hop, never `main` or tags.

## H. Record hop 0

- Fill in the STATE hop table row 0 with the SHA of the baseline commit.
- Update "Where we are" (next: hop 1, 5.0.10).
- Fill in this Verification table and the flags' SHAs.
- Commit as "Record hop 0", then push.

## Verification (fill in at step F)

| Check | Result |
| --- | --- |
| build | |
| eslint / stylelint | |
| build-storybook | |
| stories (inventory) | |
| sprite | |
| libcheck | |
| dist vs baseline | |
| npm audit (before / after E4) | |
| CI run | |
