# R17 兴庆校区真实空间与未来玩法兼容｜调研设计书

> 状态：R17 FOUNDATION + ISOLATED GAME LAB VERIFIED / P6 FINAL ACCEPTANCE PENDING，2026-10-31。基础空间数据、六栋建筑材质证据、高德桥接、游戏模式接口与合成场景玩法实验已有本机提交与测试；真实校园地形开挖、高德生产接入及完整游戏未上线。R16 已发布预览继续作为稳定对照；未经单独授权不部署。
> 唯一实施任务清单：docs/superpowers/plans/2026-10-31-r17-campus-reality-game-ready.md。
> 本次编制基础：feature/r16-qian-library-asset-20261030 @ 094d935；工作树 E:\CHATGPT\work\xjtu-r15-unified-quality-20261030；git status 中已有其他写者的 JSON、图像、R16_ENTRY 和 .superpowers 均不属于本计划。

## 1. 产品愿景与边界

**近期目标：** 一张定位可信、形体可辨、具有局部真实高差、可供学生漫游与查找建筑的兴庆 3D Atlas。先让钱学森图书馆的下沉前场、周边地势、重要建筑真实外立面成为可验证样板，再分区覆盖校园。
**长期可扩展目标：** 在同一校园空间上接入赛车、非对抗射击靶场/任务、探索与教学互动等玩法。地图仍是独立、完整的主产品；未来游戏是可选模式，不能反向污染地图数据、道路和公共导航。
**范围内：** 本地 Three.js/Vite/OSM 既有架构、已授权照片与学校公开参考、可核实高程锚点、局部多层空间、建筑材料证据库、高德独立地图导航模式、玩法插件接口与一段隔离原型。
**范围外：** 根据卫星影像猜测分米级地形、直接复用高德楼块/影像为自有网格、全校大型引擎迁移、未经许可的测绘/室内采集、多人实时联网、游戏内容正式上线。游戏射击方案仅规划架构，不在本轮部署或产生武器资源。

## 2. 现状：检查后确认的事实

| 领域 | 已有实现/证据 | 当前缺口 |
|---|---|---|
| 地形 | src/world.js 的 buildGround() 使用大平面，campusBase 以统一 BASE 生成；src/geo.js 的 flat(points,y) | 高程连续性与道路坡道未映射；建筑底座及漫游按固定地平面处理 |
| 广场 | src/plaza-terrain.js 以平面铺装为主 | 真实台阶、坡道与局部不同层级未建立 |
| 图书馆圆形前场 | src/library-forecourt.js 已实现环形石材、栏杆、表观内墙、深色圆盘 | 源码明确声明“non-excavated”；没有真正挖空、地下层/通路/高度碰撞 |
| 建筑 | src/library-asset.js、science-hall-asset.js、main-complex-asset.js、east-historic-asset.js 等已有特色资产 | src/world.js buildingMat() 与普通建筑生成仍带通用颜色/随机窗口，逐栋真实性不足 |
| 交互 | 已有 orbit、walk、拾取、搜索、LOD 与手机回退 | 需要一套多层地面/跨楼层交互规则；不能仅靠 sampleHeight(x,z) 处理架空桥和地下空间 |
| 性能 | R16 线上南立面 1440: 361 calls/848,837 triangles；390: 221 calls/557,770 triangles，已有完整浏览器 QA | 高于初始手机 150 calls/300k triangles 参考预算；需量化新增地形与游戏实体的成本 |
| 高德 | E:\CHATGPT\work\xjtu-r13-amap-spike\experiment，2026-10-27 真实 Edge 1440/390；WGS84→GCJ-02 批量、卫星/POI/模型叠加已验证 | 同 GL context 在当时环境里受 WebGL1 vs Three r186 WebGL2 限制；双 Canvas 缺失共享深度且生产密钥治理未完成 |
| 游戏 | 目前不是物理游戏引擎，暂无通用赛车/射击玩法插件 | 物理碰撞导出、轨迹/分层导航、生命周期和模式输入隔离未建立 |

以上数值都是历史实测，不代表未来 FPS 或真机结果。R16 Pages 原预览由 commit d3c4618 发布；后续 docs 变更不能自动触发重新上线。

## 3. 三种技术路线与选择

