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