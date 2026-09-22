// Extract inline <script> blocks from the game HTML and syntax-check each with new Function()
const fs = require('fs');
const html = fs.readFileSync('/home/z/my-project/public/game/index.html', 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0, fails = 0;
while ((m = re.exec(html))) {
  i++;
  const code = m[1];
  if (!code.trim()) continue;
  try {
    new Function(code);
  } catch (e) {
    fails++;
    const line = html.slice(0, m.index).split('\n').length;
    console.log(`SCRIPT #${i} (html line ~${line}) SYNTAX FAIL: ${e.message}`);
  }
}
console.log(`checked ${i} inline scripts, ${fails} failures`);
