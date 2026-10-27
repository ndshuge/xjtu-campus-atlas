# R12 核心建筑 + 南门对齐独立集成（2026-10-27）

## 受保护的施工环境
- 独立集成工作树：`E:\CHATGPT\work\xjtu-r12-buildings-southgate-20261027`
- 分支：`integration/r12-buildings-southgate-20261027`；基线：`5dbf985360c7df3b89b855782cad78b848e0100a`
- Codex 三阶段最终提交：`b40cb7e72ae177c0c512912c0cbfbd1c4aa372d5`，合并提交 `50fd6b2`。
- 南门修复：`b52c34fafc297caab1baac517f92241da919f40b`，合并提交 `fcf6db8`。
- 生产 main、原 integration/r12、正式 gh-pages 均未通过本次施工直接修改。

## 南门模型定位
- 两个 OSM 南门 gate 节点场景 X 分别为 `-46.767` 与 `-23.462` 米，相距约 `23.305` 米；中点约 `-35.1145` 米。
- 旧代码 `signX=x-31` 将墙体人为偏西 31 米，缺乏定位测量依据。
- 新代码将纪念墙放在双节点中点；墙宽按 `min(26.5, span-6)` 得约 `17.305` 米，保持历史照片的宽高比例。墙体至左右 OSM 节点分别保留约 3 米的横向空隙；连同基座左右约 2.775 米。现有 `verify-gates.mjs` 检查保守 2.25m 净空包络。
- 改动路径：`src/south-gate.js`、`src/gate-entries.js`、`src/world.js` 和 `scripts/verify-gates.mjs`。
- **可信度限制**：OSM 节点仅是地图位置，历史立面参照照片来自 2011 年；墙体朝向、宽度、两个机动车/人行通道的实际安全净空未测绘。此修复是有地理锚点的布局纠偏，不能声称 2026 年建筑实测复原。

## Codex 资产集成
- 主楼 A–E：沿用已经进入 R12 的独立完整资产。
- 逸夫科学馆：接入 `src/science-hall-asset.js` 独立主馆、低连接体及坡顶附馆；不再叠加旧通用体块。
- 钱学森图书馆：保留原唯一归属，加入材料及视距细节 LOD；不更改既有 OSM ID、点选、道路、树木和 Apple 地图 UI。
- 未声称 Intel 核显南侧视角性能回退已解除；RTX 5060 的正常渲染不构成 Intel 验证。

## 验收
- 完整 `npm run verify`：通过（含南门净空、逸夫馆资产和图书馆 LOD）。
- 完整 `npm run build`：通过；JS `index-CwU5aEJL.js` 约 777.26 kB，存在超过 750 kB 的原有体积警告。
- `docs/quality-v2/r12-southgate-buildings-final/`：南门、科学馆、图书馆、主楼在 390/1440px 下共 8 张实际 Edge WebGL 截图，8/8 通过；JS/HTTP 错误、页面溢出均 0。
- `docs/quality-v2/r12-final-home-interact-390/`：独立手机视口单指平移、双指缩放、漫游进出测试通过，0 JS/HTTP 错误。
- `docs/quality-v2/r12-final-home-interact-1440/`：独立桌面鼠标旋转、缩放、图层、建筑搜索通过，0 JS/HTTP 错误。
- 对比环境：Windows Edge WebGL 2 + NVIDIA RTX 5060 Laptop GPU，非真实 iPhone Safari。

## 已知风险
- Intel 核显 390px 图书馆帧率回退仍未完成同 GPU A/B 复测。
- 真实 iPhone Safari 手势、树冠闪烁、热负载、后台恢复仍待真机验收。
- 景观分支更密树冠因近景遮挡未全部被 R12 集成接收；本次未擅自代替其做出无依据合并。
- 南门实体墙最终真实位置、竣工立面及宽度未测绘。
- 本报告仅证明独立 R12 完整候选已集成并通过本机验收；正式首页未经用户批准不替换。

## 公网独立预览交付（2026-10-27）
- 正式公网预览：`https://ndshuge.github.io/xjtu-campus-atlas/r12-build-20261027/`，只写入 `r12-build-20261027/`；正式首页和 R11 测试目录均未覆盖。
- GitHub Pages 源分支 `gh-pages` 从 `94d7408036b8dc41885f187a92b39e466b8ad936` 快进至 `67232cbb462e809d823766aa25e8562e7a9fa7ed`；`main` 保持 `36170135addd3c16bebf2f179607e5ee4574043a`。
- GitHub Pages 状态 `built`；公网 HTML (8768 bytes) 与生产 JS `index-CwU5aEJL.js` (777269 bytes) 均 HTTP 200。
- 独立预览路径本机 Edge 六场景 × 390/1440px 合计 12/12，零 JS/HTTP 错误：`r12-staged-complete-20261027/browser-results.json`。
- 实际公网 Edge WebGL 复验南门、主楼、逸夫科学馆、图书馆 × 390/1440px 合计 8/8，零 JS/HTTP 错误：`r12-public-final-20261027/browser-results.json`。
- 真实 iPhone Safari、Intel 核显图书馆稳态帧时与南门实测位置仍未验证；R12 当前仅作独立预览，不替换正式版。
