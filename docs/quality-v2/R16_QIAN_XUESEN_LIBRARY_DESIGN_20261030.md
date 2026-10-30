# R16｜钱学森图书馆高保真资产设计说明（待批准）

**状态：DESIGN DRAFT / 尚未开始模型或源码施工**
**基线：** R15 source `44e0b92`（R15 Pages preview 已发布）
**工作分支：** `feature/r16-qian-library-asset-20261030`
**目标对象：** 兴庆校区钱学森图书馆，OSM `way/263624481`

## 1. 目标与用户既定节奏

交付一个**完整、可独立加载、来源可追溯、可在 Blender 中继续编辑**的钱学森图书馆外观资产。保留现有 Three.js 校园世界、OSM 建筑 ID/足迹、点击选择/搜索/颜色模式和现有 R12 程序化模型回退。

本轮按用户此前确定的节奏，不并行堆一批建筑：
1. **大幅提升 1：** Blender 原生建筑场景与可独立加载的 GLB；重做主轮廓、立面和屋顶。
2. **小幅提升 2：** 聚焦材质和少量识别性细节（石材面板、玻璃、钟面、屋顶绿化/标识）；不堆装饰。
3. **大幅提升 3：** Three.js 正式接入、近中远 LOD、按需加载/回退、性能和交互验收。

每一项都必须有自己的可观察产物和测试；三项全部完成后再交付 R16。R16 Pages 发布不自动授权，当前 R15 正式首页和 R15 预览均保持不动。

## 2. 当前真实基线

### 已有资产与工程状态
- `src/library-asset.js` 是现行程序化完整资产，内部版本标记 R12；`src/library-asset-plan.js` 管理北楼、书库、南楼分段与高度范围。
- 现有模型有 **23,239 triangles / 7 meshes**；远景 LOD 为 **10,479 triangles**，减少约 **54.9%**。资产验证还覆盖 2,483 个空间采样、217 个屋顶采样，并确认 OSM 源数据不变。
- OSM footprint 面积约 **7,994.27 m²**；原 OSM ID 为 `way/263624481`。
- Blender **5.2.1 LTS** 已安装；项目 Three.js **0.186.1**，Vite `base:'./'`，官方 `GLTFLoader` 已随依赖存在。
- 仓库目前没有 `.blend/.glb/.gltf` 建筑源资产。R12 程序化模型继续作为 R16 的可逆 fallback。
- 当前 R15 Pages：`https://ndshuge.github.io/xjtu-campus-atlas/r15-unified-20261030/`。正式首页、R14 历史版本不覆盖。

### 本轮新取得的真实浏览器基线
公共 R15 Pages，Edge WebGL，固定相机 `library-north` / `library-plan`，0 个 JS 错误、0 个 HTTP 错误：

| 视角 | 1440px draw calls / triangles | 390px draw calls / triangles |
|---|---:|---:|
| library-north | 461 / 852,237 | 252 / 531,913 |
| library-plan | 274 / 565,524 | 194 / 493,254 |

这是**整座校园场景**的渲染统计，不是图书馆单体统计；headless Edge 的 FPS 不作为真实设备帧率结论。当前场景已高于 3D Skill 的移动端起始预算（150 calls / 300k triangles），因此 R16 不允许简单叠加高面数和多套材质，必须用纹理、合批与 LOD 换取细节。任何预算超限要记录实测取舍，不以“看起来能跑”通过。

基线证据在 `docs/quality-v2/r16-library-baseline/`，包含产品入口、正面/俯视视角截图及浏览器结果 JSON。

### 已知测试状态
- 新工作分支基于 R15 commit `44e0b92`，尚无产品代码修改。
- 新分支上的 `npm run verify` 基线通过。
- `verify-library-asset-r11.mjs`：23,239 triangles、7 meshes、源 OSM 不变。
- `verify-library-lod-r12.mjs`：远景 10,479 triangles、近景细节恢复和 hysteresis 通过。
- `verify-library-forecourt.mjs`：21 个几何部件，现有前场保留。
- **旧 R11 专项 review build 已失效：** `vite.library-r11.config.mjs` 仍试图将 `world.js` 中旧的 `createLibraryFacade` import 作为补丁锚点；R15 已改变该结构，构建会报 `R11 world integration anchor changed`。这是旧 review harness 过期，不是产品主构建失败。R16 必须建立适配当前 `world.js` 的新审查入口，不得放宽旧 guard 或伪造 R11 review 通过。

