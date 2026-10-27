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

## 第二阶段：逸夫科学馆

已完成唯一资产 src/science-hall-asset.js，主馆约21m（保留估值）、低连接体约6.4m、北附属馆檐高约7.2m/坡屋顶最高约11.6m。后三项是照片估算，不是已核实层高。2019官方西入口与2025-07-25 Commons航拍（2026-06-25上传，Liuxingy，CC BY-SA 4.0）共同支撑高低分体；航拍只覆盖北附属馆，不能据此断言主馆全屋顶。

退出旧通用体块、Science silhouette 与独立 scienceHallFacade；复用 R9 折面玻璃、D形入口与连接屋架，单独抽出屋架工厂以免初始化生成后丢弃旧立面。北附属馆改为暗色坡屋顶；使用折角法线保留屋脊并消除网格小三角阴影。源OSM不变，继承R9西侧折面的视觉展开约14.3平方米（小于0.4%），不是地理测量修订。

- [R11八视图](buildings-r12/science-library-before/browser-results.json)中含逸夫馆8图，另有[旧入口近景](buildings-r12/science-entry-before/browser-results.json)2图。
- [最终十视图](buildings-r12/science-final/browser-results.json)：1440/390，远/近入口、侧面、背面、鸟瞰；JS/HTTP错误0。实际[鼠标/手机点选](buildings-r12/science-click/browser-results.json)及[产品搜索](buildings-r12/science-search/browser-results.json)通过。
- [268处屋面射线、幕墙折面和ID检查](buildings-r12/science-geometry-verification.json)通过；主楼专项同时比较全部9个新归属ID之外的建筑属性/颜色，哈希一致。原完整verify及新增专项、标准build通过，保留750kB包体警告。
- 建筑三角形10,428→4,163，网格8→5，材质8→5，纹理0→0。场景对比同时包含主楼改动，不能把场景总调用差值完全归因逸夫馆。
- [新近入口桌面](buildings-r12/science-final/r12-science-entry-1440.png)、[手机](buildings-r12/science-final/r12-science-entry-390.png)、[鸟瞰](buildings-r12/science-final/r12-science-aerial-1440.png)。近景不是全馆框图，完整附属体看鸟瞰/斜视。

未达标：北侧窗格/屋脊及天窗未有图纸，附属馆高度、后立面及2026现状仍未知；现有R6树位挡入口局部，未移动树。Intel复验请求low-power后实际仍选RTX5060，只登记了[探针](buildings-r12/library-low-power-probe/browser-results.json)，不能据此关闭R11 Intel风险。下一项是图书馆自身细部LOD、批量构建和材质校准，再做同GPU多轮性能/全校园回归。

## 第三阶段：图书馆单一资产的材质与开销

