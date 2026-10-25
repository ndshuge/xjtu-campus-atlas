# 西交 · 兴庆校园 3D 图志

基于 OpenStreetMap 真实轮廓的西安交通大学兴庆校区浏览器 3D 校园。独立可视化作品，非学校官方地图。建模范围为兴庆主校区及 OSM 校区关系内的东南教学二区。

## 运行

免安装公开体验：[打开校园 3D](https://ndshuge.github.io/xjtu-campus-atlas/)。完整源码：[GitHub 仓库](https://github.com/ndshuge/xjtu-campus-atlas)。

已有构建可直接用目录中的 `启动校园.cmd` 打开；需要 Node.js（开发时为 24.19.0），运行时无须 npm 安装。

从源码开发：

```powershell
npm install
npm run dev
```

生产构建与本机预览：

```powershell
npm run verify
npm run build
npm run preview
```

默认地址 http://127.0.0.1:18865/。`dist/` 可以部署到任意支持静态文件的 HTTPS 托管服务，例如 Sites、GitHub Pages、Cloudflare Pages。Vite 的 base 为相对路径，支持子目录托管；浏览器不依赖在线地图服务、外部 CDN、API 密钥或后端数据库。需要 WebGL 2。

## 交互

- 左键/单指旋转，滚轮/双指缩放，右键/双指平移。可搜索建筑与地点，或直接点击建筑、名称、场地。
- 全景、俯视、自动环绕、晴日/暮色/夜景、质量档位、绿荫与标签开关。
- 建筑详情列出 OSM 原始链接、估高/文献高度来源和已知建设变动。
- 中轴导览依次浏览北门、中一楼、腾飞塔、图书馆、四大发明广场、主楼；可以暂停、跳站或拖动结束。
- 地面漫游使用 WASD/方向键，Shift 加速，拖动环顾，Esc 退出。手机提供方向键；建筑和水面有简化碰撞。落点选在目标建筑南侧附近的可行道路。
- 小地图可点击定位。桌面右上角相机按钮导出当前实际 3D 画面，附来源声明。

## 地理数据与精度

`data/source-osm.json` 是 2026-10-25（北京时间）获取的完整研究查询缓存，OSM 基准时间记录在 JSON 中。`public/data/osm-source.json` 是随网页提供的相关源记录子集；`public/data/campus.json` 为派生校园数据库。

当前含 139 个建筑基底、114 个有名建筑、115 个景观/场地面、384 段道路表示。建筑完整度口径是“中心在 OSM 校区多边形内的已绘制建筑”，不是现场所有建筑。社区尚未绘制或建设变动中的建筑可能缺失。

地理坐标从 WGS84 投影为校园中心局部米制坐标（X 向东、Z 向南），用 WGS84 椭球在中心纬度的经纬尺度，地形采用平面近似。不是测绘成果、倾斜摄影、BIM 或室内地图。

- OSM 只有 12 栋含层数、0 栋含高度。层数以 3.5 m/层估高，无层数按类别估高，重点地标有示意覆盖。
- 钱学森图书馆南楼地面高度采用学校 2016 年公开报道的 **49.75 m**，按该最高体量控制阶梯模型；南北楼分段、立面仍为解释性重建。
- 主楼依据学校报道的 23 层活动空间推算主体约 80.5 m，再加 4 m 示意屋顶；总高仍为推测。
- 窗格、屋顶、树木、灯柱、球场划线、看台、北门与腾飞塔外观为程序化示意。道路中心线为 OSM 数据，缺失路宽按道路类别默认；桥梁未单独建桥面。
- 学校新图在教三楼片区标注在建，OSM 仍有旧教二楼轮廓；北部“西迁纪念馆”名称与新图有时效差异。详情已提示，不将其与南部西迁博物馆混为一处。

## 更新数据

已有缓存可独立重建：`npm run data`。如需重新获取，可运行 `node scripts/fetch-osm.mjs`，成功后再重建和验收。网络失败保留既有快照；不要在用户浏览时实时请求 Overpass。

## 技术与研究

Three.js 0.186.1 + Vite 8.3.5；建筑挤出后合并为一个可按顶点建筑 ID 拾取的 mesh，程序化窗格与夜光，约 2,100 株树木实例化，局部阴影，标签池与重叠裁剪。本地数据预处理与渲染分层。

选择此路线是因为校园只有约公里尺度，开放数据有足够的轮廓但缺少精细立面。Cesium 可用于后续多校区、地形、城市级 3D Tiles；本版不引入不必要的全球在线数据依赖。OSM2World 能导出模型，但整校大型 OBJ 的下载、元数据维护成本较高。Blender/GLB 适合未来用有授权图纸与照片升级少数地标；当前没有虚构扫描或 BIM 资产。

研究的三个仓库、实际源码、Demo 可达性与许可核查见 `docs/RESEARCH.md`。没有复制其他校园的模型、纹理或数据。

## 来源与授权

- [OpenStreetMap 校区关系 17568632](https://www.openstreetmap.org/relation/17568632)，© OpenStreetMap contributors；源数据库和派生数据库按 [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 提供。
- [学校官方校园平面图](https://vi.xjtu.edu.cn/qt/jddt.htm)、[学校图书馆介绍](https://www.xjtu.edu.cn/tsda/qxstsg.htm) 用于交叉核对；官方图、照片、校徽未打包再分发。
- [图书馆建筑高度报道](https://news.xjtu.edu.cn/info/1002/66472.htm)、[主楼 23 层报道](https://news.xjtu.edu.cn/info/1219/143933.htm)。
- 本项目代码与程序化资产 MIT；Three.js 完整 MIT 通知在 `public/THREE-LICENSE.txt`。

验收记录见 `docs/ACCEPTANCE.md`，已知数据边界与未来改进见上述精度说明。
