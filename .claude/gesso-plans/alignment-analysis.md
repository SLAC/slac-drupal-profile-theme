> **HISTORICAL ANALYSIS (2026-09-28). DO NOT EXECUTE ANYTHING IN THIS FILE.**
> This is the comparison that led to the rebuild. Its §3–§5 describe options, PRs to `main`, archive branches, a Pages switch, tagging, and back-filling W6-D9. All of them were superseded by the decisions in `.claude/gesso-STATE.md` (made with the user 2026-09-29). The executable plan is STATE plus `hop-00-prep.md` and the per-hop plans.
>
> Known corrections since this was written:
> - the target is 5.4.6, not 5.4.7;
> - Node stays 22;
> - only the theme-settings.php PHP fix is re-landed;
> - README is taken verbatim during the hops and replaced by the SLAC README afterwards;
> - the baseline is committed;
> - 15 local consumer checkouts are on core 10.2.x, not 3 (see review-flags A-2);
> - `minimizer-webpack-plugin` first appears at 5.4.6;
> - upstream still emits `dist/design-tokens.js`.
>
> Use this file for the evidence behind each difference (§2), not for instructions.

# Aligning the SLAC theme's Gesso upgrade with W6-D9's hop-by-hop approach

*Prepared 2026-09-28. This is analysis and a plan only. Nothing in either repo was changed.*

**Compared**

| | Ref | What it is |
| --- | --- | --- |
| SLAC | `claude/gesso-upgrade-plan-2a8584` | PR #239: 5.0.9 → 5.4.2 |
| SLAC | `origin/gesso-upgrade` = `f712137` | integration branch, not merged to main: PR #239, PR #240 (5.4.2 → 5.4.6, `2db019c`), then your `4e1bfdd`, `ce9ea88`, `87b2ba3`, `f712137` |
| W6-D9 | `gesso-upgrade-hop-by-hop` = `73f02b22` | 23 hops, 5.0.9 → 5.4.6, plus the post-upgrade assessment |
| Upstream | `forumone/gesso` | tags 5.0.9 … 5.4.6, and 5.4.7 (tagged today) |

**Method**
- Eight comparison dimensions produced 176 findings. An independent skeptic per dimension re-checked each one against git: 87 confirmed, 88 corrected, 1 refuted. The skeptics also added 38 items the first pass missed.
- SLAC's tip and `main` were also built and measured in a scratch copy.
- A final critic pass checked this document against the findings and against git.

---

## 1. Summary

**Where SLAC is now.**
- `gesso-upgrade` is at 5.4.6. It has not been merged to `main`, and no tag contains it.
- It builds cleanly on the tip:
  - `npm ci`: OK
  - eslint: 40 files, 0/0
  - stylelint: 208 files, 0
  - `npm run build`: exit 0, 0 warnings
  - `build-storybook`: 233 entries
  - sprite: 37/37 symbols
  - design-token artifacts: byte-identical to 5.0.9
- The way it got there is the opposite of W6-D9 on almost every axis:

| | W6-D9 | SLAC |
| --- | --- | --- |
| Commits | 23 per-release hops (34 hop/stage commits), each reviewed before commit | 2 squash-style commits covering 19 and 4 releases |
| Target selection | every release in order | a plugin's 5-release window picked 5.4.2 by accident |
| Scope | toolchain only; forced edits only; PHP documented, not applied | also rewrote 153 stories to CSF3, added unused mixins, applied PHP changes |
| Lockfile | never regenerated; output-generating packages pinned to upstream's tested versions | deleted and regenerated at each round, then re-resolved again in "Clean up" |
| Deviations | central register plus a mechanical watch list | long inline comments; plan docs deleted in `4e1bfdd` |
| Verification | `verify` gate after every hop, against a baseline with content pins | one manual pass per round, with no record left in the tree |

**Recommendation: rebuild the upgrade hop by hop from `main` (Route A).**
- It is feasible. Nothing has shipped, and the two themes' 5.0.9 toolchains were nearly identical: `.storybook/main.js`, `lib/`, `.stylelintrc.yml`, `postcss.config.js` and the README were byte-identical, and `webpack.common.js` differed by 9 lines. W6-D9's 35 hop plans are therefore a ready map.
- The current tip is kept on an archive **branch**, not a tag, because any tag triggers a public release. It serves as the answer key to check the rebuild against.
- A cheaper retrofit (Route B, §5) gets the end state and the process aligned for future upgrades. It cannot give you per-release history.

