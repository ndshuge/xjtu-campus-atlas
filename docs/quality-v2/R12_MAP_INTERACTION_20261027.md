# R12 兴庆 3D 校园｜地图交互、手机信息层级与 Edge 实测

日期：2026-10-27。独立工作树 `E:\CHATGPT\work\xjtu-r12-map-interaction`；分支 `feature/r12-map-interaction`；基线 `165a0a355faef670a87f7a7a3c07ddce9095b5b4`。主仓库其余工作树保持不动；**不合并 main、不推送、不发布**。所有软件实现修改均限于 `src/app.js`、`src/map-chrome.css` 和 `src/world.js` 的交互区段。没有修改楼宇、道路、树木、地面或材质几何数据。

## 变更内容和实际效果

1. **地图优先的信息收纳**：手机保留“全景/漫游/更多”核心底部条；将俯视、环绕、光照移入按需浮层；保留复用原按钮/绑定，不另造控制器。桌面直接展开原控件并隐藏无内容的“更多”。小屏隐藏原高占比序言，但桌面保留完整展示。
2. **搜索入口与地点信息**：手机提供位于左上地图边缘的搜索快捷入口，点击复用既有探索列表和搜索过滤；点选建筑后搜索入口避让详情；详情变为紧凑底部地点卡，支持展开、步行、实景照片与关闭。关闭后手机探索列表恢复折叠，不遮住地图。桌面保留原左侧列表。
3. **动效材质取舍**：统一信息卡/控件的圆角、间距和 320px 紧凑适配；只对底部常驻操作条保留轻量背景模糊，其他弹层优先清晰底色/少量阴影；尊重系统减少透明度和减少动态效果。不是用到处堆玻璃表现 Apple 风格。
4. **OrbitControls 原路径保留**：没有替换 R10/R11 的 `zoomToCursor`、damping、触控手势映射和地面保护。建筑焦点切换新增视场角（FOV）连续插值；进入步行从当前观察相机进行位置/朝向/FOV 渐变；退出步行通过当前朝向抬升回轨道视角而非瞬间改变 y/FOV；已启用减少动态效果时无动画。
5. **触控防误选**：对多触点计数；双指操作不触发单指点选；长按 560ms 独立于点击，移动超过 7px 取消；命中现有建筑拾取对象时仍走原选择回调；无命中给出提示。实现不新增触控库。
6. **标签稳定性与遮挡**：继续沿用 R10 标签数上限、优先级、重叠规避和边缘裁剪；保留既有坐标缓动兼容性，在慢帧时改为基于时间的追踪补偿；在距焦点 800 内对前 12 个高优先级标签每 10 帧轮询单个建筑可见性射线，避免远处被建筑挡住的标签直接浮在前景。不是全场景逐标签每帧 raycast。

## 修改前后证据

截图由本机真实 Microsoft Edge DevTools Protocol 采集。**先等完整场景就绪，再保存；不是 Vite 启动画面、不是模拟设计稿，也不是 iPhone Safari 真机。** 旧版截图来自明确的 R11 Git `165a0a3` `dist` 静态导出，新版截图来自本分支最后一次通过的 `npm run build` `dist` 静态预览。

| 视口 | R11 修改前 | R12 生产构建后 | 人工观察 |
|---|---|---|---|
| 390 × 844 | `r12-map-interaction/before-ready-390-single.png` | `r12-map-interaction/after-production-390-single.png` | 高位标题与缩放按钮不再占屏；搜索/底部操作更集中 |
| 1440 × 900 | `r12-map-interaction/before-ready-1440-single.png` | `r12-map-interaction/after-production-1440-single.png` | 桌面地点列表、标签、小地图仍在；没有空“更多”按钮 |
| 320 × 720 | `r12-map-interaction/before-ready-320-single.png` | `r12-map-interaction/after-production-320-single.png` | 狭窄视口无横向溢出；顶部搜索与右侧指南针分离 |
| 430 × 932 | `r12-map-interaction/before-ready-430-single.png` | `r12-map-interaction/after-production-430-single.png` | 底部工具条和探索收起条互不重叠 |
| 768 × 1024 | `r12-map-interaction/before-ready-768-single.png` | `r12-map-interaction/after-production-768-single.png` | 平板纵向布局无横向溢出 |

手机地点卡已通过实际打开、展开和关闭操作检查。一张静态版详情截图虽显示卡片，但背景 WebGL 偶发为空帧，**不作为正式建筑构图证据提交**；上表五组对比来自完整加载的全景画面。

## 实际 Edge 交互与自动化

