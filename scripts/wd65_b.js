/* ============ V65 — جهان زنده (Living World) — تک‌ماژول، EXTEND نه بازسازی ============
   منابع واقعی: conqueredCountries / playerRes / st28.taxRate / unrest / popM / WD_ATTACK_HOOKS
   این ماژول هیچ سیستم موجودی را جایگزین نمی‌کند؛ فقط لایه‌ی تمدن، سیاست، استان،
   فرمانده، برنامه‌ی نبرد، هدف، رقیب، شکوه و chronicle را اضافه می‌کند. */
(function(){
'use strict';
const D=document,W=window,$=id=>D.getElementById(id);
const safe=(f,d)=>{try{const x=f();return x===undefined?d:x}catch(e){return d}};
const faN=n=>Number(Math.round(Number(n)||0)).toLocaleString('fa-IR');
const esc=s=>String(s==null?'':s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'})[c]);
const now=()=>Date.now();

/* ---------- 1) state — هم لوکال، هم سوار بر سیو ابری (الگوی st28) ---------- */
const K65='wd65_state_v1';
let st={
  civ:{popM:0,happy:65,stab:70,emp:0,foodSec:100,mig:0},
  pol:{economy:'balanced',military:'balanced',social:'balanced',diplomatic:'open'},
  prov:{},           /* [country] = {b:{factory..medic:0..5}, dev:0} */
  gens:[],           /* {name,trait,level,xp,wins,losses,loyalty,active} */
  queue:null,        /* {c,b,until,lvl} — یک صف مهندسی جهانی */
  chron:[],          /* {t,k,m} — تاریخچه‌ی امپراتوری */
  siege:{},          /* [country] = {p:0..3,until} — فقط اهداف AI (محاسبه‌ی محلی واقعی) */
  flags:{planAsk:false,maxTerr:0,firstWin:0,firstConq:0,warFat:0}
};
try{const j=JSON.parse(localStorage.getItem(K65)||'{}');if(j&&typeof j==='object')st=Object.assign(st,j)}catch(e){}
st.pol=Object.assign({economy:'balanced',military:'balanced',social:'balanced',diplomatic:'open'},st.pol||{});
st.civ=Object.assign({popM:0,happy:65,stab:70,emp:0,foodSec:100,mig:1},st.civ||{});
if(!st.civ.mig)st.civ.mig=1; /* مهاجرت خنثی = ۱.۰ — صفر یعنی جمعیت صفر (باگ ریشه‌ای) */
st.flags=Object.assign({planAsk:false,maxTerr:0,firstWin:0,firstConq:0,warFat:0},st.flags||{});
function save65(){try{localStorage.setItem(K65,JSON.stringify(st))}catch(e){}safe(()=>W.saveNow&&W.saveNow())}
/* سوار شدن بر snapState/restoreState — بدون دست‌زدن به زنجیره‌ی موجود */
try{
  const _sn=snapState; snapState=function(){const s=_sn();s.wd65={pol:st.pol,prov:st.prov,gens:st.gens,chron:st.chron.slice(0,60),flags:st.flags};return s};
  const _rs=restoreState; restoreState=function(x){_rs(x);if(x&&x.wd65){try{const w=x.wd65;st.pol=Object.assign(st.pol,w.pol||{});st.prov=w.prov||{};st.gens=Array.isArray(w.gens)?w.gens:[];st.flags=Object.assign(st.flags,w.flags||{});if(Array.isArray(w.chron)){const merged=w.chron.concat(st.chron.filter(c=>!w.chron.some(o=>o.t===c.t))).slice(0,120);st.chron.length=0;Array.prototype.push.apply(st.chron,merged)}save65()}catch(e){}}
    /* بعد از بازیابی کشور/قلمروها، تمدن بلافاصله همگام می‌شود (نه ۲۰ ثانیه بعد) */
    setTimeout(function(){try{civTick()}catch(e){}},1500)};
}catch(e){}

/* ---------- 2) helpers on real game data ---------- */
const owned=()=>safe(()=>Array.from(conqueredCountries||[]),[]);
const myName=()=>safe(()=>myCountryName,null);
const online=()=>safe(()=>!!(sb&&ACC&&ACC.uid),false);
const SRVn=()=>safe(()=>Number(SRV)||1,1);
const polFx=k=>safe(()=>(POL65[k].find(o=>o.k===st.pol[k])||{}).fx,{});
function chron(k,m){st.chron.unshift({t:now(),k,m});if(st.chron.length>120)st.chron=st.chron.slice(0,120);save65()}
function toast65(m,kind){safe(()=>{if(typeof showToast==='function')showToast(m,kind||'win')})}

/* ---------- 3) سیاست‌ها (۴ دسته — مزیت/عیب واقعی، همزمان همه‌ی مزایا ممنوع) ---------- */
const POL65={
  economy:[
    {k:'balanced',n:'⚖️ متعادل',d:'بدون اثر اضافه',fx:{}},
    {k:'war_econ',n:'⚔️ اقتصاد جنگی',d:'+۲۵٪ تولید کارخانه • −۶ رضایت • +۸٪ نگهداری',fx:{fac:1.25,happy:-6,keep:1.08}},
    {k:'trade',n:'💼 اقتصاد تجاری',d:'+۱۵٪ درآمد تمدن • −۵٪ قدرت حمله',fx:{gold:1.15,atk:-0.05}}],
  military:[
    {k:'balanced',n:'⚖️ دکترین متعادل',d:'بدون اثر اضافه',fx:{}},
    {k:'offensive',n:'💥 تهاجمی',d:'+۸٪ قدرت حمله • +۲۰٪ تلفات نبرد',fx:{atk:0.08,loss:0.20}},
    {k:'defensive',n:'🛡️ تدافعی',d:'−۱۵٪ تلفات نبرد • −۵٪ قدرت حمله',fx:{atk:-0.05,loss:-0.15}}],
  social:[
    {k:'balanced',n:'⚖️ عادی',d:'بدون اثر اضافه',fx:{}},
    {k:'welfare',n:'🏥 رفاه اجتماعی',d:'+۱۰ رضایت • −۱۰٪ درآمد تمدن',fx:{happy:10,gold:-0.10},s28:'welfare'},
    {k:'austerity',n:'📜 ریاضت مالی',d:'+۱۲٪ درآمد تمدن • −۸ رضایت',fx:{gold:0.12,happy:-8}}],
  diplomatic:[
    {k:'open',n:'🌍 گشودگی',d:'+۲ رضایت • اعتبار دیپلماتیک بهتر',fx:{happy:2}},
    {k:'isolation',n:'🏰 انزوا',d:'+۴ ثبات • −۵٪ درآمد تمدن',fx:{stab:4,gold:-0.05}}]
};
function setPol(cat,k){
  const o=POL65[cat].find(x=>x.k===k);if(!o)return;
  st.pol[cat]=k;
  /* همگام با موتور نارضایتی V28 (تک‌منبع unrest) */
  if(o.s28&&typeof st28!=='undefined'){st28.policy=o.s28;safe(()=>W.save28&&W.save28())}
  else if(cat==='economy'&&k==='war_econ'&&typeof st28!=='undefined'){st28.policy='war';safe(()=>W.save28&&W.save28())}
  else if(typeof st28!=='undefined'&&st28.policy!=='balanced'&&!POL65.social.some(s=>s.k===st.pol.social&&s.s28)&&k!=='war_econ'){st28.policy='balanced';safe(()=>W.save28&&W.save28())}
  chron('pol','سیاست «'+o.n+'» در تالار '+({economy:'اقتصاد',military:'نظامی',social:'اجتماعی',diplomatic:'دیپلماسی'}[cat])+' اجرا شد');
  save65();renderIfOpen();
}

/* ---------- 4) استان‌های امپراتوری + ۸ ساختمان (سطح/هزینه/زمان/مزیت/نگهداری) ---------- */
const B65={
  factory:{n:'کارخانه',ic:'🏭',base:4000,grow:2.1,t:300,job:800,keep:60,d:'+۲۵۰ طلا/تیک در هر سطح'},
  eco:{n:'مرکز اقتصادی',ic:'🏢',base:5000,grow:2.2,t:360,keep:45,d:'+۱۸۰ طلا/تیک + مؤثر در مالیات'},
  barracks:{n:'پادگان',ic:'🪖',base:6000,grow:2.3,t:420,keep:70,d:'+۲٪ قدرت حمله در هر سطح'},
  fort:{n:'پایگاه دفاعی',ic:'🛡️',base:5500,grow:2.2,t:420,keep:50,d:'−آشوب استان + پایداری هنگام جنگ'},
  refinery:{n:'پالایشگاه',ic:'⛽',base:4800,grow:2.2,t:360,keep:55,d:'+۱۵۰ نفت/تیک در هر سطح'},
  farm:{n:'مرکز کشاورزی',ic:'🌾',base:3000,grow:2.0,t:240,keep:20,d:'+۲۰۰ غذا/تیک در هر سطح'},
  lab:{n:'مرکز تحقیقاتی',ic:'🔬',base:7000,grow:2.4,t:480,keep:80,d:'+۵۰ طلا + ۲ XP فرمانده/تیک'},
  medic:{n:'مرکز درمانی',ic:'🏥',base:4500,grow:2.1,t:300,keep:40,d:'+۳ رضایت در هر سطح'}
};
const BMAX=5,BKEYS=Object.keys(B65);
function prov(c){if(!st.prov[c])st.prov[c]={b:BKEYS.reduce((o,k)=>(o[k]=0,o),{}),dev:0};return st.prov[c]}
const lvOf=(c,k)=>safe(()=>(st.prov[c]&&st.prov[c].b[k])||0,0);
const bCost=(k,l)=>Math.round(B65[k].base*Math.pow(B65[k].grow,l));
const bTime=(k,l)=>B65[k].t*(l+1);
const keepOf=c=>{const p=st.prov[c];if(!p)return 0;return Math.round(BKEYS.reduce((s,k)=>s+p.b[k]*B65[k].keep,0)*(polFx('economy').keep||1))};
function upgrade(c,k){
  if(st.queue)return toast65('🏗️ مهندسان مشغول پروژه‌ی قبلی هستند («'+B65[st.queue.b].n+'» در '+st.queue.c+')','lose');
  const l=lvOf(c,k);if(l>=BMAX)return toast65('باکس کامل: '+B65[k].n+' در بیشینه است','lose');
  const cost=bCost(k,l),r=safe(()=>playerRes,null);if(!r)return;
  if(r.gold<cost)return toast65('❌ طلا لازم: '+faN(cost),'lose');
  r.gold-=cost;st.queue={c,b:k,until:now()+bTime(k,l)*1000,lvl:l+1};save65();safe(()=>W.updateUI&&W.updateUI());
  chron('bld','پروژه‌ی '+B65[k].ic+' '+B65[k].n+' (سطح '+(l+1)+') در '+c+' آغاز شد');
  toast65('🏗️ ساخت آغاز شد — '+faN(bTime(k,l))+' ثانیه');renderIfOpen();
}
function tickQueue(){
  const q=st.queue;if(!q||now()<q.until)return;
  const p=prov(q.c);p.b[q.b]=q.lvl;p.dev=BKEYS.reduce((s,k)=>s+p.b[k],0)/4;
  st.queue=null;chron('bld','✔ '+B65[q.b].ic+' '+B65[q.b].n+' سطح '+q.lvl+' در '+q.c+' آماده شد');
  toast65('✔ '+B65[q.b].ic+' '+B65[q.b].n+' سطح '+faN(q.lvl)+' آماده شد!');save65();renderIfOpen();
}

/* ---------- 5) فرماندهان (roster) — تخصص، رکورد واقعی نبرد، وفاداری ---------- */
const TRAITS={off:{n:'تهاجمی',ic:'⚔️'},def:{n:'دفاعی',ic:'🛡️'},log:{n:'لجستیک',ic:'🚚'},intel:{n:'اطلاعاتی',ic:'🛰️'}};
const GEN_NAMES=['سپهبد آریا','سرلشکر کاوه','ارتشبد بهرام','دریاسالار کیان','ژنرال آرش','فرمانده سینا','امیر سپهدار رامین','سرهنگ مهرداد','ژنرال شهرام','سردار بهمن'];
const activeGen=()=>st.gens.find(g=>g.active)||null;
function hireGen(trait){
  if(st.gens.length>=4)return toast65('🎖️ سقف فرماندهان (۴) پر است','lose');
  const r=safe(()=>playerRes,null);if(!r)return;
  const cost=15000*(st.gens.length+1);
  if(r.gold<cost)return toast65('❌ طلا لازم: '+faN(cost),'lose');
  r.gold-=cost;
  const used=st.gens.map(g=>g.name),pool=GEN_NAMES.filter(n=>used.indexOf(n)<0);
  const name=pool[Math.floor(Math.random()*pool.length)]||('فرمانده '+faN(st.gens.length+1));
  st.gens.push({name,trait:TRAITS[trait]?trait:'off',level:1,xp:0,wins:0,losses:0,loyalty:70,active:st.gens.length===0});
  chron('gen','فرمانده '+name+' ('+TRAITS[trait].ic+' '+TRAITS[trait].n+') به خدمت گرفته شد');save65();
  safe(()=>W.updateUI&&W.updateUI());toast65('🎖️ '+name+' به خدمت پیوست');renderIfOpen();
}
function genXp(n){const g=activeGen();if(!g)return;g.xp+=n;
  while(g.xp>=g.level*300){g.xp-=g.level*300;g.level++;toast65('🎖️ فرمانده '+g.name+' به سطح '+faN(g.level)+' رسید')}
  save65()}
function genBattle(win){const g=activeGen();if(!g)return;
  if(win){g.wins++;g.loyalty=Math.min(100,g.loyalty+2);
    if(!st.flags.firstWin){st.flags.firstWin=now();chron('war','🥇 نخستین پیروزی میدانی تاریخ امپراتوری به دست فرمانده '+g.name)}
  }else{g.losses++;g.loyalty=Math.max(0,g.loyalty-4)}
  save65()}
function atkFromGen(){const g=activeGen();if(!g||g.loyalty<40)return 1;
  const t=g.trait;if(t==='off')return 1+0.03*g.level;if(t==='def')return 1-0.01*g.level;return 1}

/* ---------- 6) ضرایب مرکزی قدرت/تلفات (تک‌منبع، با سقف توازن) ---------- */
function tacticName(){const t=String(W.WD65TACTIC||'balanced');
  return({blitz:'⚡ حمله سریع',heavy:'🔥 حمله سنگین',precision:'🎯 حمله دقیق',balanced:'⚖️ متعادل'})[t]||'⚖️ متعادل'}
function atkMult(){
  let m=1;
  const e=polFx('economy'),mi=polFx('military');
  m*=1+(e.atk||0)+(mi.atk||0);
  const bs=safe(()=>owned().reduce((s,c)=>s+lvOf(c,'barracks'),0),0);
  m*=1+0.02*bs;
  m*=atkFromGen();
  const t=String(W.WD65TACTIC||'');
  if(t==='blitz')m*=1.10;else if(t==='heavy')m*=1.15;else if(t==='precision')m*=1.05;
  m*=1+0.04*siegeP(String(W.__WD65_t||'')); /* فشار محاصره فقط برای همان یک حمله‌ی تأییدشده */
  return Math.min(1.6,Math.max(0.6,m));
}
function lossMult(){
  let m=1;const mi=polFx('military');m*=1+(mi.loss||0);
  const t=String(W.WD65TACTIC||'');
  if(t==='blitz')m*=1.06;else if(t==='heavy')m*=1.22;else if(t==='precision')m*=0.80;
  const g=activeGen();if(g&&g.trait==='def')m*=1-0.04*g.level;
  return Math.min(1.8,Math.max(0.4,m));
}
function siegeP(c){const s=st.siege[c];if(!s||s.until<now())return 0;return s.p||0}
function bombard(c){
  const s=st.siege[c]||{p:0,until:0};
  if(s.p>=3)return toast65('🎯 محاصره در بیشینه است — زمان حمله است','lose');
  const r=safe(()=>playerRes,null);if(!r)return;
  if(r.oil<800||r.gold<2500)return toast65('❌ محاصره نیاز: ۸۰۰ نفت + ۲٬۵۰۰ طلا','lose');
  r.oil-=800;r.gold-=2500;
  st.siege[c]={p:s.p+1,until:now()+48*3600e3};
  chron('war','🔥 محاصره‌ی '+c+' — مرحله‌ی '+faN(s.p+1)+' از ۳ (دفاع هدف تضعیف می‌شود)');
  save65();safe(()=>W.updateUI&&W.updateUI());toast65('🔥 توپخانه شروع کرد — فشار محاصره: '+faN(s.p+1)+'/۳');renderIfOpen();
}
