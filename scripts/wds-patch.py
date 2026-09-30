#!/usr/bin/env python3
# WDS V1 patcher — applies SOCIAL V1 client blocks + 2 small server fixes, idempotent, abort-on-anchor-miss
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IH = os.path.join(ROOT, 'public', 'game', 'index.html')
RT = os.path.join(ROOT, 'src', 'app', 'api', 'rpc', '[fn]', 'route.ts')

def rd(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()
def wr(p, s):
    with open(p, 'w', encoding='utf-8') as f: f.write(s)

def replace_once(s, old, new, tag, allow_missing=False):
    n = s.count(old)
    if n == 0 and allow_missing:
        print(f'  ~ {tag}: anchor missing (skip)'); return s
    if n != 1:
        print(f'ABORT {tag}: anchor count={n}'); sys.exit(1)
    print(f'  + {tag}')
    return s.replace(old, new, 1)

html = rd(IH)

if 'id="wds-v1"' in html:
    print('WDS V1 already present — skipping html insert')
else:
    css = rd(os.path.join(ROOT, 'scripts', 'wds-css.txt')).rstrip('\n')
    sprite = rd(os.path.join(ROOT, 'scripts', 'wds-sprite.txt')).rstrip('\n')
    modA = rd(os.path.join(ROOT, 'scripts', 'wds-module-a.txt')).rstrip('\n')
    modB = rd(os.path.join(ROOT, 'scripts', 'wds-module-b.txt')).rstrip('\n')
    block = '\n' + css + '\n' + sprite + '\n' + modA + '\n' + modB + '\n'
    anchor = '</body>\n</html>'
    if html.count(anchor) != 1:
        print('ABORT html-end: count=%d' % html.count(anchor)); sys.exit(1)
    html = html.replace(anchor, block + anchor, 1)
    print('  + html blocks inserted (css+sprite+module)')

# 2) renderSrvChip upgrade — WDS label with real online count
html = replace_once(html,
    "function renderSrvChip(){const c=S$('hud-srv'),t=S$('hud-t2');if(c)c.textContent=MP_OK===true?'🖥️ '+SRV+' ('+taken(SRV)+'/'+SRV_CAP+')':'🖥️ —';",
    "function renderSrvChip(){const c=S$('hud-srv'),t=S$('hud-t2');if(c)c.textContent=(window.WDS&&window.WDS.srvLabel)?window.WDS.srvLabel():(MP_OK===true?'🖥️ '+SRV+' ('+taken(SRV)+'/'+SRV_CAP+')':'🖥️ —');",
    'renderSrvChip')

# 3) hud-srv chip opens the new WDS server selector
html = replace_once(html,
    "const srv=el('div','🖥️ —','hchip',async()=>{await loadStats();renderSrv();openModal('m-srv')});srv.id='hud-srv';",
    "const srv=el('div','🖥️ —','hchip',async()=>{await loadStats();if(window.WDS){window.WDS.servers()}else{renderSrv();openModal('m-srv')}});srv.id='hud-srv';",
    'hud-srv-chip')

# 4) world chat row upgrade — avatar + presence dot + clickable nick → profile
old_row = ("rows.forEach(x=>{const d=document.createElement('div');d.className='wdc-row'+(x.user_id===ACC.uid?' me':'');const tm=new Date(x.created_at);"
           "d.innerHTML='<b>'+esc(x.nick)+'</b>: '+esc(x.message)+'<div class=\"wdc-time\">'+tm.toLocaleString('fa-IR')+'</div>';list.appendChild(d)});list.scrollTop=list.scrollHeight;")
new_row = ("rows.forEach(x=>{const d=document.createElement('div');d.className='wdc-row'+(x.user_id===ACC.uid?' me':'');const tm=new Date(x.created_at);"
           "const W=window.WDS;const avh=W?W.av(x.nick,'wds-av-s'):'';const dth=W?W.dot(x.state):'';"
           "d.innerHTML=avh+dth+'<div class=\"wdc-main\"><b class=\"wdc-nick\"'+(W?' style=\"cursor:pointer\"':'')+'>'+esc(x.nick)+'</b>: '+esc(x.message)+'<div class=\"wdc-time\">'+tm.toLocaleString('fa-IR')+'</div></div>';"
           "const nb=d.querySelector('.wdc-nick');if(nb&&W&&x.user_id!==ACC.uid)nb.onclick=()=>W.profile(x.user_id);"
           "list.appendChild(d)});list.scrollTop=list.scrollHeight;")
html = replace_once(html, old_row, new_row, 'chat-row')

wr(IH, html)

# 5) route.ts — profile_get: resolve by nick too + expose internal uid handle for actions
rt = rd(RT)
rt = replace_once(rt,
    "      case 'profile_get': {\n        const uidG = String(args.p_uid || user.id)\n",
    "      case 'profile_get': {\n        /* SOCIAL V1: با uid یا nick — نقشه فقط nick بازیکن دیگر را دارد */\n"
    "        let uidG = String(args.p_uid || '')\n"
    "        if (!uidG && args.p_nick) { const byN = await db.user.findFirst({ where: { nickLower: String(args.p_nick).toLowerCase() }, select: { id: true } }); uidG = byN?.id || '' }\n"
    "        if (!uidG) uidG = user.id\n",
    'profile-get-nick')
rt = replace_once(rt,
    "            is_me: isMe, nick: tu.nick, joined: tu.createdAt.toISOString(), server,",
    "            is_me: isMe, uid: tu.id, nick: tu.nick, joined: tu.createdAt.toISOString(), server,",
    'profile-uid-handle')
wr(RT, rt)

print('WDS patch OK')
