/* WD V137 — extracted from index.html <script id="wd-shop-v2"> (V66 shop V3, single render path)
   Defer-loaded: this IIFE only defines window.WD66_SHOP + wires renderShop/boot66 (post-DCL) —
   proven parse-time-safe: every early WD66_SHOP/renderShop reference is inside functions. */

/* ==================== V66: SHOP V2 — فروشگاه حرفه‌ای تک‌مسیر ====================
   - رندر واحد (بدون wrapper/MutationObserver) — همه‌ی دسته‌ها از کاتالوگ سرور
   - خرید فقط از موتور واحد سرور (spend_gems/shop_buy) با Idempotency
   - Preview واقعی بدون ذخیره‌سازی، Inventory/Collection/Museum/History سمت سرور
   - Performance: Event Delegation، رندر تنبل دسته‌ها، تایمر خودپاک، صفر observer
   ==================== */
(function(){
'use strict';
var D=document;
if(window.WD66_SHOP)return; /* ضد دوباره‌اجرا */

/* ---------- CSS ---------- */
var css=D.createElement('style');css.id='wd-shop-v2-css';
css.textContent=[
/* هسته */
'.wd66-head{display:flex;align-items:center;justify-content:space-between;gap:8px;background:linear-gradient(135deg,rgba(255,216,77,.16),rgba(57,230,208,.10));border:1px solid rgba(255,216,77,.32);border-radius:var(--wd-r-md);padding:10px 12px;margin-bottom:10px}',
'.wd66-head b{font-size:15px;color:#ffd84d}',
'.wd66-head .wd66-vip{font-size:10px;color:#ffd84d;background:rgba(255,216,77,.12);border:1px solid rgba(255,216,77,.35);border-radius:99px;padding:2px 8px}',
'.wd66-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
'.wd66-chips::-webkit-scrollbar{display:none}',
'.wd66-chip{flex:0 0 auto;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.05);color:#cdd7e8;border-radius:var(--wd-r-sm);min-height:44px;padding:9px 12px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap}',
'.wd66-chip.on{background:linear-gradient(135deg,#ffd84d,#ff9f2e);color:#241500;border-color:transparent}',
/* کارت‌ها */
'.wd66-card{position:relative;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:var(--wd-r-md);padding:11px 12px;margin-bottom:8px}',
'.wd66-ico{width:44px;height:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;font-size:23px;background:rgba(255,216,77,.10);border:1px solid rgba(255,216,77,.22);border-radius:13px}',
'.wd66-tx{flex:1;min-width:0}.wd66-tx b{display:block;font-size:12.5px;color:#fff}.wd66-tx small{display:block;color:#9fadc4;font-size:10.5px;line-height:1.55;margin-top:2px}',
'.wd66-rar{font-size:8.5px;font-weight:900;padding:1px 7px;border-radius:99px;display:inline-block;margin-top:3px;margin-inline-end:4px}',
'.wd66-buy{border:0;border-radius:var(--wd-r-sm);padding:9px 12px;font-weight:800;font-size:12px;cursor:pointer;background:linear-gradient(135deg,#ffd84d,#ffb02e);color:#201500;white-space:nowrap;font-family:inherit;min-height:44px}',
'.wd66-buy.alt{background:linear-gradient(135deg,#39e6d0,#2bb8ff);color:#00231f}',
'.wd66-buy.off{background:rgba(255,255,255,.08);color:#8b97ab;cursor:default}',
'.wd66-buy.own{background:rgba(62,232,165,.15);color:#3ee8a5;border:1px solid rgba(62,232,165,.35)}',
'.wd66-buy.busy{opacity:.55;pointer-events:none}',
'.wd66-col2{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
'.wd66-h{font-size:12.5px;color:#ffd84d;font-weight:900;margin:14px 2px 8px}',
'.wd66-note{font-size:10.5px;color:#9fadc4;line-height:1.7;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:9px 11px;margin-bottom:10px}',
/* کمیابی */
'.rar-com{background:rgba(200,214,229,.14);color:#c8d6e5;border:1px solid rgba(200,214,229,.25)}',
'.rar-unc{background:rgba(62,232,165,.13);color:#3ee8a5;border:1px solid rgba(62,232,165,.3)}',
'.rar-rare{background:rgba(57,182,255,.14);color:#6fc4ff;border:1px solid rgba(57,182,255,.32)}',
'.rar-epic{background:rgba(177,102,255,.15);color:#cf9bff;border:1px solid rgba(177,102,255,.34)}',
'.rar-leg{background:rgba(255,176,46,.15);color:#ffb849;border:1px solid rgba(255,176,46,.38)}',
'.rar-myth{background:rgba(255,77,128,.15);color:#ff7ba1;border:1px solid rgba(255,77,128,.4)}',
'.wd66-card.rar-b-rare{border-color:rgba(57,182,255,.3)}.wd66-card.rar-b-epic{border-color:rgba(177,102,255,.32)}.wd66-card.rar-b-legendary{border-color:rgba(255,176,46,.34)}.wd66-card.rar-b-mythic{border-color:rgba(255,77,128,.36)}',
/* قهرمان/ویترین */
'.wd66-hero{position:relative;overflow:hidden;background:linear-gradient(140deg,rgba(58,42,10,.85),rgba(20,14,38,.94));border:1px solid rgba(255,176,46,.45);border-radius:20px;padding:14px;margin-bottom:12px}',
'.wd66-hero .ttl{font-size:15px;font-weight:900;color:#ffd84d}',
'.wd66-hero .sub{font-size:10.5px;color:#c9b28a;line-height:1.7;margin-top:4px}',
'.wd66-hero .cd{font-size:11px;font-weight:900;color:#ff9f43;margin-top:7px}',
'.wd66-hero .wd66-ico{width:54px;height:54px;font-size:30px}',
'.wd66-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:4px}',
'.wd66-quick button{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.05);color:#cdd7e8;border-radius:13px;padding:10px 2px;font-size:10px;font-weight:800;cursor:pointer;font-family:inherit}',
'.wd66-quick button span{display:block;font-size:17px;margin-bottom:3px}',
/* پیشنهاد */
'.wd66-sec{display:flex;gap:8px;overflow-x:auto;padding:2px 0 6px;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
'.wd66-sec::-webkit-scrollbar{display:none}',
'.wd66-sec .wd66-card{flex:0 0 240px;margin-bottom:0}',
/* پک جم (بازاستفاده از wd54-pack) */
'.wd66-packgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}',
/* مجموعه */
'.wd66-colcard{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);border-radius:16px;padding:12px;margin-bottom:9px}',
'.wd66-colcard .hd{display:flex;align-items:center;gap:9px}',
'.wd66-colcard .hd b{flex:1;font-size:12.5px;color:#fff}',
'.wd66-colcard .pct{font-size:11px;font-weight:900;color:#ffd84d}',
'.wd66-bar{height:6px;background:rgba(255,255,255,.08);border-radius:6px;margin-top:9px;overflow:hidden}',
'.wd66-bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd84d,#39e6d0);border-radius:6px}',
'.wd66-colcard .mem{font-size:10px;color:#9fadc4;margin-top:7px;line-height:1.7}',
/* انبار */
'.wd66-invtools{display:flex;gap:6px;margin-bottom:9px;flex-wrap:wrap}',
'.wd66-invtools input{flex:1;min-width:130px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#e8f4ff;border-radius:12px;padding:9px 11px;font-size:11.5px;font-family:inherit}',
'.wd66-invtools select{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#e8f4ff;border-radius:12px;padding:9px 8px;font-size:11px;font-family:inherit}',
'.wd66-ftool{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#cdd7e8;border-radius:99px;padding:6px 10px;font-size:10px;font-weight:800;cursor:pointer;font-family:inherit}',
'.wd66-ftool.on{background:linear-gradient(135deg,#ffd84d,#ff9f2e);color:#241500;border-color:transparent}',
/* شانس */
'.wd66-odds{width:100%;font-size:10px;color:#9fadc4;border-collapse:collapse;margin-top:7px}',
'.wd66-odds td{padding:3px 5px;border-top:1px solid rgba(255,255,255,.06)}',
'.wd66-odds td:first-child{color:#ffd84d;font-weight:900;white-space:nowrap}',
/* تاریخچه */
'.wd66-hrow{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:9px 11px;margin-bottom:6px;font-size:11px}',
'.wd66-hrow .t{flex:1;min-width:0;color:#cdd7e8}',
'.wd66-hrow .p{color:#ffd84d;font-weight:900;white-space:nowrap}',
'.wd66-hrow .d{font-size:9px;color:#7f9cc0}',
/* پیش‌نمایش */
'.wd66-pv{position:fixed;inset:0;z-index:10120;display:flex;align-items:center;justify-content:center;background:rgba(4,8,16,.72)}',
'.wd66-pv .card{width:min(400px,92vw);max-height:80vh;overflow-y:auto;background:linear-gradient(180deg,#0b1a34,#071022);border:1px solid rgba(255,216,77,.4);border-radius:20px;padding:14px}',
'.wd66-pv .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}',
'.wd66-pv .hd b{font-size:13.5px;color:#ffd84d}',
'.wd66-pv .hd button{background:none;border:0;color:#cdd7e8;font-size:17px;cursor:pointer}',
'.wd66-pv .stage{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:12px;margin-bottom:9px;text-align:center}',
'.wd66-chipdemo{display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.16);border-radius:99px;padding:7px 13px;font-size:12.5px;font-weight:800;color:#fff}',
'.wd66-sw{width:34px;height:34px;border-radius:50%;border:3px solid transparent;cursor:pointer;padding:0;display:inline-block;margin:3px}',
'.wd66-sw.on{border-color:#fff;box-shadow:0 0 0 2px #39e6d0}',
/* پروفایل/چیپ (کازمتیک‌های جدید) */
'#acc-chip.wd66-nameplate .wd-nick{background:linear-gradient(135deg,rgba(255,216,77,.18),rgba(255,216,77,.05));border:1px solid rgba(255,216,77,.4);border-radius:99px;padding:1px 8px}',
'#acc-chip.wd66-war .wd-nick::after{content:" ⚔️"}',
'#acc-chip.wd66-power .wd-nick::after{content:" 🌟"}',
'.wd66-frame-battle{outline:2px solid rgba(255,107,107,.6);outline-offset:2px;border-radius:8px}',
/* پایتخت/نقشه — کلاس‌محور، ثابت، بدون انیمیشن دائمی */
'.own-wrap.wd66-cap-aura-gold .own{box-shadow:0 0 14px 3px rgba(255,216,77,.55);border-radius:10px}',
'.own-wrap.wd66-cap-aura-ice .own{box-shadow:0 0 14px 3px rgba(122,214,255,.55);border-radius:10px}',
'.own-wrap.wd66-cap-aura-flame .own{box-shadow:0 0 14px 3px rgba(255,120,60,.55);border-radius:10px}',
'.own-wrap.wd66-cap-theme .own{box-shadow:0 0 18px 4px rgba(255,205,60,.65);border:1px solid rgba(255,216,77,.7);border-radius:12px;background:linear-gradient(135deg,rgba(80,60,10,.55),rgba(30,22,4,.55))}',
'.own-wrap.wd66-cap-mon .own::before{content:"🏛️";margin-inline-end:3px;font-size:11px}',
'.own-wrap.wd66-cap-name .own{background:rgba(4,10,22,.55);border:1px solid rgba(160,200,255,.35);border-radius:99px;padding:1px 7px}',
'.own-wrap.wd66-emp-hi .own{border:1px dashed rgba(255,216,77,.75);border-radius:99px;padding:1px 6px}',
/* تم اقیانوس — فقط برای دارنده؛ کلاس روی container نقشه (قانون کانونیک دریا دست‌نخورده) */
'.leaflet-container.wd66-ocean-azure{background:linear-gradient(180deg,#57b8e8 0%,#3d9ccf 55%,#2e83ba 100%)!important}',
'.leaflet-container.wd66-ocean-midnight{background:linear-gradient(180deg,#123055 0%,#0c2242 55%,#081a35 100%)!important}',
'.leaflet-container.wd66-ocean-jade{background:linear-gradient(180deg,#3fae9d 0%,#2f8f83 55%,#237568 100%)!important}',
/* افکت‌های جدید (همان سامانه cos27 — کلاس‌های s/c) */
'.cos27-ring.s{border-color:#39e6d0}.cos27-pt.s{background:#39e6d0;box-shadow:0 0 8px rgba(57,230,208,.9)}',
'.cos27-ring.c{border-color:#b066ff}.cos27-pt.c{background:#b066ff;box-shadow:0 0 8px rgba(176,102,255,.9)}',
/* V108 — پک شروع امپراتور: کارت پریمیوم بزرگ */
'.wd108-starter{position:relative;overflow:hidden;background:linear-gradient(150deg,rgba(64,42,6,.92),rgba(26,14,40,.95));border:1px solid rgba(255,216,77,.55);border-radius:20px;padding:14px;margin-bottom:12px;box-shadow:0 0 24px rgba(255,190,60,.14)}',
'.wd108-starter .ttl{font-size:16px;font-weight:900;color:#ffd84d}',
'.wd108-starter .sub{font-size:10.5px;color:#d9c9a4;line-height:1.8;margin-top:3px}',
'.wd108-starter .crown{position:absolute;inset-inline-end:-12px;top:-14px;font-size:74px;opacity:.14;transform:rotate(12deg)}',
'.wd108-price{font-size:19px;font-weight:900;color:#ffe27a}',
'.wd108-timer{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:900;color:#ff9f43;background:rgba(255,159,67,.12);border:1px solid rgba(255,159,67,.35);border-radius:99px;padding:4px 10px;margin-top:6px}',
'.wd108-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}',
'.wd108-it{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);border-radius:11px;padding:7px 8px;font-size:10.5px;color:#e6ecf7;font-weight:700}',
'.wd108-buy{width:100%;border:0;border-radius:14px;padding:13px;font-weight:900;font-size:14.5px;cursor:pointer;background:linear-gradient(135deg,#ffd84d,#ff9f2e);color:#241500;font-family:inherit;margin-top:10px;min-height:46px;box-shadow:0 4px 14px rgba(255,159,46,.35)}',
'.wd108-hint{font-size:9.5px;color:#9fadc4;line-height:1.7;margin-top:7px}',
'.wd108-old{font-size:12.5px;font-weight:800;color:#8b97ab;text-decoration:line-through;text-decoration-color:rgba(255,120,120,.75)}',
'.wd108-save{font-size:10px;font-weight:900;color:#0d2b10;background:linear-gradient(135deg,#7dff8a,#39e66d);border-radius:99px;padding:3px 10px;box-shadow:0 2px 8px rgba(57,230,109,.3)}',
'.wd108-oldnote{font-size:9.5px;color:#d9c9a4;margin-top:4px;line-height:1.7}',
/* V108 — انبار زرادخانه (فروشگاه + کشو حمله) */
'.wd108-ars{background:rgba(255,255,255,.05);border:1px solid rgba(140,120,255,.3);border-radius:15px;padding:11px 12px;margin-bottom:8px}',
'.wd108-ars .own{font-size:11px;font-weight:900;color:#7dffcf}',
'.wd108-ars .meta{font-size:9.5px;color:#9fadc4;margin-top:4px;line-height:1.7}',
'.wd108-row{display:flex;align-items:center;gap:10px}',
'.wd108-ic{width:44px;height:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;font-size:24px;background:rgba(140,120,255,.12);border:1px solid rgba(140,120,255,.3);border-radius:12px}',
'.wd108-use{border:0;border-radius:11px;padding:9px 12px;font-weight:800;font-size:12px;cursor:pointer;background:linear-gradient(135deg,#7a6cff,#b066ff);color:#fff;font-family:inherit;min-height:38px;white-space:nowrap}',
'.wd108-use.sup{background:linear-gradient(135deg,#39e6d0,#2bb8ff);color:#00231f}',
'.wd108-use.off{background:rgba(255,255,255,.08);color:#8b97ab;cursor:default}',
/* V108 — رونمایی جایزه (یک‌بار، سبک) */
'.wd108-reveal{position:fixed;inset:0;z-index:10130;display:flex;align-items:center;justify-content:center;background:rgba(4,8,16,.8)}',
'.wd108-reveal .card{width:min(420px,92vw);max-height:82vh;overflow-y:auto;background:linear-gradient(180deg,#0b1a34,#071022);border:1px solid rgba(255,216,77,.5);border-radius:20px;padding:16px;text-align:center}',
'.wd108-reveal .rit{opacity:0;transform:translateY(14px) scale(.9);animation:wd108pop .5s forwards}',
'@keyframes wd108pop{to{opacity:1;transform:none}}',
/* V108 — برق لحظه‌ی شلیک (one-shot، بدون DOM دائمی) */
'.wd108-burst{position:absolute;inset:0;pointer-events:none;border-radius:14px;background:radial-gradient(circle at 50% 50%,rgba(122,214,255,.5),transparent 60%);animation:wd108burst .9s forwards}',
'@keyframes wd108burst{0%{opacity:0;transform:scale(.4)}35%{opacity:1}100%{opacity:0;transform:scale(1.5)}}',
'body.wd-lowfx .wd108-starter,body.wd-lowfx .wd108-reveal .card{animation:none!important;transition:none!important}',
'body.wd-lowfx .wd108-burst{display:none!important}',
/* lowfx: بدون transition */
'body.wd-lowfx .wd66-card,body.wd-lowfx .wd66-hero,body.wd-lowfx .wd66-pv .card{transition:none!important;animation:none!important}',
/* موبایل */
'@media (max-width:380px){.wd66-col2{grid-template-columns:1fr}.wd66-quick{grid-template-columns:repeat(3,1fr)}}',
/* ===== V112 — سینمایی‌سازی فروشگاه: درخشش کمیابی + جلای متحرک + مهار آیکون‌ها ===== */
'.wd66-ico{width:46px;height:46px;flex:0 0 46px;font-size:21px;line-height:1;overflow:hidden;position:relative;border-radius:14px;background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 3px 10px rgba(0,0,0,.35);text-shadow:0 2px 6px rgba(0,0,0,.45);font-family:"Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif}',
'.wd66-ico::after{content:"";position:absolute;top:0;bottom:0;width:46%;left:-60%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.30),transparent);transform:skewX(-18deg);animation:wd66shine 4.6s ease-in-out infinite;animation-delay:1.2s;pointer-events:none}',
'@keyframes wd66shine{0%,70%{left:-60%}90%,100%{left:135%}}',
'.wd66-card.rar-b-legendary .wd66-ico{background:radial-gradient(circle at 30% 25%,rgba(255,216,77,.34),rgba(120,70,0,.16));border-color:rgba(255,176,46,.6);box-shadow:0 0 13px rgba(255,176,46,.4),inset 0 1px 0 rgba(255,255,255,.22)}',
'.wd66-card.rar-b-mythic .wd66-ico{background:radial-gradient(circle at 30% 25%,rgba(255,77,128,.32),rgba(90,0,40,.16));border-color:rgba(255,77,128,.6);box-shadow:0 0 13px rgba(255,77,128,.45),inset 0 1px 0 rgba(255,255,255,.22)}',
'.wd66-card.rar-b-epic .wd66-ico{background:radial-gradient(circle at 30% 25%,rgba(177,102,255,.30),rgba(60,0,110,.16));border-color:rgba(177,102,255,.55);box-shadow:0 0 13px rgba(177,102,255,.4),inset 0 1px 0 rgba(255,255,255,.22)}',
'.wd66-card.rar-b-rare .wd66-ico{background:radial-gradient(circle at 30% 25%,rgba(57,182,255,.30),rgba(0,50,100,.16));border-color:rgba(57,182,255,.55);box-shadow:0 0 13px rgba(57,182,255,.38),inset 0 1px 0 rgba(255,255,255,.22)}',
'.wd66-card.rar-b-legendary{box-shadow:0 4px 18px rgba(255,176,46,.14)}',
'.wd66-card.rar-b-mythic{box-shadow:0 4px 18px rgba(255,77,128,.16)}',
'.wd66-card.rar-b-epic{box-shadow:0 4px 18px rgba(177,102,255,.13)}',
'.wd66-card.rar-b-rare{box-shadow:0 4px 18px rgba(57,182,255,.13)}',
'.wd66-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}',
'.wd66-card:active{transform:scale(.985)}',
'@media(hover:hover){.wd66-card:hover{transform:translateY(-1px);border-color:rgba(255,216,77,.38);box-shadow:0 6px 22px rgba(0,0,0,.4),0 0 14px rgba(255,216,77,.12)}}',
'.wd108-it{padding:9px 10px;overflow:hidden}',
'.wd108-it span:first-child{font-size:17px;line-height:1;flex:0 0 auto;font-family:"Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif}',
'.wd108-it span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
'.wd66-pack{position:relative;overflow:hidden;background:linear-gradient(155deg,rgba(30,40,80,.5),rgba(10,14,32,.65));border:1px solid rgba(255,216,77,.22)}',
'.wd66-pack::before{content:"";position:absolute;top:-40%;inset-inline-end:-10%;width:70%;height:120%;background:radial-gradient(circle,rgba(255,216,77,.14),transparent 65%);pointer-events:none}',
'.wd66-pack.best{border-color:rgba(255,216,77,.6);box-shadow:0 0 18px rgba(255,190,60,.18)}',
'.wd66-promo280{border-color:rgba(255,216,77,.5)!important;box-shadow:0 0 20px rgba(255,190,60,.2)!important}',
'body.wd-lowfx .wd66-ico::after{display:none!important}',
'body.wd-lowfx .wd66-card{transition:none!important}'
].join('');
D.head.appendChild(css);

/* ---------- ابزار ---------- */
function H(id){return D.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function faN(n){try{return faNum(n)}catch(e){return String(n)}}
function gemN(n){try{return faNum(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'٬'))}catch(e){return String(n)}}
function el(tag,txt,cls){var e=D.createElement(tag);if(txt!=null)e.textContent=txt;if(cls)e.className=cls;return e}
function COSC(){return window.COS||window.COS27||{}}
var V66_NEW={emp_nameplate:1,emp_power_badge:1,fx_storm:1,fx_comet:1,war_badge:1,battle_frame:1,map_ocean_azure:1,map_ocean_midnight:1,map_ocean_jade:1,empire_highlight:1,cap_aura_gold:1,cap_aura_ice:1,cap_aura_flame:1,cap_monument:1,cap_nameplate:1,cap_theme_royal:1,lim_persian_1404:1,mystery_premium:1};
function ownOf(id){var C=COSC();
  /* مالکیت آیتم‌های V66 فقط از انبار سرور — وضعیت کلاینت هرگز برای آن‌ها کافی نیست */
  if(OWN66[id])return true;
  if(V66_NEW[id])return false;
  if(C.owned&&C.owned.indexOf(id)>-1)return true;
  if(id.indexOf('emst_')===0&&C.emstOwned&&C.emstOwned.indexOf(id.slice(5))>-1)return true;
  if(id==='stats'&&C.statsOn)return true;
  if(id==='radar'&&Date.now()<(C.radarUntil||0))return true;
  if(id==='vip7'&&Date.now()<(C.vipUntil||0))return true;
  if(id==='medal_s1'&&(C.medals||[]).some(function(m){return String(m.k||'').indexOf('olympic_')!==0}))return true;
  return false}
function expOf(id){var r=EXP66[id];return r&&r>Date.now()?r:0}
function vipUntil(){var C=COSC();var a=C.vipUntil||0,b=window.WD66_VIP_UNTIL||0;return Math.max(a,b)}
function vipActive(){return Date.now()<vipUntil()}
function radarActive(){var C=COSC();return Date.now()<(C.radarUntil||0)}

/* ---------- state ---------- */
var CAT66=null,OWN66={},EXP66={},VIEW='home',BUSY={},HIST=null;
var INVQ='',INVF='all',INVS='new',PV66=null,TIMER66=null,INVHIST=false;
var RARS={common:'معمولی',uncommon:'غیرمعمولی',rare:'کمیاب',epic:'حماسی',legendary:'افسانه‌ای',mythic:'اسطوره‌ای'};
var CATS=[
 /* V88 — ساختار ۱۲ بخشی Premium Empire Store (Shop V3) */
 {id:'home',ic:'🏠',fa:'خانه'},
 {id:'gems',ic:'💎',fa:'خرید جم'},
 {id:'identity',ic:'👑',fa:'هویت امپراتوری'},
 {id:'capital',ic:'🏛️',fa:'پایتخت'},
 {id:'map',ic:'🌍',fa:'تم‌های جهان'},
 {id:'war',ic:'⚔️',fa:'جنگ'},
 {id:'landmarks',ic:'🗿',fa:'بناها'},
 {id:'collections',ic:'🏆',fa:'مجموعه‌ها'},
 {id:'vault',ic:'🎁',fa:'خزانه امپراتوری'},
 {id:'vip',ic:'👑',fa:'VIP'},
 {id:'limited',ic:'🔥',fa:'محدود'},
 {id:'pass',ic:'🎟️',fa:'پاس فصل'},
 {id:'trophies',ic:'🏅',fa:'تروفی‌ها'},
 {id:'cosmetic',ic:'🎨',fa:'زینتی سینمایی'},
 {id:'museum',ic:'🖼️',fa:'موزه'},
 {id:'inventory',ic:'🎒',fa:'انبار'}
];
function itemOf(id){if(!CAT66)return null;for(var i=0;i<CAT66.items.length;i++)if(CAT66.items[i].id===id)return CAT66.items[i];return null}
function itemsOfCat(c){if(!CAT66)return[];return CAT66.items.filter(function(x){return x.cat===c})}

/* ---------- fetch کاتالوگ (تک‌منبع: سرور) ---------- */
function syncVip(ts){try{if(!ts)return;var t=Date.parse(ts);if(!t)return;
  window.WD66_VIP_UNTIL=Math.max(window.WD66_VIP_UNTIL||0,t);
  var C=COSC();if(C&&t>(C.vipUntil||0))C.vipUntil=t}catch(e){}}
/* V111 — حافظه‌ی آفلاین کاتالوگ: فروشگاه هرگز بن‌بست ندارد */
var OFF66=false;
function cacheSave(c){try{localStorage.setItem('wd66_cat_v1',JSON.stringify({t:Date.now(),c:c}))}catch(e){}}
function cacheLoad(){try{var x=JSON.parse(localStorage.getItem('wd66_cat_v1')||'null');return (x&&x.c&&x.c.items&&x.c.items.length)?x.c:null}catch(e){return null}}
function serverProbe(){return new Promise(function(res){ /* تشخیص صادقانه: سرور پایین است یا اینترنت کاربر — V113: پینگ بک‌اند خودِ بازی (same-origin) */
  var done=false;var fin=function(v){if(!done){done=true;res(v)}};var to=setTimeout(function(){fin('down')},6000);
  try{fetch('/api/auth/session',{method:'GET',cache:'no-store',credentials:'same-origin'}).then(function(r){clearTimeout(to);fin(r.ok?'up':'down')},function(){clearTimeout(to);fin('down')})}catch(e){clearTimeout(to);fin('down')}})}
function fetchCatalog(force){
  if(CAT66&&!force)return Promise.resolve(CAT66);
  if(typeof sb==='undefined'||!sb||typeof ACC==='undefined'||!ACC.uid)return Promise.reject(new Error('nologin'));
  return sb.rpc('shop_catalog').then(function(r){
    if(r.error||!r.data||!r.data.ok)throw new Error('cat');
    CAT66=r.data;OFF66=false;cacheSave(CAT66);
    try{if(typeof GEMS==='number'||typeof GEMS!=='undefined')GEMS=Number(r.data.wallet.gems)||0}catch(e){}
    OWN66={};EXP66={};
    (r.data.owned||[]).forEach(function(o){OWN66[o.item_id]=true;if(o.expires_at)EXP66[o.item_id]=Date.parse(o.expires_at)});
    syncVip(r.data.wallet.vip_until);
    applyOwned();
    return CAT66}).catch(function(e){
    /* V111: سرور در دسترس نیست؟ از آخرین کاتالوگ ذخیره‌شده نشان بده — نه خطای اینترنت */
    if(!CAT66){var cc=cacheLoad();if(cc){CAT66=cc;OFF66=true;return CAT66}}
    if(!CAT66){CAT66=null;throw e}return CAT66})}
function markOwned(id,exp){OWN66[id]=true;if(exp)EXP66[id]=Date.parse(exp)}
function onPurchase(itemId,res){try{
  if(res&&res.grant)markOwned(res.grant,res.expires);
  if(res&&res.reward&&res.reward.type==='item'&&res.reward.item)markOwned(res.reward.item);
  if(res&&res.reward&&res.reward.type==='stock'){try{if(window.WD88)window.WD88._wsAt=0}catch(e){}}
  if(CAT66&&res&&typeof res.gems==='number')CAT66.wallet.gems=res.gems;
  if(res&&res.vip_until)syncVip(res.vip_until);
  applyOwned();
  var m=H('m-shop');if(m&&m.classList.contains('active'))render()}catch(e){}}
function syncGrant(itemId){try{markOwned(itemId);
  var C=COSC();if(C&&!C.owned)C.owned=[];
  var base=itemOf(itemId);
  if(C&&C.owned.indexOf(itemId)<0&&(base||itemId.indexOf('emst_')===0))C.owned.push(itemId);
  applyOwned()}catch(e){}}

/* ---------- اعمال کازمتیک‌های V2 (کلاس‌محور، Idempotent، بدون انیمیشن دائمی) ---------- */
function activeMapTheme(){var C=COSC();if(!C||!C.mapTheme)return null;
  return ownOf(C.mapTheme)?C.mapTheme:null}
function applyMapTheme(id){var C=COSC();C.mapTheme=id||null;applyOwned();try{if(typeof saveNow==='function')saveNow()}catch(e){}}
function applyCapital(){try{
  D.querySelectorAll('.own-wrap').forEach(function(w){w.classList.remove('wd66-cap-aura-gold','wd66-cap-aura-ice','wd66-cap-aura-flame','wd66-cap-theme','wd66-cap-mon','wd66-cap-name','wd66-emp-hi')});
  var C=COSC(),my=null;try{my=myCountryName}catch(e){}
  if(!my||typeof OL==='undefined'||!OL[my]||!OL[my].getElement)return;
  var e2=OL[my].getElement();if(!e2)return;
  if(C.capTheme==='royal'&&ownOf('cap_theme_royal'))e2.classList.add('wd66-cap-theme','wd66-cap-mon','wd66-cap-name');
  else{var a=C.capAura;if(a&&ownOf('cap_aura_'+a))e2.classList.add('wd66-cap-aura-'+a)}
  if(C.capMonument&&ownOf('cap_monument'))e2.classList.add('wd66-cap-mon');
  if(C.capNameplate&&ownOf('cap_nameplate'))e2.classList.add('wd66-cap-name');
  if(C.empHi&&ownOf('empire_highlight'))e2.classList.add('wd66-emp-hi');
  /* V88 — اسکین پایتخت + بنای ماندگار */
  var wrap=null;try{wrap=e2.closest('.own-wrap')||e2.parentElement}catch(e){}
  if(wrap){WD88_CSKS.forEach(function(k){wrap.classList.remove('wd88-csk-'+k)});
    var csk=C.capSkin;if(csk&&ownOf(csk))wrap.classList.add('wd88-'+csk);
    var oldLm=wrap.querySelector('.wd88-lm');if(oldLm)oldLm.remove();
    var lm=C.landmark;
    if(lm&&ownOf(lm)){var lit=itemOf(lm);var sp=D.createElement('span');sp.className='wd88-lm wd88-'+lm;sp.textContent=lit?(lit.icon||'🗿'):'🗿';sp.title=lit?lit.fa:'بنا';wrap.appendChild(sp)}}}catch(e){}}
function applyProfile(){try{var c=H('acc-chip');if(!c)return;var C=COSC();
  c.classList.toggle('wd66-nameplate',ownOf('emp_nameplate'));
  c.classList.toggle('wd66-war',ownOf('war_badge'));
  c.classList.toggle('wd66-power',ownOf('emp_power_badge'));
  c.classList.toggle('wd66-frame-battle',ownOf('battle_frame')&&C.frameStyle==='battle')}catch(e){}}
function applyOwned(){try{
  var host=null;try{host=map.getContainer()}catch(e){}
  if(host){/* V88: حذف امن همه‌ی تم‌ها (اقیانوس قدیمی + تم‌های جدید) + نگاشت نام اقیانوس */
    (host.className.match(/wd66-(map_|ocean-)[\w-]+/g)||[]).forEach(function(x){host.classList.remove(x)});
    var th=activeMapTheme();if(th)host.classList.add('wd66-'+(th.indexOf('map_ocean_')===0?th.replace('map_ocean_','ocean-'):th))}
  applyCapital();applyProfile()}catch(e){}}
try{if(typeof WD_COLOR_HOOKS!=='undefined'&&WD_COLOR_HOOKS.after)WD_COLOR_HOOKS.after.push(function(){applyCapital()})}catch(e){}

/* ---------- خرید V2 (برای آیتم‌های جدید — قدیمی‌ها از cosBuy می‌روند) ---------- */
function buy(it){
  if(BUSY[it.id])return;
  BUSY[it.id]=1;renderButtons(it.id);
  var legacy={col_pack:1,emblem:1,title:1,border_glow:1,fx_conq:1,vip7:1,radar:1,stats:1,lucky:1,medal_s1:1};
  try{
    if(it.kind==='stock'){ /* V108 — مصرفی شمارشی: انبار سمت سرور؛ شمارش از war_state */
      spendGem({k:it.id,c:it.price,t:it.fa,f:function(res){
        try{if(res&&res.reward&&res.reward.type==='stock'){
          try{if(window.WD88)window.WD88._wsAt=0}catch(e){}
          showToast('🪖 '+((res.reward.fa)||it.fa)+' — موجودی فعلی: '+faN(res.reward.count),'win')}}catch(e){}}});
      return;
    }
    else if(it.id==='bundle_cos'){ /* پک امپراتور — آینه‌ی مالکیت در f؛ قیمت از سرور */
      spendGem({k:'bundle_cos',c:it.price,t:it.fa,f:function(){
        var C=COSC();if(!C.owned)C.owned=[];
        ['col_pack','emblem','title','border_glow','fx_conq'].forEach(function(k){if(C.owned.indexOf(k)<0)C.owned.push(k)});
        showToast('👑 پک کامل امپراتور فعال شد! همه‌ی زیبایی‌ها مال توست','win')}})}
    else if(legacy[it.id]){ /* پیاده‌سازی واحد قدیمی — اثر/پیکر همان مسیر */
      if(it.id==='lucky')WD27_API.cosBuy('lucky');
      else if(it.id==='medal_s1')WD27_API.cosBuy('medal');
      else WD27_API.cosBuy(it.id);
    }
    else if(it.id==='cmd_training'){ /* V88 — توکن آموزش فرمانده: مصرف در پنل امپراتوری */
      spendGem({k:it.id,c:it.price,t:it.fa,f:function(){
        var C2=COSC();C2.training=(C2.training||0)+1;
        showToast('🎓 توکن آموزش ذخیره شد — از پنل «امپراتوری» مصرفش کن (+۹۰۰ XP)','win');
        if(typeof saveNow==='function')saveNow()}})}
    else if(typeof GEM_ITEMS!=='undefined'&&GEM_ITEMS&&GEM_ITEMS.some(function(g){return g.k===it.id})){
      /* مصرفی‌های v3 — همان آبجکت با اثر اصلی (سرور قیمت را اعتبارسنجی می‌کند) */
      spendGem(GEM_ITEMS.filter(function(g){return g.k===it.id})[0]);
    } else {
      spendGem({k:it.id,c:it.price,t:it.fa,f:function(res){
        var C=COSC();if(!C.owned)C.owned=[];
        if(C.owned.indexOf(it.id)<0)C.owned.push(it.id);
        /* اثر فوری آیتم‌های جدید */
        if(it.id==='fx_storm'){C.fx='storm'}
        else if(it.id==='fx_comet'){C.fx='comet'}
        else if(it.id.indexOf('map_')===0){C.mapTheme=it.id}
        else if(it.id.indexOf('csk_')===0){C.capSkin=it.id}
        else if(it.id.indexOf('lm_')===0){C.landmark=it.id}
        else if(it.id.indexOf('banner_')===0){C.banner=it.id}
        else if(it.id.indexOf('wfr_')===0){C.wframe=it.id}
        else if(it.id.indexOf('vs_')===0){C.vfx=it.id}
        else if(it.id.indexOf('we_')===0){C.wemb=it.id}
        else if(it.id.indexOf('cp_')===0){C.cport=it.id}
        else if(it.id==='cap_theme_royal'){C.capTheme='royal'}
        else if(it.id.indexOf('cap_aura_')===0){C.capAura=it.id.slice(9)}
        else if(it.id==='cap_monument'){C.capMonument=true}
        else if(it.id==='cap_nameplate'){C.capNameplate=true}
        else if(it.id==='empire_highlight'){C.empHi=true}
        else if(it.id==='battle_frame'){C.frameStyle='battle'}
        else if(it.id==='mystery_premium'){ /* نمایش قرعه‌ی سرور با همان انیمیشن باکس */
          applyOwned();
          try{if(window.WD27_API&&WD27_API.luckyOpen)WD27_API.luckyOpen(res)}catch(e){}return}
        applyOwned();
        if(typeof saveNow==='function')saveNow();
      }});
    }
  }catch(e){}
  setTimeout(function(){delete BUSY[it.id];var m=H('m-shop');if(m&&m.classList.contains('active'))render()},600)}
function renderButtons(){var m=H('m-shop');if(m&&m.classList.contains('active'))render()}

/* ---------- سازنده‌های UI ---------- */
function head66(){var w=el('div',null,'wd66-head');
  var l=el('div');l.append(el('span','💎 موجودی: '),el('b',gemN(typeof GEMS!=='undefined'?GEMS:0)));
  var r=el('div');
  if(vipActive())r.append(el('span','👑 VIP — '+faN(Math.max(1,Math.ceil((vipUntil()-Date.now())/864e5)))+' روز','wd66-vip'));
  else if(boostMult()>1)r.append(el('span','⚡ بوست '+faN(Math.ceil((BOOST-Date.now())/60000))+' دقیقه','wd66-vip'));
  w.append(l,r);return w}
function chipRail(){var t=el('div',null,'wd66-chips');
  CATS.forEach(function(c){var b=el('button',c.ic+' '+c.fa,'wd66-chip'+(VIEW===c.id?' on':''));
    b.setAttribute('data-act','cat');b.setAttribute('data-cat',c.id);t.append(b)});return t}
function rarTag(rar){var s=el('span',RARS[rar]||rar,'wd66-rar rar-'+(rar==='mythic'?'myth':rar));
  if(rar==='mythic')s.className='wd66-rar rar-myth';return s}
function card(it,opts){opts=opts||{};
  var owned=opts.owned!=null?opts.owned:ownOf(it.id);
  var r=el('div',null,'wd66-card rar-b-'+it.rar);
  /* V126: آیکون اسپرایت فریم‌دار AAA به‌جای ایموجی — همان زبان بصری آیکون‌های V123 */
  var ICON66={gold:'icon-gold',oil:'icon-oil',res_crate:'icon-trade',boost:'icon-attack',peace:'icon-shield',tax:'icon-trade',
    col_pack:'icon-map',emblem:'icon-shield',title:'icon-prize',emp_nameplate:'icon-profile',emp_power_badge:'icon-diamond',
    fx_conq:'icon-attack',fx_storm:'icon-attack',fx_comet:'icon-attack',war_badge:'icon-soldier',battle_frame:'icon-shield',
    border_glow:'icon-diamond',map_ocean_azure:'icon-map',map_ocean_midnight:'icon-map',map_ocean_jade:'icon-map',
    empire_highlight:'icon-prize',cap_aura_gold:'icon-prize',cap_aura_ice:'icon-prize',cap_aura_flame:'icon-prize',
    cap_monument:'icon-map',cap_nameplate:'icon-map',cap_theme_royal:'icon-prize',vip7:'icon-diamond',vip30:'icon-diamond',
    radar:'icon-attack',stats:'icon-trade',medal_s1:'icon-prize',lim_persian_1404:'icon-prize',
    lucky:'icon-diamond',mystery_premium:'icon-diamond',bundle_cos:'icon-gold'};
  var sym=ICON66[it.id];
  var ic=el('div',null,'wd66-ico');
  if(sym)ic.innerHTML='<svg class="wdic-big" viewBox="0 0 128 128" aria-hidden="true"><use href="#'+sym+'"></use></svg>';
  else ic.textContent=it.icon||'🎁';
  var tx=el('div',null,'wd66-tx');tx.append(el('b',it.fa));
  if(it.d)tx.append(el('small',it.d));
  var tags=el('div');tags.append(rarTag(it.rar));
  if(it.kind==='limited'&&it.window&&it.window.to&&!owned)tags.append(el('span','⏳ محدود','wd66-rar rar-myth'));
  if(owned)tags.append(el('span','✓ دارید','wd66-rar rar-unc'));
  else if(it.kind==='service'&&it.days)tags.append(el('span',faN(it.days)+' روزه','wd66-rar rar-com'));
  tx.append(tags);
  r.append(ic,tx);
  var btn;
  if(owned){
    var slotAct=slotAction(it);
    if(slotAct){btn=el('button',slotAct.label,'wd66-buy alt');btn.setAttribute('data-act',slotAct.act);btn.setAttribute('data-id',it.id)}
    else{btn=el('button','داری ✓','wd66-buy own');btn.disabled=true}
  }else{
    btn=el('button','💎 '+gemN(it.price),BUSY[it.id]?'wd66-buy busy':'wd66-buy');
    btn.setAttribute('data-act','buy');btn.setAttribute('data-id',it.id);
    if(it.kind==='limited'&&it.window&&it.window.to&&Date.now()>=it.window.to){btn.textContent='پایان یافت';btn.className='wd66-buy off';btn.disabled=true}
  }
  r.append(btn);
  var pv=el('button','👁','wd66-buy off');pv.title='پیش‌نمایش';pv.style.cssText='padding:9px 10px;margin-inline-start:6px;flex:0 0 auto';
  pv.setAttribute('data-act','preview');pv.setAttribute('data-id',it.id);r.append(pv);
  return r}
function slotAction(it){ /* اکشن «مدیریت» برای آیتم دارایی */
  var C=COSC();
  if(it.id==='fx_storm'||it.id==='fx_comet')return C.fx===(it.id==='fx_storm'?'storm':'comet')?{act:'setfx',label:'فعال ✓'}:{act:'setfx',label:'فعال‌سازی'};
  switch(it.slot){
    case 'hue':return{act:'openpick',label:'انتخاب رنگ'};
    case 'emblem':return it.id.indexOf('emst_')===0?{act:'openpick',label:'انتخاب طرح'}:{act:'openpick',label:'انتخاب نشان'};
    case 'title':return{act:'openpick',label:'انتخاب لقب'};
    case 'fx':return{act:'openpick',label:'انتخاب افکت'};
    case 'anthem':case 'entrance':case 'announce':case 'frame':
      return{act:'w43pick',label:'تنظیم'};
    case 'map_theme':return activeMapTheme()===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    /* V88 — اسلات‌های جدید */
    case 'cap_skin':return C.capSkin===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'landmark':return C.landmark===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'banner':return C.banner===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'wframe':return C.wframe===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'victory_fx':return C.vfx===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'war_emblem':return C.wemb===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'cmd_portrait':return C.cport===it.id?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'intel':case 'order':case 'tslot':return null; /* از برنامه‌ی نبرد استفاده می‌شوند */
    case 'cap_aura':return C.capAura===it.id.slice(9)?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'cap_theme':return C.capTheme==='royal'?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'cap_monument':return C.capMonument?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'cap_nameplate':return C.capNameplate?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'empire_highlight':return C.empHi?{act:'unequip',label:'برداشتن'}:{act:'equip',label:'فعال‌سازی'};
    case 'stats':return{act:'showstats',label:'نمودار'};
    case 'border_glow':return null;
  }
  return null}
function emptyBox(msg){var d=el('div',null,'wd66-note');d.textContent=msg;return d}
function loadingBox(){var d=el('div',null,'wd66-note');d.textContent='⏳ در حال دریافت فروشگاه از سرور…';return d}
function errBox(){ /* V111 — پیام صادقانه: اول سرور سنجیده می‌شود، اینترنت کاربر مقصر فرض نمی‌شود */
  var d=el('div',null,'wd66-note');var msg=el('div','⏳ در حال بررسی اتصال به سرور بازی…');msg.style.cssText='line-height:1.9';d.append(msg);
  var b=el('button','🔄 تلاش دوباره','wd66-buy');b.style.cssText='margin-top:8px;width:100%';
  b.setAttribute('data-act','retry');d.append(b);
  try{serverProbe().then(function(st){if(!d.isConnected)return;
    if(st==='down'){msg.textContent='📡 سرور بازی موقتاً در دسترس نیست — اینترنت شما سالم است ✓. این قطعی از سمت سرور است و معمولاً چند دقیقه بعد حل می‌شود؛ دکمه‌ی پایین را بزن تا خودکار دوباره تلاش کنیم.';
      var tip=el('div','💡 اگر بیش از یک ساعت طول کشید، از آیکون تلگرام (بالا-چپ) به کانال پشتیبانی خبر بده.','wd66-note');tip.style.cssText='margin-top:7px;background:none;border:none;padding:0;color:#8fb7ff';d.insertBefore(tip,b)}
    else{msg.textContent='⚠️ دریافت فروشگاه از سرور ناموفق بود — یک‌بار دیگر تلاش کن (اتصال سرور سالم است).'}})}catch(e){msg.textContent='⚠️ دریافت فروشگاه ناموفق بود. اتصال اینترنت را بررسی کن.'}
  return d}

/* ---------- ویترین‌ها ---------- */
function vHero(){var lim=null;
  (CAT66.items||[]).forEach(function(x){if(x.kind==='limited'&&x.window&&x.window.to>Date.now()&&(!lim||x.window.to<lim.window.to))lim=x});
  var w=el('div',null,'wd66-hero');
  if(lim){var left=Math.max(0,lim.window.to-Date.now());
    var days=Math.floor(left/864e5),hrs=Math.floor(left%864e5/36e5);
    w.append(el('div','🔥 آیتم محدود ویترین','ttl'));
    var row=el('div');row.style.cssText='display:flex;align-items:center;gap:10px;margin-top:8px';
    row.append(el('div',lim.icon||'🎖️','wd66-ico'));
    var tx=el('div');tx.append(el('div',esc(lim.fa),'ttl'),el('div',esc(lim.d||''),'sub'));
    row.append(tx);w.append(row);
    w.append(el('div','⏳ '+faN(days)+' روز و '+faN(hrs)+' ساعت مانده — بعد از پایان برای همیشه به موزه می‌رود','cd'));
    var b=el('button',ownOf(lim.id)?'داری ✓':'👁 مشاهده و خرید','wd66-buy'+(ownOf(lim.id)?' own':' alt'));
    b.disabled=ownOf(lim.id);b.style.cssText='margin-top:10px;width:100%';
    b.setAttribute('data-act','cat');b.setAttribute('data-cat','limited');w.append(b)}
  else w.append(el('div','✨ فروشگاه امپراتوری','ttl'),el('div','آیتم‌های کمیاب، مجموعه‌داری و خدمات ویژه','sub'));
  return w}
function vSmart(){var picks=[];var terr=0;try{terr=conqueredCountries.size}catch(e){}
  var vip=vipActive();
  if(terr<3)picks=['bundle_cos','col_pack','boost'];
  else if(terr<8)picks=['fx_conq','col_pack','radar'];
  else picks=['frame','anthem','vip30'];
  if(vip&&picks.indexOf('vip30')<0)picks.unshift('vip30');
  picks=picks.filter(function(id,i){return picks.indexOf(id)===i&&itemOf(id)&&!ownOf(id)}).slice(0,3);
  if(!picks.length)return null;
  var w=el('div');w.append(el('div','🧠 پیشنهاد برای تو','wd66-h'));
  var s=el('div',null,'wd66-sec');picks.forEach(function(id){s.append(card(itemOf(id)))});w.append(s);return w}
function vQuick(){var q=el('div',null,'wd66-quick');
  CATS.filter(function(c){return c.id!=='home'}).forEach(function(c){
    var b=el('button');b.append(el('span',c.ic),el('span',c.fa));
    b.setAttribute('data-act','cat');b.setAttribute('data-cat',c.id);q.append(b)});return q}
/* ---------- V108 — پک شروع امپراتور (تایمر/شرایط فقط سرور) ---------- */
var TIMER108=null;
/* V111 — قیمت ویژه‌ی جذب پلیر: ۲۸۰ تومان به‌جای ۵۰۰ تومان (سنکرون باید با پنل مایکت هم باشد) */
var WD_STARTER_PRICE={now:'۲۸۰ تومان',old:'۵۰۰ تومان',badge:'۴۴٪ تخفیف'};
function starterData(){try{return (CAT66&&CAT66.starter)||null}catch(e){return null}}
function faClock(ms){ms=Math.max(0,ms);var h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4),s=Math.floor(ms%6e4/1e3);
  var p=function(x){return (x<10?'۰':'')+faN(x)};return p(h)+':'+p(m)+':'+p(s)}
function vStarter(){
  var st=starterData();
  if(st&&st.phase!=='offer')return null;
  if(!st&&!OFF66)return null; /* V112: آنلاین بدون آفرِ سرور = نه؛ ولی در قطعی سرور، کارت ۲۸۰ تومانی همیشه دیده می‌شود */
  var off=!st;
  /* V114: آفر نامحدود شد (برای همه‌ی بازیکنان تا خرید) — تایمر فقط وقتی سرور پنجره داد */
  var limited=!!(st&&!st.unlimited&&Number(st.ends_in_ms)>0);
  var endsAt=limited?(Date.now()+Math.max(0,Number(st.ends_in_ms)||0)):0;
  var w=el('div',null,'wd108-starter');
  w.append(el('div','👑','crown'));
  w.append(el('div','👑 EMPEROR STARTER PACK','ttl'));
  w.append(el('div','«اولین گام تو به سمت ساختن یک امپراتوری» — برای همه‌ی بازیکنان، فقط یک‌بار برای هر حساب','sub'));
  var row=el('div');row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px';
  /* V111 — قیمت تخفیف‌دار: ۵۰۰ تومان خط‌خورده ← ۲۸۰ تومان */
  var pr=el('div');pr.style.cssText='display:flex;flex-direction:column;gap:3px;min-width:0';
  var pl=el('div');pl.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap';
  pl.append(el('div',WD_STARTER_PRICE.now,'wd108-price'));
  pl.append(el('span',WD_STARTER_PRICE.old,'wd108-old'));
  pl.append(el('span',WD_STARTER_PRICE.badge,'wd108-save'));
  pr.append(pl);
  pr.append(el('div','⭐ پیشنهاد ویژه‌ی شروع — قیمت اصلی این پک ۵۰۰ تومان بود و حالا شده ۲۸۰ تومان','wd108-oldnote'));
  row.append(pr);
  var t=limited?el('span','⏳ …','wd108-timer'):null;if(t)row.append(t);w.append(row);
  var g=el('div',null,'wd108-grid');
  var ctn=((st&&st.contents)||{});
  var items108=[['💎',gemN(ctn.gems||1200)+' جم'],['🪙',gemN(ctn.gold||0)+' طلا'],['🛢️',gemN(ctn.oil||0)+' نفت'],['🍞',gemN(ctn.food||0)+' غذا'],
    ['⚡','بوست تولید '+faN(ctn.boost_min||60)+' دقیقه'],['🪖','تدارک جنگی ×'+faN(ctn.war_supply||0)],['⏩','مالیات فوری'],
    ['👑','قاب نام افسانه‌ای'],['🚩','پرچم انحصاری امپراتوری'],['✨','افکت فتح: تاج‌گذاری'],['🏛️','بنای انحصاری: دژ امپراتور'],['🎖️','کازمتیک نسخه‌ی محدود']];
  items108.forEach(function(x){var d2=el('div',null,'wd108-it');d2.append(el('span',x[0]));d2.append(el('span',x[1]));g.append(d2)});
  w.append(g);
  var b=el('button','🛒 BUY NOW — '+WD_STARTER_PRICE.now,'wd108-buy');
  b.setAttribute('data-act','starter');w.append(b);
  if(off)w.append(el('div','🔌 نمایش آفلاین — خرید این پک پس از وصل‌شدن سرور فعال می‌شود.','wd108-oldnote'));
  w.append(el('div','✅ قیمت قبل از خرید مشخص است • بدون هزینه‌ی پنهان • فقط یک‌بار برای هر حساب (وضعیت خرید سمت سرور — پاک‌کردن حافظه مرورگر اثری ندارد) • ارزش جم بر اساس نرخ بهترین بسته‌ی واقعی فروشگاه.','wd108-hint'));
  /* تایمر خودپاک — فقط وقتی داده‌ی سرور هست و پنجره‌ی زمانی دارد؛ اعتبار با سرور است */
  try{
    if(off||!limited||!t)return w;
    var tick=function(){var m=H('m-shop');
      if(!m||!m.classList.contains('active')||!t.isConnected){clearInterval(TIMER108);TIMER108=null;return}
      t.textContent='⏳ '+faClock(endsAt-Date.now())};
    if(!TIMER108)TIMER108=setInterval(tick,1000);tick();
  }catch(e){}
  return w}
function starterConfirm(){
  var st=starterData();if(!st||st.phase!=='offer')return;
  var ctn=st.contents||{};
  var m=el('div',null,'wd66-pv');
  var box=el('div','card');
  var hd=el('div',null,'hd');hd.append(el('b','👑 EMPEROR STARTER PACK'));
  var x=el('button','✕');x.onclick=function(){m.remove()};hd.append(x);box.append(hd);
  box.append(el('div','💡 این پک شامل موارد زیر است:','wd66-h'));
  var g=el('div',null,'wd108-grid');
  var items108=[['💎',gemN(ctn.gems||0)+' جم (موجودی دائمی)'],['🪙',gemN(ctn.gold||0)+' طلا'],['🛢️',gemN(ctn.oil||0)+' نفت'],['🍞',gemN(ctn.food||0)+' غذا'],
    ['⚡','بوست تولید '+faN(ctn.boost_min||0)+' دقیقه'],['🪖','تدارک جنگی ×'+faN(ctn.war_supply||0)],['⏩','مالیات فوری'],
    ['👑','قاب نام افسانه‌ای امپراتور'],['🚩','پرچم انحصاری امپراتوری'],['✨','افکت فتح: تاج‌گذاری'],['🏛️','بنای انحصاری: دژ امپراتور'],['🎖️','کازمتیک نسخه‌ی محدود: تاج جنگ']];
  items108.forEach(function(x){var d2=el('div',null,'wd108-it');d2.append(el('span',x[0]));d2.append(el('span',x[1]));g.append(d2)});
  box.append(g);
  box.append(el('div','💵 قیمت: '+WD_STARTER_PRICE.now+' (به‌جای '+WD_STARTER_PRICE.old+') — پرداخت یک‌بار، بدون تمدید خودکار.','wd108-hint'));
  var row=el('div');row.style.cssText='display:flex;gap:8px;margin-top:10px';
  var c=el('button','انصراف','wd66-buy off');c.style.cssText='flex:1';c.onclick=function(){m.remove()};
  var ok=el('button','✅ خرید','wd108-buy');ok.style.marginTop='0';ok.style.cssText='flex:1;margin-top:0';
  ok.onclick=function(){ok.disabled=true;ok.textContent='⏳…';starterClaim(ok,m)};
  row.append(c,ok);box.append(row);
  m.append(box);D.body.appendChild(m)}
function starterReveal(res){
  var m=el('div',null,'wd108-reveal');
  var box=el('div','card');
  box.append(el('div','🎉 تبریک، امپراتور!','ttl'));
  box.append(el('div','پک شروع امپراتور فعال شد — همه‌ی موارد زیر اضافه شد:','sub'));
  var g=el('div',null,'wd108-grid');
  var list=[['💎',gemN((res.resources?0:0)||res.gems||(starterData()||{contents:{}}).contents.gems||1200)+' جم']].concat(
    [['🪙',gemN(res.resources.gold)+' طلا'],['🛢️',gemN(res.resources.oil)+' نفت'],['🍞',gemN(res.resources.food)+' غذا'],['🪖','تدارک جنگی ×'+faN(res.war_supply||0)]]
  );
  (res.grants||[]).forEach(function(x){list.push([x.ic||'👑',x.fa])});
  list.forEach(function(x){var d2=el('div',null,'wd108-it rit');d2.append(el('span',x[0]));d2.append(el('span',x[1]));g.append(d2)});
  g.querySelectorAll('.rit').forEach(function(n2,i){n2.style.animationDelay=(i*0.09)+'s'});
  box.append(g);
  var b=el('button','🚀 ادامه‌ی فتح','wd108-buy');b.onclick=function(){m.remove()};box.append(b);
  m.append(box);D.body.appendChild(m)}
/* ---------- V118 — پرداخت واقعی مایکت (IAB v3) از طریق پل اندروید ----------
   این ماژول فقط «شروع خرید» و «ارسال رسید خام به سرور» را انجام می‌دهد؛
   جم هرگز در کلاینت ساخته نمی‌شود — گرنت فقط بعد از راستی‌آزمایی سرور با API رسمی مایکت. */
function wdNative(){try{return !!(window.WDAndroid&&window.WDAndroid.billingAvailable&&window.WDAndroid.billingAvailable()==='1')}catch(e){return false}}
var WDPAY=null; /* {type:'gem'|'starter', sku, rid, btn, modal} */
var WD_NOMYKET_RETRY=false; /* V146: ضد تلاش‌های موازیِ اتصال مستقیم */
var WD_RESTORED=false;
window.__wdOnPurchase=function(o){
  var p=WDPAY,st=o&&o.status;
  WDPAY=null;
  try{console.log('WD-PAY',st)}catch(e){}
  if(!p){return}
  if(st==='ok'&&o.token){
    if(p.type==='starter')wdStarterServer(o,p);else wdGemServer(o,p);
  }else{
    showToast(st==='cancel'?'پرداخت لغو شد':st==='pending'?'⏳ پرداخت در حال بررسی است — بعداً به‌طور خودکار اعمال می‌شود':o.code===-2?'⏳ اتصال به فروشگاه بیش از حد طول کشید — مطمئن شو فروشگاه نصب و به‌روز است':'❌ پرداخت انجام نشد. دوباره تلاش کنید.',st==='cancel'?'win':'lose');
    if(p.btn){p.btn.disabled=false;if(p.type==='starter')p.btn.textContent='✅ خرید'}
  }
};
function wdStartPurchase(sku,plan){
  if(!wdNative()){showToast('❌ خرید امن فقط داخل اپلیکیشن بازی فعال است','lose');return false}
  if(WDPAY){showToast('⏳ یک پرداخت دیگر در جریان است','lose');return false}
  var r=null;try{r=window.WDAndroid.startPurchase(String(sku))}catch(e){r='0:error'}
  if(r==='1'){WDPAY=plan;showToast('💳 در حال اتصال به پرداخت…','win');return true}
  /* V120: نگاشت دقیق کد خطای پل به پیام قابل‌اقدام + واژگان خنثی «فروشگاه» (آماده‌ی انتشار در هر استور).
     کدها از WDIab.buy می‌آیند: rc3=BILLING_UNAVAILABLE، rc4=ITEM_UNAVAILABLE، rc5=DEVELOPER_ERROR. */
  var PAYERR={'0:nomyket':'❌ اتصال به فروشگاه برقرار نشد — اپ مایکت را باز کن و دوباره تلاش کن',
    '0:bind':'🔒 مایکت روی گوشی هست ولی بازی اجازه‌ی اتصال به سرویس پرداخت را نگرفت — این نسخه‌ی بازی قدیمی است (مجوز پرداخت مایکت را ندارد)؛ بازی را به نسخه‌ی ۱.۰.۱۵ یا بالاتر به‌روز کن',
    '0:rc3':'⚠️ نسخه‌ی فروشگاه روی گوشی قدیمی است — اول فروشگاه را به‌روز کن',
    '0:rc4':'⚠️ این محصول هنوز در فروشگاه فعال نشده — محصولات درون‌برنامه‌ای باید در پنل توسعه‌دهنده ساخته و فعال شوند',
    '0:rc5':'⚠️ فروشگاه این نسخه از بازی را تأیید نکرد — یا بازی هنوز در فروشگاه فعال نیست یا امضای APK با پنل نمی‌خواند',
    '0:busy':'⏳ یک خرید دیگر در جریان است — چند لحظه صبر کن',
    '0:remote':'❌ ارتباط با فروشگاه قطع شد — مطمئن شو فروشگاه نصب و به‌روز است و اینترنت داری',
    '0:send':'❌ صفحه‌ی پرداخت باز نشد — دوباره تلاش کن',
    '0:nopi':'❌ صفحه‌ی پرداخت ساخته نشد — دوباره تلاش کن',
    '0:error':'❌ خطای غیرمنتظره در پرداخت — رایج‌ترین علت: بازی هنوز در فروشگاه تأیید/منتشر نشده یا نسخه‌ی فروشگاه قدیمی است. بعد از آپلود بازی و تأیید محصولات در پنل، دوباره تلاش کن',
    '0:sec':'🔒 فروشگاه اجازه‌ی خرید به این بازی را نداد — بازی باید از پنل توسعه‌دهنده آپلود و تأیید شده باشد (همین امضا)'};
  /* V121: کدهای پسوندی از Java جدید (0:error:<Exception> / 0:sec:<Exception>) با تطبیق پیشوند */
  var pmsg=PAYERR[r]||null;
  if(!pmsg&&r.indexOf('0:error:')===0)pmsg='❌ خطای پرداخت ('+r.slice(8)+') — رایج‌ترین علت: بازی هنوز در فروشگاه تأیید نشده؛ از پنل بازی/محصولات را آپلود و تأیید کن';
  if(!pmsg&&r.indexOf('0:sec:')===0)pmsg=PAYERR['0:sec'];
  /* V146 — دستور مالک: هیچ مودال/گامِ «نصب/به‌روزرسانی از مایکت» وجود ندارد.
     با زدن دکمه‌ی خرید، اتصال به فروشگاه مستقیم شروع می‌شود (WDIab.buy خودش هر بار setup تازه می‌زند)؛
     اگر سرویس فروشگاه در همان لحظه آماده نبود، یک‌بار خودکار دوباره تلاش می‌شود؛
     اگر وصل نشد فقط toast صادقانه — بدون هیچ پیام «نصب/به‌روزرسانی». */
  if(r==='0:nomyket'){
    showToast('💳 در حال اتصال به فروشگاه…','win');
    if(!WD_NOMYKET_RETRY){
      WD_NOMYKET_RETRY=true;
      setTimeout(function(){
        WD_NOMYKET_RETRY=false;
        if(WDPAY)return;
        var r2=null;try{r2=window.WDAndroid.startPurchase(String(sku))}catch(e){r2='0:error'}
        if(r2==='1'){WDPAY=plan;try{if(plan.btn)plan.btn.disabled=true}catch(e){}return}
        showToast(PAYERR['0:nomyket']||'❌ اتصال به فروشگاه برقرار نشد','lose');
        try{if(plan.btn)plan.btn.disabled=false}catch(e){}
      },1500);
    }
    return false;
  }
  showToast(pmsg||('❌ اتصال به فروشگاه برقرار نشد (کد: '+r+') — فروشگاه را به‌روز کن و دوباره تلاش کن'),'lose');
  return false;
}
function wdGemServer(o,p){
  var s=sb;if(!s){showToast('❌ برای اعمال خرید باید آنلاین باشی','lose');return}
  /* V144: json+signature خام هم به سرور می‌رود — مسیر راستی‌آزمایی با کلید عمومی مایکت
     (وقتی اعتبار API ست نشده باشد، سرور امضای RSA رسید را با کلید عمومی پنل تأیید می‌کند) */
  s.rpc('shop_gem_topup',{p_sku:p.sku,p_token:String(o.token||''),p_order_id:String(o.order_id||''),p_json:String(o.json||''),p_sig:String(o.signature||'')}).then(function(r2){
    var d=r2&&r2.data;
    if(r2.error||!d||!d.ok){
      var e=(d&&d.error)||'x';
      showToast(e==='receipt_consumed'?'⚠️ این خرید قبلاً اعمال شده بود':'❌ خرید انجام شد ولی اعمال نشد — لطفاً به پشتیبانی پیام بده','lose');
      if(p.btn)p.btn.disabled=false;
      return;
    }
    var added=(d.gems_added|0);
    try{if(CAT66&&d.wallet&&typeof d.wallet.gems==='number'){CAT66.wallet.gems=d.wallet.gems;GEMS=d.wallet.gems}}catch(e){}
    try{updateUI()}catch(e){}
    showToast(added>0?('✅ خرید با موفقیت انجام شد — '+gemN(added)+' جم اضافه شد'):'✅ این خرید قبلاً اعمال شده بود','win');
    try{window.WDAndroid.consumePurchase(String(o.token))}catch(e){}
    try{render()}catch(e){}
    if(p.btn)p.btn.disabled=false;
  }).catch(function(){showToast('❌ خطای شبکه در اعمال خرید — دوباره فروشگاه را باز کن','lose');if(p.btn)p.btn.disabled=false});
}
function wdStarterServer(o,p){
  var s=sb;if(!s){showToast('❌ برای اعمال خرید باید آنلاین باشی','lose');return}
  /* V144: p_json/p_sig برای مسیر تأیید امضای مایکت روی سرور */
  s.rpc('starter_claim',{p_provider:'myket',p_receipt:String(o.token||''),p_request_id:p.rid||('my'+Date.now().toString(36)),p_json:String(o.json||''),p_sig:String(o.signature||'')}).then(function(r){starterClaimAfter(r,p.btn,p.modal)}).catch(function(){showToast('❌ اتصال برقرار نشد','lose');if(p.btn){p.btn.disabled=false;p.btn.textContent='✅ خرید'}})
}
/* بازیابی خریدهای باز: پرداخت موفق ولی اعمال‌نشده (برنامه وسط کار بسته شد) — یک‌بار در هر سشن.
   V146 (مورد ۱ گزارش پرداخت): بدنه به wdRestoreItems جداشد تا مسیر استارتِ بازی هم از همان
   منطق رسمی استفاده کند؛ هر آیتم فقط بعد از راستی‌آزمایی سرور اعمال می‌شود — کلاینت هرگز جم نمی‌دهد.
   V151 (G1): دو شکل ورودی — APK v1.0.14 آبجکت {raw,sig} می‌دهد (امضای رسید برای مسیر RSA سرور؛
   رشته‌ی raw عمداً دست‌نخورده می‌ماند — RSA روی متنِ دقیق است)؛ APK قدیم v1.0.13 آبجکت مستقیم
   بدون امضا می‌دهد (همان مسیر API قبلی). p_json/p_sig فقط وقتی امضا واقعا موجود است پر می‌شود. */
function wdRestoreItems(arr){
  (Array.isArray(arr)?arr:[]).forEach(function(x){
      var o=x,raw='',sig='';
      if(x&&typeof x==='object'&&typeof x.raw==='string'){raw=x.raw;sig=String(x.sig||'');try{o=JSON.parse(raw)}catch(e){return}}
      if(!o||typeof o!=='object')return;
      var sku=String(o.productId||''),tok=String(o.purchaseToken||'');
      if(!tok||!sb)return;
      /* V119: بازیابی پک شروعِ پرداخت‌شده ولی اعمال‌نشده (کلیدها دیر فعال شدند / وسط کار بسته شد) —
         سرور با txId دوباره‌گرنت نمی‌دهد؛ duplicate یعنی قبلاً اعمال شده */
      if(sku==='emperor_starter'){
        sb.rpc('starter_claim',{p_provider:'myket',p_receipt:tok,p_request_id:'rest'+Date.now().toString(36),p_json:raw,p_sig:sig}).then(function(r){
          if(r&&r.data&&r.data.ok&&!r.data.duplicate){showToast('✅ خرید پیشین‌ات اعمال شد — پک شروع امپراتور','win');try{updateUI()}catch(e){}try{render()}catch(e){}}
        }).catch(function(){});
        return;
      }
      if(sku.indexOf('gems_')!==0)return;
      sb.rpc('shop_gem_topup',{p_sku:sku,p_token:tok,p_order_id:String(o.orderId||''),p_json:raw,p_sig:sig}).then(function(r2){
        var d=r2&&r2.data;
        if(d&&d.ok){
          try{window.WDAndroid.consumePurchase(tok)}catch(e){}
          if(d.duplicate===false){
            try{if(CAT66&&d.wallet&&typeof d.wallet.gems==='number'){CAT66.wallet.gems=d.wallet.gems;GEMS=d.wallet.gems}}catch(e){}
            showToast('✅ خرید پیشین‌ات اعمال شد — '+gemN(d.gems_added|0)+' جم','win');
            try{updateUI()}catch(e){}
          }
        }
      }).catch(function(){});
  });
}
function wdRestore(){
  if(WD_RESTORED||!wdNative()||WDPAY)return;WD_RESTORED=true;
  try{wdRestoreItems(JSON.parse(window.WDAndroid.ownedPurchases()||'[]'))}catch(e){}
}
/* V146 (مورد ۲ گزارش پرداخت) — بازیابی خودکار در استارتِ بازی، بدون نیاز به بازکردن فروشگاه.
   سرویس فروشگاه در لحظه‌ی شروع ممکن است هنوز وصل نباشد؛ ownedPurchases خالی یعنی «آماده نیست»
   یا «خرید بازی نداری» — پس حداکثر ۴ تلاش فاصله‌دار (هر ۸ ثانیه) می‌زنیم و بعد رها می‌کنیم.
   اگر WDPAY فعال شود یا بازیابی دستی انجام شود، حلقه فوراً می‌ایستد. */
var WD_BOOT_TRIES=0;
function wdRestoreBoot(){
  if(WD_RESTORED||!wdNative()||WDPAY)return;
  if(WD_BOOT_TRIES>=4)return;
  WD_BOOT_TRIES++;
  var arr=null;
  try{arr=JSON.parse(window.WDAndroid.ownedPurchases()||'[]')}catch(e){}
  if(Array.isArray(arr)&&arr.length){WD_RESTORED=true;wdRestoreItems(arr);return}
  setTimeout(wdRestoreBoot,8000);
}
function starterClaim(btn,modal){
  var s=sb;if(!s){showToast('❌ برای خرید باید آنلاین باشی','lose');if(btn)btn.disabled=false;return}
  var rid=null;try{rid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():('st'+Date.now().toString(36)+Math.random().toString(36).slice(2,10))}catch(e){}
  /* V118 — پرداخت واقعی: داخل اپ = جریان دو‌مرحله‌ای مایکت (startPurchase → __wdOnPurchase → starter_claim با توکن واقعی)؛
     روی وب بدون پل، مسیر QA سرور تستی می‌ماند — سرور واقعی صادقانه رد می‌کند (هیچ خرید فیک). */
  if(wdNative()){
    var started118=wdStartPurchase('emperor_starter',{type:'starter',sku:'emperor_starter',rid:rid,btn:btn,modal:modal});
    if(started118&&btn)btn.textContent='⏳…';
    return;
  }
  var provider='sandbox', receipt='SBX-'+rid;
  s.rpc('starter_claim',{p_provider:provider,p_receipt:receipt,p_request_id:rid}).then(function(r){starterClaimAfter(r,btn,modal)}).catch(function(){showToast('❌ اتصال برقرار نشد','lose');if(btn){btn.disabled=false;btn.textContent='✅ خرید'}})}
function starterClaimAfter(r,btn,modal){
    if(r.error||!r.data||!r.data.ok){
      var e=(r.data&&r.data.error)||'x';
      var msg=e==='purchased'?'✅ این پک قبلاً برای این حساب خریداری شده است'
        :e==='expired'?'⏳ مهلت ۴۸ ساعته‌ی این پیشنهاد تمام شده است'
        :e==='provider_unavailable'?'🔒 پرداخت واقعی به‌زودی فعال می‌شود — پک با اپلیکیشن جدید بازی (یا درگاه) قابل خرید است'
        :'❌ خرید انجام نشد'+(e?(' ('+e+')'):'');
      showToast(msg,'lose');if(btn){btn.disabled=false;btn.textContent='✅ خرید'}
      return}
    if(r.data.duplicate){showToast('✅ این پک قبلاً فعال شده بود','win');if(modal)modal.remove();return}
    /* موفق — اثرهای کلاینت-مجاز طبق الگوی رسمی (منابع از ledger؛ بقیه سمت سرور اتمیک شد) */
    try{
      GEMS=Number(r.data.gems)||GEMS;
      if(r.data.boost_until)BOOST=Date.parse(r.data.boost_until);
      if(r.data.resources){playerRes.gold+=(Number(r.data.resources.gold)||0);playerRes.oil+=(Number(r.data.resources.oil)||0);playerRes.food+=(Number(r.data.resources.food)||0)}
      if(r.data.tax_instant){try{COOL.tax=0;taxReady=true;clearInterval(taxCooldownTimer);var b=S$('act-tax'),l=S$('tax-cooldown-text');if(b)b.disabled=false;if(l)l.textContent='آماده جمع‌آوری'}catch(e){}}
      (r.data.grants||[]).forEach(function(x){try{
        markOwned(x.id);
        var C=COSC();if(!C.owned)C.owned=[];
        if(C.owned.indexOf(x.id)<0)C.owned.push(x.id);
        if(x.id==='sp_fx_conquest')C.fx='conq108';
        if(x.id==='sp_flag_imperial')C.banner='sp_flag_imperial';
        if(x.id==='sp_frame_imperial')C.frameStyle='imperial';
        if(x.id==='sp_landmark_citadel')C.landmark='sp_landmark_citadel';
      }catch(e){}});
      applyOwned();if(typeof saveNow==='function')saveNow();updateUI();
      if(CAT66&&r.data.gems!=null)CAT66.wallet.gems=r.data.gems;
      if(CAT66&&CAT66.starter){CAT66.starter.phase='purchased'}
      try{if(window.WD88)window.WD88._wsAt=0}catch(e){}
    }catch(e){}
    if(modal)modal.remove();
    starterReveal(r.data);
    showToast('👑 پک شروع امپراتور فعال شد!','win');
    if(typeof updateUI==='function')updateUI();
    render();
}
function wdGemBtn(p){
  /* V120 — داخل اپ: دکمه‌ی خرید درون‌برنامه‌ای با متن خنثی (بدون برند فروشگاه — آماده‌ی بازار/پلی)؛ روی وب: وضعیت «به‌زودی» بدون خرید جعلی */
  if(!wdNative())return el('button','🔒 به‌زودی','wd66-buy off wd114-gbuy');
  var b=el('button','🛒 خرید جم','wd66-buy wd114-gbuy');
  b.setAttribute('data-sku',p.id);
  b.onclick=function(){
    b.disabled=true;
    var started=wdStartPurchase(p.id,{type:'gem',sku:p.id,btn:b});
    if(!started)b.disabled=false;
  };
  return b}

function viewHome(c){c.append(vHero());
  var stc=vStarter();if(stc)c.append(stc);
  var sm=vSmart();if(sm)c.append(sm);
  c.append(el('div','🔥 پیشنهادهای ویژه','wd66-h'));
  var s=el('div',null,'wd66-sec');
  var bundle=itemOf('bundle_cos');if(bundle&&!ownOf('bundle_cos'))s.append(card(bundle));
  (CAT66.items||[]).filter(function(x){return x.kind==='mystery'&&x.id!=='lucky'}).slice(0,1).forEach(function(x){s.append(card(x))});
  var emstOrbit=itemOf('emst_orbit');if(emstOrbit&&!ownOf('emst_orbit'))s.append(card(emstOrbit));
  c.append(s);
  c.append(el('div','🗂️ همه‌ی دسته‌ها','wd66-h'));c.append(vQuick());
  if(!WALLET_OK)c.append(el('div','⚠️ خرید فقط با حساب آنلاین و انتخاب پایتخت فعال می‌شود.','wd66-note'))}
function viewGems(c){
  /* V118 — بازیابی خریدهای باز (پرداخت موفق ولی اعمال‌نشده) — فقط داخل اپ */
  try{wdRestore()}catch(e){}
  /* V112 — پک پیشنهاد ویژه‌ی ورود ۲۸۰ تومانی، جلوی چشم در بخش خرید جم */
  var vsp=vStarter();if(vsp){c.append(vsp)}
  var PG=(CAT66.packs||[]);/* V122: پرداخت خاموش — با کاتالوگ بی‌پک، کل بخش «بسته‌های جم» رندر نمی‌شود */
  if(PG.length)c.append(el('div','💎 بسته‌های جم','wd66-h'));
  var g=el('div',null,'wd66-packgrid');
  /* V114 — بازطراحی کامل کارت‌های جم: آیکون درخشان وسط، سلسله‌مراتب تمیز قیمت/نرخ/دکمه — پایان به‌هم‌ریختگی */
  /* V85 پریمیوم: تشخیص بهترین نرخ (کمترین perGem) — نشان «بهترین نرخ» + قاب طلایی */
  var best85=null;(CAT66.packs||[]).forEach(function(p){var n=Number(String(p.perGem).replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)}));if(n&&(!best85||n<best85.n))best85={n:n,p:p}});
  (CAT66.packs||[]).forEach(function(p){
    var isBest=best85&&best85.p===p;
    var r=el('div',null,'wd66-card wd66-pack wd114-gpack'+(isBest?' best':''));
    if(isBest)r.append(el('div','👑 بهترین نرخ','wd66-besttag'));
    /* آیکون جم پریمیوم: پلاک چندلایه + برق متحرک + هاله‌ی نور */
    var ico=el('div',null,'wd114-gico');
    ico.append(el('span','💎','wd114-gem'));
    ico.append(el('i',null,'wd114-gspark'));
    r.append(ico);
    r.append(el('div',gemN(p.gems)+' جم','wd114-gtitle'));
    r.append(el('div','پک '+p.name,'wd114-gsub'));
    var pr=el('div',null,'wd114-gprice');
    pr.append(el('span','💵'),el('b',p.price));
    r.append(pr);
    r.append(el('div','هر جم ≈ '+p.perGem+' تومان','wd114-grate'));
    var b=wdGemBtn(p);
    r.append(b);g.append(r)});
  if(PG.length)c.append(g);
  c.append(el('div','🛒 بوست و منابع (مصرفی)','wd66-h'));
  itemsOfCat('resource').forEach(function(it){c.append(card(it,{owned:false}))})}
