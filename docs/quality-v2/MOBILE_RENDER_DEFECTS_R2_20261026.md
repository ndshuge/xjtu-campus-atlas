# 手机端渲染修复 R2：几何分层与高清采样（2026-10-26）
Branch: fix/mobile-ground-tree-gates; Baseline: d69386a R8.

## 来自用户真实 iPhone Safari 截图的缺陷
- 门区视觉漂浮/空间错位，门体与场地关系不自然。
- 远景斜视时道路/铺装存在动态闪烁。
- 树木近中景叶片、枝干显得模糊；部分过于细碎。

## 已完成工程修复
1. R1 commit `38b9a4c`：orbit camera near/far 0.6/6000→1.5/4800，叶贴图 mipmap + trilinear + anisotropy 8，alphaTest 减轻远景遮罩消失。
2. R2：R6 主干道路面高度 `BASE+.125` 不动；道路两侧新增步道抬至 `BASE+.185`、路缘 `BASE+.195`，梧桐东道的中心线调整至 `BASE+.225`，明确避免与主路仅差 0.008～0.030m 的深度争抢；大尺度原 OSM 道路线型不改变。
3. 新增 `scripts/verify-render-layer-separation.mjs` 并纳入 `npm run verify`，校验步道、路缘、中心线和主道路之间在 y 轴具有稳定距离；原始 `verify-road-ground.mjs` 的验收区间同步更新，但保留 `verify-campus-ground` 上限（不得把浅地面饰面误变高架地形）。
4. 手机默认 WebGL pixelRatio 上限由 1.5 提至 1.8；不无限追求 3 倍高 DPR，性能仍需 iPhone 实测。

## QA
- `npm run verify` → 0、`npm run build` → 0。
- `scripts/verify-render-layer-separation.mjs`: pass, road Y 1.225、sidewalk 1.285、edge 1.295、centerline 1.325，三组数据为最终绝对 Three.js 单位。
- Edge Headless WebGL 1440 与 390 截图在 `docs/quality-v2/mobile-depth-r2/` 以及门区专项 `mobile-depth-r2-gates/`。
- 高密度 390px × DPR 2 测试在 `mobile-depth-r3-dpr2/`，实际 canvasWidth 702（设备像素宽度 390 × 1.8）；两张场景 JS/HTTP 错误 0。Desktop/390 的 QA 日志无浏览器错误。测试 FPS 属 Windows RTX 5060 上的 Edge 无头，**不是 iPhone 真机帧率**。
- 人工截图：道路边缘、中心线在静态截图无显著条纹冲突，树木轮廓较低 DPR 对比更清楚；未见地表整块缺失。
- **未通过**：真实 Safari 运动中的连续帧闪烁复现/验证；三维北门与道路/围墙之间的照片级空间吻合，南门牌匾与标签不同中心点是原设计为避免阻挡 OSM 通道的显式偏移，而非经过现场测量的坐标。未擅自整体下移校门。

## 结论
工程缓解通过，尚不足以声称用户真机观感全部没有错误。发布时只能称“R2 渲染优化”，不能称“全部问题解决”；等待新真机运动录像再次验证闪烁并补齐校门周边的现场材料。未经证据确认不可为消除视觉漂浮擅自移动校门。
