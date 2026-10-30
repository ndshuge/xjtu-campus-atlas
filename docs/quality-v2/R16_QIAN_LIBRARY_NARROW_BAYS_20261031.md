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

## 后续本地迭代｜south-course-2 双排窄窗连续性（2026-10-31）

**范围与证据。** 承接本文件上轮最明显的单层风格跳变；再次直接查看已登记 CC BY-SA 4.0 的 Liuxingy 2021 正面照和 2025 航拍。只将 `south-course-2` 两翼上排改为与已验下排一致的窄竖窗、实体石材间柱和约 0.28m 内退玻璃；其他 tiers、侧后立面、OSM 足迹、屋顶及入口不改。参数为 **photo-informed estimated**，不是测绘/摄影测量。仍复用既有 7 Mesh / 材质 / 贴图批次，无新依赖或装饰效果。

**TDD 与工程验证。** 新增 `tests/library-south-bay-continuity.test.mjs`：RED 2 项中 1 项失败（缺少第二排声明）；GREEN 专项联合测试 7/7 通过，Raycaster 在该 tier 两排左右翼均检出至少 9 个窄且内退的窗口开口；中性 massing 不出现新增细节。测试已加入 `npm run verify`，全量退出码 0。生产 `npm run build -- --outDir .sites-local/r16-bay-continuity-20261031` 退出码 0，52 modules，JS 800.97 kB / gzip 225.66 kB，既有 >750 kB chunk advisory 未消失。单体近景 **23,565 → 23,733 triangles（+168，约 +0.71%）**，远景 **10,685 → 10,733（+48）**，近景 7 Mesh 不变，远景减少约 **54.78%**；整场景的三角面变化不可全部归因于单体。

**生产静态子路径真实 Edge WebGL**：`http://127.0.0.1:18884/r16-bay-continuity-20261031/`（仅本机临时服务，非发布）。固定 `library-south-detail` 视角：1440×900 为 **361 calls / 846,569 triangles / 300 geometries / 23 textures**；390×844 为 **221 / 556,558 / 216 / 28**。选中图书馆视角：1440 为 **414 calls / 872,082 triangles**；390 为 **267 / 561,558**。四视角均 0 JS/HTTP errors，静态嵌套路径资源加载正常。120 帧新 requestAnimationFrame 样本：1440 **72.38 FPS / 1657.9ms**，390 **170.65 FPS / 703.2ms**，均为本机 RTX 5060 Laptop GPU 的 headless Edge 短样本，不可解释为真实 iPhone FPS/GPU 帧时间或稳定性能改进；两次测量受运行负载影响显著。390px 整场景仍超过 150 calls / 300k triangles 起始预算。

桌面 `home` 模式的鼠标旋转、滚轮缩放、树层切换、搜索选中通过；390px Edge 模拟触控的平移、双指缩放、漫游前进/返回通过，本轮漫游距离 3.115m。上轮曾有间歇性 105.42m 失败，本轮单次通过不代表问题根除。实际 iPhone Safari、独立视觉审查和长期 GPU 性能仍未验收。

**实图自审与下轮目标。** 相同 1440/390 正面机位对比，上下两排窄窗节奏现在连续，改善了 `south-course-2` 内的突兀跳变；但 `south-course-3` 两翼仍有大方窗，和 2021 正面照片中更密集的竖窗节奏不符，这是当前最明显的可见缺陷。下轮只在照片确实支持的 `south-course-3` 选择一个可验证的成对窄窗模块，不向未知背面扩展；同机位 A/B 并检验移动预算。

原始截图与 JSON：`r16-bay-continuity-local/`、`r16-bay-continuity-selected-local/`、`r16-bay-continuity-interact-1440/`、`r16-bay-continuity-interact-390/`。原有其他流程未提交文档、生成 JSON、`.superpowers/` 和旧点击证据未擅自清理/纳入提交。ChatGPT-native Skills 列表本轮仍为空，未声称调用原版 Three.js AAA / Visual Direction / Scene Architecture / QA Release。**本轮不发布，不改 R15 Pages。**
