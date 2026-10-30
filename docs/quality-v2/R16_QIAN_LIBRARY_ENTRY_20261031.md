# R16｜钱学森图书馆南入口结构细化（2026-10-31）

## 范围与结论

工作树：`E:\CHATGPT\work\xjtu-r15-unified-quality-20261030`；分支 `feature/r16-qian-library-asset-20261030`。本轮只修改图书馆自有的程序化建筑资产、测试和本地证据，不修改其他建筑、OSM 数据、主渲染器或正式 Pages。上一阶段暖石材与选择边缘光已于 `9189f77` 本地提交。

依据仓库已有 Liuxingy 2021 年南正面照片（CC BY-SA 4.0，见 `public/assets/reference/README.md`），在南楼基座玻璃幕墙的中央入口增加低成本、真实立体的浅色石材门框、上横梁、两扇玻璃门的中央竖梃与横向门楣。门洞的准确尺寸、分格和高差均没有测绘证据，因此 **photo-informed / estimated**；不得当作实测复原。2025 年航拍仍用于约束建筑与屋顶总体关系，未从照片提取纹理。

## 实施与结构预算

- 原 `src/library-asset.js` 中的 `south-II-podium` 中央正面分段，入口中心约 `[-29.9285, 1.1, -75.3988]`（校园局部米制坐标），门框宽 3.4 m、高约 3.9 m，均为估算。
- 门框、玻璃和金属构件复用原 `wall / glass / frame` 三种合批材质，不新增 Mesh、材质、纹理、依赖或透明排序；无建筑 footprint / OSM ID / 选中索引 / 碰撞修改。
- 单体近景 **23,239 → 23,325 triangles**（+86，约 +0.37%），**7 meshes 不变**；远景 **10,479 → 10,565 triangles**（+86），远景节省约 54.7%。入口构件保留在远景合批，但只增加 86 面，避免多一个 LOD 绘制批次。
- `asset.userData.southPortal` 记录估算状态、参考来源、局部坐标与尺寸。中性 massing 预览不添加入口细节。
- 同一工作树中观察到并验证了另一处正在进行的中性 massing shader no-op 修正（`if(gray||...)` 与对应测试）；此改动不属于入口几何，但和本轮全量测试兼容，提交前应注意并发改动归属。

## 测试与本地浏览器证据

- **RED**：先创建 `tests/library-entry.test.mjs`，首轮失败于缺少可追溯入口元数据；**GREEN**：新增石材侧框、横梁和门扇金属中梃后，真实 Raycaster 检测这些立体面，1/1 通过。
- `npm run verify` 退出码 0；`npm run build -- --outDir .sites-local/r16-library-entry` 退出码 0，Vite 51 模块，主 JS 799.84 kB / gzip 225.28 kB，仍有大于 750 kB 的 chunk 提示，未掩盖。
- 本地正式生产产物的选中图书馆 + 北向视角，1440px 与 390px 共四次 Edge WebGL 截图：**0 JS 错误、0 HTTP 错误**；选中视角 **1440px 414 draw calls / 874,186 triangles**，**390px 267 calls / 559,902 triangles**；北向视角 1440px 461 calls / 852,237 triangles，390px 252 calls / 531,913 triangles。整场景三角面受树木 LOD 与采样时机影响，不能将小幅差异归因于入口。
- 1440px 桌面鼠标旋转、滚轮缩放、树层开关、搜索选中图书馆均通过；390px Edge 模拟触控平移、双指缩放、漫游前进与返回通过。详见 `r16-library-entry-interaction-1440/` 和 `r16-library-entry-interaction-390/` 的 JSON。不是物理 iPhone Safari 测试。
- 将构建产物复制到忽略目录下的嵌套路径 `/r16-entry/`，用独立静态 HTTP 服务器测试真实相对路径，390px Edge 场景加载、图书馆选中、JS/HTTP 错误均通过。Vite preview 直接指向含子目录的父目录时错误地回退到 HTML，**不能作为 Pages 子路径验证**；已改用不重写路径的静态服务器，见 `r16-library-entry-nested/`。
- 原有 `buildings-r12-review.html` 近景 QA harness 虽能构建并截图，但 `buildingAudit` 缺失、相机停在全景 home；`.sites-local/qa-r12-review-invalid/`（忽略目录）里的截图**不是**真正的近景，不用于入口细节艺术验收。生产选中图书馆截图已人工查看，入口在默认镜头下依然非常小。
- 旧 `qa-render --building-click` 依赖只在 R12 review 中暴露的 `window.__r12World`，直接用于正常生产页面会误报找不到 facade；不把此失败解释为用户点击失效。桌面生产浏览器实际通过了搜索选择，拾取身份与几何射线由专项单测/全量验证覆盖。

## 视觉复核与下一项

和 2021 正面参考相比，入口现在具备可验证的石材边框、玻璃退进和金属分格，但在全楼默认镜头中几乎不可辨；本轮属于**局部几何增量**，不应宣布“高保真图书馆”已完成。最显著缺陷仍是南楼中央深色玻璃立面与周边密集细长窗格的节奏过于平直、缺少真实的石材竖向凸出、层间阴影与细部层次。下一轮应先修复近景审查机位，然后基于 2021 正面照片做一处中高层中央立面的几何节奏切片，在真实 1440/390 近景截图比较后再扩大范围。

本轮未发布 Pages，未改动正式首页。真实 iPhone Safari、长期帧时间和独立艺术审核仍未完成。此文是工程自查，不是第三方艺术验收。

## 交接与隔离

本地提交：`9189f77`（暖石材与聚焦材质）、`12407b0`（入口几何与 massing shader 回归保护）、`37a019a`（图书馆三角面/LOD 验证 JSON）。均在 `feature/r16-qian-library-asset-20261030`，未切换、未推送或发布。

本轮原生 Skill 列表返回空，尝试直接读取专业 Skill 也返回未找到；因此**不能声称本轮成功调用了这些原生 Skill**。继续遵循项目内已保存的 R16 专业参考与 Three.js 材质/LOD 既有方案。先前材质阶段文档记录的 Skill 使用属于先前阶段，不应重复计入本轮。

提交后工作树仍有本轮开始时已有的 `docs/quality-v2/buildings-r12/geometry-verification.json` 等非图书馆生成记录、`.superpowers/`，以及其他执行流程生成的 `r16-library-material-local/click-*` 与 `manual-click-*` 证据；为避免覆盖并行施工，不自动恢复、删除或纳入本轮提交。下一次运行先核实这些改动归属与最新 Git 状态，再决定如何归档。
