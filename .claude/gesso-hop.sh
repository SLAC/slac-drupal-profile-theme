#!/usr/bin/env bash
#
# Helper for the stepwise (hop-by-hop) Gesso upgrade of the SLAC theme.
# Ported from W6-D9's .claude/gesso-hop.sh (branch gesso-upgrade-hop-by-hop).
#
# The theme IS the repository root (Composer package slac/slac-drupal-profile-theme),
# so THEME == ROOT. The upstream clone and the Storybook reference build live
# OUTSIDE the repo (~/.cache/gesso-slac). The compiled-output baseline and its
# pins are COMMITTED under .claude/baseline/ for the life of the rebuild, as
# W6-D9 did, so the "no visible change" evidence is reviewable in the PR.
#
# Usage:
#   bash .claude/gesso-hop.sh setup                 one-time: clone upstream, report baseline
#   bash .claude/gesso-hop.sh snapshot [--force]    save current build as the baseline (hop 0 ONLY)
#   bash .claude/gesso-hop.sh record-stories        re-record the story baseline (index.json + inventory)
#   bash .claude/gesso-hop.sh record-libcheck       re-record the libcheck baseline (after a deliberate library fix)
#   bash .claude/gesso-hop.sh diff <from> <to>      changed files: toolchain / review / ours / PHP
#   bash .claude/gesso-hop.sh show <from> <to>      full diff of toolchain + review paths
#   bash .claude/gesso-hop.sh file <tag> <path>     print one file at an upstream tag
#   bash .claude/gesso-hop.sh take <tag> <path>...  copy toolchain files verbatim from a tag
#   bash .claude/gesso-hop.sh deviations <f> <t>    warn where a diff touches a recorded deviation
#   bash .claude/gesso-hop.sh deps <tag> [--apply]  show/apply dependency bumps (no downgrades)
#   bash .claude/gesso-hop.sh install               npm install, preserving lockfile resolutions
#   bash .claude/gesso-hop.sh ci                    rm -rf node_modules && npm ci (what CI runs)
#   bash .claude/gesso-hop.sh driftcheck <tag>      our resolved versions vs upstream's own lockfile
#   bash .claude/gesso-hop.sh lint                  stylelint + eslint (npm scripts when present)
#   bash .claude/gesso-hop.sh sprite                structural check of the built SVG sprite
#   bash .claude/gesso-hop.sh libcheck              slac.libraries.yml dist paths + slac/common
#   bash .claude/gesso-hop.sh stories               Storybook entry count (index.json or inventory)
#   bash .claude/gesso-hop.sh smoke                 Storybook dev-server smoke test (after .storybook/ changes)
#   bash .claude/gesso-hop.sh verify                build + lint + storybook + all checks + baseline diff;
#                                                   exits non-zero and prints FAIL on any failure
#
# Typical hop:
#   diff <f> <t> · deviations <f> <t> · show <f> <t> · deps <t> --apply
#   · install · driftcheck <t> · verify   (+ ci then verify when majors move)
#
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
THEME="$ROOT"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/gesso-slac"
BASE="${GESSO_BASELINE:-$HERE/baseline}"
UPSTREAM="${GESSO_UPSTREAM:-$CACHE/upstream}"
# The Storybook 6.5 build of the hop-0 tip: the reference for the post-upgrade
# DOM/name comparison. ~12MB, so it is kept out of the repo.
SB_REF="${GESSO_SB_REF:-$CACHE/storybook-reference}"
LOGS="$HERE/gesso-logs"
HARNESS="$HERE/gesso-harness"
# Node comes from .nvmrc, which the GitHub workflows also use (setup-node
# node-version-file). Decided 2026-09-29: 22 throughout the rebuild.
NODE_V="${GESSO_NODE:-$(tr -d '[:space:]' < "$THEME/.nvmrc" 2>/dev/null || echo 22)}"

mkdir -p "$LOGS"

# Build/toolchain files we APPLY from upstream (take + re-apply registered
# deviations). Paths absent here (.eslintrc*, babel.config.json, patches,
# webpack.react-config.js ...) stay listed so upstream changes to them are
# still classified as toolchain.
TOOLCHAIN=(
  package.json
  .eslintrc.js .eslintrc-dev.js .eslintrc.cjs .eslintrc-dev.cjs
  eslint.config.js eslint.dev.config.js eslint.config.mjs
  .stylelintrc.yml .prettierrc .prettierignore .npmrc .swcrc
  tsconfig.json babel.config.json postcss.config.js
  webpack.common.js webpack.dev.js webpack.production.js
  webpack.theme-config.js webpack.react-config.js
  .storybook lib patches
  Dockerfile .dockerignore
  source/@types
  # README.md: main's README is upstream 5.0.9's verbatim, so it is taken like
  # any toolchain file DURING the rebuild. The SLAC package README lands as a
  # post-upgrade commit; after that, move README.md to REVIEW below.
  README.md
)

# Files upstream ships that we OWN but whose upstream changes must be read and
# hand-applied where relevant. Never `take` these.
#   .nvmrc     -- ours; pinned to 22 (build-assets.yml reads it; publish-demo-site.yml from hop 13)
#   .gitignore -- ours (Pantheon-style cut section + SLAC entries)
#   publish-demo-site.yml -- take upstream's changes by hand; keep branch main,
#                SHA-pinned actions, setup-node node-version-file
REVIEW=(
  .nvmrc .gitignore
  .github/workflows/publish-demo-site.yml
)

