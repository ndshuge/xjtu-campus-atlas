# 2026-10-25 · 校园 3D 第二轮可审计升级 / 页面设计取舍

## 工程与目的

本轮继续原有 Three.js + OpenStreetMap 西交兴庆校园，不重建仓库、不改变真实地理坐标，也不把照片假装成测绘数据。主目标是地标更可辨认、聚焦建筑时减少遮挡、Pages 与本地版本同步。

## 参考来源与素材边界

- 西安交通大学官方图书馆历史与体量： https://news.xjtu.edu.cn/info/1002/66472.htm 。南楼公开高度 49.75m，保留在原图书馆数据与测试中。
- 西交建筑照片参考（不嵌入或再分发）： https://xjtu.party/photos ，可参考主楼和图书馆建筑开窗、体块；该站不是学校官方，照片未获得本工程可再分发许可。
- 香港中文大学同类可交互校区项目：https://github.com/PeterZh6/cuhk-campus-3d 。借鉴建筑、地图、交互分层，不复制其数据/模型。
- 西工大 3DGS：https://github.com/kaoukaoua/3DGS-Campus-Reconstruction 。仅作为下一阶段取得授权多视角影像后的实景增强方案，本轮**没有使用或训练高斯泼溅**。
- Taste Skill：本机 `C:/Users/ndshuge/.agents/skills/design-taste-frontend/SKILL.md` 已读取，实际运行 `draw.mjs --app --kind creator` 并将结果存于 `.taste-skill/campus-upgrade/direction.json`。生成的 Accent Ladder 与校园绿 / 灰陶土 / 地图主角不符，主动拒绝调成粉色系统。
- Designeer 的资源与灵感库： https://designeer.xyz/resources / https://designeer.xyz/inspiration 通过本机后台浏览器可访问，审阅其分类结构；**未把任何第三方组件或图片下载到仓库**，也未完成两个具体案例的全文审阅，因此双源设计门禁的该项仍是待补项，不能冒称完整执行。

## 可复验的实际改动

- `src/library-facade.js`：图书馆南立面层次、玻璃、窗框、入口，依现有几何外形进行解释性建模。
- `src/main-tower-facade.js`：主楼 E 座的石材框架、纵向玻璃幕墙、顶部视觉开口等*示意*细节；高度沿用原来的推算 80.5m，不称实测。
- `src/world.js`：加入两处独立细节层；植被分层与实例化保留；`src/ground-pattern.js` 提供免版权风险的程序化细微草地色差。
- `src/style.css` 与 `index.html`：聚焦地点时移除重复遮挡三维建筑的欢迎标题和重复位置标题，并删除没有实际含义的英文装饰编号。
- `scripts/verify-facade.mjs`：测试有限顶点、材质批处理、地理界限和不突破高度来源。

## 真实浏览器画面与本轮判断

- `docs/edge-qa.png`：全校视角。
- `docs/edge-library-qa.png`：上一轮图书馆视角。
- `docs/edge-final-library-qa.png`：图书馆南立面增强。
- `docs/edge-main-tower-qa.png`：主楼 E 新立面、建筑选择后的实际可视效果。
- `docs/edge-mobile-final-qa.png`：390x844 窄屏模拟效果，不是手机 Safari 实机测试。

已观察到的原画面问题：三维实体多使用同质挤出与窗格，标志性建筑缺乏层次；图书馆/主楼聚焦页面左上欢迎文案与左下地点详情重复占空间；英文 all-caps 装饰编号无功能。处理路线是保留全景地图作为主角，聚焦时由地点详情独立承担文字说明。后续要继续替换有授权照片基础上的 GLB，不能用未经核验的程序几何冒充实景。

## 质量门禁

- FOUND：本机前端双源、Taste Skill、本机 3D 工程。
- LOADED：本地 Skill 及设计门禁、原项目代码与验收记录、参考项目研究。
- EXECUTED：Taste 的 app draw、代码/几何改动、编译、自动测试、实际无界面 Edge 截图。
- VERIFIED：自动构建与几何校验、页面渲染；视频/360 全景/手机触控/人类审美认可仍未验收。
- Taste Inspector：本地以 `--app --widths 1440,390` 实际检查，首次报告 emoji/text-shadow/font-count/heavy-shadow 等 FAIL。已减轻主容器阴影、移除欢迎标题阴影；字体数量及部分符号仍存在未消除的告警，应保留为后续整改，不能报告为全部 PASS。
- 发布状态：以实际 GitHub main 和 gh-pages 提交 / Pages 访问核验为准，不把本地 dist 当做已上线。

本地隐私原则：不允许上传任何环境文件、令牌、浏览器 Cookie、社交账户或私有聊天资料。静态资源、OSM 署名与第三方声明保留。

