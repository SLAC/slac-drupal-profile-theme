# Gesso hop-by-hop rebuild (SLAC theme): state of play

This is the handoff doc for resuming this work in a fresh session. Everything needed is on disk, and nothing depends on a previous session's context.

**Goal:** rebuild this theme's Gesso upgrade from **5.0.9 → 5.4.6**:
- start from `main` (`667a195`);
- make one commit per upstream release (23 hops), with big hops staged;
- follow the method W6-D9 used on its own theme;
- make **no visual change** to consuming Drupal sites.

The earlier squash-style upgrade (`origin/gesso-upgrade` = `f712137`, unmerged) is **not** built on. It serves as an oracle for the final reconcile only. Do not delete that branch.

## Where we are

- Branch: **`gesso-upgrade-hop-by-hop`**, cut from `main` `667a195`. It is local only; the first push happens at hop-00 step G.
- Rebuild worktree: **`/Users/btschu/Development/slac-gesso-rebuild`** (see **Where to work**).
- **Hop 0 (prep): done** (2026-09-29). Baseline committed at `.claude/baseline/` (`ec9049b`); first push and CI green.
- **Hops done: 18 of 23** (latest: 5.4.1 `e723c23`). **Next: hop 19, 5.4.2.**
- Hop table: below.

## Reference implementation: W6-D9

The user prefers W6-D9's method and wants SLAC aligned with it. **For every hop, read W6-D9's plan and commit for the same release first.**

**Paths**
- Repo: `/Users/btschu/Development/W6-D9`, branch `gesso-upgrade-hop-by-hop` (tip `73f02b22`). The theme is at `web/themes/gesso`.
- Records (read with `git -C /Users/btschu/Development/W6-D9 show "gesso-upgrade-hop-by-hop:.claude/<file>"`):
  - `gesso-STATE.md`: its traps list is required reading.
  - `gesso-deviations.md`
  - `gesso-hop.sh`
  - `gesso-plans/hop-NN-<version>[-stageN].md`
  - `gesso-plans/non-hop-*.md`
  - `gesso-plans/php-review-notes.md`

**Why W6-D9 transfers so directly.** Both themes were on Gesso 5.0.9, and their toolchains were nearly identical at that point:
- byte-identical: `.storybook/main.js`, `lib/`, `.stylelintrc.yml`, `postcss.config.js`, `babel.config.json`, README;
- `webpack.common.js` differed by 9 lines;
- `package.json` differed by 33 diff lines.

So W6-D9's decisions apply here, and most of a SLAC hop commit should look like W6-D9's hop commit with the path mapping applied.

**Path mapping**

| W6-D9 | SLAC |
| --- | --- |
| `web/themes/gesso/X` | `X` (the repo root) |
| `gesso.libraries.yml` | `slac.libraries.yml` |
| `gesso.info.yml` | `slac.info.yml` |
| `gesso.theme` | `slac.theme` |
| `gesso/common` | `slac/common` |
| `gesso_helper/` (inside the theme) | none here; `slac_helper` lives in the slac-drupal-profile repo at `web/modules/custom/slac_helper` |

**W6-D9's gaps.** Don't inherit these; see the corrections in `gesso-plans/alignment-analysis.md`:
- its `php-review-notes.md` stops at 5.4.2;
- its register is missing its newest Storybook rows;
- its terser override conflicts with `minimizer-webpack-plugin ≥5.8`'s `terser ^5.51.0`.

## Decisions (made with the user 2026-09-29; do not re-litigate)

Everything not listed here follows **W6-D9's decision**. Any departure from a W6-D9 decision goes in `gesso-review-flags.md` (see **Review protocol**).

