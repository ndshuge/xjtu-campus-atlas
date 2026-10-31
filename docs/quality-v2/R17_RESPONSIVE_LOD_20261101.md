# R17｜响应式植被 LOD 跨设备阈值修复（2026-11-01）

## 复现与来源

- 基线：`4185aa4`；施工分支 `feature/r16-qian-library-asset-20261030`，工作树与 OSM、树木位置均未改变。
- 已有 `src/campus-vegetation.js` 在创建时固定 `mobile` 阈值（110m vs desktop 170m），而 `src/world.js` 的 `resize()` 只更新 `this.isMobile`，没有通知植被。390px→900px 时，原版依然按照手机 110m 分类。
- 首版修复发现第二个 Bug：从 900px 返回 390px 时，上一个阈值的 22m 滞回保留了多余近景树木。对同一相机重复切换不应将前一屏幕分类带进下一阈值状态。
- 仅在屏幕类别**真正改变**时清空分类、重建一次实例矩阵；同类别重设保持原 LOD 缓存。历史树形、位置、近远几何、材质与树木数量保持不变。

## TDD 与隔离验证

- `tests/vegetation-responsive-lod.test.mjs`：RED（缺少 `setMobile`）→GREEN；扩大到 120m 滞回边界再次 RED（900→390 保留桌面近树）→GREEN。2/2。
- `src/campus-vegetation.js`：新增 `setMobile`，屏幕类别变化时强制下一帧重新归类并清空旧滞回；保持原 22m 同类别滞回和 `instanceMatrix` 不变时跳过上传的优化；更新近景树投影阴影属性。
- `src/world.js`：`resize()` 仅通知已存在的植被模块，不重建校园。
- `package.json`：加入全量 verify。干净 `git archive` 隔离快照全量 `npm run verify` exit 0，专项 Node tests **37/37**，两套 Pages 风格嵌套生产 build exit 0；原 >750KB JS chunk warning 仍在。

## 真实 Edge WebGL（同页面，不重载）

- 通过 **仅隔离在临时构建副本** 的 `window.__qaWorld` 辅助读取世界实例，进行同一镜头 390→900→390 的实际响应式调整。正式主项目**没有**公开该调试句柄；原始生产 src/app.js 未改动。
- 固定相机坐标约 `[0,36.037,2.099]`，全程没有相机漂移，所有过程 0 JS/HTTP 错误；在相同 2092 棵树中：

| 版本 | 390px 近景 | 900px 近景 | 返回 390px 近景 | 结论 |
|---|---:|---:|---:|---|
| 原版 | 95 | 95 | 95 | 失败：无响应式阈值切换 |
| 修复版 | 95 | 264 | 95 | PASS：阈值按屏幕类别恢复 |

- 模拟 390px 独立交互：触控平移、双指缩放、漫游、pointercancel、返回通过；1440px：搜索选中钱学森图书馆、旋转、缩放、树木图层通过。0 JS/HTTP 错误。
- QA 证据：`docs/quality-v2/r17-responsive-lod-20261101/`，包含真实断点 A/B 的 390/900/390 PNG、原始 JSON、390/1440 两端交互证据（共 14 个文件）。
- 仅有 Edge 桌面模拟尺寸，**没有**真实 iPhone Safari/Android 浏览器覆盖。没有再次推送或发布 Pages。

## 后续最有价值的可独立行动

1. **移动端面数归因**：用真正相同相机的树木 ON/OFF、建筑可见层 ON/OFF 渲染，对应 renderer.info 三角形和批次，确认 475k 移动面数的真实剩余来源。
2. **低速 LOD 过渡可视稳定性**：固定镜头沿 110m 阈值两侧慢移，检查树冠闪现、帧率及是否有未恢复阴影等异常；若无实际异常则跳过修改。
3. **田径场周边建筑**：获得 OSM ID 对应的有许可实景照片，修复一个有显著外墙/屋顶差异的独立楼体，检验前后真实画面。
