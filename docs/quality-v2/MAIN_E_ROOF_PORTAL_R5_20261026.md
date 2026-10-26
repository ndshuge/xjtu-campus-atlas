# 主楼 E 座屋顶开敞框架 R5 — 摄影参照施工 (2026-10-26)

## 参照与版权
- Wikimedia Commons https://commons.wikimedia.org/wiki/File:Zhulou_xjtu.jpg — 摄影者 Danielinblue，摄影 2012-11-06，CC BY 3.0。页面明确地点为西安交通大学兴庆校区“new teaching building”（主楼），可用于辨认正面中央幕墙和顶部开敞框架。本轮记录来源和许可，不复制图片进项目，不制作从照片转换的纹理。
- 公共媒体 2025 年的宣传照片 https://www.eeban.com/thread-235667-1-1.html 出现主楼正面顶部深色椭圆状构件，但无法独立确认摄影具体日期、图片原作者、拍摄位置与许可，仅可作方向性二次线索。建模主要依据上列 Commons 源。
- 精确屋顶构件直径、悬挂方式、离地高度和 2026 年现状尚未测量。模型明确标识“Historical photo-informed approximate ornament; unsurveyed”，不宣称摄影测量还原。

## 本轮实际改动
- 新增 `src/main-e-roof-detail.js`，在原主楼 E 座顶部开敞立面内增加一组有真实深度的椭圆状深色屋顶遮挡构件、金属边缘和两侧支撑，未移动 OSM 建筑中心或修改估高。
- `src/world.js` 接入到 `mainTowerFacade` 旁的独立分组，不破坏原主体几何。
- 新增 `scripts/verify-main-e-roof-detail.mjs`：校验全部网格几何非空、位于建筑原 OSM 轮廓及高层开敞框架之内、保留“非测绘”标识；集成 `npm run verify`。

## 验收与剩余差异
- 全部 `npm run verify` 与 `npm run build` 已通过。Vite 8.3.5，34 modules。
- 正式生产预览哈希 `index-BaKmtPs_.js`，冷启动本机独立预览端口已核对一致。
- 图片：`main-e-r5-desktop.png` (1440×900)、`main-e-r5-mobile.png` (390×844) 来自真实 Edge Headless WebGL 渲染。第一张手机截图抓到加载状态，已重新截图并替换为完整页面。
- 对照：深色椭圆构件与摄影参照轮廓类别一致，但照片没有测绘尺度，模型还缺少精确支架连接、幕墙反射、侧翼建筑真实入口与楼前台阶。整体仍属于程序化中等精度，不合格为“照片一样”的目标。
- 不含任何新导入的学校版权图像或纹理；没有执行真实 iPhone Safari 测试。

## 提交约束
分支 `feature/maine-roof-photo-r5`，基于已上线 R4 SHA `969f29e`。仅合并本轮经过核验的源码、测试、报告与精选 QA 截图；不重置其他施工工作区。若线上资源仍旧，检查 gh-pages 分支与 CDN 实际资源哈希而不是宣称上线。
