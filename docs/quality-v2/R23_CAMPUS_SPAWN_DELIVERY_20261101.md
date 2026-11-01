# R23｜校园赛车六条起点校界校验与文治路修复（2026-11-01）

## 问题与证据
- R22 正式页面点击赛车、选择 `文治路` 会关闭赛车，提示“赛车加载失败，已恢复校园地图”。
- 原 `src/racing/campus-track.js::planCampusDrive` 固定从 OSM 道路首段 48% 取出生点：文治路第一段约 `[-421.78644,2.3,36.21528]`，R22 `createDriveSafetyGuard` 会判为 `outside-campus` 并抛异常。
- 路网校界采样：110 条 OSM 道路共约 15.97km，其中只有文治路两条道路记录的端头约 17.5m 超出地图校界。因此使用校内同路段的出生点，不扩大地图边界。

## 实现
- `src/racing/free-roam.js`: 从 R22 安全守卫抽出 `createDriveAreaClassifier(data)`，供道路出生点与运行时车辆防水/越界采用**完全同一分类规则**。仍保持近似校界 2 米容忍、水面禁止、OSM 数据只读。
- `src/racing/campus-track.js`: 保留原本有效的首段 48% 出生点；当道路段无法合法出生时，沿原 OSM 路线顺序尝试同一段的多个候选，再去后续路段。任一候选都不合法时明确拒绝。该方法不会跨路、不会虚构新道路、不会因为仅几何交叉而连接路口。
- 文治路实际校内出生：约 `[-359.45,2.3,36.25]`，保持原路段方向与物理体系。

## 测试
- **TDD RED**：首次运行 `tests/r23-campus-drive-spawn.test.mjs`，5项中 3 项失败，均指向文治路/校外道路的非法出生行为；改动后 5/5 PASS。
- 新旧赛车完整 suite：**40/40 PASS**，原校园 `npm run verify`：**40/40 PASS**，`npm run build` 成功。
- 浏览器 `scripts/qa-r23-campus-spawn.mjs`：在 1440×900 Edge、390×844 手机模拟、844×390 手机模拟，实际逐项选择六条道路，全部四轮接地、校内出生；文治路实际加速，东田径场切换与退出；**3/3 PASS**，JS/HTTP 错误 0，截图和 JSON 在 `docs/quality-v2/r23-campus-spawn-qa/`。
- 真实 iPhone Safari 未连接：**NOT_TESTED**。三档手机测试为 Edge 模拟，不代表 Safari 实机性能。
- 原 R21/R22 校园地形依然是平面高程模拟，不是测绘实测，亦不表示实际机动车可在校园行驶。

## 并行边界
- 独立工作树 `E:/CHATGPT/work/xjtu-r23-campus-drive-spawn-20261101` 和分支 `feature/r23-campus-drive-spawn-20261101`，基于 R22 源码 `874f56b`。
- 未修改北部与南部建筑工作树、公共 `src/world.js` 或原 OSM；遵守 `_system/xjtu-parallel-development-policy.md`，本轮无全局锁。
- 按用户授权由主施工负责独立 Pages 子目录与首页发布，发布 SHA 和公开 QA 单独记录。