## 3. 真实建筑事实与证据边界

### 可以作为几何约束的事实
- 西交大官方钱学森图书馆页面（更新日期 2026-04-13）确认北楼建于 **1961 年**、南楼于 **1991 年**投入使用；面积约 11,200 m² / 18,000 m²。另一官方页面（2024-06-27 发布，2024-03-05 更新）给出相同的四舍五入面积。2016 新闻稿的精确面积为 11,189 m² / 18,005 m²；这些是建筑面积，不是 OSM 占地面积。
  https://www.xjtu.edu.cn/tsda/qxstsg.htm
  https://www.xjtu.edu.cn/info/1112/2228933.htm
- 西交大新闻网保护名录文章（2016-11-21；本轮通过搜索结果核验到全文摘要，网页直接打开超时）记载：北楼主体为“山”字型四层，南面连接五层书库；南楼 I、III 段三层，II 段地面十一层、地下一层，顶部另有电梯机房和水箱二层；**49.75 m 仅适用于南楼 II 段**。南北楼 1–3 层有长廊相通。不得把 49.75 m 套到整座图书馆。
  https://news.xjtu.edu.cn/info/1002/66472.htm
- 新华社 2026-10-13 搜索摘要提到“书山形”；原页面本轮未能打开，标记为 `SOURCE_BLOCKED`。只作为弱的整体识别意象线索，不作为几何或测绘依据。
  https://www.xinhuanet.com/20261013/d42e47404e3c4ab6b336946bc42d276a/c.html

### 图片与版权
- 本机 `public/assets/reference/README.md` 登记的两张 Commons 参考图：Liuxingy 的 2021-09-06 正面照、2025-07-25 航拍图，均为 **CC BY-SA 4.0**；保留作者、原图 URL、许可 URL 和必要的 share-alike 说明。
- 西交大文明网地标页（页面未标注图片拍摄日期）展示张轶朋拍摄的图书馆照片、李一鸣拍摄的航拍照片；页面没有明确授予图片再使用许可。**只作视觉参考，不复制像素、不作贴图、不入库。**
  https://wmw.xjtu.edu.cn/wh/dbcg1/2.htm
- 任何未明确授权的新闻/旅游平台照片只用于判断可见形态，不作为模型纹理或项目素材。不得下载/使用来源不明的第三方建筑 GLB、CAD/BIM 或商业贴图。
- 当前没有可公开核实的南北楼平立剖图、分段实测标高、精确侧后立面尺寸。侧后立面必须保持克制、明确标注 estimated；下沉庭院真实标高、架空/弧形人行桥仍为证据阻断项，不凭图像猜测。

## 4. 成熟方案与工具选型

### 参考案例（学结构，不复制外观）
1. **Cydez｜National University of Technology 3D Campus** — 已打开其案例文字页（不是独立验证的真实用户实机）。其流程强调两周校园资产调查、无人机/地面摄影与建筑图纸收集、Blender 建模与 LOD、Three.js 集成、低端手机测试。其“30+ FPS”属于供应商自述，不作为本项目性能证据。
   https://cydeztechnologies.com/work/campus-3d-virtual-tour/
2. **IBA Virtual Campus（2026）** — 已打开工程案例文字页；采用 OSM footprint + 版本化 world config，并把 build、全量测试、3D render/movement probe、mobile touch smoke 设为发布前检查；其 AI 独立审查与人工决定发布的机制值得借鉴。不是本项目的视觉模板。
   https://maazsiddiqui.com/case-study/virtual-campus
3. **College Campus 3D Visualization** — 已打开 GitHub README 与 Vercel 页面；Blender 烘焙纹理 + Three.js、raycast 和漫游的基础链路可参考，但项目成熟度/视觉质量不足以作为本项目审美标杆。
   https://github.com/abmah/College-Campus-3D-Visualization
   https://college-campus-3-d-visualization-nfjy6zcsx-abmah.vercel.app/
