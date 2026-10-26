# 兴庆校区｜用户 iPhone 渲染缺陷整治 R3 — 2026-10-26

## 用户报告
手机真实截图与口述：校门似乎漂移/悬浮，远景地面移动时闪烁，树木发糊。所有原始截图留在对话，未转存公开仓库。

## 已实现的代码修复（与阶段提交 38b9a4c、d09e746 构成连续修复）
1. `src/world.js`：orbit camera near 0.6→1.5、far 6000→4800，降低远景深度量化问题；手机 WebGL DPR 上限1.5→1.8，且修复了 quality(high) 重置到1.5的回退 bug。
2. `src/campus-vegetation.js`：三线性 mipmap/8x 各向异性叶片过滤，调整 near/far alphaTest，保留已建设的 R6 分叉枝干和远近景 LOD，未退回球形树冠。
3. `src/campus-road-ground.js`、`src/avenue-paving.js`：步道/路缘/中心线与主车道路面之间使用稳定、独立 Y 级别（道路 1.225、步道1.285、路缘1.295、线1.325）；真实 OSM 中心线不变；新增分层几何自动测试。
4. `src/world.js` 道路基础：主干道与普通道路在交叉口采用明确深度层级 (1.245 与1.225)，并统一沥青基础色，避免面片争夺造成斜向色块/锯齿。这仍不是现场铺装测量。
5. `src/plaza-terrain.js`：四大发明广场底层铺装与原 OSM 通用地表原来仅差0.005m，现按0.075m以上分开，步行交叉面/绿地/雕塑基础也依次排布；整体仍是薄饰面，没有新增地形挖方或改变雕塑位置。
6. 校门：`src/secondary-gates.js` 半透明标志柱不再近乎幽灵，且 `scripts/verify-gates.mjs` 新增北门、南门和所有侧门基座的 ground contact 检查。实际几何检查表明门柱底点与BASE约1.1一致，不存在全模型沿Y轴上移的证据。非北南门采用贴近示意门柱的专用相机聚焦（标签仍用OSM真实坐标），而不是将入口当高层建筑聚焦造成“漂移”。实际门位与2026竣工状况未测绘。

## 检查与证据
- 每轮 `npm run verify`/ `npm run build` 都通过。道路/门/广场原有约束全部保留。新增 `verify-render-layer-separation.mjs` 纳入完整验证。
- Chromium Edge Headless 390×844、DPR2输入、真实WebGL画布702像素宽 (1.8 倍Cap)，与1440桌面多视角图片分别存在 `docs/quality-v2/mobile-depth-r2`、`mobile-depth-r3-dpr2`、`mobile-render-r4-gate-focus`、`mobile-render-r6-unified-road`、`mobile-render-r7-plaza`。逐地点 QA 检查 selected 和错误，最近全部 JavaScript/HTTP 错误为0。
- 侧门前后图发现道路面片叠加的斜向破面；调整主次深度后锯齿争抢消失；之后统一相交车道路色，避免出现明显暗块。图像：`mobile-render-r6-unified-road/place_东南门-390.png`。
- 广场图片 `mobile-render-r7-plaza/place_四大发明广场-390.png`：可见四处雕塑基座、广场薄饰面与绿地，无明显静态缺失/交错。
- **限制**：所有 FPS 来自 PC RTX5060/Windows Edge，不是 iPhone 真机；没有 macOS/iOS Safari Remote Inspector 与用户实际拖动视频，不能证明动态闪烁百分之百消失。当前侧门只是有OSM依据的示意柱，不等同于照片级真实校门；某些建筑、树冠依然是程序化风格。不能用静态截图宣称全场景所有视觉错误彻底消失。

## 发布门槛
只允许作为“渲染稳定性 R3 阶段改进”安全发布；需要独立核查 Git 远端 main、修改记录并先完整 `verify` + `build` 与浏览器截图。不得宣称真机完美，也不得强制覆盖其他线程未提交的源码和 QA 文件。
