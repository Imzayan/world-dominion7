// Validate every inline <script> block of the game HTML with node --check
// Usage: node scripts/check-html-js.js <path-to-html>
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const file = process.argv[2];
if (!file) { console.error('usage: node check-html-js.js <html>'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');

const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m, i = 0, bad = 0, checked = 0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wdjs-'));
while ((m = re.exec(html)) !== null) {
  const attrs = m[1] || '';
  const body = m[2] || '';
  if (!body.trim()) continue;
  if (/\bsrc\s*=/i.test(attrs)) continue; // external script, skip
  i++;
  const p = path.join(tmp, `blk${i}.js`);
  fs.writeFileSync(p, body);
  checked++;
  try {
    execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' });
  } catch (e) {
    bad++;
    const err = String(e.stderr || e.message || '').split('\n').slice(0, 6).join('\n');
    console.error(`BLOCK ${i} SYNTAX ERROR:\n${err}\n`);
  }
}
console.log(`checked=${checked} errors=${bad}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(bad ? 1 : 0);