| Topic | Decision |
| --- | --- |
| Method | Rebuild hop by hop from `main`. One commit per release; big hops staged exactly as W6-D9 staged them (5.3.2 ×4, 5.4.3 ×3, 5.4.4 ×4, 5.4.5 ×4). |
| Target | **Stop at 5.4.6** (hop 23). 5.4.7 comes later, in W6-D9 first. |
| Node | `.nvmrc` stays **22** for the whole rebuild; never take upstream's `.nvmrc`. It drives the release workflow and `ci.yml`, and `publish-demo-site.yml` from hop 13. |
| D11 | At hop 23, `slac.info.yml` `core_version_requirement: '^10.3 \|\| ^11'` (W6-D9's decision). `slac_helper` must get the same bump and be released **before** the theme is tagged. That is in another repo, so it goes to the user as a "Needs your action" item. |
| PHP layer | Document, don't apply, in `gesso-plans/php-review-notes.md`, like W6-D9. **Exception:** after the hops, re-land the **theme-settings.php fix** (typed signature, `$theme` from `config_key`) as its own commit. Source: `git show f712137 -- theme-settings.php`. Do **not** re-land the `theme_get_setting` argument drop, `FilteredMarkup` → `Markup`, or the `_slac_` helper rename. |
| README.md | The user wants the **SLAC package README** (the Composer package's docs). However, `main`'s README is **upstream 5.0.9's, byte-identical**; the SLAC README was only written on the old branch. So:<br>1. **During the hops**, README is a TOOLCHAIN file taken verbatim, exactly as W6-D9 did.<br>2. **After hop 23**, one post-upgrade commit replaces it with the SLAC README from `f712137`, corrected: Node 22, no `.npmrc` paragraph, and the "say why inline" rule replaced by a pointer to the register.<br>3. From then on README is REVIEW (hand-applied). Flag F-01. |
| Stories | Stay **CSF2**, as W6-D9's do on Storybook 10.6. The old branch's CSF3 conversion is not redone. |
| Product changes | The user's own changes from the old branch go in single-purpose commits at the **start** of this branch, before hop 1 (hop-00-prep step D). |
| CI/release fixes | Also at the start of this branch (hop-00-prep step E): a PR/push build workflow, zip exclusions that actually work, and `notify-satis` waiting on the build. |
| Records | Committed under `.claude/`, kept at the tip after merge, like W6-D9. They are excluded from the release zip by step E. |
| Baseline | Committed at `.claude/baseline/` for the life of the rebuild, like W6-D9's `gesso-baseline/`: the `css`/`js` snapshot, token artifacts, `extra/` checks, and every `expected-since-*` pin with its README. Taken **once**, at hop-0 step F. With no per-commit review, the pins are the reviewable evidence for "no visible change". The 12MB Storybook 6.5 reference build stays outside the repo (`~/.cache/gesso-slac/storybook-reference`). Untracking the baseline at the very end (W6-D9 `12de09d0`) is the user's call at merge. |
| Output standard | W6-D9's: **no visible change**. Byte-identical where possible; otherwise prove the change inert and pin it by content in the baseline's `expected-since-<version>/`. |
| Lockfile | Never delete or regenerate it. Pin the output-generating packages to upstream's tested versions as W6-D9 did. |
| Pushing | Push `gesso-upgrade-hop-by-hop` to origin after every hop (and stage). Open a **draft PR into main** at the end. **Never** push `main`, push tags, force-push, or merge. |

## Review protocol (differs from W6-D9 by the user's decision)

W6-D9 stopped for the user's approval before every commit. **Here the user does not review each commit.** The agent plans, implements, verifies, commits and pushes each hop on its own, and **flags** anything that differs from a W6-D9 decision.

**Flag and continue** when a change differs from what W6-D9 decided for the same situation. That includes a SLAC adaptation W6-D9 never needed, or a W6-D9 choice we didn't follow. To flag:
1. Add an entry to `.claude/gesso-review-flags.md` (format in that file).
2. Add a trailer to the commit message: `Review-Flag: F-NN`.

Not a flag: pure path mapping (`gesso` → `slac`), and following a W6-D9 decision exactly.

**Stop and ask the user** (don't flag and continue) when:
1. `verify` fails and the fix is outside the hop's scope, or you cannot explain a failure.
2. A compiled-output change cannot be proven inert, meaning a possible visual change.
3. A change would alter a public contract for consuming sites with no W6-D9 precedent: PHP function names, library names, Twig filters, template suggestions.
4. Anything outside this branch: pushing `main` or tags, repo settings, releases, another repo (slac-drupal-profile), deleting branches, force-pushing, or rewriting pushed history. **Drupal-side checks are read-only**: reading `web/core` in the profile checkout is fine; changing that checkout, its ddev project or its database is stop-and-ask.
5. The baseline is missing or looks wrong after hop-0 step F. **Never** run `snapshot --force` on the real baseline after step F. Throwaway comparisons use `GESSO_BASELINE=/tmp/<name> bash … snapshot --force`.

**Pre-approved, so not stop conditions:** the hop-0 step D commits. They are the user's own product changes: removing public libraries, editing `includes/paragraph.inc`, adding a template.

## Working rules for an unattended agent

- **Always operate on the rebuild worktree explicitly.** Every shell command either starts with `cd /Users/btschu/Development/slac-gesso-rebuild &&` or uses `git -C /Users/btschu/Development/slac-gesso-rebuild`. The shell's working directory can reset between calls, and a session may start in a nested worktree where `npm`/`git` would hit the wrong checkout.
- **Never run `npm` directly for a build that matters.** Use `bash .claude/gesso-hop.sh verify|ci|install`: they select Node 22 from `.nvmrc` and refuse nested checkouts. A bare `node` may be 24.
- **Forced edits from upstream's own `source/` changes.** Examples: `sprite.cjs` at 5.3.2 s2, `_iff.scss` at 5.4.4 s4, `.mdx` import swaps.
  - Copy a whole upstream file with `bash $H file <tag> <path> > <path>`.
  - Apply one hunk with `git -C ~/.cache/gesso-slac/upstream diff <from> <to> -- <path> | git -C $R apply -3`.
  - `take` refuses non-toolchain paths on purpose.
  - Neither command deletes anything: when upstream renames a file, `git rm` our old path yourself (e.g. `lib/transform.js` → `lib/transform.cjs` at 5.3.2).
- **Staged hops** (5.3.2, 5.4.3, 5.4.4, 5.4.5):
  - Before stage 1, write the triage doc, modelled on W6-D9's `hop-16-5.3.2-TRIAGE.md` (`1fdfe380`), and commit it on its own.
  - In each stage apply only that stage's packages and files, per W6-D9's stage plan. Run `deps <tag>` **without** `--apply`, and hand-edit that stage's packages.
  - `package.json` `version` stays at the previous release until the **last** stage, which runs `deps <tag> --apply` (then re-assert exact pins).
  - Every stage must pass `verify` on its own before it is committed.
- **Recording deliberate changes to the story or library baseline.** When a commit intentionally adds, removes or renames stories (hop 7's dead story, or post-upgrade naming fixes), run `record-stories`. When it intentionally changes `slac.libraries.yml` (the post-upgrade `slac/common` fix), run `record-libcheck`. Say why in the plan and commit the updated baseline files. Compiled CSS/JS changes are pinned in `expected-since-<version>/`, never by re-snapshotting.
- **Resuming after an interruption.** Start from `git -C $R status` and `git -C $R log --oneline -5`.
  - **Uncommitted changes:** read the hop plan's Verification table. If it isn't filled in, re-run `verify` and finish the hop. If you can't tell what state the changes are in, stash nothing and don't discard; stop and ask.
  - **A hop commit without its `Record hop NN SHA` follow-up:** add the record.
  - **Pushed but CI red, or unknown:** check `gh run list --branch gesso-upgrade-hop-by-hop --limit 3` and fix before the next hop.
  - **`package.json` has a version bump but no hop commit:** the previous session died mid-`deps --apply`. Compare with the hop plan and continue.

## Where to work (SLAC-specific trap; read before building anything)

**Build only in a checkout that is not nested inside another checkout.** `gesso-hop.sh` refuses to run otherwise. Two reasons:

1. **Upward `node_modules` leakage.**
   - Node resolves missing packages by walking up the directory tree.
   - The theme is the repo root, so a worktree at `/Users/btschu/Development/slac-drupal-profile-theme/.claude/worktrees/<name>` (where the desktop app puts session worktrees) silently resolves packages from the **main checkout's** `node_modules`.
   - The main checkout sits on the old `gesso-upgrade` branch with Storybook 8.6 installed.
   - Seen 2026-09-29: `build-storybook` at 5.0.9 loaded SB 8.6 addons from it and died on `useSyncExternalStore`.
2. **Copied artifacts.**
   - Desktop-created worktrees receive copies of the main checkout's ignored `.claude/gesso-baseline/storybook/` and `.claude/baseline-542/storybook/`: about 80 minified CSS files.
   - At 5.0.9, the StylelintPlugin has no `files` scope and globs dot-directories, so it sweeps those files and crashes with `RangeError: Invalid string length`.
   - Hop-00 step C scopes it to `source/` for good, but avoid carrying the copies around anyway.

**The rebuild worktree is `/Users/btschu/Development/slac-gesso-rebuild`**, a `git worktree` of this repo on `gesso-upgrade-hop-by-hop`, with no `node_modules` in any ancestor.
- If your session started somewhere else (for example a nested `.claude/worktrees/<name>`), do **all** work in the rebuild worktree using absolute paths, and leave the session's own worktree untouched.
- If the rebuild worktree is missing, recreate it:
  `git -C /Users/btschu/Development/slac-drupal-profile-theme worktree add /Users/btschu/Development/slac-gesso-rebuild gesso-upgrade-hop-by-hop`
- A branch can be checked out in only one worktree. If `git worktree add` refuses, find the other worktree with `git worktree list`.

## Scope rules (W6-D9's, adapted to the repo-root layout)

**Apply** upstream's changes to the build and toolchain files. This is the `TOOLCHAIN` list in `gesso-hop.sh`:
`package.json`, the lockfile, `webpack.*.js`, lint and format configs (`.eslintrc*`, `eslint*.config.js`, `.stylelintrc.yml`, `.prettierrc`, `.prettierignore`), `.swcrc`, `tsconfig.json`, `babel.config.json`, `postcss.config.js`, `.storybook/`, `lib/`, `patches/`, `Dockerfile`, `.dockerignore`, `source/@types`, and **`README.md` during the rebuild** (see Decisions).
- Method: `take` upstream's file, then re-apply every register row for it.
- Don't hand-merge.

**Review, don't take.** This is the `REVIEW` list: read upstream's change and hand-apply what is relevant.
- `.nvmrc` (ours, 22)
- `.gitignore` (ours)
- `.github/workflows/publish-demo-site.yml`: take upstream's changes, but keep branch `main`, the SHA-pinned actions, and `setup-node` with `node-version-file`.

**Skip.** These are ours; upstream's versions are a starting point for new projects:
- everything under `source/` except `@types`;
- `templates/`, `dist/`, `config/`;
- `slac.libraries.yml`, `slac.*.yml` (except the decided `core_version_requirement`);
- `composer.json`, `.github/workflows/build-assets.yml`;
- upstream's other `.github/` files and `.buildkite/` (never `take` them; `take` refuses non-toolchain paths).

**Document, don't apply:**
- the PHP layer: `includes/`, `slac.theme`, `theme-settings.php`;
- upstream's `gesso_helper/`, which maps to `slac_helper` in the other repo.

Append findings per release to `gesso-plans/php-review-notes.md`, calling out anything relevant to Drupal 11 or to **sub-theme consumers**. Six local consumer sites run `base theme: slac` sub-themes.

**Forced edits are in scope.** These are edits to our own files that a toolchain change genuinely requires: Sass `@use`/`math` migrations, lint autofixes, Storybook API renames, `.stories.mdx` → `.mdx`, the `sprite.js` → `sprite.cjs` rename.
- The user accepted this for W6-D9 at its hop 13.
- Prefer upstream's own fix from the same release.
- Put each edit in the hop (or stage) whose toolchain change forces it.
- Prove output unchanged, or pin it with a proof that it is inert.
- **Never switch off a check instead** (no `stylelint-disable`, no `silenceDeprecations` upstream lacks, no eslint rule overrides). The old branch did that three times; don't repeat it.

**Dependency policy** (W6-D9's, plus a security carve-out):
- Take upstream's target version unless ours is already newer; never downgrade a declared range.
- **Never introduce** a package we don't have, unless a taken toolchain file requires it. W6-D9 took the TypeScript packages at 5.0.10, for example; follow its hop plans on what was introduced and why.
- Never delete or regenerate `package-lock.json`. Use `deps <tag> --apply` → `install` → `driftcheck <tag>`.
- Pin output-generating packages to the versions in **upstream's own lockfile** at that tag. W6-D9 did this for sass-embedded, webpack and terser (`overrides.terser` from 5.4.3). At hop 23 (5.4.6), where `minimizer-webpack-plugin` first appears in upstream's lockfile, also pin it (5.6.1) to avoid W6-D9's out-of-range terser conflict. That departs from W6-D9, so flag it.
- **Security carve-out (SLAC addition; flag it):** never pin or keep a resolution inside a known advisory range. Run `npm audit --package-lock-only` before and after dependency changes and record the counts. `main`'s lodash 4.17.21 has high advisories and is bundled into `dist/js`. It is bumped at hop-00 step E4, before the baseline.
  - **If "pin to upstream's tested version" would land inside an advisory range,** take the lowest non-advisory version instead, prove the output change inert (behaviours plus AST for JS, cascade3 for CSS), pin it, and flag it.
  - **If you can't prove it inert,** stop and ask.
  - Advisories confined to dev-only tooling that never reaches `dist/` are recorded in the hop plan, not chased.
- Any hop that moves majors or changes React/Storybook needs `bash .claude/gesso-hop.sh ci` (a clean `npm ci`) followed by `verify` before it is done.

**Standing instructions carried over from W6-D9:**
- Lint and build **only through the `package.json` scripts** (`npm run eslint`, `npm run stylelint`, `npm run build`, `npm run build-storybook`), never `npx` over the tree. Before 5.1.2 there are no lint scripts; the helper's fallbacks mirror their later scope.
- **Do not "fix" story-file lint errors.** Nothing lints stories (W6-D9 trap 3).
- Deviation comments in code are **one line** (`// Local: <what>; see .claude/gesso-deviations.md`). The detail belongs in the register. The user wrote the opposite convention into the old branch's README; that is superseded.

## Workflow per hop

```bash
H=/Users/btschu/Development/slac-gesso-rebuild/.claude/gesso-hop.sh
bash $H diff 5.2.3 5.2.4          # triage: toolchain / review / ours / PHP
bash $H deviations 5.2.3 5.2.4    # watch-list hits; the register is the source of truth
bash $H show 5.2.3 5.2.4          # full toolchain + review diff
bash $H deps 5.2.4 --apply        # version + dependency bumps (then re-assert exact pins)
bash $H install                   # npm install, lockfile preserved
bash $H driftcheck 5.2.4          # resolved vs upstream's own lockfile, incl. terser & co.
bash $H verify                    # build, lint, storybook, sprite, stories, libraries, baseline diff
bash $H ci && bash $H verify      # when majors move
```

Other commands: `file <tag> <path>`, `take <tag> <path>...`, `sprite`, `libcheck`, `stories`, `snapshot --force`.

**Per hop:**
1. **Plan first.** Write `.claude/gesso-plans/hop-NN-<version>[-stageN].md`.
   - Start from W6-D9's plan for the same hop, and cite W6-D9's commit SHA.
   - Sections:
     - upstream diff summary;
     - W6-D9 reference;
     - Applied table (file / how: verbatim, taken + register rows re-applied, or hand-applied);
     - Skipped / ours;
     - PHP notes, with a pointer to php-review-notes;
     - deviations touched;
     - dependency changes, with driftcheck output pasted rather than versions from memory;
     - forced edits;
     - the Verification table: lint counts, build exit and warning count, storybook exit and entry count, sprite, libcheck, `dist` vs baseline, pins added;
     - flags raised.
2. **Implement, then run `verify`.** A hop is done only when:
   - `verify` is green: lint clean at the recorded contract, build exit 0 at or below the warning bar, storybook exit 0 with the expected count, sprite OK, libraries OK;
   - `dist` is IDENTICAL to the baseline or every difference is pinned with an explanation.
3. **Commit.**
   - Subject: `Upgrade Gesso to X.Y.Z`, or `Gesso X.Y.Z stage N of M: <topic>`.
   - The body explains what was taken, forced and skipped.
   - Add `Review-Flag: F-NN` trailers if any.
   - The plan doc and record updates go in the same commit.
4. **Record the hop.** Write the SHA into the hop table in a follow-up commit, `Record hop NN SHA`. **Never `--amend` it in**; that records the pre-amend hash (W6-D9 hit this twice).
5. **Push.** `git -C /Users/btschu/Development/slac-gesso-rebuild push -u origin gesso-upgrade-hop-by-hop`. Then check the CI workflow added in hop-00 step E:
   ```bash
   gh run list --branch gesso-upgrade-hop-by-hop --limit 1
   ```
   A red CI run blocks the next hop.

**Pins.** A pin records what the output *is*, not that it is *right*. Never pin a file whose change you have not explained. W6-D9 pinned a 61-byte broken sprite stub as "expected" and shipped a broken sprite for four hops.

## Hop table

"W6-D9 ref" is the reference commit on W6-D9's branch; read its plan and diff first. Fill "SLAC commit" as each hop lands.

| # | Release | Stages | W6-D9 ref | SLAC commit | Note |
| --- | --- | --- | --- | --- | --- |
| 0 | prep | – | – | `ec9049b` | records, Stylelint scope, product commits, CI/release, baseline (`hop-00-prep.md`) |
| 1 | 5.0.10 | 1 | `9c43deee` | `c705c40` | TS support; take `source/@types/drupal/index.d.ts`; lightbox lint rename |
| 2 | 5.0.11 | 1 | `483ca619` | `2a72754` | version only |
| 3 | 5.1.0 | 1 | `61b89c53` | `3ee8677` | 45-package wave; `webpack.theme-config.js` design-token rework (upstream still emits `dist/design-tokens.js`; `verify` compares it); `fieldValue` stays in `preview.js` (W6-D9 register) |
| 4 | 5.1.2 | 1 | `db0249ad` | `4096f34` | eslint/stylelint/watch npm scripts arrive; lint contract starts here |
| 5 | 5.1.3 | 1 | `6c212814` | `5d0096e` | sass-embedded catch-up; `webpackImporter` fix |
| 6 | 5.1.4 | 1 | `731bf2cc` | `f773ccc` | take `images/backgrounds` output path. W6-D9 **skipped** it here and adopted it post-upgrade in `73f02b22`, so taking it now is a timing departure: **flag it**. It's byte-identical for SLAC, whose CSS images are all data URIs. Keep the `theme.js` brandImage |
| 7 | 5.2.0 | 1 | `d7c8e70e` | `42f5588` | **Storybook 7.** Lockfile pin to 7.0.x as W6-D9 (lifted at 5.2.5). `source/03-components/mega-menu/mega-menu.stories.jsx` is **entirely commented out**, which SB7 rejects ("missing default export"); delete it, as W6-D9 deleted its dead stories. Then `record-stories` to start the `index.json` story-ID diff |
| 8 | 5.2.1 | 1 | `e8bf864c` | `1353cc7` | version only |
| 9 | 5.2.2 | 1 | `9d605a07` | `c546fa4` | Dockerfile deleted (keep `.dockerignore`) |
| 10 | 5.2.3 | 1 | `b6ad1671` | `17b437e` | `decorators.jsx`; `preview.js` `dist/js` imports deviation |
| 11 | 5.2.4 | 1 | `69e1ed1b` | `0c74a05` | chalk; **defer glob 10**; then non-hop `57e1f95c`-style commit **`1536380`**: delete `.npmrc` + glob 10 (10.5.0, F-09) + upstream webpack entry function; `lockcheck.cjs` added |
| 12 | 5.2.5 | 1 | `358ca3c2` | `e45ec2c` | `lib/` rewrite + yaml v2; React build unwired (take `webpack.react-config.js`, keep it out of `build`) |
| 13 | 5.2.6 | 1 | `549101f0` | `343f2a9` | LVHFA rewrite; first `dist/css` pin; storybook-deployer dropped, so hand-apply `publish-demo-site.yml` |
| 14 | 5.2.7 | 1 | `90b77171` | `1d00012` | 43-package wave; `imagePath` → keep `gessoImagePath` in `@types` and `stubs/drupal.js` |
| 15 | 5.2.8 | 1 | `92efc5d7` | `902cf44` | version only |
| 16 | 5.3.2 | 4 | `c0982aca` `3e5ae942` `7a837508` `d08e473e` | triage `a9deef8` · s1 `479e0e9` · s2 `a99095d` · s3 `1dbbba2` · s4 `3a2849d` | Triage doc first. s1 stylelint 16 + prettier 3 (SCSS forced edits via `npm run stylelint -- --fix`, as W6-D9; the `_button.scss` reorder is **taken**, not disabled) · s2 ESM `type: module` + **`sprite.js` → `sprite.cjs`** (upstream's own forced edit; W6-D9 skipped it here and fixed it later in `c5b7e7f3`, so **flag** the timing) + `lib/transform.js` → `.cjs` (`git rm` the old) · s3 Babel → SWC · s4 SB8 + React 18 + `.stories.mdx` → `.mdx` |
| 17 | 5.4.0 | 1 | `2e164e8` | `2675233` | Twig parity: do NOT take `cleanUniqueId` / `subheadingLevel`; css-loader 7 |
| 18 | 5.4.1 | 1 | `e31f770` | `e723c23` | `loadPaths`; string-quotes SCSS; mixed-decls silence arrives (follow upstream) |
| 19 | 5.4.2 | 1 | `2d942e4f` | | eslint 9 flat config; React 19; `es6.js` lint fixes (no rule overrides); `@types` external-link keys |
| 20 | 5.4.3 | 3 | `7922bbdc` `18f19e11` `abeeefec` | | s1 sprite plugin swap (delete `sprite.cjs`) · s2 SB 8 → 9: blocks import; `preview.js` `INITIAL_VIEWPORTS` import moves from `@storybook/addon-viewport` to `storybook/viewport`, and `viewport.viewports` → `viewport.options` · s3 dependency wave (`overrides.terser` to upstream's lockfile version) |
| 21 | 5.4.4 | 4 | `cf63182d` `b456e70a` `d016636b` `28f7ce81` | | s1 `@forumone/twig-loader` · s2 SB 9 → 10 + `createRequire` shim (atomic) + dev smoke test · s3 `component.js`/`Javascript.hbs` (4 `slac` sites) · s4 dependency wave, mixed-decls (cascade3), `if()` migration of `_iff.scss`/`_grids.scss` |
| 22 | 5.4.5 | 4 | `4346922e` `07860757` `4445161e` `1a0df7a0` | | s1 `uniqueId` resolved · s2 Twig 1 → 3 · s3 lint stack v4 (exact pins) · s4 CSS toolchain |
| 23 | 5.4.6 | 1 | `09ba0de3` | | `splitChunks` → `webpack.common.js`; `controls.disableSaveFromUI`; `core_version_requirement '^10.3 \|\| ^11'` (review-flags A-2); `overrides` terser 5.49.0 **plus `minimizer-webpack-plugin` 5.6.1** (upstream's lockfile; it first appears at 5.4.6). **Flag** the minimizer pin: W6-D9 pins terser only |

**Non-hop commits in W6-D9 worth knowing:**
- `c50589d` (`lib/transform.js` formatting)
- `57e1f95c` (the `.npmrc` removal)
- `c5b7e7f3` (the sprite fix; not needed here if hop 16 s2 takes `sprite.cjs`)

## After hop 23: post-upgrade assessment series

One evidenced commit each. W6-D9's equivalents are `7cf12e4a..12de09d0` and `73f02b22`; SLAC applicability was checked 2026-09-28.

1. **`slac/common`** as the first dependency of `addtocal_a11y`, `back_to_top` and `dropbutton` (their bundles wait on the common chunk; `libcheck` flags them), plus `alert_bar` for uniformity (W6-D9 `252b003d`).
2. **Storybook global behaviours** (`136d9207`): in `.storybook/preview.js`, import `arrow-link.es6`, `external-link.es6` and `06-utility/transitions.es6`. SLAC has no pdf-link.
3. **Export-list story names** (`9eb93a52`): port the indexer wrapper into `.storybook/main.js`. On CSF2 it works unchanged.
4. **Per-story component imports** (`aa9d08f1`): 26 of 150 story files, most transitively. Recompute the list from `attach_library()` and the library dependencies.
5. **Twig.js 3 fixes.**
   - `expandable-grid.twig` `[:3]`/`[3:]` → `|slice` (`46b8f718`).
   - Pager icon includes captured outside `{% apply %}` (`631e47ef`). SLAC's `pager.twig` and `pager--mini.twig` are byte-identical to W6-D9's pre-fix files. Also check `filter-modal.twig`.
6. **Stale `dist/images` files** (`73f02b22` analogue): remove the 7 content-hashed files, which have been unreferenced since 2022. Keep the hand-placed ones.
7. **Optional; measure first:** the React-effect `attachBehaviors` decorator (`51fca15e`) and the sitewide-alert stub (`dbd469b5`). SLAC's impact is smaller.
8. **theme-settings.php fix** (the user's decision). Take the hunk from `f712137`; record it in php-review-notes; flag it.
8b. **SLAC package README.** Replace the upstream README with `git show f712137:README.md`, corrected:
    - Node 22, not 24;
    - drop the `.npmrc`/legacy-peer-deps paragraph;
    - replace the "say why inline" deviation convention with a pointer to `.claude/gesso-deviations.md`;
    - fix the release numbers it gets wrong (unique_id: renamed at 5.4.0, reverted at 5.4.5);
    - fix anything describing CSF3 (stories are CSF2).

    Then move `README.md` from `TOOLCHAIN` to `REVIEW` in `gesso-hop.sh`, and update the watch row. Flag F-01.
9. **Sass deprecations from our own source.** After hop 21 s4 there should be 0 `if-function` warnings; fix any other own-source deprecations.
10. **Storybook comparison.** Compare against the Storybook 6.5 reference captured in the hop-0 baseline (`$BASE/extra/storybook`): per-story DOM classes, story names, and pixels if feasible. `origin/gh-pages` `27f621b` is the older 6.5 build of plain `main`.

Then:
- **Reconcile** against the old branch (`f712137`). Every difference must be one of:
  - a scope reversion (CSF3, the unused mixins, PHP);
  - a W6-D9-aligned decision;
  - a bug fix;
  - a dependency-resolution difference (the lockfile evolved from `main`'s).

  Write it up in `gesso-plans/reconcile-vs-f712137.md`.
- Open a **draft PR** into `main`. The body lists every review flag and the "Needs your action" items.

**Done means:**
- all 23 hops, plus the post-upgrade series, are committed and pushed;
- the last `verify` is PASS;
- CI is green on the branch tip;
- every flag is filled in with its SHA;
- `php-review-notes.md` has a section per release;
- the reconcile doc is written;
- the draft PR is open.

The agent does **not** merge, tag, untrack the baseline, or switch Pages; those are the user's.

## Verification harnesses

- **`gesso-hop.sh verify`:**
  - builds first, then lints (avoids phantom `_GESSO.es6` errors);
  - sums warnings over both webpack runs;
  - runs `build-storybook`;
  - checks the sprite structure (symbols = source files, viewBox on every symbol, every referenced fragment resolves);
  - counts Storybook entries (`index.json` from SB7; before that the 248-row source inventory) and diffs story IDs against the baseline;
  - runs `libcheck`;
  - diffs `dist/css`, `dist/js` and the two token artifacts against the baseline with `expected-since-*` pins.
- **`gesso-harness/behaviors.cjs`:** the VM harness. Pass one `dist/js` dir to list behaviours, or two dirs to compare. It clears JS changes the ESM conversion and SWC make. Blind spot: entries that register no behaviour, so pair it with an AST check.
- **`gesso-harness/libcheck.mjs`:** checks `slac.libraries.yml` `dist` paths and the `slac/common` criterion.
- **`gesso-harness/lockfix.sh`** (with `lockmin.cjs`, `lockhoist.cjs`; added at hop 7): after a hop's `npm install` has floated transitive packages, rewinds each moved top-level package to its previous resolution, else upstream's tested one (never into an advisory range, except output-generating build tooling), hoists orphaned nested entries, and loops with `install` to a fixpoint. Usage (from the theme root): `git show HEAD:package-lock.json > .claude/gesso-logs/lock-prev.json && bash .claude/gesso-harness/lockfix.sh .claude/gesso-logs/lock-prev.json <tag>`. It builds the advisory union itself; `allow-vuln.re` lists the output-generating build tooling allowed to stay in an advisory range (record each such case in the hop plan). Follow with `ci` and `driftcheck`.
- **`gesso-harness/pinbump.cjs <upstream-lock>`** (hop 14): after `deps --apply`, prints `name@version` for every direct dependency whose locked version no longer fits, at upstream's tested version. Install them in one go from bash with a `while read` loop (macOS bash 3.2 has no `mapfile`), restore `package.json`, then `lockfix.sh`.
- **`gesso-harness/astequiv.cjs <old> <new> [--names]`** (hop 14): acorn AST comparison, positions dropped; `--names` ignores identifier names. For minifier/transpiler-level `dist/js` changes; pair with `behaviors.cjs`.
- **`astequiv.cjs … --ids`** (hop 19): numeric literals may differ if they form one consistent one-to-one renumbering (webpack module/chunk IDs); prints the mapping. Check each renumbered value sits in an ID position (module-table key, `r(id)`, `r.j`, `r.O(…,[id])`) before relying on it.
- **`gesso-harness/modtable.cjs <old> <new>`** (hop 19): compares a bundle's module table as a multiset of token streams (names and numbers masked, strings kept) plus the code outside it. For module-order changes after ID renumbering and webpack's export-name mangling (`Z` → `A` at 5.98).
- **`behaviors.cjs`'s `document.currentScript`** is a real-looking `<script>` since hop 19 (webpack 5.98's auto-publicPath checks `tagName`).
- **Absence pins:** `expected-since-*/no-longer-emitted.txt` lists `dist/` paths no longer built; since hop 19 a `design-tokens.js` line covers `dist/design-tokens.js` too.
- **Lockfile after removing packages** (hop 19): run `npm uninstall <removed…>` against the *previous* `package.json` first (prunes their entries cleanly), then restore the new `package.json` and install the moved packages. Hold the Storybook lockstep by listing every direct `@storybook/*` at its locked version in the same `npm install`, or npm floats one of them.
- **`lockmin.cjs` never rewinds direct dependencies** (fixed at hop 14; it had split Storybook's lockstep at hop 12).
- **`lockmin.cjs` swaps whole subtrees** (fixed at hop 12): a rewound entry takes its nested `node_modules/**` from the lockfile it came from, never the newer version's.
- **`gesso-harness/lockcheck.cjs`** (added after hop 11): lists every unsatisfied dependency/peer edge in the lockfile; `--repair` nests satisfying copies (from the previous/upstream lockfile). `lockfix.sh` runs it last. Run it on its own after any hand edit of the lockfile; the only accepted edge is `twig-loader`'s peer `twig ~1.10.5` (upstream's too).
- **`gesso-harness/cssequiv.cjs <old.css> <new.css>`** (hop 16 s1): per rule, declaration multiset (box shorthands normalised) + rule sequence + relative order within shorthand families. For reformatting-level CSS changes; not for cross-rule regrouping (that is `cascade3`, still to write, for 5.4.4 s4).
- **`gesso-harness/syntaxscan.cjs <dirA> <dirB>`** (hop 16 s3): the ES syntax features (acorn node types, `let`/`const`, `??`, `?.`, async, …) each set of bundles uses, and which are new in B. Use it whenever a transpiler or its targets change: nothing new vs the hop-0 baseline means no new browser requirement.
- **`gesso-harness/spritecmp.py <old.svg> <new.svg> <out.html>`** (hop 16 s4): writes a page that rasterises every sprite symbol from both files at 512px and diffs pixels; serve it with `python3 -m http.server --bind 127.0.0.1 <port>` from its directory and read `#out` in the browser pane. Use it whenever the sprite pipeline or svgo changes (next: 5.4.3 s1).
- **`gesso-hop.sh smoke`** (added at hop 1): Storybook dev-server smoke test, judged by the log rather than the exit code (Storybook exits 1 on any warning).
- **`gesso-harness/story-inventory.mjs`:** a source-derived `title | name` inventory.
- **Still to write when first needed.** W6-D9 described these in its STATE doc under "Two verification harnesses"; rebuild them from that text and commit them in `gesso-harness/`:
  - **`cascade3`:** preserved relative order of equal-specificity, same-context declaration pairs. This is the right test for Dart Sass mixed-decls regrouping at hop 21 s4. Do not use a strict-order comparison: it over-reports, and the old branch's `cascade-check.mjs` is the wrong kind.
  - **`cssequiv`:** declaration sets plus shorthand-family order, per rule. Used for the stylelint 16 reformatting.
  - **`astequiv` / `astdiff`:** compares acorn ASTs; acorn ships with webpack. Used for minifier-level `dist/js` changes (terser bumps).

## Environment

- **Node:** 22 via nvm; the helper sources nvm and runs `nvm use` with `.nvmrc`. A bare `node` may be 24 (the nvm `stable` alias).
- **CI:**
  - `build-assets.yml` runs on **any tag push**: `npm ci && npm run build`, then zip, GitHub Release, Satis dispatch. It reads `.nvmrc`.
  - `publish-demo-site.yml` runs on **push to `main`** and deploys Storybook to GitHub Pages. It reads `.nvmrc` only from hop 13; at `main` it has no setup-node step.
  - Hop-00 step E adds `ci.yml` for PRs and pushes to this branch; it reads `.nvmrc`.
- **GitHub Pages** is still set to legacy deployment from `gh-pages`. The user must switch it to "GitHub Actions" right before this branch merges (from hop 13, `publish-demo-site.yml` uses `deploy-pages`). That's a "Needs your action" item.
- **No Drupal site in this repo.** For PHP API questions, read core 10.6.17 in the slac-drupal-profile checkout (`/Users/btschu/Development/slac-drupal-profile/web/core`). This is **read-only**. Running anything there, including reinstalling its stale theme overlay, is stop-and-ask. Checks that need a live site go on the user's list.
- **Upstream clone and Storybook reference** live outside the repo, at `~/.cache/gesso-slac/upstream` and `~/.cache/gesso-slac/storybook-reference`. The **baseline** is committed at `.claude/baseline/`. Override with `GESSO_UPSTREAM`, `GESSO_SB_REF` and `GESSO_BASELINE`.
- **The main checkout's untracked `.claude/`** (in `/Users/btschu/Development/slac-drupal-profile-theme`) holds artifacts from the first upgrade: `gesso-baseline/` (5.0.9, byte-identical to a fresh `main` build), `baseline-542/`, `prelint-css/`, `cascade-check.mjs`, and a `settings.json` that enables the gesso-upgrader plugin. **Do not use that plugin.** Its 5-release window and lockfile deletion are what the rebuild replaces. This branch now commits its own `.claude/settings.json` (the W6-D9 permission allowlist). Checking the branch out in the main checkout would collide with that untracked file, and with the untracked `.claude/gesso-baseline/`. Move both aside first; better, never check this branch out there.

## Known traps

**SLAC-specific (new here):**

- **S1. Nested checkouts leak `node_modules`.** See **Where to work**. The helper's `check_ancestors` refuses to run; don't bypass it without cause.
- **S2. Desktop-created worktrees get copies of ignored `storybook/` builds under `.claude/`.** At 5.0.9 the unscoped StylelintPlugin sweeps them and the build crashes. Hop-00 step C adds `files: 'source'`. Re-apply it after **every** `take webpack.common.js` (there is a register row and a watch row).
- **S3. Any tag is a public release.** `build-assets.yml` fires on `'**'`: it builds, publishes a GitHub Release and notifies Satis. Never create a tag, even an "archive" one; use branches.
- **S4. Zip exclusions are shell-expanded.**
  - `thedoctor0/zip-release` runs `zip -r … -x $INPUT_EXCLUSIONS` unquoted, so `source/*` expands to directory names and excludes nothing inside them.
  - `source/` **must** ship, because templates include `@components/...` from it.
  - Use non-expanding patterns (`*.claude*`, like `*.git*`) and assert the zip's contents (hop-00 step E).
- **S5. The theme root is the repo root.** Never `take` README, `.nvmrc`, `.gitignore` or upstream's `.github/*`/`.buildkite/`; the helper refuses.
- **S6. ~~`main` has `.npmrc` `legacy-peer-deps=true`.~~** Deleted in the non-hop commit right after hop 11, as W6-D9 did; it changed no resolution. A clean `npm install`/`npm ci` is real evidence from here (W6-D9 trap 6). Do not reintroduce it.
- **S7. Sub-theme consumers.**
  - Six local consumer sites use `base theme: slac` sub-themes.
  - `theme_get_setting()` without `'slac'` reads the **sub-theme's** settings; that's why that change is not re-landed.
  - `slac_library_info_build()` defines `slac/common` only for the active theme; slac-today carries a workaround.
  - Anything touching settings, libraries or template suggestions needs a sub-theme thought.
- **S8. zsh.** `$VAR:path` triggers history modifiers (`$B:g…`, `$WB:w…`), and `=====` triggers `=cmd` expansion. Quote refs as `"${REF}:path"`.
- **S9. The old branch is an oracle, not a source.**
  - Don't cherry-pick upgrade work from `6c15040`/`2db019c`/`f712137`: they regenerated the lockfile, rewrote stories to CSF3, silenced warnings and edited PHP.
  - The product commits in hop-00 step D are the only things taken from it.
  - Their records are readable at `4f3e580:gesso-upgrade-plan/` and `2db019c:gesso-upgrade-plan-5.4.6/`, but several name the wrong releases. Re-check every claim against `git -C ~/.cache/gesso-slac/upstream ls-tree <tag>`.

- **S10. Pre-existing SLAC sass-loader options.** At `main`, both `webpack.common.js` and `.storybook/main.js` use `implementation: sass-embedded`, `webpackImporter: false` and `sassOptions.loadPaths`. Upstream uses `sass`/`includePaths` until it converges (5.1.3 for the implementation, 5.4.1 for `loadPaths`). A verbatim `take` at hop 1 would load `sass`, which is not installed, and break the build. Re-apply from the register row every time; one row covers both files (W6-D9 trap 9). **Fully resolved at 5.4.1 (hop 18):** upstream adopts `loadPaths` everywhere; nothing left to re-apply.
- **S11. `gessoImagePath` lives in `.storybook/_drupal.js` at `main`.** Upstream renames the file to `stubs/drupal.js` at 5.0.10. Our line must move with it, or Storybook-only icon paths break (external-link, mega-menu, dropdown-menu), and `verify` cannot see that.
- **S12. Story inventory.** The harness strips comments; 13 files hide their stories in comments. It counts **228** rows at `main` (not the old tool's 248). Rows have no file path, so the `.mdx` renames don't register as a difference.

- **S13. zsh does not word-split unquoted variables.** `for p in $LIST` and `cmd $ARGS` pass one word in zsh. At hop 7 this pinned only one of eleven Storybook packages. Put package lists and multi-argument commands in a `bash -c` / bash script, or use arrays.
- **S14. A raised range floats the transitive tree.** When a hop's new range is not satisfied by the lockfile, `npm install` resolves everything that package needs to the **newest** allowed versions (hop 7: Babel helpers, browserslist, caniuse-lite; `dist/css` changed). After any `install` that moves an output-generating package, check `driftcheck` and the transitive list, and run `gesso-harness/lockfix.sh` (flag F-08). Install the moved direct packages at upstream's tested versions with `npm install <pkg>@<ver>` first.

**Carried from W6-D9's STATE doc.** Read the originals:

- **W1. Never delete `package-lock.json`.** Fresh caret resolution jumps far past upstream's tested versions and changes compiled CSS.
- **W2. Storybook.**
  - Majors land at 5.2.0 (SB7), 5.3.2 s4 (SB8), 5.4.3 s2 (SB9) and 5.4.4 s2 (SB10).
  - `overrides: { "storybook": "$storybook" }` is load-bearing from SB9.
  - `verify` cannot see the dev server, so smoke-test `npm run storybook` by hand after every hop that touches `.storybook/`.
  - The `createRequire` shim and SB10 are one atomic change.
- **W3.** Lint only via the npm scripts. Don't fix story lint. The eslint scope is `.js` only, excluding stories.
- **W6.** `.npmrc`/`legacy-peer-deps` hid and caused peer problems. After its removal, a clean install is real evidence.
- **W9.** Upstream's `build` script can gain steps we cannot run (the React build at 5.2.5), so re-read `scripts` every hop; `deps` prints script changes. One register row can cover two files (`loadPaths` in `webpack.common.js` and `.storybook/main.js`).
- **W10. "Embedded Dart Sass couldn't find the embedded compiler".** The platform binary is missing. Usually caused by `npm install <pkg> --no-save` experiments or a concurrent Node reinstall. Fix with `ci`.
- **W11.** Edit this file with `str.replace(old, new, 1)` on unique anchors, never index or slice surgery. That is how W6-D9's traps section got deleted once.
- **Sprite.** Under `"type": "module"`, `require.context` in `sprite.js` is a no-op, so the sprite stops being emitted **with no error**. Take upstream's `sprite.cjs` rename at 5.3.2 s2. `verify` removes the sprite before building and checks its structure.

## Files

| Path | Committed? | What |
| --- | --- | --- |
| `.claude/gesso-STATE.md` | yes | this file |
| `.claude/gesso-review-flags.md` | yes | **flags for the user** plus "Needs your action"; update with every flagged commit |
| `.claude/gesso-deviations.md` | yes | register of every deliberate divergence from upstream; read before each hop; keep `DEVIATION_WATCH` in sync |
| `.claude/gesso-hop.sh` | yes | the helper (ported from W6-D9, smoke-tested at 5.0.9 on 2026-09-29) |
| `.claude/gesso-harness/` | yes | `behaviors.cjs`, `libcheck.mjs`, `story-inventory.mjs` (+ cascade3/cssequiv/astequiv when written) |
| `.claude/gesso-plans/` | yes | `hop-00-prep.md`, per-hop plans, `php-review-notes.md`, `alignment-analysis.md` (the 2026-09-28 comparison) |
| `.claude/settings.json` | yes | permission allowlist: W6-D9's 46 rules plus their absolute-path / `git -C` equivalents for the rebuild worktree. No push, checkout, reset or tag rules; those prompt on purpose |
| `.claude/.gitignore` | yes | ignores logs, worktrees, local settings, legacy artifacts |
| `.claude/baseline/` | yes (from hop-0 step F) | compiled-output baseline (`css/`, `js/`, token artifacts, `extra/`), `NOTES.md` provenance, `expected-since-*/` pins |
| `.claude/gesso-logs/` | no | last run's logs |
| `~/.cache/gesso-slac/upstream` | no (outside repo) | clone of forumone/gesso; `setup` creates it |
| `~/.cache/gesso-slac/storybook-reference` | no (outside repo) | Storybook 6.5 build of the hop-0 tip; `snapshot` creates it |

## FIRST THING IN A NEW SESSION

1. Read this file, then `.claude/gesso-review-flags.md`, `.claude/gesso-deviations.md` and the next plan: `gesso-plans/hop-00-prep.md` until hop 0 is done, then the hop table.
2. Work in `/Users/btschu/Development/slac-gesso-rebuild` (see **Where to work**). Run `git -C /Users/btschu/Development/slac-gesso-rebuild status` and make sure it is clean and on `gesso-upgrade-hop-by-hop`.
3. `bash .claude/gesso-hop.sh setup`. It fetches upstream and reports the baseline. "No baseline" is expected only until hop-00 step F; after that it means stop and ask.
4. If `node_modules` is missing, run `bash .claude/gesso-hop.sh ci`.
5. Once a baseline exists, `verify` should match the last hop's recorded Verification table. If it doesn't, fix that before starting a new hop.
