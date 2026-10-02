/* ============================================================
   WORLD DOMINION — V95 SOCIAL & PLAYER IDENTITY V1
   حضور زنده • رجیستری سرور • پیام خصوصی • دوستان • مسدودسازی
   پروفایل سه‌رتبه • دستاوردهای سمت سرور • اعلان‌ها • آیکون مرکزی
   تمام داده از RPC سشن‌محور می‌آید؛ هیچ عدد جعلی‌ای وجود ندارد.
   ============================================================ */
(function(){
'use strict';
if(window.WDSI)return;
var D=document;

/* ---------- helpers ---------- */
function $(id){return D.getElementById(id)}
function mk(tag,txt,cls,fn){var e=D.createElement(tag);if(txt)e.textContent=txt;if(cls)e.className=cls;if(fn)e.addEventListener('click',function(ev){ev.stopPropagation();fn(ev)});return e}
function esc(v){return String(v==null?'':v).replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]})}
function fa(n){try{return Number(n||0).toLocaleString('fa-IR')}catch(e){return String(n||0)}}
function fad(n){try{return String(n).replace(/[0-9]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[+d]})}catch(e){return String(n)}}
function avColor(n){var h=11;for(var i=0;i<String(n).length;i++)h=(h*37+String(n).charCodeAt(i))%360;return h}
function relT(iso){
  var d=Math.floor((Date.now()-new Date(iso).getTime())/1000);
  if(!(d>=0))return '';
  if(d<60)return 'همین حالا';
  if(d<3600)return fad(Math.floor(d/60))+' دقیقه پیش';
  if(d<86400)return fad(Math.floor(d/3600))+' ساعت پیش';
  return fad(Math.floor(d/86400))+' روز پیش';
}
async function rpc(fn,args){
  var r=await sb.rpc(fn,args||{});
  if(r.error)throw r.error;
  return r.data;
}
function toast(msg,kind){try{showToast(msg,kind||'info')}catch(e){}}
function myUid(){return (typeof ACC!=='undefined'&&ACC&&ACC.uid)?ACC.uid:null}
function mySrv(){return (typeof SRV!=='undefined'&&SRV)?SRV:1}

