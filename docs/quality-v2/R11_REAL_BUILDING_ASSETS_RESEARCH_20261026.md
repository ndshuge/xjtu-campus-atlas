# R11 兴庆校区真实建筑资产研究与版权门禁

研究日期：2026-10-26。工作树 `E:\CHATGPT\work\xjtu-r11-assets-research`，分支 `research/r11-xjtu-assets`；来自最新本地与远端一致的 main `36170135addd3c16bebf2f179607e5ee4574043a`。仅资料研究，未下载/导入第三方建筑模型，未触碰生产几何、未部署。承接 `CODEX_R9_FINAL_AUDIT_MOBILE_AND_ASSETS_20261026.md`、`SITE_PLAN_PRIORITY_R1_20261026.md`、`campus-site-evidence.json`，非另建知识库。结构化核查索引见同目录 `r11-assets-evidence.json`。

## 结论与等级

**P0：追索完整建筑模型，但目前没有一份兴庆真实建筑模型可在不征得许可的情况下直接进入公开站点。** 2011 SketchUp 旧虚拟校园与 2012–2013 校方/超图 GIS **是两个有时间差的系统，不能认定同一文件格式、同一数据库或同一权利主体**。三类确证：官方确有模型；模型实际下载/源文件、现状精度、可改编/网页部署/再分发尚未核实。开放素材只有通用 CC0 材质和现有 OSM 地理数据（ODbL条件合规）。

权限代码：`RESEARCH_ONLY`=链接查阅文字事实，照片/论文图不能直接作贴图；`PERMISSION_REQUIRED`=未取得书面权利许可，禁止模型下载、拆包、公开展示或再分发；`CC0_CANDIDATE`=可合法改编及部署但未下载未集成；`ODBL_CONDITIONAL`=继续遵守归属与可能衍生数据库条款。**网页可看 ≠ 可以下载；下载按钮 ≠ 可公开部署；不得绕过权限/抓取受限模型。**

## A. 兴庆真实建筑资产清单（格式、尺寸等缺失显式标记）

