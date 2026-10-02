// storycmp.cjs: canonicalise CSF2 and CSF3 story files and compare
// old (f712137) vs new (working tree) vs main (667a195).
// Usage: node storycmp.cjs <file-list> > out.json
const fs = require('fs');
const { execFileSync } = require('child_process');
const R = '/Users/btschu/Development/slac-gesso-rebuild';
const ts = require(R + '/node_modules/typescript');

const show = (ref, p) => {
  try {
    return execFileSync('git', ['-C', R, 'show', `${ref}:${p}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { return null; }
};
const readNew = p => { try { return fs.readFileSync(`${R}/${p}`, 'utf8'); } catch { return null; } };

function stripComments(src) {
  // Use the TS scanner to drop comments but keep tokens.
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.JSX, src);
  let out = '';
  let t;
  while ((t = scanner.scan()) !== ts.SyntaxKind.EndOfFileToken) {
    out += scanner.getTokenText() + ' ';
  }
  return out;
}
let CUR_SF = null;
function canon(node) {
  // AST-level canonicalisation: unwrap parens, X.render(...) -> X(...),
  // X.bind({}) -> X, f({...args}) -> f(args).
  const f = ctx => {
    const visit = n => {
      n = ts.visitEachChild(n, visit, ctx);
      if (ts.isParenthesizedExpression(n)) return n.expression;
      if (ts.isCallExpression(n)) {
        const e = n.expression;
        if (ts.isPropertyAccessExpression(e) && e.name.text === 'bind' && n.arguments.length === 1 &&
            ts.isObjectLiteralExpression(n.arguments[0]) && n.arguments[0].properties.length === 0) return e.expression;
        if (ts.isPropertyAccessExpression(e) && e.name.text === 'render' && ts.isIdentifier(e.expression)) {
          n = ctx.factory.updateCallExpression(n, e.expression, n.typeArguments, n.arguments);
        }
        if (n.arguments.length === 1 && ts.isObjectLiteralExpression(n.arguments[0]) && n.arguments[0].properties.length === 1 &&
            ts.isSpreadAssignment(n.arguments[0].properties[0]) && ts.isIdentifier(n.arguments[0].properties[0].expression)) {
          n = ctx.factory.updateCallExpression(n, n.expression, n.typeArguments, [n.arguments[0].properties[0].expression]);
        }
      }
      return n;
    };
    return visit;
  };
  const r = ts.transform(node, [f]);
  const printer = ts.createPrinter({ removeComments: true });
  const out = printer.printNode(ts.EmitHint.Unspecified, r.transformed[0], CUR_SF);
  r.dispose();
  return out;
}
function norm(text, node) {
  let s = node ? canon(node) : text;
  s = stripComments(s).replace(/\s+/g, '');
  s = s.replace(/,([}\])])/g, '$1');
  s = s.replace(/\(args\)=>/g, 'args=>');
  s = s.replace(/"/g, "'");
  return s;
}
function comments(text) {
  const out = [];
  const re = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  let m;
  while ((m = re.exec(text))) out.push(m[0].replace(/\s+/g, ' ').trim());
  return out;
}

function parse(src, file) {
  if (src == null) return null;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const res = { imports: [], exportList: [], defaultExport: null, decls: {}, props: {}, other: [], comments: comments(src) };
  CUR_SF = sf;
  const txt = n => n.getText(sf);
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) { res.imports.push(norm(txt(st))); continue; }
    if (ts.isExportAssignment(st)) { res.defaultExport = norm(txt(st.expression)); continue; }
    if (ts.isExportDeclaration(st)) {
      if (st.exportClause && ts.isNamedExports(st.exportClause)) {
        for (const e of st.exportClause.elements) res.exportList.push(e.name.text);
      } else res.other.push(norm(txt(st)));
      continue;
    }
    if (ts.isVariableStatement(st)) {
      const exported = st.modifiers && st.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) {
          res.decls[d.name.text] = d.initializer ? d.initializer : null;
          if (exported) res.exportList.push(d.name.text);
        } else res.other.push(norm(txt(st)));
      }
      continue;
    }
    if (ts.isExpressionStatement(st) && ts.isBinaryExpression(st.expression) &&
        st.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(st.expression.left) && ts.isIdentifier(st.expression.left.expression)) {
      const obj = st.expression.left.expression.text, key = st.expression.left.name.text;
      (res.props[obj] = res.props[obj] || {})[key] = norm(null, st.expression.right);
      continue;
    }
    res.other.push(norm(txt(st)));
  }
  // Canonical stories and helpers
  const stories = {}, helpers = {};
  const storyNames = new Set(res.exportList);
  for (const [name, init] of Object.entries(res.decls)) {
    const isCsf3Obj = init && ts.isObjectLiteralExpression(init) && init.properties.some(p => p.name && ['render','args'].includes(p.name.getText(sf)));
    const isCsf2Fn = init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init) || (ts.isCallExpression(init) && ts.isPropertyAccessExpression(init.expression) && init.expression.name.text === 'bind')) && res.props[name] && Object.keys(res.props[name]).some(k => ['args','storyName','parameters','argTypes','play','decorators'].includes(k));
    const isStory = name !== 'settings' && (storyNames.has(name) || isCsf3Obj || isCsf2Fn);
    let c;
    if (init && ts.isObjectLiteralExpression(init) && isStory && name !== res.defaultExport) {
      // CSF3 object story
      c = { form: 'CSF3', render: null, props: {} };
      for (const p of init.properties) {
        if (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p) || ts.isMethodDeclaration(p)) {
          let k = p.name.getText(sf);
          const v = ts.isPropertyAssignment(p) ? norm(null, p.initializer) : ts.isShorthandPropertyAssignment(p) ? k : norm(txt(p));
          if (k === 'render') c.render = v; else { if (k === 'name') k = 'storyName'; c.props[k] = v; }
        } else if (ts.isSpreadAssignment(p)) {
          c.props['...' + norm(null, p.expression)] = true;
        }
      }
      Object.assign(c.props, res.props[name] || {});
      stories[name] = c;
    } else if (isStory && name !== res.defaultExport) {
      c = { form: 'CSF2', render: init ? norm(null, init) : null, props: { ...(res.props[name] || {}) } };
      stories[name] = c;
    } else {
      helpers[name] = { init: init ? norm(null, init) : null, props: res.props[name] || {} };
    }
  }
  return { imports: res.imports, exportList: res.exportList, defaultExport: res.defaultExport, stories, helpers, other: res.other, comments: res.comments };
}

function cmpObj(a, b) {
  const diffs = [];
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const x = JSON.stringify(a ? a[k] : undefined), y = JSON.stringify(b ? b[k] : undefined);
    if (x !== y) diffs.push({ key: k, old: a ? a[k] : undefined, new: b ? b[k] : undefined });
  }
  return diffs;
}

const files = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);
const out = {};
for (const p of files) {
  const o = parse(show('f712137', p), p), n = parse(readNew(p), p), m = parse(show('667a195', p), p);
  const r = { present: { old: !!o, new: !!n, main: !!m } };
  if (o && n) {
    const oForms = [...new Set(Object.values(o.stories).map(s => s.form))];
    const nForms = [...new Set(Object.values(n.stories).map(s => s.form))];
    r.forms = { old: oForms, new: nForms };
    r.importsOnlyOld = o.imports.filter(i => !n.imports.includes(i));
    r.importsOnlyNew = n.imports.filter(i => !o.imports.includes(i));
    r.exportListSame = JSON.stringify([...o.exportList].sort()) === JSON.stringify([...n.exportList].sort());
    if (!r.exportListSame) r.exportList = { old: o.exportList, new: n.exportList };
    r.defaultSame = o.defaultExport === n.defaultExport;
    r.storyDiffs = {};
    for (const s of new Set([...Object.keys(o.stories), ...Object.keys(n.stories)])) {
      const a = o.stories[s], b = n.stories[s];
      if (!a || !b) { r.storyDiffs[s] = { onlyIn: a ? 'old' : 'new' }; continue; }
      const d = [];
      if (a.render !== b.render) d.push({ key: 'render', old: a.render, new: b.render });
      d.push(...cmpObj(a.props, b.props));
      if (d.length) r.storyDiffs[s] = d;
    }
    r.helperDiffs = cmpObj(o.helpers, n.helpers);
    r.otherOnlyOld = o.other.filter(x => !n.other.includes(x));
    r.otherOnlyNew = n.other.filter(x => !o.other.includes(x));
    r.commentsOnlyOld = o.comments.filter(x => !n.comments.includes(x));
    r.commentsOnlyNew = n.comments.filter(x => !o.comments.includes(x));
  }
  if (m && n) {
    // new vs main: raw text diff summary
    r.newVsMainImportsAdded = n.imports.filter(i => !m.imports.includes(i));
    r.newVsMainImportsRemoved = m.imports.filter(i => !n.imports.includes(i));
    r.newVsMainExportListSame = JSON.stringify(m.exportList) === JSON.stringify(n.exportList);
    const sd = {};
    for (const s of new Set([...Object.keys(m.stories), ...Object.keys(n.stories)])) {
      const a = m.stories[s], b = n.stories[s];
      if (!a || !b) { sd[s] = { onlyIn: a ? 'main' : 'new' }; continue; }
      const d = [];
      if (a.render !== b.render) d.push({ key: 'render' });
      d.push(...cmpObj(a.props, b.props).map(x => ({ key: x.key })));
      if (d.length) sd[s] = d;
    }
    r.newVsMainStoryDiffs = sd;
    r.newVsMainHelperDiffs = cmpObj(m.helpers, n.helpers).map(x => x.key);
    r.newVsMainOther = { onlyMain: m.other.filter(x => !n.other.includes(x)), onlyNew: n.other.filter(x => !m.other.includes(x)) };
  }
  out[p] = r;
}
console.log(JSON.stringify(out, null, 1));
