# Review flags: for the user

The user is **not** reviewing every commit of this rebuild (their decision, 2026-09-29). They review this file instead. It has two parts:

1. **Needs your action:** things the agent cannot or must not do itself.
2. **Flags:** every place the rebuild **differs from a decision made on W6-D9** (`/Users/btschu/Development/W6-D9`, branch `gesso-upgrade-hop-by-hop`). That includes SLAC adaptations W6-D9 never needed.

**How to flag** (for the agent):
- Add an entry below, and put `Review-Flag: F-NN` in the commit message trailer.
  (From hop 19 on, F-16 to F-29, the flagged commits carry no trailer: the convention lapsed and pushed history is not rewritten. Each flag's `Hop / commit` line gives the SHA.)
- Keep entries short; the rationale detail belongs in the hop plan or the register.
- Do not flag pure path mapping (`gesso` → `slac`, `web/themes/gesso/X` → `X`), or following W6-D9 exactly.
- **Stop and ask** instead of flagging for the four cases listed in `gesso-STATE.md` → **Review protocol**.

---

## Needs your action

| # | When | What | Status |
| --- | --- | --- |--------|
| A-0 | Before starting the new session | Permission for routine commands. **Decided 2026-09-29:** commit W6-D9's allowlist as `.claude/settings.json`. It has W6-D9's 46 rules verbatim, plus the same helper and git commands in the absolute-path / `git -C /Users/btschu/Development/slac-gesso-rebuild` form STATE prescribes. It doesn't cover `git push`, `gh`, `node`, `npm audit` or `npm update`, so those still prompt, as in W6-D9. Run the session in auto mode if even those prompts are too many. | done   |
| A-1 | Before merging to `main` | Switch GitHub Pages (repo Settings → Pages → Source) from "Deploy from a branch" (`gh-pages`) to **GitHub Actions**. From hop 13, `publish-demo-site.yml` deploys with `actions/deploy-pages`, which the legacy setting cannot serve. Don't switch earlier: until the merge, `main`'s workflow still deploys to `gh-pages`. | done   |
| A-2 | Before the release tag | In **slac-drupal-profile**, bump `web/modules/custom/slac_helper/slac_helper.info.yml` `core_version_requirement` to `'^10.3 \|\| ^11'` and release it **before** tagging the theme. The theme declares `'^10.3 \|\| ^11'` at hop 23. Reconcile with that repo's `drupal11` WIP branch (`8bef79b2`).<br>**Check consumers first.** Of the local consumer checkouts (2026-09-29), 15 are on core 10.2.x (end-of-life). Most pin old theme releases (`v2.0.0-alpha*`, 2024), but `slac-int-covid19-d9` (core 10.2.7) took theme v2.1.6 in April 2026, so it would pick up the new requirement on its next update. `composer.json` has no `drupal/core` constraint, so Composer won't stop it; Drupal will flag the theme as incompatible. Confirm production core versions before tagging. Optionally add a `drupal/core` constraint to `composer.json` (a SLAC addition, so flag it if done). | done   |
| A-4 | Optional, any time | In **slac-drupal-profile**, take upstream's `AddAttributesTwigExtension` fix (`262f63cd`, Gesso 5.4.4) into `slac_helper`: when a template's `attributes` is a plain array, wrap it in `new Attribute()` rather than calling methods on it. `slac_helper`'s copy creates an `Attribute` only when the value is empty, so a non-empty array fatals on `->offsetExists()`. Theme-independent; see `php-review-notes.md` → 5.4.4. | done   |
| A-5 | At merge | Decide whether to untrack `.claude/baseline/` (W6-D9 did it as its last commit, `12de09d0`). It is the evidence for "no visible change" (the `dist/` snapshot and every `expected-since-*` pin); `.gitattributes` already keeps all of `.claude/` out of the release zip. | done   |
| A-6 | After merge | `.github/workflows/ci.yml` runs on every PR and on pushes to `gesso-upgrade-hop-by-hop`; point `push` at `main` (or drop it) once merged. Its "lint scripts arrive with Gesso 5.1.2" guard is no longer needed either. | done   |
| A-3 | End | Review the draft PR into `main`, merge it, then cut **one** release tag. The agent never tags, since every tag is a public release plus a Satis notification. | done   |
| A-7 | Before the profile moves its theme pin to a release with Gesso 5.4.7 | In **slac-drupal-profile**, push and merge `ca85dd76` (local commit on its `gesso-upgrade` branch, not pushed): `slac_helper` gains `asset_version()` and the boolean `add_attributes` branch (hop 24 stage 2). **It must ship with, or before, the pin bump**: with the old `slac_helper`, the theme's new `icon.twig` fails on every page with `Unknown "asset_version" function` (reproduced standalone with the profile's Twig 3.29.0). Order: tag the theme, then one profile commit that bumps `slac/slac-drupal-profile-theme` in `upstream-configuration/composer.json` on top of `ca85dd76`, then `drush cr` on deploy (new service). Any site that requires the theme directly, outside the profile's pin, needs the same `slac_helper` first. | open |

---

## Flags (differs from W6-D9)

Format:

```
### F-NN: <short title>   [low | medium | high]
- Hop / commit: <hop> / <sha>
- W6-D9 decided: <what, with a pointer: register row, plan, commit>
- We did: <what>
- Why: <one or two lines>
- Risk / how to undo: <one line>
```

