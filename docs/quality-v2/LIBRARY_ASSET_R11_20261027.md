# R11 钱学森图书馆：完整资产与体量阶段交接

日期：2026-10-27（北京时间）。分支 `feature/r11-library`，基线 `36170135addd3c16bebf2f179607e5ee4574043a`。研究分支 `research/r11-xjtu-assets` 的报告与索引通过 `git show` 读取，依据提交 `506052b2bd9a48c3cbe48dc602b6a2592c8a1d74`，未合并研究分支。此前未提交的 `library-asset.js`、`library-asset-plan.js` 等成果在原工作树内继续完成。

**结论：完整单一归属资产、体量分段及软件几何/交互检查通过；手机南正面帧率有回退，性能尚未完全达标。建筑仍是有照片依据的近似重建，不能称为测绘级或高保真全部完成。** 本分支没有修改生产 `src/world.js`，没有合并 main、推送或发布 Pages。R11 预览通过构建时的同一份最小接入变换运行；常规构建仍是原生产接入路径。

## 1. 资产归属与兼容

| 部分 | R11 负责者 | 原有路径如何处理 |
| --- | --- | --- |
| 北馆、书库、南馆三段及退台 | `src/library-asset-plan.js` / `src/library-asset.js` | 复用 R7 的 OSM 分段及 R9 组件，不另建建筑系统 |
| 外墙、真实开孔窗、玻璃、屋顶、钟楼、屋顶地被 | 同一 `createLibraryAsset()` 根组 | 接入时停用通用 library extrusion、旧 facade/clock/greenRoofs、northLibrary silhouette 和 `addClock` 平面 |
| 入口前场与环形庭院示意 | 既有 `library-forecourt.js` | 保留原状；不作为已核实地下高差的证明 |
| 其他校园建筑、植被、校门、道路、交互 | 原系统 | 不改变几何或数据；其他建筑完整属性哈希一致 |

原 `way/263624481` / OSM `263624481`、建筑对象、名称、索引、位置、数据高度字段、碰撞维度及外部接口均保留。接入先消费原随机颜色序列再跳过通用图书馆体块，避免所有后续建筑换色。新资产真实网格参与原射线选择；统一选择/悬停、分类/高度着色和夜间玻璃参数。资产有幂等 `dispose()`，释放自有几何、材质与纹理。

单位：米。沿用校园局部投影，WGS84 原点 `[108.9793,34.2473]`；X 东、Y 上、Z 南；根变换为恒等。没有新增第三方模型、GLB、学校模型或照片贴图。保留旧工厂文件作为生产未接入时的回退，而非让它们与新模型同时显示。

接入补丁：[world-integration.patch](library-r11/world-integration.patch)。生成器：[library-r11-integration.mjs](../../scripts/library-r11-integration.mjs)。`git apply --check` 检查过，但没有实际应用。集成线程如已修改共享 world，应审阅这些最小接入点并人工协调，不整文件覆盖。

## 2. 证据与体量

完整可机读登记：[evidence.json](library-r11/evidence.json)。引用资料只提供相应事实，不能把发表时间当拍摄时间。

