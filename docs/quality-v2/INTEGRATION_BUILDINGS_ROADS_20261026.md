# 兴庆 3D 校园｜建筑 + 道路独立集成验收（2026-10-26）

## 分支与安全边界
- 本轮基于已存在的 main `5564a86a3cc7b12a22841dafff07a582b8c1b0f2` 创建独立工作树：`E:\CHATGPT\work\xjtu-integration-roads-buildings-20261026`；分支 `integration/roads-buildings-20261026`。
- 道路已提交来源：`bdcf9c0c39db07b4820f5feb5392a3fff74f0f85`。
- 建筑已提交来源：`0d53e6e4f3988affa439bd06a3c3f092d655bc32`（其前一提交 `1db209d`）。
- 先后创建普通无冲突合并提交 `16bf000`、`5d342aa`。
- `feature/parallel-gates` 当前仍有未提交源码、测试和 QA 图；**没有合并、覆盖、重置或清理这一工作树**。
- 主仓库有历史未跟踪文件，完全保留；本轮未对 main/gh-pages 推送。

## 实质修复与集成
1. `src/world.js` 现在直接导入 `createBuildingSilhouettes`，在原有 `buildLandmarks()` 后把叠加模型加入正式场景；不再依赖 `building-review.html` 或 monkey-patch 才能显示。
2. `scripts/verify-building-silhouettes.mjs` 调整为要求正式生产场景确实接入该模块，保留三组叠加、建筑范围/高度与“禁止推断地下庭院”检查。
3. `package.json` 的 `npm run verify` 现包含建筑、道路平面、广场和碰撞专项检查，不再出现“模块单测存在但统一测试没有运行”的脱节。
4. `scripts/qa-render.mjs` 修复了 Hash-only 视角切换的错误：同源地标切换没有重新载入文档，导致标注“四大发明广场”的截图实际拍到“钱学森图书馆”。增加随视角变化的独立查询参数，以及实测 `runtime.selected===预期地点` 的硬断言，不符即失败。

## 本机正式环境验收
- `npm run verify`：通过（含建筑网格、道路路径、广场铺装与 R6 植被避让）。
- `npm run build`：通过，37 个 Vite 模块，生产资源 `assets/index-DYpCvuWD.js`。
- Edge Headless WebGL：`docs/quality-v2/integration-roads-buildings-20261026/` 初始覆盖首页、主楼、梧桐东道、图书馆、广场的 1440px/390px 截图；首轮广场截图对象错误，因此**该首轮广场截图无效**。
- 校验修复后的有效截图：`qa-corrected/place_四大发明广场-1440.png`、`qa-corrected/place_四大发明广场-390.png` 及对应图书馆 1440/390 像素截图，实际已选地点正确，浏览器 JavaScript/HTTP 错误 0。
- `main-e-1440.png` 显示主楼 E、A/B/C/D 翼楼在正式场景可见；`avenue-east-1440.png` 显示大道中心线、人行带、沿街立面和植被共同渲染。照片级真实性、真实 iPhone Safari、道路实际宽度仍**未验证**。
- 测试中部分 FPS 是 Windows 上 Edge Headless + RTX 5060 的值，不能冒充移动真机 FPS；首轮浏览器 QA 进程清理超时，修复后二次地标专项 QA 正常退出。

## 实景资料与误差约束
- 建筑来源保留在建筑分支自身报告/脚本；如西交官方图书馆建筑结构 https://news.xjtu.edu.cn/info/1219/153497.htm（2016-11-21，发表日不是照片拍摄日），OSM 快照 2026-10-24。原始截图未取得照片复用权时不导入贴图。
- 道路来源参照道路交付报告 `docs/quality-v2/parallel-roads-20261026/DELIVERY.md`：校方主干道命名及 2024 年梧桐东道沥青/人行道改造信息。
- 主楼翼楼窗格、图书馆北楼立面、道路宽度、人行带和四雕塑基座是依据现有 OSM 与相片的**示意增强**，不是现场测绘结果。
- 图书馆的真正地下高差与弧形步道仍未施工，不得用现有平面“下沉”视觉冒充真实地形。

## 本轮结论
建筑 + 道路：**工程集成可用、视觉阶段通过、摄影级仍未通过**。围墙/校门分支尚未验收完成，需待其提交后再启动总集成检查。禁止把本分支当前结果误称已上线。
