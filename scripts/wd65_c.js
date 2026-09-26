
/* ---------- 7) شبیه‌سازی زندگی کشور (Tick-based، هر ۲۰ ثانیه) ---------- */
const TIV={t:0};
function civTick(){
  tickQueue();
  const own=owned(),tc=own.length+(myName()?1:0);
  if(!tc){TIV.t++;return}
  /* جمعیت واقعی از popM تک‌منبع + ضریب توسعه/مهاجرت */
  let popBase=0;own.forEach(n=>{popBase+=safe(()=>popM(n),10)});if(myName())popBase+=safe(()=>popM(myName()),10);
  const devAvg=own.length?own.reduce((s,c)=>s+(st.prov[c]?st.prov[c].dev:0),0)/own.length:0;
  const popM65=popBase*(0.92+0.015*devAvg)*(st.civ.mig||1);
  /* اشتغال: شغل‌ها از کارخانه/اقتصادی/قلمرو */
  const jobs=own.reduce((s,c)=>s+lvOf(c,'factory')*2+lvOf(c,'eco')*1.5,0)*400+tc*800;
  const emp=Math.max(0,Math.min(1,jobs/Math.max(1,popM65*900)));
  /* امنیت غذایی */
  const foodSec=Math.max(0,Math.min(140,safe(()=>playerRes.food,0)/Math.max(1,popM65*1.1)));
  /* رضایت: مالیات واقعی st28 + رفاه + درمان + غذا + خستگی جنگ + سیاست */
  const taxR=safe(()=>Number(st28.taxRate)||12,12);
  let hT=62-taxR*0.35+(polFx('social').happy||0)+(polFx('diplomatic').happy||0)+own.reduce((s,c)=>s+lvOf(c,'medic'),0)*3;
  hT+=foodSec>=100?4:foodSec<45?-12:foodSec<70?-5:0;
  hT-=Math.min(12,st.flags.warFat);
  hT=Math.max(0,Math.min(100,hT));
  st.civ.happy=Math.round(st.civ.happy+(hT-st.civ.happy)*0.18);
  /* مهاجرت */
  if(st.civ.happy<40)st.civ.mig=Math.max(0.85,st.civ.mig-0.002);
  else if(st.civ.happy>75)st.civ.mig=Math.min(1.15,st.civ.mig+0.001);
  /* ثبات = رضایت + آرامش داخلی (unrest واقعی V28) */
  let unrestAvg=0;own.forEach(n=>{unrestAvg+=safe(()=>unrest[n]||0,0)});unrestAvg=unrestAvg/Math.max(1,own.length);
  st.civ.stab=Math.round(Math.max(0,Math.min(100,0.55*st.civ.happy+0.45*(100-Math.min(100,unrestAvg))+(polFx('diplomatic').stab||0))));
  st.civ.popM=Math.round(popM65*st.civ.mig);
  st.civ.emp=Math.round(emp*100);st.civ.foodSec=Math.round(foodSec);
  st.civ.mig=st.civ.mig;
  /* تولید ساختمان‌ها (افزوده بر اقتصاد موجود — جایگزین چیزی نمی‌شود) */
  const r=safe(()=>playerRes,null);
  if(r){
    const fac=own.reduce((s,c)=>s+lvOf(c,'factory'),0),eco=own.reduce((s,c)=>s+lvOf(c,'eco'),0);
    const far=own.reduce((s,c)=>s+lvOf(c,'farm'),0),ref=own.reduce((s,c)=>s+lvOf(c,'refinery'),0);
    const lab=own.reduce((s,c)=>s+lvOf(c,'lab'),0);
    let gold=fac*250*(polFx('economy').fac||1)+eco*180+lab*50;
    gold*=polFx('economy').gold||1;gold*=polFx('social').gold||1;gold*=polFx('diplomatic').gold||1;
    gold*=(0.6+st.civ.stab/250); /* ثبات واقعی = بهره‌وری مالیات */
    const g0=activeGen();if(g0&&g0.trait==='log')gold*=1+0.05*g0.level;
    const keep=own.reduce((s,c)=>s+keepOf(c),0);
    r.gold=Math.max(0,r.gold+Math.round(gold-keep));
    r.food=Math.max(0,r.food+far*200);
    r.oil=Math.max(0,r.oil+ref*150);
    if(lab)genXp(lab*2);
    safe(()=>W.updateUI&&W.updateUI());
  }
  /* خستگی جنگ کاهش تدریجی */
  if(st.flags.warFat>0){st.flags.warFat=Math.max(0,st.flags.warFat-1)}
  /* گستره‌ی بیشینه + رخداد فتح/ازدست‌دادن برای chronicle */
  if(tc>st.flags.maxTerr){if(st.flags.maxTerr&&tc>st.flags.maxTerr+1)chron('terr','گستره‌ی تازه: '+faN(tc)+' قلمرو — رکورد تاریخی جدید');st.flags.maxTerr=tc}
  chipSync();
  TIV.t++;
}