in_list() {
  local f="$1"; shift
  local t
  for t in "$@"; do
    [[ "$f" == "$t" || "$f" == "$t"/* ]] && return 0
  done
  return 1
}
is_toolchain() { in_list "$1" "${TOOLCHAIN[@]}"; }
is_review()    { in_list "$1" "${REVIEW[@]}"; }

# Node resolves packages by walking UP the directory tree. Because the theme is
# the repo root, a worktree nested inside another checkout (e.g. the desktop
# app's <checkout>/.claude/worktrees/<name>) silently resolves missing packages
# from THAT checkout's node_modules. Seen 2026-09-29: build-storybook at 5.0.9
# loaded Storybook 8.6 addons from the main checkout and died on React 18 APIs.
check_ancestors() {
  [[ "${GESSO_ALLOW_ANCESTOR_NODE_MODULES:-}" == 1 ]] && return 0
  local d bad=()
  d="$(dirname "$THEME")"
  while [[ "$d" != "/" ]]; do
    [[ -d "$d/node_modules" ]] && bad+=("$d/node_modules")
    d="$(dirname "$d")"
  done
  if (( ${#bad[@]} )); then
    echo "!! ancestor node_modules would leak into module resolution:" >&2
    printf '     %s\n' "${bad[@]}" >&2
    echo "   Work in a checkout/worktree OUTSIDE any other checkout (see gesso-STATE.md," >&2
    echo "   'Where to work'), or set GESSO_ALLOW_ANCESTOR_NODE_MODULES=1 if you are sure." >&2
    return 1
  fi
}

use_node() {
  check_ancestors || return 1
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use "$NODE_V" >/dev/null 2>&1 || {
    echo "!! Node $NODE_V not installed. Run: nvm install $NODE_V" >&2
    return 1
  }
}

cmd_setup() {
  mkdir -p "$(dirname "$UPSTREAM")"
  if [[ ! -d "$UPSTREAM/.git" ]]; then
    echo "Cloning forumone/gesso into $UPSTREAM ..."
    git clone --quiet --filter=blob:none https://github.com/forumone/gesso.git "$UPSTREAM"
  else
    git -C "$UPSTREAM" fetch --quiet --tags
  fi
  echo "upstream: $UPSTREAM ($(git -C "$UPSTREAM" tag | wc -l | tr -d ' ') tags)"
  if [[ ! -d "$BASE/css" ]]; then
    echo "!! No baseline snapshot at $BASE. Build the hop-0 commit, then run: snapshot"
  else
    echo "baseline: $BASE ($(find "$BASE" -type f | wc -l | tr -d ' ') files)"
    [[ -f "$BASE/NOTES.md" ]] && sed -n '1,6p' "$BASE/NOTES.md" | sed 's/^/  /'
  fi
}

cmd_snapshot() {
  if [[ -d "$BASE" && "${1:-}" != "--force" ]]; then
    echo "!! $BASE exists. snapshot REPLACES it (pins included). Re-run with --force if you mean it." >&2
    return 1
  fi
  [[ -d "$THEME/dist/css" && -d "$THEME/dist/js" ]] || {
    echo "!! no dist/css or dist/js -- run npm run build first" >&2; return 1; }
  rm -rf "$BASE"; mkdir -p "$BASE/extra"
  cp -R "$THEME/dist/css" "$THEME/dist/js" "$BASE/"
  cp "$THEME/source/00-config/_design-tokens.artifact.scss" \
     "$THEME/source/00-config/_GESSO.es6.js" "$BASE/" 2>/dev/null
  # Extra artifacts compared by verify when present.
  [[ -f "$THEME/dist/design-tokens.js" ]] && cp "$THEME/dist/design-tokens.js" "$BASE/extra/"
  [[ -f "$THEME/dist/images/sprite.artifact.svg" ]] && cp "$THEME/dist/images/sprite.artifact.svg" "$BASE/extra/"
  [[ -f "$THEME/storybook/index.json" ]] && cp "$THEME/storybook/index.json" "$BASE/extra/storybook-index.json"
  if [[ -d "$THEME/storybook" ]]; then
    rm -rf "$SB_REF"; mkdir -p "$(dirname "$SB_REF")"; cp -R "$THEME/storybook" "$SB_REF"
    echo "storybook reference build saved: $SB_REF"
  fi
  ( cd "$THEME" && node "$HARNESS/story-inventory.mjs" > "$BASE/extra/story-inventory.txt" 2>/dev/null ) || true
  ( cd "$THEME" && node "$HARNESS/libcheck.mjs" slac.libraries.yml > "$BASE/extra/libcheck.txt" 2>&1 ) || true
  {
    echo "# Baseline provenance"
    echo "- commit: $(git -C "$THEME" rev-parse --short HEAD) ($(git -C "$THEME" log -1 --format=%s))"
    echo "- gesso version: $(jq -r .version "$THEME/package.json")"
    echo "- node: $(node -v 2>/dev/null) / npm: $(npm -v 2>/dev/null)"
    echo "- captured: $(date '+%Y-%m-%d %H:%M %Z')"
    echo
    echo "Storybook reference build (not committed): $SB_REF"
    echo
    echo "Pins: put post-change copies in expected-since-<version>/{css,js}/ with a"
    echo "README.md explaining the cause and the proof it is inert; list artifacts"
    echo "deliberately no longer produced in expected-since-<version>/no-longer-emitted.txt."
  } > "$BASE/NOTES.md"
  echo "baseline saved: $BASE ($(find "$BASE" -type f | wc -l | tr -d ' ') files)"
}

# Re-record the story baseline: storybook/index.json (Storybook 7+ only; 6.5
# writes none) and the source inventory. Run it at hop 7 to start the story-ID
# diff, and whenever a commit DELIBERATELY adds/removes/renames stories (say
# why in the plan; the line appended to NOTES.md is the audit trail).
cmd_record_stories() {
  use_node || return 1
  cd "$THEME" || return 1
  [[ -d "$BASE/css" ]] || { echo "!! no baseline at $BASE" >&2; return 1; }
  mkdir -p "$BASE/extra"
  local msg="stories re-recorded @ $(git -C "$THEME" rev-parse --short HEAD):"
  if [[ -f storybook/index.json ]]; then
    cp storybook/index.json "$BASE/extra/storybook-index.json"
    msg+=" index.json $(jq -r '(.entries // .stories) | length' "$BASE/extra/storybook-index.json") entries;"
  fi
  node "$HARNESS/story-inventory.mjs" > "$BASE/extra/story-inventory.txt" 2>/dev/null
  msg+=" inventory $(wc -l < "$BASE/extra/story-inventory.txt" | tr -d ' ') rows"
  echo "- $msg" >> "$BASE/NOTES.md"
  echo "$msg"
}

# After a commit that deliberately changes slac.libraries.yml (e.g. the
# post-upgrade slac/common fix), re-record what libcheck is compared against.
cmd_record_libcheck() {
  use_node || return 1
  cd "$THEME" || return 1
  [[ -d "$BASE/css" ]] || { echo "!! no baseline at $BASE" >&2; return 1; }
  mkdir -p "$BASE/extra"
  node "$HARNESS/libcheck.mjs" slac.libraries.yml > "$BASE/extra/libcheck.txt" 2>&1
  echo "- libcheck re-recorded @ $(git -C "$THEME" rev-parse --short HEAD)" >> "$BASE/NOTES.md"
  cat "$BASE/extra/libcheck.txt"
}

cmd_diff() {
  local from="$1" to="$2"
  echo "### $from -> $to"
  git -C "$UPSTREAM" diff --shortstat "$from".."$to" -- . ':(exclude)package-lock.json'
  echo
  local tool=() review=() ours=()
  while read -r status file rest; do
    [[ -z "${file:-}" ]] && continue
    [[ "$file" == "package-lock.json" ]] && continue
    # Renames report the destination in $rest.
    [[ -n "${rest:-}" ]] && file="$rest"
    if is_toolchain "$file"; then tool+=("$status  $file")
    elif is_review "$file"; then review+=("$status  $file")
    else ours+=("$status  $file"); fi
  done < <(git -C "$UPSTREAM" diff -M --name-status "$from".."$to" -- . ':(exclude)package-lock.json')

  echo "--- TOOLCHAIN (apply: ${#tool[@]}) ---"
  printf '%s\n' "${tool[@]+"${tool[@]}"}"
  echo
  echo "--- REVIEW (ours; hand-apply what is relevant: ${#review[@]}) ---"
  printf '%s\n' "${review[@]+"${review[@]}"}"
  echo
  echo "--- OURS (skip: ${#ours[@]}) ---"
  printf '%s\n' "${ours[@]+"${ours[@]}"}" | sed 's/^/  /'
  echo
  echo "--- PHP layer in this hop (document in php-review-notes.md, do not apply) ---"
  printf '%s\n' "${ours[@]+"${ours[@]}"}" \
    | grep -E '(\.inc|\.theme|\.php|gesso_helper|\.info\.yml)' || echo "  (none)"
}

cmd_show() {
  local from="$1" to="$2"
  git -C "$UPSTREAM" diff -M "$from".."$to" -- "${TOOLCHAIN[@]}" "${REVIEW[@]}"
}

cmd_file() { git -C "$UPSTREAM" show "$1:$2"; }

cmd_take() {
  local tag="$1"; shift
  local p
  for p in "$@"; do
    # The theme root is the repo root: never let a take overwrite our README,
    # .nvmrc, CI workflows, or anything else outside the toolchain list.
    if ! is_toolchain "$p"; then
      echo "!! refusing to take $p: not a TOOLCHAIN path (hand-apply REVIEW files)" >&2
      continue
    fi
    if ! git -C "$UPSTREAM" cat-file -e "$tag:$p" 2>/dev/null; then
      echo "!! $p does not exist at $tag -- if upstream renamed or deleted it, git mv/rm ours by hand" >&2
      continue
    fi
    mkdir -p "$THEME/$(dirname "$p")"
    git -C "$UPSTREAM" show "$tag:$p" > "$THEME/$p.take.$$" && mv "$THEME/$p.take.$$" "$THEME/$p" \
      && echo "took $p @ $tag"
  done
  echo "   re-apply every register row for the files taken (.claude/gesso-deviations.md)"
  echo "   take never deletes: git rm the source side of any upstream rename yourself"
  echo "   (for forced edits to source/ files use: bash $0 file <tag> <path> > <path>)"
}

# Files/patterns covered by a recorded deviation. Keep in sync with
# gesso-deviations.md. Format: <path>|<grep pattern or "-">|<note>
#
# The pattern is grepped against the *upstream* diff's +/- lines, so it must
# match UPSTREAM's spelling, not ours. `|` is the field separator, so a
# pattern cannot contain an alternation. Seeded 2026-09-29 from the SLAC vs
# W6-D9 comparison; extend it whenever a register row is added.
DEVIATION_WATCH=(
  ".nvmrc|-|ours is 22 (decided 2026-09-29); build-assets.yml and ci.yml read it, publish-demo-site.yml from hop 13. Skip upstream's value unless re-decided"
  "README.md|-|taken verbatim during the rebuild (main's README is upstream's); the SLAC package README lands post-upgrade, then README moves to REVIEW"
  ".github/workflows/publish-demo-site.yml|-|hand-apply; keep branches [main], SHA-pinned actions, setup-node node-version-file"
  "webpack.common.js|-|after ANY take re-apply: StylelintPlugin files:'source'; jquery external (from 5.2.5). loadPaths is upstream's since 5.4.1; sass-embedded + webpackImporter:false are upstream's since 5.1.3"
  "webpack.common.js|jquery|we KEEP the jquery external (dropbutton, addtocal-a11y); upstream drops jQuery at 5.2.5"
  "webpack.common.js|Paths|resolved at 5.4.1: upstream uses loadPaths, as we do; follow upstream from here"
  "webpack.common.js|implementation|resolved at 5.1.3: upstream uses sass-embedded + webpackImporter:false, as we do; follow upstream from here"
  ".storybook/main.js|Paths|resolved at 5.4.1: upstream uses loadPaths, as we do; follow upstream from here"
  ".storybook/main.js|implementation|resolved at 5.1.3: upstream uses sass-embedded + webpackImporter:false, as we do; follow upstream from here"
  "webpack.common.js|StylelintPlugin|we add files: 'source' (theme root holds .claude/); re-apply after every take"
  "webpack.common.js|sprite|the sprite pipeline is load-bearing; since 5.4.3 svg-spritemap-webpack-plugin (no sprite.cjs, no dist/js/sprite.js). Run verify's sprite check, and spritecmp.py when svgo or the plugin moves"
  "webpack.common.js|silenceDeprecations|follow upstream exactly; never add a silence upstream lacks (if-function is FIXED at 5.4.4, not silenced)"
  ".storybook/main.js|createRequire|the ESM shim is coupled to the Storybook 10 bump (5.4.4 stage 2); take them together or neither"
  ".storybook/main.js|jquery|do NOT add a Storybook jquery external or stubs/jquery.js (W6-D9 and SLAC main have none)"
  ".storybook/preview.js|-|do NOT take verbatim: SLAC keeps storySort 'Paragraphs' + INITIAL_VIEWPORTS (key becomes options at SB9); no dist/js universal.es6 or html.es6 imports (from 5.2.3); no subheadingLevel"
  ".storybook/theme.js|-|SLAC branding; take only Storybook API/key changes"
  ".storybook/manager-head.html|-|SLAC fonts; skip upstream font changes"
  ".storybook/preview-head.html|-|SLAC fonts + SearchWidget script + document.body guard must survive"
  ".storybook/_drupal.js|-|OUR gessoImagePath line must survive; upstream renames this file to stubs/drupal.js at 5.0.10"
  ".storybook/stubs/drupal.js|-|OUR drupalSettings.gesso.gessoImagePath must survive (Storybook-only icon paths; verify cannot see it)"
  "package.json|deploy-storybook|keep --source-branch=main (upstream uses 5.x from 5.0.10); the script goes away at 5.2.6"
  "package.json|twig-drupal-filters|resolved at 5.4.2 (hop 19): @forumone/twig-drupal-filters adopted, the unscoped package removed; follow upstream from here"
  "eslint.config.js|-|upstream's flat config, taken verbatim (from 5.4.2); never add rule overrides or ignores; fix the code instead"
  ".eslintrc.js|react/|resolved at hop 1: SLAC's react/prop-types + react/jsx-props-no-spreading overrides dropped (lint clean without them); do not re-add"
  "source/@types/drupal/index.d.ts|imagePath|we keep gessoImagePath (image_path rename skipped)"
  "lib/transform.js|-|take upstream VERBATIM, then re-add only the font-feature-settings branch"
  "lib/transform.cjs|-|take upstream VERBATIM, then re-add only the font-feature-settings branch"
  "lib/component.js|gesso|theme-name sites become slac (attach_library, slac.libraries.yml, slac/global)"
  "lib/templates/Javascript.hbs|gesso|theme-name site becomes slac (Drupal.behaviors key)"
  "lib/cleanUniqueId.js|-|do NOT adopt (5.4.0-5.4.4); upstream reverts the rename at 5.4.5"
  "lib/subheadingLevelTwigExtension.js|-|do NOT adopt without its PHP half in slac_helper"
  "package.json|react-config|we have no source/07-react; keep it out of the build script"
  "package.json|forumone/eslint-config|pin EXACTLY to upstream's tested version; deps --apply re-carets these -- re-assert"
  "package.json|overrides|storybook self-override (SB9+) and terser/minimizer pins are load-bearing; do not drop"
  "package.json|jquery|we keep jquery (upstream removes it at 5.2.5)"
  "package.json|swc/cli|never introduce; nothing runs the swc CLI"
  "package.json|\"svgo\"|never introduce; the sprite plugin's peer resolves it"
  "package.json|\"sass\"|never introduce; we use sass-embedded"
  "package.json|fibers|never introduce"
  ".npmrc|-|deleted after hop 11 (legacy-peer-deps caused the glob 10 breakage); do not reintroduce"
  ".stylelintrc.yml|selector-max-compound|local relaxation to keep (4-deep nested lists)"
  "source/06-utility/build-test|-|never adopt; would add dist/js entries"
  "source/07-react|-|never adopt; we have no React app"
  "gesso.libraries.yml|-|ours is slac.libraries.yml; read upstream library changes for our-scope fixes (e.g. static common at 5.4.6) -- decide separately"
  "gesso.info.yml|core_version_requirement|decided: '^10.3 || ^11' at hop 23 (5.4.6), with slac_helper in lock-step"
)

cmd_deviations() {
  local from="$1" to="$2" hit=0
  for r in "$from" "$to"; do
    git -C "$UPSTREAM" rev-parse --verify --quiet "$r^{commit}" >/dev/null || {
      echo "!! unknown upstream ref: '$r' -- check the tag and retry" >&2; return 2; }
  done
  local changed
  # --name-only reports only a rename's destination; include both sides.
  changed="$(git -C "$UPSTREAM" diff -M --name-status "$from".."$to" \
    | awk '{ for (i = 2; i <= NF; i++) print $i }')" || {
    echo "!! diff failed for $from..$to" >&2; return 2; }
  echo "### Deviation check: $from -> $to"
  local entry path pat note
  for entry in "${DEVIATION_WATCH[@]}"; do
    IFS='|' read -r path pat note <<< "$entry"
    grep -qx "$path" <<< "$changed" || grep -q "^$path/" <<< "$changed" || continue
    if [[ "$pat" == "-" ]]; then
      echo "  !! $path -- $note"; hit=1
    elif git -C "$UPSTREAM" diff "$from".."$to" -- "$path" | grep -qE "^[+-].*$pat"; then
      echo "  !! $path ($pat) -- $note"; hit=1
    fi
  done
  (( hit )) || echo "  ok: nothing in this diff touches a watched deviation"
  echo "  (the watch list is pattern-based and HAS missed things in W6-D9;"
  echo "   the register .claude/gesso-deviations.md is the source of truth)"
}

# Compare upstream's package.json at a tag against ours, applying the standing
# policy: take upstream's target, never downgrade, never introduce a package we
# do not already have.
cmd_deps() {
  local tag="$1" apply="${2:-}"
  local up ours
  up="$(git -C "$UPSTREAM" show "$tag:package.json")"
  ours="$(cat "$THEME/package.json")"
  echo "### Dependency deltas for $tag  (apply=${apply:-no})"
  local filter='
    def semver: sub("^[^0-9]*";"") | split(".") | map(tonumber? // 0);
    def is_range: test("^[~^]?[0-9]+\\.[0-9]+");
    def newer($a;$b): ($a|semver) as $x | ($b|semver) as $y
      | [ $x[0]//0, $x[1]//0, $x[2]//0 ] > [ $y[0]//0, $y[1]//0, $y[2]//0 ];
    ($up.devDependencies // {}) + ($up.dependencies // {}) as $U
    | ($ours.devDependencies // {}) + ($ours.dependencies // {}) as $O
    | [ $U | to_entries[]
        | .key as $k | .value as $uv
        | select($O[$k] != null)
        | select($O[$k] != $uv)
        | {pkg: $k, ours: $O[$k], upstream: $uv,
           action: (
             if (($uv | is_range) and ($O[$k] | is_range)) then
               (if newer($O[$k]; $uv) then "KEEP-OURS-NEWER" else "BUMP" end)
             else "REVIEW-NON-SEMVER" end)} ]
    | sort_by(.action, .pkg)'
  local deltas
  deltas="$(jq -n --argjson up "$up" --argjson ours "$ours" "$filter")"
  jq -r '.[] | "  \(.action)  \(.pkg): \(.ours) -> \(.upstream)"' <<< "$deltas"
  echo "  --- absent here, upstream declares them (default: do NOT introduce):"
  jq -rn --argjson up "$up" --argjson ours "$ours" '
    ($up.devDependencies // {}) + ($up.dependencies // {}) as $U
    | ($ours.devDependencies // {}) + ($ours.dependencies // {}) as $O
    | [ $U | keys[] | select($O[.] == null) ] | sort | .[]' \
    | sed 's/^/      /' || true
  echo "  --- we declare these, upstream $tag does NOT (check each is deliberate):"
  jq -rn --argjson up "$up" --argjson ours "$ours" '
    ($up.devDependencies // {}) + ($up.dependencies // {}) as $U
    | ($ours.devDependencies // {}) + ($ours.dependencies // {}) as $O
    | [ $O | keys[] | select($U[.] == null) ] | sort | .[]' \
    | sed 's/^/      /' || true
  echo "  --- scripts upstream changed (re-read: upstream's build can gain steps we cannot run):"
  jq -rn --argjson up "$up" --argjson ours "$ours" '
    [ ($up.scripts // {}) | to_entries[] | select(($ours.scripts // {})[.key] != .value)
      | "      \(.key): \(($ours.scripts // {})[.key] // "(absent)") -> \(.value)" ] | .[]' || true

  if [[ "$apply" == "--apply" ]]; then
    local prog
    prog="$(jq -r '[.[] | select(.action=="BUMP")
      | "if .devDependencies[\"\(.pkg)\"] then .devDependencies[\"\(.pkg)\"]=\"\(.upstream)\" else .dependencies[\"\(.pkg)\"]=\"\(.upstream)\" end"]
      | join(" | ")' <<< "$deltas")"
    if [[ -n "$prog" ]]; then
      jq --indent 2 "$prog" "$THEME/package.json" > "$THEME/package.json.tmp" \
        && mv "$THEME/package.json.tmp" "$THEME/package.json"
      echo "  applied $(jq -r '[.[]|select(.action=="BUMP")]|length' <<< "$deltas") bump(s)"
    else
      echo "  nothing to bump"
    fi
    jq --indent 2 --arg v "${tag}" '.version = $v' "$THEME/package.json" \
      > "$THEME/package.json.tmp" && mv "$THEME/package.json.tmp" "$THEME/package.json"
    echo "  version set to $tag"
    echo "  !! re-assert exact pins (@forumone/eslint-config-*) and overrides after --apply"
  fi
}

# Upstream's caret range, resolved today, yields a far newer minor than
# upstream ever tested. Compare against upstream's OWN committed lockfile.
# Transitive output-generators (terser & co.) are not direct deps, so they get
# their own watch list (W6-D9's driftcheck could not see terser).
WATCH_TRANSITIVE=(terser terser-webpack-plugin minimizer-webpack-plugin caniuse-lite browserslist postcss svgo)

cmd_driftcheck() {
  local tag="$1"
  local uplock="$LOGS/upstream-lock-$tag.json"
  git -C "$UPSTREAM" show "$tag:package-lock.json" > "$uplock" 2>/dev/null || {
    echo "!! upstream has no lockfile at $tag"; return 1; }
  [[ -s "$uplock" ]] || { echo "!! upstream has no lockfile at $tag"; return 1; }
  echo "### Resolution drift vs upstream's own lockfile at $tag"
  echo "    direct dependencies, major/minor gaps (upstream-tested behavior may not hold):"
  jq -rn --slurpfile u "$uplock" --slurpfile o "$THEME/package-lock.json" \
         --slurpfile p "$THEME/package.json" '
    def mm: sub("^[^0-9]*";"") | split(".") | [ (.[0]|tonumber? // 0), (.[1]|tonumber? // 0) ];
    (($p[0].devDependencies // {}) + ($p[0].dependencies // {}) | keys) as $direct
    | ($o[0].packages // {}) as $O
    | [ $direct[]
        | . as $name | ("node_modules/" + $name) as $k
        | ($u[0].packages[$k].version // null) as $uv
        | ($O[$k].version // null) as $ov
        | select($uv != null and $ov != null and $ov != $uv)
        | select(($ov|mm) != ($uv|mm))
        | {pkg: $name, upstream: $uv, ours: $ov} ]
    | sort_by(.pkg)
    | if length == 0 then "  ok: no major/minor drift in direct dependencies"
      else (.[] | "  \(.pkg): upstream pinned \(.upstream)  ours \(.ours)") end'
  echo "    watched output-affecting packages (exact versions, hoisted copy):"
  local w
  for w in sass-embedded webpack autoprefixer "${WATCH_TRANSITIVE[@]}"; do
    jq -rn --slurpfile u "$uplock" --slurpfile o "$THEME/package-lock.json" --arg n "$w" '
      ("node_modules/" + $n) as $k
      | ($u[0].packages[$k].version // "-") as $uv
      | ($o[0].packages[$k].version // "-") as $ov
      | "  \(if $uv == $ov then "  " else "!!" end) \($n): upstream \($uv)  ours \($ov)"'
  done
  echo "    (run npm audit --package-lock-only before and after any dependency change)"
}

cmd_install() {
  use_node || return 1
  cd "$THEME" || return 1
  # Deliberately NOT deleting package-lock.json: a full regeneration drags in
  # unrelated semver drift (notably sass-embedded, which changes compiled CSS).
  npm install 2>&1 | tail -5
}

cmd_ci() {
  use_node || return 1
  cd "$THEME" || return 1
  # Exactly what .github/workflows/*.yml run. A clean resolve catches peer
  # conflicts that npm install against an existing node_modules hides.
  rm -rf node_modules
  npm ci > "$LOGS/npm-ci.log" 2>&1; local rc=$?
  echo "npm ci: exit=$rc"; tail -5 "$LOGS/npm-ci.log"
  return $rc
}

has_script() { jq -e --arg s "$1" '.scripts[$s] // empty' "$THEME/package.json" >/dev/null 2>&1; }

cmd_lint() {
  use_node || return 1
  cd "$THEME" || return 1
  local sl_rc el_rc

  # Before 5.1.2 there are no lint scripts; the fallbacks mirror their scope.
  if has_script stylelint; then
    npm run stylelint --silent > "$LOGS/stylelint.log" 2>&1; sl_rc=$?
  else
    npx stylelint "source/**/*.scss" > "$LOGS/stylelint.log" 2>&1; sl_rc=$?
  fi
  echo "stylelint: exit=$sl_rc  problems=$(grep -cE '^\s+[0-9]+:[0-9]+' "$LOGS/stylelint.log")"

  if has_script eslint; then
    npm run eslint --silent -- --format json \
      > "$LOGS/eslint.json" 2>"$LOGS/eslint.err"; el_rc=$?
  else
    npx eslint source --ext .js --ignore-pattern "*.stories.js" \
      --format json > "$LOGS/eslint.json" 2>"$LOGS/eslint.err"; el_rc=$?
  fi
  if [[ -s "$LOGS/eslint.json" ]]; then
    jq -r '"eslint:    files=\(length) errors=\([.[].errorCount]|add) warnings=\([.[].warningCount]|add)"' \
      "$LOGS/eslint.json"
    jq -r '.[] | select(.errorCount+.warningCount>0) | .filePath as $f
           | .messages[] | "  \($f|sub(".*/source/";"source/")):\(.line) \(.severity|if .==2 then "error" else "warn" end) \(.message) [\(.ruleId)]"' \
      "$LOGS/eslint.json"
  else
    echo "eslint:    FAILED to run (exit=$el_rc)"; tail -3 "$LOGS/eslint.err"
  fi
}

# Assert the sprite's STRUCTURE: every source SVG becomes a symbol with a
# viewBox, and every fragment our markup references resolves to one.
cmd_sprite_check() {
  cd "$THEME" || return 1
  echo "=== svg sprite ==="
  local art=dist/images/sprite.artifact.svg
  if [[ ! -s $art ]]; then
    echo "sprite: !! MISSING or empty ($art)"
    echo "        every icon would be a blank box; the artifact is gitignored and"
    echo "        built in CI, so a release ships without it. See gesso-deviations.md."
    return 1
  fi
  python3 - "$art" <<'PY'
import os, re, sys, glob
art = sys.argv[1]
svg = open(art, encoding='utf-8').read()
symbols = re.findall(r'<symbol\b[^>]*>', svg)
ids = set(re.findall(r'<symbol[^>]*\bid="([^"]+)"', svg))
with_vb = sum(1 for s in symbols if 'viewBox=' in s)
src = {os.path.basename(p)[:-4]
       for p in glob.glob('source/images/_sprite-source-files/*.svg')}
print(f"sprite: {os.path.getsize(art)} bytes, {len(symbols)} symbols, {with_vb} with viewBox")
if with_vb != len(symbols):
    print(f"        !! {len(symbols) - with_vb} symbol(s) lost their viewBox")
missing, extra = sorted(src - ids), sorted(ids - src)
if missing or extra:
    if missing: print(f"        !! source SVGs with no symbol: {missing}")
    if extra:   print(f"        !! symbols with no source SVG: {extra}")
else:
    print(f"        symbol ids == source filenames ({len(ids)}/{len(src)}) OK")

refs = set()
for root in ('source', 'templates'):
    for dirpath, _, names in os.walk(root):
        for n in names:
            if not n.endswith(('.twig', '.js', '.jsx', '.ts', '.yml', '.scss')):
                continue
            p = os.path.join(dirpath, n)
            try:
                t = open(p, encoding='utf-8').read()
            except (OSError, UnicodeDecodeError):
                continue
            refs |= set(re.findall(r'sprite\.artifact\.svg#([A-Za-z0-9_-]+)', t))
            # icon_name as a Twig/YAML key or a quoted JS key.
            refs |= set(re.findall(r"""['"]?icon_name['"]?\s*:\s*['"]([A-Za-z0-9_-]+)['"]""", t))
# Drop templated fragments and string-concatenation prefixes ("arrow-" + dir).
refs = {r for r in refs if not r.startswith('{') and not r.endswith('-')}
unresolved = sorted(refs - ids)
if unresolved:
    print(f"        !! referenced but not in sprite: {unresolved}")
else:
    print(f"        all {len(refs)} referenced fragments resolve OK")
PY
  local sb=storybook/images/sprite.artifact.svg
  if [[ -d storybook ]]; then
    [[ -s $sb ]] && echo "        storybook copy present OK" \
                 || echo "        !! storybook copy missing ($sb)"
  fi
}

cmd_libcheck() {
  use_node || return 1
  cd "$THEME" || return 1
  echo "=== slac.libraries.yml ==="
  node "$HARNESS/libcheck.mjs" slac.libraries.yml
}

cmd_stories() {
  use_node || return 1
  cd "$THEME" || return 1
  if [[ -f storybook/index.json ]]; then
    jq -r '(.entries // .stories) as $e
      | [$e[] | .type // "story"] | group_by(.) | map("\(.[0])=\(length)") | join(" ")
      | "storybook index.json: \(.)"' storybook/index.json
    if [[ -f "$BASE/extra/storybook-index.json" ]]; then
      diff <(jq -r '(.entries // .stories) | keys[]' "$BASE/extra/storybook-index.json" | sort) \
           <(jq -r '(.entries // .stories) | keys[]' storybook/index.json | sort) \
        > "$LOGS/story-ids.diff" \
        && echo "        story IDs identical to baseline" \
        || { echo "        !! story IDs differ from baseline:"; sed 's/^/          /' "$LOGS/story-ids.diff" | head -20; }
    fi
  else
    echo "storybook: no index.json (Storybook 6.5 writes none before hop 7); using the source inventory"
  fi
  node "$HARNESS/story-inventory.mjs" > "$LOGS/story-inventory.txt" 2>"$LOGS/story-inventory.err"
  echo "source inventory: $(wc -l < "$LOGS/story-inventory.txt" | tr -d ' ') rows"
  if [[ -f "$BASE/extra/story-inventory.txt" ]]; then
    diff -q "$BASE/extra/story-inventory.txt" "$LOGS/story-inventory.txt" >/dev/null \
      && echo "        identical to baseline inventory" \
      || echo "        !! differs from baseline inventory: diff $BASE/extra/story-inventory.txt $LOGS/story-inventory.txt"
  fi
}

# Storybook dev-server smoke test. build-storybook never runs the dev config
# (HMR, react-refresh), so run this after any hop that touches .storybook/.
# --smoke-test exits after the first compile, but Storybook exits 1 whenever
# the build has *warnings* (our Sass deprecations), so judge by the log
# instead: no error lines, and the builds completed. 6.5 logs "built preview";
# 7+ prints the warnings array (a bare "[" line) only after both builds finish,
# and reports failures as "ERR!".
cmd_smoke() {
  use_node || return 1
  cd "$THEME" || return 1
  local log="$LOGS/storybook-smoke.log" rc errs
  npm run storybook -- --ci --smoke-test > "$log" 2>&1; rc=$?
  errs=$(grep -cE 'ERROR in|Module not found|Module build failed|SyntaxError|Can.t resolve|Error: |ERR!' "$log")
  echo "storybook dev smoke: exit=$rc  error lines=$errs  warnings=$(grep -c '"moduleName"' "$log")"
  grep -E 'ERROR in|Module not found|Module build failed|SyntaxError|Can.t resolve|Error: |ERR!' "$log" | head -5
  if (( errs == 0 )) && { (( rc == 0 )) || grep -qE 'built preview|preview: \[|^\[$' "$log"; }; then
    echo "SMOKE: PASS"
  else
    echo "SMOKE: FAIL (log: $log)"; return 1
  fi
}

cmd_verify() {
  use_node || return 1
  cd "$THEME" || return 1
  local fails=()
  echo "=== node $(node -v) / npm $(npm -v) ==="
  # Remove what the baseline covers, AND the sprite -- otherwise a stale
  # artifact masks one that stopped being emitted (W6-D9's sprite regression
  # hid for four hops exactly this way).
  rm -rf dist/css dist/js
  rm -f dist/images/sprite.artifact.svg dist/design-tokens.js
  npm run build > "$LOGS/build.log" 2>&1; local brc=$?
  # `npm run build` runs TWO webpack invocations (theme-config, then
  # production); sum both, counting "compiled successfully" as 0.
  local warn
  # Handles "compiled with 3 warnings" and "compiled with 1 error and 3 warnings".
  warn="$(grep -oE 'compiled with ([0-9]+ errors? and )?[0-9]+ warnings?' "$LOGS/build.log" \
    | grep -oE '[0-9]+ warnings?' | grep -oE '[0-9]+' | paste -sd+ - | bc 2>/dev/null)"
  echo "build: exit=$brc  warnings=${warn:-0} (summed over $(grep -cE 'compiled (with|successfully)' "$LOGS/build.log") webpack runs)"
  grep -E '^ERROR|ERROR in|Module build failed' "$LOGS/build.log" | head -5
  (( brc == 0 )) || fails+=("build exit $brc")
  echo
  # Lint AFTER the build: before 5.4.2 eslint reports phantom
  # import/no-unresolved errors until the build has generated _GESSO.es6.js.
  cmd_lint | tee "$LOGS/lint-summary.txt"
  grep -qE '^stylelint: exit=0 ' "$LOGS/lint-summary.txt" || fails+=("stylelint")
  grep -qE '^eslint: +files=[0-9]+ errors=0 ' "$LOGS/lint-summary.txt" || fails+=("eslint")
  echo

  # Remove the previous build so a stale index.json cannot mask a failed one.
  rm -rf storybook
  npm run build-storybook > "$LOGS/storybook.log" 2>&1; local src=$?
  echo "storybook: exit=$src"
  grep -E '^ERROR|Error:' "$LOGS/storybook.log" | head -5
  (( src == 0 )) || fails+=("build-storybook exit $src")
  echo
  cmd_sprite_check | tee "$LOGS/sprite-summary.txt"
  grep -q '!!' "$LOGS/sprite-summary.txt" && fails+=("sprite")
  echo
  cmd_stories | tee "$LOGS/stories-summary.txt"
  grep -q '!!' "$LOGS/stories-summary.txt" && fails+=("stories (check whether the change is intended)")
  echo
  node "$HARNESS/libcheck.mjs" slac.libraries.yml | tee "$LOGS/libcheck.txt"
  if [[ -f "$BASE/extra/libcheck.txt" ]]; then
    diff -q "$BASE/extra/libcheck.txt" "$LOGS/libcheck.txt" >/dev/null \
      || { echo "   !! libcheck output differs from baseline: diff $BASE/extra/libcheck.txt $LOGS/libcheck.txt"; fails+=("libcheck"); }
  fi
  echo
  echo "=== compiled output vs baseline ($BASE) ==="
  if [[ -d "$BASE/css" ]]; then
    local c j expect n=0
    # Artifacts that legitimately changed at a known hop are compared against
    # their recorded post-change form (pinned content, not a filename
    # whitelist), so any FURTHER change still fails.
    expect="$(mktemp -d)"
    cp -R "$BASE/css" "$BASE/js" "$expect/"
    local ov r=0
    for ov in "$BASE"/expected-since-*/; do
      [[ -d "$ov" ]] || continue
      [[ -d "$ov"js ]]  && cp -R "$ov"js/.  "$expect/js/"
      [[ -d "$ov"css ]] && cp -R "$ov"css/. "$expect/css/"
      n=$(( n + $(find "$ov" -type f ! -name 'README.md' ! -name 'no-longer-emitted.txt' | wc -l | tr -d ' ') ))
      if [[ -f "$ov"no-longer-emitted.txt ]]; then
        local gone
        while read -r gone; do
          [[ -z "$gone" || "$gone" == \#* ]] && continue
          rm -f "$expect/$gone"
          [[ -e "dist/$gone" ]] && echo "   !! dist/$gone should no longer be emitted, but exists"
          r=$(( r + 1 ))
        done < "$ov"no-longer-emitted.txt
      fi
    done
    (( n )) && echo "   (${n} artifact(s) compared against a recorded post-change form)"
    (( r )) && echo "   (${r} artifact(s) recorded as no longer emitted)"
    c=$(diff -rq "$expect/css" dist/css 2>&1); j=$(diff -rq "$expect/js" dist/js 2>&1)
    rm -rf "$expect"
    [[ -z "$c" ]] && echo "dist/css: IDENTICAL" || { echo "dist/css DIFFERS:"; echo "$c" | sed 's/^/  /'; fails+=("dist/css"); }
    [[ -z "$j" ]] && echo "dist/js:  IDENTICAL" || { echo "dist/js DIFFERS:"; echo "$j" | sed 's/^/  /'; fails+=("dist/js"); }
    for a in _design-tokens.artifact.scss _GESSO.es6.js; do
      if [[ -f "$BASE/$a" ]]; then
        diff -q "$BASE/$a" "source/00-config/$a" >/dev/null 2>&1 \
          && echo "$a: IDENTICAL" || { echo "$a: DIFFERS"; fails+=("$a"); }
      fi
    done
    # dist/design-tokens.js (theme-config's design-tokens entry). A pinned
    # post-change copy may sit in expected-since-*/design-tokens.js; a later
    # expected-since-*/no-longer-emitted.txt listing design-tokens.js pins its
    # absence (webpack 5.98 writes no JS for an asset-only entry; hop 19).
    if [[ -f "$BASE/extra/design-tokens.js" ]]; then
      local dt="$BASE/extra/design-tokens.js" ovf dt_gone=0
      for ovf in "$BASE"/expected-since-*/; do
        [[ -f "${ovf}design-tokens.js" ]] && { dt="${ovf}design-tokens.js"; dt_gone=0; }
        [[ -f "${ovf}no-longer-emitted.txt" ]] && grep -qx 'design-tokens.js' "${ovf}no-longer-emitted.txt" && dt_gone=1
      done
      if (( dt_gone )); then
        if [[ -f dist/design-tokens.js ]]; then
          echo "dist/design-tokens.js: !! recorded as no longer emitted, but exists"; fails+=("design-tokens.js reappeared")
        else
          echo "dist/design-tokens.js: not emitted (recorded)"
        fi
      elif [[ ! -f dist/design-tokens.js ]]; then
        echo "dist/design-tokens.js: !! no longer emitted"; fails+=("design-tokens.js missing")
      elif diff -q "$dt" dist/design-tokens.js >/dev/null; then
        echo "dist/design-tokens.js: IDENTICAL"
      else
        echo "dist/design-tokens.js: DIFFERS"; fails+=("design-tokens.js")
      fi
    fi
  else
    echo "!! no baseline to compare against"
    echo "   (after hop-0 step F a missing baseline means STOP -- never re-snapshot the real one)"
    fails+=("no baseline")
  fi
  echo
  if (( ${#fails[@]} )); then
    echo "VERIFY: FAIL -- ${fails[*]}"
    return 1
  fi
  echo "VERIFY: PASS"
}

case "${1:-}" in
  setup)      cmd_setup ;;
  snapshot)   cmd_snapshot "${2:-}" ;;
  record-stories) cmd_record_stories ;;
  record-libcheck) cmd_record_libcheck ;;
  diff)       cmd_diff "$2" "$3" ;;
  show)       cmd_show "$2" "$3" ;;
  file)       cmd_file "$2" "$3" ;;
  take)       shift; cmd_take "$@" ;;
  deviations) cmd_deviations "$2" "$3" ;;
  deps)       cmd_deps "$2" "${3:-}" ;;
  driftcheck) cmd_driftcheck "$2" ;;
  install)    cmd_install ;;
  ci)         cmd_ci ;;
  lint)       cmd_lint ;;
  sprite)     cmd_sprite_check ;;
  libcheck)   cmd_libcheck ;;
  stories)    cmd_stories ;;
  smoke)      cmd_smoke ;;
  verify)     cmd_verify ;;
  *)          sed -n '2,35p' "$0"; exit 1 ;;
esac