**Found along the way. These need fixing whichever route you choose:**
1. **Sub-theme settings regression.**
   - `6c15040` dropped the `'slac'` argument from 4 `theme_get_setting()` calls (`includes/html.inc` ×3, `navigation.inc` ×1).
   - On sites whose default theme is a SLAC sub-theme, those calls now read `<subtheme>.settings` instead of `slac.settings`. Core does not fall back to the base theme.
   - Example: on slac-slacit-d9, `include_current_page_in_breadcrumb` is 0 in `slac.settings` but 1 in `slac_it.settings`, so breadcrumbs would start showing the current page.
   - Upstream's `navigation.inc` kept `'gesso'` until 5.4.6. The `navigation.inc` edit was SLAC's own extrapolation.
2. **Release zip exclusions don't work.**
   - `thedoctor0/zip-release` passes the exclusions unquoted, so bash expands `source/*` into directory names, and nothing under them is excluded.
   - The v2.1.10 zip ships 984 `source/` entries plus `.npmrc`, `.storybook/` and `lib/`.
   - Shipping `source/` is actually load-bearing, because the `components` namespace needs it. So the fix is not "exclude more"; it is "make the list honest" (§4, Phase 0).
   - Any committed `.claude/` would ship too.
3. **GitHub Pages is still set to "legacy / gh-pages".**
   - The rewritten `publish-demo-site.yml` deploys via `deploy-pages`, which needs "GitHub Actions".
   - Neither CI workflow has ever run the upgraded code, since both run only on tags or on pushes to `main`.
   - Timing matters: `main`'s own workflow still deploys to the `gh-pages` branch. So flip the setting right before the upgrade merges to `main`, not earlier.
4. **`notify-satis` has no `needs: build_gesso`.** Satis is notified even when the release build fails.
5. **D11 is declared on the theme only.**
   - `f712137` set `slac.info.yml` to `'^10.3 || ^11'`.
   - The required `slac_helper` (in slac-drupal-profile at `web/modules/custom/slac_helper`) still declares `^9 || ^10`.
6. **Upstream 5.4.7 was tagged today.** It widens the eslint script to `{js,jsx,ts,tsx}`, adds `globals`, moves to chalk 6, adds `assetVersion`, and more. Both themes have a hop to take.

---

## 2. Where SLAC differs, and the change that aligns it

Severity reflects impact on correctness or alignment. Items marked **(both routes)** apply whichever route you pick.

### A. Process and records

| Gap | SLAC today | Aligning change |
| --- | --- | --- |
| Commit granularity (high) | `6c15040`: 254 files, 19 releases. `2db019c`: 4 releases. Not bisectable per release. | One commit per release, `Upgrade Gesso to X.Y.Z`. The big hops are staged: 5.3.2 ×4, 5.4.3 ×3, 5.4.4 ×4, 5.4.5 ×4. Each stage must build green. |
| Target selection (high) | `get-gesso-diff.sh` uses `releases?per_page=5` and picked 5.4.2. | Enumerate tags from a local upstream clone and apply every one in order. Retire the gesso-upgrader plugin for this repo. |
| Review gate (high) | Subagents implemented phases with no testing until the end. Each round landed as one commit, and PRs #239 and #240 have 0 reviews. | W6-D9's gate: plan → implement → `verify` → **present the diff → commit only on your approval**, per hop or stage. W6-D9 also commits the plan with the code, results filled in, so the gate is the approval, not the plan's timing. Big hops get a separate triage commit first. |
| Records (high) | All 20 plan and verification files were deleted in `4e1bfdd`. | Commit `.claude/gesso-STATE.md`, `gesso-deviations.md`, `gesso-plans/hop-NN-*.md`, `php-review-notes.md` and `settings.json`, and keep them at the tip. Seed them from `4f3e580:gesso-upgrade-plan/*` and `2db019c:gesso-upgrade-plan-5.4.6/*`, re-checked against upstream. |
| Deviation convention (medium) | README L919-925 says "when you deviate, say why inline". There are 12-line comments in `webpack.common.js` and `.storybook/main.js`. | One-line `// Local: … see gesso-deviations.md` markers, with the detail in the register. Rewrite the README paragraph to point at the register. |
| Catch-all commits (medium) | `f712137` "Clean up" mixes several kinds of change in 21 files with an empty message: `.npmrc`/ajv removal, a lockfile re-resolve that changed 25 of 31 `dist/js` files, the D11 bump, a theme-settings.php port, story revivals, and library and template edits. | Split it into single-purpose commits, each with an explanatory message (§4, Phase 0). |
| Release attribution (medium) | The records name the wrong releases. For example, "sprite.cjs in 5.4.6" was really 5.3.2, and README L805-808 on unique_id should say 5.4.0 / 5.4.5. | Attribute every register row from the upstream clone (`ls-tree <tag>`). Hop-by-hop records get this right by construction. |

### B. Scope (W6-D9 applies toolchain only; forced edits land in the hop that forces them)

