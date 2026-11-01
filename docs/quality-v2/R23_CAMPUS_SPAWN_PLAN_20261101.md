# R23 校园赛车起点安全修复实施计划

> 2026-11-01；独立 Git worktree；遵守 `_system/xjtu-parallel-development-policy.md`。

**目标：** 修复已在正式 R22 Pages 复现的“文治路选择后退出赛车”。其原因为 `planCampusDrive` 固定选择道路首段点（位于 OSM 校界外），而 R22 `createDriveSafetyGuard` 拒绝无效出生点。

**范围：** `src/racing/free-roam.js` 提取同一地图合法地形分类器；`src/racing/campus-track.js` 改为优先旧有首段 48% 坐标、否则选择后续 OSM 线段内部合法点，拒绝所有段都不合法；`tests/r23-campus-drive-spawn.test.mjs` 做红绿回归；`scripts/qa-r23-campus-spawn.mjs` 真实浏览器逐一选择六条具名起点。保护 R21 操场与 R22 水面边界、非道路驾驶、三端布局与历史 Pages。

**约束：** 不修改其他施工线工作树、公共 `src/world.js` 或建筑模型；OSM 只读；边界仍为估计并明确标注；使用 Git 非强推发布且 Pages 只由主线发布。

1. [ ] 写失败测试，文治路合法出生点、六条道路+东田径场、无合法点拒绝、已有梧桐东道出生点不变。
2. [ ] 共享合法地形分类器，重构安全守卫复用，针对实际道路尝试已验证的候选采样点。
3. [ ] 跑原有和新增物理套件、主校园 `npm run verify` 与 `npm run build`。
4. [ ] 实际 Edge 桌面/移动触摸模拟逐路切换、自由驾驶、复位和退出；检查 JS/HTTP 错误与截图。
5. [ ] 提交功能分支，确认远端发布分支最新 HEAD 后独立新 Pages 子目录及根链接，小范围更新并在线真实验收。