function viewOffers(c){
  c.append(el('div','🔥 پیشنهادهای ویژه — بیشترین ارزش','wd66-h'));
  var b=itemOf('bundle_cos');if(b)c.append(card(b,{owned:ownOf('bundle_cos')}));
  c.append(el('div','💡 پک‌های ترکیبی هویت','wd66-h'));
  var v=el('div',null,'wd66-card');v.append(el('div','📦','wd66-ico'));
  var tx=el('div',null,'wd66-tx');tx.append(el('b','راهنمای انتخاب هوشمند'));
  tx.append(el('small','تازه‌کار هستی؟ پک کامل امپراتور. جنگ‌محور هستی؟ افکت‌ها + قاب جنگی. مجموعه‌دار هستی؟ نشان‌های ویژه و آیتم‌های محدود.'));
  v.append(tx);c.append(v);
  (CAT66.items||[]).filter(function(x){return x.rar==='legendary'||x.rar==='mythic'}).slice(0,6).forEach(function(x){c.append(card(x))})}
function viewIdentity(c){
  c.append(el('div','👑 هویت امپراتوری — پرچم، نشان، لقب و قاب','wd66-h'));
  c.append(el('div','🎨 رنگ امپراتوری','wd66-h'));
  ['col_pack'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  c.append(el('div','🏳️ نشان و طرح‌های ویژه','wd66-h'));
  ['emblem'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  itemsOfCat('identity').filter(function(x){return x.id.indexOf('emst_')===0}).forEach(function(it){c.append(card(it))});
  c.append(el('div','🏷️ پلاک و نشان قدرت','wd66-h'));
  ['emp_nameplate','emp_power_badge'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  c.append(el('div','👑 لقب و قاب','wd66-h'));
  ['title','frame','entrance','announce'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))})}