/* ---------- رجیستری آیکون مرکزی (SVG) — گسترش ICON موجود، بدون بازنویسی ---------- */
function sv(inner,vb){return '<svg viewBox="'+(vb||'0 0 24 24')+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+inner+'</svg>'}
var SI={
  msg:sv('<rect x="3" y="5" width="18" height="14" rx="2.4" fill="#2b9fd0"/><path d="M3.5 7.2 12 13l8.5-5.8" fill="none" stroke="#eafcff" stroke-width="1.6" stroke-linecap="round"/><path d="M3.5 17.5 9.6 11.8M20.5 17.5l-6.1-5.7" stroke="#1a6e96" stroke-width="1.2" fill="none"/>'),
  bell:sv('<path d="M12 3.2a5.4 5.4 0 0 1 5.4 5.4c0 4.2 1.2 5.6 2.1 6.4H4.5c.9-.8 2.1-2.2 2.1-6.4A5.4 5.4 0 0 1 12 3.2z" fill="#ffcf4d" stroke="#a8720a" stroke-width=".8"/><path d="M9.8 17.6a2.3 2.3 0 0 0 4.4 0" fill="none" stroke="#a8720a" stroke-width="1.5" stroke-linecap="round"/>'),
  user:sv('<circle cx="12" cy="8" r="4" fill="#7fc8f0" stroke="#2b7fc0" stroke-width=".8"/><path d="M4.5 20.4c1.2-4 4-5.8 7.5-5.8s6.3 1.8 7.5 5.8" fill="#7fc8f0" stroke="#2b7fc0" stroke-width=".8"/>'),
  users:sv('<circle cx="9" cy="9" r="3.4" fill="#8dffc4" stroke="#0e9e5c" stroke-width=".7"/><path d="M3 19.6c.9-3.2 3.2-4.7 6-4.7s5.1 1.5 6 4.7" fill="#8dffc4" stroke="#0e9e5c" stroke-width=".7"/><circle cx="16.8" cy="8" r="2.6" fill="#c9f6ff" stroke="#0e9e5c" stroke-width=".6"/><path d="M15.6 13.6c2.9-.4 5 1.2 5.7 4.2" fill="none" stroke="#0e9e5c" stroke-width="1.3" stroke-linecap="round"/>'),
  block:sv('<circle cx="12" cy="12" r="8.6" fill="none" stroke="#ff8a9a" stroke-width="2"/><path d="M6 6l12 12" stroke="#ff8a9a" stroke-width="2" stroke-linecap="round"/>'),
  server:sv('<rect x="3.5" y="4" width="17" height="6.4" rx="1.6" fill="#4a9fd8"/><rect x="3.5" y="13.6" width="17" height="6.4" rx="1.6" fill="#2b7fc0"/><circle cx="7.4" cy="7.2" r="1.15" fill="#c9f6ff"/><circle cx="7.4" cy="16.8" r="1.15" fill="#c9f6ff"/><rect x="11" y="6.4" width="7" height="1.6" rx=".8" fill="#eaf4ff" opacity=".85"/><rect x="11" y="16" width="7" height="1.6" rx=".8" fill="#eaf4ff" opacity=".85"/>'),
  dove:sv('<path d="M4 13.6c2.4-5 7-7.4 12.2-6.2l3.6-2.6-.7 4c1.1.6 1.6 1.4 1.4 2.4-2.2-.3-3.4 0-4.6 1.2-2.4 2.4-6.4 3-9.4 2.4L4 17v-3.4z" fill="#eaf4ff" stroke="#7ea8c8" stroke-width=".7"/><circle cx="16.4" cy="8.4" r=".8" fill="#2b5a86"/><path d="M7.6 14.6C6 16 5 17.8 4.8 20" fill="none" stroke="#7ea8c8" stroke-width=".8" stroke-linecap="round"/>'),
  send:sv('<path d="M3.4 11.6 20.2 4.2c.7-.3 1.4.4 1.1 1.1l-7.4 16.8c-.3.7-1.4.6-1.6-.2l-1.8-6.4-6.4-1.8c-.8-.2-.9-1.3.1-2.1z" fill="#39e6d0"/><path d="m10.5 15.5 4.3-4.3" stroke="#0b3a3a" stroke-width="1.4" stroke-linecap="round"/>'),
  eye:sv('<path d="M2.8 12S6.4 5.8 12 5.8 21.2 12 21.2 12 17.6 18.2 12 18.2 2.8 12 2.8 12z" fill="none" stroke="#8fd8ff" stroke-width="1.7"/><circle cx="12" cy="12" r="2.8" fill="#39c4f0"/>'),
  medal:sv('<circle cx="12" cy="14.6" r="5.4" fill="#ffcf4d" stroke="#a8720a" stroke-width=".8"/><path d="m8.6 3.4 3.4 6.4L15.4 3.4" fill="none" stroke="#4a9fd8" stroke-width="2.2" stroke-linecap="round"/><path d="M12 11.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#8a5a00"/>'),
  chat:sv('<path d="M4 5.6A2.6 2.6 0 0 1 6.6 3h10.8A2.6 2.6 0 0 1 20 5.6v8A2.6 2.6 0 0 1 17.4 16.2H9.6L5 20v-3.8h-.4A2.6 2.6 0 0 1 4 13.6v-8z" fill="#39e6d0"/><circle cx="8.6" cy="9.6" r="1.1" fill="#0b3a3a"/><circle cx="12" cy="9.6" r="1.1" fill="#0b3a3a"/><circle cx="15.4" cy="9.6" r="1.1" fill="#0b3a3a"/>'),
  sword:sv('<g transform="rotate(45 12 12)"><rect x="11.15" y="2" width="1.7" height="12.5" rx=".85" fill="#e6eef8"/><rect x="8.9" y="14.6" width="6.2" height="1.7" rx=".85" fill="#c9a23f"/><rect x="11.3" y="16.3" width="1.4" height="3.4" rx=".7" fill="#8a5a00"/></g>'),
  back:sv('<path d="M10.4 5 4 12l6.4 7M4.6 12h15" fill="none" stroke="#cfe8ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  crown2:sv('<path d="M4 8.6l3.8 3L12 5.4l4.2 6.2 3.8-3v8.2H4V8.6z" fill="#ffcf4d" stroke="#a8720a" stroke-width=".8"/><rect x="4" y="17.2" width="16" height="2.2" rx="1" fill="#ffcf4d"/>'),
  hof:sv('<path d="M5 20.5h14M6.4 20.5V10h11.2v10.5M12 3.2 14 8h-4l2-4.8z" fill="none" stroke="#ffd75e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="13.4" width="6" height="7.1" fill="#ffd75e" opacity=".35"/>'),
  globeCine:sv('<defs><radialGradient id="w96g1" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#cdf5ff"/><stop offset=".45" stop-color="#39c4f0"/><stop offset="1" stop-color="#0b4a78"/></radialGradient></defs><circle cx="12" cy="12" r="8.8" fill="url(#w96g1)" stroke="rgba(200,244,255,.95)" stroke-width=".8"/><g fill="none" stroke="rgba(235,252,255,.8)" stroke-width=".85"><ellipse cx="12" cy="12" rx="4" ry="8.8"/><path d="M3.2 12h17.6M4.4 7.2h15.2M4.4 16.8h15.2"/></g><circle cx="8.8" cy="8.4" r="1.6" fill="rgba(255,255,255,.9)"/>')
};
window.WDSI_ICON=function(name,size){var s=SI[name]||SI.user;var px=size||24;return s.replace('<svg ','<svg width="'+px+'" height="'+px+'" ')};
try{if(window.ICON){['msg','bell','user','users','block','server','dove','send','eye','medal','chat','sword','back','crown2','hof'].forEach(function(k){if(!window.ICON[k])window.ICON[k]=SI[k]})}}catch(e){}

/* ---------- CSS ---------- */
var css=[
/* چیپ زنده داخل hud-srv2 — بدون دست‌زدن به عناصر موجود */
'.wd95-live{display:inline-flex;align-items:center;gap:4px;margin-inline-start:2px;padding:2px 7px;border-radius:99px;',
 'background:rgba(0,30,50,.45);border:1px solid rgba(80,200,255,.25);font-size:9px;font-weight:900;color:#bfefff;',
 'font-variant-numeric:tabular-nums;white-space:nowrap;flex:0 0 auto;transition:background .3s}',
'.wd95-live i{width:7px;height:7px;border-radius:50%;background:#39e6d0;box-shadow:0 0 8px #39e6d0;flex:0 0 auto}',
'.wd95-live.busy i{background:#ffcf4d;box-shadow:0 0 8px #ffcf4d}.wd95-live.full i{background:#ff8a9a;box-shadow:0 0 8px #ff8a9a}',
'.wd95-live.maint i{background:#b9cfe6;box-shadow:none}',
/* مودال‌ها */
'.wd95-modal .modal-card{max-height:min(86dvh,720px);display:flex;flex-direction:column;gap:8px;animation:wd95in .16s ease-out}',
'@keyframes wd95in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
'.wd95-head{display:flex;align-items:center;gap:8px}',
'.wd95-head .wd95-title{font-size:13px;font-weight:900;color:#eaf8ff;flex:1;display:flex;align-items:center;gap:6px}',
'.wd95-icobtn{width:44px;height:44px;min-width:44px;border-radius:12px;border:1px solid rgba(120,200,255,.22);background:rgba(10,30,55,.6);',
 'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .12s,background .2s}',
'.wd95-icobtn:active{transform:scale(.92)}.wd95-icobtn:hover{background:rgba(20,50,85,.75)}',
'.wd95-icobtn svg{width:22px;height:22px}',
'.wd95-icobtn.wd95-hasbadge{position:relative}.wd95-badge{position:absolute;top:-4px;inset-inline-end:-4px;min-width:16px;height:16px;padding:0 4px;',
 'border-radius:99px;background:linear-gradient(135deg,#ff5e7a,#ff2e55);color:#fff;font-size:9px;font-weight:900;',
 'display:inline-flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(255,60,100,.6)}',
'.wd95-badge.inline{position:static}',
'.wd95-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto}',
'.wd95-dot.on{background:#39e6a0;box-shadow:0 0 7px #39e6a0}.wd95-dot.idle{background:#ffcf4d;box-shadow:0 0 7px #ffcf4d}.wd95-dot.off{background:#5a7a95}',
/* ردیف‌ها */
'.wd95-list{overflow-y:auto;overscroll-behavior:contain;flex:1;display:flex;flex-direction:column;gap:6px;min-height:120px;padding:2px}',
'.wd95-row{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:14px;border:1px solid rgba(120,200,255,.14);',
 'background:rgba(10,26,48,.55);cursor:pointer;min-height:52px;transition:background .15s}',
'.wd95-row:hover{background:rgba(18,42,74,.7)}.wd95-row:active{transform:scale(.985)}',
'.wd95-row.unread{border-color:rgba(80,220,255,.4);background:rgba(12,38,66,.65)}',
'.wd95-ava{width:38px;height:38px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;',
 'font-weight:900;color:#fff;font-size:15px;text-shadow:0 1px 3px rgba(0,0,0,.5);position:relative}',
'.wd95-ava .wd95-dot{position:absolute;bottom:-1px;inset-inline-end:-1px;border:2px solid #0b1626}',
'.wd95-mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}',
'.wd95-mid b{font-size:11.5px;color:#eaf8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.wd95-mid small{font-size:9.5px;color:#8fb4d4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.wd95-side{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:0 0 auto}',
'.wd95-side small{font-size:8.5px;color:#6d93b4}',
/* اکشن‌ها */
'.wd95-act{min-height:42px;padding:9px 14px;border-radius:12px;border:1px solid rgba(120,200,255,.25);cursor:pointer;',
 'font-size:11px;font-weight:800;color:#dff2ff;background:rgba(20,50,90,.55);display:inline-flex;align-items:center;gap:6px;transition:transform .12s}',
'.wd95-act:active{transform:scale(.94)}',
'.wd95-act.pri{background:linear-gradient(135deg,#1a7ac0,#2b9fd0);border-color:rgba(140,220,255,.5)}',
'.wd95-act.danger{background:rgba(120,20,40,.5);border-color:rgba(255,110,130,.4);color:#ffd7de}',
'.wd95-act.ok{background:rgba(16,90,60,.5);border-color:rgba(70,230,160,.4);color:#d2ffe8}',
'.wd95-actions{display:flex;flex-wrap:wrap;gap:7px}',
/* ورودی */
'.wd95-input{flex:1;min-height:44px;border-radius:13px;border:1px solid rgba(120,200,255,.25);background:rgba(6,16,32,.8);',
 'color:#eaf8ff;font-size:16px;padding:8px 12px;outline:none}',
'.wd95-input:focus{border-color:rgba(90,220,255,.6)}',
/* گپ خصوصی (سبک مسنجر) */
'.wd95-thread{flex:1;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:6px;padding:8px 4px;min-height:180px;max-height:min(58dvh,460px)}',
'.wd95-bub{max-width:78%;padding:8px 11px;border-radius:15px;font-size:12px;line-height:1.55;color:#eef8ff;word-break:break-word;animation:wd95in .14s ease-out}',
'.wd95-bub.out{align-self:flex-end;background:linear-gradient(135deg,#1a6ea8,#2b8fc4);border-bottom-right-radius:5px}',
'.wd95-bub.in{align-self:flex-start;background:rgba(30,52,84,.85);border:1px solid rgba(120,200,255,.14);border-bottom-left-radius:5px}',
'.wd95-bub small{display:block;font-size:8px;opacity:.65;margin-top:3px}',
'.wd95-compose{display:flex;gap:7px;align-items:flex-end;padding-top:4px;padding-bottom:calc(4px + env(safe-area-inset-bottom,0px))}',
'.wd95-send{width:44px;height:44px;min-width:44px;border-radius:50%;border:none;background:linear-gradient(135deg,#1a7ac0,#39e6d0);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .12s}',
'.wd95-send:active{transform:scale(.9)}.wd95-send svg{width:20px;height:20px}',
'.wd95-send[disabled]{opacity:.5}',
/* تب‌ها */
'.wd95-tabs{display:flex;gap:5px}',
'.wd95-tab{flex:1;min-height:40px;border-radius:11px;border:1px solid rgba(120,200,255,.18);background:rgba(8,22,42,.6);color:#9fc4e4;font-size:10.5px;font-weight:800;cursor:pointer}',
'.wd95-tab.on{background:linear-gradient(135deg,#173f66,#1d5486);color:#fff;border-color:rgba(120,210,255,.45)}',
/* پروفایل */
'.wd95-prof-head{display:flex;align-items:center;gap:12px}',
'.wd95-prof-head .wd95-ava{width:58px;height:58px;font-size:23px}',
'.wd95-titlechip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:9.5px;font-weight:900;background:linear-gradient(135deg,rgba(255,205,80,.22),rgba(255,140,40,.16));border:1px solid rgba(255,200,90,.4);color:#ffe2a0}',
'.wd95-ranks{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}',
'.wd95-rank{border-radius:13px;border:1px solid rgba(120,200,255,.16);background:rgba(10,28,52,.6);padding:9px 6px;text-align:center}',
'.wd95-rank b{display:block;font-size:17px;font-weight:900;color:#fff;font-variant-numeric:tabular-nums}',
'.wd95-rank small{font-size:8.5px;color:#8fb4d4;font-weight:800}',
'.wd95-rank svg{width:20px;height:20px;margin-bottom:2px}',
'.wd95-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}',
'.wd95-stat{background:rgba(8,22,42,.55);border-radius:10px;padding:7px 4px;text-align:center;border:1px solid rgba(120,200,255,.1)}',
'.wd95-stat b{display:block;font-size:11px;color:#dff2ff;font-variant-numeric:tabular-nums}',
'.wd95-stat small{font-size:8px;color:#7fa4c6}',
'.wd95-sect{font-size:10px;font-weight:900;color:#8fd8ff;margin-top:4px;display:flex;align-items:center;gap:5px}',
'.wd95-achgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}',
'.wd95-ach{border-radius:11px;border:1px solid rgba(120,200,255,.14);background:rgba(8,22,42,.55);padding:8px 4px;text-align:center;min-height:64px}',
'.wd95-ach span{font-size:17px;display:block}.wd95-ach b{display:block;font-size:8.5px;color:#cfe8ff;margin-top:3px;font-weight:800}',
'.wd95-ach.got{border-color:rgba(255,205,90,.45);background:linear-gradient(160deg,rgba(60,45,8,.5),rgba(10,20,40,.7))}',
'.wd95-ach.lock{opacity:.42;filter:grayscale(.7)}',
'.wd95-achgrid .wd95-catfull{grid-column:1/-1}',
'.wd95-cattitle{font-size:9px;font-weight:900;color:#8fb4d4;margin:5px 0 2px;text-align:right}',
'.wd95-countries{display:flex;flex-wrap:wrap;gap:4px}',
'.wd95-flagchip{font-size:9px;padding:3px 8px;border-radius:8px;background:rgba(20,50,90,.5);border:1px solid rgba(120,200,255,.2);color:#cfe8ff}',
'.wd95-flagchip.cap{border-color:rgba(255,205,90,.5);color:#ffe2a0}',
/* کارت فشرده */
'.wd95-cardp{position:fixed;z-index:10060;width:min(78vw,270px);border-radius:17px;border:1px solid rgba(120,210,255,.35);',
 'background:linear-gradient(165deg,rgba(14,34,62,.97),rgba(8,18,36,.97));box-shadow:0 14px 44px rgba(0,0,0,.6);',
 'padding:12px;animation:wd95in .15s ease-out;backdrop-filter:none}',
'.wd95-cardp .wd95-ranks{grid-template-columns:repeat(3,1fr)}',
/* ردیف اکشن نقشه */
'.wd95-maprow{display:flex;gap:6px;flex-wrap:wrap}',
'.wd95-maprow .wd95-act{flex:1;justify-content:center;min-width:74px}',
/* اعلان‌ها */
'.wd95-nt{display:flex;gap:9px;padding:10px;border-radius:13px;border:1px solid rgba(120,200,255,.13);background:rgba(10,26,48,.55);align-items:flex-start}',
'.wd95-nt.unread{border-color:rgba(255,205,90,.4)}',
'.wd95-nt span{font-size:18px;flex:0 0 auto}',
'.wd95-nt .wd95-mid b{font-size:11px}.wd95-nt .wd95-mid div{font-size:10px;color:#a8c8e4;line-height:1.5}',
'.wd95-empty{text-align:center;color:#7fa4c6;font-size:11px;padding:26px 10px;line-height:1.9}',
'.wd95-sub{font-size:9.5px;color:#8fb4d4;line-height:1.7}',
/* ---- V96: FAB آنلاین سینمایی زیر المپیک + قرص‌های وضعیت درخشان (جایگزین اموجی) ---- */
'.wd96-fab{position:fixed;right:8px;width:46px;height:46px;z-index:9997;border-radius:50%;cursor:pointer;',
 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;',
 'background:radial-gradient(circle at 32% 26%,rgba(9,62,88,.98),rgba(4,30,48,.98) 46%,rgba(2,12,22,.98));',
 'border:2px solid rgba(64,220,255,.9);transition:transform .15s,box-shadow .3s;',
 'box-shadow:0 10px 26px rgba(0,0,0,.6),0 0 20px rgba(0,214,255,.42),inset 0 2px 0 rgba(185,244,255,.5),inset 0 -8px 16px rgba(0,96,140,.4)}',
'.wd96-fab::before{content:"";position:absolute;inset:-4px;border-radius:50%;z-index:-1;',
 'background:conic-gradient(from 0deg,rgba(0,220,255,0) 0deg,rgba(0,220,255,.6) 40deg,rgba(0,220,255,0) 95deg);',
 'animation:wd96spin 3.6s linear infinite}',
'.wd96-fab:active{transform:scale(.92)}',
'.wd96-fab .wd96-num{font-size:11.5px;font-weight:900;color:#e6fbff;line-height:1;text-shadow:0 0 9px rgba(0,220,255,.95);font-variant-numeric:tabular-nums}',
'.wd96-fab .wd96-flbl{position:absolute;bottom:-11px;left:50%;transform:translateX(-50%);white-space:nowrap;',
 'font-size:8px;font-weight:900;color:#aef0ff;background:rgba(2,16,28,.95);border:1px solid rgba(0,214,255,.55);',
 'padding:1.5px 7px;border-radius:99px;pointer-events:none;box-shadow:0 3px 10px rgba(0,0,0,.5)}',
'.wd96-fab .wd96-fdot{position:absolute;top:-2px;inset-inline-end:-2px;width:10px;height:10px;border-radius:50%;',
 'background:#2bffb0;border:2px solid #031320;box-shadow:0 0 10px #2bffb0;animation:wd96pulse 1.8s infinite}',
'@keyframes wd96spin{to{transform:rotate(360deg)}}',
'@keyframes wd96pulse{0%,100%{opacity:1}50%{opacity:.5}}',
'.wd96-fab.busy{border-color:rgba(255,205,80,.9);box-shadow:0 10px 26px rgba(0,0,0,.6),0 0 20px rgba(255,190,60,.45),inset 0 2px 0 rgba(255,240,190,.5),inset 0 -8px 16px rgba(140,96,0,.4)}',
'.wd96-fab.busy .wd96-fdot{background:#ffcf4d;border-color:#1c1402;box-shadow:0 0 10px #ffcf4d}',
'.wd96-fab.busy .wd96-num{color:#fff3d0;text-shadow:0 0 9px rgba(255,200,60,.95)}',
'.wd96-fab.full{border-color:rgba(255,110,130,.9);box-shadow:0 10px 26px rgba(0,0,0,.6),0 0 20px rgba(255,80,110,.45),inset 0 2px 0 rgba(255,200,210,.5),inset 0 -8px 16px rgba(130,20,40,.4)}',
'.wd96-fab.full .wd96-fdot{background:#ff5e7a;border-color:#1e030a;box-shadow:0 0 10px #ff5e7a;animation:none}',
'.wd96-fab.full .wd96-num{color:#ffe0e6;text-shadow:0 0 9px rgba(255,90,120,.95)}',
'.wd96-fab.maint{border-color:rgba(150,170,190,.7);box-shadow:0 8px 20px rgba(0,0,0,.55)}',
'.wd96-fab.maint::before{animation:none;opacity:0}',
'.wd96-fab.maint .wd96-fdot{background:#93a9bd;box-shadow:none;animation:none}',
'.wd96-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:99px;font-size:9px;font-weight:900;white-space:nowrap;letter-spacing:.3px}',
'.wd96-orb{width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:#2bffb0;box-shadow:0 0 8px #2bffb0;animation:wd96pulse 2.2s infinite}',
'.wd96-pill.st-on{background:rgba(6,52,36,.75);border:1px solid rgba(60,255,170,.5);color:#a8ffd8}',
'.wd96-pill.st-busy{background:rgba(60,44,4,.75);border:1px solid rgba(255,205,80,.5);color:#ffe2a0}',
'.wd96-pill.st-busy .wd96-orb{background:#ffcf4d;box-shadow:0 0 8px #ffcf4d}',
'.wd96-pill.st-full{background:rgba(64,8,20,.75);border:1px solid rgba(255,110,130,.5);color:#ffc4ce}',
'.wd96-pill.st-full .wd96-orb{background:#ff5e7a;box-shadow:0 0 8px #ff5e7a;animation:none}',
'.wd96-pill.st-lock{background:rgba(28,36,46,.75);border:1px solid rgba(150,170,190,.45);color:#c2d2e2}',
'.wd96-pill.st-lock .wd96-orb{background:#93a9bd;box-shadow:none;animation:none}',
'.wd96-pill.st-maint{background:rgba(50,40,8,.75);border:1px solid rgba(220,180,90,.5);color:#f0dca8}',
'.wd96-pill.st-maint .wd96-orb{background:#d8b46a;box-shadow:0 0 6px #d8b46a}',
'.wd96-onl{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;',
 'background:rgba(2,22,38,.7);border:1px solid rgba(0,214,255,.35);font-size:9.5px;font-weight:900;color:#c8f4ff;',
 'font-variant-numeric:tabular-nums;width:max-content;max-width:100%}',
'.wd96-onl .wd96-orb{width:7px;height:7px}',
'.wd96-onl svg{width:12px;height:12px;flex:0 0 auto}',
'.lobby-item.wd96-glow-on{border-color:rgba(60,255,170,.38);background:linear-gradient(160deg,rgba(8,44,30,.55),rgba(10,26,48,.6))}',
'.lobby-item.wd96-glow-busy{border-color:rgba(255,205,80,.42);background:linear-gradient(160deg,rgba(56,42,4,.5),rgba(10,26,48,.6))}',
'.lobby-item.wd96-glow-full{border-color:rgba(255,110,130,.42)}',
'.lobby-item.wd96-glow-maint{border-color:rgba(220,180,90,.4)}',
'.lobby-item.wd96-here{border-color:rgba(0,214,255,.6);box-shadow:0 0 16px rgba(0,214,255,.28),inset 0 0 20px rgba(0,214,255,.07)}',
'.wd31-srv{transition:border-color .3s,box-shadow .3s}',
'.wd31-srv.wd96-glow-on{border-color:rgba(60,255,170,.4)}',
'.wd31-srv.wd96-glow-busy{border-color:rgba(255,205,80,.5);box-shadow:0 0 16px rgba(255,190,60,.14)}',
'.wd31-srv.wd96-glow-full{border-color:rgba(255,110,130,.5)}',
'.wd31-srv.wd96-glow-maint{border-color:rgba(220,180,90,.45)}',
'.wd31-srv .wd96-onl b{font-size:11.5px;color:#e6fbff;text-shadow:0 0 8px rgba(0,220,255,.8)}',
/* ---- V97: پنل «بازیکنان آنلاینِ همین سرور» — شیشه‌ای، درخشان، فقط سرور جاری ---- */
'.wd96-fab svg{width:17px;height:17px;filter:drop-shadow(0 0 6px rgba(150,235,255,.95))}',
'.wd96-op{position:fixed;right:8px;z-index:9999;width:min(76vw,248px);max-height:46dvh;display:flex;flex-direction:column;',
 'border-radius:16px;border:1px solid rgba(64,220,255,.5);overflow:hidden;',
 'background:linear-gradient(165deg,rgba(8,30,50,.96),rgba(3,12,24,.97));',
 'box-shadow:0 14px 34px rgba(0,0,0,.65),0 0 22px rgba(0,214,255,.28),inset 0 1px 0 rgba(185,244,255,.35);',
 'backdrop-filter:blur(10px) saturate(1.25);-webkit-backdrop-filter:blur(10px) saturate(1.25);',
 'animation:wd96opin .18s ease-out}',
'@keyframes wd96opin{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}',
'.wd96-oph{display:flex;align-items:center;gap:7px;padding:9px 11px;border-bottom:1px solid rgba(64,220,255,.22);',
 'background:linear-gradient(160deg,rgba(10,44,70,.75),rgba(4,16,30,.8))}',
'.wd96-oph .wd96-ot{font-size:10.5px;font-weight:900;color:#dff6ff;flex:1;display:flex;flex-direction:column;gap:1px}',
'.wd96-oph .wd96-ot small{font-size:8px;font-weight:800;color:#8fd8ff}',
'.wd96-onum{font-size:19px;font-weight:900;color:#aef4ff;line-height:1;font-variant-numeric:tabular-nums;',
 'text-shadow:0 0 12px rgba(0,220,255,.95),0 0 26px rgba(0,190,255,.5)}',
'.wd96-olist{overflow-y:auto;overscroll-behavior:contain;padding:5px;display:flex;flex-direction:column;gap:3px}',
'.wd96-orow{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:10px;',
 'background:rgba(10,30,54,.5);border:1px solid rgba(120,200,255,.1)}',
'.wd96-orow b{flex:1;min-width:0;font-size:10.5px;font-weight:800;color:#eaf8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.wd96-orow .wd96-orb{width:7px;height:7px}',
'.wd96-orow.me{border-color:rgba(255,205,90,.45);background:linear-gradient(160deg,rgba(60,45,8,.45),rgba(10,26,48,.55))}',
'.wd96-orow.me b{color:#ffe9b8}',
'.wd96-ome{font-size:7.5px;font-weight:900;color:#ffd75e;border:1px solid rgba(255,205,90,.45);border-radius:99px;padding:1px 6px;flex:0 0 auto}',
'.wd96-oempty{font-size:10px;color:#8fb4d4;text-align:center;padding:18px 10px;line-height:1.9}',
'.wd96-of{padding:6px 10px;border-top:1px solid rgba(64,220,255,.18);font-size:8px;color:#7fa4c6;display:flex;justify-content:space-between;align-items:center}',
'@media(max-width:400px){.wd95-achgrid{grid-template-columns:repeat(3,1fr)}.wd95-stats{grid-template-columns:repeat(2,1fr)}}'
].join('');
if(!$('wd95-css')){var st=D.createElement('style');st.id='wd95-css';st.textContent=css;D.head.appendChild(st)}

/* ---------- state ---------- */
var ST={badges:{dm:0,nt:0,fr:0},onl:{},srvs:null,blocks:{},hbT:0,profOpen:null,dmOpen:null,dmPoll:0,dmSig:'',players:[]};

/* ---------- حضور زنده (heartbeat) ---------- */
async function heartbeat(){
  if(!myUid()||typeof sb==='undefined'||!sb)return;
  var status=D.hidden?'idle':'online';
  try{
    var r=await rpc('wd_presence',{p_server:mySrv(),p_status:status});
    ST.onl={};
    (r.servers||[]).forEach(function(x){ST.onl[x.server]=x.online});
    ST.myOnline=r.online||0;ST.total=r.total||0;ST.players=r.players||[];
    renderLive();
  }catch(e){/* بی‌صدا — ضربان بعدی */}
}
D.addEventListener('visibilitychange',function(){if(myUid())heartbeat()});
window.addEventListener('pagehide',function(){
  try{
    if(!myUid())return;
    var blob=new Blob([JSON.stringify({p_server:mySrv(),p_status:'idle'})],{type:'text/plain'});
    navigator.sendBeacon('/api/rpc/wd_presence',blob);
  }catch(e){}
});
/* شروع پس از ورود — نظرسنجی سبک تا آماده شدن ACC */
var hbStarted=false;
function hbWatch(){
  if(hbStarted||!myUid())return;
  hbStarted=true;
  heartbeat();
  setInterval(function(){if(!D.hidden)heartbeat();else if(ST._idleSent)return;},45000);
}
setInterval(hbWatch,3000);
D.addEventListener('visibilitychange',function(){ST._idleSent=D.hidden});

/* ---------- V96: نمایشگر آنلاین سینمایی — FAB مستقل زیر دکمه‌ی المپیک ----------
   چیپ قدیمی که داخل دکمه‌ی ۴۴px داک تزریق می‌شد حذف شد (هم‌پوشانی با آیکون سرور). */
function srvStatusOf(k){
  var s=ST.srvs&&ST.srvs[k];
  if(s)return s.status;
  return 'online';
}
function renderLive(){
  var old=$('wd95-live');if(old&&old.parentNode)old.parentNode.removeChild(old);
  ensureFab();
  var f=$('wd96-fab');if(!f)return;
  var onl=ST.onl[mySrv()]||0;
  var sts=srvStatusOf(mySrv());
  var cls='wd96-fab '+(sts==='maintenance'?'maint':sts==='full'?'full':sts==='busy'?'busy':'');
  if(f.className!==cls)f.className=cls;
  var n=f.querySelector('.wd96-num');if(n&&n.textContent!==fad(onl))n.textContent=fad(onl);
  var lb=f.querySelector('.wd96-flbl');
  var txt=(sts==='maintenance'?'تعمیر':sts==='full'?'پر':sts==='busy'?'شلوغ':'آنلاین')+' • سرور '+fad(mySrv());
  if(lb&&lb.textContent!==txt)lb.textContent=txt;
  paintSrvPage();refreshOnlPanel();
}
var fabTries=0;
function ensureFab(){
  if($('wd96-fab'))return;
  var oly=$('hud-olympic');
  if(!oly){if(++fabTries<80)setTimeout(ensureFab,500);return}
  var f=D.createElement('div');f.id='wd96-fab';f.className='wd96-fab';
  f.title='بازیکنان آنلاین همین سرور — لیست زنده';
  f.innerHTML=WDSI_ICON('globeCine',18)+'<span class="wd96-num">—</span><span class="wd96-fdot"></span><span class="wd96-flbl">آنلاین • سرور '+fad(mySrv())+'</span>';
  f.addEventListener('click',function(ev){ev.stopPropagation();toggleOnlPanel()});
  D.body.appendChild(f);
  fabPlace();
}
/* جای‌گذاری پویا: دقیقا زیر FAB المپیک — با جابه‌جایی المپیک (رفلوی نواری HUD) همگام می‌ماند؛ بدون هم‌پوشانی */
function fabPlace(){
  var f=$('wd96-fab');if(!f)return;
  var oly=$('hud-olympic');
  if(!oly){f.style.top='234px';return}
  var r=oly.getBoundingClientRect();
  if(!r||!r.height){f.style.top='234px';return}
  var top=Math.round(r.bottom)+16;
  top=Math.min(window.innerHeight-100,Math.max(96,top));
  if(f.style.top!==top+'px')f.style.top=top+'px';
  try{if(typeof window.syncHeatPos==='function')window.syncHeatPos()}catch(e){}
}
window.addEventListener('resize',fabPlace);
setInterval(fabPlace,2500);
/* مقدار آنلاین کارت‌های صفحه‌ی سینمایی سرور را درجا تازه می‌کند (بدون رندر مجدد صفحه) */
function paintSrvPage(){
  for(var k=1;k<=12;k++){
    var el=$('wd96-onl-'+k);if(!el)continue;
    var v=ST.onl[k]!=null?ST.onl[k]:(ST.srvs&&ST.srvs[k]?ST.srvs[k].online:null);
    if(v!=null&&el.textContent!==fad(v))el.textContent=fad(v);
  }
}
function openSrvSelector(){
  try{
    if(typeof renderSrv==='function')renderSrv();
    openModal('m-srv');
  }catch(e){}
}
/* ---------- V97: پنل بازیکنان آنلاینِ همین سرور — «چه کسایی آنلاین هستن؟» ---------- */
function toggleOnlPanel(){
  var p=$('wd96-op');
  if(p){try{D.removeEventListener('click',opOutside)}catch(e){}p.remove();return}
  p=D.createElement('div');p.id='wd96-op';p.className='wd96-op';
  p.innerHTML='<div class="wd96-oph">'+WDSI_ICON('users',16)+
    '<span class="wd96-ot">بازیکنان آنلاین<small>سرور '+fad(mySrv())+' — فقط همین سرور</small></span>'+
    '<b class="wd96-onum">—</b></div>'+
    '<div class="wd96-olist"><div class="wd96-oempty">در حال دریافت…</div></div>'+
    '<div class="wd96-of"><span>به‌روزرسانی خودکار</span><span>● زنده</span></div>';
  D.body.appendChild(p);
  placeOnlPanel();renderOnlList();
  setTimeout(function(){D.addEventListener('click',opOutside)},0);
}
function placeOnlPanel(){
  var p=$('wd96-op');if(!p)return;
  var f=$('wd96-fab');
  if(f){var r=f.getBoundingClientRect();p.style.top=(Math.round(r.bottom)+26)+'px'}
  else p.style.top='236px';
}
function opOutside(ev){
  var p=$('wd96-op');if(!p){try{D.removeEventListener('click',opOutside)}catch(e){}return}
  var f=$('wd96-fab');
  if(p.contains(ev.target)||(f&&f.contains(ev.target)))return;
  try{D.removeEventListener('click',opOutside)}catch(e){}
  p.remove();
}
function renderOnlList(){
  var p=$('wd96-op');if(!p)return;
  var onl=ST.onl[mySrv()];
  var num=p.querySelector('.wd96-onum');
  if(num&&onl!=null&&num.textContent!==fad(onl))num.textContent=fad(onl);
  placeOnlPanel();
  var list=p.querySelector('.wd96-olist');if(!list)return;
  var me=(typeof ACC!=='undefined'&&ACC&&ACC.nick)?ACC.nick:null;
  var rows=(ST.players||[]).slice();
  if(me){var has=false;for(var i=0;i<rows.length;i++){if(rows[i].nick===me){has=true;break}}
    if(!has)rows.unshift({nick:me})}
  var sig=rows.map(function(r){return r.nick}).join('|')+'#'+(onl==null?'?':onl);
  if(list.__sig===sig)return;list.__sig=sig;
  if(!rows.length){list.innerHTML='<div class="wd96-oempty">فعلاً کسی آنلاین نیست — تو اولین باش! ✨</div>';return}
  var h='';
  for(var j=0;j<rows.length;j++){
    var isMe=me&&rows[j].nick===me;
    h+='<div class="wd96-orow'+(isMe?' me':'')+'"><i class="wd96-orb"></i><b>'+esc(rows[j].nick)+'</b>'+
       (isMe?'<span class="wd96-ome">تو</span>':'')+'</div>';
  }
  list.innerHTML=h;
}
function refreshOnlPanel(){if(!$('wd96-op'))return;renderOnlList()}

/* ---------- غنی‌سازی انتخابگر سرور (کارت‌های ONLINE/BUSY/FULL/MAINTENANCE) ---------- */
async function refreshSrvs(){
  try{var r=await rpc('wd_servers');ST.srvs={};(r.servers||[]).forEach(function(s){ST.srvs[s.server]=s});renderLive()}catch(e){}
}
if(typeof wdModalHook==='function')wdModalHook('m-srv',function(){
  if(!ST.srvs){refreshSrvs().then(function(){augmentSrvList()});return}
  augmentSrvList();
});
/* V96: غنی‌سازی سینمایی ردیف‌های سرور — قرص وضعیت درخشان + شمارنده‌ی آنلاین واقعی هر سرور (به‌جای خط متنی اموجی) */
function augmentSrvList(){
  var body=$('srv-body');if(!body||!ST.srvs)return;
  try{var mm=$('m-srv');if(mm){var ts=mm.querySelector('.modal-title-row span');if(ts&&!ts.__wd96){ts.__wd96=1;
    ts.innerHTML=WDSI_ICON('globeCine',18)+'<span> سرورهای جهان</span>';
    ts.style.display='inline-flex';ts.style.alignItems='center';ts.style.gap='6px'}}}catch(e){}
  var items=body.querySelectorAll('.lobby-item');
  var STC={online:['st-on','آنلاین'],busy:['st-busy','شلوغ'],full:['st-full','پر'],maintenance:['st-maint','تعمیر']};
  items.forEach(function(item,i){
    var k=i+1,s=ST.srvs[k];if(!s)return;
    var sub=item.querySelector('.lobby-item-sub');if(!sub)return;
    if(sub.__wd96){var oc=sub.querySelector('.wd96-onln');if(oc&&oc.textContent!==fad(s.online))oc.textContent=fad(s.online);return}
    var orig=sub.textContent||'';
    sub.__wd96=1;sub.textContent='';sub.style.color='';
    sub.style.display='flex';sub.style.alignItems='center';sub.style.gap='7px';sub.style.flexWrap='wrap';
    var m=STC[s.status]||STC.online;
    var pill=D.createElement('span');pill.className='wd96-pill '+m[0];
    pill.innerHTML='<i class="wd96-orb"></i>';
    pill.appendChild(D.createTextNode(' '+(s.status==='maintenance'&&s.note?('تعمیر — '+s.note):m[1])));
    sub.appendChild(pill);
    if(orig.indexOf('تستی')>-1){var tp=D.createElement('span');tp.className='wd96-pill st-lock';tp.innerHTML='<i class="wd96-orb"></i>';tp.appendChild(D.createTextNode(' سرور تستی — درِ ورود بسته'));sub.appendChild(tp)}
    else if(orig.indexOf('قفل')>-1){var lp=D.createElement('span');lp.className='wd96-pill st-lock';lp.innerHTML='<i class="wd96-orb"></i>';lp.appendChild(D.createTextNode(' قفل'));sub.appendChild(lp)}
    var onl=D.createElement('span');onl.className='wd96-onl';onl.style.marginTop='0';
    onl.innerHTML=WDSI_ICON('users',12)+'<span class="wd96-onln">'+fad(s.online)+'</span>';
    onl.appendChild(D.createTextNode(' آنلاین'));
    sub.appendChild(onl);
    var gc=s.status==='online'?'on':s.status==='maintenance'?'maint':s.status;
    item.classList.add('wd96-glow-'+gc);
    if(k===mySrv())item.classList.add('wd96-here');
  });
}
setInterval(function(){if(!D.hidden&&myUid())refreshSrvs()},60000);

/* ---------- بج‌ها (یک نظرسنجی ۳۰ثانیه‌ای واحد) ---------- */
async function pollBadges(){
  if(!myUid()||typeof sb==='undefined'||!sb)return;
  try{
    var r=await rpc('wd_badges');
    var prevNt=ST.badges.nt;
    ST.badges=r;
    if(r.nt>prevNt)toast('🔔 اعلان جدید داری','info');
    applyBadges();
  }catch(e){}
}
function applyBadges(){
  function setB(id,v){var b=$(id);if(b&&b.textContent!==fad(v))b.textContent=fad(v)}
  setB('wd95-bd-msg',ST.badges.dm||0);
  setB('wd95-bd-nt',(ST.badges.nt||0)+(ST.badges.fr||0));
  /* بج داخل شیت فرمان (الگوی WD28) */
  try{
    var sheet=$('wd-menu');if(!sheet)return;
    var items=sheet.querySelectorAll('.wd-menu-item');
    var want=[['پیام‌ها',ST.badges.dm],['اعلان‌ها',ST.badges.nt],['دوستان',ST.badges.fr]];
    for(var i=0;i<items.length;i++){
      var bEl=items[i].querySelector('b');if(!bEl)continue;
      for(var w=0;w<want.length;w++){
        if(bEl.textContent.indexOf(want[w][0])>-1){
          var old2=items[i].querySelector('.wd95-badge');if(old2)old2.remove();
          if(want[w][1]>0){var bd2=mk('span',fa(want[w][1]),'wd95-badge');bd2.style.position='static';bd2.style.marginInlineStart='6px';items[i].appendChild(bd2)}
          break;
        }
      }
    }
  }catch(e){}
}
setInterval(function(){if(!D.hidden)pollBadges()},30000);

/* ---------- کش مسدودها ---------- */
async function loadBlocks(){
  if(!myUid())return;
  try{var r=await rpc('wd_blocks');ST.blocks={};(r.blocks||[]).forEach(function(b){ST.blocks[b.uid]=b.nick})}catch(e){}
}

/* ---------- دکمه‌های پیام/اعلان در داک فرماندهی V87 (الگوی رسمی فعلی بازی) ---------- */
function ensureDock(){
  var dock=$('wd87dock');if(!dock)return;
  if(!$('wd95-b-msg')){
    var b=D.createElement('button');b.id='wd95-b-msg';b.className='wd87-ic';b.type='button';
    b.title='پیام‌های خصوصی';b.innerHTML=WDSI_ICON('msg',20)+'<b class="wd87-b" id="wd95-bd-msg">۰</b>';
    b.addEventListener('click',function(e){e.stopPropagation();openInbox()});
    dock.appendChild(b);
  }
  if(!$('wd95-b-nt')){
    var n=D.createElement('button');n.id='wd95-b-nt';n.className='wd87-ic';n.type='button';
    n.title='اعلان‌ها';n.innerHTML=WDSI_ICON('bell',20)+'<b class="wd87-b" id="wd95-bd-nt">۰</b>';
    n.addEventListener('click',function(e){e.stopPropagation();openNotifs()});
    dock.appendChild(n);
  }
  applyBadges();
}
/* شیت فرمان هر بار باز شدن بازسازی می‌شود — با Observer آیتم‌ها را تزریق می‌کنیم */
function ensureSheetItems(){
  var body=$('wd-menu');if(!body)return;
  var grid=body.querySelector('.wd-menu-grid');if(!grid)return;
  if(grid.__wd95)return;grid.__wd95=1;
  var anchor=null;
  var its=grid.querySelectorAll('.wd-menu-item');
  for(var i=0;i<its.length;i++){var b=its[i].querySelector('b');if(b&&b.textContent.indexOf('چت جهانی')>-1){anchor=its[i];break}}
  function item(icoTxt,ttl,sub,fn,alt){
    var it=mk('div','','wd-menu-item'+(alt?' alt':''));it.addEventListener('click',fn);
    var ic=mk('span',icoTxt,'wd-menu-ic');var tx=mk('div','','');
    var bb=mk('b',ttl);var ss=mk('small',sub);
    tx.append(bb,ss);it.append(ic,tx);return it;
  }
  var fr=mk('div','');fr.style.cssText='display:contents';
  fr.appendChild(item('✉️','پیام‌ها','چت خصوصی با فرماندهان دیگر',function(){openInbox()}));
  fr.appendChild(item('👥','دوستان','فهرست هم‌پیمانان و درخواست‌ها',function(){openFriends()},1));
  fr.appendChild(item('🪪','پروفایل من','هویت، سه رتبه و دستاوردها',function(){openProfile()}));
  fr.appendChild(item('🏅','دستاوردها','کاتالوگ افتخارات سرور',function(){openProfile('ach')},1));
  if(anchor&&anchor.nextSibling)grid.insertBefore(fr,anchor.nextSibling);
  else grid.appendChild(fr);
  applyBadges();
}
try{
  new MutationObserver(function(){try{ensureSheetItems()}catch(e){}}).observe(D.body,{childList:true,subtree:true});
}catch(e){}
/* داک V87 با تاخیر ساخته می‌شود — نظرسنجی سبک تا ظهور */
var dockTries=0;
var dockIv=setInterval(function(){ensureDock();if(++dockTries>40||$('wd95-b-msg'))clearInterval(dockIv)},800);
setInterval(function(){if(!D.hidden)ensureDock()},5000);

/* ============================================================
   PART 2 — مودال‌ها و تعاملات
   ============================================================ */
function mmodal(id,titleIco,titleTxt){
  var m=$(id);
  if(m)return m;
  m=D.createElement('div');m.id=id;m.className='modal wd95-modal';
  m.innerHTML='<div class="modal-card"><div class="modal-title-row wd95-head"><span class="wd95-title">'+WDSI_ICON(titleIco,20)+'<span>'+titleTxt+'</span></span><span class="close-modal wd95-icobtn" style="width:36px;height:36px;min-width:36px" data-x="'+id+'">✕</span></div><div class="wd95-body" style="display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;overflow:hidden"></div></div>';
  D.body.appendChild(m);
  m.querySelector('[data-x]').addEventListener('click',function(){try{closeModal(id)}catch(e){}});
  return m;
}
function body(id){var m=$(id);return m?m.querySelector('.wd95-body'):null}

/* ---------- صندوق پیام (MESSAGES) ---------- */
function openInbox(){
  var m=mmodal('wd-msgs','msg','پیام‌ها');
  var b=body('wd-msgs');
  b.innerHTML='';
  /* گفتگوی تازه با نام کاربری */
  var newRow=D.createElement('div');newRow.style.cssText='display:flex;gap:7px';
  var inp=mk('input','','wd95-input');inp.placeholder='نام دقیق فرمانده…';inp.maxLength=40;inp.autocomplete='off';
  var go=mk('button','گفتگو','wd95-act pri');
  go.addEventListener('click',function(){
    var nick=inp.value.trim();if(!nick)return;
    startDmByNick(nick);
  });
  newRow.append(inp,go);b.appendChild(newRow);
  var list=mk('div','','wd95-list');b.appendChild(list);
  list.innerHTML='<div class="wd95-empty">در حال بارگذاری…</div>';
  try{openModal('wd-msgs')}catch(e){}
  rpc('wd_dm_threads').then(function(r){
    list.innerHTML='';
    var th=r.threads||[];
    if(!th.length){list.innerHTML='<div class="wd95-empty">هنوز گفتگویی نداری.<br>از چت جهانی روی نام بازیکن بزن یا بالا نامش را بنویس.</div>';return}
    th.forEach(function(t){
      var row=mk('div','','wd95-row'+(t.unread?' unread':''));
      var av=mk('div',(t.nick||'؟').trim().charAt(0).toUpperCase(),'wd95-ava');
      av.style.background='linear-gradient(135deg,hsl('+avColor(t.nick)+',65%,45%),hsl('+((avColor(t.nick)+50)%360)+',70%,35%))';
      av.appendChild(mk('i',''));var dot=av.lastChild;dot.className='wd95-dot '+(t.presence==='online'?'on':t.presence==='idle'?'idle':'off');
      var mid=mk('div','','wd95-mid');mid.appendChild(mk('b',t.nick));mid.appendChild(mk('small',t.last||''));
      var side=mk('div','','wd95-side');
      side.appendChild(mk('small',relT(t.at)));
      if(t.unread>0)side.appendChild(mk('span',fa(t.unread),'wd95-badge inline'));
      row.append(av,mid,side);
      row.addEventListener('click',function(){openDm(t.uid,t.nick)});
      list.appendChild(row);
    });
  }).catch(function(){list.innerHTML='<div class="wd95-empty">اتصال برقرار نشد — چند لحظه دیگر تلاش کن.</div>'});
}
function startDmByNick(nick){
  toast('در جست‌وجوی '+nick+'…','info');
  rpc('wd_profile',{p_nick:nick,p_server:mySrv()}).then(function(p){
    if(!p||!p.ok){toast('فرمانده‌ای با این نام پیدا نشد','lose');return}
    try{closeModal('wd-msgs')}catch(e){}
    openDm(p.uid,p.nick);
  }).catch(function(){toast('اتصال برقرار نشد','lose')});
}

/* ---------- گپ خصوصی (سبک مسنجر) ---------- */
function openDm(uid,nick){
  if(!uid)return;
  ST.dmOpen={uid:uid,nick:nick};ST.dmSig='';
  var m=mmodal('wd-dm','msg','گفتگو');
  var b=body('wd-dm');b.innerHTML='';
  /* هدر */
  var head=D.createElement('div');head.className='wd95-head';
  var back=mk('button','','wd95-icobtn');back.innerHTML=WDSI_ICON('back',18);
  back.addEventListener('click',function(){try{closeModal('wd-dm')}catch(e){}openInbox()});
  var ava=mk('div',(nick||'؟').charAt(0).toUpperCase(),'wd95-ava');
  ava.style.background='linear-gradient(135deg,hsl('+avColor(nick)+',65%,45%),hsl('+((avColor(nick)+50)%360)+',70%,35%))';
  var dot=mk('i','');dot.className='wd95-dot off';ava.appendChild(dot);
  var tt=mk('div','','wd95-mid');tt.appendChild(mk('b',nick));var stTxt=mk('small','…');tt.appendChild(stTxt);
  var profB=mk('button','','wd95-icobtn');profB.innerHTML=WDSI_ICON('user',18);profB.title='پروفایل';
  profB.addEventListener('click',function(){openProfile(null,uid,nick)});
  var moreB=mk('button','','wd95-icobtn');moreB.innerHTML=WDSI_ICON('block',18);moreB.title='مسدودسازی';
  moreB.addEventListener('click',function(){wdConfirmBlock(uid,nick,function(){loadBlocks()})});
  head.append(back,ava,tt,profB,moreB);b.appendChild(head);
  /* رشته */
  var th=mk('div','','wd95-thread');th.innerHTML='<div class="wd95-empty">…</div>';b.appendChild(th);
  /* ارسال */
  var comp=D.createElement('div');comp.className='wd95-compose';
  var inp=mk('input','','wd95-input');inp.maxLength=500;inp.placeholder='پیامت را بنویس…';inp.autocomplete='off';
  var send=mk('button','','wd95-send');send.innerHTML=WDSI_ICON('send',20);
  function doSend(){
    var v=inp.value.trim();if(!v||!ST.dmOpen)return;
    inp.value='';send.disabled=true;
    rpc('wd_dm_send',{p_to:ST.dmOpen.uid,p_body:v,p_server:mySrv()}).then(function(r){
      send.disabled=false;
      if(!r||!r.ok){
        var em={blocked:'این فرمانده تو را مسدود کرده است',you_blocked:'تو این فرمانده را مسدود کرده‌ای',self:'',no_user:'',empty:''}[r&&r.error]||'ارسال نشد';
        if(em)toast(em,'lose');
        inp.value=v;return;
      }
      fetchThread(true);
      pollBadges();
    }).catch(function(){send.disabled=false;inp.value=v;toast('ارسال نشد — دوباره تلاش کن','lose')});
  }
  send.addEventListener('click',doSend);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();doSend()}});
  comp.append(inp,send);b.appendChild(comp);
  try{openModal('wd-dm')}catch(e){}
  setTimeout(function(){try{inp.focus()}catch(e){}},160);
  fetchThread(true);
  /* نظرسنجی فقط هنگام باز بودن */
  clearInterval(ST.dmPoll);
  ST.dmPoll=setInterval(function(){
    var mm=$('wd-dm');
    if(!mm||!mm.classList.contains('active')||!ST.dmOpen){clearInterval(ST.dmPoll);return}
    fetchThread(false);
  },4000);
}
function fetchThread(force){
  if(!ST.dmOpen)return;
  rpc('wd_dm_thread',{p_with:ST.dmOpen.uid,p_limit:60}).then(function(r){
    if(!r||!r.ok)return;
    var th=$('wd-dm');if(!th||!th.classList.contains('active'))return;
    var stEl=th.querySelector('.wd95-mid small');if(stEl)stEl.textContent=r.presence==='online'?'🟢 آنلاین':r.presence==='idle'?'🟡 دور از تبع':'🔴 آفلاین'; /* V107 فیکس: stTxt محلیِ openDm بود و این‌جا ReferenceError می‌داد */
    var sig='';(r.messages||[]).forEach(function(x){sig+=x.id+'|'});
    if(sig===ST.dmSig&&!force){applyBadges();return}
    ST.dmSig=sig;
    var list=th.querySelector('.wd95-thread');
    list.innerHTML='';
    if(!(r.messages||[]).length){list.innerHTML='<div class="wd95-empty">اولین پیام را بفرست 👋</div>'}
    r.messages.forEach(function(x){
      var bub=mk('div','','wd95-bub '+(x.out?'out':'in'));
      bub.appendChild(D.createTextNode(x.body));
      bub.appendChild(mk('small',relT(x.at)+(x.out?(x.read?' ✓✓':' ✓'):'')));
      list.appendChild(bub);
    });
    list.scrollTop=list.scrollHeight;
    applyBadges();
  }).catch(function(){});
}