| SLAC change | Classification under W6-D9's rules | Aligning change |
| --- | --- | --- |
| CSF2 → CSF3 rewrite of 153 stories (+4108/−3562) and 232 `X.render(` call sites (high) | Not forced. W6-D9's 160 story files (none using `render:`) build 264 stories on Storybook 10.6. | Drop it from the upgrade. Stories stay CSF2; CSF3 can be a separate feature later. |
| `_container-query.scss` and `_svg-mask-image.scss` mixins, `$container-queries-rems` | Additive upstream authoring; unused | Drop them. Add them later when a component needs them. |
| About 22 SCSS and 10 `es6.js` edits for prettier 3, stylelint 16, LVHFA, string-quotes and eslint 9 | Forced | Keep them, each in the hop that forces it, with a per-hop `dist/css` check. |
| `_button.scss` `stylelint-disable order/…` block | A check switched off instead of taking the forced edit | Take the autofix. W6-D9's file began identical. Prove the result inert with a cascade check. |
| `silenceDeprecations: ['if-function']` in `webpack.common.js` and `.storybook/main.js` | A silence instead of the upstream fix. Upstream fixed `_iff.scss` at 5.4.4, and the silence hides **105** warnings, all from SLAC's own `_iff.scss`/`_grids.scss`. | Take upstream's `if(sass(…))` change plus W6-D9's `_grids.scss` hunks at the 5.4.4 hop, then delete both silences. **(both routes)** |
| eslint `prefer-destructuring` override at 5.4.2 | A check switched off | Make the edit instead. |
| `.stories.mdx` → `.mdx` renames and the blocks import | Forced | Keep them. The renames and the first import change go at 5.3.2 stage 4, the second import change at 5.4.3 stage 2. Drop the added headers in `dropdown-menu.mdx` and `mega-menu.mdx` and the quote changes. `global.mdx`'s header matches upstream. |
| PHP (high). `theme_get_setting` argument drop (6c15040). `FilteredMarkup` → `Markup` and `_add_regions_to_template` → `_slac_…` (2db019c). theme-settings.php signature and `$theme` port (f712137). | Document, don't apply | Take these out of the upgrade and record them in `php-review-notes.md`. Re-land any you want as their own commits, each with a consumer-impact line:<br>• `theme_get_setting`: changes behaviour on sub-theme sites, so audit those sites first.<br>• `FilteredMarkup`: it is `@internal`, not deprecated; the recorded reason is wrong.<br>• `_slac_` rename: breaks callers of the old name.<br>• theme-settings signature: a real fix, worth keeping. |
| `slac.libraries.yml` core/* dependency audit (6c15040) | Our-scope fix | Keep it, as a separate evidenced commit, like W6-D9's `252b003d`. |
| `subheadingLevelTwigExtension.js` registered in Storybook | Twig parity: `slac_helper` has no PHP counterpart, so the filter would fatal in Drupal | Don't take it, or port the PHP half to `slac_helper` first. **(both routes)** |
| `source/@types/drupal/index.d.ts` missing | A toolchain file W6-D9 applies (taken at 5.0.10) | Add it at 5.0.10 and follow upstream's edits (5.2.5, 5.2.7, 5.4.2). Apply the `gessoImagePath` substitution at 5.2.7, when upstream adds `imagePath`, as W6-D9's `90b77171` did. |
| `.dockerignore` deleted | Upstream still ships it | Restore it verbatim, or record its absence. |

### C. Dependencies and lockfile

| Gap | SLAC today | Aligning change |
| --- | --- | --- |
| Lockfile regenerated (high) | `rm package-lock.json && npm install` in both rounds. `f712137` re-resolved again, which is what moved webpack 5.109.2 → 5.110.0 and terser 5.50.0 → 5.51.2. | Never delete the lockfile. Per hop: `deps --apply` → `npm install` → `driftcheck` → a clean `rm -rf node_modules && npm ci` for any hop that moves majors. |
| Output-generating packages float | sass-embedded 1.103.1, webpack 5.110.0, terser 5.51.2. Upstream 5.4.6 and W6-D9 have 1.100.0 / 5.108.4 / 5.49.0. | Pin to upstream's tested versions as W6-D9 does, including `overrides.terser`. Also pin `minimizer-webpack-plugin` 5.6.1 via `overrides`: later versions require terser `^5.51.0`, which is the conflict W6-D9 carries. `driftcheck` only covers direct dependencies, so watch terser and minimizer-webpack-plugin explicitly. |
| @forumone eslint configs float past upstream's tested versions | `^4.0.0` / `^3.0.7` resolve to 4.0.1 / 3.0.8 | Pin exactly to 4.0.0 / 3.0.7. |
| Never-introduce rule | `@swc/cli` (unused) and `svgo` came in with upstream's whole dependency block | Drop `@swc/cli`. Drop `svgo` or register it; it still resolves as the sprite plugin's peer. |
| `.npmrc` legacy-peer-deps and ajv pin | Removed in `f712137`. The end state is correct. | In the replay, remove it as its own commit right after 5.2.4, as W6-D9's `57e1f95c` did. |
| Security carve-out, which W6-D9 lacks | `main`'s lock has lodash 4.17.21, which has high advisories and is bundled into `dist/js`. W6-D9's tip still ships it. | Never pin into an advisory range. **Route A inherits `main`'s lock**, so it needs an explicit, registered security bump of lodash; gsap and jquery are decided the same way. Run `npm audit --package-lock-only` before and after every dependency change. |

### D. Toolchain end state (3-way compare at 5.4.6)

- **Already identical in all three:** `webpack.dev.js`, `webpack.production.js`, `postcss.config.js`, `tsconfig.json`, `eslint.config.js`, `eslint.dev.config.js`, `.prettierrc`, `.prettierignore`, most of `lib/`, `stubs/once.js`, `manager.js`.
- **Diverged by hand-merging.** Take upstream verbatim, then re-apply only the registered deviations:
  - `webpack.common.js`: keep only the `jquery` external and `StylelintPlugin files: 'source'`.
  - `.storybook/main.js`: take upstream's `createRequire` shim. SLAC's comment saying the shim breaks the file is wrong for SB10. Also drop SLAC's Storybook-only jQuery external and `stubs/jquery.js`, drop `performance.hints: false`, and add W6-D9's story-name indexer.
  - `.storybook/preview.js`: rebuild from upstream.
  - `stubs/drupal.js`: only change `gessoImagePath`.
  - `.swcrc`: SLAC's copy is a strict-JSON reformat of the same content, so take upstream's verbatim.
  - `webpack.theme-config.js`: drop the no-op eslint header.
  - `lib/component.js` and `lib/templates/Javascript.hbs`: keep only the 4 `slac` theme-name sites.
  - `lib/transform.cjs`: keep only the font-feature-settings branch.
  - `lib/types.d.ts`: verbatim; SLAC's trailing commas are the only difference.
- **Real repo-root adaptations to keep and register:** `StylelintPlugin files: 'source'` (it globs with `dot: true` and once crashed on `.claude/` baselines), the `jquery` external and dependency, the SLAC-only runtime deps, and the Storybook branding files.
- **`.nvmrc` is 24.** It was changed silently in `e8fa342`; upstream and W6-D9 use 22, and CI reads `.nvmrc`. This is your decision (§3).

### E. Post-upgrade fixes W6-D9 made that SLAC still needs (both routes)

| W6-D9 fix | Applies to SLAC? |
| --- | --- |
| `slac/common` declared on every JS library (`252b003d`) | **Yes.** `addtocal_a11y`, `back_to_top` and `dropbutton` bundles wait on chunk 5202 in `common.js`. Add `alert_bar` for uniformity. |
| Global behaviours loaded in Storybook (`136d9207`) | **Yes.** Import arrow-link, external-link and transitions in `preview.js`. |
| Export-list story names (`9eb93a52`) | **Yes.** 131–135 of 230 names are raw CamelCase. The indexer works unchanged on CSF2. On CSF3 (Route B), extend its regex to read `name:`; otherwise the two Table stories get the wrong names. |
| Per-story component imports (`aa9d08f1`) | **Yes.** 26 of 150 story files; most are transitive. |
| Twig.js 3 `[:3]` slice (`46b8f718`) | **Yes.** `expandable-grid.twig` L14 and L16. |
| Includes inside `{% apply %}` (`631e47ef`) | **Yes.** `pager.twig` and `pager--mini.twig` are byte-identical to W6-D9's pre-fix files, so take the fixed versions. Also check `filter-modal.twig`. |
| Stale hashed images in `dist/images` (`73f02b22`) | **Yes.** Remove 7 files, unreferenced since 2022. |
| Storybook `viewport.viewports` → `viewport.options` | A SLAC-only bug: SB9+ ignores the old key. |
| React-effect `attachBehaviors` (`51fca15e`), sitewide-alert stub (`dbd469b5`) | Optional. SLAC's impact is smaller; measure first. |
| Bare `once` / patch removal, isotope import, footer Sass fixes | Not applicable. SLAC was already there. |

### F. Where SLAC is already aligned or ahead (don't copy W6-D9 here)

- SLAC already uses bare `once` everywhere, with no patch, no alias and no `patch-package`.
- `package.json` placement and key order match upstream more closely than W6-D9's.
- The `images/backgrounds` output path was already in place before W6-D9 adopted it today.
- SLAC's baselines cover more: the sprite, the Storybook index, a story inventory, and the libraries.yml path check. Fold these into the ported `verify`.
- W6-D9 has gaps of its own. Don't inherit them, and consider back-filling them in W6-D9:
  - its `php-review-notes.md` stops at 5.4.2;
  - its register is missing its newest Storybook rows;
  - its terser override conflicts with `minimizer-webpack-plugin 5.11.0`'s `^5.51.0`;
  - it also needs the 5.4.7 hop.

---

## 3. Decisions needed from you before starting

1. **Route.** Rebuild hop by hop (A, recommended) or retrofit the current tip (B).
2. **CSF3 stories.** Drop them from the upgrade (W6-D9's rule; recommended) or keep them as a registered deviation.
3. **PHP changes already made.** Take them out of the upgrade and re-land each deliberately (recommended), or keep them. Either way, the `theme_get_setting` change needs a sub-theme settings audit before it ships.
4. **Output standard.** W6-D9's "no visible change, with any compiled-output change proven inert and pinned by content" (recommended), or SLAC's "byte-identical". Pins, the webpack/terser moves and the lockfile policy all depend on this.
5. **Node.** Stay on 22 through the replay (recommended): it is `main`'s value, W6-D9's, and upstream's since 5.4.4. You reaffirmed 24 in `f712137` (README L35), so this reverses your own choice. Moving to 24 would then be its own recorded commit.
6. **Deviation convention.** You also wrote "when you deviate, say why inline" into the README in `f712137`. W6-D9's rule is one-line markers plus a register. Adopting it reverses that choice too.
7. **Where the records live.** Committed under `.claude/` with a zip exclusion that actually works (recommended), or outside the package.
8. **README.** Treat it as SLAC-owned and hand-apply upstream changes in each hop plan (recommended, since it is the Composer package's landing page). The alternative is upstream verbatim with SLAC docs moved elsewhere.
9. **Your product commits** (`ce9ea88`, `87b2ba3` and the product parts of `f712137`). Land them on `main` before hop 1 (recommended; smaller surface, verified separately) or after the last hop.
10. **Review cadence.** Approve every hop and stage, or batch the version-only hops: 5.0.11, 5.2.1, 5.2.8.
11. **D11.** Declare `'^10.3 || ^11'` at hop 23? This blocks sites below 10.3; 3 local consumer checkouts are on 10.2.x. Related questions:
    - `slac_helper` ships inside slac-drupal-profile, so its bump must land and release **before** the theme tag.
    - It needs reconciling with the profile's `drupal11` WIP branch (`8bef79b2`).
    - Optionally add a `drupal/core` constraint to `composer.json`, so Composer blocks incompatible sites at update time.
12. **Route B only: pins that lower resolved versions.** Against SLAC's committed lockfile, pinning sass-embedded, webpack and terser to upstream's tested versions means going *down* (1.103.1 → 1.100.0, 5.110.0 → 5.108.4, 5.51.2 → 5.49.0). Pin down, or freeze and register the current versions?

---

## 4. Route A: rebuild hop by hop (recommended)

### Phase 0: Preserve and prepare (on `main`, independent of the upgrade)

1. **Preserve.**
   - Keep `f712137` reachable with an **archive branch**, e.g. `archive/gesso-upgrade-v1`, **not a tag**. `build-assets.yml` fires on any tag (`'**'`), so an archive tag would publish a GitHub release and notify Satis. The archive branch is the answer key and keeps the old plan docs reachable.
   - Don't force-push or delete `gesso-upgrade`.
   - Preserve the Storybook 6.5 reference: put a branch on `origin/gh-pages` `27f621b`, the 6.5 build of `main`. The first Phase 0 merge to `main` redeploys `gh-pages`. After Phase 0, a fresh 6.5 build of `main` becomes the better Phase 3 reference, because it contains the same product changes as the rebuilt branch.
2. **Land your product changes as their own PRs to `main`**, each with an explained message:
   - The component deletions (`ce9ea88`), **together with their `f712137` companions**. `_index.scss` still has `@use 'tagline/tagline'` after `ce9ea88`, so that commit alone breaks the build. The companions are:
     - the `_index.scss` `@use` removal;
     - the `paragraph.inc` `inverse_nav` attach;
     - the `.has-transparent-nav` rules in `mega-menu.scss`;
     - the dangling library entries.
   - The template deletions (`87b2ba3`), with evidence of non-use.
   - The remaining `f712137` product parts: the `mega_menu` library, the `embed.twig` and `search-result.twig` `attach_library` removals, the taxonomy tags template, the maintenance-page fix, and `page--node--delete`.
   - The four revived stories (block, dropbutton, field, fieldset), re-authored in CSF2.
3. **CI and release hygiene PRs to `main`** (§1, items 2 and 4):
   - **PR workflow.** `npm ci` → `npm run build` → `npm run build-storybook` on `.nvmrc`'s Node. Add `npm run eslint` and `npm run stylelint` once those scripts exist (hop 4, 5.1.2); `main` has neither.
   - **Zip exclusions.** Use non-expanding patterns such as `*.claude*` or explicit `rm -rf` steps. Add a `.gitattributes` `/.claude export-ignore`. Add an `unzip -l` assertion that `source/03-components`, `dist/js/common.js` and `templates/` are present and `.claude/` and `node_modules/` are absent.
   - **Satis.** Add `needs: build_gesso` to `notify-satis`.
   - **Don't switch GitHub Pages yet.** `main`'s workflow still deploys to `gh-pages`. The switch belongs in Phase 4.

### Phase 1: Port the tooling and records skeleton (first commits on `gesso-upgrade-hop-by-hop`, branched from `main`)

- **Scope the StylelintPlugin first, as the first registered deviation.**
  - `main`'s plugin has only `exclude: ['node_modules','dist','storybook']` and globs dot-directories. A build from the main checkout would therefore lint `.claude/worktrees/`, `baseline-542/` and `prelint-css/`; this already crashed once.
  - Add `files: 'source'` now, and re-apply it on every later `take` of `webpack.common.js`.
- **Port `gesso-hop.sh`:**
  - `THEME="$ROOT"`.
  - `NODE_V` from `.nvmrc`.
  - `GESSO_UPSTREAM` and `GESSO_BASELINE` point **outside the repo**. That keeps the upstream clone out of every glob and out of the release zip.
  - TOOLCHAIN adapted:
    - Keep `.dockerignore`, `webpack.react-config.js`, `patches`, `.eslintrc*`, `babel.config.json` and `source/@types`, so upstream changes to them still classify.
    - Take `README.md` and `.nvmrc` out.
    - Watch `.github/workflows/publish-demo-site.yml` as an upstream file.
    - `take`/`diff` must never touch upstream's other `.github/` files or `.buildkite/`, because the theme root is the repo root.
  - A new SLAC `DEVIATION_WATCH` derived from the actual diffs. Don't copy W6-D9's list.
  - `verify` mirrors both CI sequences, and:
    - sums warnings across **both** webpack invocations (W6-D9's reads only the last);
    - runs the sprite check (fix the `icon_name` regex; check viewBox count equals symbol count);
    - counts Storybook entries: from hop 7 (SB7) use `index.json` count plus an ID diff. SB 6.5 writes no `index.json`, so before that use the 248-row story inventory;
    - checks `libraries.yml` dist paths and the release-zip contents.
  - Add a manual `npm run storybook` smoke test to every hop that touches `.storybook/`. `build-storybook` never runs react-refresh or the dev-server config.
- **Baseline.**
  - `.claude/gesso-baseline/` in the main checkout already matches a fresh 5.0.9 build byte for byte.
  - Move it outside the repo, **flatten it to the helper's layout** (`css/`, `js/`, plus the extra artifacts; the helper tests `-d "$BASE/css"`), add a `NOTES.md` recording its provenance, and point `GESSO_BASELINE` at it.
  - Give `snapshot` a `--force` guard, since it deletes the whole folder.
- **Harnesses.** Rebuild `behaviors.cjs`, `cascade3.cjs`, `cssequiv.cjs` and `astequiv`/`astdiff` from W6-D9's STATE descriptions, and commit them. That improves on W6-D9, where they live in a scratchpad. Retire `cascade-check.mjs`: its strict positional comparison over-reports.
- **Records:**
  - `gesso-STATE.md`: scope rules, dependency policy, pass contract, a traps list seeded with W6-D9 traps 1, 2, 3, 6 and 10 plus SLAC's own incidents, and the hop table.
  - `gesso-deviations.md`.
  - `php-review-notes.md`, with a `slac_helper` section and a consumer-impact line per entry.
  - `settings.json` using W6-D9's allowlist.
  - `.claude/.gitignore`.

### Phase 2: Replay the hops

Starting map. Each hop's plan still re-derives from `gesso-hop.sh diff/show/deviations`; W6-D9's plan for the same hop is the reference.

| # | Release | W6-D9 stages | SLAC-specific notes |
| --- | --- | --- | --- |
| 1 | 5.0.10 | 1 | TS support. Add `source/@types/drupal/index.d.ts`. Lightbox lint rename (forced). |
| 2 | 5.0.11 | 1 | Version only. |
| 3 | 5.1.0 | 1 | 45-package wave. Design-token split: record `dist/design-tokens.js` as no longer emitted. |
| 4 | 5.1.2 | 1 | eslint, stylelint and watch scripts arrive. |
| 5 | 5.1.3 | 1 | sass-embedded catch-up. |
| 6 | 5.1.4 | 1 | Take `images/backgrounds`, a `webpack.common.js` change. Nothing is emitted today (all images are data URIs). |
| 7 | 5.2.0 | 1 | **Storybook 7.** Dead story files: delete or stub, and record the choice. |
| 8 | 5.2.1 | 1 | Version only. |
| 9 | 5.2.2 | 1 | Dockerfile deleted. Keep `.dockerignore`. |
| 10 | 5.2.3 | 1 | `decorators.jsx`. `preview.js` `dist/js` import deviation. |
| 11 | 5.2.4 | 1 | chalk. **Defer glob 10**: with `legacy-peer-deps`, glob-promise falls through to it and `build-storybook` breaks. Then a **non-hop commit**, as W6-D9's `57e1f95c`: delete `.npmrc`, take glob 10 and upstream's webpack entry function (`npm install` against the lockfile, not a fresh resolve). Expect W6-D9's module-ID order pin. |
| 12 | 5.2.5 | 1 | `lib/` rewrite and yaml v2. React build unwired; decide on `webpack.react-config.js`. |
| 13 | 5.2.6 | 1 | LVHFA rewrite; first `dist/css` pin. storybook-deployer dropped, so take `publish-demo-site.yml` with SLAC's branch, SHA pins and setup-node. It only runs on `main`, so nothing deploys until Phase 4. |
| 14 | 5.2.7 | 1 | 43-package wave. `image_path` rename skipped; apply the `gessoImagePath` substitution in `source/@types` and the drupal stub. |
| 15 | 5.2.8 | 1 | Version only. |
| 16 | 5.3.2 | 4 | Stage 1: stylelint 16 and prettier 3 (SCSS forced edits; take the `_button.scss` autofix). Stage 2: ESM, `type: module`, `sprite.js` → `sprite.cjs`. Stage 3: Babel → SWC (`.swcrc` verbatim). Stage 4: SB8, React 18, `.mdx` renames. |
| 17 | 5.4.0 | 1 | Twig parity: skip `cleanUniqueId` and `subheadingLevel`. css-loader 7. |
| 18 | 5.4.1 | 1 | `loadPaths`. string-quotes SCSS edits. |
| 19 | 5.4.2 | 1 | eslint 9 flat config, React 19, `es6.js` lint fixes (no override). `@types` external-link keys. |
| 20 | 5.4.3 | 3 | Stage 1: sprite plugin swap (delete `sprite.cjs`). Stage 2: SB 8 → 9 (blocks import; `viewport.options`). Stage 3: dependency wave (`overrides.terser`). |
| 21 | 5.4.4 | 4 | Stage 1: twig-loader. Stage 2: SB 9 → 10 (upstream's `createRequire` shim, taken atomically, plus a dev-server smoke test). Stage 3: `component.js` and `Javascript.hbs` rewrite (4 `slac` sites). Stage 4: dependency wave, mixed-decls (cascade3 proof), `if()` migration with **no** silence. |
| 22 | 5.4.5 | 4 | Stage 1: `uniqueId` resolved. Stage 2: Twig 1 → 3. Stage 3: lint stack v4 (exact pins). Stage 4: CSS toolchain. |
| 23 | 5.4.6 | 1 | `splitChunks` moves to `webpack.common.js`. `core_version_requirement` decision, with `slac_helper` in lock-step. |
| 24 | 5.4.7 | tbd | New today. Wider eslint scope (40 → 42 files, React rules on `.jsx`), `globals` (a never-introduce decision), `assetVersion` (Twig parity), chalk 6. |

**Per hop:** plan → `diff` · `deviations` · `show` · `deps <tag> --apply` · `install` · `driftcheck` · `verify` (plus a clean `npm ci` when majors move) → present the diff → commit on approval → a follow-up commit recording the hop's SHA (never amend).

**Tagging:** no tags until the end. Every tag publishes a release and notifies Satis.

### Phase 3: Post-upgrade assessment series (one evidenced commit each)

1. The §2E fixes.
2. PHP re-lands you choose to keep (§3, decision 3), each with a `php-review-notes` entry and a consumer-impact line.
3. Consider upstream 5.4.6's static `common:` library. `slac_library_info_build()` only defines `slac/common` for the active theme, so sub-themed sites lose it; slac-today already carries a workaround. This is a correctness fix; verify it on a consumer site with and without aggregation.
4. A Storybook comparison against the 6.5 reference: DOM classes, pixels, story names, attach timing. Record the counts.

### Phase 4: Reconcile, merge, release

- **Reconcile.** Diff the rebuilt tip against the `archive/gesso-upgrade-v1` branch. Every difference should be one of:
  - a scope reversion (CSF3, mixins, PHP);
  - a W6-D9-aligned decision;
  - a bug fix;
  - a dependency-resolution difference, since the lockfile evolved from `main`'s instead of being regenerated. Expect these to dominate the diff; attribute them with `driftcheck` and the harnesses.

  Record the rest.
- **Consumer-site check.** Use the slac-drupal-profile ddev checkout. Its current copy of the theme is a stale overlay, so reinstall it cleanly first.
- **D11.** If you declare it, land and release the `slac_helper` bump in slac-drupal-profile first.
- **Merge and release.**
  1. **You** switch GitHub Pages to "GitHub Actions" (a repo setting), then merge to `main`.
  2. Confirm the first `deploy-pages` run.
  3. Cut **one** release tag.
  4. Write release notes covering the backward-compatibility items: D11, removed libraries and templates, any PHP renames.

---

## 5. Route B: retrofit the current tip (cheaper, no per-release history)

1. **Phase 0, CI and release hygiene only** (step 3 of Phase 0). Your product changes are already on the branch, so they are not re-landed on `main`.
   - Splitting `f712137` into single-purpose commits means rewriting `gesso-upgrade`, and at that point it is a partial rebuild from `7016516`.
   - Otherwise, leave it and record what it did in `non-hop-cleanup-f712137.md`.
   - Pages timing is the same as in Route A: switch just before the merge.
2. **Phase 1 as above**, including `files: 'source'` (already present) and the outside-repo baseline. Seed retro records: `retro-5.0.9-5.4.2.md`, `retro-5.4.2-5.4.6.md`, `non-hop-cleanup-f712137.md`.
3. **Baseline and pins.** Snapshot the tip, then pin every difference from the 5.0.9 baseline with its cause.
   - Build `7016516` as well. That separates upgrade effects from `f712137`'s product removals in styles, editor-styles and mega-menu.
   - CSS: 13 files (mixed-decls, prefix drops, normalisations), proved with cascade3 rather than a strict-order check.
   - `dist/js`: behaviour sets are identical across all 28 shared entries. 5 entries register no behaviour, so add AST attribution (webpack/terser identifier and runtime changes).
   - **Re-pin after each step 4 change**, since each one moves the output again.
4. **End-state alignment commits**, one per item:
   - Take upstream verbatim and re-apply only registered deviations (§2D).
   - Do the `if()` migration and remove both silences.
   - Take the `_button.scss` autofix.
   - Resolution pins, per decision 12: sass-embedded, webpack, terser plus minimizer-webpack-plugin overrides, and the @forumone exact pins. Prove each delta inert.
   - Drop `@swc/cli`. Add `source/@types` and restore `.dockerignore`, or register their absence.
5. **Scope reversions:**
   - Remove `subheadingLevel` and the unused mixins (both routes).
   - Your call: restore the `'slac'` argument in `theme_get_setting`, or audit sub-theme settings first.
   - CSF3 would realistically stay, as a registered deviation. Extend the story-name indexer's regex for `name:` (§2E).
6. **Then:**
   - the §2E fixes;
   - the static `common:` library decision (Phase 3, item 3);
   - the 5.4.7 hop, as the first real run of the process.

---

## 6. Adaptations W6-D9's method needs in SLAC

- **The theme is the repo root.**
  - `.claude/`, including Claude worktrees under `.claude/worktrees/`, sits inside the theme.
  - Add the StylelintPlugin `files: 'source'` scoping at the very start and keep it through every `take`.
  - Keep the upstream clone and the baselines outside the repo.
  - TypeScript already skips dot-directories, so `tsconfig` needs no change.
- **It is a Composer package with a release zip.**
  - The records must be excluded from the zip in a way that actually works (§4, Phase 0).
  - Every tag is a public release, so hops are never tagged.
- **No Drupal site in the repo.** Name the slac-drupal-profile ddev checkout as the harness for PHP API checks, template render equivalence, `slac/common` with aggregation, and sub-theme behaviour.
- **Storybook is SLAC's render surface.** Its Pages demo, built from `main`, is the equivalent of W6-D9's Pantheon reference.
- **`.nvmrc` sets the CI runtime.** In W6-D9 that role belongs to `pantheon.yml`.

---

## Appendix: measured SLAC tip (`f712137`)

- **Node:** Node 24 (`.nvmrc`). A Node 22 build produces identical `dist/`.
- **Install:** `npm ci` OK with 1037 packages. `npm audit` reports 3 moderate advisories, shared with upstream.
- **Lint:** eslint 40 files, 0/0. stylelint 208 files, 0.
- **Build:** exit 0, 0 warnings; 105 `if-function` warnings if the silence is removed. Output is 36 CSS and 31 JS files.
- **Storybook:** SB 10.5.10, 233 index entries (230 stories + 3 docs).
- **Sprite:** 37 symbols, 37 with viewBox, ids equal the source filenames.
- **Compared with 5.0.9:**
  - Design tokens and `_GESSO.es6.js` are byte-identical.
  - `dist/css`: 23 files identical, 13 different, 4 removed by `ce9ea88`.
  - `dist/js`: behaviour sets are identical across all 28 entries both builds share.
- **Local baselines** (untracked, in the main checkout's `.claude/`):
  - `gesso-baseline/` (5.0.9) matches a fresh 5.0.9 build.
  - `baseline-542/` is an intermediate reference only.
- **Scratch evidence** (logs, `behaviors.cjs`, the CSS classifiers): `/private/tmp/claude-1389521917/…/scratchpad/`.
