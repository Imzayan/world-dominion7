#!/usr/bin/env node
/* Syntax-check every inline <script> block of public/game/index.html with vm.Script */
const fs = require('fs');
const vm = require('vm');
const path = process.argv[2] || 'public/game/index.html';
const html = fs.readFileSync(path, 'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0, bad = 0, skipped = 0;
while ((m = re.exec(html))) {
  i++;
  const src = m[1];
  if (!src.trim()) { skipped++; continue; }
  try {
    new vm.Script(src, { filename: `${path}#block-${i}` });
  } catch (e) {
    bad++;
    const line = (e.stack || '').split('\n')[0];
    console.log(`❌ block ${i}: ${e.message}`);
    const ln = /:(\d+)$/.exec((e.stack || '').split('\n')[1] || '');
    if (ln) {
      const n = parseInt(ln[1], 10);
      console.log('   context:', src.split('\n').slice(Math.max(0, n - 3), n + 2).map((l, k) => `${n - 2 + k}: ${l}`).join('\n   '));
    }
  }
}
console.log(`checked=${i} empty=${skipped} errors=${bad}`);
process.exit(bad ? 1 : 0);