/* ---------- پروفایل بازیکن ---------- */
var ACH_CACHE=null;
function openProfile(tab,uid,nick){
  var m=mmodal('wd-prof','user','پروفایل فرمانده');
  var b=body('wd-prof');
  b.innerHTML='<div class="wd95-empty">در حال بارگذاری…</div>';
  try{openModal('wd-prof')}catch(e){}
  var args={p_server:mySrv()};
  if(uid)args.p_uid=uid;else if(nick)args.p_nick=nick;
  rpc('wd_profile',args).then(function(p){
    if(!p||!p.ok){b.innerHTML='<div class="wd95-empty">پروفایل پیدا نشد.</div>';return}
    b.innerHTML='';
    /* سرصفحه */
    var head=D.createElement('div');head.className='wd95-prof-head';
    var av=mk('div',(p.nick||'؟').charAt(0).toUpperCase(),'wd95-ava');
    av.style.background='linear-gradient(135deg,hsl('+avColor(p.nick)+',65%,45%),hsl('+((avColor(p.nick)+50)%360)+',70%,35%))';
    var dot=mk('i','');dot.className='wd95-dot '+(p.presence.state==='online'?'on':p.presence.state==='idle'?'idle':'off');av.appendChild(dot);
    var mid=mk('div','','wd95-mid');
    var nm=mk('b',p.nick);nm.style.fontSize='14px';
    mid.appendChild(nm);
    var sub=mk('small',(p.presence.state==='online'?'🟢 آنلاین':p.presence.state==='idle'?'🟡 دور از تبع':'🔴 آفلاین')+' — سرور '+fa(p.server)+' • عضویت '+(p.joined?new Date(p.joined).toLocaleDateString('fa-IR'):'—'));
    mid.appendChild(sub);
    var tc=D.createElement('div');tc.className='wd95-titlechip';tc.textContent=p.ladder.title;
    mid.appendChild(tc);
    if(p.alliance){var al=mk('div','','wd95-titlechip');al.textContent='🛡️ ['+p.alliance.tag+'] '+p.alliance.name;mid.appendChild(al)}
    head.append(av,mid);b.appendChild(head);
    /* بیو */
    var bioWrap=D.createElement('div');
    if(p.self){
      var bi=mk('input','','wd95-input');bi.value=p.bio||'';bi.maxLength=160;bi.placeholder='بیوی خودت را بنویس (حداکثر ۱۶۰ حرف)…';
      var bs=mk('button','ذخیره','wd95-act pri');
      bs.addEventListener('click',function(){
        rpc('wd_profile_set',{p_bio:bi.value,p_server:mySrv()}).then(function(r){
          if(r&&r.ok){toast('پروفایل ذخیره شد ✓','win');pollBadges()}
        }).catch(function(){toast('ذخیره نشد','lose')});
      });
      var brow=D.createElement('div');brow.style.cssText='display:flex;gap:7px';brow.append(bi,bs);
      bioWrap.appendChild(brow);
    }else{
      bioWrap=mk('div',p.bio||'— بیویی ثبت نشده —','wd95-sub');
    }
    b.appendChild(bioWrap);
    /* سه رتبه */
    var rk=D.createElement('div');rk.className='wd95-ranks';
    function rankCard(ico,val,lbl){
      var c=mk('div','','wd95-rank');c.innerHTML=WDSI_ICON(ico,20);
      c.appendChild(mk('b',val==null?'—':'#'+fa(val)));
      c.appendChild(mk('small',lbl));return c;
    }
    rk.append(rankCard('sword',p.ranks.military,'رتبه نظامی'),rankCard('hof',p.ranks.economy,'رتبه اقتصاد'),rankCard('medal',p.ranks.olympics,'رتبه المپیاد'));
    b.appendChild(rk);
    /* آمار */
    var st2=D.createElement('div');st2.className='wd95-stats';
    [['قلمرو',p.stats.conquered],['امتیاز',p.stats.score],['کشتار',p.stats.kills],['نظامیان',p.stats.recruits]].forEach(function(x){
      var s=mk('div','','wd95-stat');s.appendChild(mk('b',fa(x[1])));s.appendChild(mk('small',x[0]));st2.appendChild(s);
    });
    b.appendChild(st2);
    /* المپیاد + لقب بعدی */
    var olymp=mk('div','','wd95-sub');
    olymp.textContent='🥇 مدال‌ها: '+fa(p.olympics.medals)+' (طلا: '+fa(p.olympics.golds)+')'+(p.ladder.next?(' • لقب بعدی: '+p.ladder.next.title.replace(/^[^ ]+ /,'')+' در '+fa(p.ladder.next.at)+' قلمرو'):' • بالاترین لقب!');
    b.appendChild(olymp);
    /* دیپلماسی/اطلاعات */
    if(p.alliance){
      var dip=mk('div','','wd95-sub');
      dip.textContent='🕊️ دیپلماسی: عضو اتحاد «'+p.alliance.name+'» ['+p.alliance.tag+'] با نقش '+(p.alliance.role==='owner'?'رهبر':'عضو');
      b.appendChild(dip);
    }
    /* اکشن‌ها */
    if(!p.self){
      var acts=D.createElement('div');acts.className='wd95-actions';
      var rel=p.relation||{};
      var mb=mk('button',' پیام','wd95-act pri');mb.innerHTML=WDSI_ICON('msg',16)+'<span> پیام</span>';
      mb.addEventListener('click',function(){try{closeModal('wd-prof')}catch(e){}openDm(p.uid,p.nick)});
      acts.appendChild(mb);
      var fb;
      if(rel.friend==='accepted'){fb=mk('button',' حذف دوست','wd95-act danger');
        fb.addEventListener('click',function(){rpc('wd_friend_del',{p_uid:p.uid}).then(function(){toast('حذف شد','info');loadBlocks();openProfile(null,p.uid,p.nick)})});
      }else if(rel.friend==='pending_in'){fb=mk('button',' پذیرش دوستی','wd95-act ok');
        fb.addEventListener('click',function(){rpc('wd_friend_ok',{p_uid:p.uid}).then(function(r){if(r&&r.ok){toast('دوستی برقرار شد ✓','win');pollBadges()}openProfile(null,p.uid,p.nick)})});
      }else if(rel.friend==='pending_out'){fb=mk('button',' درخواست فرستاده شد','wd95-act');fb.disabled=true;
      }else{fb=mk('button',' افزودن دوست','wd95-act');
        fb.addEventListener('click',function(){rpc('wd_friend_add',{p_uid:p.uid}).then(function(r){
          if(!r||!r.ok){toast(r&&r.error==='blocked'?'مسدود هستید':'انجام نشد','lose');return}
          toast(r.status==='accepted'?'دوستی برقرار شد ✓':'درخواست ارسال شد ✓','win');pollBadges();openProfile(null,p.uid,p.nick);
        })});
      }
      acts.appendChild(fb);
      var bb;
      if(rel.blocked){bb=mk('button',' رفع مسدودی','wd95-act');
        bb.addEventListener('click',function(){rpc('wd_block_del',{p_uid:p.uid}).then(function(){toast('رفع شد','info');loadBlocks();openProfile(null,p.uid,p.nick)})});
      }else{bb=mk('button',' مسدودسازی','wd95-act danger');
        bb.addEventListener('click',function(){wdConfirmBlock(p.uid,p.nick,function(){openProfile(null,p.uid,p.nick)})});
      }
      acts.appendChild(bb);
      /* حمله — فقط وقتی از روی نقشه با قلمرو او باز شده باشد */
      if(ST.profOpen&&ST.profOpen.country&&typeof window.OTH!=='undefined'&&window.OTH[ST.profOpen.country]&&typeof professionalAttack==='function'){
        var ab=mk('button',' حمله به '+ST.profOpen.country,'wd95-act danger');ab.innerHTML=WDSI_ICON('sword',16)+'<span> عملیات زمینی</span>';
        ab.addEventListener('click',function(){try{closeModal('wd-prof')}catch(e){}professionalAttack(ST.profOpen.country)});
        acts.appendChild(ab);
      }
      b.appendChild(acts);
    }
    /* قلمروها */
    if((p.countries||[]).length){
      b.appendChild(mk('div','🏴 قلمروها','wd95-sect'));
      var cw=D.createElement('div');cw.className='wd95-countries';
      p.countries.forEach(function(c){
        var f=mk('span',c.country+(c.capital?' ★':''),'wd95-flagchip'+(c.capital?' cap':''));
        cw.appendChild(f);
      });
      b.appendChild(cw);
    }
    /* دستاوردها */
    b.appendChild(mk('div','🏅 دستاوردها','wd95-sect'));
    var ag=D.createElement('div');ag.className='wd95-achgrid';b.appendChild(ag);
    var earned={};(p.achievements||[]).forEach(function(a){earned[a.key]=a.at});
    rpc('wd_achievements').then(function(ac){
      if(!ac||!ac.ok)return;
      ag.innerHTML='';
      var byCat={};ac.catalog.forEach(function(a){(byCat[a.cat]=byCat[a.cat]||[]).push(a)});
      Object.keys(ac.cats).forEach(function(cat){
        var t=mk('div',ac.cats[cat],'wd95-cattitle');ag.appendChild(t);
        (byCat[cat]||[]).forEach(function(a){
          var got=!!earned[a.key];
          var el=mk('div','','wd95-ach '+(got?'got':'lock'));
          el.appendChild(mk('span',a.ico));el.appendChild(mk('b',a.fa));
          el.title=a.d+(got?' ✓':'');
          ag.appendChild(el);
        });
      });
      if(tab==='ach')ag.scrollIntoView({behavior:'smooth'});
    }).catch(function(){ag.innerHTML='<div class="wd95-sub">کاتالوگ بارگذاری نشد.</div>'});
  }).catch(function(){b.innerHTML='<div class="wd95-empty">اتصال برقرار نشد.</div>'});
}

