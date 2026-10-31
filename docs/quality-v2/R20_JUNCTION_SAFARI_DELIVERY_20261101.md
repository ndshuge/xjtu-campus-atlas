# 兴庆 3D Atlas｜R20 路口物理、Safari 自检与入口修复

## 施工源
- R19 源基线：`c247471e372634ad6b4b0ce22523d515cc59c8e6`。
- R20 独立工作树：`E:/CHATGPT/work/xjtu-r20-junction-safari-20261101`。
- 改动范围：`src/racing/network-physics.js`、`src/racing/road-surface.js`、`src/racing/safari-qa.js`、`src/racing/safari-qa.css`、`src/app.js` 与新测试脚本；不修改原 OSM 文件、不改变唯一 Three.js Renderer 和 RAF。

## 问题根因：网站主页没有赛车
用户发现公开在线版没有赛车。2026-11-01 通过 Edge 访问
- `https://ndshuge.github.io/xjtu-campus-atlas/`：页面 HTTP 200，加载的是独立静态旧版 `assets/index-D6S08kf6.js`，页面上 `#race-entry-btn` 数量 **0**。
- `https://ndshuge.github.io/xjtu-campus-atlas/r19-campus-road-network-20261101/`：HTTP 200，`#race-entry-btn` 数量 **1**，实际点击后物理赛车在梧桐东道生成且四轮接地，110 条路段载入；页面 JS 错误 0，HTTP 错误 0。
原因：此前独立预览发布没有同步提供主 Pages 首页导流入口。解决方式是发布新 R20 子目录后，只在 Pages 根 `index.html` 添加清晰的赛车入口，跳转至 `r20-campus-junction-20261101/?drive=1` 并自动进入真实车辆驾驶，保持旧首页原有 CSS/JS/功能和 R17/R18/R19 目录。`?drive=1` 与 `?safariQa=1` 可组合使用，本地浏览器三个入口已实测无 JS 错误。

## R20 精度改进
- R19 物理路面全部以 `BASE+.14` 为顶面；AtlasWorld 可视道路中主干道顶面 `BASE+.145`，普通道路顶面 `BASE+.125`，存在精细错位。R20 统一按 `CampusWorld.buildRoads` 的既有规则计算碰撞体顶面。
- 仅在 OSM 道路共享顶点处，以小型 Cannon 圆柱生成轻量路口支撑。无共享点的线条交叉不生成路口支撑，也不会改动可视道路模型和 OSM 数据。物理仍为平面**估算**，不是实测高程、坡度或合法机动车行驶许可。
- 继承原 130m 局部碰撞流式更新；支撑体随驶出邻域释放，双次销毁不留静态体。

## iPhone Safari 验收现状
- Windows 本机设备管理器只看到 Bluetooth 分类的 iPhone，没有 USB Web Inspector 调试会话，因此 **没有完成真实 iPhone Safari 验收**。
- 访问新 R20 版本时加 `?safariQa=1`，才会动态加载设备侧自检面板。默认浏览不加载此工具。
- 自检面板记录页面帧率/渲染像素、驾驶速度/接地/所在路段、pointerdown/up/cancel 与最大并发触点、横竖屏和页面错误；只在当前浏览器保留，手动保存或分享 JSON，不会自行上传。
- 报告固定标记 `UNVERIFIED_NEEDS_DEVICE_REVIEW`；网页 User-Agent 只能作为线索，不是实机证明。真人使用 iPhone Safari 打开并采集报告后仍需审查。

## 自动化与截图
- 旧校园 `npm run verify`：40/40 通过，exit 0。
- 赛车相关 `node --test tests/r20-junction.test.mjs tests/r20-safari-qa.test.mjs tests/r19-road-network.test.mjs tests/r18-campus-drive.test.mjs tests/racing-integration.test.mjs`：22/22 通过，exit 0。
- Vite build：成功，R20 Safari QA JS 和 CSS 均按需分包。
- `docs/quality-v2/r20-driving-qa/results.json`：Edge 桌面 1440×900、手机竖屏模拟 390×844、横屏模拟 844×390，全部 `ok:true`，JS 和 HTTP 错误 0；前进、物理倒车、选路、练车场切换、退出后还原、桌面连续五次复位均通过。
- `docs/quality-v2/r20-safari-panel-qa/results.json`：Edge 手机模拟启动设备记录、同时两指控制、触控取消、退出、导出 JSON，pass true；记录最大并发触点 2，触控 cancel，导出仍标记 UNVERIFIED。**不能称为真实 Safari 测试**。
- 新 R20 Pages 独立子目录发布后另行核验线上真实驾驶和根首页导流；功能部署与最终 Git SHA 以成功发布的记录为准。

## 正式上线与公网复核（2026-11-01）
- 功能源码提交：`99caaf10515d84a0fd0434fc23170b77bb29b232`。
- 独立 R20 预览 + 网站首页入口发布提交：`e08ad12246ef7731f0f2abf1113c0f800802a07a`。基于远端 `gh-pages` `40b3addc8d03d4aded8374ea82d449ee96b5eafc`，改动严格限定到主页 `index.html` 与新 `r20-campus-junction-20261101/` 目录，历史版本与其他资源未删改。
- 网站首页：https://ndshuge.github.io/xjtu-campus-atlas/ 。首页新增明显的「校园赛车 · R20」链接，点击直达 https://ndshuge.github.io/xjtu-campus-atlas/r20-campus-junction-20261101/?drive=1 ，不需要第二次点击即可进入物理驾驶；退出后为 R20 校园地图。
- **公网实际浏览器根主页全链路**：`docs/quality-v2/r20-homepage-online-qa/results.json`，Edge 桌面 1440×900、手机竖屏模拟 390×844、横屏模拟 844×390 全部 PASS，源 HTML 可见 CTA，点击后 R20 自动驾驶在梧桐东道生成，四轮接地且 6 个共享路口支撑体载入；退出成功，JS/HTTP 错误 0。退出码 0。
- **公网 R20 驾驶全回归**：`docs/quality-v2/r20-driving-online-qa/results.json`，上述三种设备模拟全部 PASS，真实执行加速、制动/手刹、物理倒车、梧桐东西道起点切换、独立练车场切换、原校园模式还原、5 次桌面复位；JS/HTTP 错误 0，退出码 0。
- **公网设备自检演练**：`docs/quality-v2/r20-safari-panel-online-qa/results.json`，Edge 手机模拟激活 `?safariQa=1`，记录双指峰值 2、取消事件 2、8 次采样，成功保存 JSON，结果始终 `UNVERIFIED_NEEDS_DEVICE_REVIEW`。**这不是 iPhone Safari 真机实测**。
- 用户使用 iPhone Safari 时可直接打开 https://ndshuge.github.io/xjtu-campus-atlas/r20-campus-junction-20261101/?drive=1&safariQa=1 ，在自检面板点击「开始记录」，驾驶、横竖屏切换、退出并点击「结束记录」与「保存/分享 JSON」，将 JSON 提供给施工者复核。
- 之前线上首页没有赛车的根因已修复：不再只是一个未关联的历史子目录，首页 CTA 真实直达 R20 模式。

## 已知限制
六个起点与 110 条连通 OSM 道路不代表逐个转角实测净空。未经调查的坡度、高程、树木、路缘采用近似代理；相对平面模型仍可能出现不可信接触。未获得真实 iPhone Safari 遥测，待用户在设备端通过 `?safariQa=1` 完成并分享导出报告。
