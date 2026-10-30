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

## 后续本地迭代｜south-course-3 双排窄窗（2026-10-31）

- **真实基线与范围**：开始时 HEAD `d8bb6c8`，仍在 `feature/r16-qian-library-asset-20261030`。核对了 Liuxingy 2021 正面照（CC BY-SA 4.0）和 2025 航拍（同许可，来源见 `public/assets/reference/README.md`）；只在 `south-course-3` 的**南向两翼、两排**延续已验证的窄窗与 0.28m 玻璃内退。没有改变北/侧/背立面、OSM 足迹、碰撞、拾取、屋顶或中央幕墙。0.92m 窗宽、1.65m 模数、立面深度均是 photo-informed estimates，不是测绘。
- **RED → GREEN**：新增 `tests/library-south-course3.test.mjs`，先得到 1 fail / 1 pass（缺少 course-3）；实现后旧测试的“仅有 course-2”排他断言暴露为 2 fail，改成验证 course-2 持续存在；最终专项 6/6、`npm run verify` 退出码 0（库相关 12/12）。真实 Three.js Raycaster 检查 course-3 两排左右翼各至少 7 个独立内退开口；中性 massing 无新增窗格。生产构建 `npm run build -- --outDir .sites-local/r16-course3-20261031` 退出码 0，主 JS 801.02 kB / gzip 225.66 kB；仍有 >750 kB chunk 警告。
- **预算**：图书馆近景 `23,733 → 24,069` triangles（+336，约 1.42%），远景 `10,733 → 10,829`（+96），仍 7 Mesh，远景约减少 55.0%。无新材质/贴图/依赖/批次；整场景三角面差异含植被 LOD，不归因于建筑。
- **真实生产静态子路径**：独立 Python HTTP 服务下的 `/r16-course3-20261031/`，HTML 和 JS 均 HTTP 200；真实 headless Edge WebGL：南正面 1440×900 为 **361 calls / 847,193 triangles / 300 geometries / 23 textures**，390×844 为 **221 / 556,894 / 216 / 28**；选中图书馆 1440 为 **414 / 862,566 / 439 / 36**，390 为 **267 / 557,298 / 421 / 34**。四视角均 0 JS/HTTP errors。120 帧 requestAnimationFrame 短样本约 98.5–101.3 FPS，是本机 headless Edge 的帧调度样本，非真实手机 FPS 或 GPU 帧时间；390px 全场景仍超出 150 calls / 300k triangles 起始预算。
- **交互**：桌面旋转、缩放、树层开关和搜索选中通过；390px 模拟触控平移、双指缩放、漫游前进/返回通过（本轮 2.19m）。此前 105.42m 的间歇失败仍未定位，不能以单次通过视为根治。
- **实图复核**：`r16-course3-local/library-south-detail-1440.png` 与前版 `r16-bay-continuity-local/library-south-detail-1440.png` 同机位比较，中高层两翼方窗改成连续窄竖窗，减少层间突变；390px 仍能辨识但分辨率有限。**最明显剩余缺陷**：下一级 `south-course-1` 两翼仍是偏宽方窗，中央玻璃立面也过于黑平；下一次优先核对正面照片中的下一级窗口比例，再决定是否做一处窄窗切片，不用 bloom 或装饰掩盖。截图、原始数据及交互证据位于 `r16-course3-local/`、`r16-course3-interact-1440/`、`r16-course3-interact-390/`。
- **边界**：ChatGPT-native Skill 列表本轮为空，未声称读取原版专业 Skills；采用项目内已存专业方案和真实照片。真实 iPhone Safari、独立艺术评审未完成；未发布、未修改 R15 Pages。运行前就存在的 `R16_QIAN_LIBRARY_ENTRY_20261031.md`、生成 JSON、`.superpowers/` 与旧点击证据保留且不纳入本轮提交。

## 后续本地迭代｜south-course-1 双排窄窗（2026-10-31）

