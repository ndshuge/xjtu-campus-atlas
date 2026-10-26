# 兴庆校区 R4 阶段性整合验收 — 2026-10-26

## 官方实景关卡：来源与局限
1. 北门：西交 2015-12-02 历史报道 https://news.xjtu.edu.cn/info/1033/11054.htm；侧面浮雕资料 2025-12-09 https://dwxcb.xjtu.edu.cn/info/1085/17811.htm。地点北门明确、发表日明确，摄影具体日期未核实，不能保证反映 2026 修缮后的景象。版权所有，仅作视觉参照；既有 2011 Commons 已授权字形裁剪材质依项目 attribution 继续使用，本轮未新增未经授权的贴图。
2. 梧桐东道：校方 2024-09-20 https://news.xjtu.edu.cn/info/1002/214178.htm，明确重铺沥青、热熔标线、透水混凝土人行道、路灯；学校道路改造资料 https://www.ef.xjtu.edu.cn/info/1845/7841.htm（网页 2025-05-14）有林荫场景。摄影日期无法确认，**资料能确定材料种类，不能决定实际路宽和每株树间距**。
3. 主楼 E 座：Danielinblue 摄影《Zhulou xjtu》2012-11-06，https://commons.wikimedia.org/wiki/File:Zhulou_xjtu.jpg ，CC BY 3.0；可观察浅色石材边框、中央深色幕墙、屋顶开敞框架及两侧翼楼。属于历史照片，不代表 2026 外观、精准尺度。使用原创几何，没有将此照片复制入库。

## 本轮代码与集成
- `src/campus-perimeter.js`：真实立体 OSM 衍生围栏，有墙基、立柱、竖杆、横杆和校门净空，不再只是边界线；**具体墙体设计依然属于显式示意，不是真实围墙复刻**。
- `src/north-gate.js`：清理无意义浮雕短线，替换为“自然/应用科学”原创抽象元素，并沿用历史北门材质归属标识。
- `src/world.js`：林荫道路树改成更高分叉枝、露出白色涂刷基部、灰色路面；固定摄影 QA 视角 `north-gate`/`north-wall`/`avenue-east`/`main-e`（仅手动查询参数触发）。
- `src/avenue-paving.js`：梧桐东道增加两侧透水混凝土示意人行带、边缘热熔标线，沿原 OSM 中心线；路径宽度由程序推定，并未自称测绘准确。
- `src/main-tower-facade.js`：按 2012 年主楼照片改善中央玻璃幕墙竖向立面、石材肋条和入口雨棚；不修改 OSM 建筑位置、高度或轮廓。
- `src/style.css`：摄影 QA 模式隐藏干扰截图的浮层、保留来源和“示意”警告。
- `scripts/verify-perimeter-avenue.mjs`、`scripts/verify-avenue-paving.mjs`、`scripts/verify-gates.mjs` 接入统一验收。

## 本机验收与差距
- `npm run verify` 返回 0，`npm run build`（Vite 8.3.5）返回 0，`git diff --check` 通过。
- 新生产资源为 `assets/index-PUXrRjIP.js`，Edge Headless 浏览器实测页面引用与源码构建一致。
- 真实 WebGL 截图：`qa-north-gate-final.png`、`qa-north-wall-final.png`、`qa-avenue-final.png`、`qa-avenue-mobile-final.png`（1440×900、390×844），并有 `main-e-publish-desktop.png` 和 `avenue-publish-desktop.png`。
- **人工差距**：围墙墙身材质、高度、门区转角没有 2026 完整照片；树冠仍偏几何团块，缺少真实扭曲分枝和树皮；道路实际断面和节点铺装仍未知；主楼 E 座局部层高、翼楼精细立面、2026 实况与照片有差距。
- 没有完成真实 iPhone Safari 验收，无法标记“摄影级完成”。本次发布为**已实现真实三维围界的阶段性示意版本**；质量关卡继续保持红灯，不得声称全部还原。

## 并行施工安全
- `feature/perimeter-avenue-target` 独立 worktree，未对其他 Codex/Mice Hole 工作区使用 reset 或强推。
- 仅纳入本轮已测试的源码、测试、精选现场渲染截图和生产构建，历史大量未追踪 QA 临时文件不触碰。
