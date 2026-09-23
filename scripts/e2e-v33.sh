#!/bin/bash
# V33 one-shot E2E: three-phase Olympic lifecycle (reg -> live -> after) with OL_OFFSET time-shift
set -u
ROOT=/home/z/my-project
ST=$ROOT/.next/standalone
AB="agent-browser"
NICK="v33t$(date +%H%M%S)"
E(){ $AB eval "$1" 2>/dev/null | tr -d '"\n' | head -1; }
EDD=$(node -e "const A=Date.UTC(2026,0,1),L=30*864e5;console.log(Math.floor((Date.now()-A)/L)+1)")
OFF_REG=$(node -e "const A=Date.UTC(2026,0,1),L=30*864e5,R=15*864e5;const s=A+(Math.floor((Date.now()-A)/L))*L;console.log(Math.round((s+R+3600e3)-Date.now()))")
OFF_LIVE=$(node -e "const A=Date.UTC(2026,0,1),L=30*864e5,O=24*864e5;const s=A+(Math.floor((Date.now()-A)/L))*L;console.log(Math.round((s+O+7200e3)-Date.now()))")
OFF_AFTER=$(node -e "const A=Date.UTC(2026,0,1),L=30*864e5,C=29*864e5;const s=A+(Math.floor((Date.now()-A)/L))*L;console.log(Math.round((s+C+7200e3)-Date.now()))")
echo "NICK=$NICK EDITION=$EDD OFF_REG=$OFF_REG OFF_LIVE=$OFF_LIVE OFF_AFTER=$OFF_AFTER"

# clean olympic tables from any previous session's test data
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  await p.olympicEntry.deleteMany({});await p.olympicResult.deleteMany({});
  await p.olympicRecord.deleteMany({});await p.olympicArchive.deleteMany({});
  await p.olympicChampion.deleteMany({});
  console.log('olympic tables cleaned');
  await p.\$disconnect();
})().catch(e=>{console.log('CLEANERR',e.message);process.exit(1)})"

boot(){
  local OFF=$1
  for pid in $(ss -tlnp 2>/dev/null | grep ':3100' | grep -oP 'pid=\K[0-9]+' | sort -u); do kill -9 $pid 2>/dev/null; done
  fuser -k 3100/tcp 2>/dev/null
  sleep 1
  cp $ROOT/public/game/index.html $ST/public/game/index.html
  cd $ST
  PORT=3100 HOSTNAME=0.0.0.0 OL_OFFSET=$OFF node server.js > /tmp/v33server.log 2>&1 &
  local code=000
  for i in $(seq 1 30); do
    code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/api/db/server_stats 2>/dev/null)
    [ "$code" = "200" ] && break
    sleep 1
  done
  echo "  boot(off=$OFF) -> $code"
}

wait_ready(){ # wait until logged in + multiplayer ok (up to 30s)
  for i in $(seq 1 15); do
    local r=$($AB eval "(function(){try{return (ACC.ready&&MP_OK===true)?'1':'0'}catch(e){return '0'}})()" 2>/dev/null | tr -d '"')
    [ "$r" = "1" ] && { echo "ready_after=${i}x2s"; return 0; }
    sleep 2
  done
  echo "ready_TIMEOUT"; return 1
}

client_sync(){ # set client time offset to match server, reload
  $AB eval "try{localStorage.setItem('wd33toff','$1');location.reload();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
  sleep 9
}

