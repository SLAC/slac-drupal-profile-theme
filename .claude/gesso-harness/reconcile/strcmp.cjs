// strcmp.cjs <file-list>: per story file, the multiset of string, template, JSX-text,
// numeric and identifier tokens in f712137 vs the working tree; prints files whose
// multisets differ beyond the CSF2/CSF3 conversion's own identifiers (reconcile vs f712137).
const fs=require('fs');const {execFileSync}=require('child_process');
const R='/Users/btschu/Development/slac-gesso-rebuild';const ts=require(R+'/node_modules/typescript');
const show=(ref,p)=>{try{return execFileSync('git',['-C',R,'show',`${ref}:${p}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch{return null}};
function lits(src,file){const sf=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);const out=[];
 const v=n=>{if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))out.push('S:'+n.text);else if(ts.isTemplateExpression(n))out.push('T:'+n.getText(sf).replace(/\s+/g,' '));else if(ts.isJsxText(n)&&n.text.trim())out.push('J:'+n.text.replace(/\s+/g,' ').trim());else if(ts.isNumericLiteral(n))out.push('N:'+n.text);else if(ts.isIdentifier(n))out.push('I:'+n.text);ts.forEachChild(n,v)};v(sf);return out}
const files=fs.readFileSync(process.argv[2],'utf8').split('\n').filter(Boolean);
for(const p of files){const o=show('f712137',p);let n=null;try{n=fs.readFileSync(R+'/'+p,'utf8')}catch{}
 if(!o||!n)continue;const a=lits(o,p),b=lits(n,p);
 const cnt=x=>x.reduce((m,k)=>(m[k]=(m[k]||0)+1,m),{});const A=cnt(a),B=cnt(b);
 const d=[];for(const k of new Set([...Object.keys(A),...Object.keys(B)])){if((A[k]||0)!==(B[k]||0))d.push(k+' old'+(A[k]||0)+' new'+(B[k]||0))}
 // ignore expected identifier deltas: render, storyName/name, args/argTypes/parameters (property names), bind
 const ign=/^I:(render|name|storyName|bind|args|argTypes|parameters|decorators|play)$/;
 const dd=d.filter(x=>!x.startsWith('I:'));
 if(dd.length)console.log(p+'\n  '+dd.join('\n  '));}
