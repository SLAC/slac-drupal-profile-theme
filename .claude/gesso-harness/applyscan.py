#!/usr/bin/env python3
"""applyscan.py [root]: list Twig includes that sit inside {% apply %} blocks.

@forumone/twig-loader bundles a template's includes by walking its tags and
does not look inside {% apply %}, so such an include is never bundled and
Twig.js in Storybook fails with "Unable to find template file ... fs.statSync
is not a function" (post-upgrade item 5). Comments are ignored. Exit 1 on a hit.
"""
import glob, re, sys

root = sys.argv[1] if len(sys.argv) > 1 else '.'
hits, n = [], 0
for f in sorted(glob.glob(f'{root}/source/**/*.twig', recursive=True)):
    n += 1
    s = re.sub(r'\{#.*?#\}', '', open(f).read(), flags=re.S)
    for m in re.finditer(r'\{%-?\s*apply\b.*?%\}(.*?)\{%-?\s*endapply\s*-?%\}', s, flags=re.S):
        body = m.group(1)
        for t in re.finditer(r'\{%-?\s*(include|embed|extends|import|from)\b|\b(include|source)\(', body):
            hits.append(f'{f[len(root) + 1:]}: {t.group(1) or t.group(2)} inside apply')
        if re.search(r'\{%-?\s*apply\b', body):
            hits.append(f'{f[len(root) + 1:]}: nested apply (not scanned)')
print(f'applyscan: {n} templates, {len(hits)} include(s) inside apply')
for h in hits:
    print('  ' + h)
sys.exit(1 if hits else 0)