/* ---------- 8) چیپ وضعیت کشور (tap → تب امپراتوری) ---------- */
let chipEl=null,chipPrev='';
function chipSync(){
  if(!myName()){if(chipEl)chipEl.style.display='none';return}
  if(!chipEl){chipEl=D.createElement('div');chipEl.id='wd65-chip';chipEl.onclick=openEmpireTab;D.body.appendChild(chipEl)}
  const c=st.civ;
  const txt='👥 <b>'+faN(c.popM)+'M</b><span class="wd65-sep">|</span>😊 <b>'+faN(c.happy)+'٪</b><span class="wd65-sep">|</span>🛡️ <b>'+faN(c.stab)+'٪</b>'+(st.queue?'<span class="wd65-sep">|</span>🏗️':'');
  if(txt!==chipPrev){chipPrev=txt;chipEl.innerHTML=txt;chipEl.style.display='flex'}
}
function openEmpireTab(v){open65(v||'empire')}
let VIEW='empire';
function open65(v){VIEW=v||VIEW;const sh=$('wd65-sheet');if(!sh)return;sh.classList.add('open');render65();if(VIEW==='glory')loadGlory(false).then(()=>{if(VIEW==='glory')render65()}).catch(()=>{})}
function close65(){const sh=$('wd65-sheet');if(sh)sh.classList.remove('open');W.__WD65_t=null}
function render65(){
  const card=$('wd65-card');if(!card)return;
  const head='<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">'+
   '<button class="wd65-btn '+(VIEW==='empire'?'gr':'')+'" data-v65="empire">🏛️ امپراتوری</button>'+
   '<button class="wd65-btn '+(VIEW==='glory'?'gr':'')+'" data-v65="glory">🏆 شکوه</button>'+
   '<span style="flex:1"></span><button class="wd65-btn" data-v65="close">✕</button></div>';
  card.innerHTML=head+'<div id="wd65-view"></div>';
  const v=$('wd65-view');
  if(VIEW==='empire')renderEmpire(v);else renderGlory(v);
  card.querySelectorAll('[data-v65]').forEach(x=>x.onclick=()=>{const k=x.dataset.v65;
    if(k==='close')close65();
    else{VIEW=k;render65();if(k==='glory')loadGlory(false).then(()=>{if(VIEW==='glory')render65()}).catch(()=>{})}});
}