/* ---------- دوستان ---------- */
function openFriends(tab){
  var m=mmodal('wd-fr','users','دوستان');
  var b=body('wd-fr');b.innerHTML='';
  var tabs=D.createElement('div');tabs.className='wd95-tabs';
  var t1=mk('button','دوستان','wd95-tab'),t2=mk('button','درخواست‌ها','wd95-tab'),t3=mk('button','مسدودها','wd95-tab');
  tabs.append(t1,t2,t3);b.appendChild(tabs);
  var addRow=D.createElement('div');addRow.style.cssText='display:flex;gap:7px';
  var inp=mk('input','','wd95-input');inp.maxLength=40;inp.placeholder='افزودن با نام دقیق…';inp.autocomplete='off';
  var go=mk('button','درخواست','wd95-act pri');
  go.addEventListener('click',function(){
    var nick=inp.value.trim();if(!nick)return;
    rpc('wd_friend_add',{p_nick:nick}).then(function(r){
      if(!r||!r.ok){var em={self:'خودت!',blocked:'مسدود هستید',cap:'سقف دوستان',no_user:'پیدا نشد'}[r&&r.error]||'انجام نشد';toast(em,'lose');return}
      toast(r.status==='accepted'?'دوستی برقرار شد ✓':'درخواست ارسال شد ✓','win');inp.value='';draw(cur);pollBadges();
    }).catch(function(){toast('اتصال برقرار نشد','lose')});
  });
  addRow.append(inp,go);b.appendChild(addRow);
  var list=mk('div','','wd95-list');b.appendChild(list);
  var cur=tab||'f';
  function tabOn(k){t1.classList.toggle('on',k==='f');t2.classList.toggle('on',k==='r');t3.classList.toggle('on',k==='b')}
  t1.addEventListener('click',function(){cur='f';draw(cur)});
  t2.addEventListener('click',function(){cur='r';draw(cur)});
  t3.addEventListener('click',function(){cur='b';draw(cur)});
  function draw(k){
    tabOn(k);list.innerHTML='<div class="wd95-empty">…</div>';
    if(k==='b'){
      rpc('wd_blocks').then(function(r){
        list.innerHTML='';
        if(!(r.blocks||[]).length){list.innerHTML='<div class="wd95-empty">کسی را مسدود نکرده‌ای.</div>';return}
        r.blocks.forEach(function(x){
          var row=mk('div','','wd95-row');
          var av=mk('div',(x.nick||'؟').charAt(0).toUpperCase(),'wd95-ava');av.style.background='linear-gradient(135deg,hsl('+avColor(x.nick)+',30%,38%),hsl('+avColor(x.nick)+',30%,28%))';
          var mid=mk('div','','wd95-mid');mid.appendChild(mk('b',x.nick));mid.appendChild(mk('small','مسدودشده'));
          var ub=mk('button','رفع','wd95-act');
          ub.addEventListener('click',function(){rpc('wd_block_del',{p_uid:x.uid}).then(function(){loadBlocks();draw('b')})});
          row.append(av,mid,ub);
          list.appendChild(row);
        });
      }).catch(function(){list.innerHTML='<div class="wd95-empty">اتصال برقرار نشد.</div>'});
      return;
    }
    rpc('wd_friends').then(function(r){
      list.innerHTML='';
      if(k==='f'){
        if(!(r.friends||[]).length){list.innerHTML='<div class="wd95-empty">هنوز دوستی نداری.<br>از چت جهانی یا نقشه روی بازیکنان بزن.</div>';return}
        r.friends.forEach(function(f){
          var row=mk('div','','wd95-row');
          var av=mk('div',(f.nick||'؟').charAt(0).toUpperCase(),'wd95-ava');
          av.style.background='linear-gradient(135deg,hsl('+avColor(f.nick)+',65%,45%),hsl('+((avColor(f.nick)+50)%360)+',70%,35%))';
          av.appendChild(mk('i',''));var dot=av.lastChild;dot.className='wd95-dot '+(f.presence==='online'?'on':f.presence==='idle'?'idle':'off');
          var mid=mk('div','','wd95-mid');mid.appendChild(mk('b',f.nick));mid.appendChild(mk('small',(f.presence==='online'?'🟢 آنلاین':f.presence==='idle'?'🟡 دور از تبع':'🔴 آفلاین')+' — سرور '+fa(f.server)+' • '+fa(f.conquered)+' قلمرو'));
          var mb=mk('button','','wd95-icobtn');mb.innerHTML=WDSI_ICON('msg',17);mb.title='پیام';
          mb.addEventListener('click',function(){try{closeModal('wd-fr')}catch(e){}openDm(f.uid,f.nick)});
          row.append(av,mid,mb);
          row.addEventListener('click',function(){openProfile(null,f.uid,f.nick)});
          list.appendChild(row);
        });
      }else{
        if(!(r.requests||[]).length){list.innerHTML='<div class="wd95-empty">درخواست دوستی بازی نداری.</div>';return}
        r.requests.forEach(function(q){
          var row=mk('div','','wd95-row');
          var av=mk('div',(q.nick||'؟').charAt(0).toUpperCase(),'wd95-ava');
          av.style.background='linear-gradient(135deg,hsl('+avColor(q.nick)+',65%,45%),hsl('+((avColor(q.nick)+50)%360)+',70%,35%))';
          var mid=mk('div','','wd95-mid');mid.appendChild(mk('b',q.nick));mid.appendChild(mk('small',relT(q.at)));
          var ok=mk('button','پذیرش','wd95-act ok');
          ok.addEventListener('click',function(){rpc('wd_friend_ok',{p_uid:q.uid}).then(function(x){if(x&&x.ok){toast('دوستی برقرار شد ✓','win');pollBadges()}draw('r')})});
          var no=mk('button','رد','wd95-act danger');
          no.addEventListener('click',function(){rpc('wd_friend_del',{p_uid:q.uid}).then(function(){draw('r')})});
          row.append(av,mid,ok,no);
          list.appendChild(row);
        });
      }
    }).catch(function(){list.innerHTML='<div class="wd95-empty">اتصال برقرار نشد.</div>'});
  }
  try{openModal('wd-fr')}catch(e){}
  draw(cur);
}

