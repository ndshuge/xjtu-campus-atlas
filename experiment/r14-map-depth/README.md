# R14 地图与 3D 深度隔离实验

这是独立技术实验，不是校园模型，也未接入正式网站。背景灰色建筑轮廓来自仓库已有的 OSM 数据（© OpenStreetMap contributors，ODbL 1.0，源数据时间 2026-10-24T16:27:10Z）；蓝墙与红球为**合成测试几何**，不代表校园实际建筑。没有使用高德密钥或商业瓦片。

## 复现

在本目录以 Node.js 24 安装依赖：`npm ci`，然后运行 `npm run dev`。访问 `http://127.0.0.1:18972/`，可切换共享深度与双画布并旋转地图。锁定版本：MapLibre GL JS 6.16.0、Three.js 0.186.1、Vite 8.3.5。MapLibre 和 Three.js 为 BSD-3-Clause 与 MIT 许可，详见依赖包的许可文件。

另开终端运行 `node qa.mjs`，使用 Windows Edge CDP 自动截图；然后执行 `python verify_pixels.py`（需 Pillow）。脚本使用 1440×900、390×844、DPR 1、bearing 0°/180°，检查球心投影处颜色、WebGL 版本、绘制和错误。可设 `R14_DEPTH_URL` 以检查同路径的本地生产预览；脚本不改正式应用。

## 方法和结果

中心位置为 WGS84 108.9792, 34.24625；俯仰 57°。地图原生蓝墙是 fill-extrusion，Three 绘制独立红球。bearing 0° 时墙在前；bearing 180° 时球在前。地图和 Three 均为 WebGL2。在共享模式，Three renderer 复用 MapLibre 的 canvas/context，`renderingMode: '3d'` 且 `autoClear = false`；双画布模式使用独立 WebGL2 透明层。

2026-10-29 运行 Edge 155.0.4283.62，ANGLE Intel(R) Graphics 0x00007D67：桌面和模拟手机视口的 8 张截图均通过像素断言，且无记录的运行时异常。共享模式正反两面球心分别为蓝墙和红球；双画布在正面错误显示红球，明确展示没有共享深度的限制。截图与环境数据在 `docs/quality-v2/r14-map-depth/`；本地生产构建的同样 8 项通过，证据在 `docs/quality-v2/r14-map-depth-build/`。

构建产物：JS 1,583.96 kB、gzip 418.81 kB，worker 519.37 kB（未压缩），CSS 71.66 kB、gzip 10.36 kB；尺寸为本独立原型包含 MapLibre + Three 的整体大小，不能直接当成迁移后的增量。两组每次 90 帧、三轮的 requestAnimationFrame 间隔数据见 `results.json`；负载与运行时抖动明显，**不能据此宣称任一方案性能更好**，也不代表完整校园 GPU 时间、显存或真实手机帧率。

初版实验中 MapLibre worker 未加载，按照官方 v6 迁移说明显式设置 worker URL；自定义层需使用 `args.defaultProjectionData.mainMatrix`，误用另一矩阵会导致球落在屏幕外。两项修正均已在开发服务器和生产构建中验证。

## 判断与边界

| 路线 | 已验证 | 尚未验证及代价 |
| --- | --- | --- |
| 高德 JS API 2 + 双画布 | R13 先前实机实验中底图、楼块、卫星和相机同步能运行；实测 GLCustomLayer 给出 WebGL1 | 双画布无共享深度；官方文档描述可获得 GL context，但未在该文档中承诺 WebGL2；不能将本次 MapLibre 结果套用到高德。商业数据及中国坐标转换要按许可和提供方 API 处理。 |
| MapLibre 6 + Three r186 | 本实验在单个 WebGL2 context 中，对一个前后换位遮挡情形正确；完全不依赖商业底图 | 校园全量几何、建筑选择/标签、瓦片来源许可、移动性能、上下文恢复、透明混合和真实设备均未验收；中国卫星数据授权与坐标处理需另行解决。 |
| CesiumJS + Three | 资料支持各自渲染和相机同步 | 本轮没有实现或测试 Cesium 融合，共享深度不能从双画布教程推断；工程迁移成本和移动性能仍未知。 |
| 独立三维校园 + 二维地图 | 保留现有项目与交互，无须解决跨画布深度 | 需要明确不同模式的坐标、选择、状态同步和地图数据许可。 |

建议保留现有生产 Three.js 校园，继续以 MapLibre 单画布做更大规模的独立验证；高德保持独立导航模式研究。不得因此把实验表述为已经完成地图引擎迁移，也不能将 Edge 390px 模拟称为真实 iPhone Safari 验收。背景切换、长时间稳定性、触控、真实场景深度和性能还需专门测试。

参考：

- [MapLibre 自定义图层与共享深度](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/)
- [MapLibre v5→v6 worker 迁移说明](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/)
- [MapLibre 3D 模型与投影矩阵示例](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-3d-model-with-babylonjs/)
- [高德 GLCustomLayer 官方文档](https://lbs.amap.com/api/maps-javascript-api/reference/custom-layer/glcustomlayer)
- [Cesium 与 Three.js 官方整合示例](https://cesium.com/blog/2017/10/23/integrating-cesium-with-threejs/)
- [OpenStreetMap 版权与许可](https://www.openstreetmap.org/copyright)
