# 西交大兴庆校区 R11 最终工程集成与发布门禁（2026-10-27）

## 来源、兼容与文件所有权
- 主线基线：main 36170135addd3c16bebf2f179607e5ee4574043a。
- 已由统一集成线程安全合并：research/r11-xjtu-assets@506052b2、feature/r11-mobile-render@0adb1807，集成分支 f579c1b；此次独立 worktree 合并 feature/r11-library@c33fe5d7，三方无成果丢失。
- 图书馆接入保留 src/world.js 的 R11 移动版 DPR、相机保护、树叶 alpha-to-coverage、WebGL 恢复、OrbitControls；只改变 library 归属。
- 唯一完整图书馆模型：src/library-asset.js，通用 buildingMesh 不再额外绘制图书馆，northLibrary 的旧 silhouette 排除，退役旧 libraryFacade、libraryClock、libraryGreenRoofs 的可见叠加；libraryForecourt 沿用原独立场景模块。
- world 的真实生产脚本已改；不是只在 Codex review HTML 展示。保留原 OSM ID、搜索/选择/点击 hitPlace、镜头和非图书馆几何。
- 合并时仅 scripts/qa-render.mjs 两处 Git 冲突：保留浏览器页面位置确认、加载时接口验证、帧采样及 768px 触控。更新三条检查器的“旧立面必须存在”断言，使旧兼容几何函数仍可独立被测，新生产场景只能有一个图书馆视觉所有者；不删减其他测试。
- 已将 scripts/verify-library-asset-r11.mjs 纳入原 package.json 完整 verify，未建立平行验收框架。

## 真实测试结果
- node scripts/verify-library-asset-r11.mjs：通过；2483 个空间采样、217 个屋面射线采样；旧通用图书馆顶点数1128 → 0；其他建筑顶点与色彩哈希不变。
- npm run verify：通过，含全部旧完整回归和新增建筑/移动专项。
- npm run build：通过；仍有源工程 Vite >750kB JS 包警告，不能用调大阈值掩盖。
- Edge Windows WebGL 正式 Vite dist、390 / 1440px，library-north、science-west、选中钱学森图书馆共6组截图：所有 HTTP/JS 错误0，绘制成功。docs/quality-v2/r11-final-landmarks/browser-results.json。
- 390px 手机、430px 手机、768px 平板：分别隔离 Edge 浏览器进程做首页 pan、pinch、进入walk、前进、退出，全部 passed true；页面放大比例均为1；之前同会话连续430的误报未再复现。证据 r11-final-touch-390、-430、-768。
- 1440px 真实鼠标转动、滚轮缩放、树木图层开关、搜索选中图书馆通过；证据 r11-final-touch-desktop。
- 静态人工审阅了图书馆北面和逸夫馆的390截图：新图书馆可辨，背景建筑/景观没有突发删除；仍属于照片指引的近似复原。

## 必须明确的限制
- 真正的 iPhone Safari 和 WebKit GPU 动态地面闪烁、树叶糊、实际长时间温控、后台恢复未经过实机证明。不能宣称已解决所有手机渲染缺陷。
- Codex 原建筑专项报告 LIBRARY_ASSET_R11_20261027.md 记录了 **Intel 核显 390px 南立面** 同机对照的稳态回退：候选23.40fps / 原版28.23fps（另一次23.20 /25.61）。未定位根因，不能以此轮 NVIDIA RTX 5060 约240fps 的观测否定 Intel 上的性能风险；需真机和复测进一步修正。
- 49.75m 只用于南馆有文献依据的主楼高度，其余层高/屋面尺寸仍估算。下沉庭院、弧形通道严格不凭空重建。
- 原有主楼 E 的 OSM 独立建筑遮挡、逸夫馆低翼示意化、本地树林位置误差未由 R11 图书馆专项解决。

## 安全发布规则
如果远端 main 与基线出现非预期更新，必须暂停推送并手工对照；禁止强推、reset/clean、覆盖其他 worktree。
Pages 部署从经过 verify/build 的 dist 复制到独立 gh-pages worktree；公网 JS/CSS 必须 HTTP 200，远端 main / gh-pages 提交要分别可追溯。
真实 iPhone Safari 验收仍单列 NOT VERIFIED，页面更新不代表真机质量认证。