/* ---------- 9) رندر تب امپراتوری (در wd5-panel موجود) ---------- */
function renderIfOpen(){const sh=$('wd65-sheet');if(sh&&sh.classList.contains('open')&&VIEW!=='plan')render65()}
function renderEmpire(b){
  const own=owned(),c=st.civ;
  const sec=[];
  sec.push('<div class="wd5-section">🏛️ زندگی کشور</div><div class="wd5-grid">');
  sec.push('<div class="wd5-card"><div class="wd5-k">👥 جمعیت</div><div class="wd5-v">'+faN(c.popM)+'M</div><div class="wd5-small">اشتغال '+faN(c.emp)+'٪ • مهاجرت '+(c.mig>=1.01?'ورودی ↗':c.mig<=0.99?'خروجی ↘':'متعادل')+'</div></div>');
  sec.push('<div class="wd5-card"><div class="wd5-k">😊 رضایت ملی</div><div class="wd5-v">'+faN(c.happy)+'٪</div><div class="wd5-meter"><i style="width:'+faN(c.happy)+'%"></i></div><div class="wd5-small">مالیات '+faN(safe(()=>st28.taxRate,12))+'٪ • امنیت غذایی '+faN(c.foodSec)+'٪'+(st.flags.warFat>4?' • خستگی جنگ':'')+'</div></div>');
  sec.push('<div class="wd5-card"><div class="wd5-k">🛡️ ثبات داخلی</div><div class="wd5-v">'+faN(c.stab)+'٪</div><div class="wd5-meter"><i style="width:'+faN(c.stab)+'%"></i></div><div class="wd5-small">بهره‌وری مالیات ×'+(0.6+c.stab/250).toFixed(2)+'</div></div>');
  sec.push('<div class="wd5-card"><div class="wd5-k">🎖️ فرمانده فعال</div><div class="wd5-v">'+esc(activeGen()?activeGen().name:'—')+'</div><div class="wd5-small">'+(activeGen()?(TRAITS[activeGen().trait].ic+' '+TRAITS[activeGen().trait].n+' • Lv.'+faN(activeGen().level)+' • وفاداری '+faN(activeGen().loyalty)+'٪'):'از کارت فرماندهان یک فرمانده فعال کن')+'</div></div>');
  sec.push('</div>');
  /* سیاست‌ها */
  sec.push('<div class="wd5-section" style="margin-top:10px">📜 سیاست‌های حکومت (هر دسته یک انتخاب — مزیت و عیب همزمان)</div>');
  Object.keys(POL65).forEach(cat=>{
    const cn={economy:'💰 اقتصادی',military:'⚔️ نظامی',social:'👥 اجتماعی',diplomatic:'🤝 دیپلماتیک'}[cat];
    sec.push('<div class="wd5-card" style="margin-top:6px"><b style="font-size:12px">'+cn+'</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">');
    POL65[cat].forEach(o=>{
      sec.push('<button class="wd65-btn '+(st.pol[cat]===o.k?'gr':'')+'" data-pol="'+cat+':'+o.k+'" style="font-weight:400">'+o.n+'</button>');
    });
    sec.push('</div><div class="wd5-small">'+esc((POL65[cat].find(o=>o.k===st.pol[cat])||POL65[cat][0]).d)+'</div></div>');
  });
  /* استان‌ها */
  sec.push('<div class="wd5-section" style="margin-top:10px">🏙️ استان‌های امپراتوری ('+faN(own.length)+')</div>');
  if(st.queue)sec.push('<div class="wd5-card">🏗️ در حال ساخت: <b>'+B65[st.queue.b].ic+' '+B65[st.queue.b].n+' سطح '+faN(st.queue.lvl)+'</b> در <b>'+esc(st.queue.c)+'</b> — '+faN(Math.max(0,Math.ceil((st.queue.until-now())/1000)))+' ثانیه مانده</div>');
  if(!own.length)sec.push('<div class="wd5-card"><div class="wd5-small">هنوز قلمروی نداری — با اولین فتح، استان‌ها باز می‌شوند.</div></div>');
  own.slice(0,12).forEach(cn=>{
    const p=prov(cn),fds=BKEYS.map(k=>{
      const l=p.b[k];
      return '<div class="wd65-row"><span>'+B65[k].ic+' '+B65[k].n+' <span class="wd65-pips">'+Array.from({length:BMAX},(_,i)=>'<i class="'+(i<l?'on':'')+'"></i>').join('')+'</span></span>'+
        (l>=BMAX?'<span class="wd65-pill on">بیشینه</span>':'<button class="wd65-btn" data-up="'+cn+':'+k+'">ارتقا '+faN(bCost(k,l))+'💰 • '+faN(bTime(k,l))+'ث</button>')+'</div>';
    }).join('');
    sec.push('<div class="wd5-card" style="margin-top:6px"><b style="font-size:12.5px">🗺️ '+esc(cn)+'</b><div class="wd65-small">نگهداری کل: '+faN(keepOf(cn))+' طلا/تیک • توسعه: '+faN(p.dev)+'</div>'+fds+'</div>');
  });
  /* برنامه نبرد */
  sec.push('<div class="wd5-section" style="margin-top:10px">⚔️ برنامه‌ی نبرد</div><div class="wd5-card">'+
    '<div class="wd5-small">تاکتیک کنونی: <b>'+tacticName()+'</b> • ضریب قدرت ×'+atkMult().toFixed(2)+' • ضریب تلفات ×'+lossMult().toFixed(2)+' (نتیجه‌ی نهایی با سرور)</div>'+
    '<button class="wd65-btn cy" data-wplan="1" style="width:100%;margin-top:8px">🗺️ باز کردن برنامه‌ی نبرد</button></div>');
  b.innerHTML=sec.join('');
  b.querySelectorAll('[data-pol]').forEach(x=>x.onclick=()=>{const[cat,k]=x.dataset.pol.split(':');setPol(cat,k)});
  b.querySelectorAll('[data-up]').forEach(x=>x.onclick=()=>{const[c,k]=x.dataset.up.split(':');upgrade(c,k)});
  const wp=b.querySelector('[data-wplan]');if(wp)wp.onclick=()=>openPlan();
}
/* ---------- 10) برنامه‌ی نبرد (sheet) — تاکتیک/جبهه/محاصره/شناسایی/عقب‌نشینی ---------- */
const PLAN={t:null};
function openPlan(){
  const sh=$('wd65-sheet');const card=$('wd65-card');if(!sh||!card)return;
  const own=owned();
  const targets=safe(()=>{const arr=[];try{Object.keys(OTH).forEach(n=>arr.push({n,pvp:1}))}catch(e){}
    try{Object.keys(layersByName).forEach(n=>{if(n!==myName()&&!conqueredCountries.has(n)&&!OTH[n]&&!arr.some(a=>a.n===n))arr.push({n,pvp:0})})}catch(e){}
    return arr},[]);
  const sel=PLAN.t&&targets.some(t=>t.n===PLAN.t)?PLAN.t:(targets[0]&&targets[0].n)||'';
  const tac=W.WD65TACTIC||'balanced';
  const myP=Math.round(safe(()=>calculateTotalAttack(),0)*atkMult());
  let defEst=0,pvpFlag=0;
  if(sel){const cd=safe(()=>getCountryData(sel),null);defEst=cd?cd.def:0;pvpFlag=(targets.find(t=>t.n===sel)||{}).pvp||0}
  const ratioTxt=defEst?('نسبت قدرت ≈ '+(myP/Math.max(1,defEst)).toFixed(2)):'هدف را انتخاب کن';
  const siegeOn=siegeP(sel);
  const frontOpts=own.map(c=>'<option '+(PLAN.f===c?'selected':'')+' value="'+esc(c)+'">'+esc(c)+(lvOf(c,'barracks')?' 🪖+۳٪':'')+'</option>').join('');
  card.innerHTML=
   '<h3>⚔️ برنامه‌ی نبرد</h3>'+
   '<div class="wd65-row"><span>🎯 هدف</span><select id="w65-tg" style="max-width:55%;background:#0a2540;color:#fff;border:1px solid #23587c;border-radius:8px;padding:6px">'+targets.map(t=>'<option value="'+esc(t.n)+'" '+(t.n===sel?'selected':'')+'>'+esc(t.n)+(t.pvp?' 👤':' 🤖')+'</option>').join('')+'</select></div>'+
   '<div class="wd65-row"><span>👤 مالک</span><span>'+(pvpFlag?'بازیکن واقعی (نتیجه با سرور)':'دولت محلی (محاسبه‌ی محلی)')+'</span></div>'+
   '<div class="wd65-row"><span>🛡️ دفاع پایه</span><b>'+faN(defEst)+'</b></div>'+
   '<div class="wd65-row"><span>💪 قدرت مؤثر تو</span><b style="color:#7dffcf">'+faN(myP)+'</b></div>'+
   '<div class="wd65-row"><span>📊 '+ratioTxt+'</span><span class="wd65-pill '+(myP>=defEst?'on':'warn')+'">'+(myP>=defEst?'برتری':'خطرناک')+'</span></div>'+
   '<h4>تاکتیک (ریسک/هزینه/نتیجه متفاوت — اعمال سرور در PvP)</h4><div class="wd65-tactic">'+
   [['balanced','⚖️ متعادل','—'],['blitz','⚡ حمله سریع','+۱۰٪ قدرت • +۶٪ تلفات'],['heavy','🔥 حمله سنگین','+۱۵٪ قدرت • +۲۲٪ تلفات'],['precision','🎯 حمله دقیق','+۵٪ قدرت • −۲۰٪ تلفات']].map(t=>
     '<button class="wd65-btn '+(tac===t[0]?'gr':'')+'" data-tac="'+t[0]+'">'+t[1]+'<br><span style="font-weight:400;font-size:10px">'+t[2]+'</span></button>').join('')+'</div>'+
   '<h4>🕵️ شناسایی</h4><button class="wd65-btn" id="w65-rec" style="width:100%">📡 دریافت گزارش اطلاعاتی (فناوری intel → دقت بالاتر)</button><div id="w65-intel" class="wd65-mut"></div>'+
   (own.length?'<h4>🗺️ جبهه (استان لجستیک)</h4><select id="w65-fr" style="width:100%;background:#0a2540;color:#fff;border:1px solid #23587c;border-radius:8px;padding:6px"><option value="">— بدون جبهه‌ی پیش‌رو —</option>'+frontOpts+'</select>':'')+
   (!pvpFlag&&sel?'<h4>🔥 محاصره (فقط اهداف محلی — هر مرحله +۴٪ قدرت، حداکثر ۳)</h4><div class="wd65-row"><span>فشار فعلی</span><span class="wd65-pill '+(siegeOn?'on':'')+'">'+faN(siegeOn)+'/۳</span></div><button class="wd65-btn" id="w65-siege" style="width:100%">🔥 توپخانه بزن (۸۰۰ نفت + ۲٬۵۰۰ طلا)</button>':'')+
   '<div style="display:flex;gap:8px;margin-top:12px"><button class="wd65-btn" data-v65="back" style="flex:1">→ بازگشت</button><button class="wd65-btn rd" id="w65-no" style="flex:1">↩️ عقب‌نشینی</button><button class="wd65-btn gr" id="w65-go" style="flex:2">⚔️ شروع عملیات</button></div>'+
   '<div class="wd65-mut">عقب‌نشینی هیچ هزینه‌ای ندارد؛ عملیات فقط با تأیید تو شروع می‌شود.</div>';
  sh.classList.add('open');VIEW='plan';
  card.querySelectorAll('[data-tac]').forEach(x=>x.onclick=()=>{W.WD65TACTIC=x.dataset.tac;st.flags.tactic=x.dataset.tac;save65();openPlan()});
  const bk=card.querySelector('[data-v65="back"]');if(bk)bk.onclick=()=>{VIEW='empire';render65()};
  const tg=card.querySelector('#w65-tg');if(tg)tg.onchange=()=>{PLAN.t=tg.value;openPlan()};
  const fr=card.querySelector('#w65-fr');if(fr)fr.onchange=()=>{PLAN.f=fr.value};
  const rc=card.querySelector('#w65-rec');if(rc)rc.onclick=()=>{
    const g=activeGen(),acc=g&&g.trait==='intel'?0.10*g.level:0;
    const fuzz=0.35-acc;
    const lo=Math.round(defEst*(1-fuzz)),hi=Math.round(defEst*(1+fuzz));
    $('w65-intel').innerHTML='🛰️ برآورد دفاع: <b>'+faN(lo)+' تا '+faN(hi)+'</b> • دفاع مؤثر با محاصره: <b>'+faN(Math.round(defEst*(1-0.04*siegeOn)))+'</b>'+(acc?' • دقت ژنرال اطلاعاتی اعمال شد':'')+'<br>پیشنهاد: '+(myP>=hi?'حمله مطمئن است':myP>=lo?'در مرز خطر — محاصره یا تاکتیک دقیق':'نیرو بیشتر، عملیات ویژه یا محاصره');
  };
  const sg=card.querySelector('#w65-siege');if(sg)sg.onclick=()=>bombard(sel);
  card.querySelector('#w65-no').onclick=()=>{sh.classList.remove('open');W.__WD65_t=null;PLAN.armed=false};
  card.querySelector('#w65-go').onclick=()=>{
    if(!sel){toast65('❌ هدفی انتخاب نشده','lose');return}
    W.__WD65_t=sel;PLAN.armed=true;PLAN.t=sel;sh.classList.remove('open');
    chron('war','برنامه‌ی نبرد علیه '+sel+' تصویب شد — '+tacticName()+(PLAN.f?' از جبهه‌ی '+PLAN.f:''));
    save65();toast65('⚔️ عملیات آغاز می‌شود...');
    setTimeout(()=>{try{if(typeof attackTarget==='function')attackTarget(sel)}catch(e){}},250);
  };
}

