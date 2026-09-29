# Non-hop: delete `.npmrc`, adopt glob 10 and upstream's webpack entry function

**Status: done.** Runs immediately after hop 11 (5.2.4), exactly as W6-D9's `57e1f95c` did, and closes hop 11's one deferral.

## W6-D9 reference

`57e1f95c`, plan `non-hop-npmrc-removal.md`. Its findings hold here: `.npmrc`'s `legacy-peer-deps=true` did not merely hide a peer problem, it **caused** one. `glob-promise@6` (under Storybook 7.0's `@storybook/core-common`) peer-depends on `glob ^8` with no own dependency, so with the flag on it fell through to the hoisted glob 10 (`TypeError: glob is not a function`). Without the flag npm nests `glob-promise` + glob 8 under `core-common` and leaves glob 10 at the top. W6-D9 then took `webpack.common.js` verbatim (no local sort) and pinned the resulting module-ID permutation by content.

## 1. `.npmrc` deleted

`git rm .npmrc` (`legacy-peer-deps=true`), then `install` against the existing lockfile. **Zero resolutions changed** (1731 entries before and after, none added, removed or moved; W6-D9 saw one patch-level change). The lockfile diff is only npm recomputing `dev` flags: 128 entries lose `"dev": true` now that peer edges count. Upstream ships no `.npmrc`, so a divergence goes too.

## 2. glob `^10.3.3` + upstream's `gatherProjectFiles()`

- `webpack.common.js`: upstream 5.2.4 **verbatim** plus the register rows (`loadPaths`, StylelintPlugin `files`). The async `Glob.iterate()` entry replaces the 5.2.3 `glob.sync` one.
- `package.json` `glob`: `^8.1.0` → `^10.3.3` (upstream's range).
- **Resolution: glob 10.5.0, not upstream's tested 10.3.3.** 10.3.3 is inside GHSA-5j98-mcp5-4vw2 (high, `>=10.2.0 <10.5.0`: the glob **CLI**'s `-c/--cmd` runs matches through a shell). We only use the library API at build time, but the STATE carve-out says: if upstream's tested version lands in an advisory range, take the lowest non-advisory version and prove the output inert. 10.5.0 is that version, and it is **exactly W6-D9's resolution** (glob 10.5.0, jackspeak 3.4.3, path-scurry 1.11.1, all identical here). Built both ways: `dist/` is identical between 10.3.3 and 10.5.0. Flag **F-09**.
- npm nested `glob` 8.1.0 and `glob-promise` under `@storybook/core-common`, as upstream's 5.2.4 lockfile does.

## 3. Lockfile tooling fix (found here)

The first `lockfix.sh` run after the glob install **hoisted `glob-promise` back to the top level** (hop 7's `lockhoist.cjs` only checked that no top-level copy existed), where its peer resolved to glob 10: `build-storybook` failed again. Two fixes to the harness:
- `lockhoist.cjs` now refuses a hoist that would change what a package's **peers** resolve to (plain dependencies are repaired below).
- New `lockcheck.cjs`: lists every unsatisfied edge in the lockfile (who depends on what, with which range), and `--repair` nests a satisfying copy under the dependent (from the previous, then upstream's, lockfile), or for a top-level package whose peer cannot be met, moves it under its dependents beside a satisfying peer (upstream's layout). `lockfix.sh` now ends with `lockcheck --repair` + `install` until clean. `npm ls --all --package-lock-only` reports the same problems.

`lockcheck` also found two invalid edges that hop 7's rewinds had left in the committed lockfile (and `npm ls` confirms at `42f5588`): `istanbul-lib-report` → `make-dir@^3` resolving to 4.0.0, and `v8-to-istanbul` → `convert-source-map@^1.6` resolving to 2.0.0. Both are Storybook's jest/coverage tooling, never run by our builds; repaired here (3.1.0 and 1.9.0 nested). The one remaining unmet edge is accepted: `twig-loader`'s peer `twig ~1.10.5` vs twig 1.16.0, pre-existing at `main` and present in upstream's lockfile too. F-08 updated.

Lockfile validity by commit (`npm ls --all --package-lock-only`): hop 0 `ec9049b` 4 problems (missing TypeScript peers, webpack), hop 6 `f773ccc` 1, hop 7 `42f5588` 2, hop 11 `0c74a05` 2, **this commit 0** (plus the accepted twig-loader peer, which `npm ls` does not report for the tarball dependency).

## Output

| Check | Result |
| --- | --- |
| `dist/css` | IDENTICAL |
| `dist/js` | IDENTICAL after one new pin: `search.es6.js`, two module IDs swapped (`908` ↔ `8915`), same length and character multiset, all strings identical; reproducible 3/3 locally (`expected-since-5.2.4/README.md`) |
| lint | eslint 42 files, 0/0; stylelint 0 |
| build | exit 0, 246 warnings |
| build-storybook | exit 0; dev smoke PASS |
| stories | IDs identical (233) |
| sprite / libcheck | unchanged |
| npm audit | 86 (same as hop 11; with 10.3.3 it was 87) |

## Not changed

webpack stays at 5.82.0: upstream's 5.2.4 lockfile moved to 5.88.2 without changing the `^5.82.0` range, and our policy (like W6-D9's practice) moves an output-generating package only when upstream's range requires it.

## Flags

- **F-09**: glob 10.5.0 instead of upstream's tested 10.3.3 (advisory range; same as W6-D9's resolution).
- F-08 updated (lockcheck; the two hop-7 invalid edges repaired).
