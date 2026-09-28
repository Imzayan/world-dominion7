/* diff every model+field between the two prisma schemas */
import fs from 'fs';
const parse = (p) => {
  const src = fs.readFileSync(p, 'utf8');
  const out = {};
  for (const m of src.matchAll(/model (\w+) \{([^}]*)\}/g)) {
    const fields = m[2].split('\n').map(l => l.trim().replace(/\/\*[\s\S]*?\*\//g, '').trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('@@')).map(l => l.split(/\s+/)[0]);
    out[m[1]] = fields;
  }
  return out;
};
const a = parse('prisma/schema.prisma');
const b = parse('prisma/schema.postgres.prisma');
const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
let bad = 0;
for (const k of keys) {
  if (!a[k]) { console.log('MISSING in sqlite :', k); bad++; continue; }
  if (!b[k]) { console.log('MISSING in pg     :', k); bad++; continue; }
  const sa = new Set(a[k]), sb = new Set(b[k]);
  const onlyA = a[k].filter(f => !sb.has(f));
  const onlyB = b[k].filter(f => !sa.has(f));
  if (onlyA.length || onlyB.length) { console.log('DIFF', k, '| pg-only:', onlyB, '| sqlite-only:', onlyA); bad++; }
}
console.log(bad ? 'SCHEMAS DIVERGED: ' + bad + ' issues' : 'schemas identical');
