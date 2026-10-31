# R17｜钱学森图书馆北侧长条屋顶分隔缝（2026-11-01）

## 源证据与限制

- 许可照片：`public/assets/reference/library-aerial-2025.jpg`，Liuxingy，2025-07-25，Wikimedia Commons，CC BY-SA 4.0，署名及授权详见 `public/assets/reference/README.md`。图上长条北侧阅读楼主屋面可见两道深色纵向分隔线，将长屋顶划分为三段。
- 屋顶边界来自 `public/data/campus.json` 的 OSM 轮廓。两线沿 x=-47m、x=-14m，z=-217..-199m 的几何位置、约0.68m宽度均为**照片视觉估算，非实测**。原 2025 照片年代与今日可能不同。
- 未改动 OSM 坐标、屋顶整体高差、屋顶的灰色主体材料、绿色屋顶、中央书库、碰撞、楼层高度和搜索拾取。只是主屋面上已有材质批次的少量几何。

## 实际施工

- `src/library-asset.js`：为 north-reading-block 增加两道沿原屋顶微坡高度缓慢变化的矩形深色分隔缝，不新建材质、Mesh、贴图和 collider；用户数据标记出处与估计状态，灰模阶段无该细节。
- 最初试用原屋面 `reveal` 灰色材质，Node 几何测试通过，但真实 1440/390 前后截图几乎无变化：**该候选被拒绝**。随后复用已有深色 `glass` 合批材质，形成两道可辨识线条，略带蓝灰色，尚非独立艺术签收；保留相机 A/B 和早期候选于临时 QA 目录，不将其算作通过交付。
- `tests/library-north-roof-photo-seams.test.mjs`：RED (无数据与几何)→GREEN，检验两道 seam OSM 边界内、实际从屋面上方可射线命中并高于原屋面、材质批次和灰模。与既有图书馆屋顶测试 4/4 通过。
- `package.json`：追加到全量 `npm run verify`。

## 真实 A/B 与性能

同一最新线上基线源码 `26fe136`，隔离相对静态路径，Edge WebGL DPR1，`?inspection=library-plan`：

| 项目 | Before 1440 | After 1440 | Before 390 | After 390 |
|---|---:|---:|---:|---:|
| Draw calls | 274 | 274 | 196 | 196 |
| Triangles | 570014 | 570062 | 494172 | 494220 |
| JS/HTTP errors | 0 | 0 | 0 | 0 |

- 1440/390 PNG：深色分段清楚可见；中央书库、绿色屋顶和整体 U 型体量无明显回归。三角形各增 48（两线合计）；无新增 Draw call。
- 隔离 `npm run verify` exit 0，R17 Node tests **33/33**，生产 Vite build exit 0。保留已知 JS chunk >750KB 警告。
- 390 触控平移、双指缩放、漫游、pointercancel 与返回 PASS；1440 搜索选中钱学森图书馆、旋转、缩放与树层切换 PASS，均 0 JS/HTTP 错误。
- 原始证据：`docs/quality-v2/r17-library-roof-seams-20261101/{before,after,interaction-390,interaction-1440}`，每组原始 PNG/JSON。Edge 模拟宽度不是 iPhone Safari 真机验收。
- **本次构建仅本机开发并提交，不重新发布 Pages**。已上线 R17 是 `26fe136`；该细节等下次明确授权再汇总发布。

## 下一轮照片先行优先级

1. 以另一视角/更高分辨率可信航拍校对北阅读楼真实屋顶分隔缝颜色、宽度、端点；当前深蓝灰受共享材质限制，不能声称完全吻合。
2. 田径场周边教学楼逐栋绑定有许可实景照片，针对可见屋顶造型及窗口尺寸做真实差异修改。
3. 对 390px 近/远景整体 494k~520k triangles 进行 owner/Lod 归因，先证明森林、建筑及其他渲染批次贡献，再选择不破坏景观的优化。
