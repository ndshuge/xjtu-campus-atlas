# 兴庆校区 3D R11 统一集成 — 主干基线与质量门禁

本文件记录 R11 其他代码分支完成前的独立验收，不是 R11 最终发布合格证。现场 iPhone Safari 未测试。

## 范围与不可覆盖事项

- 主仓库：`E:/CHATGPT/2026-10-25/3d-github-3d-three-js-openstreetmap/outputs/xjtu-campus-3d`
- R11 独立 worktree：`E:/CHATGPT/work/xjtu-r11-integration`；分支 `integration/r11`
- 已核实本地与远端 main 均为 `36170135addd3c16bebf2f179607e5ee4574043a`。`fd68603` 为它的祖先，不重复挑选旧 R9 源码。
- 其他 worktree 大量未提交文件、截图和暂存成果均原样保留，未 reset、clean、强推，也没有修改正式 main 或 gh-pages。
- 资产研究 `research/r11-xjtu-assets@506052b` 已经按文件与许可清单复查：仅新增研究 MD + JSON，**无外部模型二进制、无几何代码**；普通合并 `76e5617`。
- `feature/r11-library` 与 `feature/r11-mobile-render` 此阶段尚无可集成的提交；各自工作树有正在进行的未提交修改，禁止当交付处理。

## 已加固的已有门禁

- 原 `scripts/verify-building-envelope-r9.mjs` 已在仓库，但先前不在完整 verify。现追加到 `package.json` 的既有命令链，保留旧门禁。
- 既有 `verify-mobile-render-precision.mjs` 曾使用过期 `alphaTest:distant?.12:.38` 字符串，与已提交的 R9 植被源码 `alphaTest:distant?.26:.38` 不匹配。本轮更新断言，不修改树木材质，并纳入统一 verify。
- `npm run verify`：通过；`node scripts/verify-mobile-render-precision.mjs`：通过；`npm run build`：通过。基线生产 JS 751.73 KB（gzip 208.01 KB），仍有 750 KB bundle-size 警告，未提高阈值。
- 现有 `scripts/qa-render.mjs` 按应用 768px 断点模拟触控，增加页面 URL/载入核对。**同一 Edge 会话连续跨 390→430 的漫游测试偶发中途回到 orbit，单独的 430 会话不能复现；故最终采用各宽度独立进程作为验收证据，并保留原连续失败，不以脚本掩盖。** 现已在旧 QA 脚本入口明确拒绝 `--interact` 同时传入多个宽度，避免误以为该混合测试通过。

## 基线 WebGL 截图

当前 Vite 生产 dist 在独立本地服务测试，12 组：`r11-baseline-production/` 内 home、avenue-east、north-wall × 390、430、768、1440。每组都保存真实 Edge Headless WebGL 图片，`browser-results.json` 中的页面溢出、HTTP 400+/JS 报错、contextLost 均为 0。GPU 是 Windows/Edge，不是 iPhone Safari。

| 视口与固定机位 | 场景 triangles | draw calls | sceneLoadMs |
|---|---:|---:|---:|
| 390 home | 522714 | 369 | 4928 |
| 390 梧桐东道 | 491740 | 84 | 3444 |
| 390 北侧围墙 | 498162 | 172 | 3608 |
| 430 home | 522786 | 375 | 4040 |
| 768 home | 522878 | 391 | 3761 |
| 1440 home | 568434 | 512 | 5174 |
| 1440 梧桐东道 | 743976 | 322 | 3908 |
| 1440 北侧围墙 | 645295 | 511 | 4069 |

这是固定场景的机器记录，数值依 GPU、浏览器、缓存与服务状态变动，不能替代真正的 A/B 或归因结论。`north-wall` 机位视觉上主要为路边通用楼体，不能当作北门验收，所以另增真实 `north-gate` 机位。

## 建筑、北门与广场的人工可见基线

- `r11-baseline-landmarks/`：实际拍摄 north-gate、library-north、main-e、science-west × 390、1440 共 8 张；无 JS/HTTP 报错、无 context lost、无页面横向溢出。对照图片均为 R10/R9 合并后的**改造前**生产状态，并非 R11 新建筑模型。
- `r11-baseline-plaza/`：搜索/选中“四大发明广场”后 390、1440 两张，`selected` 名称按 QA 脚本核对；无 JS/HTTP 报错。广场铺装及雕塑仍为场景示意，不冒充完整实景还原。
- 北门机位能看到门头、围墙、前方道路；图书馆北侧仍明显由多段楼体和窗格近似拼成，主要体量和连廊待新完整样板核实。
- 主楼 E 中央竖楼与开洞可见，但正前方仍存在旧 OSM 独立体量遮挡；不能未经地形和史料校验直接删掉。逸夫馆入口及屋架可辨，但低附属翼结构仍粗略，不能判定实景高保真。
- 基线数据和 R11 合并后必须比相同 camera、CSS 宽度及场景构建，不能混用旧截图位置或单看自动测试总分。

## 交互验收（每尺寸独立 Edge 进程）

证据目录：

- `r11-baseline-touch390/`：390px 单指平移 140.89、双指相机距离 2148.19→1644.54、浏览器页面缩放 1、步行 4.42、正常退出漫游；通过。
- `r11-baseline-interact430-isolated/`：430px 单指平移 140.88、双指 2148.19→1644.63、步行 4.42、正常退出；通过。
- `r11-baseline-touch768/`：768px 平移 132.12、双指 2148.19→1660.82、步行 4.42、正常退出；通过。
- `r11-baseline-desktop1440/`：1440px 鼠标旋转、滚轮缩放 1832.11→1699.29、树木图层开关使 triangles 568434→201588、搜索选中钱学森图书馆；通过。
- `r11-baseline-interactions/` 和 `r11-baseline-gesture-diagnose/`：连续复用会话的 430px 失败证据，场景在退出漫游前已回到 orbit；用于防止 QA 混淆，不算页面单独运行失败。

## 仍阻塞 R11 正式集成

1. 只有收到 `feature/r11-library`、`feature/r11-mobile-render` 的明确提交 SHA 与干净的可交付差异后，才能执行三方代码集成；已集成研究文档不视为建筑模型版权授权。
2. 图书馆必须逐段验证北馆、南馆、书库及连廊实体体量，OSM ID/搜索/建筑选择/相机聚焦/漫游/碰撞/LOD/普遍建筑 fallback，尤其避免通用体块+浮皮+屋顶补丁重复及新完整网格成为不可点击覆盖层。
3. 合并后重新独立生产 build、完整 verify、建筑包络、390/430/768/1440 的真实 WebGL 截图与触控（其中正式要求至少桌面、390、430、768），对照本文件固定机位和性能数值，先排查可见瑕疵，再决定是否上线。
4. 真实 iPhone Safari 的动态闪烁、发糊、帧率、温度和 WebGL context loss **未验证**，不得宣称解决。
5. 任一门禁失败或所需分支未交付时，不合并/推送正式 main，不重建正式 Pages，不宣称发布。