4. **York University 3D Interactive Campus Model** — 找到其机构案例摘要：BIM 可用处采用 BIM，其他建筑由 SketchUp/Blender 补充，再导入 3D 场景。StoryMap 页面无可读正文，标记为 `REFERENCE_FOUND_NOT_INSPECTED`，只借鉴混合来源策略，不声称已操作作品。
   https://storymaps.arcgis.com/stories/b694f3ae65b346e79437cc542fa7159d
5. **NUS Campus3D / NPU 3DGS Campus Reconstruction** — NUS 的研究数据来自 UAV 摄影，覆盖约 1.58 km²、约 10 亿点并做了层级标注；其许可为 CC BY-NC-SA 4.0，不作为本项目资产。NPU 长安校区的 3DGS 项目明确采用 LiDAR、全景相机与 UAV 影像融合。两者说明高质量点云/3DGS 依赖大规模、多视角、多传感器采集；当前图书馆只有少量二维参考，不满足这个前提，因此本轮不选 3DGS/photogrammetry。
   https://3d.nus.app/
   https://github.com/kaoukaoua/3DGS-Campus-Reconstruction
6. **Khronos Asset Creation Guidelines 2.0** — 已阅读官方说明：坐标/单位/原点一致性、GPU 友好几何、实例化、MeshOpt/Draco、UV/texel density、PBR、透明度和 Web 传输优化。
   https://www.khronos.org/blog/introducing-asset-creation-guidelines-2.0-siggraph-2025
7. **Three.js GLTFLoader** — 采用 glTF/GLB 作为运行时传输格式；只有在文件确实使用 Draco、MeshOpt 或 KTX2 时才接对应 decoder。首版先测未压缩 GLB，不为“压缩”本身增加依赖/解码器。官方文档明确列出扩展支持及 decoder 注册方式。
   https://github.com/mrdoob/three.js/blob/dev/docs/pages/GLTFLoader.html.md

### 方案比较
| 方案 | 优点 | 主要问题 | 结论 |
|---|---|---|---|
| A. 继续纯 Three.js 程序化重写 | 集成直接、无需 GLB loader | 继续把建筑细节写成代码，编辑性和造型迭代有限；容易重复窗格 | 不选作主路线；保留 R12 fallback |
| **B. Blender 主场景 + GLB 运行时资产 + R12 fallback** | 可视化建模、可追溯源文件、能独立加载；Three.js 只负责场景、LOD、拾取与交互 | 需要严谨的坐标/材质/LOD/异步加载验收 | **推荐** |
| C. 现有照片直接做 photogrammetry / 3DGS | 单视角质感可能很强 | 缺少授权的多视角标定影像、尺度和相机参数；3DGS 不等于可拾取/可碰撞的干净网格，无法可靠补齐遮挡面 | 当前不选；有授权航测/扫描数据再评估 |

## 5. 推荐的 R16 资产架构

- Blender 5.2.1 保存完整可编辑源场景：`assets/models/library-r16/library-r16.blend`。
- GLB 运行时资产：`public/models/library-r16/library-r16.glb`；只把可公开部署的自建模型和授权材质打包进去。
- Manifest：`public/models/library-r16/library-r16-manifest.json`，记录 OSM ID、WGS84/world anchor、局部原点、单位/轴向、bbox、分区、来源 URL/作者/许可、照片拍摄日期、估算项、近中远 LOD triangles、材质/纹理数、文件字节数、fallback ID。
- 资产分区命名：`north-reading-block`、`north-book-stack`、`south-wing-I`、`south-tower-II`、`south-wing-III`、`connecting-corridors`、`roof-garden`、`clock`。未有证据的立面保持低细节，不凭空生成内部空间。
- Three.js 新建轻量 loader/wrapper：同步返回一个稳定的 Group，先显示 R12 程序化 fallback；GLB 成功加载后再原子替换，并给所有可拾取 Mesh 写入原建筑 `place`、`buildingIndex` 和 `libraryOwner`。失败则保留 fallback，不影响地图初始化。
- 保留 `setColorMode`、`updateDetailLOD`、`dispose` 接口；相机远近只切换资产内部 LOD，不改变全局 DPR、树木、道路、光照和其他建筑。
- 先用单一 GLB 和内嵌/共享纹理。只有实测文件体积或首屏时间不达标，才考虑 MeshOpt/Draco/KTX2；decoder 必须同源部署，不引用临时 CDN。
- 近景细节优先通过 UV/normal/AO/roughness 贴图和共享材质表达；重复窗格、格栅和栏杆优先共享/实例化，避免每个窗都独立 Mesh。