- **基线/照片**：本轮开始 HEAD `a488ed2`，指定 R16 分支不切换。直接检查 Liuxingy 2021 正面照片（CC BY-SA 4.0，`public/assets/reference/README.md`）和 `r16-course3-local/` 的同机位实图；`south-course-1` 两翼的大方窗与真实照片密集窄竖窗不符。只把这一 tier 的两排南向两翼窗口改为已验证的约 1.65m 模数、约 0.92m 窗宽、约 0.28m 玻璃内退；这些均为照片参考估算，不是测绘。未改 OSM footprint、碰撞、拾取、北/侧/背面、屋顶或通用渲染器。
- **RED/GREEN**：新增 `tests/library-south-course1.test.mjs`，初始 RED 1 fail / 1 pass（course-1 未声明）；实现后测试发现原先“至少 12 个窗口”阈值高于现有可射线检出的连续窗洞（首个左翼检测 10 个），按实际几何覆盖修正为每排每侧至少 9 个独立内退开口，联合测试最终 6/6 通过；旧 course-3 测试改为非排他性包含断言。中性 massing 无新窗格。完整 `npm run verify` 退出码 0。
- **构建/预算**：`npm run build -- --outDir .sites-local/r16-course1-20261031` 退出码 0；52 modules，主 JS 801.05 kB / gzip 225.67 kB，既有 >750kB chunk 提示。单体近景 **24,069 → 24,349 triangles（+280，约 1.16%）**；远景 **10,829 → 10,909（+80）**；7 Mesh 不变，远景减少约 **55.20%**。复用原有材质和合批，无新增贴图/依赖。
- **真实生产静态子路径**：本机独立静态 HTTP `/r16-course1-20261031/`；Edge headless WebGL 的 `library-south-detail` 1440×900：**361 calls / 847,713 triangles / 300 geometries / 23 textures**；390×844：**221 / 557,174 / 216 / 28**。选中图书馆 1440：**414 / 874,240 / 439 / 36**；390：**267 / 560,468 / 418 / 34**。四视角均 0 JS/HTTP 错误；选中详情与工具栏无重叠，390px 展开/还原正常。120 个 requestAnimationFrame 样本分别约 56.14 FPS / 2137.7ms、101.06 FPS / 1187.4ms，属于 RTX 5060 本机 headless Edge 帧调度，不是 GPU 时间、真实 iPhone FPS 或稳定性证据。390px 场景仍超出 150 calls / 300k triangles 起始预算。
- **交互**：1440 桌面旋转、滚轮缩放、树层切换、搜索选中通过；390 模拟触控平移、双指缩放、漫游前进/返回通过（4.38m）；此前 105.42m 间歇漫游失败仍未定位，不能视为根治。
- **截图审查**：同机位 `r16-course3-local/library-south-detail-{1440,390}.png` 对照本轮 `r16-course1-local/`，原中下层大方窗现在形成与上两级连续的窄窗节奏，手机也可辨。**最重要的剩余可见缺陷**：中央玻璃幕墙仍像单片黑色平板，横向石材分层、立体窗梃与阴影层次不足；下轮先在 `south-course-1` 中央玻璃区做一个真实厚度的分层/退进切片，严格参考照片并保留同机位对照，不能用 bloom 遮掩。
- **证据/边界**：`r16-course1-local/`、`r16-course1-selected-local/`、`r16-course1-interact-1440/`、`r16-course1-interact-390/` 的 PNG/JSON；独立静态服务为本轮自有进程，结束后停止。专业原版 Skills 列表为空，未声称读取；真实 iPhone Safari、独立艺术验收仍未完成。R15 Pages 不发布、不修改。运行前已有的未提交 `R16_QIAN_LIBRARY_ENTRY_20261031.md`、生成 JSON、`.superpowers/`、旧点击证据不擅自清理或纳入本轮提交。
## R16 follow-up: south-course-1 central curtain relief (2026-10-31)

