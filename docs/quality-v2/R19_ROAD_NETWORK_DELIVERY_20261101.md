# R19｜兴庆校园多道路物理驾驶交付与限制（2026-11-01）

## 已有 R18 基线与 R19 边界
- 开发基线 `443a2d8378e0c897708c498c10907812e3689962`，原 R18 独立 Pages 预览仍保留，原 `E:/CHATGPT/work/xjtu-r15-unified-quality-20261030` 的未提交校园工作区不编辑、不覆盖。
- R19 隔离施工 `E:/CHATGPT/work/xjtu-r19-road-network-20261101`，分支 `feature/r19-road-network-20261101`。
- 保持单个 Three.js Renderer / RAF、R8 Cannon RaycastVehicle 物理、已有车模/手刹/键鼠/多点触控、旧 R17 实验室与独立练车场。
- 校园 OSM 原始道路位置只读，平面高度代理为模拟值，不宣称实测真实道路高程、净空、坡度与机动车通行权。

## OSM 连通性审计与实现
- 数据：`public/data/campus.json`，250 条 `campus=true` 道路记录。
- 选择路类 `unclassified/service/residential/living_street`，近似宽 3.5–12m，坐标有效：111 条候选；通过**共享原始道路节点**拓扑，与梧桐东道相连的最大分量为 **110 条**、总中心线约 **15967.00m**。孤立 1 条不假装连通，行人路/步道不进入物理驾驶路网；线条仅几何相交但 OSM 不共享节点时不作虚构路口。
- 代码 `src/racing/road-network.js` 完成只读连通性、原始几何分段和附近道路查询；支持六条具名起点：梧桐东道、梧桐西道、文治路、思源路、彭康路、学森路。
- 代码 `src/racing/network-physics.js` 按车辆附近 130m 半径维护 Cannon 路面 Box、附近建筑墙面 Box 和程序化树干 Cylinder；移动至少 30m 时按需增删，尽量避免全校碰撞实例。发生道路边界跌落时安全复位到所选起点。树木 ID 使用原始索引，避免每次移动复用错误树体。
- `src/racing-mode.js` 中仅在用户主动进入赛车时加载路网/物理，支持具名道路切换、独立练车场、复位、驶出模型区域自动恢复。主场景景观、建筑、道路真实度成果不重建、不覆盖。

## 成熟工程技术参考（方法，不复制完整系统）
- OSMnx 拓扑简化与路口节点概念：https://github.com/gboeing/osmnx/blob/main/docs/source/getting-started.rst；本工程不重建 OSMnx 路网，不合并无共享节点的线条。
- icurtis1/raycast-vehicle：https://github.com/icurtis1/raycast-vehicle；继续复用原已固定的 MIT RaycastVehicle，而非另造动力学。上游有 GLB level + Trimesh，校园场景道路不是可信的已测 3D 网格，因此依然使用轻量局部 Box 代理。
- Cannon-es SAPBroadphase：https://pmndrs.github.io/cannon-es/docs/classes/SAPBroadphase.html；用于约束近场物理世界负担。
- MDN WebGL 性能：https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices；遵守移动端像素/显存预算，不增加渲染器与额外 RAF。

## 验证记录
- `npm run build` = exit 0，赛车部分独立按需加载。
- `npm run verify` = exit 0，原主项目 40/40 通过。
- `node --test tests/r19-road-network.test.mjs tests/r18-campus-drive.test.mjs tests/racing-integration.test.mjs` = **16/16 通过**；包含所有 6 条起点真实物理接地、运动、共享节点路口可穿行、伪交叉排除、分区碰撞生命周期、移动后树干 ID 稳定、与历史 R18/R8 兼容。
- `docs/quality-v2/r19-road-network-qa/results.json`：Edge 1440×900、390×844 触摸模拟、844×390 触摸模拟均 `ok=true`、JavaScript 错误 0、HTTP 错误 0。实际车辆前进/倒车、触控多点同时转向+加速、至少一次切换到梧桐西道并返回、继续切换练车场与恢复原地图、5 次键盘复位全部真实通过；截图保存同目录。
- 近梧桐东道一组实际浏览器诊断：24 条道路碰撞板、35 条建筑墙、90 根程序化树干，合计 149 个活动碰撞体；路网全量则为 110 条道路。Edge 移动模拟的帧率和截图仅说明该模拟环境，不代表 iPhone 真机性能。

## 仍未解决的产品限制
- 物理“可驾驶路网”以当前 OSM 连接数据为准，非实测行车许可或真实地形。未验证的坡度、高程、路口转弯净空、建筑局部台阶、全部行人及细节障碍物仍缺数据，暂不假装已经解决。
- 110 条路段都构成可达网络，六条具名路段具有起点选择；不代表每个角落都经过人工长时间实际驾驶，尤其路口边缘碰撞、坡路真实度尚待实机与路段证据。
- 真实 iPhone Safari 需要连接真实设备进行触控释放、帧率、发热、电量与横竖屏适配验收。Windows Edge 移动模拟不能替代该测试。
- 现有手机控件继续支持多点触控，UI 作为功能阶段已验收；最终视觉审美、驾驶手感仍应经用户实际体验反馈。

## GitHub Pages
- 独立预览计划 `/r19-campus-road-network-20261101/`。只有当本机验证、源文件提交、Scoped Pages 目录推送及**公开网页真实驾驶**通过后，才写为已发布。
