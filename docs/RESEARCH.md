# 校园 3D 参考项目源码核查

核查日期：2026-10-25。使用 GitHub 插件读取仓库元数据、完整文件树及下列实际源码；另外直接请求三个在线 Demo。没有复制或发布这些项目的模型、纹理、数据或代码。本文件是技术研究记录。

## 结论

西交校园适合 **WGS84 地理数据 → 校园中心米制坐标 → Three.js 静态网页**。OSM 建筑轮廓、道路、绿地应当是地理底图；缺失楼高采用可追踪的估算，地标另建细节模型。重点借鉴 CUHK 的数据与渲染分层、建筑批处理、标签与选中交互。无需为了平坦且约公里尺度的校园强行引入 Cesium 的全球地球、在线地形与授权凭据依赖；也不宜以一整个数十 MB OBJ 作为主要内容管线。

三个仓库均有可读源码，但不能仅凭标题认定为成熟、经过独立验证的产品。以下性能数值、真实性说明若来自 README，均为作者报告，不是本次实际基准测试结果。

## 1. PeterZh6/cuhk-campus-3d

- 仓库：[主页](https://github.com/PeterZh6/cuhk-campus-3d)。本次默认分支 main，树/提交 SHA `591c55f199f1643171f5712221e3d2b2b6e2e896`。
- Demo：[CUHK Campus 3D](https://peterzh6.github.io/cuhk-campus-3d/)。直接 HTTP 请求返回 200，页面标题为 CUHK Campus 3D — 香港中文大學三維地圖；浏览器自动化导航/绑定超时，尚未独立确认这个远程 Demo 的实际 WebGL 画面或帧率。
- [README](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/README.md)：作者报告 1,917 个真实轮廓、5 m 香港地形、地形感知 A*、公交、昼夜、天气、环境音、运行时数据约 5.5 MB。香港 LandsD 楼高和地形属于香港专用数据，不能当作西安的数据来源。
- [package.json](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/package.json)：Three.js `^0.170.0`、TypeScript、Vite、Vitest、Playwright；生产输出为静态 `dist`。

### 实际读到的关键实现

| 源码 | 观察 | 对西交的启发 |
| --- | --- | --- |
| [src/lib/geo.ts](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/src/lib/geo.ts) | 校园中心的等距矩形近似，X 东、平面 Y 北，渲染映射为 `(x, elevation, -y)`；经纬度与本地米制坐标双向变换 | 不手摆整个校园。所有地理图层采用同一原点、投影和单位，保留可反查经纬度 |
| [pipeline/fetch-osm.ts](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/pipeline/fetch-osm.ts) | 一个 bbox 查询建筑 way/relation、building:part、道路及 POI；`out geom`；缓存、多个 Overpass 端点、基本结果校验 | 构建时抓取且缓存；浏览器不依赖实时 Overpass |
| [pipeline/build-all.ts](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/pipeline/build-all.ts) | 第 154–166 行按 `height`、`building:levels`、建筑类型默认值回退；后续匹配香港测绘楼顶标高；数据层输出为多个 JSON，另生成 attribution | 西安必须单独记录 heightSource，例如 OSM height / levels-derived / inferred；不能把默认楼高标为测量事实 |
| [src/scene/buildings.ts](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/src/scene/buildings.ts) | `ExtrudeGeometry` 支持孔洞；第 101 行设置建筑 `bindex` 顶点属性，第 110 行合并为一个 mesh；第 123 行起注入窗格、层间线、夜光 shader；第 208 行起用命中顶点映射回建筑 | 建筑轮廓批处理仍可拾取；程序化窗格是合理视觉补全，但须说清不是实拍立面 |
| [src/ui/labels.ts](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/src/ui/labels.ts) | 有名称的建筑与 POI 提前建索引；每约 20 帧重新选标，逐帧投影；优先级、距离裁剪、屏幕去重、保留上次标签降低闪烁 | 标签池与防重叠比给每栋楼常驻一个 DOM 标签稳健 |
| [src/main.ts](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/src/main.ts) | 高画质使用 GTAO；第 202 行起统一质量档位；第 386–394 行用 pointerdown/up 距离过滤拖拽再 raycast | 阴影/AO/DPR可调；拖拽旋转不能误触建筑选择 |
| [tests/unit/realdata.test.ts](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/tests/unit/realdata.test.ts) | 真实数据中的地标、坡度、命名数量和高程做合理性检查 | 西交应验证图书馆、主楼、校门、体育场与道路关系，不能只检查页面是否存在 |

### 许可

[LICENSE](https://github.com/PeterZh6/cuhk-campus-3d/blob/main/LICENSE) 明确给代码 MIT；明确排除 `public/data`，其数据遵循各自原始来源条款。若复用实质代码须保留 MIT 版权与许可。可参考架构，不应把 CUHK 的校园数据、政府数据或命名当作西交内容。README 中的基准和测试数量本次未运行验证。

## 2. saarzhanova/Campus3DMap

- 仓库：[主页](https://github.com/saarzhanova/Campus3DMap)。默认 main，SHA `efcbb817c16a98e7a95206f05b33a1acd838799f`。
- Demo：[Campus3DMap](https://saarzhanova.github.io/Campus3DMap/)。HTTP 200，HTML 标题 Campus Map；未独立看到远程渲染画面。
- [README](https://github.com/saarzhanova/Campus3DMap/blob/main/README.md)：使用 OSM2World 将 OSM 转换成 OBJ；OSMnx 为探索性数据提取与路线分析。
- [main.js](https://github.com/saarzhanova/Campus3DMap/blob/main/main.js)：Three.js `OBJLoader` 载入 `assets/models/CampusMap.obj`，每个 mesh 添加 `EdgesGeometry`，使用 OrbitControls、Raycaster、名称字符串及硬编码四个院校信息卡；鼠标左键平移、右键旋转。
- 完整文件树显示主 OBJ **67,798,918 字节**，OSM 原始文件 **12,587,235 字节**；还提交了 `node_modules` 与 `dist`。README 自认大 OBJ 导致加载慢，元数据硬编码是后续待改进项。

可借鉴的是 OSM2World/Blender 对 GIS 数据的几何转换和对象名称对应建筑信息的思路。主要场景不采用它的巨型 OBJ、每物体边线叠加或硬编码名称匹配；纯轮廓挤出可在小 JSON 上直接生成，更容易维持数据来源与建筑 ID。

### 许可

仓库元数据 `license: null`，完整树除第三方依赖外没有项目 LICENSE。公开可读不等于获得代码、OBJ 或纹理再发布许可。本次只研究，**不复制该项目代码或资产**；OSM 数据应自行按 ODbL 合法取得并归属标注。

## 3. abmah/College-Campus-3D-Visualization

- 仓库：[主页](https://github.com/abmah/College-Campus-3D-Visualization)。默认 master，SHA `3adee44488e8629a74c392a6124a30846f5e9b4d`。
- 作者配置的 Demo：[College Campus 3D Visualization](https://college-campus-3-d-visualization-nfjy6zcsx-abmah.vercel.app/)。HTTP 200，返回 webpack bundle 页面；未独立看到远程渲染画面。
- [readme.md](https://github.com/abmah/College-Campus-3D-Visualization/blob/master/readme.md)：Blender 建模、烘焙纹理、Three.js、Chart.js、GSAP、第一人称漫游。
- [package.json](https://github.com/abmah/College-Campus-3D-Visualization/blob/master/package.json)：Three.js `^0.134.0`，webpack；还有 cannon-es、socket.io-client、Chart.js、lil-gui 等，不宜整套沿用到纯静态校园浏览。
- [src/script.js](https://github.com/abmah/College-Campus-3D-Visualization/blob/master/src/script.js)：第 352–357 行 DRACO 与 GLTFLoader；第 426–450 行按 Blender 对象名加载烘焙贴图并应用 `MeshBasicMaterial`，载入约 **4.27 MB** 的 baked2.glb；第 581 行起硬编码 3D 标注点；第 987–1010 行 OrbitControls 与 PointerLockControls 切换；第 1120 行附近 raycast 遮挡检测标签。
- 树显示有多张大烘焙 JPG，单张约 1.35–10.17 MB。代码中的一些统计图数值直接写在 JS 常量中，不能当作真实实时数据。行 1095/1096 的移动量不乘 deltaTime，存在速度依赖帧率的实现问题；不应照搬。
- `Ground_updated.jpg`（代码）和 `Ground_Updated.jpg`（仓库）大小写不一致，这类路径在大小写敏感静态托管上必须单独检查。

可借鉴：对图书馆、主楼、校门等少量高辨识度地标使用 Blender/GLB，按需加载、合并材质、压缩纹理；在全景 Orbit 与地面漫游之间切换；标签应有遮挡策略。不能用艺术烘焙模型替代校园地理位置数据，也没有必要带入聊天后端与统计仪表。

### 许可

README 声称 MIT 并指向 LICENSE；但完整仓库树没有 LICENSE，仓库 API `license: null`，`package.json` 第 3 行为 `UNLICENSED`。存在明确冲突，**不复制其代码、GLB 或烘焙贴图**。概念与通用技术可独立实现。

## 本次实证范围

- 已读真实源文件、完整文件树、许可文本和依赖配置；项目路线上述判断有源码依据。
- 三个部署首页均直接 HTTP 200，不代表 WebGL 加载成功、交互流畅或所有资产均成功。
- 浏览器工具尝试 CUHK 导航与绑定均超时；未虚构截图、帧率、远程控制台或手机验收结论。
- 西交最终作品仍须进行自身的 GPU 浏览器验收、数据审计、地理地标检查、移动屏幕检查和部署回归，不能继承上述项目的作者自述测试结果。
