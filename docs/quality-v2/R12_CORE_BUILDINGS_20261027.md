# R12 核心建筑施工交接

基线 `165a0a355faef670a87f7a7a3c07ddce9095b5b4`（R11 完整集成），分支 `feature/r12-buildings`，工作树 `E:/CHATGPT/work/xjtu-r12-buildings`。没有从旧 main 开发，没有修改其他工作树、合并 main 或发布 Pages。

## 第一阶段：主楼 A–E 与连接体

**已实现有照片参照的完整组团；精确高度及后部桥廊仍非测绘级。** 复用现有 Three.js、architectureBatch、材质工厂、R5 屋顶构件和 OSM 坐标，不引入 GLB/第三方模型。

- 唯一可见归属：`src/main-complex-asset.js`，覆盖 A–E、北侧连接体 `264595812` 和圆庭两半连接体 `3557330/3557331`，共 8 个原 OSM 对象。所有 ID、数据坐标和原高度字段保留。
- E 的显示高度由旧 80.5m 估值校准为约 100m；A–D 由旧 27m 调整为约 22m 的四层表达；三处连接体由统一 14m 调整为约 5.4m。**全部是明确登记的照片估算，不宣称取得 107.45m 或其他竣工尺寸。** 不挖地、不添加未经核实的后部架空桥。
- 顶部改为四角支撑、正侧面均有真实净空的开敞框架。连续浅色竖框、中央幕墙及侧面长玻璃槽替代大面积重复小方窗；原 R5 椭圆构件烘入同一资产批次，没有独立叠加旧立面。
- `building-asset-kit.js` 是现有 architectureBatch 的小型属性/原始缓冲扩展，保留每个三角形的 buildingIndex；不是另起校园架构。五个材质批次支持原选择、悬停、分类/高度着色及资源释放。
- `world.js` 只做建筑接入：跳过这些 ID 的通用体块及旧专属立面、退出相应通用屋顶设备；接入新资产和原 pickables；按三角形 ID 返回原建筑对象；传递着色模式与估算显示高度。渲染、DPR、植被、道路、相机和 UI 逻辑不改。

实景与权利见 [evidence.json](buildings-r12/evidence.json)：范新凯官方正面（摄影日未知、2015 数字化时间不是摄影日）、Danielinblue 2012-11-06 Commons 侧面（CC BY 3.0）、校友网第一人称校园记述（2020-04-14，百米高是描述而非测绘）、设计论文仅取得书目线索。学校照片及新读取的 Commons 原图均留仓库外，未作贴图。

| 检查 | 结果与证据 |
| --- | --- |
| 灰模 | [第二轮 6 视图](buildings-r12/main-gray-v2/browser-results.json)，发现并修正圆庭遗留 14m 通用块；后续立面修正不改变主包络 |
| 固定对照 | [R11 14 图](buildings-r12/main-before-v2/browser-results.json) / [R12 14 图](buildings-r12/main-final/browser-results.json)，1440×900 与 390×844，相同视点和 FOV；清晰正面针对每种画幅固定视点，新旧一致 |
| 看图结论 | 高塔/四层低翼/低连接体关系更清楚；侧面长玻璃槽更符合 2012 照片。北侧平台仍简化，后部桥廊及地坪高差没有图纸支持。原正面含图书馆钟楼前景遮挡，保留该不利机位，并增加 clear 机位 |
| 实际选择 | [鼠标和手机点按](buildings-r12/main-click-final/browser-results.json)，命中同一 `way/263624057`；[产品搜索](buildings-r12/main-search/browser-results.json)选中主楼 E、旋转、滚轮和图层开关通过 |
| 几何专项 | [报告](buildings-r12/geometry-verification.json)：246 屋面射线；正面/侧面开洞正反例；通用顶点 1992→0；非主楼全部属性及颜色哈希一致；源数据不变 |
| 原有回归 | 完整 `npm run verify` 通过，保留旧建筑工厂的断言，新增唯一路径判断而非删除旧检查 |
| 资源 | 原三角形 29,100→13,571；网格 12→5；材质 10→5；纹理 0→0。清晰正面场景绘制调用 1440：254→246，390：172→166。FPS 处于 RTX/刷新封顶，本阶段不把它当作 Intel 风险解决证明 |

重点截图：[旧清晰正面](buildings-r12/main-before-v2/r12-main-front-clear-1440.png)、[新清晰正面](buildings-r12/main-final/r12-main-front-clear-1440.png)、[手机](buildings-r12/main-final/r12-main-front-clear-390.png)、[侧面](buildings-r12/main-final/r12-main-side-1440.png)、[鸟瞰](buildings-r12/main-final/r12-main-aerial-1440.png)。

下一可执行项：接入已经根据西入口照片与 2025 航拍拆分的逸夫馆主馆/低连接体/坡屋顶北附属馆，退出其通用体块及旧立面，执行同机位浏览器对照。图书馆沿用 R11 单一资产，其 Intel 性能问题在第三阶段另行定位，不由当前 RTX 帧率替代。

## 集成边界

只合并本建筑分支的源码与必要 world 接入，不复制旧 dist 覆盖其他线程。`scripts/qa-render.mjs` 的可选建筑点击、搜索目标及 low-power GPU 提示仅用于验收，默认运行保留原行为；low-power 是标准 WebGL 提示，必须核查实际返回 GPU，不能把提示本身当成 Intel 证据。Windows Edge 仿真不是真实 iPhone Safari。