A. **保留 Three.js + 局部真实地形 + 可插拔玩法（推荐）**：最少破坏现有 OSM、拾取、标签和 Pages；通过空间数据层同时供地图/游戏使用。代价是要自己定义空间 API/碰撞生成与测试。
B. **直接把 Three.js 渲染塞入高德 3D 容器**：地图内容多，但旧实验已证实相同环境下共享 WebGL 失败；两 Canvas 遮挡不准确。除非明确新的渲染兼容证据且服务合规，否则 NO-GO。
C. **直接迁至 Godot/Unity 等大型游戏引擎**：未来赛车/射击便利，但当前浏览器地图、移动端兼容、数据与交互迁移风险过大。只在独立玩法切片证明必需时重评。

建议 A；高德为并列导航界面，不参与 Three.js 世界几何与游戏碰撞。当前仅确认技术方向，具体地形施工深度须以可信证据为准。

## 4. 数据与几何：二维足迹、地面高程、立体层级分离

核心坐标：维持现有 OSM WGS84 原始足迹和本地 x/z 投影，不改注册建筑 ID；Three.js Y 向上，所有新高差为相对项目基准的米，并记录来源、日期、datum、精度等级。不把 DEM 格点高度、地图楼块高度或照片透视估算写成实测。

**三个独立对象：**
1. GroundSurface：普通地表连续坡面，支持 heightAt(x,z) 和 normalAt(x,z)，带有限有效域与 provenance；未知值返回 unknown，不强行填 0。
2. LevelSurface：多层空间，如地下前场、架空连廊、台阶平台。同一个 x/z 可以有多个 y；以 levelId、mesh、walkable、clearance 和入口连接表达，不能强制压成单值 heightmap。
3. PassageGraph：可通行拓扑，节点含 position3D、levelId、通行类型、坡度范围、车辆/步行权限及可信度；无照片/图纸证据的地下通路默认不可达。

**证据优先序：**（1）有权使用的平/立/剖面与现场测量；（2）可信地面多视角与尺寸标定；（3）官方描述和许可照片推断结构存在；（4）公开粗 DEM 只辅助整体趋势。Copernicus GLO-30 为约 30m 分辨率，不能据此恢复校园台阶/圆形下沉庭院。OSM ele 标签也不是连续高程网格。无校准数据时仅开发可开关的示意局部模型，不标“真实深度”。

**钱学森图书馆首个验证场景：** 圆形平台保留 OSM 位置，但将浅色外环、可见挡墙、底层地面、可确认的入口/台阶分层建模；修复地表遮挡重叠，区域内只在拥有完整有效边界时裁剪已有 ground 网格，不能用“表面贴黑圈”代替真实空洞。人从上层到下层必须沿已证实的出口/楼梯/坡道转场；未知通道禁用。碰撞与视觉独立，不将装饰圆环当碰撞实体。将数据精度与不可达区域提示给用户。

## 5. 逐栋建筑真实感：证据驱动材料清单

按 osmId 建建筑档案：name、referenceSet、facadeSides、roofForm、materialFamily、wallAlbedo(估计)、glassTint、roughnessRange、trim、lightingNotes、confidence、lastVerified、license。未知材质保留中性外观，绝不将默认类别色冒充“实景”。
材料分配采用共享 stone/brick/concrete/glass/masonry/tile 材质族和有限贴图图集；重要建筑可有特例几何，普通楼通过轻量属性表现差异。近景优先轮廓、入口、屋顶、明暗、遮阴和玻璃进深；远景避免增加独立 draw call。对每栋至少一张同方向照片和 1440/390 同机位 A/B。第一批：钱学森图书馆、主楼、逸夫科学馆、思源活动中心、西一楼、迁建纪念馆。建立“照片确认 / 较可信估计 / 未知”字段，不追求假精确十六进制颜色。

## 6. 高德双模式：导航辅助，不把商业图层变成游戏资产

三维模式：Three.js 本地图层 + 自有建筑几何 + 自有 Ground/LevelSurface/PassageGraph。
地图模式：高德 JS API 2.0 官方地图、查询/导航及卫星模式（在实际授权支持范围内）。跨模式只交换自有或合法获取的建筑 OSM ID、经纬度和摄像机意图；通过有文档依据的 WGS84 → GCJ-02 转换对齐显示。禁止以高德底图下载、截图/抓取、导出建筑网格、缓存贴图等方式给 Three.js 赛车/射击环境供材。
发布前单独审核服务条款、地图审图标注、密钥代理（客户端仅保留必须公开的 app key，Security JS Code 仅服务端）；Pages 静态空间不等于生产安全代理。地图未接通、配额耗尽或隐私授权被拒时，原有 Three.js/OSM 仍然完整可用。旧双 Canvas 不做生产默认。

