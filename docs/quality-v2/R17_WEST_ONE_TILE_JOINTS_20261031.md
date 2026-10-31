# R17｜西一楼照片参考小瓷砖墙面（2026-10-31）

## 事实依据和边界

- 基线 HEAD `dcfb491`；本轮唯一锁 `r17-realism-continue-20261031-gpt6-e82d`。
- 外观参照：`https://xjtu.party/photos`「西安交通大学西 1 教学/办公楼」图像 `https://static.x-research.com/file/xstatic/www/csweb/photos/eie-bldg.jpg`。图像显示西一楼浅色小瓷砖、密集窗洞及分层外挂机。未核实照片可再分发许可，**仅查看作为建模参照，未入库或用作贴图**。
- 照片缺乏尺标，瓷砖大小、缝宽、墙面颜色只能估算；本轮纹理 `~0.31m` 网格、`0.035` 的着色器单元缝宽均为视觉估算，**不是实测**。2026 年现状与图片时间可能不同。

## 改进与设计

- 原有 `stoneMaterial` 自带非常淡、很大的石材方格，西一楼立面仍显得是统一光滑浅色墙。
- `src/architecture-kit.js`：在原有 procedural 石材材质中允许指定缝宽和色差，**默认参数保持完全不变**，只对定制材质使用独立 `customProgramCacheKey`。
- `src/building-asset-kit.js`：给 ownedArchitecture 增加可选的石材网格参数，不改变其余图书馆、教学楼默认参数。
- `src/west-one-asset.js`：西一楼专用 `stoneTileScale=3.2`，`jointWidth=.035`，`jointContrast=.17`；材料批次不增加；`photoTileGrid` 注明来源与估算精度，灰模不包含这些照片装饰。
- `tests/west-one-photo-tile.test.mjs`：RED→GREEN 2/2，验证西一楼独立材质 cache key、真实 shader 注入及保留通用 stoneMaterial 缓存键；与前一轮外挂机测试共同 4/4。全量 verify 纳入本新增测试。

## QA 与定量对比

干净 `git archive dcfb491` 双副本，Windows Edge WebGL；同一 `?inspection=west-one-photo` 相机，DPR=1，使用独立的 Pages 风格相对路径预览：

| 指标 | Before 1440 | After 1440 | Before 390 | After 390 |
|---|---:|---:|---:|---:|
| Draw calls | 442 | 442 | 101 | 101 |
| Triangles | 674327 | 674327 | 471251 | 471251 |
| Geometries | 341 | 341 | 108 | 108 |
| Textures | 32 | 32 | 11 | 11 |
| JS/HTTP errors | 0 | 0 | 0 | 0 |

- 1440 实际截图明显可见墙体小瓷砖网格，与参照图颜色/尺度关系更相似；390 中远景中纹样较弱，没有明显过深的干扰条纹；**真机滚动时是否摩尔纹仍需 iPhone Safari 验证**。
- 两次生产 Vite build 退出码 0；独立快照全量 `npm run verify` **退出码 0 / R17 Node tests 33/33**。现有主 JS 750KB chunk warning 未改善。
- 手机 390：触控平移、捏合、漫游、取消及返回 PASS；1440：搜索选择「电子与信息学部」、旋转、缩放、树层切换 PASS。初次并发测试时本机预览服务返回空响应；改为日志重定向的独立端口、顺序重跑完成验收，不能把失败运行计入成功。
- 所有 PNG 与原始 JSON：`docs/quality-v2/r17-west1-photo-tiles-20261031/{before,after,interaction-390,interaction-1440}`。
- 390 的 471251 triangles 超过指导性 300k 起始预算，1440 的 442 draw calls 超过 300；这属于**整场景旧有总量**，本次局部改进没有增加，不等于优化完成。
- 本轮仅提交本人归属代码、测试与证据；其他会话的未提交 R16 验证文件保持原样。不发布 Pages，不强推。

## 下一批任务

1. **图书馆航拍与屋顶轮廓核验**：用已许可的 2025 航拍与本地 `library-plan` 真实 WebGL 比较屋面：女儿墙/绿色屋顶轮廓/中间天井；只有明显差异才做最小几何修改。
2. **田径场周边楼体材料样板**：先取得 OSM ID 对应的明确多角度照片，然后按照样板验证窗洞比例/真实屋顶，拒绝给未知楼统一套灰窗。
3. **道路地形与下沉空间**：继续寻找可靠的有高程、坡道、通行方式的资料；高程未知不得为了视觉编造可碰撞坡度。
4. **性能回归**：在近景/远景实测，解释移动端大于 300k triangles 的真正来源；不凭主观估计大幅重构森林。