| 资料 | 日期与许可 | 可以支持 / 不能支持 |
| --- | --- | --- |
| [校方图书馆建筑介绍](https://news.xjtu.edu.cn/info/1219/153497.htm) | 发表 2016-11-21；摄影日期未知；学校摄影只作参照。本轮抓取超时，事实通过研究提交及既有 R7/R9 记录复核 | 北馆四层、书库五层、南馆 I/III 三层、II 地上十一层及屋顶辅助体；49.75m 属南馆高度范围。不能据此得到各层标高或 I/III 的地理编号 |
| [北立面官方照片](https://wmw.xjtu.edu.cn/images/19/09/09/1umue6d7cp/dibiao5.jpg) / 张轶朋 | 已有 R9 参照；EXIF 2017-05-18，未经独立校时；发表日期未知；仅参照，不入贴图 | 浅色通高柱列、檐口、暗色纵向玻璃；缺后侧立面和尺寸 |
| [南立面 Commons](https://commons.wikimedia.org/wiki/File:西安交通大学_钱学森图书馆和四大发明广场.jpg) / Liuxingy | 拍摄 2021-09-06；发表日期未确认；CC BY-SA 4.0 | 阶梯天际线、中央玻璃带、单一馆名、低部入口和小钟楼；不证明改造后室内或精确退台 |
| [俯视 Commons](https://commons.wikimedia.org/wiki/File:西交兴庆之俯视钱学森图书馆.jpg) / Liuxingy | EXIF 拍摄 2025-07-25；上传 2026-06-25，二者不同；CC BY-SA 4.0 | 北馆山字/U 形、T 形书库、南侧多角低翼、绿化屋面和坡屋顶；非正射影像，无高程控制 |
| [屋顶地被校方报道](https://news.xjtu.edu.cn/info/1219/153746.htm) | 发表 2017-04-07；摄影日期未知；只作参照 | 低矮地被种植，不支持屋顶密集大树或精确现状覆盖 |
| [2024 年改造报道](https://news.xjtu.edu.cn/info/1002/213283.htm) | 发表 2024-08-13；摄影日期未知；只作参照 | 二层流通及南馆设施改造；未提供完整平立剖与庭院标高 |

Commons 两张既有缩略参照及署名在 [reference/README.md](../../public/assets/reference/README.md)。本轮只视觉对照，未改写其内容或采样为材质。研究发现的历史 SketchUp/GIS 校园没有可直接公开再分发的模型许可，因此未下载或引入。

| 分段 | 有资料支持的层数 | 当前高度/几何表达及可信边界 |
| --- | --- | --- |
| 北阅览楼 | 4 | 檐高约 14m，假定 3.5m/层；保留 R7 平面。局部坡屋顶最高另起约 1.5m，坡度估算 |
| 连接书库 | 5 | 约 17.5m，假定 3.5m/层；保留 T 形。坡屋顶起伏上限约 1.05m，估算 |
| 南侧两低翼 | 各 3 | 约 13m；独立原多角平面；不宣称已确认哪侧是 I 或 III |
| 南馆 II 主体 | 地上 11 | 三层低部 + 2/2/2/1/1 层退台。退台尺寸及分层标高沿用已有近似并限制在原 OSM 南馆轮廓内；主体顶约 42.75m |
| 南侧屋顶钟楼 | 辅助体，不算阅览楼层 | 有承托的基座、钟室、冠部，资产最高点限制为 49.75m；钟楼尺寸、位置和绝对标高仍近似 |

不把整座 OSM 合并轮廓挤出到 49.75m。灰模阶段先消除基座叠加、屋顶穿插与不承托退台，再做材质。北馆与书库屋面采用受原轮廓裁切的低幅坡面，不把照片当测绘屋顶。未知的下沉庭院、弧形架空通道、地下室与室内均不新增。

## 3. 固定视角与人工检查

同一绝对米制相机、1440×900 / 390×844、DPR 1。基线和候选均是相同 Vite 多入口配置的生产构建；测试串行运行。未挪树、隐藏邻楼或改世界光照来美化候选。

| 视角 | 旧版 1440 / 390 | R11 1440 / 390 | 人工观察 |
| --- | --- | --- | --- |
| 南正面 | [桌面](library-r11-baseline-production/r11-south-front-1440.png) / [手机](library-r11-baseline-production/r11-south-front-390.png) | [桌面](library-r11-validated/r11-south-front-1440.png) / [手机](library-r11-validated/r11-south-front-390.png) | 重复钟体、重合玻璃及窗格退出；南馆体量收束在原轮廓内。馆名一次，三层低部玻璃按三层分格。与 2021 照片相比，细长立面比例、窗格和退台距离仍需图纸 |
| 北全体 | [桌面](library-r11-baseline-production/r11-north-front-1440.png) / [手机](library-r11-baseline-production/r11-north-front-390.png) | [桌面](library-r11-validated/r11-north-front-1440.png) / [手机](library-r11-validated/r11-north-front-390.png) | 四层阅览楼与高一层书库关系可读，南馆背景体量保持；北柱廊被既有树阵部分遮挡 |
| 北近景 | [桌面](library-r11-baseline-production/r11-north-detail-1440.png) / [手机](library-r11-baseline-production/r11-north-detail-390.png) | [桌面](library-r11-validated/r11-north-detail-1440.png) / [手机](library-r11-validated/r11-north-detail-390.png) | 专门检查柱廊局部，并非全建筑构图；入口和树木净空不能由这组照片证明 |
| 东侧高视点 | [桌面](library-r11-baseline-production/r11-east-1440.png) / [手机](library-r11-baseline-production/r11-east-390.png) | [桌面](library-r11-validated/r11-east-1440.png) / [手机](library-r11-validated/r11-east-390.png) | 北馆/书库/南馆高度区分；保留全部相邻建筑 |
| 低东侧遮挡 | [桌面](library-r11-baseline-production/r11-occlusion-1440.png) / [手机](library-r11-baseline-production/r11-occlusion-390.png) | [桌面](library-r11-validated/r11-occlusion-1440.png) / [手机](library-r11-validated/r11-occlusion-390.png) | 邻楼明显遮挡仍可见，是实际校园空间限制，未通过删邻楼规避 |
| 完整斜视 | [桌面](library-r11-oblique-baseline-review/r11-oblique-wide-1440.png) / [手机](library-r11-oblique-baseline-review/r11-oblique-wide-390.png) | [桌面](library-r11-validated/r11-oblique-wide-1440.png) / [手机](library-r11-validated/r11-oblique-wide-390.png) | 完整组团能放入两种画幅；南馆侧翼、北馆和书库可同时观察 |
| 鸟瞰 | [桌面](library-r11-baseline-production/r11-aerial-1440.png) / [手机](library-r11-baseline-production/r11-aerial-390.png) | [桌面](library-r11-validated/r11-aerial-1440.png) / [手机](library-r11-validated/r11-aerial-390.png) | 与 2025 航拍比较，山字/U 形北馆、T 形书库、两大绿化低翼一致；坡脊、屋顶覆盖和室外植被仍近似 |
| 北侧环境关系 | [桌面](library-r11-baseline-production/r11-context-1440.png) / [手机](library-r11-baseline-production/r11-context-390.png) | [桌面](library-r11-validated/r11-context-1440.png) / [手机](library-r11-validated/r11-context-390.png) | 保留校园背景与遮挡，不宣称周边广场已实测 |

另保留原 `r11-oblique` 近斜视两尺寸作为第九对视图：390px 会裁到南馆右边缘，不能当作完整构图通过；新增 wide 视点补足，不删除这个不利视角。所有 18 对相机和目标一致。

灰模记录：[gray-final](library-r11-gray-final/browser-results.json)，[灰模南正面](library-r11-gray-final/r11-south-front-1440.png)、[灰模鸟瞰](library-r11-gray-final/r11-aerial-1440.png)。该阶段是在最终三层玻璃分格修正之前，主包络、分段和层数规划没有变化。

中间轮次发现并修正：跨 OSM 三段南立面重复出现三块馆名及粗柱；南部玻璃默认四排与三层低部不一致；QA 换页过早读取上一页 ready。一次补图误用普通入口被 wrapper 拒绝，已用 review 入口重跑。较早材质试验的独立环境贴图因额外 PMREM/纹理开销且宽景收益不明显撤回，没有声称它单独造成了某个确定加载差值。中间截图和失败记录在本机保留，最终有效证据以本表及 source-lock 为准。

## 4. 自动检查和实际浏览器验收

执行并通过：

- 原有完整 `npm run verify`（25 条串联脚本）；未删除或跳过旧检查。两个 library 集成检查同时检查旧路径和拟接入新路径。
- `node scripts/verify-library-asset-r11.mjs`：基底分区面积合计约 7994.269m²，与输入 OSM 一致；2483 空间采样无分区重叠/缺口，217 向下射线均命中屋面；高度范围、分段、承托、有限坐标、资源销毁和 ID 均检查。
- 原 `npm run build -- --outDir dist-r11-legacy-check`；原单入口的大 chunk 警告仍存在，不以 QA 多入口的分包声称解决全站包体问题。
- 新版 `vite build --config vite.library-r11.config.mjs` 与同配置基线生产构建。
- 实际 Edge：18 个固定视图均无 JS/HTTP 错误、溢出或 WebGL context loss；南正面实际鼠标射线点击能选中钱学森图书馆。
- 产品正常入口的桌面旋转/滚轮/图层开关/搜索；390px CDP 触摸平移、双指缩放、页面缩放保持 1、进入漫游/移动/退出均通过。标签抽样数量为 0 时漂移 0 只能证明“无可见标签抖动”，不能证明密集标签场景。
- Prism 原 driver 的 360/768/1024/1440/1920 溢出、页面错误及 reduced-motion 内容检查通过并已人工查看截图；仅用适配器换成已安装 Edge，未改 driver 断言。它使用 SwiftShader，与原生 Edge 帧率证据分开。

实际其他建筑的几何/法线/UV/颜色/索引属性哈希在新旧构建中一致：`c260033c0048ffd82ee4bf8c18529a3ff255381a11913b3b6ae198ebb9f2e9ef`。通用图书馆顶点 1128→0，旧通用钟面调用 1→0。生产 world 与原数据未改；没有覆盖 R6/R8/R10。

结果文件：[geometry-verification.json](library-r11/geometry-verification.json)、[performance-comparison.json](library-r11/performance-comparison.json)、[最终渲染/source-lock](library-r11-validated/source-lock.json)、[交互原始记录](library-r11-interactions-validated/browser-results.json)。

## 5. 资源与性能边界

完整数字以机器报告为准。图书馆子集旧值包含通用图书馆部分和旧通用钟面；不会把 Node 无 DOM 下未生成的牌匾/钟面算成浏览器总量。

| 同视角指标 | 旧版 | R11 |
| --- | ---: | ---: |
| 图书馆三角形（浏览器含牌匾/钟面） | 19,433 | 23,247 |
| 图书馆网格 | 34 | 11 |
| 图书馆材质 | 17 | 10 |
| 图书馆纹理 | 4 | 4 |
| 南正面 1440 场景绘制调用 | 480 | 450 |
| 南正面 390 场景绘制调用 | 290 | 268 |
| 南正面 1440 场景纹理 | 32 | 32 |

新增墙洞、窗内退与真正屋面会增加约 20% 的图书馆几何；材质批次、重复网格和绘制调用下降。无第三方模型下载包。相同配置主入口 JS（排除 review-only chunk）751,630→757,305 字节；gzip 207,495→210,322 字节，增加 2,827 字节。GPU 显存未直接采样，纹理数和几何字节不能替代显存实测。

稳定帧率另连续采样 120 个新 RAF 区间，断言页面前台、未超时且实际渲染帧数至少 120；与初始化混入的旧滑窗读数分开。环境是 **ANGLE Intel Graphics / D3D11 的桌面 headless Edge**，非 RTX、非手机 GPU。桌面及低东侧视点新旧约 28 FPS；**390px 南正面最终候选 23.20、基线 25.61 FPS；因出现回退又独立复测一次，候选 23.40、基线 28.23 FPS**。全部样本保留在机器报告，不能用较早一轮约 28 的样本宣称手机性能无回退；原因尚未定位，也没有用删玻璃分层或降低全站画质来换绿灯。该视点性能是开放问题。环境刷新节奏受限，不能外推真实设备 60 FPS。冷场景初始化基线 12.19 秒、候选 13.32 秒，产品交互轮次约 13 秒，也是未解决项；本机 localhost 不代表公网首屏。

**没有真实 iPhone Safari、热节流、手机显存或公网网络验收。** 移动端截图/触控只表示 390px Edge 仿真通过。

## 6. 可追溯人工评价与下一关

评分是本轮证据覆盖等级，非客观建筑相似度百分比：0=失败/无证据；1=示意；2=有资料且主要关系可辨、仍有明显未知；3=多视角及相应实测通过；4=图纸/测量及目标实机完整通过。

| 维度 | 等级 / 4 | 依据与未达标项 |
| --- | --- | --- |
| 地理准确性 | 2 | 原 OSM 平面/ID 保留且无面积缺失；无正射控制点与实测误差统计 |
| 几何相似性 | 2 | 官方层数与 2021/2025 轮廓相互支持；层高、退台深度、屋脊、钟楼比例仍估算 |
| 材质色彩 | 1 | 自制浅石色、暗玻璃和地被符合大类；非照片标定 PBR，局部立面仍规则化 |
| 景观关系 | 2 | 不干扰既有场地和树阵；庭院/联廊高差未知，入口树遮挡仍在 |
| 交互 | 3 | 实际鼠标选择、搜索、触控、漫游软件检查通过；缺真实 iPhone |
| 性能 | 1 | 绘制调用下降，但手机南正面两轮稳态样本回退；冷启动慢，显存/手机硬件未验 |

下一阶段先补可公开的南北馆平立剖、各段标高/退台和屋顶实测依据，再调整主轮廓；不要先靠装饰或新增绿化掩盖比例问题。下沉庭院及架空通道继续证据门禁。生产接入只交给集成线程；这个独立分支本身不代表线上升级。

## 7. 复现及集成步骤

```powershell
npm run verify
node scripts/verify-library-asset-r11.mjs
npm run build
node node_modules/vite/bin/vite.js build --config vite.library-r11.config.mjs
node node_modules/vite/bin/vite.js preview --config vite.library-r11.config.mjs --host 127.0.0.1 --port 27862 --strictPort
# 产品入口 http://127.0.0.1:27862/#way%2F263624481
# 固定全景 http://127.0.0.1:27862/library-r11-review.html?inspection=r11-oblique-wide
# 灰模在 review URL 追加 &stage=massing
git apply --check docs/quality-v2/library-r11/world-integration.patch
```

灰模实际由 review query 设置实例前的 `libraryReviewStage`，生产 review 也支持该参数。对照基线构建加 `--mode r11-baseline --outDir dist-r11-baseline`，预览使用另一端口。`qa-library-r11.mjs` 必须传 `/library-r11-review.html` URL，不能传产品根入口；会拒绝缺少库资产审计接口的画面。

集成线程：先同步本分支代码与测试，再协调并应用 world 最小补丁，运行完整检查及产品浏览器验收。若 world 已前进而 guard/patch 报错，先读实际差异，不放宽 guard 或整站覆盖。未获新资料的部分继续标示近似。