/* ---------- اعلان‌ها ---------- */
var NT_ICO={ach:'🏅',dm:'✉️',friend:'🤝',sys:'🔔'};
function openNotifs(){
  var m=mmodal('wd-nt','bell','اعلان‌ها');
  var b=body('wd-nt');b.innerHTML='';
  var bar=D.createElement('div');bar.style.cssText='display:flex;gap:7px;justify-content:flex-end';
  var all=mk('button','خواندن همه','wd95-act');
  all.addEventListener('click',function(){rpc('wd_notify_read',{}).then(function(){openNotifs();pollBadges()})});
  bar.appendChild(all);b.appendChild(bar);
  var list=mk('div','','wd95-list');list.innerHTML='<div class="wd95-empty">…</div>';b.appendChild(list);
  rpc('wd_notify').then(function(r){
    list.innerHTML='';
    if(!(r.items||[]).length){list.innerHTML='<div class="wd95-empty">اعلانی نداری.</div>';return}
    r.items.forEach(function(n){
      var row=mk('div','','wd95-nt'+(n.read?'':' unread'));
      row.appendChild(mk('span',NT_ICO[n.kind]||'🔔'));
      var mid=D.createElement('div');mid.className='wd95-mid';
      mid.appendChild(mk('b',n.title));
      var bd=mk('div',n.body||'');mid.appendChild(bd);
      mid.appendChild(mk('small',relT(n.at)));
      row.appendChild(mid);
      row.addEventListener('click',function(){
        rpc('wd_notify_read',{p_id:n.id}).then(function(){pollBadges()});
        row.classList.remove('unread');
        if(n.kind==='friend'){try{closeModal('wd-nt')}catch(e){}openFriends('r')}
        else if(n.kind==='dm'&&n.ref){try{closeModal('wd-nt')}catch(e){}openDm(n.ref,'…');setTimeout(function(){var t=ST.dmOpen;if(t)fetchThread(true)},400)}
      });
      list.appendChild(row);
    });
  }).catch(function(){list.innerHTML='<div class="wd95-empty">اتصال برقرار نشد.</div>'});
  try{openModal('wd-nt')}catch(e){}
}

