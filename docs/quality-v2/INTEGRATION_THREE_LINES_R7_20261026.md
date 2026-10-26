# 兴庆 3D 校园 R7 三线统一集成与发布前验收
记录日期：2026-10-26

## 安全恢复与合并
- 初始 main: `5564a86a3cc7b12a22841dafff07a582b8c1b0f2` (R6)。
- 三个独立已提交来源：建筑 `0d53e6e4f3988affa439bd06a3c3f092d655bc32`，道路 `bdcf9c0c39db07b4820f5feb5392a3fff74f0f85`，校门 `46f28820386e01f15b375eff3aa72b88310c8bd6`。
- 唯一独立集成工作树 `E:\CHATGPT\work\xjtu-integration-roads-buildings-20261026`；所有来源合并无 Git 冲突。未修改原分支工作树、其他线程未提交内容。
- 建筑模块原来只在 `building-review.html` 的实验 Hook 内有效；已通过 `src/world.js` 正式接入，生产网页不再依赖 monkey patch。
- 道路模块复用原 `addAvenuePaving` 正式挂点，沿原 OSM 中心线生成已证据覆盖的 44 个路侧步行饰面、49 个路缘饰面；四大发明广场 4 个基座示意，不擅自重建图书馆地形高差。
- 围墙与校门代码直接采用已提交 R7，此外仅应用已验证的最小北门手机摄影对照相机补丁（非用户默认相机），未重新造墙或猜测材质。

## 根因修复：地标截图伪阳性
- 原浏览器 QA 在图书馆之后跳转四大发明广场时，只有 URL hash 改变；单页未重新加载，使截图标成“四大发明广场”却仍选择“钱学森图书馆”。
- 修复 `scripts/qa-render.mjs`：每个地标/宽度的独立查询参数确保文档导航，再强制断言实际 `runtime.selected` 是预期名称，不一致立即失败。
- 原错误广场截图不能用于验收；修复后的双尺寸截图 `docs/quality-v2/integration-roads-buildings-20261026/qa-corrected/` 已验证显示广场与雕塑。
- 新增的建筑、道路专项验证已接入单一 `npm run verify`，杜绝“独立模块测试通过但未进入主页面”的错误判断。

## 三线合并后的实际测试
- `npm run verify` 返回 0：包含旧有 R6 植被避让、建筑外形、OSM 道路/交叉口、广场、校门净空等验证。
- `npm run build` 返回 0：Vite 8.3.5、37 modules；生产脚本 `dist/assets/index-BS1A1rQO.js`。
- 真实 Edge Headless WebGL 两轮稳定自动测试均退出 0（Windows RTX 5060 硬件，非 iPhone 真机）：
  - `docs/quality-v2/integration-three-20261026/check-gates/browser-results.json`，北门、南门各 1440×900 与 390×844；
  - `docs/quality-v2/integration-three-20261026/check-plaza-southeast/browser-results.json`，东南门、四大发明广场各 1440×900 与 390×844。
  - 全部地标 `runtime.selected` 正确，JS 错误 0，HTTP 错误 0；北门摄影模式无需地点选择。
- 人工审查：北门弧形跨路门楣/通道已可见但手机视角显得过小；南门保留无阻挡入口和历史照片支持的标识；东南门刻意只做无顶棚定位示意；四大发明广场显示独立四基座铺装，但雕塑仍为粗略轮廓，不具摄影级真实性。
- `main-e-1440.png` 与 `avenue-east-1440.png` 来自合并建筑与道路的独立有效预览；图书馆正面视角、真实广场视角已另行纠正。

## 参考资料与版权界限
- 学校官方钱学森图书馆结构资料（2016-11-21） https://news.xjtu.edu.cn/info/1219/153497.htm，区分南北楼历史与官方总高 49.75m。不是施工剖面图。
- 梧桐东道官方道路整修报道（2024-09-20） https://news.xjtu.edu.cn/info/1002/214178.htm；西交教育基金会 2025-05-14 关于四横四纵的文字资料 https://www.ef.xjtu.edu.cn/info/1845/7841.htm。
- 北门官方历史报道（2015-12-02） https://news.xjtu.edu.cn/info/1033/11054.htm；浮雕官方说明（2025-12-09） https://dwxcb.xjtu.edu.cn/info/1085/17811.htm；完整版权与日期缺口参见 `docs/quality-v2/GATES_PARALLEL_R7_20261026.md`。
- 原校方摄影图片未导入纹理；现有程序化建筑窗带、绿化、围墙属于视觉示意，不能称已经按 2026 竣工实况还原。最关键的真实下沉庭院、高差和弧形通道仍须等待可核实的建筑平剖图与定位。

## 阶段结论与未通过事项
- 阶段性几何、空间连续性与桌面/手机（CSS视口）的可运行验收：**通过**。
- 逐栋与实景摄影一致性、2026 年竣工门区、真实 iPhone Safari、移动端实际帧率、逐段围墙高度材质：**未验证/不达高保真**。
- 本轮仅以**明确标注示意**的阶段版本进行安全提交流程。上线必须重新核对远端 main 与 gh-pages，绝不能强推、丢弃其他工作树或用主工作树旧版 dist 发布。
