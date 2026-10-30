# V132 — CHAT-ENTRY-RESTORED + PERF-GOVERNOR + BOOT-SLIM

## 用户原始订单（波斯语锚点）
- «چت جهانی رو اضافه کن دیگه چیزی هنوز اضافه نشده» → ①
- «بازی یکم دیر لود میشه» → ②
- «خیلی هنگه کامل درست کن اینو» → ③

## ① چت جهانی — 根因：功能在但入口为零（用户完全正确！）
- **根因链**：V130 菜单去重把 «چت جهانی» 从汉堡菜单删除，注释声称«داک里有按钮» → 但那个 `wd-feature-dock` 早在 V74 就被 `display:none!important` + 多处 remove() 废弃；新 `wd87dock`（V87 命令条）从来没有聊天按钮；WD7 面板「هرگز باز نمی‌شود」（V71 注释）。= 三个历史入口全部死路，V131 造好的双频道聊天（Chat 3.0）**在 UI 上无法到达**。实测 `chat_entry`: `chatBtnInDock:false / featureDockVisible:false / dock87_has_chat:false / menu_has_chat:false`。
- **修复（双入口）**：
  1. `wd87dock` 新增 `wd87-b-chat` 💬 按钮（`ensureChatBtn()` 幂等注入，build() 新建/复用两条路径都调用；第 2 位黄金位）：teal→blue 渐变气泡 SVG + 未读徽章槽（`.wd87-b`）+ 呼吸光晕（`wd132chatGlow`/`Urg`，只 filter/transform，`wd-quiet` 下停用）；点击链 `WD28Chat.open() → openModal('wd-chat') → classList.add('active')` 三级回退。
  2. 汉堡菜单 `viewHome()` 顶部恢复金色 «💬 چت جهانی» 项 → 这同时让 V28 的 `badge()`（找 b**چت جهانی**）重新工作。
- **未读联动**：`badge()` 扩展 → 同时刷新菜单徽章 + dock 按钮徽章（hidden 切换 +Persian 数字）+ `wd132-unread` 急促光晕。
- 实测：dock 点击开模态 ✓、双频道 tabs ✓、WD28Chat.open() ✓、菜单项开聊天 ✓。

## ② BOOT（«دیر لود میشه»）
- **geojson 瘦身**：`scripts/v132-slim-geo.mjs` — minify + 坐标 4 位小数（≈11m，maxZoom 6 ≈ 2.4km/px 下不可见）+ 只留 `properties.name`（游戏只读这个）+ `id`。257KB→218KB raw（15%），180 国/名字/面积逐项校验通过（备份 `.v131`）。
- **字体 preload**：Vazirmatn Regular+Bold woff2 `<link rel=preload crossorigin>` → 首屏文字更快。
- **启动 splash 消息轮播**：`msgs[mi]` 疑似损坏 — 经 od/码点核实为 **RTL bidi 终端显示幻觉**，代码本来就正确（教训：波斯语混排文件一律以 od 为准）。
- **不做**（有意）：整文件 terser 压缩（109 个 inline script，~1.18M 字符 JS — AST 重写风险/收益比不划算）；脚本外置拆分（109 块顺序/DOM 位置依赖，回归风险大）。重复访问已有 SW SWR 秒开；冷启动网络仍是主墙（537KB brotli HTML）。

## ③ RUNTIME（«خیلی هنگه»）— PERF GOVERNOR
- **`<head>` 最前全局 `setInterval` 包装**（所有游戏脚本之前，一个补丁点管 103 个 interval）：
  - 弱机检测（coarse pointer + ≤4核/≤4GB，或 cores≤2 / mem≤2）→ `window.__WD_QUIET_TICK=true`；
  - 弱机上 **≥5000ms** 的 interval ×1.4（上限 60s）→ presence/save/meta/后台聊天轮询显著降频；
  - **刻意豁免 ≤4.5s 的游戏逻辑 tick**（درآمد 1s、بحران/مهاجرت/تریبیوت 4s、updateUI 3s）→ 不同设备游戏节奏公平不变；
  - **≥30s** 的 interval 页面隐藏时跳过（presence/聚合类）。
- 实测（4×CPU 节流 + Pixel 5 视口）：`__WD_QUIET_TICK=true` ✓、interval 透传返回 id ✓、runtime 8s 窗口 longtask=1（55ms）、拖地图 p50 54-56fps。
- 桌面基线（未节流）：idle 60fps / pan 60fps / 0 jank — 卡顿感主要来自弱机的周期性 p95 谷（25fps）→ governor 直击该源。

## QA
- check-html-js: **103 scripts / 0 errors**；verify-build: **9/9**（v.txt=132 识别）。
- v132-smoke: **18/18 + zero pageerror**（dock 按钮/双频道/模态打开/菜单项/徽章槽/governor/geo 180 国/map 挂载）。
- v131-smoke 回归: **31/31 + zero pageerror**（beacon 检查放宽为 ≥131）。
- v.txt=132、__WD_V=132、7×?v=132。

## 部署注意
- geojson 是 SW `IMMUTABLE` cache-first：老用户继续用旧缓存副本（内容兼容，无害）；新用户直接拿 218KB 新版。要强制全员刷新需 bump sw.js CACHE 名（本次未做，避免无谓全量重下载）。
- governor 只影响弱机 polling 节奏（×1.4）；若玩家反馈后台消息变慢，可把阈值 5000 降到 8000（一行）。
