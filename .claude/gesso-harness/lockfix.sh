#!/usr/bin/env bash
# lockfix.sh <prev-lock.json> <upstream-tag>
#
# After a hop's `npm install` has floated transitive packages (gesso-STATE.md
# trap S14), rewind them: loop lockmin.cjs (to a fixpoint) + lockhoist.cjs +
# `gesso-hop.sh install` until the lockfile is stable. Run from the theme root.
#
# <prev-lock.json>  the lockfile before this hop (e.g. `git show HEAD:package-lock.json`)
# <upstream-tag>    the hop's release; its package-lock.json is the "upstream-tested" source
#
# Advisory data is the union of `npm audit --package-lock-only` over the previous,
# upstream and current lockfiles, so a candidate is judged even when the current
# tree does not contain it. Vulnerable candidates are refused except for the
# output-generating build tooling matched by allow-vuln.re (record those in the
# hop plan). Follow with `gesso-hop.sh ci` and `driftcheck`.
set -uo pipefail
prev="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")" tag="$2"
H="$(cd "$(dirname "$0")" && pwd)"
LOGS="$H/../gesso-logs"; UPSTREAM="${GESSO_UPSTREAM:-${XDG_CACHE_HOME:-$HOME/.cache}/gesso-slac/upstream}"
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null; nvm use "$(tr -d '[:space:]' < .nvmrc)" >/dev/null
up="$LOGS/lockfix-upstream-$tag.json"
git -C "$UPSTREAM" show "$tag:package-lock.json" > "$up"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
audit_of() { # <name> <lock> <package.json source: file path or "tag:TAG">
  local d="$work/$1"; mkdir -p "$d"; cp "$2" "$d/package-lock.json"
  if [[ "$3" == tag:* ]]; then git -C "$UPSTREAM" show "${3#tag:}:package.json" > "$d/package.json"; else cp "$3" "$d/package.json"; fi
  (cd "$d" && npm audit --package-lock-only --json > audit.json 2>/dev/null); echo "$d/audit.json"
}
git show HEAD:package.json > "$work/prev-package.json" 2>/dev/null || cp package.json "$work/prev-package.json"
a1=$(audit_of prev "$prev" "$work/prev-package.json"); a2=$(audit_of up "$up" "tag:$tag"); a3=$(audit_of cur package-lock.json package.json)
audit="$LOGS/lockfix-audit-union.json"
OUT="$audit" node -e '
const fs=require("fs"); const out={vulnerabilities:{}};
for (const f of process.argv.slice(1)) { const a=JSON.parse(fs.readFileSync(f,"utf8")); for (const [n,v] of Object.entries(a.vulnerabilities||{})) { const t=(out.vulnerabilities[n] ||= {via:[]}); for (const via of v.via||[]) t.via.push(via); if (v.range && (v.via||[]).some(x=>typeof x==="string")) t.range = t.range ? t.range+" || "+v.range : v.range; } }
fs.writeFileSync(process.env.OUT, JSON.stringify(out));' "$a1" "$a2" "$a3"
av="$(cat "$H/allow-vuln.re")"
lm() { node "$H/lockmin.cjs" "$prev" "$up" --audit "$audit" --allow-vuln "$av" "$@"; }
for r in 1 2 3 4 5 6 7 8; do
  for i in $(seq 1 20); do
    o=$(lm --write | tail -1)
    [[ "$o" == *" 0 entries rewound"* ]] && break
  done
  node "$H/lockhoist.cjs" --write | tail -1
  bash "$H/../gesso-hop.sh" install > /dev/null 2>&1
  o=$(lm | tail -1); h=$(node "$H/lockhoist.cjs" | tail -1)
  echo "round $r: $o / $h"
  if [[ "$o" == *" 0 entries rewound"* && "$h" == *" 0 hoisted" ]]; then
    lm > "$LOGS/lockfix-report.txt"; echo "lockfix: stable (report: $LOGS/lockfix-report.txt)"; exit 0
  fi
done
echo "lockfix: did not converge"; exit 1