保留 R11 的 library-asset-plan.js、4层北馆/5层书库、分段南馆及49.75m仅用于南馆的范围；不重新建模、不叠加旧立面、不改下沉庭院/通道/地形。沿用[2016官方结构报道](https://news.xjtu.edu.cn/info/1219/153497.htm)、张轶朋北入口照片（EXIF 2017-05-18，相机时间未独立校验）、Liuxingy南面2021-09-06及航拍2025-07-25，完整日期/许可见[既有R11证据](library-r11/evidence.json)。北馆改为较冷的浅灰，南馆改为较暖的石色；这是人工照片匹配，未做色卡标定或摄影纹理采样。

- 将逐面临时 BufferGeometry 改成原始数组累计后按材质构建。交替20样本、3预热的 Node 构造中位数 47.34→24.31ms，[完整样本](buildings-r12/library-construction-benchmark.json)。这是构造阶段 CPU 基准，不是页面加载或 GPU 性能结论。
- 小窗洞侧壁、窗台、中心细框位于同材质 BufferGeometry 的连续末尾。按0.12m参考厚度的屏幕投影设置0.85px进入/0.55px退出滞回，通过 drawRange 取舍细节。墙面、窗洞、玻璃、入口幕墙分格、屋顶、名称和钟面都保留；不隐藏树木、不改全站DPR。
- 看图发现第一版把入口幕墙分格一并隐藏，已退回；实测发现独立细节批次增加近景调用，也已改成同材质末尾范围。两种中间版本结果留本机，不作为最终成绩。
- 完整资产 Node 23,239三角形/7网格；浏览器含4个文字/钟面平面为23,247/11网格，与R11相同。390px正面活动三角形降至10,487，降低约54.9%；实际加载的几何缓冲仍是2,231,456字节、10材质、4生成纹理。LOD不减少常驻显存，不能把活动三角形减少写成内存减少。
- [101屋面射线/滞回/近景恢复/无新增材质批次专项](buildings-r12/library-lod-verification.json)、原R11的2483平面/217屋面采样全部通过。原ID、选择、搜索、着色和资源释放保留。

| 图书馆固定视角 | R11 | R12 |
| --- | --- | --- |
| 南面1440 | [旧](buildings-r12/science-library-before/r12-library-front-1440.png) | [新](buildings-r12/library-r12-final/r12-library-front-1440.png) |
| 南面390 | [旧](buildings-r12/science-library-before/r12-library-front-390.png) | [新](buildings-r12/library-r12-final/r12-library-front-390.png) |
| 近景1440/390 | [桌面](buildings-r12/library-near-before/r12-library-near-1440.png) / [手机](buildings-r12/library-near-before/r12-library-near-390.png) | [桌面](buildings-r12/library-r12-final/r12-library-near-1440.png) / [手机](buildings-r12/library-r12-final/r12-library-near-390.png) |
| 侧面与北面 | [旧结果](buildings-r12/science-library-before/browser-results.json) | [八张最终图和原始结果](buildings-r12/library-r12-final/browser-results.json) |

人工看图：主要幕墙分格在390远景保留；近景窗洞恢复，背面能看清北馆/书库/南馆逐级关系。近景机位刻意看入口细部，会裁掉钟楼顶部；完整轮廓用正面/侧面机位。南馆侧后细节仍大量为重复估算，未达到实景或测绘级。

## 第四阶段：最终回归、性能边界与集成交接

完整 npm run verify 的32项命令及标准 npm run build -- --outDir dist-r12-check 均exit 0，原测试未删除。[原始验证输出](buildings-r12/final-verify-output.txt) / [构建输出](buildings-r12/final-build-output.txt)。标准主JS 771.23kB/gzip215.88kB，750kB警告保留；没有通过调高门限隐藏警告。没有GLB、额外材质图或第三方模型下载；验收双入口构建的world模块735.28→747.42kB/gzip201.56→205.87kB，和标准单入口包体口径不同。

- [最终校园10图](buildings-r12/campus-final/browser-results.json)：北门、梧桐东道、主楼、图书馆北面、逸夫西面，1440/390，JS/HTTP错误0、无WebGL context lost。四大发明广场也在主楼/图书馆南面的组团截图中，未移动广场或树位。
- [图书馆实际鼠标/触屏点选](buildings-r12/library-click-final/browser-results.json)，与先前主楼、逸夫馆真实点选均返回原OSM ID。产品[桌面搜索/旋转/滚轮](buildings-r12/product-1440/browser-results.json)、[390拖拽/双指/漫游/返回](buildings-r12/product-390/browser-results.json)通过，页面缩放仍为1。桌面测试的树木图层开关只验功能，不用于性能样本。
- 390首页标签采样数是0，不能把labelDrift=0视为标签稳定性通过；标签专项留给交互线程。普通手机主楼检查机位前景有邻楼屋顶遮挡，独立固定清晰机位可见整塔。保留旧机位不利结果，交相机线程调整，不在建筑代码中隐藏邻楼。
- [最终配对性能](buildings-r12/paired-performance.json)：实际RTX5060、相同相机/目标/DPR1、每次120新鲜帧、2092棵原树仍在。图书馆390两轮平均帧间隔5.827→5.813ms、5.813→5.813ms，未观察出FPS收益；1440两轮5.823→5.856ms、9.747→5.717ms，波动较大。主楼1440一次5.737→9.979ms较慢；其早期配对9.762→9.876ms接近。逸夫1440最终5.807→5.815ms、390为13.828→14.027ms，早期也有慢样本。所有原始样本保留，不把几何下降当作帧率提升，不宣称已定位系统调度/其他GPU负载的影响。
- 最终图书馆正面全场景调用1440为450→448，390为268→268；主楼清晰正面254→245、172→166。三栋建筑全部加载，场景差值是组合结果，不全归因某一栋。
- low-power探针仍选NVIDIA；它只是WebGL提示，参见[MDN上下文选项](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext)。R11 Intel390回退仍未关闭。Windows Edge 390不是iPhone Safari；真实iPhone、Intel同机复验、温度/功耗隔离和性能波动归因均待处理。
- 已在可见Edge打开 http://127.0.0.1:27922/#way%2F263624057 ，可见主楼选中、≈100m“示意高度·非实测”和完整组团；留存交付标签页。产品首页为 http://127.0.0.1:27922/ ，不是公开发布地址。

建筑真实性结论：本轮是照片引导的近似重建，主楼高塔/低翼/低连接体、逸夫主馆/低联络体/坡屋顶附馆较R11明显改善；图书馆保留已校准体量，主要改善材质分辨和构造/远景开销。未知精确层高、主楼后桥廊、逸夫后立面/屋脊/天窗、图书馆庭院标高和2026外观均未编造，不能标记“高保真完成”。

### 交给统一集成线程

基线165a0a3；阶段一94a6f3e、阶段二42b838c，阶段三提交包含本段记录。依次集成建筑提交，不复制dist，不整体替换world.js。最终状态与测试以本报告、最终source-lock及Git历史为准。

world.js接入只涉及：导入主楼/逸夫专属模块；通用构建在消耗原随机颜色后跳过对应8+1个ID；相应displayHeight和dimensions；禁用旧Main/Science silhouettes及旧专属立面/屋顶叠层；退出这些ID通用屋顶空调；新增资产到场景/pickables；按buildingIndex恢复原ID；着色模式转发；每帧render前调用libraryAsset.updateDetailLOD(camera,height*renderer.getPixelRatio())。所有移动端精度、植被、地面、相机/UI分支应保留集成线程的新实现。library-asset-plan.js、campus.json和R6/R8/R10专项文件未改。

cultural-facades.js仅抽出可复用Science屋架工厂，Siyuan不变。building-silhouettes.js增加默认true的includeMain/includeScience选项，保留旧工厂供兼容验证。旧专项仍运行；新增建筑唯一归属/光线采样/LOD专项必须一起保留。scripts/qa-render.mjs只增加可选建筑点击/搜索/GPU提示并修正独立进程清理；合并时保留交互线程的新增逻辑。

复现：npm run verify；npm run build -- --outDir dist-r12-check；npx vite build --config vite.buildings-r12.config.mjs；npx vite preview --config vite.buildings-r12.config.mjs --host 127.0.0.1 --port 27922；用scripts/qa-buildings-r12.mjs和现有qa-render.mjs执行记录中的机位。对照构建加--mode r12-baseline，另用27923端口；插件从Git读取165a源文件，无需改动其他工作树。

构建曾在本工作树生成tracked dist改动、verify重写旧报告，它们未纳入提交，留本机保护；中间截图同样保留。未修改其他工作树、合并main、推送或发布Pages。
