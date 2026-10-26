# 西交 3D 校园 R9 最终 Codex 验收、移动渲染与可复用资产审计
日期：2026-10-26（本地 Windows / Mice Hole 实检）

## 版本与安全整合
- 公网现有源码基线 main: 611f00a1446ef2acdc7fe9f7f21e8939b547d962；gh-pages: 93cdc4a6cc278607d961a13705e53820b1e0b15d。
- Codex 最终提交: 8a61c662229f64b30ede7130719a486c6d43124f。它是针对 fd68603 的验收文档、截图与证据补交；**没有新 src / scripts / 配置变更**。
- fd68603 是当前 main 的祖先（git merge-base --is-ancestor 返回 0），实际建筑源码此前已经整合进入 main。Codex 旧工作树保留构建产物和未跟踪中间照片，不作 reset / clean / 删除。
- 最终文档通过隔离工作树 cherry-pick 进入新集成分支，未让旧 R9 dist 覆盖 R10 生产网页。

## 独立再验收
- node scripts/verify-building-envelope-r9.mjs: PASS；六处建筑合计 74 份外墙射线样本，原北馆旧窗带计数0，主楼顶部入口开洞净空及逸夫屋架连接验证 PASS；属于软件几何回归，不等于现场测绘尺寸正确。
- npm run verify: PASS；npm run build: PASS。Vite 仍有 >750kB 生产 JS 体积警告（警告阈值没被上调）。
- 当前 R10 + R9 Codex 文档生成出的 Edge Headless WebGL：library-north、主楼E、science-west 3场景 × 1440/390 两视口，共 6 次，浏览器 JS/HTTP 错误都是0，实际结果位于 docs/quality-v2/codex-r9-postmerge-views/browser-results.json；检查了视角 selected 一致性。
- 390 CSS px Edge 模拟触控实际回归：单指平移 141.27 场景单位，双指缩放相机距离 2148.19→1644.54，浏览器页面 scale=1，步行进入/移动约4.35单位/退出完成，passed true。结果位于 docs/quality-v2/codex-r9-postmerge-gesture/browser-results.json。
- 不得把 Edge Headless FPS 数字当作 iPhone 帧率。相机运动中 Safari 的地面闪面、GPU 占用、热节流和上下文丢失均未经真机测试。运行时没有实际 iPhone WebKit 远程调试桥接。

## Codex 工作优点
1. 完成建筑结构专项相对独立：主楼入口、图书馆、逸夫馆的立面和附属表面按照片证据做局部调整；未重复开发共用树木、道路或相机体系。
2. 减少了重复窗带和双重表面叠加，提升北馆及主楼的可辨识度，维持原OSM轮廓；保留未知高度为估算。
3. 两种视口和多个机位留图，QA 自查时修过旧观察机位遮挡问题，保留回退证据和实际限制。
4. 基础 Git 分支+独立提交+代码几何测试，易于安全集成。

## 仍存在的不足
1. 主要建筑仅为照片指导的示意复原；北馆四层、书库五层可信，但局部层高、庭院高差与廊桥结构没有建筑剖面，不能声称测绘级精度。
2. 主楼 E 前仍有 OSM 264595812 按约14m估算的独立体量遮入口；主楼翼楼比例缺可靠立面测量；逸夫低附属翼未独立处理、图书馆南馆背面仍示意。不要盲目降低这些体量。
3. 仍有树冠与入口、建筑的视觉遮挡，R6植被树位不是逐株测绘。
4. 没有单独消除 iPhone Safari 的移动闪烁、叶卡动态混叠、Canvas GPU 压力，也没有真机长时间测试。
5. 生产 JS 超750kB 阈值，代码包可考虑拆分，但下载包大小并不等于真实 GPU 显存开销。

## 为什么电脑流畅但手机可能出错
- 当前移动 DPR 上限为1.8；与1.5相比 GPU 像素量约增加44%，即使 CSS 视口没变。高 DPI 影响材质清晰度与渲染时间，不能单靠 DPR 增长解决。
- WebGL 远景道路与广场多个相近层面会有深度量化、交叉面 z-fighting；PC静态图无条纹不等于移动相机无闪。
- 树冠包含 alphaTest 叶卡、LOD 与 mipmaps；不同 Safari/WebKit GPU 驱动、MSAA 采样和透明阈值会产生边缘闪烁/远景糊。
- 场景里约 50~83 万 triangles / 200~470 draw calls（不同视口与机位），全时 requestAnimationFrame 渲染。Windows RTX 5060 运行快无法反映 iPhone 的功耗、带宽、内存、热节流与图形驱动差异。
- 用户描述中的门区漂浮/道路破面也可能属于几何和场景定位问题，与 FPS 是独立维度，不能简单归因手机算力。
- Codex 建筑 R9 **不是**手机 Safari 专项修复，不能声称它已经治好这些问题。