/* ---------- مسدودسازی با تأیید ---------- */
function wdConfirmBlock(uid,nick,done){
  try{
    if(typeof wdConfirm==='function'){wdConfirm('مسدودسازی '+nick+'؟ پیام‌هایش در چت هم پنهان می‌شود.',function(){
      rpc('wd_block_add',{p_uid:uid}).then(function(r){if(r&&r.ok){toast('مسدود شد','info');loadBlocks();if(done)done()}}).catch(function(){toast('انجام نشد','lose')});
    });return}
  }catch(e){}
  if(window.confirm('مسدودسازی '+nick+'؟')){
    rpc('wd_block_add',{p_uid:uid}).then(function(r){if(r&&r.ok){toast('مسدود شد','info');loadBlocks();if(done)done()}}).catch(function(){toast('انجام نشد','lose')});
  }
}

/* ---------- کارت فشرده بازیکن (کلیک روی نام در چت/لیست‌ها) ---------- */
function nickFromEl(el){
  var out='';
  for(var i=0;i<el.childNodes.length;i++){
    var n=el.childNodes[i];
    if(n.nodeType===3)out+=n.textContent;
  }
  return out.trim();
}
D.addEventListener('click',function(ev){
  try{
    var t=ev.target;
    if(t.closest&&t.closest('.wd95-cardp'))return;
    var nickEl=t.closest?t.closest('.wd28-nick'):null;
    if(!nickEl)return;
    var nick=nickFromEl(nickEl);
    if(!nick||nick.length>40)return;
    var existing=$('wd95-cardp');if(existing)existing.remove();
    var card=D.createElement('div');card.id='wd95-cardp';card.className='wd95-cardp';
    card.innerHTML='<div class="wd95-empty">…</div>';
    D.body.appendChild(card);
    var r=nickEl.getBoundingClientRect();
    var top=Math.min(window.innerHeight-300,Math.max(60,r.bottom+6));
    var left=Math.min(window.innerWidth-290,Math.max(8,r.left-40));
    card.style.top=top+'px';card.style.left=left+'px';
    setTimeout(function(){
      function off(ev2){if(!ev2.target.closest||!ev2.target.closest('#wd95-cardp')){var c=$('wd95-cardp');if(c)c.remove();D.removeEventListener('click',off)}}
      setTimeout(function(){D.addEventListener('click',off)},50);
    },0);
    rpc('wd_profile',{p_nick:nick,p_server:mySrv()}).then(function(p){
      var c=$('wd95-cardp');if(!c)return;
      if(!p||!p.ok){c.innerHTML='<div class="wd95-empty">پیدا نشد</div>';return}
      c.innerHTML='';
      var head=D.createElement('div');head.className='wd95-prof-head';
      var av=mk('div',(p.nick||'؟').charAt(0).toUpperCase(),'wd95-ava');
      av.style.cssText+=';width:44px;height:44px;font-size:17px;background:linear-gradient(135deg,hsl('+avColor(p.nick)+',65%,45%),hsl('+((avColor(p.nick)+50)%360)+',70%,35%))';
      var dot=mk('i','');dot.className='wd95-dot '+(p.presence.state==='online'?'on':p.presence.state==='idle'?'idle':'off');av.appendChild(dot);
      var mid=mk('div','','wd95-mid');mid.appendChild(mk('b',p.nick));
      mid.appendChild(mk('small',(p.presence.state==='online'?'🟢 آنلاین':p.presence.state==='idle'?'🟡 دور از تبع':'🔴 آفلاین')+' • '+p.ladder.title));
      if(p.alliance){mid.appendChild(mk('small','🛡️ ['+p.alliance.tag+']'))}
      head.append(av,mid);c.appendChild(head);
      var rk=D.createElement('div');rk.className='wd95-ranks';
      function rc(ico,v,l){var d2=mk('div','','wd95-rank');d2.innerHTML=WDSI_ICON(ico,16);d2.appendChild(mk('b',v==null?'—':'#'+fa(v)));d2.appendChild(mk('small',l));return d2}
      rk.append(rc('sword',p.ranks.military,'نظامی'),rc('hof',p.ranks.economy,'اقتصاد'),rc('medal',p.ranks.olympics,'المپیاد'));
      c.appendChild(rk);
      var acts=D.createElement('div');acts.className='wd95-actions';acts.style.marginTop='8px';
      var pb=mk('button','','wd95-act');pb.innerHTML=WDSI_ICON('user',15)+'<span> پروفایل</span>';
      pb.addEventListener('click',function(){var c2=$('wd95-cardp');if(c2)c2.remove();openProfile(null,p.uid,p.nick)});
      var mb=mk('button','','wd95-act pri');mb.innerHTML=WDSI_ICON('msg',15)+'<span> پیام</span>';
      mb.addEventListener('click',function(){var c2=$('wd95-cardp');if(c2)c2.remove();openDm(p.uid,p.nick)});
      var fb=mk('button','','wd95-act');fb.innerHTML=WDSI_ICON('users',15)+'<span> دوست</span>';
      fb.addEventListener('click',function(){rpc('wd_friend_add',{p_uid:p.uid}).then(function(x){
        if(!x||!x.ok){toast(x&&x.error==='blocked'?'مسدود هستید':'انجام نشد','lose');return}
        toast(x.status==='accepted'?'دوستی برقرار شد ✓':'درخواست ارسال شد ✓','win');pollBadges();
        var c2=$('wd95-cardp');if(c2)c2.remove();
      })});
      acts.append(pb,mb,fb);c.appendChild(acts);
    }).catch(function(){var c=$('wd95-cardp');if(c)c.innerHTML='<div class="wd95-empty">خطا</div>'});
  }catch(e){}
});

