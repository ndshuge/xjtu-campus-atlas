# 兴庆校区门区视觉 R8 · 专项续接验收（2026-10-26）

## 基线、隔离与改动边界

- 工作树：`E:\CHATGPT\work\xjtu-parallel-gates`；分支 `feature/parallel-gates`；R7 前序提交 `46f2882`，最初 R6 基线 `5564a86`。
- 本轮只触及 `src/north-gate.js`、`scripts/verify-gates.mjs`、校门专属 PNG 与验收文件；不直接改 `src/world.js`，不合并 `main`，不发布 Pages。
- 其他并行工作树与主仓库已有未跟踪图片不可清理、覆盖或归为此专项成果。续接期间核验到主仓库 `main` 已由其他集成进程前移至 `8bbcb724fa969545de289a90c032d8c3ed54a902`；此门区分支依旧建立在原 R6 上，没有重置、追合或改动新 `main`，待集成方自行解决与其他并行分支的兼容。

## 新核验的官方资料

1. **2026-02-09** 西安交通大学新闻网《后勤保障部扎实做好寒假服务保障工作》：https://news.xjtu.edu.cn/info/1007/229439.htm 。该报道明确记述北门两侧浮雕清洗、两侧沿街店面拆除后干挂石材、新做展示橱窗、门口处绿化重做。**这只证明报道所述作业，不能推出所有围墙、所有校门已完成统一改造，更非北门本次贴图的现场拍摄照片。**
2. **2025-05-14** 校门修缮基金：https://www.ef.xjtu.edu.cn/info/1845/7846.htm 。仅证明当年存在修缮需求与筹资计划，不能当做 2026 竣工照片。
3. 北门造型的官方照片：https://news.xjtu.edu.cn/info/1006/192924.htm 。可观察中文与英文校名相对位置、双翼深色浮雕，但单张照片不能精确校准横向尺寸。
4. 校党委宣传部 2025-12-09 的浮雕介绍：https://dwxcb.xjtu.edu.cn/info/1085/17811.htm ；不代表 R8 两侧象征性纹饰是真实浮雕复刻。
5. 2011 年摄影来源：**IronBlood，XJTU Main Gate.JPG，Wikimedia Commons，CC BY-SA 3.0 Unported**。原文件 https://commons.wikimedia.org/wiki/File:XJTU_Main_Gate.JPG ，许可证 https://creativecommons.org/licenses/by-sa/3.0/ 。

## R8 真实修复

- **问题 1：白色照片底框**。原 `north-gate-calligraphy-crop.png` 被平面投影到白色弧形门廊，会露出明显不真实的矩形底色。由该已署名照片衍生出 `public/assets/reference/north-gate-ink-mask-r8.png`（388×96 RGBA）；裁自旧衍生图像的 `(0,25)-(388,121)`，将背景亮度转为透明度并统一用深绿色保留墨迹轮廓。这是 **CC BY-SA 3.0 衍生作品**；不声称拥有原作品版权，也不能称为当前立面真实测绘。源照片与许可必须保留署名。
- **问题 2：真实截图暴露四字次序镜像**。在 Edge WebGL 1440 宽截图中，曾显示为反序“学大通交”。去除纹理 `repeat.x=-1` 的误用，真实复测后恢复正确的 **“交通大学”** 顺序；把纹理平面宽由 26 缩到 19 场景米（仍非测量值），避免字形被横向拉长。
- **问题 3：侧浮雕一面被 OSM 建筑遮挡**。地图中 OSM 建筑 `264738602`（交大邮局）面向咸宁西路的几何面比原虚拟浮雕靠前。把模型那一侧的浮雕与原创象征纹饰移到可见表面，另侧位置不改，减少只剩一块浮雕的视觉错误；**这是可视化遮挡修复，不是对邮局或真实浮雕墙体的实测定位**。
- 门区脚底与道路限界仍由前序 R7 维护；不推广北门石材/浮雕材质至全校无照片墙段。

## 验收记录

- **完整自动验证**：`npm run verify` 退出码 0，见 `gates-parallel-r8-accepted/verify.log`；`npm run build` 退出码 0，见 `gates-parallel-r8-accepted/build.log`。
- **专属回归**：`scripts/verify-gates.mjs` 保留双语左右关系、北门两翼浮雕数量、东侧浮雕相对 OSM 邮局的可见性、纹理透明度/尺寸/PNG RGBA 签名与 UV 默认方向检查。
- **实际 WebGL 浏览器截图**：Edge Headless、1440×900 和 390×844，`gates-parallel-r8-accepted/north-gate-{1440,390}.png` 及 `north-wall-{1440,390}.png`；`browser-results.json` 记录 4 次加载，截图过程零 JavaScript 异常、零 HTTP 4xx、无页面横向溢出。它们不是 iPhone Safari 原生 GPU 验证。
- **照片对比判定**：北门书法方向和不带白底的浮贴已视觉复核；弧形顶棚、支柱以及两侧浮雕仍是近似几何，不符合照片级复原，不以自动化通过宣称此项通过。
- **手机构图**：390px 原 `inspection=north-gate` 仍裁切门廊两翼，判定 **未达完整构图验收**。前序 `gates-parallel-r7-accepted/WORLD_JS_INTEGRATION.patch` 已通过 `git apply --check`，需最终集成方处理；不得为了本分支直接更改共享 `src/world.js`。

## 留给集成与后续的缺口

1. 缺少同一视点、多角度、标明拍摄日期的 2026 年北门竣工照片；2026 校方工程报道不等于逐段墙体影像。
2. 东南门、其他门区、四角围墙仍保持 R7 OSM 示意层，继续禁止借用北门构件复制全校。
3. R7/ R8 局部围界、邮局外立面、树木是否真实相邻待地理测量、带尺度近景或独立地面漫游确认。
4. R8 不更改 `src/world.js`、主分支、远端或 Github Pages；被修复的可视化遮挡不构成车辆通行净空认证。