## 参考行业经验（外链，仅参考不自动引入外部代码）
- MDN WebGL 最佳实践 https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices ：差异化平台上限、texture mips、降低 overdraw、GPU内存预算、batch。
- Three.js 高DPI https://threejs.org/manual/pages/responsive.html ：避免无上限用设备 DPR，限制内部像素，按设备能力调清晰度。
- Google Maps 3D https://developers.google.com/maps/documentation/javascript/3d/best-practices ：按镜头视角和距离控制加载/复杂度，渲染循环不要阻塞。
- Mapbox 标签碰撞 https://github.com/mapbox/mapbox-gl-native/wiki/Collision-Detection ：确定性优先级、缩放分级、碰撞空间索引、平滑显隐。
- Khronos glTF KTX2 https://www.khronos.org/gltf/ ：需要导入外部美术模型时优先 GLB/glTF+KTX2 压缩纹理，必要时 Meshopt。现有场景主要是程序化几何，不能盲目把原网格转换成GLB。
- 优先研究可量化的 Safari 真机 FPS、GPU资源、错误帧，而非直接提高 DPR 或增加细节。

## 西交 3D / 可复用资源调查（2026-10-26 公开检索）
| 资源 | 状态 | 用法/授权 |
|---|---|---|
| 西交网络信息中心官方二三维校园系统 https://nic.xjtu.edu.cn/xxhjs/jcyyfw/xnxy.htm | 已证实全校园3D、钱学森图书馆等室内精细模型 | **最有潜力取得原建模文件，但网页无公开下载及素材复用许可**。原入口 http://gis.xjtu.edu.cn/ 本次公开访问不可验证，向学校信息中心咨询开放或教学用途授权。 |
| 2013年西交新闻 https://news.xjtu.edu.cn/info/1033/10170.htm | 明确记录学校信息中心与北京超图建设兴庆、曲江、雁塔校区3D和钱学森图书馆室内3D | 权属需确认，不能因可在线浏览就自行抓取或公开部署。 |
| 官方英语网站校园鸟瞰地图 https://en.xjtu.edu.cn/campus.html | 官方规划/鸟瞰图，可作总体布局参考 | **图片不是3D文件**，发布站点标示版权所有；复用需许可。 |
| 官方视觉识别系统平面图 https://vi.xjtu.edu.cn/qt/jddt.htm | 兴庆校区名称、道路和空间布局参考 | 不是3D模型，不能直接认定自由贴图许可。 |
| OpenStreetMap 开放建筑轮廓、道路数据 | 已在本项目 public/data/campus.json 中使用 | 可继续更新、校对，遵守 ODbL 数据库授权与署名要求；几何高度存在估算。 |
| GitHub/Sketchfab/3D Warehouse 网页检索 | 本轮未核实到与兴庆校区匹配、可直接合法下载的精确GLB/FBX/IFC/S3M文件 | 不把泛用大学建筑或错误校园的素材冒充真实西交。 |
| 超图 BIM+GIS 技术案例 https://www.supermap.com/zh-cn/a/case/5_1993.html | 提供通用校园设施管理技术经验 | **未在该案例正文核实其插图特指西交大**，不能当作本校可提取资源证据。 |

## 最小后续行动
A. 如要真实数字孪生，优先向校网络信息中心、档案馆或原GIS项目合作方取得兴庆校区三维建模的文件/服务接口/合法许可/坐标系/精度与建模时间元数据；
B. iPhone Safari 连续拖动 3 个固定视角（梧桐东道远景、校门与四大发明广场），录屏 + WebGL上下文异常观察；区分深度闪面和纹理闪面；有复现再按根因改；
C. 固定手机分辨率、动态 DPI 质量档位、测热节流，逐项 A/B 而非盲改;
D. 几何精度继续优先主楼阻挡体与逸夫低翼，但需照片和剖面支持。

结论：**建筑 R9 工程集成与公开 Edge 重验通过；Codex 不等于已经修复 iPhone Safari 真机渲染问题。** 当前追加的是验收与研究，不需要覆盖 R10 正式 JS。