## 2026-10-25 · 后续实景素材审查与实际采用

本轮从 Wikimedia Commons **逐张核对图片作者、拍摄时间和 CC BY-SA 4.0 条款**。两张 Liuxingy 的钱学森图书馆照片已转为 960px 预览并随静态站点发布；原始源图和许可链接在 `public/assets/reference/README.md` 中完整记录。它们并非 Designeer 素材，也没有被冒称为官方测绘或 3DGS 训练数据。

体验方向从“全屏地图覆盖半屏大卡片”改为“地图优先的折叠地点栏”，照片对照是按需展开的独立 `<details>`，减少首屏图片加载和层级遮挡。移动视口截图在 `docs/quality-v2/peek-mobile-v2.png`、`docs/quality-v2/photo-sticky-mobile.png`。体验仍有 3D 资产精度、真实性与性能限制；不宣称已完成摄影级重建。

## 2026-10-26 R6 · 场景质量闭环

沿用现有地图界面与 Three.js。Prism 的实际采用项为实例批次、近远 LOD、几何预算、DPR 上限与真实 WebGL 指标；Taste 的实际采用项为先看当前页面、保留既有视觉语言、根据截图返工。树冠远景消失、树皮 shader 编译失败和远景叶簇叠板感均由看图后修正，没有用静态测试代替视觉验收。

新道路/植被纹理为原创程序资产；学校 2024 道路改造、2026 北门修缮照片仅作研究。四视角、六维评分、工具结果及未完成项见 [R6 记录](docs/quality-v2/CANOPY_CLEARANCE_R6_20261026.md)。真实 iPhone Safari、全校高保真和完整双来源设计门仍不能报告通过。

## 2026-10-28 · R13 圆球交互与三组建筑

基线为 `ccc69d6`；`b52c34f` 南门修复是该基线祖先，`src/south-gate.js` 相对该修复无改动。沿用 R11 图书馆、R12 主楼、校门、道路和 R6 植被；没有修改其专属源文件或地理数据库。全部新外观为照片辅助的程序化**示意**，不是实测建筑模型。

### 设计和交互

- 地图单指/左键拖动平移，地图双指缩放改变相机距离；圆球拖动改变原地 yaw/pitch，圆球双指和 ± 调整 FOV（20°–85°）。朝北、双击复位、短惯性、任意新触碰/按键中断及减弱动态模式均有 Edge 交互测试。地面漫游仍通过方向按钮/WASD 行走。选中地点时控件上移，展开详情时暂时隐藏，收起后恢复。
- 保留既有校园色彩，采用轻量半透明悬浮控件与 CSS 动效。Taste 的 `draw.mjs --app --kind creator` 实际生成 True-black flat（seed `1302692043`），因与现有校园地图不符而未套用其配色。Designeer 的 `/resources` 和 `/inspiration` 通过网页工具及无界面浏览器仍不可访问；未完成该来源案例审阅，不能将双源设计门记为通过。
- 控件和选择截图：`docs/quality-v2/r13-attribution-final-390/orb-held-390.png`、`docs/quality-v2/r13-attribution-final-1440/orb-held-1440.png`、`docs/quality-v2/r13-focus-final/`。控制器按键、页面缩放、惯性中断、漫游及详情遮挡结果在相应 `browser-results.json` 中。

### 建筑证据、模型归属与未知项