- **Verified starting state:** Mice Hole reachable; exact worktree and branch confirmed at `686838b`. Pre-existing modified quality JSON, ENTRY handoff, `.superpowers/`, and older click captures were left untouched. The 2021 Liuxingy frontal photo (CC BY-SA 4.0) was inspected directly for central facade rhythm; the checked-in 2025 aerial was inspected for massing only. Neither provides surveyed dimensions.
- **One bounded change:** Only the central south-facing curtain of `south-course-1` now has two genuinely separated glass panels at approximately 0.36 m recess, one projecting stone transom approximately 0.38 m high / 0.33 m proud, thin metal edge caps, and deeper mullions. The earlier single dark glass sheet is not retained behind the stone band. Dimensions are photo-informed estimates. No bloom, texture, material, dependency, footprint, picking, collision, or navigation change; 7 building meshes remain.
- **TDD:** New `tests/library-south-curtain-relief.test.mjs` initially RED (2 failures: missing articulation metadata and neutral-stage contract), then GREEN 6/6 with adjacent facade tests. Raycaster verifies stone in front, an actual gap between glass panels, and glass behind the facade. `npm run verify` exit 0 (library test group 16/16). Pre-existing dirty verification files were byte-backed-up before the suite and restored afterward; do not commit those other writers' changes.
- **Production build:** `npm run build -- --outDir .sites-local/r16-curtain-relief-20261031` exit 0, main JS 801.53 kB / gzip 225.84 kB (existing >750 kB warning). Static subdirectory `/r16-curtain-relief-20261031/` served locally over HTTP 200, not deployed. Initial attempt used an occupied port 18893 and hit another site's server; that invalid run was discarded. Correct server was independently checked on 18953.
- **Actual headless Edge WebGL** at fixed `library-south-detail`: 1440x900 = **361 calls / 847,763 triangles / 300 geometries / 23 textures**; 390x844 = **221 / 557,200 / 216 / 28**. Selected library: 1440 = **414 / 874,290 / 439 / 36**; 390 = **267 / 557,404 / 421 / 34**. Four views report zero JS and HTTP errors. Single library near-LOD triangle count **24,375** (previous 24,349, +26); far-LOD **10,935** (previous 10,909, +26), approximately 55.14% lower than near. All values from actual runs, not a claimed independent audit.
- **Interaction and timing:** Desktop rotate, zoom, tree-layer toggle and search selection passed; simulated 390px pan, two-finger pinch, walk and return passed (walk 4.03 m). Previous intermittent 105.42 m walk failure remains unresolved. 120 fresh requestAnimationFrame samples gave ~71.78 fps desktop and ~169.47 fps simulated phone, both on RTX 5060 headless Edge and **not** actual iPhone/GPU timings. The 390px scene remains above the starting 150 calls / 300k triangles budget.
- **Visual A/B:** `r16-course1-local/` vs `r16-curtain-relief-local/` at the same 1440/390 south pose: a distinct horizontal stone/transom depth now breaks the first central black glass field, especially visible at 1440. The mobile close pose shows the new band but not fine depth cues; selected views are less legible. **Most important remaining visible defect:** the upper central glazing tiers still form large, uniform, black rectangles unlike the photographed small-scale divisions. Next bounded iteration: check the 2021 photo and add *one* evidence-supported mullion/spandrel module to `south-course-2` central glazing, with same-view A/B and mobile budget checks, not an indiscriminate facade rewrite.
- **Evidence:** `r16-curtain-relief-local/`, `r16-curtain-relief-selected-local/`, `r16-curtain-relief-interact-1440/`, `r16-curtain-relief-interact-390/` (screenshots and browser-results.json). Specialist native Skills list was empty this run; original Three.js AAA / Visual Direction / Scene Architecture / QA Release Skills were not loaded and are not claimed. Real iPhone Safari and independent art signoff remain outstanding. No Pages publish.
