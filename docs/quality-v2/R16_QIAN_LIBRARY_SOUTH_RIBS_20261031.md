# R16｜钱学森图书馆南立面实体竖向石材构件（2026-10-31）

**状态：本地候选已验证，未发布；非独立艺术验收。**
工作树 `E:\CHATGPT\work\xjtu-r15-unified-quality-20261030`，分支 `feature/r16-qian-library-asset-20261030`，起点 `e2af295`。承接 `R16_QIAN_LIBRARY_ENTRY_20261031.md` 的下一项：先提供可靠南立面近景机位，再验证中央立面真实几何节奏。旧 R15 Pages 保持不动。

## 证据与本次最小改动

- 对照仓库 `public/assets/reference/library-front-2021.jpg`（Liuxingy，2021-09-06，CC BY-SA 4.0；来源及许可见 `public/assets/reference/README.md`），照片中塔楼中央深色玻璃之间存在显著的浅色竖向石材构件。2025 航拍仅作为整体体量关系约束。
- 在南楼 `south-course-2/3/4` 中央玻璃带，每层添加左右两条有体积的石材竖向构件，复用原 `wall` 批次；宽 0.62m、深 0.66m、位置均为 **photo-informed / estimated**，非测绘尺寸。没有把参考照片当纹理，也没有改 OSM 足迹、建筑 ID、碰撞或全局灯光。
- 新增只在 `?inspection=library-south-detail` 生效的固定南立面近景机位（桌面/手机不同 FOV 和距离），正常游客的默认镜头不变。截图标注 illustrative reconstruction, not surveyed。
- 单体近景 **23,325 → 23,397 triangles（+72，约 0.31%）**，远景 **10,565 → 10,637（+72）**；**7 meshes 不变**，远景仍减少 **54.54%**。无新材质、贴图、依赖、透明层或 draw-call 批次。R12 fallback/LOD 保留。旧 R11 验证 JSON 的 `sharedWorldUnchanged=false` 是因为新增了仅 QA URL 生效的相机分支；`otherBuildingGeometryAndColourUnchanged=true` 且其他建筑哈希不变，不将其表述为共享世界源码未改。

## 真实验证

- TDD RED：`tests/library-south-ribs.test.mjs` 初次 2/2 失败（缺少立面构件元数据）；`tests/library-south-inspection.test.mjs` 初次失败于模块不存在。GREEN：两个专项测试与既有入口/材质测试合计 6/6 通过，射线确认三层左右石材突出于玻璃。
- 完整 `npm run verify`（含新测试）退出码 0；`npm run build -- --outDir .sites-local/r16-south-ribs-20261031` 退出码 0（52 modules；JS 800.62kB / gzip 225.54kB；仍有 >750kB chunk advisory）。
- 将生产产物放入本地静态子路径 `/r16-south/`，从 `http://127.0.0.1:18879/r16-south/` 用 Edge headless WebGL 真实加载；4 个截图均 **0 JS / 0 HTTP 错误**。生产路径的 `./assets/` 相对引用正确，非 Vite SPA fallback 伪通过。
- 桌面 1440×900：搜索选中、鼠标旋转、滚轮缩放、树层开关通过；390×844 Edge 触控模拟：单指平移、双指缩放、漫游前进/返回通过。证据分别在 `r16-south-ribs-interaction-1440/` 和 `r16-south-ribs-touch-390/`。这些不等于真实 iPhone Safari 验收。

| 生产 Edge 视角 | draw calls | triangles | geometries | textures | 采样 FPS |
|---|---:|---:|---:|---:|---:|
| 南立面近景 1440 | 361 | 845,945 | 300 | 23 | 171 |
| 选中图书馆 1440 | 414 | 875,514 | 439 | 36 | 99 |
| 南立面近景 390 | 221 | 556,222 | 216 | 28 | 101 |
| 选中图书馆 390 | 267 | 556,684 | 421 | 34 | 101 |

`frameStats` 在上述采样为 P95 约 6.1–6.2ms；这是本机 headless Edge 的页面仪表读数，**不是**真实 iPhone 或可重复的 GPU P95 结论。整场景统计受植被 LOD、镜头和采样时机影响，不能直接当作单体增量；单体增量以专项几何测试为准。整场景移动端预算仍高于 150 calls / 300k triangles 的起始建议。

截图及原始 JSON：`docs/quality-v2/r16-south-ribs-local/`。前一轮同类选中视角参考：`r16-library-material-local/place_钱学森图书馆-1440.png`。此次 1440 近景已能辨认两条凸出的暖石材竖向构件，390 近景仍能辨认中央节奏，但整体仍偏程序化。

## 视觉批判与下一步

**最大剩余可见缺陷：** 中高层两翼仍以尺寸偏大的方形深窗重复排列；2021 正面照片中的细长竖窗、石材间柱与层间阴影节奏尚未还原。中央玻璃的色调也偏均匀，不能以 bloom 或叠加细线掩盖。

**下一次只做一项：** 在 2021 正面照片可见的中高层两翼，挑一个楼层的窗口模块做有真实凹入深度的窄竖窗/石材间柱代表性切片；先对比同一 `library-south-detail` 机位的 1440/390 实图，保留不增加 draw calls 的合批策略。未有证据的背立面、庭院标高与桥梁继续不猜。

本轮原生 Skills 列表为空；无法声称重新读取 Three.js AAA Graphics Builder 等原版专业 Skill，继续使用本仓库已有的参考与材质/LOD/QA 方案。原有工作树存在其他流程留下的未提交文档和点击证据，本轮不覆盖、删除或代为提交。
