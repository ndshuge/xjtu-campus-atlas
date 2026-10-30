# R16｜钱学森图书馆南立面窄竖窗代表性切片（2026-10-31）

**状态：本地候选已通过工程验证；未发布、未完成独立艺术/真机验收。**
工作树 `E:\CHATGPT\work\xjtu-r15-unified-quality-20261030`；分支 `feature/r16-qian-library-asset-20261030`；本轮开始 HEAD `6e76b7b`。承接上一轮 `R16_QIAN_LIBRARY_SOUTH_RIBS_20261031.md` 所列最重要可见缺陷，不重复入口或中央石材肋施工。R15 Pages 保持原样。

## 本轮视觉依据与范围

- 实际查看仓库 `public/assets/reference/library-front-2021.jpg`（Liuxingy，2021-09-06，CC BY-SA 4.0；完整归属及许可见 `public/assets/reference/README.md`）和上一轮相同南立面 1440px 截图。照片的中高层两翼是密集、细长的竖窗和明显石材间柱，而上一轮画面是大方窗阵列。
- 只在 `south-course-2` 南向两翼的**下排**做代表性切片：把原约 3.5m 大窗模数改为约 1.65m 窄窗模数，玻璃开口宽约 0.92m，玻璃内退约 0.28m，保留真实石材开口、侧/顶内退面与下缘。参数均为 **photo-informed / estimated**，不是测绘数据。其余楼层、侧后立面与院落标高不扩展猜测。
- 复用现有 `wall/glass/frame/reveal` 合批；不增加 Mesh、材质、纹理、依赖、透明层、效果或额外 draw-call 批次。OSM `way/263624481`、足迹、选择 ID、碰撞、地图导航与 R12 LOD/fallback 保留。中性 massing 不绘制此细节。元数据 `asset.userData.southNarrowBays` 明确来源及估算状态。

## 测试与预算

- TDD RED：先写 `tests/library-south-narrow-bays.test.mjs`，最初 2/2 失败（缺少元数据/中性模式声明）；GREEN：新测试 2/2，入口/中央石材肋联合 5/5，通过真实 Three.js Raycaster 检测左右两翼各至少 9 个窄且内退的窗口开口。
- `npm run verify` 全量退出码 0；`npm run build -- --outDir .sites-local/r16-narrow-bays-20261031` 退出码 0（52 modules；JS 800.96 kB / gzip 225.65 kB，仍有 >750 kB chunk advisory）。
- 单体近景：**23,397 → 23,565 triangles（+168，约 0.72%）**；远景 **10,637 → 10,685（+48）**；近景 **7 Mesh 不变**，远景仍减少 **54.66%**。此项是局部建筑三角面增量，不将整场景差异归因于单体。
- 使用真实静态 HTTP 子路径 `http://127.0.0.1:18880/r16-narrow/` 测试生产文件及相对 assets；不是 Vite SPA fallback。Edge headless WebGL 实测，所有四个建筑视角均为 0 JS/HTTP 错误：

| 生产构建视角 | Draw calls | Triangles | Geometries | Textures | 仪表 FPS |
|---|---:|---:|---:|---:|---:|
| 南立面近景 1440×900 | 361 | 846,257 | 300 | 23 | 170 |
| 南立面近景 390×844 | 221 | 556,390 | 216 | 28 | 72 |
| 搜索选中图书馆 1440 | 414 | 870,756 | 以 JSON 为准 | 以 JSON 为准 | 100 |
| 搜索选中图书馆 390 | 267 | 560,952 | 以 JSON 为准 | 以 JSON 为准 | 102 |

- 近景 120 个连续 requestAnimationFrame 样本：1440 为 169.68 fps / 707.2ms，390 为 71.61 fps / 1675.8ms；页面 `frameStats` P95 分别约 6.1/6.2ms。这是 **headless Edge / RTX 5060 本机** 的短采样，不是物理 iPhone、GPU 时间或长期帧稳定性证明；样本 FPS 与页面仪表不同，不能混同。390px 整场景仍高于建议 150 calls / 300k triangles 起始预算。
- 桌面 1440 生产页：鼠标旋转、滚轮缩放、树层开关、搜索选中图书馆通过。390 模拟触控：首次连续测试平移/缩放/返回均正常，但漫游距离 **105.42m** 超出脚本 1–25m 断言，**首次失败必须保留**；相同脚本对上一轮生产构建基线通过（2.21m），对本轮独立重试通过（2.29m）。暂列为未定位的间歇性漫游输入/计时问题，不能据此声称连续稳定性通过，也不能归因为窗格几何。所有上述会话无 JS/HTTP 错误。
- 截图与原始数据：`r16-narrow-bays-local/`（同机位 1440/390），`r16-narrow-bays-selected-local/`（真实生产选中），`r16-narrow-bays-interact-1440/`、`r16-narrow-bays-interact-390/`、`r16-narrow-bays-baseline-interact-390/`、`r16-narrow-bays-interact-390-retry/`（交互首败、对照及复测）。先前同机位在 `r16-south-ribs-local/`。

## 实图自审与下一步

1440 同机位可直接看到中层左右翼从大方窗变为密集窄竖窗，玻璃有真实内退、石材间柱更接近照片节奏；390 手机视口仍能辨认这一行。**最明显的剩余缺陷：该窄窗带只存在于一个楼层，其他层仍是大方窗，整栋楼因此出现不自然的单层风格跳变。** 下一次先检查 2021 正面照对应楼层/分段，再决定将经过验证的模数扩展到紧邻一层或改为成对窄窗，不盲目铺满所有立面；保持同一 1440/390 机位 A/B。

本轮 ChatGPT-native Skill 列表返回空，无法声称重新读取 Three.js AAA Graphics Builder / 3D Visual Direction / 3D Scene Architecture / Three.js QA Release 原版 Skill；采用仓库已有 R16 方案、真实照片与 Three.js 几何/LOD/QA 既有工作流。没有独立艺术评审、真实 iPhone Safari 或实测建筑图纸。本轮未发布、不改正式 Pages、不处理其他工作树。原有未提交 `R16_QIAN_LIBRARY_ENTRY_20261031.md`、生成 JSON、`.superpowers/` 与旧点击证据属于先前遗留/其他执行流程，不纳入本轮提交。