/* ---------- اکشن‌های سریع نقشه (VIEW PROFILE / MESSAGE / FRIEND / ATTACK) ---------- */
try{
  (function regMapHook(){
    if(typeof window.WD_CLICK_HOOKS==='undefined'){setTimeout(regMapHook,800);return}
    window.WD_CLICK_HOOKS.post.push(function(f){
      try{
        var n=f&&f.properties&&f.properties.name;
        var o=(typeof window.OTH!=='undefined')&&window.OTH&&window.OTH[n];
        if(!o)return;
        var d=$('drawer-actions');if(!d)return;
        if(d.querySelector('.wd95-maprow'))return;
        var row=D.createElement('div');row.className='wd95-maprow';
        function act(ico,txt,fn,cls){
          var b=mk('button','','wd95-act '+(cls||''));b.innerHTML=WDSI_ICON(ico,15)+'<span> '+txt+'</span>';
          b.addEventListener('click',fn);return b;
        }
        row.appendChild(act('user','پروفایل',function(){ST.profOpen={country:n};openProfile(null,null,o.nick)}));
        row.appendChild(act('msg','پیام',function(){openDmByNickSafe(o.nick)}));
        row.appendChild(act('dove','دیپلماسی',function(){ST.profOpen={country:n};openProfile(null,null,o.nick)}));
        d.insertBefore(row,d.firstChild);
      }catch(e){}
    });
  })();
}catch(e){}
function openDmByNickSafe(nick){
  rpc('wd_profile',{p_nick:nick,p_server:mySrv()}).then(function(p){
    if(p&&p.ok)openDm(p.uid,p.nick);else toast('پروفایل پیدا نشد','lose');
  }).catch(function(){toast('اتصال برقرار نشد','lose')});
}

