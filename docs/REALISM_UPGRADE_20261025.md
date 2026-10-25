# 西交兴庆校园 3D：高真实度升级记录（2026-10-25）

## 基线确认

本文件记录对现有 Codex 工程的实际接续，不另起项目。

- 工程：`outputs/xjtu-campus-3d`；Three.js + Vite、OSM 预处理数据、无需云端密钥。
- OSM 建筑基底 139 个，有名建筑 114 个，路段 384 个。参见 `README.md`、`docs/ACCEPTANCE.md`。
- 建筑轮廓/位置有 OSM 来源；12 栋有 OSM 层数、0 栋有 OSM 建筑高度。文献高度仅限钱学森图书馆南楼，其他多数体量需要外观与实测校核。
- 原有中轴导览、地图选取、日夜、搜索与地面漫游均保留。

## 2026-10-25 本轮已实现

1. **图书馆南立面细化**：新增 `src/library-facade.js`，依托现有 OSM 基底和梯状主体，补充南向中央玻璃、横竖窗框、石材边框、檐口、入口玻璃、门厅与台阶。按五种材质合批，不复制任何网上照片/模型。外观为对公开照片的解释性重建，**不是测绘结果**；不提高建筑已公示的控制高度。
2. **植被更新**：在 `src/world.js` 中加入第三层不对称树冠，桌面使用更细致的球形细分，移动端保留低多边形版本；原有约 2,081 棵树的位置生成与实例化逻辑保持不变。树种、树高仍是程序化估计。
3. **土地材质**：新增 `src/ground-pattern.js`，在 OSM 绿地和林地区域叠加确定性、平铺的细小地面明暗变化，不使用航拍贴图或不明授权素材。
4. **回归测试**：`scripts/verify-facade.mjs` 自动检查材质合批、有限几何、图书馆控制高度和地理覆盖范围；`npm run verify` 已串联此项。
5. **窄屏界面修整**：移动宽度下选中建筑详情时隐藏原有大标题，避免其覆盖校园视野；不改变独立全景主页。

## 实际 QA

- `npm run verify`：通过，包括原始地理数据的已有验收与新增立面验收。
- `npm run build`：通过，`dist/` 更新。
- Edge Chromium 本地无界面 WebGL 实测，使用真实页面导航到 `#钱学森图书馆`。
- 图书馆立面/植被更新前的截图：`docs/edge-library-qa.png`。
- 本轮最终图书馆视角截图：`docs/edge-final-library-qa.png`。
- 项目整体视角：`docs/edge-qa.png`。
- 390×844 窄屏截图：`docs/edge-mobile-final-qa.png`，为桌面 Edge 的窄视口模拟而非 iPhone Safari 实机测试。

上述证据证明新版能在测试机渲染，不构成跨设备帧率、移动触控或照片级还原认证。本轮尚未进行新的 FPS 基准对比，也不把既有 113 FPS 历史数据移植给新版。

## 第二轮：主楼 E 座、界面聚焦与 Pages（同日）

- `src/main-tower-facade.js` 增补主楼 E 座可辨认的中轴玻璃、浅石材框架和顶部视觉轮廓；体量仍取自 OSM + 估高，不是真实测绘模型。
- `scripts/verify-facade.mjs` 现在同时检查图书馆与主楼 E 座：材质合批、有限顶点、地理位置与高度边界。
- 聚焦建筑后隐藏重复的大标题及重复的右侧标题，让更多画面留给真实 3D 模型；去掉无含义的“EXPLORER / 01”。
- 增设 `DESIGN_SOURCES.md`，保存具体素材出处、Taste 运行和未完成门禁。最终照片级 3DGS 尚需合法授权的多视角素材。
- `docs/edge-main-tower-final-qa.png` 为实际 Edge 本地测试截图；`docs/edge-mobile-final-qa.png` 为原窄屏基准。发布结果以 GitHub Pages 上实际 HTML 和资产核验为准。

## 核心限制与下一步

**决定真实感上限的并非代码行数，而是可合法使用的真实外观资料。**

| 下一步 | 数据要求 | 工程交付 |
| --- | --- | --- |
| P0 图书馆南北楼核对 | 官方公布的高度、多个视角实拍、立面可见比例 | Blender 制作具尺度的 GLB；同视角实拍/网页对照 |
| P0 主楼/中心一楼/校门 | 实拍正侧面、楼高/屋顶/开间 | 三套单独地标模型并保留来源与置信度 |
| P1 景观 | 可合法获取的地面照片、树种与道路尺度 | 贴图/几何 LOD、树木碰撞与实景材质 |
| P1 细节与性能 | GPU/移动设备实际浏览器读数 | 不同画质档帧率、绘制调用、显存/首屏加载 QA |
| P2 局部实景重建 | 有授权的多视角影像/扫描资料 | 在真实地理坐标上装配局部 3DGS 或摄影测量模型 |
| P3 全校扩展 | 东西南北拓展区域的合法数据 | 多区按需加载，不牺牲浏览器体验 |

路线对照：

- [西安交通大学网络信息中心虚拟校园](https://nic.xjtu.edu.cn/wlfw/wlfw/xnxy.htm) 与 [二三维校园系统](https://nic.xjtu.edu.cn/xxhjs/jcyyfw/xnxy.htm)：说明学校有既有官方成果；**网页公开介绍不代表模型授权可下载再发布**。
- [PeterZh6/cuhk-campus-3d](https://github.com/PeterZh6/cuhk-campus-3d)：延续成熟的地理数据/渲染分层、分级显示与拾取模式。
- [kaoukaoua/3DGS-Campus-Reconstruction](https://github.com/kaoukaoua/3DGS-Campus-Reconstruction)：参考多传感器采集、COLMAP/3DGS、SuperSplat 和 WebGL 展示管线；所用的西工大数据与模型**不能直接当成西交成果**。
- [Cesium Gaussian Splat LOD](https://cesium.com/learn/cesiumjs-learn/3d-guassian-splat-tilesets-lods/)：未来真实拍摄资产多且场景需要分区流式加载时再评估；目前无需因技术时髦而替换现有 Three.js。

**版权原则**：官网地图、景观照片、他人校园模型仅用于参考；未经授权不打包再分发。新增本地代码和生成的程序化材质不调用在线 API，无密钥。

## 发布状态

本轮实际更改在原工程本地工作区，已经构建验证；**未在本记录中声称已推送到 GitHub Pages**。公开链接是否包含本轮修改，必须以 GitHub 提交及网页检查为准。现场预览：`http://127.0.0.1:18865/#%E9%92%B1%E5%AD%A6%E6%A3%AE%E5%9B%BE%E4%B9%A6%E9%A6%86`。
