# 兴庆 3D Atlas｜R17 + R8 真实物理赛车集成记录（2026-11-01）

## 范围与基线
- 校园源基线：`00ea14c40d8f4e7bd926d8ce891e60a63c733a19`，2026-11-01 01:55 CST；包含最近图书馆屋顶、远景植被与校园边界优化。基线来自 `E:/CHATGPT/work/xjtu-r15-unified-quality-20261030`，其已有未提交文件没有移动或覆盖。
- 独立赛车交付基线：`90fc00da7e4c6809b5d187a401a77dabe8da3939`；交付 ZIP SHA256 `29B28C92822FC917340DA4E6A150DD9DD9FC5778289D4CE440EFE234699D412E`。
- 合并实现位于独立 Git worktree `E:/CHATGPT/work/xjtu-r17-racing-integration-20261101`，分支 `integration/r17-racing-20261101`。
- 物理：`cannon-es 0.20.0` / RaycastVehicle，依循 Ian Curtis 上游固定版本 `f9d2457e94c18f71a8eca5884c68d943b6f1e9e5` (MIT)。赛车视觉：Kenney Car Kit 3.1 (CC0)；原作者许可证原文在 `docs/licenses/`。渲染：项目原有 Three.js 0.186.1 与 Vite 8.3.5。

## 交互与模块
1. 地图仍是默认模式；`src/app.js` 创建「赛车」入口，第一次点击时动态加载 `src/racing-mode.js` 和相应 CSS。初次加载普通校园页面不下载 Cannon/赛车模型。
2. `src/racing-mode.js` 将 R8 的 `src/racing/{physics,track,controls,visuals,camera-rig}.js` 接入 `src/game-mode-host.js` 的 `capture/restore` 和 `onCleanup` 生命周期；销毁单独的物理世界、碰撞体、输入事件监听、Three.js 车模资源、驾驶 HUD。
3. `src/world.js` 保持**唯一** `WebGLRenderer` 与 RAF。地图 RAF 在赛车模式调用 `driveModeHost.tick(dt)`，其中物理固定步长 `1/60` 秒，最多四个补偿子步；不导入赛车原型的 `src/main.js`。
4. 车体和四轮使用真实 Cannon 状态驱动。键盘 WASD / 方向键 / Space / C / R / Esc；手机横竖屏使用转向摇杆、油门、刹车、手刹、倒车、视角切换、复位和退出。输入失焦/隐藏自动清零。
5. 合成练车场 `createSyntheticTrack({origin:[1800,0,1800]})`；位于校园视觉坐标范围以外，车辆出生点为 `[1800,2.1,1782]`。所有静态碰撞代理、跑道可视模型共同偏移。校园原 OSM 道路数据、地形、高程、建筑数据没有修改。
6. 模式退出恢复原相机、轨道焦点、控件可用状态、原始地图模式和已有导览的暂停状态；赛车资源被释放。原 R17 游戏实验室 `r17-lab.html` 保持独立入口并纳入 Vite 多页构建，避免回归时从 dist 消失。

## 施工验收证据
- `npm run verify`：最新校园原有完整验证运行 exit 0（修正 Vite 多入口后）。
- `npm run build`：成功；独立赛车动态代码块与独立赛车 CSS 生成。
- `node --test tests/racing-integration.test.mjs`：4/4 通过，包括 Cannon 车轮接地、合成场位移/清理、连续 20 次 host 模式恢复、加速/刹车/转向、障碍碰撞。
- 实际 Microsoft Edge (Playwright headless) 下三种分辨率：1440×900 桌面、390×844 手机竖屏模拟、844×390 手机横屏模拟；实际按键和多点触控产生车辆位移，物理倒车可观测，场景能多次进入/退出，原相机/模式恢复；JS 与 HTTP 错误均为 0。
- 浏览器可核查 JSON 和屏幕截图：`docs/quality-v2/r17-racing-qa/browser-results.json` 及三种设备各自 campus/racing/returned PNG。已目视检查并修正校园页眉遮挡驾驶 HUD 问题。

## 精度边界与仍待测试
- 合成练车场只是实验性物理训练设施。**不宣称校园 OSM 道路具备核验过的车道宽度、真实坡度、高程、通行净空或合法驾驶路径；不可将练车场误写为真实校园驾车路线。**
- 真实 iPhone Safari 尚未进行设备级 GPU/触摸/热稳定性测试；Edge 移动模拟不能替代真机。
- 车辆动力学由游戏物理调校，没有汽车级测量认证。车速/制动手感可继续优化。
- 校园真实道路驾驶应等可信高程、路缘、坡面、障碍物和道路通行空间核验后，通过轻量本地碰撞代理启用，不修改原始 OSM。
- 本次独立预览不替代既有 Pages 首页、历史子目录、R17 游戏实验室。

## 发布与回退
- 目标 Pages 子路径 `r17-campus-racing-20261101/`；先核对最新 `gh-pages` 远端提交，仅新增此目录，保持其他历史文件。
- 源码发布前与发布后必须记录确切源码 Git SHA、Pages 部署 SHA、线上 URL；线上必须完成 JS/GLB/CSS 资源与交互的实际检查。
- 回退仅需撤除新预览入口（若经授权）；历史预览与原始赛车独立工程不改动。主校园普通模式不加载赛车代码。

## GitHub Pages 已发布且线上确认（2026-11-01 约 02:58 CST）
- 本轮已发布的功能源码 Git SHA：`69535aad81f32f071757bceae4a4cba0829df2bf`；包含已核实的校园基线 `00ea14c` 与赛车 R8 模块。
- Pages 独立部署 SHA：`2b52c902c34e52fc836205f1ac2109336c1dc991`。发布时从远端 gh-pages `83bccc064152d262103359390a1d46412c7a25db` 更新，**只新增** `r17-campus-racing-20261101/` 目录（28 个新文件）。
- 正式公开网址：https://ndshuge.github.io/xjtu-campus-atlas/r17-campus-racing-20261101/
- 线上 HTTP 实测：页面、race.glb、wheel-racing.glb、colormap.png、独立动态 JS/CSS、r17-lab.html 均 HTTP 200；旧 R17 预览与 Pages 首页仍 HTTP 200。
- 线上 Microsoft Edge Playwright 完整退出码 0，三组测试记录均 `passed:true`：桌面 1440×900，手机竖屏模拟 390×844，手机横屏模拟 844×390。包括首次进入真实四轮物理驾驶、W 加速或手机双触控转向+加速、真实物理倒车、复位、退出后的相机/模式恢复、重复进入退出、页面错误和 HTTP 资源错误检测；JS 错误数 0、HTTP 错误数 0。
- 线上测试报告：`docs/quality-v2/r17-racing-online-qa/browser-results.json`。屏幕证据：同目录 `desktop-1440-*.png`、`portrait-390-*.png`、`landscape-844-*.png`。已目视检查最终三类屏幕；校园主页页眉不再覆盖驾驶界面。
- 页面在真实 iPhone Safari 尚未验收，线上 Edge 手机设备模拟并不等于真机测试。合成练车场仍按非真实校园道路标注，校园 OSM 源数据没改。
- 此后如有 QA 测试脚本/记录补充提交，不改变上述已发布功能源码和 Pages SHA；主项目原有未提交文件继续保留。