### F-01: README.md becomes SLAC-owned after the hops   [low]
- Hop / commit: post-upgrade item 8b / `c9f0a31`
- W6-D9 decided: README taken from upstream verbatim every hop, and kept that way.
- We did: take it verbatim during hops 1–23, exactly as W6-D9 did. After the hops, replace it with the SLAC package README (from `f712137`, corrected), then treat it as SLAC-owned (hand-applied) for future hops.
- Why: your 2026-09-29 decision was to keep the README as the Composer package's docs. It turned out that `main`'s README is upstream 5.0.9's, byte-identical, and the SLAC README only exists on the old branch. This way the README tracks upstream while the hops run and ends up as the package docs, which is what you asked for.
- Risk / how to undo: after the switch, upstream doc changes can be missed. Each later hop plan's README section is the check.

### F-02: The user's product changes ride at the start of the upgrade branch   [low]
- Hop / commit: hop 0, step D / D1 `df0ba0b`, D2 `2cedae3`, D3 `9df5d33`, D4 `3020d41`, D5 `0d9f0d0`, D6 `a905ff6`, D7 `b905363`, D8 `6d705b3`
- W6-D9 decided: product and our-scope fixes landed as separate commits *after* the hops (the assessment series).
- We did: replay the user's own deletions and fixes from the old branch (`ce9ea88`, `87b2ba3`, the product parts of `f712137`) before hop 1, as single-purpose commits.
- Why: the user's decision. It stops hops making forced edits to files that are about to be deleted, and the baseline is taken after them.
- Risk / how to undo: these commits change rendered output on purpose (fewer components and templates, a new template). Each commit message names what it removes or adds.
- D8 revives four dead story files (block, dropbutton, field, fieldset: +6 stories) in CSF2. W6-D9 **deleted** its dead stories at 5.2.0 instead.

### F-03: SLAC-only CI/release changes on the upgrade branch   [low]
- Hop / commit: hop 0, step E / E1 `973222b`, E2 `bdadd93`, E3 `ef52774`
- W6-D9 decided: nothing comparable. W6-D9 deploys on Pantheon and has no release zip.
- We did:
  - add `.github/workflows/ci.yml` (build and lint on PRs and on pushes to this branch);
  - fix `build-assets.yml` zip exclusions (shell-expanded patterns never excluded directories; `.claude/` must not ship; `source/` must keep shipping);
  - make `notify-satis` wait for `build_gesso`;
  - add a zip-contents assertion and `.gitattributes` `export-ignore` for `.claude/`.
- Why: the user's decision. Committed `.claude/` records would otherwise ship in `slac.zip`, and nothing checked a build before merge.
- Risk / how to undo: changes the release job. The first real tag after merge is the proof, and each change is its own commit.

### F-04: StylelintPlugin scoped to `files: 'source'`   [low]
- Hop / commit: hop 0, step C / `328a8ce` (re-applied after every `take webpack.common.js`)
- W6-D9 decided: `webpack.common.js` StylelintPlugin as upstream ships it, with no `files` option.
- We did: add `files: 'source'`.
- Why: the theme root is the repo root, and `.claude/` inside it can hold CSS. The plugin globs dot-directories, and the build crashed on 2026-09-29 at 5.0.9 when it did. The old branch made the same fix at 2db019c.
- Risk / how to undo: none for output (lint scope only). A future `take` drops it unless the register row is honoured.

### F-05: lodash bumped out of its advisory range   [low]
- Hop / commit: hop 0, step E4 / `e385018`
- W6-D9 decided: site-only runtime dependencies untouched; its tip still ships lodash 4.17.21.
- We did: `npm update lodash` 4.17.21 → 4.18.1 (inside the declared `^4`; lockfile only), before the baseline.
- Why: the STATE security carve-out. lodash 4.17.21 has a high advisory (GHSA-r5fr-rjxr-66jc) and is bundled into `dist/js/header.es6.js`. `npm audit` 115 → 114.
- Risk / how to undo: only `header.es6.js` changes; behaviours 29/29 identical and the `debounce`/`throttle` code it calls is byte-identical. Undo by reverting the lockfile entry.

### F-06: `lib/transform.js` taken verbatim from hop 1   [low]
- Hop / commit: hop 1 (5.0.10) / `c705c40`
- W6-D9 decided: at its hop 1, hand-merge only upstream's error-aggregation change and keep the file's local Prettier formatting; at 5.2.0 it switched to "upstream verbatim + the `font-feature-settings` branch" (`c50589d4`).
- We did: the verbatim take plus the branch (with a one-line `// Local:` marker) from hop 1, per the register.
- Why: it is W6-D9's final decision, applied from the first hop, so later upstream edits to the file never conflict on formatting.
- Risk / how to undo: none for output; `_design-tokens.artifact.scss`, `_GESSO.es6.js` and `dist/design-tokens.js` are byte-identical.

