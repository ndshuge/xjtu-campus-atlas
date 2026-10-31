# R17 | 钱学森图书馆南立面石材嵌块 — 照片对照施工

2026-10-31，基线 6ad79cf，活动分支 feature/r16-qian-library-asset-20261030。

## 可用真实图像与事实边界

- 2021 年正面照片：Liuxingy，《西安交通大学 钱学森图书馆和四大发明广场》，2021-09-06，Wikimedia Commons，CC BY-SA 4.0。原始授权和署名见 `public/assets/reference/README.md`；项目内 960px 预览 `public/assets/reference/library-front-2021.jpg`。
- 图片许可：https://creativecommons.org/licenses/by-sa/4.0/ ；原页：https://commons.wikimedia.org/wiki/File:%E8%A5%BF%E5%AE%89%E4%BA%A4%E9%80%9A%E5%A4%A7%E5%AD%A6_%E9%92%B1%E5%AD%A6%E6%A3%AE%E5%9B%BE%E4%B9%A6%E9%A6%86%E5%92%8C%E5%9B%9B%E5%A4%A7%E5%8F%91%E6%98%8E%E5%B9%BF%E5%9C%BA.jpg
- 从照片能够辨认：钟楼下方正面暗色玻璃中央有浅色方形石材嵌块，与楼层玻璃错列。无法从这张照片取得准确的块长、进深及真实开窗构造。
- 本轮新增石块为照片比例估算的几何表达，**非测绘尺寸、非实景摄影测量**。没有把 Commons 照片变成未经授权的贴图。

## 具体代码

- `src/library-asset.js`：对 `south-course-3` 深色幕墙，在两个分开的玻璃带上实际留出中心开口，以已存在的 wall/material 批次添加两块石材几何；邻近两侧玻璃保留后退位置。
- `tests/library-photo-masonry-islands.test.mjs`：验证实际墙面射线命中、中心原玻璃不连续、两侧凹入式玻璃仍存在、材质批次和 OSM ID 不变、灰模阶段无未经确认的细节。RED → GREEN。
- `tests/library-south-course3-curtain.test.mjs`：历史回归由中心玻璃检查位置改为石块旁真实保留的玻璃窗位置，原结构约束不降低。
- `package.json`：新增专门的几何回归测试到全量 verify。

## 前后实际效果与门槛

同一生产构建子路径、同一 QA 相机 `?inspection=library-south-detail`，Windows Edge WebGL 1440 / 390：

| 度量 | BEFORE 1440 | AFTER 1440 | BEFORE 390 | AFTER 390 |
|---|---:|---:|---:|---:|
| Draw calls | 361 | 361 | 221 | 221 |
| Triangles | 848837 | 848897 | 557770 | 557806 |
| JS errors | 0 | 0 | 0 | 0 |
| HTTP errors | 0 | 0 | 0 | 0 |

- 用真实照片 + 实际 before/after PNG 直接复核：两个石材块在正面视图辨识度提升，玻璃窗格未被整片不透明墙覆盖；手机画面能够看见但较小。视觉未独立艺术签收。
- `node --test tests/library-photo-masonry-islands.test.mjs tests/library-south-course3-curtain.test.mjs tests/library-south-ribs.test.mjs tests/library-south-course4-stone-spine.test.mjs`：**7/7 PASS**。
- 全量 `npm run verify`：PASS（exit 0），生产 Vite build 前后均 exit 0；已知 >750KB bundle warning 仍在。
- 390px Touch pan / pinch / walk / pointercancel / return：PASS；1440px 搜索、选择、旋转、缩放、树木开关：PASS。JS/HTTP 错误仍为 0。
- PNG 和原始 `browser-results.json`：`docs/quality-v2/r17-photo-masonry-islands-20261031/{before,after,interaction-390,interaction-1440}`。只能代表 Edge 模拟尺寸，非真实 iPhone Safari 性能。
- 本轮**仅提交本轮代码 / 测试 / PNG / JSON / 本文档**；其他进程原有未提交 JSON 和截图完整保留。不自动发布 Pages。

## 后续优先工作

1. 继续按有署名、许可的照片，核对图书馆前四大发明广场真实铺装条带与现有草坪/人行道边界。不要把单张透视图片推算成测绘坐标。
2. 西一楼、田径场周边教学楼：优先获取可直接看到窗洞与屋顶的许可实景照片，再改真实窗洞、屋顶轮廓；Wikimedia 原图请求出现 429 时不猜建模。
3. 图书馆圆形下沉空间的实际深度仍未知，禁止用独立实验室的 -2m 示例值当作实测。
