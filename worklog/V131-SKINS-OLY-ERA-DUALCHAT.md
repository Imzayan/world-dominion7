# V131 — SKINS-FOR-ALL + OLYMPIC-NEW-ERA + DUAL-CHAT + ECON-NERF + HOST-PERKS

## 用户原始订单（波斯语锚点）
- «الان مشکل اینه من دارم اسکینی که یکی از پلیر ها روی کشورش خریده و گذاشته و طرح رنگ کشورهاشو عوض کرده رو نمی‌بینم این مشکل رو برای همه حل کن که همه ببینن» → ①
- «اطلاعات المپیک رو کامل از نو بکنی از دوره یک شروع بشه و تمام مدال همه چی ریست و از نو بشه» → ②
- «قسمت چت جهانی رو اضافه کن با یه کیفیت زیبا هم داخلی هم خارجی» → ③
- «یکم سخت تر کن بدست آوردن سکه نفت و گندم را» → ④
- «مزایده المپیک … قبل اینکه المپیک شروع بشه بقیه پلیر ها تو مزایده حرفه ای شرکت کنن و تلاش کنند برای بدست آوردن میزبانی» → ⑤
- «برای میزبانی المپیک یک سری آپشن های مهم ولی محدود … یک قدم میزبان از بقیه کشور ها جلو باشن» → ⑥

## ① SKINS-FOR-ALL（根因修复 — 上版 V130 只同步了 hue/emblem/title，漏了 pat）
- 根因：`COS.pat`（宝石商店购买的国土花纹/配色皮肤）既不在 COSYNC 签名里，`patOv_rebuild` 也只渲染"自己的"领土。
- COSYNC 签名升级：`[[wd130:h…;e…;t…;p<patid>]]` — ingest/fromProfile/自注册全链路带 `p`，`WD131_PATIDS` 白名单校验（伪造签名无效）。
- `patOv_rebuild` 全面泛化：`othersSkins()` 从 OTH×REG 聚合每个他国领主的 (pat,hue)；`patDefs_ensure(others)` 为每个唯一 (pat,hue) 组合生成 `wdpO-<pat>_<hue>` pattern def；他国领土逐国叠加 `.wd-pat-ov` 图层。3s sig-check + COSYNC repaintSoon 钩子驱动重建。
- 广播通道复用 V130：聊天签名 + bio 签名（ensureOwners 每 15s 拉取 3 个领主档案）。

## ② OLYMPIC NEW ERA（server 是黑盒 → 展示纪元 watermark 方案）
- `WD131_ED_BASE=12`（baked；raw 版号由 ANCHOR 2026-01-01 + 30d 推得当前 ≈11）。`edShow33(raw)=raw>=12?raw-11:1`；`isLegacy33(raw)=raw<12`。
- 所有「显示」位点改用 edShow33：hub 标题、recordsBox（+legacy 过滤）、archiveBox（+过滤）、rank chip、 اختتامیه卡、live strip、auction 卡、admin 状态行。raw 编号保持服务器键不动（RPC/localStorage key 全兼容）。
- Career-gate：defineProperty 包裹 `window.WD33_CAREER`（wgRefresh 每次重赋值也会被拦截）— raw<12 时全员 {g:0,s:0,b:0,total:0} → 头像雕塑/聊天勋章/名人堂全部归零。
- 管理面板新增「🔄 شروع عصر تازه‌ی المپیک — دوره ۱」双击确认按钮：oly_admin_shift(reset) + 本地 base 覆写 + 清扫 wd60rk_*/wd33open_*/wd33sp/wd33toff + reload。

## ③ DUAL-CHANNEL CHAT（v28-chat 全量重写 → Chat 3.0）
- 🌍 جهانی（全服 — server=0 通道）+ 💠 داخلی（本服）双频道；per-channel rows/lastSig/unread/dead 状态机。
- server=0 若被后端拒绝 → 2 次失败后 fail-soft 标记 dead，友好提示 + 自动回落；서버 채널 영향 없음。
- 电影化 UI：glass 头部、动画频道 pill、per-channel 未读徽章、菜单徽章=两频道之和；COSYNC ingest/宝冠/总统/东道主标签全部保留并新增 👑 میزبان 标签。
- 零 reflow 动画（transition only）。

## ④ ECON NERF（balance.js — «سکه نفت گندم سخت‌تر»）
- popIncomeBase 2→1.4、perPop 0.015→0.011；food 4/4/3→3/3/2.2；oilBase 2→1.5、oilPerInfra 1.2→0.9；psc .5/.15/.5→.38/.11/.38。
- tax perPop 0.9→0.72、base 60→45；unAid 90s/500/300→120s/340/190；refinery 14→11、oilfield 10/6→8/5、mine 10/4→8/3。

## ⑤ CINEMATIC AUCTION（V53 卡片重写）
- 火炬头 + 倒计时（到 regAt）+ 王座行（当前最高价玩家发光）+ 4 档阶梯（+5/+25/+100/+500）+ 自定义出价输入 + 钱包行 + 退款保证。
- 🏆 宿主特权预览网格（动机先行）。新增 `#wd131-axpill` 地图悬浮 pill（45s 轮询 oly_host_state；auction_open 且非 live 时显示；点击直达 Olympic hub；wd-quiet/wd-tabhidden Governor 降级）。

## ⑥ HOST PERKS（重要但有限 — 仅 live 阶段）
- WD131_HOST：`incomeMult()`（我是 host 且 live → 1.15）钩入 prod/popIncomeTick/taxAmount（__WD131_HOOKS 佐证）；`defMult()`（目标是 host 且 live → ×0.80）链接 WD130_SHIELD.effAttack 之后；briefing 注入「👑 دفاع میزبان ۲۰٪ قوی‌تر」警告行。
- 既有服务器特权保留：+1 تلاش (att_max)、افتتاحیه معرفی、۵۰ جم اختتامیه；新增 👑 تاج میزبان on capital label (WD131_HOSTTAG → otherLabel)。
- 消歧：REG 里 pattern 键是 `p`（不是 `pat`）— othersSkins 曾读错，E2E 抓出并修复。

## QA
- check-html-js: **102 scripts / 0 errors**；verify-build: **9/9**；v131-smoke.mjs: **31/31 + zero pageerror**（含 skin E2E：他国 defs + overlay polygon 真实渲染）。
- v.txt=131、__WD_V=131、7×?v=131。

## 部署注意
- baked WD131_ED_BASE=12 对应「当前 raw≈11」窗口（2026-11-30 前）。若此后才执行时代重置，用 admin 按钮（本地覆写 base）；跨客户端 baked 值偏差时显示版号会偏大 — 下个版本可把 base 广播进 bio 签名。
- چت جهانی server=0 依赖后端 world_chat 表无 server check 约束；被拒时 fail-soft，不影响本服频道。