echo "=========== PHASE A: registration window (2 of 3 quota — room for late-reg test) ==========="
boot $OFF_REG
$AB open http://localhost:3100/game/index.html >/dev/null 2>&1; sleep 9
# force clean session: any remembered cookie would auto-login and hijack the test user
$AB eval "(function(){try{if(typeof sb!=='undefined'&&sb&&sb.auth)sb.auth.signOut();localStorage.clear();setTimeout(function(){location.reload()},400);return 'out'}catch(e){return 'ERR'}})()" >/dev/null 2>&1
sleep 10
$AB eval "var n=document.getElementById('nick'),p=document.getElementById('pw'),p2=document.getElementById('pw2');
if(n){n.value='$NICK'};if(p){p.value='test123456'};if(p2){p2.value='test123456'};'filled'" >/dev/null 2>&1
$AB eval "(function(){try{var bs=document.querySelectorAll('#auth button');for(var i=0;i<bs.length;i++){if(bs[i].textContent.indexOf('ثبت‌نام و شروع')>-1){bs[i].click();return 'reg-clicked'}}return 'no-btn'}catch(e){return 'ERR'}})()" >/dev/null 2>&1
sleep 7
# if user exists (stale), fall back to login tab
$AB eval "(function(){try{if(!document.querySelector('#auth').classList.contains('active'))return 'in';var bs=document.querySelectorAll('#auth button');for(var i=0;i<bs.length;i++){if(bs[i].textContent.indexOf('ورود')>-1&&bs[i].className.indexOf('lobby-tab')>-1){bs[i].click();break}}return 'to-login'}catch(e){return 'ERR'}})()" >/dev/null 2>&1
sleep 1
$AB eval "var n=document.getElementById('nick'),p=document.getElementById('pw');if(n){n.value='$NICK'};if(p){p.value='test123456'};'filled'" >/dev/null 2>&1
$AB eval "(function(){try{document.querySelector('#auth .btn-green').click();return 'login-clicked'}catch(e){return 'ERR'}})()" >/dev/null 2>&1
sleep 6
wait_ready
echo "A_entered=$(E "(function(){try{return (ACC.ready&&MP_OK===true&&!document.querySelector('#auth').classList.contains('active'))?'1':'0'}catch(e){return 'ERR'}})()")"
node $ROOT/scripts/seed-v33.js $NICK
# adopt Niger as capital client-side (persists via saveNow → survives reloads and syncTerr)
$AB eval "(function(){try{myCountryName='Niger';conqueredCountries=new Set(['Niger']);occupationPct={};saveNow();syncTerr();return 'ok'}catch(e){return 'ERR:'+e.message}})()" >/dev/null 2>&1
sleep 4
echo "A_capital=$(E "(function(){try{return (myCountryName==='Niger'&&DBMINE.has('Niger'))?'1':'0'}catch(e){return 'ERR'}})()")"
client_sync $OFF_REG
echo "A_capital_kept=$(E "(function(){try{return (myCountryName==='Niger'&&!document.querySelector('#auth').classList.contains('active'))?'1':'0'}catch(e){return 'ERR'}})()")"
$AB eval "try{document.getElementById('hud-olympic').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 5
echo "A_hub_on=$(E "!!document.querySelector('#wd-games.on')")"
echo "A_phase_chip=$(E "(document.querySelector('.wg33-ph')?.textContent||'').slice(0,30)")"
echo "A_host=$(E "(document.querySelector('.wg33-host')?.textContent||'').slice(0,44)")"
echo "A_grid=$(E "document.querySelectorAll('#wg33-reggrid .wg33-disc').length")"
$AB eval "(function(){try{var ds=document.querySelectorAll('#wg33-reggrid .wg33-disc');ds[0].click();ds[1].click();return 'ok'}catch(e){return 'ERR'}})()" >/dev/null 2>&1
sleep 1
echo "A_selcount=$(E "document.getElementById('wg33-seln')?.textContent")"
$AB eval "try{document.getElementById('wg33-regbtn').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 4
echo "A_myreg=$(E "fetch('/api/rpc/olympic_games',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>JSON.stringify((j.data.my.reg||[]).sort()))")"
$AB screenshot $ROOT/download/v33-reg.png >/dev/null 2>&1
$AB press Escape >/dev/null 2>&1

