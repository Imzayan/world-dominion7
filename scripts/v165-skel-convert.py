#!/usr/bin/env python3
# V165: convert the 16 "در حال دریافت…" text-loading spots to .wd-skel skeletons.
# Each replacement asserts EXACTLY ONE occurrence — any drift aborts the whole run untouched.
import io, sys
p = 'public/game/index.html'
s = io.open(p, encoding='utf-8').read()

reps = [
    # (old, new, label)
    ('<div style="font-size:9px;color:#8fb4d4">در حال دریافت...</div>',
     '<div style="display:flex;align-items:center;gap:6px;font-size:9px;color:#8fb4d4">در حال دریافت <span class="wd-skel" style="width:70px"></span></div>',
     'wd105 fath-nameh header'),
    ("const ol=el('div','🟢 '+(typeof onl==='number'?faNum(onl)+' بازیکن آنلاین همین حالا':'در حال دریافت آنلاین‌ها…'),'lobby-item-sub');\n      ol.id='wdonl-'+k;r.append(ol);",
     "const ol=el('div','','lobby-item-sub');ol.append('🟢 '+(typeof onl==='number'?faNum(onl)+' بازیکن آنلاین همین حالا':''));\n      if(typeof onl!=='number')ol.append(window.wdSkel('64px'));\n      ol.id='wdonl-'+k;r.append(ol);",
     'lobby online #1 (6-space)'),
    ("const ol=el('div','🟢 '+(typeof onl==='number'?faNum(onl)+' بازیکن آنلاین همین حالا':'در حال دریافت آنلاین‌ها…'),'lobby-item-sub');\n    ol.id='wdonl-'+k;r.append(ol); /* V144",
     "const ol=el('div','','lobby-item-sub');ol.append('🟢 '+(typeof onl==='number'?faNum(onl)+' بازیکن آنلاین همین حالا':''));\n    if(typeof onl!=='number')ol.append(window.wdSkel('64px'));\n    ol.id='wdonl-'+k;r.append(ol); /* V144",
     'lobby online #2 (4-space)'),
    ("if(!fresh){ol.append(el('div','در حال دریافت آنلاین‌ها…','sites-sub'));try{wdPresenceBeat(true)}catch(e){}}",
     "if(!fresh){const _sl=el('div','','sites-sub');_sl.append(window.wdSkel('64px'));ol.append(_sl);try{wdPresenceBeat(true)}catch(e){}}",
     'lobby online stale refresh'),
    ("const pl=document.createElement('div');pl.id='srv-res';pl.append(el('div','در حال دریافت…','sites-sub'));b.append(pl);",
     "const pl=document.createElement('div');pl.id='srv-res';const _sl2=el('div','','sites-sub');_sl2.append(window.wdSkel('110px'));pl.append(_sl2);b.append(pl);",
     'srv-res placeholder'),
    ("const load=mk('div','⏳ در حال دریافت…','lr-row');box.append(load);",
     "const load=mk('div','','lr-row');load.append(window.wdSkel('96px'));box.append(load);",
     'ranking rows placeholder'),
    ("b.appendChild(h('div','⏳ در حال دریافت اطلاعات بازیکنان...','sites-info'));",
     "const _si=h('div','','sites-info');_si.append('اطلاعات بازیکنان ');_si.append(window.wdSkel('90px'));b.appendChild(_si);",
     'sites-info players'),
    ('<div class="s" id="wd28-rk-sub">در حال دریافت…</div>',
     '<div class="s" id="wd28-rk-sub"><span class="wd-skel" style="width:72px"></span></div>',
     'wd28 rank sub'),
    ("list.textContent='';var ld=D.createElement('div');ld.style.cssText='font-size:10.5px;color:#8fb0d6;padding:6px';ld.textContent='⏳ در حال دریافت…';list.append(ld);",
     "list.textContent='';var ld=D.createElement('div');ld.style.cssText='display:flex;align-items:center;gap:6px;font-size:10.5px;color:#8fb0d6;padding:6px';ld.append(window.wdSkel('110px'));list.append(ld);",
     'wd28 list loading'),
    ("if(!e){b.innerHTML='<div class=\"wd34-card\"><div class=\"wd34-empty\">در حال دریافت وضعیت انتخابات…</div></div>';return}",
     "if(!e){b.innerHTML='<div class=\"wd34-card\"><div class=\"wd34-empty\">وضعیت انتخابات <span class=\"wd-skel\" style=\"width:80px\"></span></div></div>';return}",
     'wd34 election state'),
    ("if(!m){b.innerHTML='<div class=\"wd34-card\"><div class=\"wd34-empty\">در حال دریافت…</div></div>';return}",
     "if(!m){b.innerHTML='<div class=\"wd34-card\"><div class=\"wd34-empty\"><span class=\"wd-skel\" style=\"width:110px\"></span></div></div>';return}",
     'wd34 map fallback'),
    ("if(!st){c.innerHTML='<div class=\"t\">🔥 استریک روزانه<small>در حال دریافت…</small></div>';return}",
     "if(!st){c.innerHTML='<div class=\"t\">🔥 استریک روزانه<small><span class=\"wd-skel\" style=\"width:64px\"></span></small></div>';return}",
     'streak card loading'),
    ("<div class=\"t\">'+CAT35[cat].fa+'</div><div class=\"s\">در حال دریافت…</div></div>';",
     "<div class=\"t\">'+CAT35[cat].fa+'</div><div class=\"s\"><span class=\"wd-skel\" style=\"width:72px\"></span></div></div>';",
     'wd35 category head'),
    ('<div class="wd53-ph" id="wd53-olyph">⏳ در حال دریافت وضعیت از سرور…</div>',
     '<div class="wd53-ph" id="wd53-olyph">وضعیت از سرور <span class="wd-skel" style="width:90px"></span></div>',
     'wd53 olympic status'),
    ("p.style.display='block';p.innerHTML='⏳ در حال دریافت از سرور…';",
     "p.style.display='block';p.innerHTML='<span class=\"wd-skel\" style=\"width:120px\"></span>';",
     'p19310 server loading'),
]

ok = 0
for old, new, label in reps:
    n = s.count(old)
    if n != 1:
        print('ABORT — pattern not unique (count=%d): %s [%s]' % (n, label, old[:60]))
        sys.exit(1)
    s = s.replace(old, new)
    ok += 1
    print('OK  %s' % label)

io.open(p, 'w', encoding='utf-8').write(s)
print('\n%d/%d replacements applied' % (ok, len(reps)))
