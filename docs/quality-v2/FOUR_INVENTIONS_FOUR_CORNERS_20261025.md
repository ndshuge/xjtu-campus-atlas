# 四大发明广场独立视觉修复 · 2026-10-25

## 官方核对与问题

西交官方校友游览文章《“樱花章”带你游交大》明确记载：经过图书馆进入四大发明广场，四大发明雕塑**位于广场四角**，而不是中心一座书形雕塑。另据西交人文学院，雕塑家**贾濯非**创作了《四大发明》，1996 年校内作品，花岗石、铸造不锈铁、铜板钣金与钢筋混凝土，2004 年获第三届全国城市雕塑优秀作品奖。

来源：
- https://www.xjtu.edu.cn/info/1016/29901.htm
- https://rwxy.xjtu.edu.cn/info/1038/5694.htm
- https://rwxy.xjtu.edu.cn/info/1038/9355.htm
- 真实历史照片（Danielinblue，2013；具体使用遵循原作者 Commons 文件页面许可）：https://commons.wikimedia.org/wiki/File:Sidafaming_Guangchang.JPG

## 本轮代码

- 修改 `src/four-inventions.js`：移除原先一处中心书形雕塑，改为四个独立基座和四组可辨认的主题示意构件，分别表示造纸、印刷、指南针、火药。
- 广场中心刻意保持开放，不要编造大型建筑或占据校园主轴。
- 每组构件有自己的几何轮廓、石基、金属材质。当前四角的**具体坐标与造型仅为解释性近似**，不是贾濯非作品实测几何；在 `userData` 中明确标注。
- 新增独立验证 `scripts/verify-four-inventions.mjs`：四组独立、中心空置、不与 OSM 已知建筑平面相交、在校园边界内、几何高度正常、可由 JS 生成。
- 本次改动独立于 Codex 尚未完成的图书馆、主楼和新模型文件，避免覆盖正在施工的源码。

## 已实际查看的浏览器截图

- `docs/quality-v2/four-inventions-paving-qa.png`（原先）：广场中轴为大面积空白、仅一座小雕塑，不能还原“四角”布置。
- `docs/quality-v2/four-inventions-four-corners-qa-r1.png`（本次）：在相同本地浏览器视角能看到两组边缘雕塑、现有钱学森图书馆改造也被加载；另两组从该视角受前景楼与树遮挡。没有宣称四角构件立面已匹配真实作品。

## R2/R3 图像参考与镜头复检

新取得真实参考图：摄影 Danielinblue，2013 年 7 月 27 日，Commons 文件 `Sidafaming Guangchang.JPG`，CC BY-SA 3.0。照片中可见一座倾斜、由汉字石块构成的实体雕塑，背景可见深色抽象作品；它推翻了单纯凭字面意义设计直立印刷机的假设。

参考截图：`reference-four-inventions-2013-preview.jpg`（原图在 Wikimedia Commons；摄影作者署名，仓库中仅用于内部 QA、不作为页面素材），新的真实参考几何首先用于印刷题材石块造型。具体哪座雕塑属于哪一角、精确比例均待资料核实。

在桌面 `plaza-four-corners-camera-r3-desktop.png` 可见全部四座；第一次移动镜头 `plaza-four-corners-camera-r3-mobile.png` 错误进入建筑体块。后续进行了多轮移动取景迭代，`plaza-four-corners-camera-r7-mobile.png` 能同时显示四个基座/构件，仍非照片级还原。

## 未通过与限制

- 四组构件**不是**真实雕塑外形复刻，仍需按多角度授权照片重新建模。
- 官方照片提供的是历史外观，不足以确认四角准确空间坐标。不要将此处当作可用于现场导航的实测资产。
- 当前自动验收套件 `npm run verify` 因 Codex 同时修改的 `main-tower-facade.js` 与旧 `verify-facade.mjs` 高度约束不一致而失败，**不是四大发明本身测试失败**；独立测试通过，`npm run build` 通过。待 Codex 自己修复该断言或其模型后一起执行完整验收。
- 目前不应单独发布到 Pages：正在进行同一仓库多文件并行施工，需要在 CodeX 合并并完成截图+全套测试后统一部署。

## 补充验收（R4-R5）
- 手机重新调整后截图：docs/quality-v2/plaza-four-corners-mobile-r4.png。四组雕塑都进入画面，镜头不再穿进建筑。
- 桌面石材细节截图：docs/quality-v2/plaza-four-corners-stone-detail-r5.png。倾斜石块增加圆角与示意文字，但远视还不具备实景雕塑的精细辨识度，未判为高保真通过。
- 单项通过：node scripts/verify-four-inventions.mjs、node scripts/verify-render-regressions.mjs、npm run build。完整 verify 仍需等主楼 facade 与高度断言 82.95/81.6 的矛盾解决。
- 继续保留多 Agent 未提交变更，不在未经统一验收情况下部署线上。

## R6 官方细节进一步核验
- 西交官方 https://www.xjtu.edu.cn/info/1016/29926.htm 记载，造纸术雕塑可识别 20 张纸页；据此由原来四条示意弧线改为二十条分立的曲面金属页（形态仍为近似）。
- 参考 Commons 2013 年照片 https://commons.wikimedia.org/wiki/File:Sidafaming_Guangchang.JPG ，活字印刷改成圆角重型倾斜石块组合，添加非原刻字的示意刻纹，尚未实现真实浮雕拓扑。
- 验收图：plaza-four-corners-paper20-r6-mobile.png。手机镜头可看见四组构件，不遮挡建筑，但雕塑尺寸远小于近景真实照片所表现的视觉重量。
- 测试断言增加 20 张纸页，见 scripts/verify-four-inventions.mjs。
