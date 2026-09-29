#!/usr/bin/env python3
"""spritecmp.py <old-sprite.svg> <new-sprite.svg> <out.html>

Writes a page that rasterises every <symbol> of both sprites at 512x512 on a
canvas and counts differing pixels (alpha) per symbol. Serve it from
localhost (python3 -m http.server --bind 127.0.0.1) and read the <pre id=out>
JSON in a browser (the built-in browser pane can run it). Used at 5.3.2 s4
(svgo 3 path rewriting). Symbols are matched by id; viewBox and the symbol's
own fill come from each sprite.
"""
import sys, re, json
a, b, out = sys.argv[1:]
def syms(p):
    s = open(p).read()
    return {m.group(2): (m.group(1), m.group(3)) for m in re.finditer(r'<symbol\b([^>]*)\bid="([^"]+)"[^>]*>(.*?)</symbol>', s, re.S)}
A, B = syms(a), syms(b)
def standalone(attrs, body):
    vb = re.search(r'viewBox="([^"]+)"', attrs).group(1)
    fill = re.search(r'fill="([^"]+)"', attrs)
    f = f' fill="{fill.group(1)}"' if fill else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="{vb}" color="#000"{f}>{body}</svg>'
data = {k: [standalone(*A[k]), standalone(*B[k])] for k in A if k in B}
missing = sorted(set(A) ^ set(B))
html = '''<!doctype html><meta charset="utf-8"><title>sprite compare</title><body><pre id="out">running</pre><script>
const data=%s, missing=%s;
async function draw(svg){const img=new Image();img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);await img.decode();const c=document.createElement("canvas");c.width=512;c.height=512;const x=c.getContext("2d");x.drawImage(img,0,0);return x.getImageData(0,0,512,512).data;}
(async()=>{const res=[];let worst=0;for(const [k,[o,n]] of Object.entries(data)){const A=await draw(o),B=await draw(n);let diff=0,maxd=0,cover=0;for(let i=3;i<A.length;i+=4){if(A[i]>0)cover++;const d=Math.abs(A[i]-B[i]);if(d>0)diff++;if(d>maxd)maxd=d;}res.push({k,cover,diff,maxd,pct:(100*diff/(512*512)).toFixed(4)});if(diff/(512*512)>worst)worst=diff/(512*512);}
document.getElementById("out").textContent=JSON.stringify({symbols:res.length,missing,worstPct:(100*worst).toFixed(4),identical:res.filter(r=>!r.diff).length,res},null,1);document.title="done";})();
</script>''' % (json.dumps(data), json.dumps(missing))
open(out, 'w').write(html)
print(f'{out}: {len(data)} symbols; only in one sprite: {missing or "none"}')