/* ---------- 11) شکوه: رقیب + اهداف + تالار افتخارات + chronicle (سرور-مأخذ) ---------- */
const R65={goals:null,goalsAt:0,rival:null,rivalAt:0,hof:null,hofAt:0};
function rpc65(fn,p){return safe(()=>sb.rpc(fn,p),null)}
async function loadGlory(force){
  if(!online())return;
  const N=now();
  if(force||N-R65.goalsAt>60000){const r=await rpc65('goals_get',{p_server:SRVn()});if(r&&!r.error){R65.goals=r.data;R65.goalsAt=N}}
  if(force||N-R65.rivalAt>60000){const r=await rpc65('rival_get',{p_server:SRVn()});if(r&&!r.error){R65.rival=r.data;R65.rivalAt=N}}
  if(force||N-R65.hofAt>120000){const r=await rpc65('hof_list',{p_server:SRVn()});if(r&&!r.error){R65.hof=r.data;R65.hofAt=N}}
}
const GOAL_FA={empire:'👑 ساخت امپراتوری (کشورهای فتح‌شده)',military:'⚔️ بزرگ‌ترین قدرت نظامی (کشتار)',economy:'💰 ثروتمندترین اقتصاد',power:'🌍 بالاترین امتیاز قدرت',territory:'🗺️ بیشترین قلمرو فعال',olympic:'🏆 قهرمان المپیک (طلاها)',tech:'🧠 پیشرفته‌ترین فناوری (رکوردها/PR)',alliance:'🤝 قدرتمندترین اتحاد'};
function renderGlory(b){
  delete b.dataset.wd65;
  const sec=[];
  const rv=R65.rival;
  sec.push('<div class="wd5-section">⚔️ رقیب شخصی</div>');
  if(!online())sec.push('<div class="wd5-card"><div class="wd5-small">برای رقیب/اهداف/شکوه باید آنلاین باشی.</div></div>');
  else if(!rv||!rv.rival)sec.push('<div class="wd5-card"><div class="wd5-small">'+(rv&&rv.msg==='top'?'👑 تو رتبه‌ی یک هستی — رقیبت کسی نیست جز تاریخ خودت!':'هنوز داده‌ی رتبه‌ای کامل نیست.')+'</div></div>');
  else{
    const r=rv.rival;
    sec.push('<div class="wd5-card"><b>'+esc(r.nick)+'</b> <span class="wd65-pill '+(rv.ahead?'warn':'on')+'">رتبه‌ی '+faN(rv.rival_rank)+' در برابر رتبه‌ی '+faN(rv.me_rank)+' تو</span>');
    [['score','امتیاز'],['conquered','فتح‌ها'],['kills','نبردها'],['economy','اقتصاد'],['recruits','سربازگیری']].forEach(row=>{
      const c=r[row[0]];if(!c)return;const diff=c.rival-c.me;
      sec.push('<div class="wd65-bar"><span style="width:64px">'+row[1]+'</span><div class="tr"><i style="width:'+Math.min(100,Math.round(c.me/Math.max(1,c.rival)*100))+'%;background:#3ee8a5"></i><i style="width:'+Math.min(100-Math.min(100,Math.round(c.me/Math.max(1,c.rival)*100)),Math.round((c.rival-c.me)/Math.max(1,c.rival)*100))+'%;background:rgba(255,120,90,.75)"></i></div><span>'+(diff>=0?'+'+faN(diff):faN(diff))+'</span></div>');
    });
    sec.push('<div class="wd65-small">همیشه یک نفر برای رقابت — او را پشت بگذار.</div></div>');
  }
  const gl=R65.goals;
  sec.push('<div class="wd5-section" style="margin-top:10px">🎯 اهداف بلندمدت</div>');
  if(gl&&gl.goals){
    sec.push('<div class="wd5-card">'+gl.goals.map(g=>{
      const pct=g.top>0?Math.round((g.my||0)/g.top*100):0;
      return '<div class="wd65-row"><span>'+GOAL_FA[g.key]+'</span><span><b>'+faN(g.my||0)+'</b> / '+faN(g.top||0)+' <span class="wd65-pill">'+(g.top_nick?'👑 '+esc(g.top_nick):'—')+'</span></span></div>';
    }).join('')+'</div>');
  }else if(online())sec.push('<div class="wd5-card"><div class="wd5-small">در حال بارگذاری اهداف...</div></div>');
  const hf=R65.hof;
  sec.push('<div class="wd5-section" style="margin-top:10px">🏛️ تالار افتخارات (دائمی — بخشی از هویت)</div>');
  if(hf&&hf.titles){
    sec.push('<div class="wd5-card">'+hf.titles.map(t=>
      '<div class="wd65-row"><span>'+t.fa+'</span><span>'+(t.nick?'<b '+(!t.mine?'':'style="color:#7dffcf"')+'>'+esc(t.nick)+'</b> <span class="wd65-pill '+(t.mine?'on':'')+'">'+faN(t.value||0)+'</span>':'<span class="wd65-pill">آزاد</span>')+'</span></div>').join('')+'</div>');
  }else if(online())sec.push('<div class="wd5-card"><div class="wd5-small">در حال بارگذاری تالار...</div></div>');
  sec.push('<div class="wd5-section" style="margin-top:10px">📜 تاریخچه‌ی امپراتوری (Chronicle)</div><div class="wd5-card"><div class="wd65-chron">'+
    (st.chron.length?st.chron.map(x=>'<div><b>'+new Date(x.t).toLocaleDateString('fa-IR')+' '+new Date(x.t).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})+'</b> — '+esc(x.m)+'</div>').join(''):'<span class="wd65-mut">هنوز رویداد مهمی ثبت نشده — اولین قدم‌های امپراتوری از همین‌جا نوشته می‌شود.</span>')+'</div></div>');
  b.innerHTML=sec.join('');
}
