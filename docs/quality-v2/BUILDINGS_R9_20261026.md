# 建筑群 R9 — 独立分支验收与集成交付

状态：VERIFYING。本轮是有实景参照的近似建筑改进，不是测绘级还原或全校园高保真完成。

## 基线与边界

- `feature/buildings-r9`，工作树 `E:/CHATGPT/work/xjtu-buildings-r9`；从本机及远端均核实的 `main 9d154bcd9363f07d8212bb58332820fb0a96b0d8` 建立。
- 已继承 R7 北馆四层、书库五层、屋顶绿化和建筑群相机；没有重做 R6 植被、R8 校门、R3 道路、地面或手机渲染。
- 不接触旧 `feature/building-massing-r7` 的未完成合并，不合并 main，不发布 Pages。
- 仅建筑模块、建筑专属 QA、证据及验收文档。**共享 `world.js` 和 `package.json` 不修改，不需要 world 接入补丁**；沿现有的 `createLibraryFacade`、`createMainTowerFacade`、`createScienceHall`、`createBuildingSilhouettes` 调用生效。

## 实景证据

完整逐项记录见 [建筑 R9 证据表](buildings-r9-evidence.json)。本轮亲自查看以下校方原图及已许可航拍：

| 地点 / 资料 | 发布与摄影日期 | 可确认内容 / 缺口 |
|---|---|---|
| [北馆正面，张轶朋](https://wmw.xjtu.edu.cn/images/19/09/09/1umue6d7cp/dibiao5.jpg)，[校方图集](https://wmw.xjtu.edu.cn/wh/dbcg1/2.htm) | 图集未列明确发布日期；EXIF Original **2017-05-18 17:51:33**，相机时钟未核验 | 对着水池的北入口；高竖向玻璃、浅色柱廊、楼层间腰墙和宽檐口；两侧延伸被树遮挡，不能据单张图测长宽 |
| [官方图书馆建筑介绍](https://news.xjtu.edu.cn/info/1219/153497.htm) | 发表 **2016-11-21**，摄影日未知 | 北馆四层、书库五层、南馆地面总高 49.75m；没有层高、竖向或桥梁图纸 |
| [2025 航拍，Liuxingy](https://commons.wikimedia.org/wiki/File:西交兴庆之俯视钱学森图书馆.jpg) | 元数据 **2025-07-25**；CC BY-SA 4.0 | 北馆 U/山字形、T 形书库与南馆退台关系；沿用现有缩略图和署名，不当作正射测绘 |
| [主楼正面，范新凯](https://wmw.xjtu.edu.cn/images/19/09/09/1umue6d7cp/dibiao9.jpg)，[校方图集](https://wmw.xjtu.edu.cn/wh/dbcg1.htm) | 发布日未知；EXIF Digitized **2015-04-16**，**不是已证实摄影日** | 高塔、低翼、开放顶部及浅框深窗关系；A–D 多被树遮挡，无可靠实测高度 |
| [李子萍设计论文](https://www.cnki.com.cn/Article/CJFDTOTAL-JZXB200211005.htm) | 《建筑学报》**2002 年 11 期** | 本轮取得标题、作者与摘要；未取得正文及建筑图。二手出现的 107.45m / 24m 未作为改尺寸依据 |
| [逸夫馆西入口，研工部供图](https://wmw.xjtu.edu.cn/images/19/09/13/183d9v00b5/13.jpg)，[校方图集](https://wmw.xjtu.edu.cn/wh/dbcg1/2.htm) | 图集发布日未知；EXIF Original **2019-07-15 15:44:00**，相机时钟未核验 | 折面蓝玻璃、外展赭色墙、弧形门廊、立体尖顶开放屋架；没有可靠尺寸、剖面或 2026 现状证明 |

学校照片仅作人工参照，存于仓库外 `E:/CHATGPT/work/xjtu-r9-reference`，不提交、不发布、不作为贴图。新几何、材质均为原创程序资产。

## 实际改动

1. **去重与外墙**：建筑专属不透明外墙覆盖原通用 Shader 窗格；专属玻璃与墙面具有明确外侧间距。没有修改共享 Shader、植被 Shader 或源 OSM。北馆旧整圈 13m 窗带退出，R7 四/五层立面继续单独负责外围，新增部分只负责有照片的北入口柱廊。
2. **图书馆**：北入口用连续竖向玻璃、浅色竖柱及四层腰墙区分普通侧翼；南馆正面与侧面消除通用格子和成对窗格的重叠。无专属证据的南馆背面保留原示意窗，不以光秃墙冒充准确立面。R7 分区、14/17.5m 估高、49.75m 文献上限、屋顶绿化与庭院全部保留。
3. **主楼**：内侧立面竖件止于顶部开洞下方，修复穿入开洞的问题；R5 椭圆构件、原开洞主体及 OSM 足迹不变。A–D 的四个无资料屋顶附加块删除；专属侧翼窗格得到独立外墙，不再与通用网格混杂。E 80.5m、A–D 27m 均仍属原估高，不冒充实测。
4. **逸夫馆**：以已有西入口 OSM 接缝组织两片折面玻璃及两侧外展墙；矩形雨篷改为有厚度的弧形平面；旧两片独立三角架改为四角立柱、边框与单顶点的空间屋架。移除照片不支持的宽台阶及原叠加层游离屋顶条。保留原 21m 估高和场地标高；折面深度、柱网与雨篷尺寸明确为近似。
5. **验收入口**：原 `building-review.html` Hook 会再加一套生产场景已有的叠加模型，本轮修复为只引用已有实例；每场景强制独立导航、核对视角名和仅一份叠加层，拒绝落在源建筑内的机位，检查整个截图期间源文件 SHA 未变化。

## 视觉闭环

- [最新 main 基线 12 视角](buildings-r9-before/browser-results.json)：建筑改动前记录；不是旧 R7 的截图。
- 第一轮生产截图暴露南馆背面被遮成大块空墙，已缩小专属外墙覆盖范围。第一轮摄影 QA 暴露北馆被腾飞塔挡住、主楼机位在旧楼内，第二轮仍有主楼底部遮挡；这些轮次不计最终通过。
- 正面是为看清建筑特征而设置的可复现观察点，不声称精确匹配照片镜头。所有最终场景保留树木和其他建筑；没有隐藏不利几何伪造对照。

| 对象 | 桌面正面 | 桌面斜视 | 390px 正面 | 390px 斜视 |
|---|---|---|---|---|
| 北馆 / 书库 / 南馆关系 | [正面](buildings-r9-photo-accepted/libraryFront-1440.png) | [斜视](buildings-r9-photo-accepted/libraryOblique-1440.png) | [正面](buildings-r9-photo-accepted/libraryFront-390.png) | [斜视](buildings-r9-photo-accepted/libraryOblique-390.png) |
| 主楼 A–E | [正面](buildings-r9-photo-accepted/mainFront-1440.png) | [斜视](buildings-r9-photo-accepted/mainOblique-1440.png) | [正面](buildings-r9-photo-accepted/mainFront-390.png) | [斜视](buildings-r9-photo-accepted/mainOblique-390.png) |
| 逸夫科学馆 | [正面](buildings-r9-photo-accepted/scienceFront-1440.png) | [斜视](buildings-r9-photo-accepted/scienceOblique-1440.png) | [正面](buildings-r9-photo-accepted/scienceFront-390.png) | [斜视](buildings-r9-photo-accepted/scienceOblique-390.png) |

另用生产构建的常规相机、完整 UI 和鼠标/触控验证，记录另附最终浏览器结果。摄影入口只用于固定视角审查；生产路径不依赖 Hook。

## 工程验收与限制

- 必须运行未删减的 `npm run verify`、`npm run build`，以及建筑专项 `node scripts/verify-building-envelope-r9.mjs`。
- 新专项对六处建筑合计 74 个外墙样本发射真实几何射线，确认专属外墙/玻璃处于通用体量之前；检查主楼开洞的正反例、逸夫幕墙真实折面与屋架连接节点、数据不被修改。
- 当前构建约 751 kB，稍超既有 750 kB 的警告阈值；保留警告，不提高阈值掩盖。纹理来源与资源数量、实际加载和运行结果须随最终记录确认。
- 真 iPhone Safari、手机 GPU 帧率/热负载、毫米级深度闪烁未验收。Headless Edge + RTX 的数据仅说明本机运行。

### 人工六维审查

0–10 分沿用 R7 口径：5 表示特征可辨而有显著误差；8 需主要特征及实际运行有证据；10 需完整实测及设备验收。以下待最终看图落分，不能将自动测试当作几何真实性评分。

| 对象 | 地理 | 几何 | 材质 | 景观 | 交互 | 性能 | 核心缺口 |
|---|---:|---:|---:|---:|---:|---:|---|
| 北馆 / 书库 / 南馆 | 待审 | 待审 | 待审 | 待审 | 待审 | 待审 | 入口比例近似、层高未实测、南馆背面仍示意 |
| 主楼 A–E | 待审 | 待审 | 待审 | 待审 | 待审 | 待审 | 高度与翼楼比例未取得原图复核、C/D 背面照片不足 |
| 逸夫馆西入口 | 待审 | 待审 | 待审 | 待审 | 待审 | 待审 | 21m 均匀底层体量不表现照片中低附属翼；门前现有近似树位遮挡，未修改 R6 |

## 交给统一集成线程

采用本分支建筑源码及专项测试；在最新 main 的独立集成树普通合并/挑选并重建，切勿复制本轮旧基线 dist 覆盖新发布。无需 world 补丁；保留所有其他施工线修改。把专项验证追加到统一验证入口时，保留现有全部命令。先核查实景照片、最新代码差异及最终截图，再按既有统一发布线处理。本分支自身不发布。

下一步只需取得主楼设计论文全文/立面及逸夫馆平剖面，核对真实总高与低翼分段后再改体量。图书馆下沉庭院、弧形通道仍保持原证据阻塞状态。