- **PASS — 五种视口**：生产 `dist` 同一个 Edge WebGL 页面切换 320/390/430/768/1440px，`window.__campusReady` 为 true，`documentElement.scrollWidth>innerWidth` 全为 false，静态全景截图完整；结构化结果 `r12-map-interaction/edge-production-viewport.json`。
- **PASS — 搜索/点选**：独立 CDP 连续测试 390px 输入“钱学森图书馆”筛得 1 条记录；点击后地点名称正确，详情展开与关闭点击执行；开发版曾目检接近正面的图书馆视角，但静态版选中建筑的完整画面仍需重新采集，不能以空帧截图判定构图达标。首次测试记录 `r12-map-interaction/edge-qa-results.json`。
- **PASS — 手机 UI 复测**：静态构建重新打开搜索、选中图书馆、展开及关闭详情，关闭后探索面板恢复折叠；“更多”能开合。记录于本轮人工复核；先前追加录制存在**陈旧诊断快照**，未以其模式字段作漫游证明。
- **PASS — 相机状态机（390px 开发版 CDP 实时诊断）**：进入漫游记录到 `mode='walk'`，转换期间 `walkTransition=true`，结束后 false；退出记录 `mode='orbit'`、`cameraFlight=true` 后 false。均见 `edge-qa-results.json`。没有宣称人眼 60FPS。
- **未验证 — iPhone Safari 双指/长按手感、持续 FPS/热节流**：独立 CDP 双指操作在软件渲染模式上发生 `Input.dispatchTouchEvent` 超时；不能据此证明真实 iPhone 触控完全达标。原 OrbitControls 的移动缩放机制没有删除。
- **测试环境限制**：一个连续开多 Edge 3D 页面案例的第三个页面开始 WebGL fallback；单页面重复切换五宽度全部成功。软件 WebGL 场景诊断约 3–4 FPS，与实体手机速度无可比性。后续额外诊断流程截图也曾遇 DevTools 超时，失败记录不冒充 PASS。
- **完整工程**：最新 `npm run verify` PASS；`npm run build` PASS；`node --check` PASS；`git diff --check` PASS。构建 JS 约 764kB，仍触发原先的 >750kB warning，**没有为消警告擅自调大阈值**。

## Apple / Taste / Designeer 实际应用记录

已读取：`E:\CHATGPT\.agents\skills\apple-web-design\SKILL.md`、系统 Apple Web Design 工作流、Taste 的 `design-taste-frontend/SKILL.md` 与 `references/app-screens.md` 全文；访问 [Designeer resources](https://designeer.xyz/resources) 与 [inspiration](https://designeer.xyz/inspiration)，并查看 [Motion](https://motion.dev/docs) 和 [Base UI](https://base-ui.com/react/overview) 原始文档。取用**内容优先、语义化按钮、可中断过渡和低频操作收纳**等原则；本项目是 vanilla Three.js/OrbitControls，拒绝仅为动效再安装 Motion/React/UI 框架。Taste app `draw.mjs` 运行过一次，库中仅支持 creator 等预设而无“3D地图”类型，**未机械照搬 KPI 面板布局**。最终 Taste `lint.mjs ... --app` 返回 **0 FAIL、8 WARN**（旧介绍/时间补零两项，另有 4 处轻微阴影与两处包含减透明度回退在内的玻璃检测）；已将实用玻璃材质缩减为一个底部常驻条。视觉证据使用真实 Edge 截图检查，而非仅依赖 lint。

Mice Hole 的本机 Skill 门禁对 Taste 两份 `C:\Users\...` 原始路径有沙箱读写冲突，读取完整文件须通过已授权 Hanako Bridge；没有关闭或绕过 Skill 管控，也未修改其程序文件。这一门禁原路径识别仍需工具链线程处理，本分支不扩大作用域。

## 尚未达标与集成建议

1. **仍需真机 iPhone Safari**：连续双指缩放/旋转、长按反馈、触控流畅度和温升、建筑碰撞保护，以及 430px 实体设备安全区；Edge 模拟宽度不替代这些测试。
2. 标签的射线遮挡只覆盖高优先级、近距离且限频；尚无真实手机 GPU 成本量化和跨建筑透视误判 A/B 数据。单建筑复杂场景仍要人工验证入口遮挡，不能声称地图级全球遮挡完工。
3. 大模型包 JS warning 和真实建筑缺图纸属于其它分工，不在本线程触碰。
4. **集成顺序**：先 cherry-pick `21bfca6`（app + 新 CSS），再 cherry-pick `4bc66ae`（共享 `src/world.js` 的交互段落），最后 cherry-pick 本文/微调提交。集成线程对 `world.js` 做按函数 hunk 合并；与其他 R12 楼宇、植被、道路/渲染变更保留对方几何，不整文件覆盖。集成方负责合并、发布和真机验收；本线程无权发布。
