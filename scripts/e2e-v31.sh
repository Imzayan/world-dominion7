#!/bin/bash
# V31 one-shot E2E v2: boot -> register -> assert both pages via deterministic evals -> kill
set -u
cd /home/z/my-project/.next/standalone
(fuser -k 3100/tcp 2>/dev/null; true)
sleep 1
PORT=3100 HOSTNAME=0.0.0.0 node server.js > /tmp/v31server.log 2>&1 &
SRV=$!
for i in $(seq 1 25); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/api/db/server_stats 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 1
done
echo "SERVER_UP=$code"
AB="agent-browser"
E(){ $AB eval "$1" 2>/dev/null | tr -d '"\n' | head -1; }

$AB open http://localhost:3100/game/index.html >/dev/null 2>&1
sleep 9
# clear old session state, then register fresh
$AB eval "try{localStorage.removeItem('wd_seen')}catch(e){};location.reload();'reloading'" >/dev/null 2>&1
sleep 9
$AB eval "var n=document.getElementById('nick');var p=document.getElementById('pw');var p2=document.getElementById('pw2');
if(n){n.value='v31test2'};if(p){p.value='test123456'};if(p2){p2.value='test123456'};'filled'" >/dev/null 2>&1
$AB find text "ثبت‌نام و شروع" click >/dev/null 2>&1
sleep 8
echo "R1_entered_game=$(E "!!document.querySelector('#hud-strip')&&!document.querySelector('#auth')?.classList.contains('active')")"
echo "R1_oly_chip=$(E "!!document.getElementById('hud-olympic')")"

# ---- TEST 1: cinematic server page ----
$AB eval "try{document.getElementById('hud-srv').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 4
echo "T1_page_on=$(E "!!document.querySelector('#wd-srvpage.on')")"
echo "T1_title=$(E "document.getElementById('wdsp-title')?.textContent")"
echo "T1_top_rows=$(E "document.querySelectorAll('#wdsp-top .wd31-row').length")"
echo "T1_srv_cards=$(E "document.querySelectorAll('#wdsp-srvs .wd31-srv').length")"
echo "T1_players=$(E "document.querySelectorAll('#wdsp-players .wd31-row').length")"
echo "T1_news=$(E "document.querySelectorAll('#wdsp-news .wd31-row').length")"
echo "T1_stats_filled=$(E "document.getElementById('wdsp-n-tk')?.textContent")"
$AB screenshot /home/z/my-project/download/v31-server-page.png >/dev/null 2>&1
$AB press Escape >/dev/null 2>&1; sleep 1
echo "T1_closed=$(E "!document.querySelector('#wd-srvpage.on')")"

# ---- TEST 2: olympics ----
$AB eval "try{document.getElementById('hud-olympic').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 4
echo "T2_page_on=$(E "!!document.querySelector('#wd-olympics.on')")"
echo "T2_disc=$(E "document.querySelectorAll('#wdol-disc .wd31-card').length")"
echo "T2_medal_msg=$(E "(document.getElementById('wdol-medals')?.textContent||'').slice(0,40)")"
echo "T2_me=$(E "(document.getElementById('wdol-me-b')?.textContent||'').slice(0,40)")"
echo "T2_rings=$(E "document.querySelectorAll('.wd31-ring').length")"
$AB screenshot /home/z/my-project/download/v31-olympics.png >/dev/null 2>&1

# ---- TEST 3: rpc raw ----
echo "T3_rpc=$(E "fetch('/api/rpc/olympics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({p_server:1})}).then(r=>r.json()).then(j=>'err='+(j.error?j.error.message:'null')+' disc='+(j.data?(j.data.disciplines||[]).length:-1)+' medals='+(j.data?(j.data.medals||[]).length:-1))")"

# ---- TEST 4: lobby button + close ----
$AB eval "try{document.querySelector('[data-tab=sp]')?.click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 2
echo "T4_lobby_btn=$(E "!!document.getElementById('wdol-lobby-btn')")"
$AB eval "try{document.getElementById('wdol-lobby-btn').click();'ok'}catch(e){'ERR'}" >/dev/null 2>&1
sleep 2
echo "T4_reopen=$(E "!!document.querySelector('#wd-olympics.on')")"
$AB press Escape >/dev/null 2>&1; sleep 1
echo "T4_esc_closed=$(E "!document.querySelector('#wd-olympics.on')")"
echo "T4_closebtn=$(E "(function(){document.querySelector('#wd-olympics .wd31-close')?.click();return 'ok'})()")"

echo "--- errors ---"
$AB errors 2>/dev/null | head -6
kill $SRV 2>/dev/null
(fuser -k 3100/tcp 2>/dev/null; true)
echo killed