function viewBattle(c){
  c.append(el('div','⚔️ کازمتیک جنگ — نمایشی، صفر قدرت جنگی','wd66-h'));
  ['fx_conq','fx_storm','fx_comet','war_badge','battle_frame'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  c.append(el('div','🎯 عملیات حمله‌ای (بدون کول‌داون و سقف)','wd66-h'));
  c.append(el('div','نفوذ سایبری، راید کماندو، موشک پنچر و ضربه‌ی هسته‌ای — بدون کول‌داون و سقف؛ تنها هزینه جم و پیامد جهانی (تنش/دولت سرکش) است — V159','wd66-note'));
  try{if(window.WD54_SO_CARD&&window.WD54_OPS)Object.keys(WD54_OPS).forEach(function(k){var cd=WD54_SO_CARD(k);if(cd)c.append(cd)})}catch(e){}}
function viewMap(c){
  c.append(el('div','🗺️ کازمتیک نقشه — پیش‌نمایش واقعی قبل از خرید','wd66-h'));
  ['map_ocean_azure','map_ocean_midnight','map_ocean_jade','empire_highlight','border_glow'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  c.append(el('div','✅ تم اقیانوس فقط نقشه‌ی خودت را عوض می‌کند و با بستن پیش‌نمایش بدون تغییر باقی می‌ماند.','wd66-note'))}
function viewCapital(c){
  c.append(el('div','🏛️ شخصی‌سازی پایتخت','wd66-h'));
  ['cap_aura_gold','cap_aura_ice','cap_aura_flame','cap_monument','cap_nameplate','cap_theme_royal'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  c.append(el('div','✅ هر آیتم را می‌توانی فعال یا بردار — همیشه از انبار.','wd66-note'))}
function colOwnedCount(col){var n=0;
  col.members.forEach(function(mid){
    if(mid.indexOf('*')===mid.length-1){var base=mid.slice(0,-1);
      for(var k in OWN66)if(k===base||k.indexOf(base+'@')===0){n++;return}
      if(base==='medal_s1'&&(COSC().medals||[]).length&&hasMedalAny())n++;
      return}
    if(ownOf(mid))n++});
  return n}
function hasMedalAny(){try{return (COSC().medals||[]).length>0}catch(e){return false}}
function viewCollections(c){
  c.append(el('div','🏆 مجموعه‌ها — تکمیل کن، پاداش ویژه بگیر','wd66-h'));
  (CAT66.collections||[]).forEach(function(col){
    var total=col.members.length,n=colOwnedCount(col);
    var pct=total?Math.round(n/total*100):0;
    var r=el('div',null,'wd66-colcard');
    var hd=el('div');hd.append(el('span',col.icon),el('b','مجموعه‌ی '+col.fa),el('span',faN(n)+'/'+faN(total),'pct'));
    r.append(hd);
    var bar=el('div',null,'wd66-bar');var fill=el('i');fill.style.width=pct+'%';bar.append(fill);r.append(bar);
    var rw=itemOf(col.reward);
    var mem=el('div',null,'mem');
    mem.textContent='پاداش تکمیل: '+(rw?(rw.icon+' '+rw.fa):'—')+' • اعضا: '+col.members.map(function(m){var it=itemOf(m.replace('*',''));return it?it.icon:'•'}).join(' ');
    r.append(mem);
    if(pct>=100&&!ownOf(col.reward)){
      var b=el('button','🎁 دریافت پاداش','wd66-buy alt');b.style.cssText='margin-top:9px;width:100%';
      b.setAttribute('data-act','claim');b.setAttribute('data-col',col.id);r.append(b)}
    else if(ownOf(col.reward)){var ob=el('button','✓ پاداش گرفته شد','wd66-buy own');ob.disabled=true;ob.style.cssText='margin-top:9px;width:100%';r.append(ob)}
    c.append(r)})}
function viewMystery(c){
  c.append(el('div','🎁 صندوق‌های شانس — قرعه فقط سمت سرور، شفاف','wd66-h'));
  ['lucky','mystery_premium'].forEach(function(id){var it=itemOf(id);if(!it)return;
    c.append(card(it,{owned:false}));
    var m=CAT66.mystery&&CAT66.mystery[id];
    if(m){var tbl=el('table',null,'wd66-odds');
      m.odds.forEach(function(o){var tr=el('tr');
        tr.append(el('td',faN(o.pct)+'٪'));
        var td=el('td');
        var txt=o.kind==='gems'?('💎 جم'+(o.min?' '+gemN(o.min)+' تا '+gemN(o.max):'')):('🎁 آیتم '+o.fa);
        td.textContent=txt;tr.append(td);
        var td2=el('td');td2.textContent=(o.items||[]).map(function(x){var it2=itemOf(x);return it2?it2.icon:''}).join('');tr.append(td2);
        tbl.append(tr)});
      var wrap=el('div',null,'wd66-card');wrap.style.cssText='display:block';
      wrap.append(el('b','📊 شانس‌ها (نمایش شفاف)'));
      wrap.append(tbl);c.append(wrap)}});
  c.append(el('div','🔒 نتیجه‌ی قرعه روی سرور تعیین می‌شود و کلاینت هیچ نقشی در آن ندارد. اگر همه‌ی آیتم‌های استخر را داشته باشی، جم جایگزین می‌گیری.','wd66-note'))}
function viewVip(c){
  var act=vipActive();
  c.append(el('div','👑 VIP — راحتی و ظاهر، بدون برتری جنگی','wd66-h'));
  var st=el('div',null,'wd66-card');st.append(el('div','👑','wd66-ico'));
  var tx=el('div',null,'wd66-tx');
  tx.append(el('b',act?('VIP فعال — '+faN(Math.max(1,Math.ceil((vipUntil()-Date.now())/864e5)))+' روز مانده'):'VIP فعال نیست'));
  tx.append(el('small',act?('پایان: '+new Date(vipUntil()).toLocaleDateString('fa-IR')):'با فعال‌سازی، نشان و مزایای روزانه می‌گیری.'));
  st.append(tx);c.append(st);
  c.append(el('div','🎁 مزایا','wd66-h'));
  c.append(el('div','✅ نشان 👑 کنار نام • ✅ قاب VIP در پروفایل • ✅ ۱۰ جم هدیه‌ی روزانه از سرور (علاوه بر ۳۰۰ طلای قدیمی) • ✅ بخش آیتم‌های ویژه • ✅ تم نقشه‌ی VIP • ✅ آمار ویژه','wd66-note'));
  ['vip7','vip30'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  c.append(el('div','🔔 خدمات کمکی','wd66-h'));
  ['radar','stats'].forEach(function(id){var it=itemOf(id);if(it)c.append(card(it))});
  if(act){c.append(el('div','💎 ویژه‌ی اعضای VIP','wd66-h'));
    var s=el('div',null,'wd66-sec');
    (CAT66.items||[]).filter(function(x){return x.rar==='legendary'&&!x.hidden}).slice(0,4).forEach(function(x){s.append(card(x))});
    c.append(s)}}
function viewLimited(c){
  c.append(el('div','🔥 آیتم‌های محدود — بعد از پایان، فقط در موزه','wd66-h'));
  var any=false;
  (CAT66.items||[]).filter(function(x){return x.kind==='limited'}).forEach(function(it){
    any=true;c.append(card(it));
    if(it.window&&it.window.to&&!ownOf(it.id)){
      var left=it.window.to-Date.now();
      if(left>0)c.append(el('div','⏳ '+faN(Math.floor(left/864e5))+' روز و '+faN(Math.floor(left%864e5/36e5))+' ساعت مانده','wd66-note'))}
    else if(ownOf(it.id))c.append(el('div','✓ این آیتم برای همیشه در موزه‌ی توست.','wd66-note'))});
  if(!any)c.append(emptyBox('فعلاً آیتم محدودی در فروش نیست — ایونت‌های بعدی را از دست نده.'))}
function viewMuseum(c){
  c.append(el('div','🖼️ موزه‌ی امپراتوری — تاریخچه‌ی آیتم‌های خاص تو','wd66-h'));
  var owned=(CAT66.owned||[]).filter(function(o){return !o.expires_at||Date.parse(o.expires_at)>Date.now()});
  var n=0;
  var limitedOwned=owned.filter(function(o){var it=itemOf(o.item_id);return it&&(it.kind==='limited')});
  if(limitedOwned.length){c.append(el('div','🔥 محدود و فصلی','wd66-h'));
    limitedOwned.forEach(function(o){var it=itemOf(o.item_id);if(!it)return;n++;var r=el('div',null,'wd66-card');
      r.append(el('div',it.icon,'wd66-ico'));
      var tx=el('div',null,'wd66-tx');tx.append(el('b',it.fa));
      tx.append(el('small','به‌دست‌آمده: '+new Date(o.created_at).toLocaleDateString('fa-IR')+' • '+it.d));
      r.append(tx);r.append(rarTag(it.rar));c.append(r)})}
  var rewards=owned.filter(function(o){var it=itemOf(o.item_id);return it&&it.cat==='reward'});
  if(rewards.length){c.append(el('div','🏆 پاداش مجموعه‌ها','wd66-h'));
    rewards.forEach(function(o){var it=itemOf(o.item_id);if(!it)return;n++;var r=el('div',null,'wd66-card');
      r.append(el('div',it.icon,'wd66-ico'));
      var tx=el('div',null,'wd66-tx');tx.append(el('b',it.fa));tx.append(el('small',it.d));
      r.append(tx);r.append(rarTag(it.rar));c.append(r)})}
  var C=COSC();
  if((C.medals||[]).length){c.append(el('div','🏅 مدال‌های المپیک و فصل (سابقه)','wd66-h'));
    (C.medals||[]).forEach(function(m){n++;
      var chip=el('span','🏅 '+(String(m.k||'').indexOf('olympic_')===0?('قهرمان المپیک — '+m.fa):('مدال فصل '+m.fa)),'wd66-rar rar-leg');
      chip.style.cssText='font-size:10.5px;padding:5px 10px;margin:0 4px 6px 0;display:inline-block';
      c.append(chip)})}
  if(!n)c.append(emptyBox('موزه‌ات خالی است — آیتم‌های محدود و پاداش مجموعه‌ها اینجا برای همیشه می‌مانند.'))}

/* ---------- انبار + تاریخچه ---------- */
function invItems(){var out=[];var seen={};
  (CAT66.owned||[]).forEach(function(o){
    if(o.expires_at&&Date.parse(o.expires_at)<=Date.now())return;
    seen[o.item_id]=1;
    var it=itemOf(o.item_id)||{id:o.item_id,fa:o.item_id,icon:'🎁',d:'آیتم سرور',rar:o.rarity||'common',slot:null,kind:'item',price:0,cat:'other'};
    out.push({it:it,at:o.created_at,src:o.source})});
  var C=COSC();
  (C.owned||[]).forEach(function(id){if(seen[id])return;seen[id]=1;
    var it=itemOf(id);if(it)out.push({it:it,at:null,src:'legacy'})});
  (C.emstOwned||[]).forEach(function(b2){var id='emst_'+b2;if(seen[id])return;seen[id]=1;
    var it=itemOf(id);if(it)out.push({it:it,at:null,src:'legacy'})});
  return out}
function invFiltered(){var list=invItems();
  if(INVQ){var q=INVQ.toLowerCase();
    list=list.filter(function(x){return (x.it.fa||'').toLowerCase().indexOf(q)>-1||(x.it.id||'').toLowerCase().indexOf(q)>-1})}
  if(INVF!=='all')list=list.filter(function(x){return x.it.rar===INVF});
  if(INVS==='rar'){var ord={mythic:0,legendary:1,epic:2,rare:3,uncommon:4,common:5};
    list.sort(function(a,b2){return (ord[a.it.rar]||9)-(ord[b2.it.rar]||9)})}
  else list.sort(function(a,b2){return (b2.at||'').localeCompare(a.at||'')});
  return list}
function viewInventory(c){
  var tabs=el('div',null,'wd66-invtools');
  var tb1=el('button','🎒 آیتم‌ها','wd66-ftool'+(!INVHIST?' on':''));
  tb1.setAttribute('data-act','invtab');
  var tb2=el('button','🧾 تاریخچه خرید','wd66-ftool'+(INVHIST?' on':''));
  tb2.setAttribute('data-act','histtab');
  tabs.append(tb1,tb2);c.append(tabs);
  var tools=el('div',null,'wd66-invtools');
  var inp=el('input');inp.type='search';inp.placeholder='🔍 جست‌وجوی آیتم…';inp.value=INVQ;
  inp.setAttribute('data-inv','search');
  var sel=el('select');sel.setAttribute('data-inv','sort');
  [['new','جدیدترین'],['rar','کمیابی']].forEach(function(o){var op=el('option',o[1]);op.value=o[0];if(INVS===o[0])op.selected=true;sel.append(op)});
  tools.append(inp,sel);
  ['all','rare','epic','legendary','mythic'].forEach(function(f){
    var fb=el('button',f==='all'?'همه':RARS[f],'wd66-ftool'+(INVF===f?' on':''));
    fb.setAttribute('data-act','invf');fb.setAttribute('data-f',f);tools.append(fb)});
  c.append(tools);
  var list=invFiltered();
  if(!list.length)c.append(emptyBox(INVQ?'چیزی پیدا نشد.':'انبارت خالی است — از فروشگاه شروع کن!'));
  list.forEach(function(x){c.append(card(x.it))})}
function viewHistory(c){
  var tabs=el('div',null,'wd66-invtools');
  var tb1=el('button','🎒 آیتم‌ها','wd66-ftool');tb1.setAttribute('data-act','invtab');
  var tb2=el('button','🧾 تاریخچه خرید','wd66-ftool on');tb2.setAttribute('data-act','histtab');
  tabs.append(tb1,tb2);c.append(tabs);
  if(!HIST){c.append(loadingBox());
    sb.rpc('shop_history',{p_limit:30}).then(function(r){
      HIST=(r&&r.data&&r.data.rows)||[];var m=H('m-shop');if(m&&m.classList.contains('active')&&VIEW==='inventory'&&INVHIST)render()}).catch(function(){HIST=[]});
    return}
  if(!HIST.length){c.append(emptyBox('هنوز خریدی ثبت نشده است. همه‌ی خریدهای جدید اینجا ثبت می‌شود.'));return}
  HIST.forEach(function(row){var it=itemOf(row.item_id);
    var r=el('div',null,'wd66-hrow');
    r.append(el('div',it?(it.icon):'🧾'));
    var t=el('div',null,'t');t.append(el('b',it?it.fa:row.item_id));
    t.append(el('div',new Date(row.created_at).toLocaleString('fa-IR')+' • '+(row.provider==='mystery'?'قرعه سرور':row.provider==='collection'?'پاداش مجموعه':'فروشگاه'),'d'));
    r.append(t);
    r.append(el('span',row.price>0?('💎 '+gemN(row.price)):'رایگان','p'));
    c.append(r)})}

/* ---------- پیش‌نمایش (بدون ذخیره‌سازی) ---------- */
function previewCleanup(){try{
  var host=map.getContainer();
  host.classList.remove('wd66-pv-azure','wd66-ocean-azure','wd66-ocean-midnight','wd66-ocean-jade');
  applyOwned()}catch(e){}
  if(PV66){try{PV66.remove()}catch(e){}PV66=null}}
function preview(id){previewCleanup();
  var it=itemOf(id);if(!it)return;
  var ov=el('div',null,'wd66-pv');var cd=el('div',null,'card');
  var hd=el('div',null,'hd');hd.append(el('b','👁 پیش‌نمایش — '+it.fa));
  var x=el('button','✕');x.onclick=function(){previewCleanup()};hd.append(x);cd.append(hd);
  var stage=el('div',null,'stage');
  var kind=it.slot||it.kind;
  if(it.id==='col_pack'){stage.append(el('div','🎨 رنگ‌های نمونه روی قلمرو:'));
    var row=el('div');row.style.cssText='display:flex;flex-wrap:wrap;justify-content:center;margin-top:8px';
    (WD27_API.HUES||[0,45,95,172,205,265,320]).forEach(function(h2){
      var s2=el('button','','wd66-sw');s2.style.background='hsl('+h2+',62%,47%)';
      s2.onclick=function(){stage.querySelectorAll('.wd66-sw.on').forEach(function(q){q.classList.remove('on')});s2.classList.add('on');
        demo.style.background='hsl('+h2+',62%,47%)'};
      row.append(s2)});
    stage.append(row);
    var demo=el('div');demo.style.cssText='width:74px;height:48px;margin:10px auto 0;border-radius:10px;border:2px solid #ffd84d;background:hsl(205,62%,47%)';
    stage.append(demo)}
  else if(it.id==='emblem'||it.id.indexOf('emst_')===0){stage.append(el('div','🏳️ نمونه‌ی نمایش کنار نامت:'));
    var chip=el('div',null,'wd66-chipdemo');chip.style.margin='10px auto 0';
    var base=it.id.indexOf('emst_')===0?it.id.slice(5):null;
    if(base&&typeof window.wd50EmTag==='function')chip.innerHTML=window.wd50EmTag('🐉',base)+' <span>امپراتور تو</span>';
    else chip.textContent='🐉 امپراتور تو';
    stage.append(chip)}
  else if(it.slot==='title'){stage.append(el('div','👑 نمونه‌ی لقب کنار نام:'));
    var c2=el('div',null,'wd66-chipdemo');c2.style.margin='10px auto 0';c2.textContent='امپراتور تو «'+(WD27_API.TITLES&&WD27_API.TITLES[0]||'فاتح')+'»';
    stage.append(c2)}
  else if(it.id==='frame'||it.id==='battle_frame'){stage.append(el('div','🖼️ نمونه‌ی قاب دور نام در رتبه‌بندی:'));
    var c3=el('div',null,'wd66-chipdemo'+(it.id==='battle_frame'?' wd66-frame-battle':''));c3.style.margin='10px auto 0';
    if(it.id==='frame')c3.style.cssText+=';box-shadow:0 0 12px 2px rgba(255,216,77,.6)';
    c3.textContent='⭐ نام تو';
    stage.append(c3)}
  else if(it.id.indexOf('map_')===0){stage.append(el('div','🌍 دکمه را بزن — نقشه‌ی واقعی زنده تم می‌گیرد (بعد از بستن، بدون تغییر می‌ماند):'));
    var b2=el('button','▶ نمایش زنده روی نقشه','wd66-buy alt');b2.style.cssText='margin-top:9px;width:100%';
    b2.onclick=function(){try{map.getContainer().classList.add('wd66-'+it.id)}catch(e){}};
    var b3=el('button','↩ بازگردانی','wd66-buy off');b3.style.cssText='margin-top:6px;width:100%';
    b3.onclick=function(){try{WD88ThemeOff()}catch(e){}};
    stage.append(b2,b3)}
  else if(it.id==='empire_highlight'||it.id.indexOf('cap_')===0){stage.append(el('div','🏛️ نمونه‌ی برچسب پایتخت:'));
    var demo2=el('div');demo2.className='own-wrap '+(it.id==='cap_aura_gold'?'wd66-cap-aura-gold':it.id==='cap_aura_ice'?'wd66-cap-aura-ice':it.id==='cap_aura_flame'?'wd66-cap-aura-flame':it.id==='cap_theme_royal'?'wd66-cap-theme wd66-cap-mon wd66-cap-name':it.id==='cap_monument'?'wd66-cap-mon':it.id==='cap_nameplate'?'wd66-cap-name':'wd66-emp-hi');
    demo2.style.cssText='display:inline-block;margin:10px auto 0;padding:4px 9px';
    demo2.textContent='⭐ پایتخت تو';
    stage.append(demo2)}
  else if(it.slot==='fx'||it.id==='fx_storm'||it.id==='fx_comet'){stage.append(el('div','🎆 اجرای واقعی افکت روی مرکز نقشه:'));
    var b4=el('button','▶ اجرای افکت','wd66-buy alt');b4.style.cssText='margin-top:9px;width:100%';
    var fk=it.id==='fx_storm'?'storm':it.id==='fx_comet'?'comet':'gold';
    b4.onclick=function(){try{var ct=map.getCenter();WD27_API.cosFxAt(ct.lat,ct.lng,fk)}catch(e){}};
    stage.append(b4)}
  else if(it.id==='anthem'){stage.append(el('div','🎺 نمونه‌ی ملودی‌ها:'));
    ['hero','calm','sacred'].forEach(function(mm){
      var b5=el('button','▶ '+mm,'wd66-buy off');b5.style.cssText='margin:5px 4px 0';
      b5.onclick=function(){try{if(window.WD43&&WD43._t&&WD43._t.playAnthem)WD43._t.playAnthem(mm,true)}catch(e){}};
      stage.append(b5)})}
  else if(it.id.indexOf('mystery')===0||it.id==='lucky'){stage.append(el('div','🎁 شفافیت کامل — شانس‌ها:'));
    var m=CAT66.mystery&&CAT66.mystery[it.id];
    if(m){var tbl=el('table',null,'wd66-odds');
      m.odds.forEach(function(o){var tr=el('tr');tr.append(el('td',faN(o.pct)+'٪'));
        tr.append(el('td',o.kind==='gems'?('💎 جم'+(o.min?' '+gemN(o.min)+'+'+gemN(o.max):'')):('🎁 آیتم '+o.fa)));
        tbl.append(tr)});
      stage.append(tbl)}}
  else if(it.id==='vip7'||it.id==='vip30'){stage.append(el('div','👑 مزایای VIP:'));
    stage.append(el('div','✅ نشان 👑 • ✅ قاب پروفایل • ✅ ۱۰ جم روزانه از سرور • ✅ ۳۰۰ طلای قدیمی روزانه • ✅ بخش ویژه • بدون هیچ قدرت جنگی','wd66-note'))}
  else stage.append(el('div',it.icon||'🎁'),el('div',esc(it.d||''),'wd66-note'));
  /* V88 — پیش‌نمایش زنده‌ی آیتم‌های جدید */
  if(it.id.indexOf('csk_')===0){stage.append(el('div','🏛️ نمونه‌ی اسکین پایتخت:'));
    var d88=el('div',null,'own-wrap wd88-'+it.id);d88.style.cssText='display:inline-block;margin:10px auto 0;padding:4px 9px';d88.textContent='⭐ پایتخت تو';stage.append(d88)}
  else if(it.id.indexOf('lm_')===0||it.id.indexOf('banner_')===0||it.id.indexOf('vs_')===0||it.id.indexOf('we_')===0||it.id.indexOf('cp_')===0){
    stage.append(el('div','🖼️ نمایش نمونه:'));
    var g88=el('div',null,'wd88-pvglyph wd88-'+it.id);g88.textContent=(it.icon||'✨')+'  '+it.fa;stage.append(g88)}
  else if(it.id.indexOf('wfr_')===0){stage.append(el('div','🛡️ نمونه‌ی قاب روی کارت نبرد:'));
    var f88=el('div',null,'wd88-pvframe wd88-'+it.id);f88.textContent='⚔️ گزارش نبرد — حمله به همسایه';stage.append(f88)}
  cd.append(stage);
  cd.append(el('div','🏅 کمیابی: '+(RARS[it.rar]||it.rar)+(it.price>0?(' • 💎 '+gemN(it.price)+' جم'):''),'wd66-note'));
  if(!ownOf(it.id)&&it.price>0){var bb=el('button','💎 خرید — '+gemN(it.price),'wd66-buy');
    bb.style.cssText='width:100%';bb.setAttribute('data-act','buy');bb.setAttribute('data-id',it.id);cd.append(bb)}
  else if(ownOf(it.id))cd.append(el('div','✓ این آیتم را داری — از انبار فعالش کن.','wd66-note'));
  ov.append(cd);D.body.appendChild(ov);PV66=ov;
  ov.addEventListener('click',function(e2){if(e2.target===ov)previewCleanup()})}

/* ---------- Event Delegation (یک لیسنر برای همه‌ی فروشگاه) ---------- */
var armed=false;
function arm(){
  if(armed)return;var b=H('shop-body');if(!b)return;armed=true;
  b.addEventListener('click',function(ev){
    var t=ev.target.closest?ev.target.closest('[data-act]'):null;if(!t)return;
    var act=t.getAttribute('data-act'),id=t.getAttribute('data-id'),cat=t.getAttribute('data-cat');
    if(act==='cat'){VIEW=cat||'home';render()}
    else if(act==='retry'){CAT66=null;OFF66=false;render()}
    else if(act==='starter'){if(OFF66){showToast('📡 سرور در دسترس نیست — خرید پک بعد از وصل‌شدن سرور فعال می‌شود','lose');return}starterConfirm()}
    else if(act==='buy'){if(OFF66){showToast('📡 سرور در دسترس نیست — خرید بعد از وصل‌شدن سرور فعال می‌شود','lose');return}var it=itemOf(id);if(it)buy(it)}
    else if(act==='preview'){preview(id)}
    else if(act==='openpick'){try{WD27_API.openPick(id==='col_pack'?'col_pack':id==='emblem'?'emblem':id==='title'?'title':'fx')}catch(e){}}
    else if(act==='w43pick'){try{var map43={anthem:'anthem',frame:'frame',entrance:'entrance',announce:'announce'};WD43_API.newPick(map43[id]||id)}catch(e){}}
    else if(act==='setfx'){try{WD27_API.setFx(id==='fx_storm'?'storm':'comet');showToast('🎆 افکت فعال شد','win')}catch(e){}}
    else if(act==='equip'){equipNew(id,true)}
    else if(act==='unequip'){equipNew(id,false)}
    else if(act==='showstats'){try{WD27_API.showStats()}catch(e){}}
    else if(act==='invtab'){INVHIST=false;render()}
    else if(act==='histtab'){INVHIST=true;render()}
    else if(act==='invf'){INVF=t.getAttribute('data-f')||'all';render()}
    else if(act==='claim'){claimCollection(t.getAttribute('data-col'),t)}
    else if(act==='passclaim'){passClaim(Number(t.getAttribute('data-tier'))||0,t)}
  });
  b.addEventListener('input',function(ev){
    var t=ev.target;if(!t||!t.getAttribute)return;
    if(t.getAttribute('data-inv')==='search'){clearTimeout(arm._d);arm._d=setTimeout(function(){INVQ=t.value||'';render()},250)}
  });
  b.addEventListener('change',function(ev){
    var t=ev.target;if(!t||!t.getAttribute)return;
    if(t.getAttribute('data-inv')==='sort'){INVS=t.value||'new';render()}
  })}
function equipNew(id,on){var C=COSC();
  if(id.indexOf('map_')===0){C.mapTheme=on?id:null}
  else if(id.indexOf('cap_aura_')===0){C.capAura=on?id.slice(9):null}
  else if(id==='cap_theme_royal'){C.capTheme=on?'royal':null}
  else if(id.indexOf('csk_')===0){C.capSkin=on?id:null}
  else if(id.indexOf('lm_')===0){C.landmark=on?id:null}
  else if(id.indexOf('banner_')===0){C.banner=on?id:null}
  else if(id.indexOf('wfr_')===0){C.wframe=on?id:null}
  else if(id.indexOf('vs_')===0){C.vfx=on?id:null}
  else if(id.indexOf('we_')===0){C.wemb=on?id:null}
  else if(id.indexOf('cp_')===0){C.cport=on?id:null}
  else if(id==='cap_monument'){C.capMonument=!!on}
  else if(id==='cap_nameplate'){C.capNameplate=!!on}
  else if(id==='empire_highlight'){C.empHi=!!on}
  applyOwned();
  try{if(typeof saveNow==='function')saveNow()}catch(e){}
  showToast(on?'✅ فعال شد':'↩ برداشته شد','win');render()}

function claimCollection(cid,btn){try{
  if(btn){btn.className='wd66-buy busy';btn.textContent='⏳ …'}
  sb.rpc('shop_collection_claim',{p_collection:cid}).then(function(r){
    if(r.error||!r.data||!r.data.ok){
      showToast(!r.data||r.data.error==='incomplete'?'❌ مجموعه هنوز کامل نیست':'❌ دریافت پاداش نشد','lose');
      if(btn){btn.className='wd66-buy alt';btn.textContent='🎁 دریافت پاداش'}return}
    if(r.data.already)showToast('✓ قبلاً گرفته شده','win');
    else{showToast('🏆 پاداش مجموعه: '+(r.data.fa||'ویژه'),'win');markOwned(r.data.reward);
      var C=COSC();if(!C.owned)C.owned=[];if(C.owned.indexOf(r.data.reward)<0)C.owned.push(r.data.reward);
      applyOwned();if(typeof saveNow==='function')saveNow()}
    render()}).catch(function(){showToast('❌ اتصال برقرار نشد','lose');if(btn){btn.className='wd66-buy alt';btn.textContent='🎁 دریافت پاداش'}})}catch(e){}}

/* ---------- V88 — SHOP V3: نماهای بخش‌های جدید (جنگ/بناها/خزانه/پاس/تروفی/زینتی) ---------- */
var WD88={_ws:null,_wsAt:0,_cat:null};
var WD88_CSKS=['imperial','royal','cyber','desert','arctic','industrial','golden','military','olympic','neon','ancient','future'];
function wd88ItemRow(ids,s){var n=0;ids.forEach(function(id){var it=itemOf(id);if(it){s.append(card(it));n++}});return n}
function viewWar(c){
  c.append(el('div','⚔️ جنگ — لژیون، اطلاعات، سفارشات تاکتیکی و پک‌ها','wd66-h'));
  c.append(el('div','🪖 تدارک جنگ + ☢️ زرادخانه تاکتیکی — مصرفیِ سرور-محور','wd66-h'));
  var ars108=el('div',null,'wd108-arshop');c.append(ars108);
  try{if(window.WD88&&window.WD88.arsenal)window.WD88.arsenal(ars108,{mode:'shop'})}catch(e){}
  c.append(el('div','ℹ️ موجودی انبار فقط از سرور خوانده می‌شود؛ خرید فوری ثبت می‌شود. شلیک و اثر واقعی از «برنامه‌ی نبرد» داخل کشو حمله — با کول‌داون، سقف روزانه و مقاومت پلکانی هدف (ضد آزار).','wd66-note'));
  var s1=el('div',null,'wd66-sec');wd88ItemRow(['wfr_iron','wfr_thunder','wfr_redstorm','wfr_phoenix','wfr_night','wfr_steel'],s1);c.append(s1);
  c.append(el('div','✅ قاب لژیون روی گزارش نبرد و کشو حمله‌ی تو دیده می‌شود — صفر قدرت جنگی، تمام هویت.','wd66-note'));
  c.append(el('div','🏴 پرچم‌ها و نشان‌های جنگی (هویت امپراتوری)','wd66-h'));
  var s2=el('div',null,'wd66-sec');wd88ItemRow(['banner_war','banner_victory','banner_defeat','we_iron','we_thunder','wt_legion','wt_shadow'],s2);c.append(s2);
  c.append(el('div','📡 اطلاعات و شناسایی — قبل از حمله بدان','wd66-h'));
  var s3=el('div',null,'wd66-sec');wd88ItemRow(['intel_l1','intel_l2','wo_airrecon','wo_reconsweep'],s3);c.append(s3);
  c.append(el('div','ℹ️ سطح اطلاعات تو در «برنامه‌ی نبرد» خودکار اعمال می‌شود — گزارش مستقیماً از داده‌ی واقعی سرور صادر می‌شود؛ ضداطلاعات مدافع دقت را کم می‌کند.','wd66-note'));
  c.append(el('div','🎛️ سفارشات تاکتیکی — شلیک از «برنامه‌ی نبرد»','wd66-h'));
  var s4=el('div',null,'wd66-sec');wd88ItemRow(['wo_emsupply','wo_reserve','wo_convoy','wo_mobilize','wo_edefense','wo_blockade','wo_ewar'],s4);c.append(s4);
  c.append(el('div','ℹ️ هر سفارش هزینه‌ی منابع (طلا/نفت/غذا) و کول‌داون سمت سرور دارد. هیچ سفارشی برد آنی نمی‌دهد — سقف سخت جمع بونوس‌ها +۲۲٪ است.','wd66-note'));
  c.append(el('div','🚀 پک‌های جنگی — ارزش بیشتر از قیمت','wd66-h'));
  var s5=el('div',null,'wd66-sec');wd88ItemRow(['war_prep_pack','war_starter','war_commander','war_defender','war_imperial'],s5);c.append(s5);
  c.append(el('div','🎖️ پرتره‌ها، اسلات فرماندهی و آموزش','wd66-h'));
  var s6=el('div',null,'wd66-sec');wd88ItemRow(['cp_iron','cp_sky','cp_admiral','cmd_training','tactical_slot','at_slash','df_shield'],s6);c.append(s6);
  c.append(el('div','🎯 عملیات حمله‌ای سروری (بدون کول‌داون و سقف)','wd66-h'));
  c.append(el('div','نفوذ سایبری، راید کماندو، موشک پنچر و ضربه‌ی هسته‌ای — بدون کول‌داون و سقف؛ تنها هزینه جم و پیامد جهانی (تنش/دولت سرکش) است — V159','wd66-note'));
  try{if(window.WD54_SO_CARD&&window.WD54_OPS)Object.keys(WD54_OPS).forEach(function(k){var cd=window.WD54_SO_CARD(k);if(cd)c.append(cd)})}catch(e){}}
function viewLandmarks(c){
  c.append(el('div','🗿 بناهای ماندگار — امضای ابدی کشور تو','wd66-h'));
  var s=el('div',null,'wd66-sec');
  wd88ItemRow(['lm_monument','lm_palace','lm_victory','lm_space','lm_stadium','lm_trade','lm_command','lm_olympic','lm_energy','lm_peace','lm_factory','lm_museum','lm_mythic_monument'],s);
  c.append(s);
  c.append(el('div','✅ بنا کنار پایتختت روی نقشه و در نمای کشور نمایش داده می‌شود، در پروفایل ثبت می‌ماند و در مجموعه‌ی «بناها» شمرده می‌شود.','wd66-note'))}
function viewVault(c){
  c.append(el('div','🎁 خزانه‌ی امپراتوری — قرعه‌ی شفاف سمت سرور','wd66-h'));
  var keys=Object.keys(CAT66.mystery||{});
  keys.forEach(function(id){var it=itemOf(id);if(!it)return;
    c.append(card(it,{owned:false}));
    var m=CAT66.mystery[id];
    if(m){var tbl=el('table',null,'wd66-odds');
      m.odds.forEach(function(o){var tr=el('tr');
        tr.append(el('td',faN(o.pct)+'٪'));
        var td=el('td');
        var txt=o.kind==='gems'?('💎 جم'+(o.min?' '+gemN(o.min)+' تا '+gemN(o.max):'')):('🎁 آیتم '+o.fa);
        td.textContent=txt;tr.append(td);
        var td2=el('td');td2.textContent=(o.items||[]).map(function(x){var it2=itemOf(x);return it2?it2.icon:''}).join('');tr.append(td2);
        tbl.append(tr)});
      var wrap=el('div',null,'wd66-card');wrap.style.cssText='display:block';
      wrap.append(el('b','📊 شانس‌های '+m.fa+' (نمایش شفاف)'));
      wrap.append(tbl);c.append(wrap)}});
  c.append(el('div','🔒 نتیجه‌ی قرعه روی سرور تعیین می‌شود. هیچ آیتم مهمی انحصار صندوق نیست — همه‌ی آیتم‌های خزانه مسیر خرید مستقیم هم دارند. اگر همه‌ی استخر را داشته باشی، جم جایگزین می‌گیری.','wd66-note'))}
var PASSD=null;
function viewPass(c){
  c.append(el('div','🎟️ پاس فصل — XP با بازی واقعی، جایزه در هر پله','wd66-h'));
  if(!PASSD){c.append(loadingBox());
    sb.rpc('pass_state',{}).then(function(r){PASSD=(r.error||!r.data||!r.data.ok)?{err:1}:r.data;var m=H('m-shop');if(m&&m.classList.contains('active')&&VIEW==='pass')render()}).catch(function(){PASSD={err:1}});return}
  if(PASSD.err){c.append(errBox());PASSD=null;return}
  var d=PASSD;
  var st=el('div',null,'wd66-card');st.append(el('div','🎟️','wd66-ico'));
  var tx=el('div',null,'wd66-tx');tx.append(el('b','فصل '+d.season+' — پله‌ی '+faN(d.tier)));
  tx.append(el('small',faN(d.xp)+' XP کل — هر پله '+faN(d.tier_xp)+' XP'));
  st.append(tx);c.append(st);
  var bar=el('div',null,'wd66-bar');var fill=el('i');fill.style.width=Math.min(100,Math.round((d.xp%d.tier_xp)/d.tier_xp*100))+'%';bar.append(fill);c.append(bar);
  c.append(el('div','🏅 پله‌ها — رایگان برای همه (مسیر بدون پرداخت)','wd66-h'));
  (d.tiers||[]).forEach(function(rw,i){
    var got=((d.claimed|0)&(1<<i))?true:false;var unlocked=d.tier>=i;
    var r=el('div',null,'wd66-card');
    r.append(el('div',unlocked?'🏅':'🔒','wd66-ico'));
    var tx2=el('div',null,'wd66-tx');tx2.append(el('b','پله‌ی '+faN(i)));
    var parts=[];if(rw.gem)parts.push('💎 '+faN(rw.gem)+' جم');if(rw.g)parts.push('🪙 '+faN(rw.g)+' طلا');if(rw.f)parts.push('🌾 '+faN(rw.f)+' غذا');if(rw.cos){var ci=itemOf(rw.cos);parts.push((ci?ci.icon+' ':'🎁 ')+(ci?ci.fa:rw.cos))}
    tx2.append(el('small',parts.join(' • ')));
    r.append(tx2);
    var b;
    if(got){b=el('button','✓ گرفته شد','wd66-buy own');b.disabled=true}
    else if(unlocked){b=el('button','🎁 دریافت','wd66-buy alt');b.setAttribute('data-act','passclaim');b.setAttribute('data-tier',String(i))}
    else{b=el('button','🔒 '+faN(i*d.tier_xp)+' XP','wd66-buy off');b.disabled=true}
    r.append(b);c.append(r)});
  c.append(el('div','📡 مأموریت‌های امروز — XP فقط با انجام واقعی','wd66-h'));
  var md=d.mission_defs||{};var mc=d.missions||{};
  Object.keys(md).forEach(function(k){var m3=md[k];
    var r2=el('div',null,'wd66-hrow');r2.append(el('div',m3.ic||'🎯'));
    var t2=el('div',null,'t');t2.append(el('b',m3.fa));t2.append(el('div','+'+faN(m3.xp)+' XP — سقف روزانه: '+faN(m3.cap),'d'));
    r2.append(t2);r2.append(el('span',faN(mc[k]||0)+'/'+faN(m3.cap),'p'));c.append(r2)});
  c.append(el('div','ℹ️ مأموریت فتح و المپیک فقط توسط داور سرور شمرده می‌شود — دستکاری کلاینت اثری ندارد. با پایان فصل، پاس تازه شروع می‌شود.','wd66-note'))}
function passClaim(tier,btn){try{
  if(btn){btn.className='wd66-buy busy';btn.textContent='⏳…'}
  sb.rpc('pass_claim',{p_tier:tier}).then(function(r){
    if(r.error||!r.data||!r.data.ok){showToast('❌ دریافت پله نشد — اول پله را باز کن','lose');if(btn){btn.className='wd66-buy alt';btn.textContent='🎁 دریافت'}}
    else{showToast('🎁 جایزه‌ی پله پرداخت شد','win');PASSD=null}
    render()}).catch(function(){showToast('❌ اتصال برقرار نشد','lose');PASSD=null;render()})}catch(e){}}
var TROPHD=null;
function viewTrophies(c){
  c.append(el('div','🏅 تروفی‌های امپراتوری — فقط از داده‌ی واقعی سرور','wd66-h'));
  if(!TROPHD){c.append(loadingBox());
    sb.rpc('trophy_list',{}).then(function(r){TROPHD=(r.error||!r.data||!r.data.ok)?{err:1}:r.data;var m=H('m-shop');if(m&&m.classList.contains('active')&&VIEW==='trophies')render()}).catch(function(){TROPHD={err:1}});return}
  if(TROPHD.err){c.append(errBox());TROPHD=null;return}
  var earned=0;
  (TROPHD.trophies||[]).forEach(function(t){if(t.earned)earned++;
    var r=el('div',null,'wd66-card'+(t.earned?' wd88-earned':''));
    r.append(el('div',t.ic,'wd66-ico'));
    var tx3=el('div',null,'wd66-tx');tx3.append(el('b',t.fa));
    tx3.append(el('small',t.d+(t.earned&&t.at?(' — '+new Date(t.at).toLocaleDateString('fa-IR')):(' — پیشرفت: '+(t.progress_now!=null?faN(t.progress_now):'—')))));
    r.append(tx3);
    r.append(el('span',t.earned?'✓':'🔒','wd88-tst'));
    c.append(r)});
  c.append(el('div','🏆 '+faN(earned)+' از '+faN((TROPHD.trophies||[]).length)+' تروفی — تروفی‌ها برای همیشه مال توست و در نمای کشور دیده می‌شود. تالار افتخارات سرور در تب «شکوه» امپراتوری است.','wd66-note'))}
function viewCosmetic(c){
  c.append(el('div','🎨 زینتی سینمایی — صحنه‌ی ورود، سرود، قاب و افکت‌ها','wd66-h'));
  var s=el('div',null,'wd66-sec');
  wd88ItemRow(['anthem','frame','entrance','announce','fx_conq','fx_storm','fx_comet','at_slash','df_shield'],s);
  c.append(s);
  c.append(el('div','ℹ️ افکت فتح بعد از هر فتح واقعی، سرود در ورود و افتتاحیه‌ها و قاب در رتبه‌بندی دیده می‌شود.','wd66-note'))}

/* ---------- رندر اصلی ---------- */
var VIEWS={home:viewHome,gems:viewGems,identity:viewIdentity,capital:viewCapital,map:viewMap,war:viewWar,
  landmarks:viewLandmarks,collections:viewCollections,vault:viewVault,vip:viewVip,limited:viewLimited,
  pass:viewPass,trophies:viewTrophies,cosmetic:viewCosmetic,museum:viewMuseum,inventory:renderInv};
function renderInv(c){if(INVHIST)viewHistory(c);else viewInventory(c)}
function render(){var b=H('shop-body');if(!b)return;
  b.textContent='';
  if(typeof sb==='undefined'||!sb||typeof ACC==='undefined'||!ACC.uid||(!WALLET_OK&&!cacheLoad())){
    b.append(el('div','⚠️ فروشگاه فقط با حساب آنلاین فعال می‌شود — اول وارد شو و پایتخت انتخاب کن.','wd66-note'));return}
  if(!CAT66){b.append(head66());b.append(loadingBox());
    fetchCatalog().then(function(){var m=H('m-shop');if(m&&m.classList.contains('active'))render()}).catch(function(){var m=H('m-shop');if(m&&m.classList.contains('active')){b.textContent='';b.append(head66());b.append(errBox())}});
    return}
  b.append(head66());
  if(OFF66)b.append(el('div','🔌 نمایش آفلاین فروشگاه — قیمت‌ها از آخرین بازدید توست؛ خرید و ادعای جوایز بعد از وصل‌شدن سرور فعال می‌شود.','wd66-note'));
  b.append(chipRail());
  var c=el('div');b.append(c);
  try{(VIEWS[VIEW]||viewHome)(c)}catch(e){c.append(errBox(String(e&&e.message||e).slice(0,120)))}
  arm();armTimer()}
function armTimer(){ /* تایمر خودپاک — فقط وقتی مودال فروشگاه باز است */
  if(TIMER66)return;
  TIMER66=setInterval(function(){
    var m=H('m-shop');
    if(!m||!m.classList.contains('active')){clearInterval(TIMER66);TIMER66=null;return}
    if(D.hidden)return;
    if(VIEW==='limited'||VIEW==='home')render();
  },30000)}

/* ---------- boot: بازگردانی مالکیت + آرام‌سازی ---------- */
function boot66(){try{
  setTimeout(applyOwned,4000);
  setTimeout(applyOwned,9000);
  setTimeout(wdRestoreBoot,6000); /* V146: بازیابی خریدهای ناقص در استارت — مستقل از بازکردن فروشگاه */
  try{if(typeof WD_COLOR_HOOKS!=='undefined')WD_COLOR_HOOKS.after.push(function(n){try{var C=COSC();
    if((C.owned||[]).indexOf(n)>=0||myCountryName===n)applyCapital()}catch(e){}})}catch(e){}
}catch(e){}}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot66);else boot66();

/* ---------- اتصال به renderShop (تک‌مسیر نهایی — آخرین تعریف در سند) ---------- */
window.WD66_SHOP={render:render,onPurchase:onPurchase,syncGrant:syncGrant,applyOwned:applyOwned,
  open:function(){try{render()}catch(e){}openModal('m-shop')},fetchCatalog:fetchCatalog,preview:preview};
try{renderShop=function(){try{render()}catch(e){}}}catch(e){}
})();
