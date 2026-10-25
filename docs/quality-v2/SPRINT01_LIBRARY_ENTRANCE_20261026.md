# Sprint 01 · 钱学森图书馆入口改进 R1（2026-10-26）

## 两条施工线
在 ChatGPT + Mice Hole 与 Codex 已整合的源码提交 c3db0a8 上继续，检查并保留所有未跟踪 QA 文件及历史资料，没有重置或覆盖其他 Agent 的工作。

## 真实资料核对
- 西交官方钱学森图书馆介绍：https://www.xjtu.edu.cn/tsda/qxstsg.htm 。旧北楼建于 1961 年，南楼 1991 年投入使用，1995 年命名。**南北楼不得当成同一个建筑形态**。
- 2026-10-13 中国之声/扬子晚报报道外景：https://www.yangtse.com/news/yw/202610/t20261013_401928.html 。确认 2026 年仍有外景影像素材，尚无可合法再分发的测绘资料。
- 2025-06-04 科普时报：https://www.zgkpw.org.cn/kxjdt/content_350098.html 。把钱学森图书馆描述为“书山形”建筑，入口处展室与铜像的关系可供下一轮取景研究。
- 2019 西交西迁博物馆：https://jdxqmuseum.xjtu.edu.cn/info/1046/1378.htm 。北馆门前曾有青年男女雕像，但不足以证明 2026 年两像准确位置与尺寸，本轮不凭空添加。

## 本轮改造
- `src/library-facade.js` 的南侧玻璃入口从单层大幕墙变为带有进深的门廊，添加入口两侧石质柱、独立分格玻璃门、横梁和突出屋檐。
- 保留既有 5 类材质合批及 OSM 平面，避免把入口升级变成一批新的独立 draw call。
- 自动测试 `npm run verify` 通过，生产构建 `npm run build` 通过；没有改变全校地图与移动端手势。

## 实际截图对比
- `docs/quality-v2/sprint01-library-before-desktop.png`
- `docs/quality-v2/sprint01-library-before-mobile.png`
- `docs/quality-v2/sprint01-library-after-desktop.png`
- `docs/quality-v2/sprint01-library-after-mobile.png`
- 人工检查结论：在相同聚焦相机下，门廊细节更丰富，原台阶和建筑轮廓不变，无新的明显穿模、溢出或黑面；由于远景，细节仍不算高保真，需下一轮增加更贴近真实建筑的近景照片对照。

## 明确限制
现有图书馆是照片参考的 Three.js 近似，入口构件位置尺寸尚未测绘。不要称其为 BIM/3DGS/实景复原完成。iPhone Safari 动态触摸需真机测试，Edge 390px 静态截图不能替代。