/* ---------- بوت ---------- */
function boot(){
  ensureFab();
  refreshSrvs();
  hbWatch();
  setTimeout(function(){if(myUid()){pollBadges();loadBlocks()}},1200);
}
if(D.readyState==='complete')boot();else window.addEventListener('load',boot);
setTimeout(boot,2500);
window.WDSI={openProfile:openProfile,openInbox:openInbox,openFriends:openFriends,openNotifs:openNotifs,openDm:openDm,icon:WDSI_ICON};
/* ---------- آداپتور WDS — قلاب‌های موجود index.html (چیپ سرور، ردیف‌های چت) ---------- */
window.WDS={
  srvLabel:function(){var onl=ST.onl[mySrv()]||0;return '🖥️ سرور '+mySrv()+' • '+fad(onl)+' آنلاین'},
  servers:function(){openSrvSelector()},
  profile:function(uid,nick){openProfile(null,uid,nick)},
  dm:function(uid,nick){openDm(uid,nick)}, /* V107: پیوی از کشوی کشور */
  dm:function(uid,nick){openDm(uid,nick)}, /* V107: پیوی از کشوی کشور */
  dm:function(uid,nick){openDm(uid,nick)}, /* V107: پیوی از کشوی کشور */
  av:function(nick,cls){var hh=avColor(nick);return '<span class="wds-av '+(cls||'wds-av-s')+'" style="background:linear-gradient(135deg,hsl('+hh+',65%,45%),hsl('+((hh+50)%360)+',70%,35%))">'+String(nick||'؟').charAt(0).toUpperCase()+'</span>'},
  dot:function(st){return '<i class="wds-dot'+(st==='online'?' wds-dot-online':st==='idle'?' wds-dot-away':'')+'"'+(st==='online'||st==='idle'?'':' style="background:#5a6b80"')+'></i>'},
  sym:function(name,size){var px=size||20;return '<svg class="wds-ic" width="'+px+'" height="'+px+'" aria-hidden="true"><use href="#i-'+name+'"/></svg>'}
};
/* ---------- V96: قلاب صفحه‌ی سینمایی سرور (index.html) — آنلاین واقعی هر سرور ---------- */
window.WDSI_SRV={
  refresh:function(){refreshSrvs()},
  online:function(k){return ST.onl[k]!=null?ST.onl[k]:(ST.srvs&&ST.srvs[k]?ST.srvs[k].online:null)},
  status:function(k){return srvStatusOf(k)},
  paint:function(){renderLive()}
};
})();