## 7. 游戏可扩展性：世界事实与玩法状态分开

**最小架构层级（不立即写全量引擎）：**
- WorldData：原 OSM 与可信三维坐标/多层地面/建筑证据，纯数据，地图与游戏都只读。
- WorldRenderAdapter：现有 Three.js 渲染、LOD、光照与照片证据；根据 mode 装卸可见实体。保留地图相机、拾取、标签原行为。
- WorldCollisionAdapter：由共享空间数据生成独立静态 collider/proxy、walkable 地面/墙/台阶/路缘；提供场景版本和碰撞层。装饰与物理分离。
- WorldNavigation：步行导航与可驾驶区域分离；路线必须标高程、坡度、地面宽度、最大间隙/净空、等级、是否经验证；公开导航仍安全可用。
- ModeHost（唯一 mode owner）：切换 explore / raceSandbox / targetPractice；负责 camera/input/physics tick/session entities/lifecycle，确保进入退出全程释放订阅、重置临时实体，并保持 OSM building identity 和地图视图。
- Game plugins：赛车与目标练习两个可选独立模块，不可直接改 WorldData/原始地形和地图 UI；支持固定步长模拟、seed、暂停/复位、设备输入映射、最高输入频率和快速降级。

**建议未来契约（仅规划，不代表代码已存在）：**
  loadWorldSnapshot(version) -> {terrainZones,levelSurfaces,passages,colliderRefs,roadClass,sourceLicenses}
  heightAt(x,z,zoneId) -> {y,normal,confidence}|null
  querySurfaces(x,z) -> [{levelId,y,normal,kind,walkable,source}]
  getColliderSet(bounds,layerMask) -> collider descriptors; runtime 不能变更原始世界
  registerMode({id,requiredCapabilities,onEnter,onTick,onExit,dispose})
  enterMode(id, options) / exitMode()，通过唯一 host 控制切换
这些是接口设计草案，实际施工前需对现有代码按项目约束拆分，避免为了文档抽象而重构整个 src/world.js。

**物理方案：** 首次只做纯 JS 几何/碰撞代理契约与坡地漫游验证；当赛车或动态碰撞原型确实需要时，隔离评估 Rapier JS/WASM（KinematicCharacterController + VehicleController 的适用性按该版本实测，不能承诺现成赛车手感），避免主地图一启动就加载 WASM。Three.js 现有版本只做 render，物理使用独立固定步长（建议 1/60s，具体性能实测后调整）。车和角色使用低面数 collider；高精度 facade 只用于视觉。

**赛车原型（未来条件性）：** 只在可确认允许通行、宽度/坡度/转弯半径有证据的隔离测试路线，不把真实校内禁止机动车区域默认设为“现实可赛车”。初版为离线封闭路线计时、起终点/圈数、碰撞恢复和手机简化操控；地图现有正常步行路径不受影响。真正赛车物理、赛事、多人匹配暂缓。
**射击原型（未来条件性）：** 独立靶场/教学式目标练习，基于射线选中与命中反馈，独立命中层和移动实体；与校园日常地图行为隔离。首版只有安全靶标、计分、重试、触控瞄准；不建设真实校园对抗/联网战斗，也不把真实建筑改成破坏目标。
**模式安全：** 默认 explore；所有游戏入口需用户明确触发；游戏离开后地图选择、摄像机、搜索、路由和层级恢复原状态；键盘/手柄/触摸无冲突；WebGL/物理模块加载失败时退回 explore；不上传位置轨迹或游戏状态。

## 8. 优先级、分期、验收红线

