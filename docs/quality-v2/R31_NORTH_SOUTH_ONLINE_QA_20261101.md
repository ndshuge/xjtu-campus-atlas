# 兴庆 3D Atlas｜R31 南北建筑统一集成正式发布与线上验收

## 生产与 Git 发布
- **源码分支**：`integration/r31-north-south-buildings-20261101`，第一版集成提交 `ae1619bc6b894d35a816cd0a6e5eae46cb63bae3`。来自 R29 `da42a2e`，未触碰任何独立施工者的未提交文件。
- **Pages**：`gh-pages` SHA `748ca8c10429a488879bfe352020d7fe926813b0`，以前一版 `63fcf41` 为父提交，远端精确 HEAD 校验后执行普通非强推。只增加 `r31-unified-campus-buildings-20261101/` 的 30 个文件并修改根 `index.html` 的一个赛车入口；历史 R17–R29 预览保留。
- **公开地址**：https://ndshuge.github.io/xjtu-campus-atlas/r31-unified-campus-buildings-20261101/
- **直接进入赛车**：https://ndshuge.github.io/xjtu-campus-atlas/r31-unified-campus-buildings-20261101/?drive=1
- **首页**：https://ndshuge.github.io/xjtu-campus-atlas/
- 真实 HTTPS 从公网检查：首页、R29 旧版、R31 新版和赛车 GLB 均返回 200；根首页的赛车入口已改为 R31。

## 实际公开网站 Edge 验收
- `docs/quality-v2/r31-online-integrated-qa/results.json`：**3/3 profile pass**，桌面 1440×900 实际逐项检查 8 个新旧混合建筑（梧桐苑、励志东6、仲英东3、文治西18、校医院、外语楼、中心一楼、工程坊 A）；触摸模拟手机竖屏 390×844、横屏 844×390 各核验四栋（梧桐苑、励志东6、文治西18、工程坊 A）。共 16 次正确选择与近景，全部相机飞行完成、镜头接近、建筑专属资产计数 18、叠加组件计数 12；实际进入和退出校园赛车，**JS/HTTP 错误均为 0**。
- `docs/quality-v2/r31-online-homepage-qa/results.json`：正式首页三端跳转 R31，赛车真实四轮接地、六个路口碰撞支撑、正常退出返回地图，**3/3 pass，JS/HTTP 错误均为 0**。
- 两组 QA 证据均包含截图和原始机器 JSON，来自真实公开 GitHub Pages 的 Microsoft Edge/Edge 触摸模拟；**不是 iPhone Safari 真机验收**。
- 本地建模、道路、相机套件：**73/73**；原校园 `npm run verify` **40/40**；`npm run build` 成功。用户未人工签收照片一致性。

## 集成范围和严守真实性边界
- 生产 **18 个整楼专属资产**，**12 组新增局部细节资产**（对应 13 个 OSM ID，崇实书院双楼连接体只是一件），此前东一楼入口继续保留。
- 有来源但**未批准投入真实立面生产**：北部东21、东26、东11、东14、西1五栋仅 `productionReady:false` 的示意审查模型；东12钢阳台 `previewOnly:true`；工程坊 B 建筑身份确立但现状门面无可靠证据；老西迁纪念馆两份互相待核的旧馆候选；这些源码和身份信息已保留于独立的复审模块，但正式 3D 地图仍保留原体量。
- 施工者当前未提交：南部仲英楼 `src/assets/south/zhongying-building-asset.js`、北部梧桐屋顶候选、R28 建筑设施尝试、R30 HUD/碰撞优化，保持原工作目录和文件不变，待各自提交验收后再做下一轮统一集成。
- 本轮模型为照片引导的示意性建筑；外墙颜色/高度/入口朝向多不属实测，尚未对 139 个 OSM 轮廓全部实施 2026 实景逐栋核验。用户要求不遗漏的是**已完成的施工成果和证据**，不是把不可靠的草稿直接宣布为已完工建筑。
