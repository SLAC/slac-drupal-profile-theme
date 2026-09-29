// Derives a `title | story name` inventory from *.stories.jsx and *.mdx source.
// Works before Storybook 7 writes index.json, and cross-checks it after.
//
// - Comments are stripped first, so commented-out exports (13 files at 5.0.9
//   hide their stories this way) are not counted as stories.
// - Rows carry no file path, so the .stories.mdx -> .mdx renames at 5.3.2
//   stage 4 do not make the inventory "differ".
// - CSF2 (`Name.storyName = 'x'`) and CSF3 (`{ name: 'x' }`) names are read;
//   otherwise the export name is used, as Storybook 6.5 displayed it.
//
// Usage (from the theme root): node .claude/gesso-harness/story-inventory.mjs
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.stories\.jsx$|\.mdx$/.test(e)) out.push(p);
  }
  return out;
}

// Good enough for story files: no regex literals containing // or /*.
const stripComments = src => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

const rows = [];
for (const file of walk('source').sort()) {
  const src = stripComments(readFileSync(file, 'utf8'));
  const title = (src.match(/title:\s*['"`]([^'"`]+)['"`]/) ||
                 src.match(/<Meta\s+title=["']([^"']+)["']/) || [])[1] ?? '(no title)';
  if (/\.mdx$/.test(file)) { rows.push(`${title} | (docs)`); continue; }
  const exp = src.match(/export\s*\{([^}]+)\}/g) || [];
  const names = exp.flatMap(b =>
    b.replace(/export\s*\{|\}/g, '').split(',').map(s => s.trim().split(/\s+as\s+/).pop()).filter(Boolean)
  ).filter(n => n !== 'default' && n !== 'settings');
  for (const n of names) {
    const csf2 = new RegExp(`^${n}\\.storyName\\s*=\\s*['"\`]([^'"\`]+)`, 'm').exec(src);
    const csf3 = new RegExp(`const\\s+${n}\\s*=\\s*\\{[\\s\\S]*?\\bname:\\s*['"\`]([^'"\`]+)`, 'm').exec(src);
    rows.push(`${title} | ${(csf2 || csf3 || [, n])[1]}`);
  }
}
console.log(rows.sort().join('\n'));
console.error(`total: ${rows.length}`);