| 期次 | 交付 | 启动门槛 | 验收 |
|---|---|---|---|
| R17-P0 | 高差/建筑证据账本与最小 API 草案 | 已有资料，无需测绘 | 追踪每条高程/材质的来源、坐标、高度置信度、许可 |
| R17-P1 | 图书馆下沉空间原型 + ground mask + 分层碰撞/路径 | 内部高差证据、场景明确边界；如缺先做受限示意且不可通行 | 无底面穿透/悬空；上下层可达性符合证据；原拾取搜索、OSM/LOD 不回退 |
| R17-P2 | 首批 6 栋真实材质档案与照片 A/B | 每栋取得可合法使用的参考 | 同视角主色、屋顶、窗与体量差异可辨，draw calls 不显著恶化 |
| R17-P3 | 高德独立双模式导航试点 | 条款、域名密钥/代理与审图要求核实 | 独立访问/切换，坐标对齐、失败回退；高德数据不持久缓存/进入游戏资产 |
| R17-P4 | 游戏就绪 WorldData/Collider/ModeHost 最小接口 | P1 地形与可达性模型稳定 | 基础单测能证明 explore ⇄ 空白游戏模式切换无泄漏、真实层级 collision 查询 |
| R17-P5 | 隔离小型赛车 + 靶场交互样板 | P4 全通过、合法位置明确、移动端预算可承受 | 计时圈/靶标循环可玩、结束恢复地图、无默认资源大规模加载 |
| R17-P6 | 性能/真实设备 QA、独立产品验收 | P1–P5 分项合格 | npm verify/build、静态嵌套路径、真实 Edge 1440/390、真机 Safari 单列；失败可回滚到 R16 |

优先级 P1（下沉空间）与 P2（逐楼材质）在视觉收益上领先；P4 的设计约束应从 P1 起执行，但不提前造大量不使用的架构。高德不应堵塞局部地形施工。

**共同红线：** 实体高差不能靠表面假阴影掩盖；漫游与地面 raycast 必须适应多层；不擅自触碰 OSM footprint、数据库和其他作者脏文件；真实许可证和审图/地图资料条件优先；游戏不得影响地图基本用法、公共预览和低端手机。仅有图片不能代替可达性与物理交互实测。

## 9. 证据来源、可复用专业 Skill 与未决项

本地证据：src/world.js、src/geo.js、src/library-forecourt.js、src/plaza-terrain.js、src/architecture-kit.js、public/assets/reference/README.md、docs/quality-v2/R16_QIAN_LIBRARY_NARROW_BAYS_20261031.md；高德旧实验 experiment/FINDINGS_LIVE_2026-10-27.md、LIVE_INTEGRATION_AUDIT_20261027.md（位于 xjtu-r13-amap-spike 工作树）。优先复用它的坐标转换/可用性结论；它的商业地图截图不提交仓库。
已读原版专业方法：threejs-aaa-graphics-builder（visual-scorecard、authoring-recipes、technical-art）、threejs-qa-release、3d-scene-architecture、game-systems-design、game-mechanics-design、threejs-materials、writing-plans。施工时按工作包补读 geometries/math/objects/debug-profiler，真实调用 Mice Hole 测试和可视化工具，而不是只列名称。
外部官方核验（2026-10-31 浏览）：https://developer.amap.com/api/javascript-api-v2/guide/abc/jscode ; https://developer.amap.com/pages/terms/ ; https://developer.amap.com/api/compliance-center/check-and-reference/compliance ; https://developer.amap.com/api/javascript-api-v2/guide/layers/customlayer ; https://rapier.rs/docs/user_guides/javascript/character_controller/ ; https://wiki.openstreetmap.org/wiki/Key:ele ; https://documentation.dataspace.copernicus.eu/Data/Others/CCM.html 。
照片：钱学森图书馆 2021 正面、2025 航拍缩略图均由 Liuxingy 拍摄，CC BY-SA 4.0，具体出处与署名规则见 public/assets/reference/README.md。学校官网照片仅作可证实的建筑特征对照，版权条件另行审核后才可复制进公开仓库或作为纹理。

**未决且不能伪造的事项：** 图书馆下沉层真实深度、楼梯/连廊通道完整结构、坡路实测高程、六栋具体外墙色样、游戏赛道允许区域、真实 iPhone 性能、上线高德 API 额度/条款的适用范围。解决路径：现场测量或授权资料 → 可信度登记 → 局部试验 → 验收再拓展。无资料时标 unknown，宁可保留 R16 地面，也不公开“真实测绘”宣称。

**执行者首轮唯一入口：** 按附属任务计划的 Task 1 核实证据及空间基准，只有锁和资料门槛成立才进入局部高差实现；不重复 R16 窗格和屋顶工作，不自动创建任何整点任务，不自动发布 Pages。
