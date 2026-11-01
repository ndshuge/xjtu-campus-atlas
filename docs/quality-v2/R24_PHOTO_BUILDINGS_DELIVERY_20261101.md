# R24｜南北专属建筑首批已提交资产集成与真实场景验收（2026-11-01）

## 来源与边界
- 主线基础：R23 最终源码 `7449903`，独立新工作树 `feature/r24-photo-building-integration-20261101`。
- 北部施工者只使用已经提交的 `8fe89af` 文件树：`src/assets/north/` 的 5 个新模型，分别为南洋书院东7/8/9舍、彭康书院东18/19/20舍建筑群、康桥苑餐厅。
- Z<0 施工者只使用已经提交的 `be2844d` 文件树：`src/assets/south/` 的 4 个模型，分别为招生办公室、逸夫工程馆、汤英艺术庭院、西二楼。
- 不复制两条施工线未提交的照片、文档、旧西迁纪念馆/崇实楼后续研究或 WIP；不覆盖两条施工者的工作树，建筑源 OSM 原样不动。

## 代码
- `src/photo-building-integration.js` 定义精确 9 OSM ID 的专属建筑注册表、导入和释放生命周期；既保留源几何和 selection/hover/categorical color mode，也允许独立分线继续迭代。
- `src/world.js` 按 OSM ID 跳过这九处旧通用挤出体及泛化屋顶小盒，挂载新建筑 Group 到原 Three.js 场景并加入 `pickables`，无额外 Renderer/RAF。建筑标签/高度仍来自原 OSM，不把建筑照片研究值伪装成已测绘真实高度。
- 原 R21 操场、R23 校园六道路及自由驾驶逻辑保持不变。

## 验证
- 新测试 `tests/r24-photo-building-integration.test.mjs`：9 个 OSM ID 无冲突、资产实际构建、网格可拾取、旧通用体块必须跳过、颜色模式、重复释放、数据只读。
- 原验证脚本 `scripts/verify-buildings-r12.mjs` 是用 `new Function` 独立编译 `buildBuildings`，原本没有注入新建筑排除表。R24 将 `isPhotoBuilding` 显式注入夹具，同时把九个新归属 ID 加入“原通用几何排除”集合，完整几何 SHA 校验仍然执行。
- Vite build 成功，`npm run verify` 完成原校园 40/40。
- 新旧赛车/建筑相关测试 43/43 通过。
- Edge 1440×900 桌面、390×844 手机竖屏模拟、844×390 手机横屏模拟，`scripts/qa-r24-photo-buildings.mjs` 在真实浏览器打开三处代表建筑深链、显示详情卡、检查诊断 9 个资产、再进入真实赛车并退出；三档 `passed=true`，JS/HTTP 错误 0，九张截图与 JSON 在 `docs/quality-v2/r24-photo-buildings-qa/`。
- 实际查看桌面截图：彭康书院建筑群 U 形院落可辨，东8舍外立面与旧通用体块区分；招生办公室默认地图视角没覆盖特色入口面。模型状态是照片证据约束的**阶段性集成**，不是照片级最终确认。

## 限制
- 真实 iPhone Safari 未完成；本轮 Edge 移动模拟不能代表真机发热、电量和性能。
- 主场景仍是程序化地面、树木、部分 OSM 估算建筑高度；没有做全景照片逐像素比对。资产来自分线已提交的版本，其未提交后续修改不会自动进入 R24。
- 南北分线继续各自开发，主线后续审核后才能再次集成和更新 Pages。R24 如果发布，仅作为独立预览。
