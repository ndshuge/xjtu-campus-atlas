# R12 兴庆校园统一集成：六场景视觉与发布门禁

日期：2026-10-27。**当前仅为 R12 主楼 A–E 阶段候选，不是三专项完成或 Safari 真机认证。**

## 源码与版本

- R10 对照来自已存 Git 对象 `2547fbf` 的纯 `dist` 快照（不是有未提交文件的 R10 工作树）。
- R11 集成参考 `165a0a355faef670a87f7a7a3c07ddce9095b5b4`；单一钱学森图书馆归属保持 `src/library-asset.js`。
- 当前 R12 集成 `integration/r12@4fc4f515dcdc1b38d12b87291c11e494334ba674`，只安全合并已交付 `feature/r12-buildings@94a6f3e` 的主楼 A–E 第一阶段成果。
- 合并前检查了原始 SHA、所有文件差异与本工作树未提交文件碰撞：0；无其他工作树清理、reset、强推。

## 固定六场景：相同生产视角

使用原有 `scripts/qa-render.mjs` 和真实 Windows Edge WebGL。统一 390×844、1440×900 CSS px，模拟 DPR 1；六场景固定为：

A 北门 `north-gate`；B 梧桐大道 `avenue-east`；C 钱学森图书馆 `library-north`；D 主楼 A–E `main-e`；E 逸夫科学馆 `science-west`；F 四大发明广场 `place:四大发明广场`。

证据 JSON 分别在 `r12-visual-r10-baseline/browser-results.json`、`r12-visual-r11-baseline/browser-results.json`、`r12-visual-candidate/browser-results.json`。每版每尺寸各 6 张原始 WebGL 截图，保留在对应本地目录。**便于人眼比较的单图**：
`r12-six-scene-ab-390.jpg`、`r12-six-scene-ab-1440.jpg`。三组采样均确认为同一 NVIDIA RTX 5060 Laptop GPU；所有场景 JS/HTTP 错误、横向溢出和 context loss 均为 0。采样的 240 FPS 是刷新/浏览器计时现象，不能用来证明真实帧率改善或 Intel 问题解除。

## 视觉结论及真实性界限

| 场景 | R12 当前判定 |
|---|---|
| A 北门 | 门头和入口空间保留，主楼天际线更高；北门、围墙本身未见 R12 新高保真改动 |
| B 梧桐大道 | 集成分支维持 R11。景观候选有更密树冠，但下述触控遮挡缺陷导致暂不接收 |
| C 图书馆 | 延续 R11 唯一模型所有者；视觉没有单独的 R12 精修，Intel 核显问题依然 NOT VERIFIED |
| D 主楼 A–E | **接受**：统一几何、四角开敞顶部、长幕墙、低翼与连接体比例明显改善；新高度为照片估算，非测绘尺寸 |
| E 逸夫馆 | 现有主体可辨，北附属翼/材料仍近似；建筑线程第二阶段未提交，暂不集成 |
| F 四大发明广场 | 可选择与浏览，但地坪深度、雕塑和树木关系仍示意；未核验最终地面专项 |

主楼 A–E 的已提交固定视图和点击选择在 `buildings-r12/main-final/`、`main-click-final/`；候选改动使主楼专项三角形 29,100→13,571、可见 mesh 12→5，保留 8 个 OSM ID 和点击、搜索、渲染分类。完整 `npm run verify`、`npm run build` 在正式集成工作树再次通过，Vite 主 JS 765.14 kB（gzip 213.46 kB），仍超过 750 kB 提示。

## 独立复验与暂缓接收

- 390、430、768 手机/平板触控及 1440 桌面，**每一宽度独立 Edge 会话**：平移、缩放、漫游进出（1440 桌面鼠标/图层/搜索）、0 错误均通过；证据 `r12-touch-*/browser-results.json`。
- `feature/r12-mobile-render@d2a5f95` **暂缓合并**：虽然梧桐树叉分明、近景层次改善，但固定静图 draw calls 390px 84→93、triangles 491364→503328；1440px 313→322、760590→791898。独立生产构建 `node scripts/verify-r12-landscape.mjs`、完整 verify、build 通过，动态 Edge 手势和模拟 context 恢复通过；相同 pinch-motion 画面中较密叶卡大面积遮挡视线，须处理近景镜头进入树冠的问题后再审查。未擅自带入该分支另有未提交的广场/路面改动。
- `feature/r12-map-interaction` 仍有未提交 UI/相机代码，不凭截图强行合并。
- 真实 iPhone Safari 尚未测试：叶片动态闪烁、真实 GPU frame-time、温控和缩放中心不能标为已通过。
- 使用 `--low-power-gpu --measure-frames` 重测图书馆，浏览器回报的 GPU **仍是 NVIDIA RTX 5060**，而非 Intel 核显。不能以本轮约 240fps 的刷新采样否认 R11 文档记录的 Intel 3.40fps 对 28.23fps 回退；该项保持发布风险。

## R12 独立预览发布边界

- 仅本地 Pages 暂存：`E:/CHATGPT/work/xjtu-pages-r12-staging-20261027`，分支 `publish/r12-staging-20261027`，提交 `51ac51b021cb88876699bacff09f04b1f2245c24`。
- 只新增 `r12-build-20261027/` 的 18 个生产文件，不改首页或 `r11-build-20261027/`；在本机 `http://127.0.0.1:19875/r12-build-20261027/` 的 HTML、JS、CSS、数据、图片均 HTTP 200，子路径 Edge 场景 `r12-staged-pages-qc/` 通过。
- GitHub 连接器读到远端 main = `3617013`、gh-pages = `94d7408`。本机 Git HTTPS 发生 TLS 握手错误，GitHub 连接器新建 blob 返回 403（无写权限）；**因而尚未推送、没有公网 R12 预览链接**。不以修改 root、使用 force push 或未授权镜像绕过。
- 一旦网络/权限恢复，必须先重查 gh-pages 是否仍为基线、目标子目录是否冲突，再普通非强制推送暂存提交，最后公网获取 HTML 与最新 JS/CSS 的 HTTP 200，回到真实公网地址做手机和桌面验收。**未经用户单独同意不替换正式首页**。

当前综合结论：主楼 A–E 阶段改进可进入独立 R12 测试预览；景观的近景遮挡、交互线程尚未交付及 Intel/Safari 未验证使 R12 整体正式上线不推荐。
