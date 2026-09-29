# Review flags: for the user

The user is **not** reviewing every commit of this rebuild (their decision, 2026-09-29). They review this file instead. It has two parts:

1. **Needs your action:** things the agent cannot or must not do itself.
2. **Flags:** every place the rebuild **differs from a decision made on W6-D9** (`/Users/btschu/Development/W6-D9`, branch `gesso-upgrade-hop-by-hop`). That includes SLAC adaptations W6-D9 never needed.

**How to flag** (for the agent):
- Add an entry below, and put `Review-Flag: F-NN` in the commit message trailer.
- Keep entries short; the rationale detail belongs in the hop plan or the register.
- Do not flag pure path mapping (`gesso` → `slac`, `web/themes/gesso/X` → `X`), or following W6-D9 exactly.
- **Stop and ask** instead of flagging for the four cases listed in `gesso-STATE.md` → **Review protocol**.

---

## Needs your action

| # | When | What | Status |
| --- | --- | --- | --- |
| A-0 | Before starting the new session | Permission for routine commands. **Decided 2026-09-29:** commit W6-D9's allowlist as `.claude/settings.json`. It has W6-D9's 46 rules verbatim, plus the same helper and git commands in the absolute-path / `git -C /Users/btschu/Development/slac-gesso-rebuild` form STATE prescribes. It doesn't cover `git push`, `gh`, `node`, `npm audit` or `npm update`, so those still prompt, as in W6-D9. Run the session in auto mode if even those prompts are too many. | done |
| A-1 | Before merging to `main` | Switch GitHub Pages (repo Settings → Pages → Source) from "Deploy from a branch" (`gh-pages`) to **GitHub Actions**. From hop 13, `publish-demo-site.yml` deploys with `actions/deploy-pages`, which the legacy setting cannot serve. Don't switch earlier: until the merge, `main`'s workflow still deploys to `gh-pages`. | open |
| A-2 | Before the release tag | In **slac-drupal-profile**, bump `web/modules/custom/slac_helper/slac_helper.info.yml` `core_version_requirement` to `'^10.3 \|\| ^11'` and release it **before** tagging the theme. The theme declares `'^10.3 \|\| ^11'` at hop 23. Reconcile with that repo's `drupal11` WIP branch (`8bef79b2`).<br>**Check consumers first.** Of the local consumer checkouts (2026-09-29), 15 are on core 10.2.x (end-of-life). Most pin old theme releases (`v2.0.0-alpha*`, 2024), but `slac-int-covid19-d9` (core 10.2.7) took theme v2.1.6 in April 2026, so it would pick up the new requirement on its next update. `composer.json` has no `drupal/core` constraint, so Composer won't stop it; Drupal will flag the theme as incompatible. Confirm production core versions before tagging. Optionally add a `drupal/core` constraint to `composer.json` (a SLAC addition, so flag it if done). | open |
| A-3 | End | Review the draft PR into `main`, merge it, then cut **one** release tag. The agent never tags, since every tag is a public release plus a Satis notification. | open |

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
- Hop / commit: post-upgrade (README commit)
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

### F-09: glob 10.5.0 instead of upstream's tested 10.3.3   [low]
- Hop / commit: non-hop `.npmrc` removal after hop 11 / `1536380`
- W6-D9 decided: take glob `^10.3.3` in its `.npmrc` commit (`57e1f95c`); its lockfile resolved **10.5.0**.
- We did: the same range and the same 10.5.0 resolution, chosen deliberately rather than upstream's tested 10.3.3.
- Why: 10.3.3 is inside GHSA-5j98-mcp5-4vw2 (glob CLI command injection via `-c`); the STATE security carve-out takes the lowest non-advisory version. We use only the library API at build time. `dist/` is byte-identical between the two.
- Risk / how to undo: none known; `npm install glob@10.3.3` restores upstream's resolution.

### F-10: Storybook 7.6.21 and yaml 2.8.3 instead of upstream's tested 7.5.1 / 2.3.1   [low]
- Hop / commit: hop 12 (5.2.5) / `e45ec2c`
- W6-D9 decided: lift the Storybook pin at 5.2.5 and let npm resolve; it got Storybook 7.6.24 and yaml 2.9.1 (newest).
- We did: pin to upstream's tested resolutions, except these two, which sit in advisory ranges: Storybook `<7.6.21` (GHSA-8452, high: env vars can leak into the manager bundle at build time; our demo is built in CI and published to Pages) and yaml `<2.8.3` (GHSA-48c2, moderate). Both at the lowest non-advisory version.
- Why: the STATE security carve-out. The token artifacts are byte-identical with yaml 2.3.1 or 2.8.3; Storybook builds with identical story IDs.
- Risk / how to undo: Storybook 7.6.21 is a minor ahead of upstream's tested 7.5.1 (W6-D9 ran 7.6.24 without trouble). Undo with `npm install storybook@7.5.1 …` (not recommended: GHSA-8452).
- Correction (hop 14): at hop 12 two direct addons (`addon-a11y`, `addon-links`) had been left at 7.5.1 by the lockfile tooling; hop 14 put them on 7.6.21 with the rest.

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

<!-- Pre-decided flags to raise when their hop lands (fill in hop/commit then):
  - hop 16 s2 (5.3.2): sprite.js -> sprite.cjs taken at the hop (W6-D9 skipped it under the
    source/ rule and fixed it later in c5b7e7f3)
  - hop 23 (5.4.6): minimizer-webpack-plugin pinned alongside overrides.terser (W6-D9 pins terser only)
  - post-upgrade: theme-settings.php fix re-landed (W6-D9: PHP documented only)
  - post-upgrade: README switched to the SLAC package README (F-01)
  - anything else that departs from a W6-D9 register row, hop plan or decision
-->