| ID/来源 | 兴庆归属及年代 | 模型文件/技术 | 许可与下载状态 | 对现有模型的增益/Three.js成本 |
|---|---|---|---|---|
| A01 2011 校网络信息中心独立虚拟校园 [论文PDF](https://hehuan2112.github.io/file/other/2011-etm-vc.pdf) | 论文确为西交虚拟校园，**各单体兴庆归属需核验**；2011发表 | 文中证实 Google SketchUp、XML、卫星照片特征坐标；原 `.skp` 版本/大小/精确CRS/LOD/材质/照片拍摄时间均未知 | **PERMISSION_REQUIRED**；仅论文 PDF 公开，原模型下载链接无 | 可获成组建筑立面/地理定位；如获许可导出 SketchUp→Blender→GLB，成本中高、地理配准未知 |
| A02 校网络信息中心/超图 GIS [2012启动](https://news.xjtu.edu.cn/info/1033/12691.htm)、[2013中期](https://news.xjtu.edu.cn/info/1033/10170.htm) | **官方明确兴庆**；项目2012–2013，单体实际建模年份未载 | 兴庆2D/2.5D/3D，图书馆等室内；**不能反推其当年一定采用S3M**；源格式/字节量/CRS/LOD/贴图/照片时间均未公布 | **PERMISSION_REQUIRED**；无公开源文件/授权下载；校方与合作方权属待定 | 完整建筑优先级最高；若获准需先盘点源格式/清洗/坐标校准/按楼LOD，转换成本高 |
| A03 钱学森图书馆 iLibrary 室内精模 [2013官方中期检查](https://news.xjtu.edu.cn/info/1033/10170.htm) | **兴庆确证**；2013展示、制作具体日期未见 | 室内三维模型存在；格式/大小/坐标/LOD/材质/历史照片日期未公开 | **PERMISSION_REQUIRED**；无开放下载；室内非公开信息应审核 | 对入口、连廊、馆内中庭组织有潜在高价值，但室内旧现状需复测；导出/删敏/校准成本高 |
| A04 XJTUMC 像素工坊 [2022 MUA调查](https://www.mualliance.cn/report-2022)、[2023团队介绍](https://www.mualliance.cn/archives/1559) | **兴庆明确**：钱学森图书馆、中楼、北门、主E楼、思源活动中心；2020–2023开始/分期 | Minecraft复原；存档原格式、大小、建筑坐标、分级及贴图细节未公布；非可直接用GLB | **PERMISSION_REQUIRED**；社团原作不当然可公开复用 | 用于验证完整体量/门洞/屋顶；若授权，可尝试MC地图→几何合面→Blender→GLB，成本高 |
| A05 校方规划/档案 [校园史迹图](https://news.xjtu.edu.cn/info/1033/18748.htm)、[VI地图](https://vi.xjtu.edu.cn/qt/jddt.htm) | 兴庆确证，史迹图2015发表；非现状竣工图 | 网页图文；真正总平DWG、立面、剖面、场地高程的下载/规格/坐标未知 | **RESEARCH_ONLY**；图片不是自由贴图，无图纸下载授权 | 高价值布局校准；取得可公开部分CAD/PDF后需配准 |
| A06 钱学森图书馆官方外观资料 [2016保护名录](https://news.xjtu.edu.cn/info/1219/153497.htm)、[2022官网](https://www.xjtu.edu.cn/info/1112/2221586.htm)、[2024修缮](https://news.xjtu.edu.cn/info/1002/213283.htm) | 兴庆确证；北楼1961、南楼1991，2013以后改造、2024修缮 | 图文参考非3D。报道发布日期可核验，但**图片实际拍摄日期无法从报道反推**；坐标/图纸/LOD/材质文件未知 | **RESEARCH_ONLY**；网页图像不可未经许可再贴图/仓库存放 | **P0现状校准**，见下一节 |
| A07 本项目已用 OSM [数据版权](https://www.openstreetmap.org/copyright)、[OSMF署名](https://osmfoundation.org/wiki/Attribution_Guidelines) | 具体兴趣点按现有 `public/data/campus.json` 校准；数据可随时修改 | OSM纬经度 WGS84；本项目场景坐标转换以源码为准；非建筑精细模型，无PBR材质/LOD；导出大小随区域 | **ODBL_CONDITIONAL**；[正式导出入口](https://www.openstreetmap.org/export)，署名与衍生数据库义务 | 保留现有可复用轮廓，不替代实测高差/层高；接入成本低 |
| A08 Sketchfab / GitHub / 3D Warehouse / CG模型平台 | 本轮**未证实**具有兴庆准确归属、确切作者和明确允许公开部署的完整建筑模型 | 文件格式、大小、坐标、LOD、材质和建模年份均未知 | **PERMISSION_REQUIRED / NOT_FOUND**；不可把关键词结果当正式模型。Sketchfab需逐页CC许可证；3D Warehouse官网FAQ明确限制部分网页聚合/公开研究项目分发 | 暂不建议引入；单独核权与照片比对后才能评级 |

上述 A01 论文明确旧地图入口 `map.xjtu.edu.cn`（仅历史线索，不尝试访问内部API）；文中 XML 位置是系统架构描述，不是开放数据协议；论文首页旧联系邮箱 `filmkiller@xjtu.edu.cn` **现时有效性未知**。2013项目合作对象为北京超图软件有限公司，产权与后续维护责任需询问校方。

## B. 钱学森图书馆 P0 真实度基准（适合给 Codex）

1. [2016官方保护名录](https://news.xjtu.edu.cn/info/1219/153497.htm)：北楼1961年建，南北馆背向相连；北楼主体“山”字四层+南侧五层书库；南楼1991年投入使用，I/III段三层、II段地上11层地下1层，屋顶机房/水箱两层；南楼地面高度**49.75米**；一至三楼长廊连接。不要把49.75米误施加于北馆或所有附属体。
2. 同来源及 [2022官方图书馆介绍](https://www.xjtu.edu.cn/info/1112/2221586.htm) 用于区分1961北馆、1991南馆及2013以后改造，不将2013室内模型断言为2026现状。
3. [2024修缮报道](https://news.xjtu.edu.cn/info/1002/213283.htm) 用于标记资料时态；还缺**现状南北馆首层/二层平面、连接廊桥剖面、室外台阶及下沉/架空净空、室内外地坪标高**。官方网页无公开CAD/IFC模型下载。
4. 现场相片及文献版式必须记录**发表时间 vs 拍摄时间**两个字段；日期未知写未知；原图不纳入仓库。当前已存在 `SITE_PLAN_PRIORITY_R1_20261026.md` 相关净空证据，勿重复推导。
5. 先完成模型包络：坐标原点与局部锚点、南北楼分段真实层数、主塔49.75m高度基准、入口阶梯/连廊开洞；得到有来源的正/侧/后照片和剖面后再做光照/窗格，不再堆单面浮皮。

## C. 可立即合法复用的通用素材（**候选而非已导入**）

许可证权威页：https://polyhaven.com/license ；Poly Haven 原作者确认 CC0，允许修改、网页展示及再分发，包括商业使用，无强制署名；实际素材需由原站下载控件选择档位，文件大小依档位/格式而变。**不能把站点Logo、用户渲染预览图等一概视为CC0素材。** 下列素材不是西交建筑，不可当作建筑几何来源：

| ID/页面及下载入口 | 可选文件/网页所示大小 | 材质/LOD/坐标 | 用途与转换成本 |
|---|---|---|---|
| C01 [Asphalt 02](https://polyhaven.com/a/asphalt_02) | 1K–8K，PNG/JPG/EXR 或 glTF/Blend/ZIP；网页某默认组合显示约88.53MB，非固定大小 | diffuse、normal(GL)、rough、AO、displacement；UV，不含地理坐标/建筑LOD | 路面近景，成本低；1–2K+压缩KTX2优先 |
| C02 [Stone Tiles 02](https://polyhaven.com/a/stone_tiles_02) | 1K–8K，各类贴图及压缩包；页面约85.43MB（选项变化） | UV/PBR，不含地理坐标 | 石材/广场铺装备选，成本低；须与现场材质色差核对 |
| C03 [Concrete Wall 009](https://polyhaven.com/a/concrete_wall_009) | 1K–16K；页面约63.37MB（选项变化） | UV/PBR，非建筑模型 | 朴素水泥面参考，成本低；不得把清水混凝土当钱馆外墙 |
| C04 [Crosswalk HDRI](https://polyhaven.com/a/crosswalk) | EXR/HDR，1K–16K；页面约22.55MB（选项变化） | 天光环境探针，无地理坐标/建筑LOD | 移动端成本中；优先低分辨率环境光，真实天空需与西交实拍一致 |
| C05 [ambientCG](https://ambientcg.com/) | CC0系列可替代找石材、混凝土、沥青，**具体单件未完成源页核查** | PBR资产依单件而定 | 当前列为待选清单，不能冒充已验证某型号 |
| C06 玻璃 | **未找到特定CC0兴庆玻璃资产** | 不适用 | 优先当前 Three.js 材质+少量反射/粗糙度调整，避免用不真实通用玻璃贴图 |

上述 C01–C04 许可已核实，**本轮没有下载二进制、没有放进 `public` 或 `src`**。Poly Haven站点条款约束自动抓取；这里只保留人工合法下载页而非自行批量抓图。Three.js [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader) 支持 Draco/Meshopt/KTX2，但使用压缩器不意味手机 GPU 总成本必然更低。

## D. 不适合直接复用与缺口

- 3D Warehouse [官方FAQ](https://help.sketchup.com/cs/3d-warehouse/3d-warehouse-terms-use-faq) 对网站模型聚合与研究项目共享另有限制；没有单件模型及开发者书面许可，**不能把其通用模型原样打包到公开源站**。
- Sketchfab [下载与署名说明](https://sketchfab.com/developers/download-api/guidelines)：免费预览不等于获准下载，下载可能要求认证；每件需单独确认CC BY、NC、ND、SA等并持续署名；本轮未找到满足**兴庆归属+真实性+可部署**三项的确定文件。
- CG模型网/通用校园模型、Google/视频平台上的效果截图、GitHub仅含可视化DEMO的站点：无具体兴庆文件及许可就不作资产入库。任何未找到应标为`NOT_FOUND`而非断言网上不存在。
- 2011 SketchUp 建模与 2013 超图项目与现今 GIS/BIM 设计技术不可混淆。现在超图支持 [S3M](https://www.supermap.com/cn/xhtml/10i-tec-3.html)，**没有证据认定2013交大项目就存为S3M**。
- 2016/2022官方照片、2015校园史迹、2023 XJTUMC截图仅适合作事实参考；拍摄日期、作者、图权及图幅比例未知时不可当可分发贴图。
- 当前缺少所有兴庆原始资产的 SHA、实际字节、坐标原点/参考坐标系、建筑件数、材质分辨率、LOD预算、许可协议、著作权利人签章，因此**兴庆完整建筑模型可直接合法复用计数：0**。

## E. 合法授权申请顺序（仅渠道核实，未代用户发送）

1. 学校**网络信息中心虚拟校园**：负责人王齐，029-88968989，https://nic.xjtu.edu.cn/xxhjs/jcyyfw/xnxy.htm ；问2011 SketchUp与2013 GIS原工程档案的持有人、可选公开模型清单、导出格式、坐标、权属和允许GitHub Pages发布的具体协议。
2. **校园规划与基本建设管理中心**：ghjj@mail.xjtu.edu.cn、029-83399106；规划部029-83395162、设计部029-83399109（https://www.xjtu.edu.cn/info/1055/5499.htm 、https://ghjj.xjtu.edu.cn/info/1005/2087.htm）。请求**可公开且不涉敏**的钱馆总平、主立面/侧立面、剖面和室外标高及图纸公开使用许可。
3. **钱学森图书馆办公室**：029-82668101、director_lib@xjtu.edu.cn（https://www.xjtu.edu.cn/info/1112/2221586.htm）。问可授权实景图集、北楼/南楼改造年份以及南北联廊与前广场现状。
4. **档案馆、校史中心**：archives@xjtu.edu.cn、029-82668759；xszx@xjtu.edu.cn、029-82660984（https://www.xjtu.edu.cn/tsda/dag_bwg.htm）。问历史设计图、总平面、图书馆历次修缮竣工材料的合法查阅/公开派生使用范围。
5. **北京超图**：sales@supermap.com、029-84526619（西北区）或总部010-59896655（https://www.supermap.com/zh-cn/a/news/Contact.html）。先由学校确认其有权共享2013年具体项目资产，再问可否提供经过授权的源数据/格式说明与通用导出技术。
6. **XJTUMC**：公开MUA [成员页](https://www.mualliance.cn/archives/1559) 联系原社团/作品负责人；未核实可直达的有效个人邮箱；明确寻求世界存档、比例校准资料及**可修改/公开部署/再分发**的书面许可。

建议一次性请求条款：`asset id/building; author and chain of title; complete file and dependencies; creation date; capture photo dates; coordinates/projection/units; floors and extents; LOD/material inventory; publish on publicly accessible GitHub Pages; allow hosting downloadable GLB; modify/derive; public repo/redistribute; attribution; expiry/withdrawal; sensitive interior exclusions`。若仅获“个人研究”许可，不得把模型放到公开页面。

## F. 成熟方案对照（借鉴方法，不复制第三方建筑）

- [CUHK Virtual Campus System](https://exhibition.cintec.cuhk.edu.hk/projects/virtual-campus-system/)：实景校园+协作式构景、日夜/季节变化、多用户。可借**分层场景、建筑与环境语义**，不必复制 OpenSim 架构。
- [Blender+Three.js College Campus](https://github.com/abmah/College-Campus-3D-Visualization)：Blender烘焙纹理/导入Three.js、PointerLock/射线交互；仓库声明MIT，但其**示例校园不是兴庆**，没有必要拷贝模型。借可编辑源文件与烘焙GLB路径。
- [Cesium 3D Tiles HLOD](https://cesium.com/why-cesium/3d-tiles/3d-tiles-essentials/) 与 [NASA Three.js 3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS)：距离、屏幕误差、局部可见瓦片；**仅模型规模实测需要时再引入瓦片工具，不做全站技术栈替换**。
- GIS+BIM / [超图现行3D GIS](https://www.supermap.com/zh-cn/a/product/gis-tec-3-2023.html)：从建筑ID、坐标系、室外/室内空间边界交付，不应把管线/安全数据放入公众开放场景。

## G. Codex完整建筑样板的明确建议（批准建模前必须达标）

选择**钱学森图书馆作为一个完整建筑组**样板，保留现有 Three.js/OrbitControls及OSM ID，不推倒生产版。先在独立样板目录放获授权的来源、模型版权manifest与建筑包络；若无原模型，使用**自己根据可引用事实和自己实拍重建**的 Blender 原始场景。建议导出 `library_shell.glb` + `library_details.glb`（或分北楼/南楼），留现有程序化建筑fallback。所有第三方二进制入库先过许可门禁。按北馆/书库/南馆I-II-III体量分别建立坐标原点与朝向，计算总高/退台/窗格比例；标记未有证据的楼层高度为“估算”，禁冒充测绘值。

交付manifest建议字段：`buildingId, sourceUrl, originAuthor, licenseProof, photoTakenAt, modeledAt, bboxMeters, worldAnchorWGS84, localUnits, upAxis, parts, trianglesNear/Mid/Far, textureBytesGPU, glbBytes, occlusion, portals, exitClearance, fallbackId`。试点阈值**不是**本轮实测结论：在390 CSS像素 iPhone级别档位，先作A/B预算（例如单栋低LOD几万三角形量级作为试验上限），对比FPS、GPU显存、draw calls、首次交互时间与相机距离切换；不要把固定数字当普适硬门槛。

工程闭环：1) 对来源照片/剖面做正背侧和半俯瞰对应关系；2) 校验GLB bbox/单位/法线/重叠面与主要出入口；3) 近处加载完整建筑、中处合并简模、远处用包络或已有几何，切换需迟滞避免闪；4) 按需加载、卸载纹理并隔离楼栋材质；5) iPhone Safari 实机相机远近移动/热节流/触控测试；6) 有实测收益再走合并评审。此次只提供研究依据，**不实施任何建模、格式转换或发布**。

## H. 本轮证据缺口与核查方法

确认：官方网页存在、2011论文正文经过文本和页面截图交叉检查、2013中期及官方结构尺寸、版权条款、联系人页面可访问。未确认：旧三维系统当下可用性、模型实体下载、所有模型格式/实际体积/CRS/LOD/精确单体年份、照片真实拍摄日期、原始作者版权链、官网图纸授权、第三方具体兴庆GLB、移动实测性能。无二进制校验值可提供。**本轮仅将可独立复查的来源URL登记，并把未知项目保持未知。**