### F-07: `images/backgrounds` output path taken at 5.1.4   [low]
- Hop / commit: hop 6 (5.1.4) / `f773ccc`
- W6-D9 decided: skip `webpack.common.js`'s `images/[hash]` → `images/backgrounds/[hash]` at its hop 6 (it would have rewritten W6-D9's CSS `url()`s and orphaned 68 tracked files), then adopt it post-upgrade in `73f02b22`.
- We did: take it at the hop, as upstream ships it.
- Why: for SLAC it is output-neutral. Every image the Sass references is inlined as a `data:` URI, nothing is emitted to `dist/images/backgrounds/`, and `dist/css` is byte-identical. Taking it now keeps `webpack.common.js` verbatim-plus-register.
- Risk / how to undo: a future non-inlined image would be emitted under `dist/images/backgrounds/` (gitignored, built in CI and shipped in the release zip). Undo by restoring the old `generator.filename`.

### F-08: Transitive lockfile drift rewound; three advisory exceptions in build tooling   [medium]
- Hop / commit: hop 7 (5.2.0) / `42f5588`
- W6-D9 decided: never regenerate the lockfile; pin output-generating packages to upstream's tested versions. It never had to rewind **transitive** packages: its lineage was already past upstream's versions at 5.2.0 (webpack 5.99.5, Babel 7.26), so upstream's new ranges moved nothing.
- We did: SLAC's `main` lock was older (webpack 5.76.3, Babel 7.21), so upstream's `^5.82.0`/`^7.21.8`/`^7.21.5` forced moves, and npm floated 134 existing top-level packages to their newest versions (Babel helpers 7.29, browserslist 4.29, caniuse-lite …813), changing `dist/css` and `dist/js`. New `gesso-harness/lockfix.sh` rewound each to its previous or upstream-tested resolution (109 of 126 moved packages now sit exactly at upstream 5.2.0's), never into an advisory range except for output-generating build tooling. Result: `dist/css` identical, `dist/js` identical but for one pinned `sprite.js` runtime change; `npm audit` 113 → 85.
- The three exceptions (kept inside an advisory range, all build-time only): **webpack 5.82.0** (upstream's tested; its DOM-clobbering gadget GHSA-4vvj is emitted only into `dist/js/sprite.js`, which no library or template loads, and was already in `main`), **@babel/helpers 7.21.5** (GHSA-968p concerns named capture groups in `.replace`; our source has none), **browserslist 4.21.5** (`main`'s; stats-file and cache advisories).
- Why: the STATE rule "pin to upstream's tested versions" applied one level down (trap W1), and "no visible change".
- Risk / how to undo: the rewound lockfile is less "fresh" than npm's float; the Storybook/jest dev tooling that could not be rewound safely keeps npm's newer versions. Undo per package with `npm install <pkg>@<version>`. If you would rather move webpack out of GHSA-4vvj now (≥5.94.0, a large jump past upstream's tested version with `dist/js` runtime changes to pin), say so.
- Follow-up (non-hop after hop 11): hop 7's rewinds had left two unsatisfied edges in jest/coverage tooling (`make-dir`, `convert-source-map`; `npm ls` agrees), and a naive hoist broke `glob-promise`'s peer. New `lockcheck.cjs` finds and repairs such edges, and `lockfix.sh` now runs it; the lockfile has had no unsatisfied edge since (apart from `twig-loader`'s long-standing peer, which upstream shares).
- Extended at hop 24 s1 (5.4.7): **browserslist 4.28.6 → 4.28.8**, with `electron-to-chromium` 1.5.404, `node-releases` 2.0.53 and `update-browserslist-db` 1.3.1, transplanted from upstream 5.4.7's lockfile. 4.28.6 sits inside two high advisories published after hop 23 (GHSA-c83g-rgw3-j3cx, GHSA-73wf-gq98-2v4g, `<=4.28.6`; build-time only, like the 4.21.5 exception above). Upstream's tested version is outside them, so pin-to-upstream and the security rule agree. W6-D9 floats browserslist (4.29.0). `dist/css` and `dist/js` byte-identical; `npm audit` 29 → 28.

### F-09: glob 10.5.0 instead of upstream's tested 10.3.3   [low]
- Hop / commit: non-hop `.npmrc` removal after hop 11 / `1536380`
- W6-D9 decided: take glob `^10.3.3` in its `.npmrc` commit (`57e1f95c`); its lockfile resolved **10.5.0**.
- We did: the same range and the same 10.5.0 resolution, chosen deliberately rather than upstream's tested 10.3.3.
- Why: 10.3.3 is inside GHSA-5j98-mcp5-4vw2 (glob CLI command injection via `-c`); the STATE security carve-out takes the lowest non-advisory version. We use only the library API at build time. `dist/` is byte-identical between the two.
- Risk / how to undo: none known; `npm install glob@10.3.3` restores upstream's resolution.
- Extended at hop 18 (5.4.1, `e723c23`): **glob 11.1.0** instead of upstream's tested 11.0.0 (`>=11.0.0 <11.1.0` is the same advisory). W6-D9's float resolved 11.1.0 as well. `dist/` is identical.

### F-10: Storybook 7.6.21 and yaml 2.8.3 instead of upstream's tested 7.5.1 / 2.3.1   [low]
- Hop / commit: hop 12 (5.2.5) / `e45ec2c`
- W6-D9 decided: lift the Storybook pin at 5.2.5 and let npm resolve; it got Storybook 7.6.24 and yaml 2.9.1 (newest).
- We did: pin to upstream's tested resolutions, except these two, which sit in advisory ranges: Storybook `<7.6.21` (GHSA-8452, high: env vars can leak into the manager bundle at build time; our demo is built in CI and published to Pages) and yaml `<2.8.3` (GHSA-48c2, moderate). Both at the lowest non-advisory version.
- Why: the STATE security carve-out. The token artifacts are byte-identical with yaml 2.3.1 or 2.8.3; Storybook builds with identical story IDs.
- Risk / how to undo: Storybook 7.6.21 is a minor ahead of upstream's tested 7.5.1 (W6-D9 ran 7.6.24 without trouble). Undo with `npm install storybook@7.5.1 …` (not recommended: GHSA-8452).
- Correction (hop 14): at hop 12 two direct addons (`addon-a11y`, `addon-links`) had been left at 7.5.1 by the lockfile tooling; hop 14 put them on 7.6.21 with the rest.
- Extended at hop 16 s4 (5.3.2, `3a2849d`): **Storybook 8.6.17** instead of upstream's tested 8.0.5. `>=8.0.0 <8.6.15` is GHSA-8452 again, and `>=8.1.0 <8.6.17` a dev-server WebSocket-hijacking advisory; 8.6.17 is the lowest with neither. W6-D9 floated to 8.6.18.
- Extended at hop 20 s2 (5.4.3, `3d20d53`): **Storybook 9.1.19** instead of upstream's tested 9.1.1 (GHSA-8452 below 9.1.17, GHSA-mjf5 below 9.1.19; W6-D9 floated to 9.1.20). One advisory remains, recorded rather than chased because no 9.x escapes it: GHSA-82fw-gwwq-j7x9 in `@vitest/mocker` 3.2.4 (pinned exactly by every 9.x). Its vulnerable code is Vite's node-side `interceptorPlugin`, which our webpack-builder Storybook never runs; it lapses with Storybook 10 at 5.4.4 s2.
- Extended at hop 21 s2 (5.4.4, `0498ba3`): **Storybook 10.2.10** instead of upstream's tested 10.2.7 (GHSA-mjf5 below 10.2.10). No Storybook advisory remains (audit 35 → 24). W6-D9 floated to 10.6.0.

### F-11: First `dist/css` change: two `-webkit-` logical-property prefixes dropped   [low]
- Hop / commit: hop 12 (5.2.5) / `e45ec2c`
- W6-D9 decided: nothing comparable; its lockfile already had newer caniuse data before the upgrade, so its baseline never had these prefixes to lose.
- We did: accept autoprefixer's output with upstream 5.2.5's tested browserslist 4.22.1 / caniuse-lite 1.0.30001551, which Babel 7.23 forces. `-webkit-margin-start` (`.c-cta-link+.c-cta-link`) and `-webkit-padding-end` (`.c-form-item--select-filters .c-form-item__select`) go; the unprefixed declarations stay. Pinned in `expected-since-5.2.5/`.
- Why: inert for every browser the theme declares (`last 2 versions and not dead`, `>= 1%`, `>= 1% in US`: none of the 31 needs a prefix). The only browser that ever needed it, UC Browser for Android 13.4, has aged out of that window.
- Risk / how to undo: a visitor on UC Browser for Android 13.4 would lose a 1.5rem gap between adjacent CTA links and 48px of right padding on filter selects. Any rebuild with current caniuse data does the same. Undo only by holding caniuse-lite back, which Babel 7.23 does not allow.

### F-12: `publish-demo-site.yml` hand-applied with SLAC edits   [low]
- Hop / commit: hop 13 (5.2.6) / `343f2a9`
- W6-D9 decided: nothing comparable; its GitHub workflows are all disabled (it deploys Storybook through Pantheon).
- We did: upstream's new build → `upload-pages-artifact` → `deploy-pages` workflow, keeping `branches: [ main ]`, SHA-pinned actions at their current releases (`upload-pages-artifact` v5.0.0, `deploy-pages` v5.0.1; upstream's `@v2` depends on the retired `upload-artifact` v3), and a `setup-node` step reading `.nvmrc`. `storybook-deployer` and `deploy-storybook` are gone, as upstream.
- Why: the register row; the old `storybook-to-ghpages` path is removed upstream.
- Risk / how to undo: the first run happens on the merge to `main`, and it fails unless the Pages source is "GitHub Actions" (A-1). Undo by restoring `main`'s workflow and `deploy-storybook` (not recommended; the deployer package has critical advisories).

### F-13: `_site-name.scss` block split for the new LVHFA plugin   [low]
- Hop / commit: hop 13 (5.2.6) / `343f2a9`
- W6-D9 decided: its only forced edit here was upstream's `_button-group.scss` fix (also taken here).
- We did: in addition, moved the second `:hover/:focus/:active` group of `.c-site-name__acronym` into its own block with a one-line comment. The rewritten plugin checks pseudo-class order across sibling rules, so two separate groups in one block failed the build.
- Why: "forced edits are in scope; never switch off a check". The split keeps the rule on and compiles to byte-identical CSS.
- Risk / how to undo: none for output. Undo by merging the blocks back (the build then fails the rule).

### F-14: `sprite.js` → `sprite.cjs` taken at 5.3.2 stage 2   [low]
- Hop / commit: hop 16 stage 2 (5.3.2) / `a99095d`
- W6-D9 decided: skip it at the hop under the `source/` rule; the sprite then broke silently under `"type": "module"` and was fixed four hops later (`c5b7e7f3`).
- We did: take upstream's own same-release fix (`89f6d565`) in the same stage as `"type": "module"`.
- Why: it is a forced edit of the kind STATE allows (a toolchain change requires it), and it keeps the sprite working; `dist/images/sprite.artifact.svg` stayed byte-identical.
- Risk / how to undo: none known. Reverting it without reverting `"type": "module"` would drop the sprite.

### F-15: `@swc/core` 1.11.20 instead of upstream's tested 1.4.11   [medium]
- Hop / commit: hop 16 stage 3 (5.3.2) / `1dbbba2`
- W6-D9 decided: take upstream's SWC packages and let npm resolve; it got 1.16.2, and its output matched Babel's.
- We did: pin `@swc/core` to 1.11.20, the lowest version that reads the `browserslist` key in `package.json` (bisected; 1.4.11 through 1.11.18 ignore it). `package.json` keeps upstream's `^1.4.6`.
- Why: with upstream's 1.4.11 SWC saw no targets and compiled to loose ES5 with core-js polyfills (+32% `dist/js`; loose spread/for-of change meaning for NodeLists), which is not provably inert. With 1.11.20 the output uses exactly the same syntax features as the hop-0 baseline and registers identical behaviours. Upstream itself shipped ES5 builds from 5.3.2 until 5.4.3.
- Risk / how to undo: 1.11.20 is 7 minors past upstream's tested SWC; W6-D9 ran 1.16.2. The pin rejoins upstream at 5.4.3 (1.13.3). Undo by `npm install @swc/core@1.4.11` (not recommended).
- **Lapsed at hop 20 s3 (5.4.3):** `@swc/core` is at upstream's tested 1.13.3.

### F-16: eslint 9.27.0, `postcss-selector-parser` 7.1.3, `inquirer` 9.3.8 instead of upstream's tested 9.23.0 / 7.1.0 / 9.3.7   [low]
- Hop / commit: hop 19 (5.4.2) / `d6283eb`
- W6-D9 decided: take upstream's ranges and let npm resolve; it got 9.39.5 / 7.1.6 / 9.3.8.
- We did: pin every moved package to upstream 5.4.2's tested resolution (121 of 128 exactly), except these three, which sit in advisory ranges: eslint 9.23.0 cannot reach the fixed `@eslint/plugin-kit` 0.3.4 (9.27.0 is the first that can), `postcss-selector-parser` `<7.1.3`, and `inquirer` 9.3.7's `tmp` chain. Each at the lowest non-advisory version. `package.json` keeps upstream's ranges.
- Why: the STATE security carve-out. All three are lint / scaffolding tooling; `dist/` is unaffected (lint results are identical in kind; nothing they touch is compiled).
- Risk / how to undo: eslint 9.27.0 is four minors past upstream's tested 9.23.0 with `@forumone/eslint-config-es5` 3.0.0 (which peers `eslint >=9.0.0`); lint is 40 files, 0/0. Undo with `npm install eslint@9.23.0 …` (not recommended).
- Hop 20 s3 (5.4.3): eslint rejoins upstream's tested **9.32.0** (its `@eslint/plugin-kit` range reaches the fixed 0.3.4+); `postcss-selector-parser` 7.1.3 and `inquirer` 9.3.8 stay (upstream still tests 7.1.0 / 9.3.7), as does glob 11.1.0 (F-09; upstream 11.0.3).
- Extended at hop 22 s4 (5.4.5, `a45e8f2`): **concurrently 10.0.4** instead of upstream's tested 10.0.3, which pins `shell-quote` 1.8.4 (GHSA-395f, high); 10.0.4 pins 1.9.0.
- Extended at hop 21 s4 (5.4.4, `4455c91`): **concurrently 9.2.4** instead of upstream's tested 9.2.1, which pins `shell-quote` 1.8.3 (GHSA-w7jw, critical; GHSA-395f, high). 9.2.4 pins 1.9.0. Dev tooling only.
- Extended at hop 20 s1 (5.4.3, `25a24f6`): **svgo 4.1.0** instead of upstream's tested 4.0.0 (four advisories, all fixed in 4.1.0; W6-D9's float resolved 4.1.0 as well). svgo writes the sprite's path data; all 37 symbols render pixel-identical to the 5.4.2 sprite. `svg-spritemap-webpack-plugin` itself is at upstream's tested 5.0.0 (W6-D9 floated to 5.1.4).
- Post-upgrade: `postcss-selector-parser` had floated within its range to **7.1.6** at hop 22 s4 (upstream 5.4.5 tested 7.1.1, inside the advisory, so the rule was to stay at 7.1.3; found by the reconcile against `f712137`). Re-pinned to upstream 5.4.6's tested **7.1.4** (outside the advisory; one lockfile entry; audit 14 → 14; `verify` PASS). That part of F-16 lapses.

### F-17: two `no-useless-assignment` fixes in SLAC-only code   [low]
- Hop / commit: hop 19 (5.4.2) / `d6283eb`
- W6-D9 decided: fix the new stack's errors in the code, never switch a rule off (its forced edits: 93 Prettier autofixes, 44 dead `import/*` disables, the `accordion` ternary, all taken here too where they apply).
- We did: in addition, `let lastTextChild = null;` → `let lastTextChild;` in `arrow-link.es6.js` and `external-link.es6.js`, SLAC's own word-wrapping code that W6-D9 does not have. Both branches that follow assign the variable before any read.
- Why: "forced edits are in scope; never switch off a check".
- Risk / how to undo: none for behaviour (29/29; the AST differs only at that initialiser). Pinned in `expected-since-5.4.2/`. Undo by restoring `= null` (lint then fails the build).

### F-18: `dist/design-tokens.js` is no longer built   [low]
- Hop / commit: hop 19 (5.4.2) / `d6283eb`
- W6-D9 decided: nothing; its verify never tracked this file.
- We did: accept upstream 5.4.2's tested webpack 5.98.0, which writes no JS for an entry made only of an `asset/source` module (`webpack.theme-config.js`'s `design-tokens`). The two real outputs, `_design-tokens.artifact.scss` and `_GESSO.es6.js`, are byte-identical. The absence is pinned (`expected-since-5.4.2/no-longer-emitted.txt`); verify fails if it reappears.
- Why: the old file was an 11 KB closed IIFE holding the YAML source as a string, with no effect and no reference anywhere (libraries, templates, PHP, or the profile's custom modules and themes).
- Risk / how to undo: the release zip loses a file nothing loads. A consumer that somehow pointed a library at it would get a 404. Undo only by holding webpack below 5.98, which upstream's `^5.98.0` range no longer allows.

### F-19: Storybook viewports migrated to Storybook 9's API   [low]
- Hop / commit: hop 20 stage 2 (5.4.3) / `3d20d53`
- W6-D9 decided: nothing; its `preview.js` has no viewport configuration.
- We did: SLAC's `preview.js` keeps its device viewports, so for Storybook 9 `INITIAL_VIEWPORTS` is imported from `storybook/viewport` (the addon is folded into core) and the parameter is `viewport: { options: INITIAL_VIEWPORTS }` (SB9's rename of `viewports`).
- Why: a forced edit; under SB9 the old import no longer resolves (the dev smoke test's negative control fails on exactly this kind of import) and the old key is ignored. Checked in the built Storybook: the viewport menu lists the full device set.
- Risk / how to undo: none for the theme's output (Storybook only). Undo by dropping the viewport block (loses the device list).

### F-20: upstream's `mixed-decls` silence removal taken at 5.4.4 stage 1   [low]
- Hop / commit: hop 21 stage 1 (5.4.4) / `0092487`
- W6-D9 decided: keep `silenceDeprecations: ['mixed-decls']` in both configs at stage 1 (removing it only added warnings), then retract that at stage 4: under sass-embedded 1.97.3 the flag is obsolete and warns on its own, and "upstream was right all along".
- We did: take upstream's removal at stage 1 with the rest of its 5.4.4 `webpack.common.js` / `.storybook/main.js` hunks (the ESM shim excepted, which goes with Storybook 10 in stage 2).
- Why: the register rule for this line is "follow upstream exactly; never keep a silence upstream lacks", and W6-D9's own end state agrees. A silence changes warnings only: `dist/` is identical, and the build shows the 42 `mixed-decls` warnings again (204 → 246) until stage 4's Sass bump.
- Risk / how to undo: none for output. Undo by re-adding the three lines to both configs until stage 4.

### F-21: `debug-storybook.log` added to `.gitignore`   [low]
- Hop / commit: hop 21 stage 2 (5.4.4) / `0498ba3`
- W6-D9 decided: nothing; it has no theme-level `.gitignore` (its site repo handles ignores).
- We did: hand-applied upstream's one-line `.gitignore` addition (a review-scope file) with Storybook 10, which writes `debug-storybook.log` when it fails.
- Why: "review, hand-apply what is relevant"; keeps a stray debug log out of commits.
- Risk / how to undo: none. Delete the line.

### F-22: the component scaffolder names the theme `slac`   [low]
- Hop / commit: hop 21 stage 3 (5.4.4) / `981cc1c`
- W6-D9 decided: take `lib/component.js` and the five `lib/templates/*.hbs` verbatim (its theme is called `gesso`, so upstream's hard-coded names were already right).
- We did: take them, then set the theme name in upstream's hard-coded sites: `attach_library('slac/…')`, `slac.libraries.yml`, `['slac/global']`, the missing-file message, and the `Drupal.behaviors.slac…` key prefix in `Javascript.hbs` (register row, pre-decided).
- Why: with `gesso` the tool would edit a nonexistent `gesso.libraries.yml` and emit libraries and behaviours under the wrong namespace. Checked by scaffolding a throwaway component non-interactively: five files with `slac` names, a `slac.libraries.yml` entry (then removed).
- Risk / how to undo: none for output (developer tool). Undo by retaking upstream's files.

### F-23: two prefix families dropped with upstream 5.4.4's caniuse data   [low]
- Hop / commit: hop 21 stage 4 (5.4.4) / `4455c91`
- W6-D9 decided: accept autoprefixer's output with its (floated) caniuse data; it dropped 6 `-webkit-hyphens`, after checking upstream's tested data gives the same.
- We did: the same with upstream 5.4.4's tested caniuse-lite 1.0.30001768 (forced by autoprefixer 10.4.24): `-webkit-hyphens` (20 selector declarations) and `-webkit-backdrop-filter` (2) go; the unprefixed declarations stay. Pinned in `expected-since-5.4.4/` with the same file's Sass mixed-declarations reordering, which `cascade3` proves order-preserving.
- Why: none of the 29 declared browserslist targets needs either prefix under the new data. The browsers that did, iOS Safari 15.6–17.7, were targets under the old data (≥1% US share) and have aged out.
- Risk / how to undo: on iOS/iPadOS Safari 15–17, `hyphens: none` stops applying to headings and the code-like elements (their default hyphenates only at soft hyphens), and the 4px backdrop blur behind the open menu at desktop widths disappears (the overlay itself stays). Undo only by holding caniuse-lite back, which autoprefixer 10.4.24 does not allow, or by adding those browsers to `browserslist` (a SLAC product decision).

### F-24: our Sass function files migrated to `sass:` modules at 5.4.5   [low]
- Hop / commit: hop 22 stage 4 (5.4.5) / `a45e8f2`
- W6-D9 decided: nothing needed; its `_gesso.scss`, `_numbers.scss` and `_unit-convert.scss` were upstream's, which had already moved to `sass:` module functions.
- We did: `stylelint-config-sass-guidelines` 13 turns `scss/no-global-function-names` into 29 build-failing errors in our copies, so they were migrated: `_numbers.scss` and `_unit-convert.scss` taken from upstream 5.4.5 (they differed only by this), `_gesso.scss` edited the same way by hand.
- Why: a forced edit (never switch the rule off). Global built-ins are aliases of the module functions: `dist/css` is byte-identical, and the build's 169 `global-builtin` deprecation warnings are gone (204 → 2; the 2 left are one `slash-div` in our `_card.scss`, reported once per stylesheet, and stay for post-upgrade item 9). Most of post-upgrade item 9 is therefore done here.
- Risk / how to undo: none for output. Sub-themes that `@use` these partials see the same function names; only the implementations changed.

### F-25: `minimizer-webpack-plugin` pinned at 5.6.1 beside `overrides.terser`   [low]
- Hop / commit: hop 23 (5.4.6) / `cb90684`
- W6-D9 decided: pin terser only (`overrides.terser` 5.49.0); its `minimizer-webpack-plugin` floats, and from 5.8 that plugin requires `terser ^5.51.0`, which conflicts with the override (an open gap in W6-D9, alignment analysis).
- We did: `overrides: { "minimizer-webpack-plugin": "5.6.1" }`, upstream 5.4.6's lockfile version, next to `terser` 5.49.0 (pre-decided in STATE).
- Why: webpack 5.108 pulls the plugin in as its default minimizer, and `webpack.theme-config.js` (no `minimizer` of its own) uses it to minify `_GESSO.es6.js`, so it generates output. Pinning both keeps the pair consistent and upstream's tested combination. `_GESSO.es6.js` is byte-identical.
- Risk / how to undo: none known. Drop the override when terser's override moves past 5.51.

### F-26: `theme-settings.php` fix re-landed after the hops   [low]
- Hop / commit: post-upgrade item 8 / `8903061`
- W6-D9 decided: document the PHP layer, apply nothing (its `theme-settings.php` stayed as it was).
- We did: re-land the old branch's `theme-settings.php` hunk (`f712137`): the typed signature with `?string $form_id = NULL` and `$theme` taken from `$form['config_key']`, passed to all nine `theme_get_setting()` reads. The user's decision (STATE, "PHP layer"). Upstream ships the same logic at 5.4.4/5.4.6.
- Why: the settings form showed the active (admin) theme's values as defaults for `slac` and every sub-theme; the admin-theme work-around was dead code.
- Risk / how to undo: a settings-page change only; front-end output is unchanged. Not exercised on a site (no Drupal here). Undo by reverting the commit.

### F-27: pager icon captures placed after the `<nav>` tag, not at the top   [low]
- Hop / commit: post-upgrade item 5 / `c50a18d`
- W6-D9 decided: `631e47ef` captures the pager icons with `{% set %}…{% endset %}` at the top of `pager.twig` and `pager--mini.twig`, as upstream's `pager.twig` does, and prints them inside the `{% apply %}` blocks.
- We did: the same captures, with upstream's `pager_icon_left_angle` / `pager_icon_right_angle` names, placed right after `<nav {{ add_attributes(…) }}>` instead of at the top; and the same fix in SLAC's own `filter-modal.twig`, whose capture sits just before its `apply` block.
- Why: slac_helper's `add_attributes()` takes the context's `attributes` and removes them, so the first `add_attributes()` to run gets Drupal's attributes. At the top, that is the first icon's `<svg>`, not the `<nav>`. Rendered with the site's Twig 3.29.0, core's `Attribute` and slac_helper's extension, our placement is byte-identical to the old templates in all 40 cases (both pagers and filter-modal, several states, `attributes` absent, `false`, empty and non-empty). W6-D9's top placement differs in the 7 cases with non-empty `attributes`, which move from the `<nav>` to the icon. Drupal gives every template an empty `attributes` object (core `template_preprocess()` / `ThemeManager`), which the includes in `pager.html.twig` and `views-mini-pager.html.twig` inherit, so in practice the placements differ only when a module adds pager attributes.
- Risk / how to undo: none known (the stories pass no `attributes`, the case where both placements agree). Undo by moving the captures to the top (W6-D9's form), which lets a module's pager attributes land on the icon.

### F-28: `@typescript-eslint/eslint-plugin` and `-parser` at 8.71.0, not upstream's tested 8.63.0   [low]
- Hop / commit: hop 20 stage 3 (5.4.3) / `f9a65e5`, where they floated; found post-upgrade by the reconcile against `f712137`.
- W6-D9 decided: take upstream's ranges and let npm resolve; it has 8.70.0.
- We did: nothing on purpose. During hop 20 s3's install the two direct packages floated within their unchanged `^8.26.1` range from 8.29.0 to 8.71.0 (upstream 5.4.3 tested 8.38.0). Neither harness caught it: `pinbump` lists only direct packages whose locked version has left the range, and `lockmin` never rewinds direct packages. The stage-3 plan's "every moved direct package pinned" is wrong for these two (corrected there). `gesso-harness/directcheck.cjs` now lists every direct package off upstream's tested version.
- Why left: re-pinning to upstream 5.4.6's 8.63.0 was tried post-upgrade and reverted. It moves only the two direct packages; `eslint-plugin-storybook` holds the shared `@typescript-eslint/utils` / `types` / … family at 8.71.0 (`lockmin` keeps a transitive package's previous resolution), which left 35 nested 8.63.0 duplicates and a mixed 8.63 / 8.71 lint stack, worse than one consistent 8.71.0 family. Lint tooling only; `dist/` never sees it; eslint 40 files, 0 errors, 0 warnings.
- Risk / how to undo: lint could report differently from upstream's tested version; it reports nothing today. To align, move the whole family (`typescript-eslint` and every `@typescript-eslint/*`) to upstream's version together, at the next Gesso upgrade.

### F-29: the React-effect `attachBehaviors` decorator not adopted   [low]
- Hop / commit: post-upgrade item 7 / `ff5483f`
- W6-D9 decided: `51fca15e` replaces the preview decorator's Storybook `useEffect` (it runs after `STORY_RENDERED`, which Storybook 10 holds back while CSS animations run, up to 5 s) with a React-effect wrapper in `decorators.jsx`; its Image Hero and Our Story went from 5.2 s to 0.2–0.4 s.
- We did: measured it (STATE: "optional; measure first") and kept upstream 5.4.6's hook.
- Why: no SLAC story is held. Over all 230 stories in headless Chrome, the first `attachBehaviors()` comes at a median of 1168 ms (max 2117 ms) with the hook and 1070 ms (max 2347 ms) with W6-D9's decorator in a trial build; per story the decorator gains a median 94 ms, within the run-to-run spread. The ~1 s is the story's own render (the decorator attaches right after it). A local deviation in two upstream files is not worth ~0.1 s. Details in `gesso-plans/post-upgrade.md` §7.
- Risk / how to undo: a story that starts a long CSS animation at load would get its behaviours late in Storybook only (Drupal is unaffected); none does today. Take `51fca15e` (without its `eslint-disable` line) if one appears.

### F-30: the dangling `alertBarPlayFn` import dropped from `default.jsx`   [low]
- Hop / commit: hop 24 stage 1 (5.4.7) / (this commit)
- W6-D9 decided: `044522e0` makes the unused imports in its two page wrappers bare side-effect imports and drops two now-unused `react/prop-types` directives; fix the code, never switch a rule off.
- We did: SLAC's only page wrapper has neither problem. The widened `eslint` script instead reports `alertBarPlayFn` imported and never used (plus Prettier on the same line). `alert-bar.stories.jsx` has never exported it, so the binding was always `undefined`; the name is removed and the module import for `AlertBar` stays.
- Why: "forced edits are in scope; never switch off a check" (as F-17).
- Risk / how to undo: none; the file is Storybook-only and its module graph is unchanged (233 index entries). Undo by restoring the name (lint then fails).

### F-31: the Drupal half of `asset_version` and boolean attributes lives in slac-drupal-profile   [medium]
- Hop / commit: hop 24 stage 2 (5.4.7) / (this commit); profile `ca85dd76` (local, not pushed)
- W6-D9 decided: `ccc397dd` takes upstream's `AssetVersionTwigExtension.php`, registers it in `gesso_helper.services.yml` and ports the `is_bool()` branch, all inside the theme, in the same commit as the Twig/JS side, and checks it on its local site.
- We did: the theme half here; the PHP half as a local commit on slac-drupal-profile's `gesso-upgrade` branch, where `slac_helper` lives (your decision, 2026-10-05). Checked standalone with the profile's Twig and core's `Attribute`, not on a running site (there is none here, and the profile's site stays untouched).
- Why: the theme has no helper module of its own; a theme cannot register Twig extensions.
- Risk / how to undo: release ordering (A-7). A theme release with this stage on a site without `ca85dd76` fatals on every page that renders an icon. Undo: revert this commit's `icon.twig`/JS changes, or drop `ca85dd76` before it is pushed.

<!-- Pre-decided flags to raise when their hop lands (fill in hop/commit then):
  - hop 23 (5.4.6): minimizer-webpack-plugin pinned alongside overrides.terser (W6-D9 pins terser only)
  - post-upgrade: theme-settings.php fix re-landed (W6-D9: PHP documented only)
  - post-upgrade: README switched to the SLAC package README (F-01)
  - anything else that departs from a W6-D9 register row, hop plan or decision
-->