## 6. 三项施工与验收顺序

### 大幅提升 1｜完整 Blender 建筑资产
- 以 OSM footprint 为平面锚点，按北楼/书库/南楼 I–III 段分层建模；主轮廓优先，立面细节只落在有照片/文字支持的位置。
- 先完成一幕代表性近景（正面+斜视）作为真实视觉原型，在 1440px 和 390px 浏览器观察后再扩完整个资产。
- 保留现有 R12 fallback，资产能独立 inspect、mesh_stats、render_validation、export_glb。
- 验收：GLB 可加载；轴向/单位/原点/bbox 正确；无 NaN/退化面/明显 z-fighting；所有主要 Mesh 有稳定名称；原 OSM footprint、source JSON 和拾取索引不变。

### 小幅提升 2｜PBR 与识别性细节
- 建立共享角色：浅色石材面板、蓝灰不透明玻璃、深色金属框、屋顶绿化；用轻微粗糙度/法线/环境反射表达材料，不使用高成本 transmission glass。
- 钟面做清晰但克制的指针/刻度；标识使用普通可读字形，不复制未知授权的书法字样/摄影像素；屋顶设备按航拍可见位置做简化。
- 验收：近景能辨材料差异；中远景不出现重复噪声；没有为了“细节数量”增加无意义 Mesh。

### 大幅提升 3｜Three.js 集成、LOD 与性能
- 加载失败自动回退 R12；成功后替换并清理 fallback；点击、hover、搜索、颜色模式、场景漫游均保持原有语义。
- 近/中/远 LOD 采用可见性迟滞，避免镜头移动时 pop；只加载同源资产，不改变项目的 `base:'./'`。
- 以当前 R12 图书馆 **23,239 triangles / 7 meshes** 为首要预算基线；新模型目标是不增加图书馆近景的渲染批次，优先以 PBR 贴图提高细节密度。远景不得劣于当前 10,479 triangles；GLB/纹理超出预算时必须给出传输/显存实测与取舍。
- 整体校园场景目前在 390px library-north 视角为 252 draw calls / 531,913 triangles；R16 至少不得比同机位 R15 更差。插件的 150 calls / 300k triangles 是起始预算，不把它伪装成已达到的指标；如仍超限，记录为全场景性能债务。
- 验收：单体几何/材质/纹理统计、完整 `npm run verify`、production build、1440/390 固定视角 A/B、脚本/HTTP 错误、触控/拾取/LOD/回退。真实 iPhone Safari 不可用时标明未验，不用 Edge 模拟替代。

## 7. 明确不做
- 不重写校园主渲染器，不替换 Three.js，不引入 Cesium/3D Tiles/3DGS 新技术栈。
- 不导入未经授权的第三方模型/贴图；不将 2019 官方摄影或新闻图片当作纹理。
- 不猜下沉庭院标高、弧形架空桥、背面细部、室内空间；未知部分保留简化。
- 不为“更精致”无差别增加三角形、材质、透明层、树木或光效。
- 不修改 Codex 原工作树和 R15 Pages 已发布目录；R16 不自动部署。

## 8. 批准项

请确认是否按 **方案 B：Blender 完整源场景 + GLB + R12 fallback**，并按“大幅提升 → 小幅提升 → 大幅提升”的三项顺序开工。确认后再编写 `docs/superpowers/plans/2026-10-30-r16-qian-library-asset.md`，随后按 TDD 逐项施工。