echo "=========== PHASE B: games live (ALL 10 open + late registration) ==========="
boot $OFF_LIVE
client_sync $OFF_LIVE
sleep 2
echo "B_ceremony=$(E "!!document.querySelector('#wd33-cer.on')")"
$AB screenshot $ROOT/download/v33-opening.png >/dev/null 2>&1
$AB eval "try{document.querySelector('#wd33-cer .cskip').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 1
echo "B_cer_closed=$(E "!document.querySelector('#wd33-cer.on')")"
echo "B_strip=$(E "(document.getElementById('wd33-strip')?.textContent||'').slice(0,60)")"
echo "B_chip_glow=$(E "document.getElementById('hud-olympic')?.classList.contains('wg33-live')")"
$AB eval "try{document.getElementById('hud-olympic').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 4
echo "B_live_rows=$(E "document.querySelectorAll('#wg33-wrap [data-play]').length")"
echo "B_truce_line=$(E "(document.querySelector('#wg33-wrap')?.textContent||'').includes('آتش‌بس')")"
$AB screenshot $ROOT/download/v33-hub-live.png >/dev/null 2>&1
$AB eval "try{document.querySelector('[data-play=sprint]').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 2
echo "B_stage=$(E "!!document.querySelector('#wd33-stage.on')")"
$AB eval "try{document.getElementById('wg33-go').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 5
# synchronous tap burst — headless pages throttle setInterval/rAF-driven input loops
$AB eval "(function(){var t=document.querySelector('#wd33-stage .gm33-track');if(!t)return 'no-track';for(var i=0;i<60;i++){t.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}))}return 'tapped:'+document.getElementById('g33s').textContent})()" >/dev/null 2>&1
sleep 11
echo "B_result=$(E "(document.getElementById('wg33-sub')?.textContent||'').slice(0,80)")"
$AB screenshot $ROOT/download/v33-sprint.png >/dev/null 2>&1
$AB eval "try{document.querySelector('#wg33-x').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
echo "B_submit_arch=$(E "fetch('/api/rpc/olympic_submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_discipline:'archery',p_score:920})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
sleep 9
echo "B_submit_record=$(E "fetch('/api/rpc/olympic_submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_discipline:'archery',p_score:980})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
echo "B_submit_unreg_swim=$(E "fetch('/api/rpc/olympic_submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_discipline:'swim',p_score:500})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
echo "B_submit_unreg=$(E "fetch('/api/rpc/olympic_submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_discipline:'football',p_score:500})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
echo "B_late_reg=$(E "fetch('/api/rpc/olympic_register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_disciplines:['sprint','archery','swim']})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
sleep 9 # submit rate-limit window (8s) — a real player always clears it naturally
echo "B_submit_swim=$(E "fetch('/api/rpc/olympic_submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_discipline:'swim',p_score:760})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
echo "B_quota_full=$(E "fetch('/api/rpc/olympic_register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_disciplines:['sprint','archery','swim','football']})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
echo "B_live_table=$(E "fetch('/api/rpc/olympic_games',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>JSON.stringify(j.data.table))")"
echo "B_truce_atk=$(E "fetch('/api/rpc/pvp_attack',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_server:1,p_country:'Brazil',p_attack:9000})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
echo "B_truce_special=$(E "fetch('/api/rpc/use_special',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_item:'coup',p_country:'Brazil'})}).then(r=>r.json()).then(j=>JSON.stringify(j.data))")"
echo "B_status=$(E "fetch('/api/rpc/olympic_status',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>{var g=j.data.games;return g.phase+'/truce='+g.truce+'/day='+g.game_day})")"
$AB press Escape >/dev/null 2>&1

echo "=========== PHASE C: closing + legacy ==========="
boot $OFF_AFTER
client_sync $OFF_AFTER
sleep 3
echo "C_ceremony=$(E "!!document.querySelector('#wd33-cer.on')")"
$AB screenshot $ROOT/download/v33-closing.png >/dev/null 2>&1
$AB eval "try{document.querySelector('#wd33-cer .cskip').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
echo "C_champion=$(E "fetch('/api/rpc/olympic_status',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>JSON.stringify(j.data.champion))")"
echo "C_archive=$(E "fetch('/api/rpc/olympic_games',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>{var a=(j.data.archive||[]).filter(function(x){return x.edition===$EDD})[0]||{};return 'champ='+a.champion_country+' nick='+a.champion_nick+' podiums='+Object.keys(a.podiums||{}).length+' parts='+a.participants})")"
echo "C_table=$(E "fetch('/api/rpc/olympic_games',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>JSON.stringify(j.data.table))")"
echo "C_records=$(E "fetch('/api/rpc/olympic_games',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>JSON.stringify((j.data.records||[]).map(function(r){return r.discipline+':'+r.score+':'+r.nick})))")"
echo "C_career=$(E "fetch('/api/rpc/olympic_games',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>JSON.stringify(j.data.career&&j.data.career.$NICK))")"
$AB eval "try{document.getElementById('hud-olympic').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 4
echo "C_statue=$(E "!!document.querySelector('#wg33-wrap .wg33-statue')")"
echo "C_champbox=$(E "(document.querySelector('#wg33-wrap .wd32-crownline')?.textContent||'').slice(0,60)")"
echo "C_archbox=$(E "document.querySelectorAll('#wg33-wrap .wg33-arch').length")"
echo "C_after_phase=$(E "(document.querySelector('.wg33-ph')?.textContent||'').slice(0,30)")"
$AB screenshot $ROOT/download/v33-hub-after.png >/dev/null 2>&1
$AB press Escape >/dev/null 2>&1
echo "C_gflag=$(E "(function(){window.WD_OL_CHAMP={nick:'$NICK',country:'Niger',cycle:$EDD};try{window.WD33_GFLAG();return !!document.querySelector('.wd33-gflag')}catch(e){return 'ERR'}})()")"
echo "C_career_fn=$(E "typeof WD33_CAREER==='function'&&!!WD33_CAREER('$NICK')")"
# headless pages report document.hidden=true → the 30s news poller skips; call the sync manually
$AB eval "(function(){try{if(window.WD23&&window.WD23.news){window.WD23.news();return 'news-sync'}return 'no-fn'}catch(e){return 'ERR'}})()" >/dev/null 2>&1
sleep 4
echo "C_ticker=$(E "(window.WD_NEWS||[]).map(function(x){return (x&&x.text)||x}).join(' ').includes('المپیک')")"
echo "C_ticker_sample=$(E "((window.WD_NEWS||[])[0]||{}).text||''" | head -c 110)"

echo "--- DB proof ---"
NICK=$NICK node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
const nick=process.env.NICK;
(async()=>{
  const u=await p.user.findFirst({where:{nickLower:nick}});
  if(!u){console.log('NO_USER');process.exit(1)}
  const w=await p.wallet.findUnique({where:{userId:u.id}});
  const s=await p.save.findUnique({where:{userId:u.id}});
  const st=JSON.parse(s.state||'{}');
  const ch=await p.olympicChampion.findMany({where:{nick},take:2});
  const ar=await p.olympicArchive.findMany({take:2});
  const rec=await p.olympicRecord.findMany();
  const res=await p.olympicResult.findMany({where:{edition:9}});
  console.log('gems='+w.gems,'gold='+((st.res||{}).gold),'oil='+((st.res||{}).oil),'food='+((st.res||{}).food),'steel='+((st.res||{}).steel),'boost='+(!!w.boostUntil&&w.boostUntil.getTime()>Date.now()));
  console.log('champ_rows='+ch.length,'(country='+(ch[0]&&ch[0].country)+', medals='+(ch[0]&&ch[0].medals)+')','archive='+ar.length,'results='+res.length);
  console.log('records='+rec.map(r=>r.discipline+':'+r.score+':'+r.nick).join(' | '));
  await p.\$disconnect();
})().catch(e=>{console.log('DBERR',e.message);process.exit(1)})"

echo "--- errors ---"
$AB errors 2>/dev/null | head -8
for pid in $(ss -tlnp 2>/dev/null | grep ':3100' | grep -oP 'pid=\K[0-9]+' | sort -u); do kill -9 $pid 2>/dev/null; done
echo done
