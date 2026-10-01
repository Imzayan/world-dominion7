/* ==================================================================
   V99 — مشاور ارشد «آرمان» — نسخه‌ی کامل و حرفه‌ای (Advisor System 2)
   - ۱۲ فصل کامل آموزش (از قانون طلایی تا روزانه‌ی رهبر پیروز)
   - کارت «وضعیت الان تو» از داده‌ی واقعی بازی (زنده در هر باز شدن)
   - دکمه‌ی هوشمند «کار بعدی من» — اولین قدم درست، همیشه جلوی چشم
   - نوار پیشرفت آموزش + هایلایت سینماییِ بخش واقعی UI + حباب تایپ‌شونده
   - مشاور حکومت قدیمی (wd-advisor) کامل حذف شد — فقط آرمان
   - فقط CSS/JS سمت کلاینت؛ صفر تغییر دیتابیس؛ سازگار با نسخه‌های قبل
   ================================================================== */
(function(){
'use strict';
var D=document;
function $(id){return D.getElementById(id)}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fad(n){try{return String(n).replace(/[0-9]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[+d]})}catch(e){return String(n)}}
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function myUid(){return (typeof ACC!=='undefined'&&ACC&&ACC.uid)?ACC.uid:'guest'}
function reduced(){try{return window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){return false}}

/* ---------- آواتار مشاور (رجیستری SVG — بدون ایموجی خام) ---------- */
var AVATAR='<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+
 '<defs>'+
 '<radialGradient id="w99bg" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="#1d4166"/><stop offset=".6" stop-color="#0e2745"/><stop offset="1" stop-color="#081a30"/></radialGradient>'+
 '<linearGradient id="w99ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6f1a"/></linearGradient>'+
 '<linearGradient id="w99coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26394f"/><stop offset="1" stop-color="#111e30"/></linearGradient>'+
 '<linearGradient id="w99skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3cba4"/><stop offset="1" stop-color="#dda87a"/></linearGradient>'+
 '</defs>'+
 '<circle cx="32" cy="32" r="30" fill="url(#w99bg)"/>'+
 '<circle cx="32" cy="32" r="30" fill="none" stroke="url(#w99ring)" stroke-width="2.4"/>'+
 '<circle cx="32" cy="32" r="26.6" fill="none" stroke="rgba(255,214,120,.25)" stroke-width=".8"/>'+
 '<path d="M8.5 58.5 C10.5 46.5 20.5 42 32 42 C43.5 42 53.5 46.5 55.5 58.5 Z" fill="url(#w99coat)"/>'+
 '<rect x="10" y="45" width="9.4" height="4.6" rx="2.2" fill="#e9b64e"/><rect x="44.6" y="45" width="9.4" height="4.6" rx="2.2" fill="#e9b64e"/>'+
 '<path d="M26.6 42.4 32 49.4 37.4 42.4 Z" fill="#e9eef6"/>'+
 '<path d="M30.9 43.6 33.1 43.6 34.2 49.6 32 51.6 29.8 49.6 Z" fill="#7d2f3a"/>'+
 '<rect x="28.9" y="36.4" width="6.2" height="6.4" rx="2.2" fill="#d5a276"/>'+
 '<ellipse cx="32" cy="27.2" rx="9.6" ry="10.6" fill="url(#w99skin)"/>'+
 '<path d="M22.4 26.4 C22 18.4 27 14.6 32 14.6 C37 14.6 42 18.4 41.6 26.4 C39 21.2 36.2 19.6 32 19.6 C27.8 19.6 25 21.2 22.4 26.4 Z" fill="#39404c"/>'+
 '<path d="M22.4 25.4 C22.7 21.8 24 19.8 25.6 18.6 L26.7 20.7 C25.2 21.9 24.1 23.4 23.6 26 Z" fill="#c3ccd8"/>'+
 '<path d="M41.6 25.4 C41.3 21.8 40 19.8 38.4 18.6 L37.3 20.7 C38.8 21.9 39.9 23.4 40.4 26 Z" fill="#c3ccd8"/>'+
 '<path d="M24 28.6 C24 35.6 27.4 38.8 32 38.8 C36.6 38.8 40 35.6 40 28.6 C37.4 32.8 35.4 33.8 32 33.8 C28.6 33.8 26.6 32.8 24 28.6 Z" fill="#39404c" opacity=".94"/>'+
 '<circle cx="28.4" cy="26.6" r="1.15" fill="#14212f"/><circle cx="35.6" cy="26.6" r="1.15" fill="#14212f"/>'+
 '<path d="M27.2 31.6 C29 33.2 35 33.2 36.8 31.6" fill="none" stroke="#8a5a3c" stroke-width="1" stroke-linecap="round"/>'+
 '</svg>';

/* ---------- آیکون‌های فصل‌ها (SVG ۲۴px — بدون ایموجی خام) ---------- */
var CHIC={
 compass:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#ffd75e" stroke-width="1.6"/><path d="M15.5 8.5 13.4 13.4 8.5 15.5 10.6 10.6 Z" fill="#ffd75e"/><circle cx="12" cy="12" r="1.1" fill="#0b1626"/></svg>',
 land:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 8.5 9 13 15.5 16.5 10.5 20 20 Z" fill="#7dff9e" opacity=".9"/><path d="M12 4v6M12 4l5 1.6-5 1.8" fill="none" stroke="#ffd75e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 coin:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="#ffd75e" stroke="#a8720a" stroke-width="1.1"/><path d="M12 7.4v9.2M9.6 9.4c0-1 1-1.7 2.4-1.7s2.4.7 2.4 1.7-1 1.4-2.4 1.7c-1.4.3-2.4.8-2.4 1.8s1 1.7 2.4 1.7 2.4-.7 2.4-1.7" fill="none" stroke="#8a5a00" stroke-width="1.3" stroke-linecap="round"/></svg>',
 shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 19.4 6v5.6c0 4.6-3 8-7.4 9.4-4.4-1.4-7.4-4.8-7.4-9.4V6Z" fill="rgba(125,214,255,.18)" stroke="#7dd6ff" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.8 11.8l2.2 2.2 4.2-4.4" fill="none" stroke="#7dff9e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 market:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.4h16" stroke="#ffd75e" stroke-width="1.5" stroke-linecap="round"/><path d="M5.4 15.8l3.6-4 3 2.4 5-5.8" fill="none" stroke="#7dff9e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 8.4h-3.2M17 8.4v3.2" stroke="#7dff9e" stroke-width="1.6" stroke-linecap="round"/><circle cx="7" cy="9.4" r="1.7" fill="#ffd75e" opacity=".9"/><circle cx="12" cy="6" r="1.3" fill="#ffe6a8" opacity=".7"/></svg>',
 dove:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13.4c2.4-4.8 7-7.2 12-6l3.4-2.4-.6 3.8c1 .6 1.4 1.3 1.2 2.2-2-.3-3.2 0-4.4 1.2-2.2 2.2-6 2.8-8.8 2.2L4 16.8v-3.4z" fill="#bfe9ff" stroke="#6da6cf" stroke-width=".7"/><circle cx="16.2" cy="8.2" r=".8" fill="#2b5a86"/></svg>',
 flask:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3.6h4M10.8 3.6v5L5.6 18a2 2 0 0 0 1.8 3h9.2a2 2 0 0 0 1.8-3L13.2 8.6v-5" fill="none" stroke="#8fd8ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 15.5h8" stroke="#39e6d0" stroke-width="1.8" stroke-linecap="round"/></svg>',
 flag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20.4V4.2" stroke="#ffd75e" stroke-width="1.7" stroke-linecap="round"/><path d="M6 4.8c2.2-1.2 4.2-1.2 6.2 0s4 1.2 5.8.2v7c-1.8 1-3.8 1-5.8-.2s-4-1.2-6.2 0" fill="rgba(125,255,158,.2)" stroke="#7dff9e" stroke-width="1.6" stroke-linejoin="round"/></svg>',
 medal:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14.6" r="5.4" fill="#ffcf4d" stroke="#a8720a" stroke-width=".9"/><path d="m8.6 3.4 3.4 6.4L15.4 3.4" fill="none" stroke="#4a9fd8" stroke-width="2.2" stroke-linecap="round"/><path d="M12 11.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#8a5a00"/></svg>',
 tax:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.6 9.6 12 4.4l7.4 5.2" fill="none" stroke="#ffd75e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.4 10.6v8.6h11.2v-8.6" fill="none" stroke="#ffe6a8" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 19.2v-4.4h4v4.4" fill="rgba(255,215,94,.25)" stroke="#ffd75e" stroke-width="1.3" stroke-linejoin="round"/></svg>',
 sun:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="#ffd75e" stroke="#a8720a" stroke-width=".9"/><g stroke="#ffe6a8" stroke-width="1.5" stroke-linecap="round"><path d="M12 3.2v2.2M12 18.6v2.2M3.2 12h2.2M18.6 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6"/></g></svg>',
 star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 14.4 9l6.2.4-4.8 4 1.6 6-5.4-3.4L6.6 19.4l1.6-6-4.8-4L9.6 9Z" fill="#ffd75e" stroke="#a8720a" stroke-width=".8"/></svg>',
 grad:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 9.4 12 5l9.2 4.4L12 13.8Z" fill="#ffd75e"/><path d="M6.4 11.4v4.2c0 1.5 2.6 2.9 5.6 2.9s5.6-1.4 5.6-2.9v-4.2" fill="none" stroke="#ffe6a8" stroke-width="1.5"/><path d="M21.2 9.6v5" stroke="#ffd75e" stroke-width="1.5" stroke-linecap="round"/></svg>'
};
/* آیکون‌های کوچک کارت وضعیت زنده (۱۴px) */
var LIVE_IC={
 cap:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.6 10 12 4.8 19.4 10" fill="none" stroke="#ffd75e" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.6 11v8h10.8v-8" fill="none" stroke="#ffe6a8" stroke-width="1.4"/></svg>',
 map:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 6.4 9 4.4l6 2 5.4-2v13.2l-5.4 2-6-2-5.4 2Z" fill="none" stroke="#7dff9e" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 4.4v13.2M15 6.4v13.2" stroke="#7dff9e" stroke-width="1" opacity=".7"/></svg>',
 oil:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6c3 3.8 5.4 6.8 5.4 9.8a5.4 5.4 0 1 1-10.8 0c0-3 2.4-6 5.4-9.8Z" fill="rgba(143,216,255,.2)" stroke="#8fd8ff" stroke-width="1.5"/></svg>',
 army:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.4 18.8 7v4.6c0 3.8-2.8 6.6-6.8 7.8-4-1.2-6.8-4-6.8-7.8V7Z" fill="none" stroke="#c9d8ec" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.4 12h5.2" stroke="#c9d8ec" stroke-width="1.5" stroke-linecap="round"/></svg>',
 build:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M6 20V9l6-4 6 4v11" fill="none" stroke="#ffd75e" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 20v-5h4v5" fill="none" stroke="#ffe6a8" stroke-width="1.3"/></svg>',
 gift:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.4" y="9.6" width="15.2" height="10.4" rx="1.6" fill="rgba(255,215,94,.2)" stroke="#ffd75e" stroke-width="1.4"/><path d="M4.4 13h15.2M12 9.6V20" stroke="#ffd75e" stroke-width="1.2"/><path d="M8.6 9.4a2.2 2.2 0 1 1 3.4-2.6 2.2 2.2 0 1 1 3.4 2.6" fill="none" stroke="#ffe6a8" stroke-width="1.3"/></svg>',
 ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="rgba(125,255,158,.14)" stroke="#7dff9e" stroke-width="1.4"/><path d="M8.4 12.2l2.4 2.4 4.8-5" fill="none" stroke="#7dff9e" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* ---------- CSS ---------- */
var css=[
'.wd98-ov{position:fixed;inset:0;z-index:10052;display:flex;align-items:center;justify-content:center;padding:14px;',
 'background:rgba(2,8,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:wd98in .2s ease-out}',
'@keyframes wd98in{from{opacity:0}to{opacity:1}}',
'.wd98-hub{width:min(94vw,430px);max-height:86dvh;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;',
 'background:linear-gradient(168deg,rgba(12,30,54,.98),rgba(4,12,26,.99));border:1px solid rgba(255,208,90,.4);',
 'box-shadow:0 24px 60px rgba(0,0,0,.7),0 0 34px rgba(255,196,70,.16),inset 0 1px 0 rgba(255,244,214,.28);animation:wd98up .28s cubic-bezier(.22,1,.36,1)}',
'@keyframes wd98up{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}',
'.wd98-hub .wd98-hero{display:flex;align-items:center;gap:12px;padding:15px 15px 12px;border-bottom:1px solid rgba(255,208,90,.22);',
 'background:radial-gradient(circle at 85% 20%,rgba(255,196,70,.13),transparent 55%)}',
'.wd98-hero .wd98-ava{width:66px;height:66px;flex:0 0 auto;border-radius:50%;',
 'filter:drop-shadow(0 0 14px rgba(255,200,80,.45));animation:wd98brth 3.4s ease-in-out infinite}',
'@keyframes wd98brth{0%,100%{filter:drop-shadow(0 0 10px rgba(255,200,80,.35))}50%{filter:drop-shadow(0 0 20px rgba(255,200,80,.6))}}',
'.wd98-hero .wd98-ht{flex:1;min-width:0}',
'.wd98-hero .wd98-name{font-size:15px;font-weight:900;background:linear-gradient(120deg,#ffe9b0,#ffd75e 55%,#e2a83a);',
 '-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:none;letter-spacing:.2px}',
'.wd98-hero .wd98-role{font-size:9.5px;font-weight:800;color:#9fc8e8;margin-top:2px;letter-spacing:.4px}',
'.wd98-hero .wd98-quote{font-size:10px;color:#cfe0f2;line-height:1.8;margin-top:5px}',
/* نوار پیشرفت آموزش */
'.wd98-hub .wd98-prog{margin:10px 14px 0}',
'.wd98-hub .wd98-pt{font-size:9px;font-weight:900;color:#9fc8e8;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center}',
'.wd98-hub .wd98-pt b{color:#ffd75e}',
'.wd98-hub .wd98-pb{height:6px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.4)}',
'.wd98-hub .wd98-pb i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#e2b04a,#ffd75e);',
 'box-shadow:0 0 9px rgba(255,200,70,.6);transition:width .5s cubic-bezier(.22,1,.36,1)}',
/* دکمه‌ی هوشمند «کار بعدی من» */
'.wd98-hub .wd98-nexta{margin:9px 14px 0;display:none}',
'.wd98-hub .wd98-nexta.on{display:flex}',
'.wd98-hub .wd98-nexta button{flex:1;min-height:44px;border-radius:13px;border:1px solid rgba(255,224,140,.55);cursor:pointer;',
 'font-family:inherit;font-size:11.5px;font-weight:900;color:#241500;background:linear-gradient(135deg,#b9861f,#e2b04a);',
 'box-shadow:0 6px 16px rgba(226,176,74,.35),inset 0 1px 0 rgba(255,250,220,.5);display:flex;align-items:center;justify-content:center;gap:7px;transition:transform .14s}',
'.wd98-hub .wd98-nexta button:active{transform:scale(.97)}',
'.wd98-hub .wd98-nexta svg{width:16px;height:16px;flex:0 0 auto}',
/* کارت وضعیت زنده */
'.wd98-hub .wd98-live{margin:9px 14px 0;padding:10px 12px;border-radius:14px;border:1px solid rgba(90,220,255,.3);',
 'background:linear-gradient(160deg,rgba(8,34,58,.72),rgba(6,18,36,.82))}',
'.wd98-hub .wd98-lv-h{font-size:11px;font-weight:900;color:#aee6ff;display:flex;align-items:center;gap:7px;letter-spacing:.2px}',
'.wd98-hub .wd98-lv-h small{font-size:8px;color:#7d98b4;font-weight:800;margin-inline-start:auto}',
'.wd98-hub .wd98-lv-row{display:flex;gap:7px;align-items:flex-start;margin-top:7px;font-size:10.5px;line-height:1.75;color:#d5ecff}',
'.wd98-hub .wd98-lv-row svg{width:15px;height:15px;flex:0 0 auto;margin-top:2px;filter:drop-shadow(0 0 4px rgba(140,220,255,.45))}',
'.wd98-hub .wd98-lv-row b{color:#ffd75e}',
'.wd98-hub .wd98-lv-ok{color:#8dffc4}',
'.wd98-hub .wd98-list{overflow-y:auto;overscroll-behavior:contain;padding:9px 9px 4px;display:flex;flex-direction:column;gap:7px}',
'.wd98-chap{display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:14px;text-align:right;cursor:pointer;width:100%;',
 'border:1px solid rgba(130,200,255,.16);background:rgba(10,28,52,.55);transition:transform .15s,border-color .2s,background .2s;font-family:inherit}',
'.wd98-chap:hover{background:rgba(16,44,78,.65);border-color:rgba(255,208,90,.35)}',
'.wd98-chap:active{transform:scale(.98)}',
'.wd98-chap .wd98-cic{width:38px;height:38px;min-width:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;',
 'background:radial-gradient(circle at 32% 24%,rgba(255,220,130,.2),rgba(30,60,100,.5));border:1px solid rgba(255,208,90,.3)}',
'.wd98-chap .wd98-cic svg{width:22px;height:22px}',
'.wd98-chap .wd98-cmid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}',
'.wd98-chap .wd98-ct{font-size:12px;font-weight:900;color:#f2f8ff}',
'.wd98-chap .wd98-cd{font-size:9.5px;color:#93b4d4;line-height:1.6}',
'.wd98-chap .wd98-cst{flex:0 0 auto;font-size:8.5px;font-weight:900;padding:3px 8px;border-radius:99px;',
 'color:#8fb4d4;border:1px solid rgba(140,180,220,.3);background:rgba(8,20,38,.6)}',
'.wd98-chap.done{border-color:rgba(70,230,160,.4)}',
'.wd98-chap.done .wd98-cst{color:#8dffc4;border-color:rgba(70,230,160,.5);background:rgba(8,44,30,.6)}',
'.wd98-chap.done .wd98-cic{border-color:rgba(70,230,160,.5)}',
'.wd98-hub .wd98-note{padding:9px 14px 12px;font-size:9px;color:#7fa4c6;text-align:center;border-top:1px solid rgba(130,200,255,.12)}',
'.wd98-close{position:absolute;top:10px;inset-inline-start:12px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(140,190,240,.3);',
 'background:rgba(8,22,42,.7);color:#cfe4f8;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}',
/* ---------- گاید (بازی روایی) ---------- */
'.wd98-catch{position:fixed;inset:0;z-index:10040;background:transparent}',
'.wd98-spot{position:fixed;z-index:10041;pointer-events:none;border-radius:14px;border:2px solid rgba(255,208,90,.9);',
 'box-shadow:0 0 0 2000px rgba(3,10,20,.62),0 0 22px rgba(255,196,70,.5),inset 0 0 14px rgba(255,196,70,.18);',
 'transition:top .3s cubic-bezier(.22,1,.36,1),left .3s cubic-bezier(.22,1,.36,1),width .3s,height .3s;display:none}',
'.wd98-bub{position:fixed;z-index:10042;width:min(86vw,360px);border-radius:18px;overflow:hidden;display:none;flex-direction:column;',
 'background:linear-gradient(165deg,rgba(13,32,58,.98),rgba(5,14,28,.99));border:1px solid rgba(255,208,90,.5);',
 'box-shadow:0 18px 44px rgba(0,0,0,.66),0 0 26px rgba(255,196,70,.2),inset 0 1px 0 rgba(255,244,214,.3);',
 'animation:wd98up .26s cubic-bezier(.22,1,.36,1)}',
'.wd98-bub .wd98-bh{display:flex;align-items:center;gap:9px;padding:9px 12px;border-bottom:1px solid rgba(255,208,90,.2);',
 'background:radial-gradient(circle at 90% 10%,rgba(255,196,70,.14),transparent 60%)}',
'.wd98-bub .wd98-bava{width:42px;height:42px;min-width:42px;border-radius:50%;filter:drop-shadow(0 0 9px rgba(255,200,80,.5))}',
'.wd98-bub .wd98-bname{font-size:11px;font-weight:900;color:#ffe2a0;letter-spacing:.2px}',
'.wd98-bub .wd98-brole{font-size:8px;color:#9fc8e8;font-weight:800;letter-spacing:.3px}',
'.wd98-bub .wd98-bstep{margin-inline-start:auto;font-size:8.5px;font-weight:900;color:#8fb4d4;border:1px solid rgba(140,180,220,.28);',
 'border-radius:99px;padding:3px 9px;background:rgba(8,20,38,.6);white-space:nowrap}',
'.wd98-bub .wd98-bmid{padding:11px 13px 7px}',
'.wd98-bub .wd98-bh2{font-size:13.5px;font-weight:900;color:#ffe2a0;margin-bottom:6px}',
'.wd98-bub .wd98-btx{font-size:11.5px;line-height:2;color:#e4f0fb;min-height:44px;cursor:pointer}',
'.wd98-bub .wd98-caret{display:inline-block;width:7px;height:13px;background:#ffd75e;margin-inline-start:3px;vertical-align:-2px;',
 'animation:wd98blink .8s steps(1) infinite;box-shadow:0 0 7px rgba(255,205,90,.9)}',
'@keyframes wd98blink{50%{opacity:0}}',
'.wd98-bub .wd98-dots{display:flex;gap:5px;justify-content:center;padding:4px 0 2px}',
'.wd98-bub .wd98-dots i{width:6px;height:6px;border-radius:50%;background:rgba(140,180,220,.3);transition:background .2s,transform .2s}',
'.wd98-bub .wd98-dots i.on{background:#ffd75e;box-shadow:0 0 7px rgba(255,205,90,.8);transform:scale(1.15)}',
'.wd98-bub .wd98-bf{display:flex;gap:7px;padding:9px 11px;border-top:1px solid rgba(130,200,255,.14)}',
'.wd98-btn{flex:1;min-height:44px;border-radius:12px;border:1px solid rgba(130,200,255,.28);cursor:pointer;font-family:inherit;',
 'font-size:11.5px;font-weight:900;color:#cfe4f8;background:rgba(10,26,48,.7);transition:transform .14s,background .2s;display:flex;align-items:center;justify-content:center;gap:6px}',
'.wd98-btn:active{transform:scale(.95)}',
'.wd98-btn.pri{background:linear-gradient(135deg,#b9861f,#e2b04a);border-color:rgba(255,224,140,.6);color:#241500;text-shadow:none;',
 'box-shadow:0 6px 16px rgba(226,176,74,.35),inset 0 1px 0 rgba(255,250,220,.5)}',
'.wd98-btn.ghost{flex:0 0 auto;min-width:74px}',
'.wd98-bub.wd98-fine .wd98-bava{animation:wd98cheer .6s ease-in-out 2}',
'@keyframes wd98cheer{0%,100%{transform:rotate(0)}30%{transform:rotate(-8deg) scale(1.06)}65%{transform:rotate(8deg) scale(1.06)}}',
/* دکمه‌ی داک مشاور */
'#wd98-b-adv{--a3:rgba(255,204,64,.7);--glow:rgba(255,190,50,.45);--glow2:rgba(255,205,80,.8);--icg:rgba(255,220,130,1);',
 'background:radial-gradient(circle at 30% 22%,rgba(255,210,110,.22),transparent 58%),linear-gradient(165deg,#4a3410,#1c1206)}',
'#wd98-b-adv svg{width:21px;height:21px;filter:drop-shadow(0 0 6px rgba(255,214,110,.95))}',
'#wd98-b-adv.wd98-ur{animation:wd98urge 1.8s ease-in-out infinite}',
'@keyframes wd98urge{0%,100%{box-shadow:0 4px 12px rgba(0,0,0,.45),0 0 12px rgba(255,190,50,.45),inset 0 1px 0 rgba(255,250,220,.2)}',
 '50%{box-shadow:0 4px 14px rgba(0,0,0,.45),0 0 30px rgba(255,205,80,.85),0 0 54px rgba(255,190,50,.3),inset 0 1px 0 rgba(255,250,220,.3)}}',
'body.wg-ov .wd98-ava,body.wg-ov #wd98-b-adv.wd98-ur,body.wg-ov .wd98-bub .wd98-btx .wd98-caret{animation-play-state:paused!important}',
'@media(prefers-reduced-motion:reduce){.wd98-ava,.wd98-bava,#wd98-b-adv.wd98-ur,.wd98-bub,.wd98-hub,.wd98-ov{animation:none!important}.wd98-spot{transition:none!important}.wd98-hub .wd98-pb i{transition:none!important}}',
'@media(max-width:560px){.wd98-hero .wd98-quote{display:none}.wd98-chap .wd98-cd{display:none}}'
].join('');
if(!$('wd98-css')){var st=D.createElement('style');st.id='wd98-css';st.textContent=css;D.head.appendChild(st)}

/* ---------- دروس (۱۲ فصل — کامل‌ترین آموزش بازی) ---------- */
var LESSONS=[
 {id:'ch0',ic:'compass',t:'قانون طلایی',d:'صلح مقدس دو روز اول + روح بازی',
  steps:[
   {h:'سلام، فرمانده!',b:'من «آرمان» هستم — مشاور ارشد تو در WORLD DOMINION. سال‌هاست شکوه و سقوط امپراتوری‌ها را از نزدیک دیده‌ام. از امروز هر قدم را با هم برمی‌داریم؛ تو فرمان می‌دهی، من راه را نشان می‌دهم.'},
   {h:'صلح مقدسِ دو روز',b:'قانون اولِ جهان: دو روز اولِ هر رهبر تازه، صلح مقدس است. در این دو روز هیچ‌کس نمی‌تواند به تو حمله کند — و تو هم به هیچ‌کس. دست‌هایت برای ساختن آزاد است، نه برای سوزاندن.'},
   {h:'این فقط جنگ نیست',b:'WORLD DOMINION یک بازی جهانی است: اقتصاد، دیپلماسی، علم، ورزش و افتخار. چشم ببند و تصور کن واقعاً رهبر یک کشوری — هر تصمیم تو، صفحه‌ای از تاریخ آن کشور است.'},
   {h:'از رهبری لذت ببر',b:'عجله نکن. نقشه را ورق بزن، جهان را ببین، کشورت را بساز. من همیشه همین‌جام — هر وقت خواستی از دکمه‌ی مشاور در داک پایین صفحه صدایم کن.'}
  ]},
 {id:'ch1',ic:'land',t:'کشورت را بساز',d:'منابع، قلمرو، پایتخت',
  steps:[
   {sel:'.resource-group',h:'تابلوی فرمانروایی',b:'طلا، غذا، نفت و ارتش — خونِ امپراتوری تو همین چهار عدد است. خودشان رشد می‌کنند؛ با مالیات و بازار شتابشان بده.'},
   {sel:'#wd87-b-terr',h:'امپراتوری تو',b:'اینجا رتبه‌ی جهانی‌ات است. روی نقشه، کشورها را تصاحب کن؛ پایتخت اول، قلب امپراتوری‌ات است — محافظتش کن.'},
   {h:'دو روز، یک هدف',b:'در روزهای صلح، معادله ساده است: زمین بیشتر، خزانه پرتر، مردم شادتر. هر کشور تازه یعنی درآمد بیشتر برای همه‌ی آینده‌ات.'}
  ]},
 {id:'ch2',ic:'coin',t:'اقتصاد — قدرت بی‌جنگ',d:'مالیات، جم، بازار جهانی',
  steps:[
   {sel:'#act-tax',h:'مالیات بگیر',b:'هر لحظه از مردمت مالیات می‌رسد. دکمه‌ی مالیات را بزن و خزانه را پر کن — رهبری که خزانه‌اش خالی است، فرمان هم نمی‌دهد.'},
   {sel:'#wd87-b-gem',h:'خزانه‌ی جم',b:'جم، سرمایه‌ی نادر توست: شتاب تولید، پک‌های ویژه و نشان‌های افتخار. با پاداش‌های روزانه و دستاورد جمعش کن.'},
   {h:'بازار جهانی',b:'در بازار زنده، طلا و نفت معامله می‌شود و عرضه و تقاضا قیمت را می‌سازد. رهبرِ زیرک گاهی از دادوستد بیشتر از جنگ سود می‌برد.'}
  ]},
 {id:'ch3',ic:'shield',t:'دفاع و استحکامات',d:'دیوار، نگهبان، آمادگی',
  steps:[
   {h:'دیوار مرزی',b:'هر سطح استحکامات مرزی، تلفات خودی در نبردها را کمتر می‌کند — تا سقف بیست درصد. ساختش با منابع است، نه جم؛ یعنی قدرت واقعی، نه خریدِ قدرت.'},
   {h:'همیشه نگهبان داشته باش',b:'کاملاً بی‌دفاع بودن یعنی دعوت به حمله. بخشی از ارتش را در خانه نگه دار؛ کشورِ محافظت‌شده، حساب‌وکتاب مهاجم را به‌هم می‌ریزد.'},
   {h:'دفاع، بخشی از حمله است',b:'فرماندهِ بزرگ قبل از هر یورش فکر می‌کند: اگر امروز من را بزنند چه؟ ژنرال دفاعی و استحکامات، پشتوانه‌ی هر رشدد هستند.'}
  ]},
 {id:'ch4',ic:'market',t:'بازار جهانی و تجارت',d:'عرضه و تقاضا، سفارش، معامله',
  steps:[
   {h:'قیمت‌ها زنده‌اند',b:'بازار مثل یک بورس واقعی کار می‌کند: هر چه بیشتر بخرند گران می‌شود، هر چه بیشتر بفروشند ارزان. کارمزد هر معامله دو تا سه درصد است — حساب‌شده معامله کن.'},
   {h:'سفارش محدود بگذار',b:'می‌توانی بگویی «وقتی قیمت به X رسید خودکار بخر». سفارش‌ها حتی وقتی آفلاینی بررسی می‌شوند — بازار هرگز نمی‌خوابد.'},
   {h:'معامله با رهبران دیگر',b:'در تب معامله‌ی بازار، پیشنهاد بگذار: نفت در برابر غذا. شراکتی که با اعتماد ساخته شود، دارایی‌ای است که هیچ ارتشی تصرفش نمی‌کند.'}
  ]},
 {id:'ch5',ic:'dove',t:'دیپلماسی — هنر فرمانروایی',d:'چت جهانی، سرورها، معامله',
  steps:[
   {h:'زبان، قوی‌ترین سپر',b:'در چت جهانی با امپراتورهای دیگر حرف بزن؛ پیمان ببند، دوست بگیر، اختلاف را با کلمه حل کن. خیلی از جنگ‌ها پیش از اولین شلیک برده می‌شوند.'},
   {sel:'#wd87-b-srv',h:'جهان‌های موازی',b:'بازی چند سرور دارد و هر سرور یک جهانِ زنده است. ببین همین حالا چه کسانی آنلاین‌اند، پروفایل‌شان را ببین و سلام کن — رهبر تنها نمی‌پیروزد.'},
   {h:'اعتبار، ارز پنهان',b:'معامله‌ی منصفانه، سلامِ محترمانه، وعده‌ی نگه‌داشته — اعتبار تو در چشم بقیه همان‌قدر ارزش دارد که ارتش تو. نام خوب، سپرِ بی‌هزینه است.'}
  ]},
 {id:'ch6',ic:'flask',t:'علم و ارتش',d:'فناوری، سرباز، ادبِ جنگ',
  steps:[
   {h:'فناوری، اختلاف را می‌سازد',b:'فناوری‌ها را بالا ببر: تولید سریع‌تر، دفاع محکم‌تر، حمله دقیق‌تر. کشوری که علم ندارد، با اولین باد سقوط می‌کند.'},
   {h:'ارتش برای دفاع و اقتدار',b:'با طلا و نفت سرباز، تانک و هواپیما بساز. ترکیبِ متعادل بونس «هم‌افزایی» می‌گیرد — تانک بدون پیاده، نصفِ خودش است. بعد از صلح دو روزه، جهان رقابتی می‌شود.'},
   {h:'ادبِ جنگ',b:'هر حمله طلا و نفت می‌برد و فرماندهِ بزرگ، لحظه‌ی حمله را انتخاب می‌کند: روزنامه را بخوان، ببین کی درگیر است، ضربه را جایی بزن که بیشترین اثر را دارد.'}
  ]},
 {id:'ch7',ic:'flag',t:'اتحاد و جنگ اتحاد',d:'پیمان، عملیات هفتگی، شکوه جمعی',
  steps:[
   {h:'اتحاد بپیوند یا بساز',b:'یک تن قوی است، اما یک اتحاد جاودانه است. در اتحاد، دشمنان پیش از حمله دو بار فکر می‌کنند — و دوستان، درها را باز می‌کنند.'},
   {h:'جنگ اتحاد — عملیات هفتگی',b:'هر هفته اتحاد تو هدفی دارد: امتیاز از فتح واقعی PvP، برد دوئل و المپیک. هدف کامل شود، خبرش به همه‌ی جهان می‌رود و جمِ جایزه به هر عضو می‌رسد.'},
   {h:'قدرتِ متحد',b:'در اتحاد، امتیاز هر کس برای همه است. رهبرِ خوب هم خودش می‌جنگد، هم انگیزه می‌دهد — نام اتحادش را با افتخار می‌سازد.'}
  ]},
 {id:'ch8',ic:'medal',t:'المپیک و بوکس — افتخار بی‌خون',d:'آتش‌بس مقدس، مدال، رینگ',
  steps:[
   {sel:'#hud-olympic',h:'استادیوم جهان',b:'المپیک جهانی! وقتی بازی‌ها شروع شود، آتش‌بس مقدس برقرار است: میدانِ جنگ تعطیل، استادیوم باز — حتی بزرگ‌ترین دشمنان روی یک باند می‌دوند.'},
   {h:'مدال، جاودانگی',b:'رشته‌ات را انتخاب کن، روزانه مسابقه بده و مدال جمع کن. قهرمان المپیک تاج ابدی کنار نامش می‌گیرد — جایی بالاتر از هر فاتحی.'},
   {h:'رینگ بوکس — دور آخر',b:'در استادیوم، کمپین بوکس هم منتظر توست: از سالن بارانی تا آرنای بزرگ، حریف‌های امضادار و تمرین‌های واقعی. مشت‌های تو، افتخار ملت توست.'}
  ]},
 {id:'ch9',ic:'tax',t:'مالیات و زیرساخت',d:'نرخ هوشمند، پالایشگاه، مخزن',
  steps:[
   {h:'نرخِ مالیات هوشمند',b:'در پنل مالیات نرخ را خودت تنظیم کن: بالای پانزده درصد مردم معترض می‌شوند و کشورهای ناراضی ممکن است شورش کنند. رهبرِ زیرک، شادی مردم را سرمایه می‌داند.'},
   {h:'زیرساخت، موتور رشد',b:'پالایشگاه = نفت بیشتر، کارخانه = آموزش سریع‌تر، پایگاه هوایی = نیروی هوایی قوی‌تر، مخزن = سقف ذخیره بالاتر. اول اقتصاد، بعد ارتش.'},
   {h:'انبار پر = هدررفت',b:'تولید نفت فقط تا فضای خالی مخزن ادامه دارد. انبار پر شود، تولید اضافه از دست می‌رود — مخزن را ارتقا بده یا در بازار بفروش.'}
  ]},
 {id:'ch10',ic:'sun',t:'روزانه‌ی رهبر پیروز',d:'عادت‌های روزانه‌ی امپراتورها',
  steps:[
   {h:'هدیه‌ی هر روز',b:'هر روز که وارد شوی، هدیه منتظرت است: جم و منابع. ورودِ روزانه پایه‌ی هر امپراتوری بزرگ است — ثبات از همین قدم کوچک شروع می‌شود.'},
   {h:'چک‌لیست فرمانده',b:'روزی پنج دقیقه: مالیات بگیر، ماموریت‌ها را تحویل بده، صف نیرو را پر کن، یک مسابقه‌ی المپیک بده، بازار را نگاه بینداز. پنج دقیقه‌ای تاریخ می‌سازد.'},
   {h:'ماموریت‌ها و پاداش‌ها',b:'کارت‌های ماموریت بالا و مسیر فصل، هر روز هدیه دارند. ماموریت‌ها را جدی بگیر — تجربه و طلای آن‌ها سوخت رشد توست.'}
  ]},
 {id:'ch11',ic:'star',t:'راه تو ادامه دارد',d:'ابزارها، فرماندهی، افتخار',
  steps:[
   {sel:'#wd7-btn',h:'جعبه‌ابزار فرماندهی',b:'این دکمه‌ی پایین صفحه همه‌چیز دارد: جنگ، اقتصاد، دیپلماسی، فناوری، نقشه و تاریخچه. هر وقت گم شدی، از همین‌جا شروع کن.'},
   {h:'رتبه‌بندی جهانی',b:'چهار دسته رقابت هست: کشورگشایی، نبردها، اقتصاد و استخدام. هر هفته سه نفرِ برتر هر دسته طلا می‌برند — سکو همیشه جای خالی دارد.'},
   {h:'فرماندهی از آنِ تو',b:'حالا جهانِ توست. کشور بساز، دوست بگیر، مدال بیاور — و اگر روزی لازم شد، با عزت بجنگ. من همیشه همین‌جام، فرمانده. تاریخ منتظر توست.'}
  ]}
];

/* ---------- وضعیت ---------- */
var ST={ls:null,ch:0,step:0,typing:null,mode:null,spotTarget:null,repT:0};
function load(){ST.ls=lsGet('wd98adv_'+myUid())||{seen:false,done:{}}}
function save(){lsSet('wd98adv_'+myUid(),ST.ls)}
function isDone(id){return !!(ST.ls&&ST.ls.done&&ST.ls.done[id])}
function doneCount(){var n=0,k;if(ST.ls&&ST.ls.done)for(k in ST.ls.done)if(ST.ls.done[k])n++;return n}

/* ---------- وضعیت زنده (از داده‌ی واقعی بازی) ---------- */
var FIX_OF={};
function liveStatus(){
  var out=[];
  function push(ic,html,fix){out.push({ic:ic,h:html,fix:fix||null})}
  try{ if(typeof myCountryName==='undefined'||!myCountryName) push('cap','<b>هنوز پایتخت نداری.</b> روی یک کشور آزاد بزن و آن را پایتخت کن — بدون پایتخت اقتصاد و ارتش قفل است.','ch1') }catch(e){}
  try{ if(typeof myCountryName!=='undefined'&&myCountryName){var t=(typeof wdTerrCount==='function')?wdTerrCount():0; push('map','قلمرو فعلی: <b>'+fad(t)+'</b> کشور'+(t<3?' — هر فتح، پایه‌ی اقتصادی قوی‌تر است.':' — امپراتوری داری!'),'ch1')} }catch(e){}
  try{ if(typeof window.oilStorageCap==='function'&&typeof playerRes!=='undefined'&&playerRes){var cap=window.oilStorageCap()||0,o=playerRes.oil|0; if(cap>0&&o>=cap*0.85) push('oil','انبار نفت تقریباً <b>پر</b> است ('+fad(Math.round(o/cap*100))+'٪) — مخزن را ارتقا بده یا در بازار بفروش؛ تولید اضافه هدر می‌رود.','ch9') } }catch(e){}
  try{ if(typeof myCountryName!=='undefined'&&myCountryName&&typeof queued==='function'&&queued()===0) push('army','صف آموزش نیرو <b>خالی</b> است — بدون یگان تازه، حمله‌ی بعدی نتیجه‌ی مطمئنی ندارد.','ch6') }catch(e){}
  try{ if(typeof infra!=='undefined'&&infra&&(infra.arms|0)===0&&(infra.oil|0)===0) push('build','هنوز هیچ زیرساختی نساخته‌ای — پالایشگاه نفت درآمد، کارخانه سرعت آموزش و مخزن سقف انبار را بالا می‌برد.','ch9') }catch(e){}
  try{ if(typeof M!=='undefined'&&typeof day==='function'&&M.lastDay!==day()) push('gift','پاداش ورود روزانه‌ات <b>دریافت نشده</b> — از صفحه‌ی حساب بگیرش.','ch10') }catch(e){}
  if(!out.length) push('ok','<span class="wd98-lv-ok">همه‌چیز مرتب است — روی مرزها، فناوری و ترکیب نیروها تمرکز کن؛ رقیب‌های واقعی همین حالا دارند پیشرفت می‌کنند.</span>',null);
  return out.slice(0,4);
}

/* ---------- هایلایت + حباب ---------- */
function killTyp(){if(ST.typing){clearInterval(ST.typing);ST.typing=null}}
function spotRect(){
  var sp=$('wd98-spot'),el=ST.spotTarget;
  if(!sp||!el){if(sp)sp.style.display='none';return}
  var r=el.getBoundingClientRect();
  if(!r||!r.width||!r.height){sp.style.display='none';ST.spotTarget=null;return} /* هدف پنهان/بدون اندازه → حباب پایین-وسط */
  sp.style.display='block';
  sp.style.top=Math.max(4,r.top-6)+'px';
  sp.style.left=Math.max(4,r.left-6)+'px';
  sp.style.width=Math.min(window.innerWidth-8,r.width+12)+'px';
  sp.style.height=Math.min(window.innerHeight-8,r.height+12)+'px';
}
function spotTo(sel){
  var sp=$('wd98-spot');if(!sp)return;
  var el=null;
  if(sel){try{el=D.querySelector(sel)}catch(e){el=null}}
  ST.spotTarget=el;
  if(!el){sp.style.display='none';return}
  try{el.scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'})}catch(e){}
  spotRect();
}
function bubblePos(){
  var b=$('wd98-bub');if(!b||ST.mode!=='guide')return;
  var t=ST.spotTarget,w=b.offsetWidth||320,h=b.offsetHeight||190;
  var left,top;
  if(t){
    var r=t.getBoundingClientRect();
    left=Math.min(window.innerWidth-w-8,Math.max(8,r.left+r.width/2-w/2));
    var below=r.bottom+14+h<window.innerHeight-10;
    top=below?r.bottom+14:Math.max(8,r.top-h-14);
    if(!below&&top<8)top=Math.max(8,Math.min(window.innerHeight-h-10,r.bottom+14));
  }else{
    left=(window.innerWidth-w)/2;
    top=window.innerHeight-h-96;
  }
  b.style.left=Math.round(Math.max(8,left))+'px';
  b.style.top=Math.round(Math.max(8,top))+'px';
}
function typeText(el,txt){
  killTyp();
  if(reduced()){el.textContent=txt;return}
  el.innerHTML='<span class="wd98-t"></span><span class="wd98-caret"></span>';
  var t=el.querySelector('.wd98-t'),i=0;
  ST.typing=setInterval(function(){
    i+=2;
    if(i>=txt.length){el.textContent=txt;killTyp();return}
    t.textContent=txt.slice(0,i);
  },17);
  el.onclick=function(){if(ST.typing){killTyp();el.textContent=txt}};
}
/* ---------- بازی روایی ---------- */
function openGuide(chIdx,stepIdx){
  closeAll();
  var L=LESSONS[chIdx];if(!L)return;
  ST.mode='guide';ST.ch=chIdx;ST.step=stepIdx||0;
  var ov=D.createElement('div');ov.className='wd98-catch';ov.id='wd98-catch';
  var sp=D.createElement('div');sp.className='wd98-spot';sp.id='wd98-spot';
  var b=D.createElement('div');b.className='wd98-bub';b.id='wd98-bub';
  b.innerHTML='<div class="wd98-bh"><span class="wd98-bava">'+AVATAR+'</span>'+
   '<span><span class="wd98-bname">مشاور ارشد آرمان</span><br><span class="wd98-brole">WORLD DOMINION — مشاور افتخاری تو</span></span>'+
   '<span class="wd98-bstep"></span></div>'+
   '<div class="wd98-bmid"><div class="wd98-bh2"></div><div class="wd98-btx"></div></div>'+
   '<div class="wd98-dots"></div>'+
   '<div class="wd98-bf"><button class="wd98-btn ghost" id="wd98-prev">قبلی</button>'+
   '<button class="wd98-btn pri" id="wd98-next">بعدی</button>'+
   '<button class="wd98-btn ghost" id="wd98-skip">رد کردن</button></div>';
  D.body.append(ov,sp,b);
  b.style.display='flex';
  b.querySelector('#wd98-prev').addEventListener('click',function(){goStep(ST.step-1)});
  b.querySelector('#wd98-next').addEventListener('click',function(){goStep(ST.step+1)});
  b.querySelector('#wd98-skip').addEventListener('click',function(){closeAll()});
  paintStep();
}
function paintStep(){
  var L=LESSONS[ST.ch],s=L.steps[ST.step],b=$('wd98-bub');if(!b)return;
  b.querySelector('.wd98-bstep').textContent='فصل '+fad(ST.ch+1)+' از '+fad(LESSONS.length)+' — گام '+fad(ST.step+1)+' از '+fad(L.steps.length);
  b.querySelector('.wd98-bh2').textContent=s.h;
  var dots='';for(var i=0;i<L.steps.length;i++)dots+='<i class="'+(i===ST.step?'on':'')+'"></i>';
  b.querySelector('.wd98-dots').innerHTML=dots;
  var tx=b.querySelector('.wd98-btx');typeText(tx,s.b);
  b.querySelector('#wd98-prev').style.visibility=ST.step>0?'visible':'hidden';
  b.querySelector('#wd98-next').textContent=ST.step<L.steps.length-1?'بعدی':'پایان فصل ✓';
  spotTo(s.sel);
  setTimeout(bubblePos,60);
}
function goStep(n){
  var L=LESSONS[ST.ch];
  if(n<0)n=0;
  if(n>=L.steps.length){finishLesson();return}
  ST.step=n;paintStep();
}
function finishLesson(){
  var L=LESSONS[ST.ch];
  ST.ls.done[L.id]=true;save();
  var fin=(ST.ch===LESSONS.length-1);
  closeAll();
  if(ST.ch===0)advPulse(false);
  try{
    if(typeof WD30CINE==='function'){
      if(fin)WD30CINE('🎓','دانش‌آموخته‌ی کامل مشاور!','آرمان: «هر ۱۲ فصل را آموختی، فرمانده. حالا جهان مال توست — از رهبری لذت ببر»','c-gold','cheer');
      else WD30CINE('📜','فصل «'+L.t+'» کامل شد','آرمان: «یادت ماند؟ از دکمه‌ی مشاور هر وقت خواستی دوباره می‌بینیم»','c-gold','none');
    }else{
      try{(typeof showToast==='function'?showToast:toast)('📜 فصل «'+L.t+'» کامل شد — آرمان افتخارش را دارد','win')}catch(e){}
    }
  }catch(e){}
}
function closeAll(){
  killTyp();ST.mode=null;ST.spotTarget=null;
  ['wd98-catch','wd98-spot','wd98-bub','wd98-ov'].forEach(function(id){var e=$(id);if(e)e.remove()});
}
/* ---------- هاب آموزش (با وضعیت زنده + کار بعدی هوشمند) ---------- */
function openHub(autoCh){
  closeAll();
  ST.mode='hub';
  var ov=D.createElement('div');ov.className='wd98-ov';ov.id='wd98-ov';
  var chs='';
  for(var i=0;i<LESSONS.length;i++){
    var L=LESSONS[i],dn=isDone(L.id);
    chs+='<button class="wd98-chap'+(dn?' done':'')+'" data-ch="'+i+'">'+
     '<span class="wd98-cic">'+CHIC[L.ic]+'</span>'+
     '<span class="wd98-cmid"><span class="wd98-ct">'+esc(L.t)+'</span><span class="wd98-cd">'+esc(L.d)+'</span></span>'+
     '<span class="wd98-cst">'+(dn?'تکمیل شد ✓':'شروع')+'</span></button>';
  }
  var dc=doneCount(),pc=Math.round(dc/LESSONS.length*100);
  var live=liveStatus(),rows='',nextFix=null,nextLbl='';
  for(var j=0;j<live.length;j++){
    var it=live[j];
    rows+='<div class="wd98-lv-row">'+(LIVE_IC[it.ic]||LIVE_IC.ok)+'<span>'+it.h+'</span></div>';
    if(!nextFix&&it.fix&&LESSONS.some(function(x){return x.id===it.fix})){
      nextFix=it.fix;
      for(var k2=0;k2<LESSONS.length;k2++)if(LESSONS[k2].id===it.fix){nextLbl=LESSONS[k2].t;break}
    }
  }
  ov.innerHTML='<div class="wd98-hub"><div class="wd98-hero"><span class="wd98-ava">'+AVATAR+'</span>'+
   '<span class="wd98-ht"><span class="wd98-name">مشاور ارشد آرمان</span>'+
   '<span class="wd98-role" style="display:block">مربی و مشاور افتخاری WORLD DOMINION — '+fad(LESSONS.length)+' فصل کامل</span>'+
   '<span class="wd98-quote" style="display:block">«رهبریِ خوب یعنی کشوری که حتی در صلح، رو به شکوفایی است. بزن بریم، فرمانده.»</span></span></div>'+
   '<button class="wd98-close" id="wd98-x" aria-label="بستن">✕</button>'+
   '<div class="wd98-prog"><div class="wd98-pt"><span>پیشرفت آموزش</span><b>'+fad(dc)+' از '+fad(LESSONS.length)+' فصل — ٪'+fad(pc)+'</b></div>'+
   '<div class="wd98-pb"><i style="width:'+Math.max(3,pc)+'%"></i></div></div>'+
   '<div class="wd98-nexta'+(nextFix?' on':'')+'">'+(nextFix?'<button id="wd98-na">'+CHIC.compass+'<span>کار بعدی من: '+esc(nextLbl)+'</span></button>':'')+'</div>'+
   '<div class="wd98-live"><div class="wd98-lv-h">وضعیت الان تو<small>از داده‌ی واقعی بازی</small></div>'+rows+'</div>'+
   '<div class="wd98-list">'+chs+'</div>'+
   '<div class="wd98-note">هر فصل، بخش واقعی بازی را همان‌جا که هست هایلایت می‌کند — هر وقت خواستی از دکمه‌ی مشاور در داک پایین صفحه برگرد.</div></div>';
  D.body.appendChild(ov);
  ov.addEventListener('click',function(ev){if(ev.target===ov)closeAll()});
  ov.querySelector('#wd98-x').addEventListener('click',function(){closeAll()});
  if(nextFix){
    var nab=ov.querySelector('#wd98-na');
    if(nab)nab.addEventListener('click',function(){
      for(var q=0;q<LESSONS.length;q++)if(LESSONS[q].id===nextFix){openGuide(q,0);return}
    });
  }
  ov.querySelectorAll('.wd98-chap').forEach(function(bn){
    bn.addEventListener('click',function(){openGuide(+bn.getAttribute('data-ch'),0)});
  });
  if(typeof autoCh==='number')setTimeout(function(){openGuide(autoCh,0)},140);
}
/* ---------- دکمه‌ی داک ---------- */
function advPulse(on){
  var b=$('wd98-b-adv');if(!b)return;
  if(on&&!isDone('ch0'))b.classList.add('wd98-ur');
  else b.classList.remove('wd98-ur');
}
var dockTries=0;
function ensureDockBtn(){
  var dock=$('wd87dock');
  if(!dock){if(++dockTries<60)setTimeout(ensureDockBtn,700);return}
  if($('wd98-b-adv')){advPulse(true);return}
  var b=D.createElement('button');
  b.type='button';b.id='wd98-b-adv';b.className='wd87-ic';
  b.title='مشاور ارشد آرمان — آموزش کامل بازی';
  b.setAttribute('aria-label',b.title);
  b.innerHTML=CHIC.grad;
  b.addEventListener('click',function(){openHub()});
  dock.insertBefore(b,dock.firstChild);
  advPulse(true);
}
/* ---------- شروع خودکار پس از ورود ---------- */
var bootTries=0;
function autoStartWatch(){
  if(ST.ls&&ST.ls.seen){ensureDockBtn();return}
  var uid=myUid();
  if(uid!=='guest'||++bootTries>12){ /* ورود، یا ۳۶ ثانیه صبر مهمان */
    load();ST.ls.seen=true;save();ensureDockBtn();
    setTimeout(function(){if(ST.mode==null)openGuide(0,0)},2200);
    return;
  }
  setTimeout(autoStartWatch,3000);
}
/* جای‌گذاری مجدد سبک هنگام چرخش/پن/تغییر اندازه — بدون scrollIntoView مجدد */
function reposition(){
  if(ST.mode!=='guide')return;
  spotRect();bubblePos();
}
window.addEventListener('resize',reposition);
window.addEventListener('scroll',reposition,true);

/* ---------- API عمومی + بوت ---------- */
function chIdxById(id){for(var i=0;i<LESSONS.length;i++)if(LESSONS[i].id===id)return i;return 0}
window.WD98_ADVISOR={open:function(){openHub()},start:function(id){openGuide(chIdxById(id),0)}};
window.WD99_ADVISOR=window.WD98_ADVISOR; /* نام مستعار V99 */
window.WD99_LIVE={status:liveStatus,openHub:openHub}; /* هارنس QA */
load();
setTimeout(ensureDockBtn,1800);
setTimeout(autoStartWatch,5000);
})();
