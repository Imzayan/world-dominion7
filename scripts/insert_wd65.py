#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V65 inserter + surgical edits — idempotent (checks markers before each edit)."""
import io, sys, os

ROOT = '/home/z/my-project'
HTML = os.path.join(ROOT, 'public/game/index.html')
S = os.path.join(ROOT, 'scripts')

def rd(p):
    with io.open(p, 'r', encoding='utf-8') as f: return f.read()
def wr(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

html = rd(HTML)
log = []

# ---------- 1) module insert (idempotent: replace existing block) ----------
import re as _re
if 'id="wd65-living-world"' in html:
    html = _re.sub(r'<style id="wd-v65-css">[\s\S]*?</style>\s*<script id="wd65-living-world">[\s\S]*?</script>\n', '', html, count=1)
    log.append('REPLACE old wd65 module')
if 'id="wd65-living-world"' not in html:
    css = rd(os.path.join(S, 'wd65_a.css'))
    js = rd(os.path.join(S, 'wd65_b.js')) + '\n' + rd(os.path.join(S, 'wd65_c.js')) + '\n' + rd(os.path.join(S, 'wd65_d.js'))
    block = ('<style id="wd-v65-css">\n' + css + '\n   </style>\n'
             '   <script id="wd65-living-world">\n' + js + '\n   </script>\n')
    anchor = '</body>\n</html>'
    assert anchor in html, 'anchor </body> missing'
    html = html.replace(anchor, block + '</body>\n</html>', 1)
    log.append('INSERT wd65 module (%d chars)' % len(block))
else:
    log.append('SKIP insert (marker exists)')

# ---------- 2) calculateTotalAttack: atkMult hook (additive) ----------
old = """  total += u.count * u.attack * mult;
  });
  return Math.round(total);
}"""
new = """  total += u.count * u.attack * mult;
  });
  try{if(WD_ATTACK_HOOKS.atkMult)WD_ATTACK_HOOKS.atkMult.forEach(f=>{total=Math.round(total*f())})}catch(e){} /* V65: ضریب تمدن/فرمانده/تاکتیک */
  return Math.round(total);
}"""
if 'V65: ضریب تمدن' not in html:
    assert old in html, 'calculateTotalAttack anchor missing'
    html = html.replace(old, new, 1)
    log.append('EDIT calculateTotalAttack +atkMult hook')
else:
    log.append('SKIP atkMult (exists)')

# ---------- 3) pvp call sites: p_tactic ----------
o1 = """        const result=await sb.rpc('pvp_attack',{
          p_server:SRV,p_country:country,p_attack:power
        });"""
n1 = """        const result=await sb.rpc('pvp_attack',{
          p_server:SRV,p_country:country,p_attack:power,p_tactic:(window.WD65TACTIC||null)
        });"""
if 'p_tactic:(window.WD65TACTIC||null)' not in html:
    assert o1 in html, 'pvp site 1 missing'
    html = html.replace(o1, n1, 1)
    log.append('EDIT pvp site 1 +p_tactic')
else:
    log.append('SKIP pvp site 1')
o2 = """        sb.rpc('pvp_attack',{
        p_server:SRV,p_country:country,p_attack:Math.round(calculateTotalAttack())
      }),"""
n2 = """        sb.rpc('pvp_attack',{
        p_server:SRV,p_country:country,p_attack:Math.round(calculateTotalAttack()),p_tactic:(window.WD65TACTIC||null)
      }),"""
if html.count('p_tactic:(window.WD65TACTIC||null)') < 2:
    assert o2 in html, 'pvp site 2 missing'
    html = html.replace(o2, n2, 1)
    log.append('EDIT pvp site 2 +p_tactic')
else:
    log.append('SKIP pvp site 2')

# ---------- 4) drawer news mapping: +2 branches ----------
o4 = """        if(a==='olympic_close') return `🏁 اختتامیه‌ی المپیک — قهرمان جهان: ${x.target_nick||'—'}`;
        if(a==='trade') return"""
n4 = """        if(a==='olympic_close') return `🏁 اختتامیه‌ی المپیک — قهرمان جهان: ${x.target_nick||'—'}`;
        if(a==='empire_fall') return `📰 امپراتوری ${x.actor_nick||'—'} سقوط کرد — فاتح: ${x.target_nick||'—'}`;
        if(a==='hof_new') return `🏛️ ${x.actor_nick||'—'} صاحب عنوان ${x.country||'—'} در تالار افتخارات شد`;
        if(a==='trade') return"""
if "a==='empire_fall') return `📰" not in html:
    assert o4 in html, 'drawer mapping anchor missing'
    html = html.replace(o4, n4, 1)
    log.append('EDIT drawer news +empire_fall/hof_new')
else:
    log.append('SKIP drawer news')

# ---------- 5) version bump ----------
o5 = 'window.__WD_V=64;'
if o5 in html:
    html = html.replace(o5, 'window.__WD_V=65;', 1)
    log.append('EDIT __WD_V 64→65')
else:
    log.append('SKIP __WD_V (already 65 or missing)')

wr(HTML, html)
for l in log: print(l)

# ---------- 6) v.txt ----------
vt = os.path.join(ROOT, 'public/game/v.txt')
cur = rd(vt).strip()
if cur != '65':
    wr(vt, '65')
    print('EDIT v.txt %s→65' % cur)
else:
    print('SKIP v.txt')
print('DONE')
