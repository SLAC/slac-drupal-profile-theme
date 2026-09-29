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
- Hop / commit: hop 1 (5.0.10) / (see hop table)
- W6-D9 decided: at its hop 1, hand-merge only upstream's error-aggregation change and keep the file's local Prettier formatting; at 5.2.0 it switched to "upstream verbatim + the `font-feature-settings` branch" (`c50589d4`).
- We did: the verbatim take plus the branch (with a one-line `// Local:` marker) from hop 1, per the register.
- Why: it is W6-D9's final decision, applied from the first hop, so later upstream edits to the file never conflict on formatting.
- Risk / how to undo: none for output; `_design-tokens.artifact.scss`, `_GESSO.es6.js` and `dist/design-tokens.js` are byte-identical.

<!-- Pre-decided flags to raise when their hop lands (fill in hop/commit then):
  - hop 6 (5.1.4): images/backgrounds taken at the hop (W6-D9 skipped it there and adopted it
    post-upgrade in 73f02b22)
  - hop 13 (5.2.6): publish-demo-site.yml hand-applied with SLAC edits (W6-D9's workflows are
    all disabled; nothing to compare)
  - hop 16 s2 (5.3.2): sprite.js -> sprite.cjs taken at the hop (W6-D9 skipped it under the
    source/ rule and fixed it later in c5b7e7f3)
  - hop 23 (5.4.6): minimizer-webpack-plugin pinned alongside overrides.terser (W6-D9 pins terser only)
  - post-upgrade: theme-settings.php fix re-landed (W6-D9: PHP documented only)
  - post-upgrade: README switched to the SLAC package README (F-01)
  - anything else that departs from a W6-D9 register row, hop plan or decision
-->
