// Extract every inline <script> block from public/game/index.html and syntax-check it
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('/home/z/my-project/public/game/index.html', 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0, fail = 0;
while ((m = re.exec(html)) !== null) {
  i++;
  const code = m[1];
  if (!code.trim()) continue;
  try {
    new vm.Script(code, { filename: `block-${i}` });
  } catch (e) {
    fail++;
    console.log(`❌ BLOCK ${i}: ${e.message}`);
    const lines = code.split('\n');
    const ln = (e.stack.match(/block-\d+:(\d+)/) || [])[1];
    if (ln) console.log('   near line', ln, ':', lines[ln - 1]);
  }
}
console.log(`checked ${i} script blocks, failures: ${fail}`);
