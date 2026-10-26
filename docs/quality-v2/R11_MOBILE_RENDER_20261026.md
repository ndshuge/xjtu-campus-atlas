# R11 iPhone 渲染稳定性专项 · 独立分支验收

日期：2026-10-26；基线 main `36170135addd3c16bebf2f179607e5ee4574043a`
工作树：`E:\CHATGPT\work\xjtu-r11-mobile-render`；分支：`feature/r11-mobile-render`。
严格不合并、不发布；未修改原始建筑、校门、树木坐标及道路布局。

## 复用已实现的能力
- R3 路面/广场 Y 深度分层、`verify-render-layer-separation.mjs`；
- R6/R9 植被细节、远近 LOD 滞回、纹理 mipmap/8x 各向异性与抽样；
- R9/R10 `OrbitControls`、单指平移/双指缩放和旋转、选中地标构图、标签遮挡控制；
- 原有的 Orbit 相机 near=1.5、far=4800，以及漫游 near=0.2 均未被改变。
以上未重复新建完整渲染器或控制器。

## 实际改动
1. `src/mobile-render-stability.js`：独立封装移动 DPR 像素预算、最低镜头高度、帧时间百分位和远景叶片 MSAA alpha-to-coverage（仅上下文有多重采样时启用）。
2. `src/world.js`：最小接入补丁。移动默认 `low` 真正使用 DPR cap=1.5；高画质维持 1.8；移动大画布有 235 万内部像素预算。视口、DPR 变化和档位切换同步重算；镜头飞行期间也强制最低离地 3.2m；上下文恢复及可见性恢复后刷新尺寸、计时与植被，不重新创建 OrbitControls。
3. 远景 alpha-tested 叶片对支持 MSAA 的环境启用 alpha-to-coverage，实测命中 3 个既有材质；未改物种、植被位置、LOD 距离或地图数据。该机制改善边缘采样的依据是渲染原理，不等于已经证明 Safari 动态闪烁消失。
4. 增加 `scripts/verify-r11-mobile-render.mjs` 单元/接入检查及 `scripts/qa-r11-dynamic.mjs` CDP 多帧和触摸自动化。既有 `npm run verify` 和 `npm run build` 均通过；build 保留了现有 JS 大包警告。

## 可复现测试机位
同一移动视口 390×844 CSS px、模拟 device DPR=2：
- 梧桐东道：`?inspection=avenue-east`
- 北门：`?inspection=north-gate`
- 四大发明广场：`#四大发明广场`（已有选中构图）
- 钱学森图书馆：`?inspection=library-north`

`scripts/qa-r11-dynamic.mjs` 模拟连续单指平移、双指放大与旋转/俯仰，拍摄交互起始、过程中两帧与最终稳定帧；还检测离地高度、JS 和 HTTP 错误、质量切换、DPR=1 复原及 `WEBGL_lose_context` 模拟丢失/恢复。四个机位**分开 Edge 进程**以免连续跨页面 CDP 触控状态污染；前两次跨页面测试确实产生了假阴性，原始结果保留。

## 数据：基线与最终（不同 GPU，不能直接用 FPS、加载时间做 A/B 结论）
修改前静态基线：Windows Edge / RTX 5060 Laptop GPU，4 机位绘制调用分别 84、298、179、267；三角形分别 491740、523193、538321、553405；加载计时分别 4454、4268、3705、3993ms。原移动渲染比例实际为1.8，canvas 702×1519 = 1,066,338 px。

最终单机位动态复测（Windows Edge / Intel(R) Graphics；不是 iPhone）：

| 机位 | 通过 | 画布像素（low） | 抽样 p50/p95 帧间隔 | 动作后绘制调用 / 三角形 | 测试时场景加载 |
|---|---|---:|---|---|---:|
| 梧桐东道 | 是 | 740,610 | 16.7/17.0ms | 81 / 496,494 | 6,288ms |
| 北门 | 是 | 740,610 | 16.7/17.0ms | 282 / 520,096 | 6,395ms |
| 四大发明广场 | 是 | 740,610 | 16.7/17.1ms | 157 / 546,241 | 7,285ms |
| 钱学森图书馆 | 是 | 740,610 | 16.7/17.0ms | 244 / 549,325 | 8,515ms |

最终低档 `585×1266 = 740610`，高档 `702×1519 = 1066338`，同视口低档相对原 1.8 减少 **30.55%** 内部像素，并非帧率增加30.55%。切换模拟设备DPR至1，画布为390×844=329160，验证动态更新。四个单独浏览器进程均记录平移量大于零、缩放相机距离变化、最低相机高度合格、模拟上下文恢复后继续绘制，JS/HTTP 错误数为0。

**测试局限**：这是 Edge Headless CDP + Windows GPU；帧间隔混入 CDP 截屏/后台调度，并非精确 WebGL GPU time。基线用 NVIDIA，最终数据中可确认 Intel 核显，不可跨适配器作性能提升推断。单张或有限多帧截图不能排除高速旋转时的 z-fighting、透明叶片闪烁、LOD 泵动。模拟上下文恢复不等于 iOS Safari 后台/WebKit 内存回收恢复测试。

## 验证状态
- PASS：`node scripts/verify-r11-mobile-render.mjs`、`npm run verify`、`npm run build`、`git diff --check`。
- PASS：四机位分别独立的 Edge 动态触摸/多帧截图，画布尺寸、高度保护和模拟上下文恢复。
- EXISTING：道路/广场深度分层由既有验证脚本检验；本轮**未**改共享道路几何，也不能宣称所有相交路面已视觉无闪烁。
- NOT VERIFIED：真实 iPhone Safari、高温与长时间后台恢复、真机掉帧/显存、闪烁完全消失；相机缩放中心在真机不同手势速度下完全不跳变也未验证。
- OUTSTANDING：仍需真实设备录屏与 Web Inspector 时间线排查物理 GPU、透明过绘和相交面深度争用；JS 主包 >750kB 构建提示尚存。

## 证据与重放
- 原始：`docs/quality-v2/r11-before/browser-results.json` 及 4 张机位 PNG；
- 最终：`docs/quality-v2/r11-final-{avenue,north,plaza,library}/report.json` 及各自多帧 PNG；
- 假阴性追踪：`docs/quality-v2/r11-dynamic/report.json`、`docs/quality-v2/r11-retest/report.json`；
- 命令：`node scripts/qa-r11-dynamic.mjs http://127.0.0.1:18977/ docs/quality-v2/r11-final-library library-north`，其他机位只换最后一个机位名（分别 `avenue-east`、`north-gate`、`plaza`）。
- 未来集成：由统一集成线程审阅并选择性合并 `src/mobile-render-stability.js` 与 `src/world.js` 的小补丁，严禁用本工作树覆盖其他线程的 `src/world.js`。

不合并 main，不 push，不发布。