1. **思源学生活动中心**（OSM `way/263624056`）：[学校校园文化照片](https://wmw.xjtu.edu.cn/wh/dbcg1/3.htm) 与 [学校教育基金会报道](https://ef.xjtu.edu.cn/info/1845/7839.htm) 用于人工观察深檐、暗色桁架带、阶梯形前墙、玻璃及两根暖色柱。基金会文章发表于 2025-05-14；照片实际拍摄时间未核实。学校照片许可未明确，未复制进项目或用作纹理。`src/siyuan-center-asset.js` 唯一负责其可见建筑，16 m、檐口尺寸、侧后立面及屋面均为估算；入口柱已纳入既有步行碰撞范围。对照：`r13-siyuan-before/` 与 `r13-siyuan-collision-final/`。
2. **西迁博物馆**（OSM `way/1167525875`）：[学校介绍](https://www.xjtu.edu.cn/tsda/jdxqbwg.htm) 页面更新于 2026-07-10，包含高主体、浅色大面板、深色竖缝和低入口翼的照片；照片拍摄日期未列。学校[数字文博资料](https://szwb.xjtu.edu.cn/xnzg/jdxqbwg.htm)称其四层、占地约 940 m²；OSM 多边形计算约 1,162.7 m²，统计范围差异未解决，未据此缩放。2026 年[门头改造采购公告](https://info.xjtu.edu.cn/info/1045/46063.htm)不能证明施工或照片日期。`src/relocation-museum-asset.js` 仅作单一示意资产，入口朝西、主体/低翼划分、14 m 高度、背面和屋面尚无测绘依据。照片仅供对照，未再分发。对照：`r13-museum-before/` 与 `r13-museum-final/`。
3. **中心一、二、三楼**（OSM `way/263625088`、`way/263625089`、`way/263625087`）：[校方转载报道](https://news.xjtu.edu.cn/info/1219/159211.htm)发表于 2019-03-18，报道描述中心楼灰砖墙和红瓦坡屋顶，图片标注 3 月 5 日拍摄；[学校校史](https://news.xjtu.edu.cn/info/1069/51756.htm)说明中心楼建成四层。[Liuxingy 航拍](https://commons.wikimedia.org/wiki/File:%E8%A5%BF%E4%BA%A4%E5%85%B4%E5%BA%86%E4%B9%8B%E4%BF%AF%E7%9E%B0%E4%B8%AD%E4%B8%80%E6%A5%BC_01.jpg) 标注拍摄于 2025-07-25、2026-06-25 上传，许可 CC BY-SA 4.0，仅用于对照。`src/central-buildings-asset.js` 依据原 OSM 轮廓统一负责三栋可见外壳、红色坡屋顶与中一楼柱廊，保留各自 ID；屋顶坡度、柱廊尺寸、侧楼具体层数及 14 m 高度仍是估算。对照：`r13-central-before/` 与 `r13-central-lod-final/`。

三组资产均保留 OSM 建筑 ID、搜索与点击；原通用体块不再和专属模型重复绘制。测试分别检查屋顶覆盖、有效顶点、拾取和原始数据未变，并在中一楼与思源中心入口柱进行射线/碰撞边界检查；这不等于全校园的精确碰撞验收。`r13-landmark-regression/` 记录南北门、图书馆和主楼的实际画面，未完成真实 iPhone Safari 实机验收。

最终代码执行 `npm run verify` 和 `npm run build -- --outDir dist-r12-check` 均通过。对生产构建进行了 Edge WebGL 的 1440px、390px 和 430px 检查；390px、430px 使用设备像素比 2 模拟。圆球、地图手势、地点详情及减弱动态模式未发现脚本或 HTTP 错误。最终移动截图发现导航遮住了 OSM 署名，已上移导航，并在三个视口以命中测试验证署名可见且可点击；四处地标的 390px 和 430px 详情再次检查未遮挡圆球。构建产物 JavaScript 为 791.16 kB、gzip 222.47 kB，Vite 提示主包超过 750 kB；需继续评估拆包和真实移动设备性能。

### 性能和地图路线

- 思源中心旧通用体块加旧立面共约 1,750 三角面，新资产 344；浏览器审计几何属性约 166,784 → 41,168 字节，均含 1 个程序生成文字纹理。博物馆旧通用体块约 12 三角面，新资产约 108；新增五个材质批次及 1 个程序文字纹理。
- 中心楼三栋原通用体块合计约 112 三角面，新资产近景 10,376，4 个材质批次；远景隐藏仅有窗侧小面的批次并关闭其投影，近景恢复。1440px 校园全景的实际渲染计数从 LOD 前 551,293 降到 541,821 三角面（渲染计数含阴影等重复绘制）；R12 对照为 535,847。几何缓冲约 1.25 MB，LOD 不降低全站 DPR 或隐藏树木。
- Intel 核显、Edge 无界面、1440px 串行 A/B 在不同负载下帧间隔波动明显：较空闲时 R12 p50 约 5.0 ms、R13（LOD 前）约 5.5 ms；后续 LOD 批次约 7.0–9.4 ms，紧邻 R12 对照约 8.0 ms。此样本不足以断定真实设备帧率改善或长期能耗；`r13-perf-*/browser-results.json` 保存原始结果。390px DPR 2 采用原有 1.5 渲染倍率，仍需真机复测。
- 高德实验见独立工作树 `experiment/LIVE_INTEGRATION_AUDIT_20261027.md`：实测底图、卫星影像和原生楼块可显示，影像提供更真实的地理上下文；但测试中高德给自定义层 WebGL 1，Three.js r186 要求 WebGL 2，独立画布方案不共享深度，无法可靠遮挡。当前保留自主 Three.js 正式引擎，实验只是候选架构，未将高德密钥或底图复制进本分支。

下一步：由集成线程复核这些资产的朝向和立面后再整合；优先补充博物馆入口朝向与中一楼立面测绘/多角度资料，进行真实 iPhone Safari 和受控功耗测试，再评估地图双模式。
