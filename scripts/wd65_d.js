
/* ---------- 12) هوک‌ها: بدون جایگزینی منطق نبرد — فقط رجیستری‌های موجود ---------- */
function wireHooks(){
  /* ضریب قدرت در calculateTotalAttack (AI) — سرور PvP خودش p_tactic را اعتبارسنجی می‌کند */
  try{
    WD_ATTACK_HOOKS.atkMult=WD_ATTACK_HOOKS.atkMult||[];
    WD_ATTACK_HOOKS.atkMult.push(()=>atkMult());
  }catch(e){}
  /* تلفات نبرد: همان الگوی زنجیره‌ی موجود (defBonus) — تک‌لایه‌ی جدید روی زنجیره */
  try{
    const _ab=applyBattleLosses;
    applyBattleLosses=function(f){return _ab(Math.min(0.6,Math.max(0.1,f*lossMult())))};
  }catch(e){}
  /* XP/رکورد واقعی نبرد → فرمانده فعال + خستگی جنگ + پاکسازی هدف مسلح‌شده */
  try{
    WD_ATTACK_HOOKS.xpPost=WD_ATTACK_HOOKS.xpPost||[];
    WD_ATTACK_HOOKS.xpPost.push(function(n){
      try{
        const win=safe(()=>conqueredCountries.has(n),false);
        genBattle(win);st.flags.warFat=Math.min(14,st.flags.warFat+3);
        if(win&&!st.flags.firstConq){st.flags.firstConq=now();chron('war','🏴 نخستین فتح تاریخ امپراتوری: '+n)}
        chron('war',(win?'✔ پیروزی در ':'✖ شکست در ')+n+' — '+tacticName());
        save65();chipSync();
      }catch(e){}
      try{W.__WD65_t=null;PLAN.armed=false}catch(e){}
    });
  }catch(e){}
}

/* ---------- 13) خبرهای تازه‌ی جهان (mapping های موجود — فقط ۲ شاخه‌ی افزوده) ---------- */
function extendNews(){
  try{
    const f=window.wdNewsFa;
    if(typeof f==='function'&&!f.__wd65){
      const nf=function(x){
        const a=x&&x.action;
        if(a==='empire_fall')return '📰 BREAKING — امپراتوری '+esc(x.actor_nick||'نامشخص')+' با از دست دادن آخرین خاکش ('+esc(x.country||'—')+') سقوط کرد؛ فاتح: '+esc(x.target_nick||'—');
        if(a==='hof_new')return '🏛️ تالار افتخارات: عنوان «'+hofFa(x.country)+'» به '+esc(x.actor_nick||'—')+' رسید'+(x.target_nick?(' (جایگزین '+esc(x.target_nick)+')'):'');
        return f(x);
      };
      nf.__wd65=1;window.wdNewsFa=nf;
    }
  }catch(e){}
}
function hofFa(cat){return({conqueror:'فتح‌گر افسانه‌ای',commander:'بزرگ‌ترین فرمانده',war_master:'استاد جنگ',titan:'غول اقتصادی',champion:'قهرمان المپیک',diplomat:'رهبر دیپلمات'})[cat]||cat||''}

/* ---------- 14) هویت: نشان‌های تالار افتخارات من (بدون هیچ افکت سنگین) ---------- */
async function myTitles(){
  if(!online())return[];
  const r=await rpc65('hof_list',{p_server:SRVn()});
  if(!r||r.error||!r.data||!r.data.titles)return[];
  return r.data.titles.filter(t=>t.mine).map(t=>t.fa);
}

/* ---------- 15) boot — یک تیک‌مرکز ۲۰ ثانیه‌ای + اتصال wd5 ---------- */
function boot65(){
  wireHooks();extendNews();
  W.WD65TACTIC=st.flags.tactic||'balanced';
  /* برنامه‌ی نبرد: عناصر sheet یک‌بار ساخته می‌شوند (root-cause: قبلاً هرگز ساخته نمی‌شدند) */
  if(!$('wd65-sheet')){
    const sh=D.createElement('div');sh.id='wd65-sheet';
    const card=D.createElement('div');card.id='wd65-card';
    sh.appendChild(card);D.body.appendChild(sh);
    sh.addEventListener('click',function(e){if(e.target===sh){sh.classList.remove('open');W.__WD65_t=null}});
  }
  /* تیک مرکزی — تنها interval جدید ماژول */
  setInterval(function(){
    try{if(D.hidden)return;civTick()}catch(e){}
  },20000);
  setTimeout(function(){try{civTick()}catch(e){}},4000);
  /* رفرش شکوه وقتی sheet باز است (هر ۹۰ث — نه هر تیک) */
  setInterval(function(){try{
    if(D.hidden)return;const sh=$('wd65-sheet');
    if(sh&&sh.classList.contains('open')&&VIEW==='glory')loadGlory(false).then(()=>{if(VIEW==='glory')render65()}).catch(()=>{})
  }catch(e){}},90000);
  /* ثبت «کشور اول» در chronicle (یک‌بار) */
  const iv2=setInterval(function(){
    const n=myName();if(!n)return;clearInterval(iv2);
    if(!st.flags.home){st.flags.home=n;chron('home','👑 این سند تاریخ است: '+n+' زادگاه امپراتوری شد');save65()}
  },3000);
  setTimeout(()=>clearInterval(iv2),120000);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot65);else boot65();
/* API عمومی مینیمال (st/tick فقط برای تست و عیب‌یابی) */
window.WD65={open:openEmpireTab,open65,close65,plan:openPlan,civ:st.civ,st,tick:civTick,titles:myTitles,chronicle:st.chron,atkMult,lossMult,renderEmpire,renderGlory,loadGlory};
})();
