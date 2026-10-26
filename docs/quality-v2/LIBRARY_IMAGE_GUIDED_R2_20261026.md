# 钱学森图书馆影像对照建模 · Sprint 01 R2 / 2026-10-26

## 本轮研究先于建模

**地点**：西安交通大学兴庆校区，钱学森图书馆南楼入口及面向入口广场的正立面。此模型保留 OSM 原始 `way/263624481` 建筑占地，不将南北馆一概视为同一建筑。

已核查参考：

| 参考 | 日期和可靠性 | 可观察的真实特征 | 授权边界 |
| --- | --- | --- | --- |
| 西交官网钱学森图书馆 https://www.xjtu.edu.cn/tsda/qxstsg.htm | 页面 2026-04-13 更新 | 图书馆南北楼为两期建筑、南楼 1991 年投入使用 | 仅用于事实及建筑比对，未下载/再分发官方图片 |
| 新华社/新华网 https://www.xinhuanet.com/20261013/d42e47404e3c4ab6b336946bc42d276a/c.html | 2026-10-13 报道 | “书山”形总体轮廓，南楼仍为校园核心场馆 | 页面影像仅参考，不复制图像 |
| 中国之声报道（扬子转发）https://www.yangtse.com/news/yw/202610/t20261013_401928.html | 2026-10-13 | 2026 年图书馆外景、近期现状佐证 | 图片版权保留在原处 |
| 西交官方校庆图 https://news.xjtu.edu.cn/info/1079/52073.htm | 2016-04-08 | 宽幅玻璃幕墙、带书法馆名的横向石质门头、圆形下沉入口庭院和金属栏杆、入口人物胸像 | 仅外形建模对照，不复制照片或字迹纹理 |
| 兴庆校园 Commons 摄影分类 https://commons.wikimedia.org/wiki/Category:Xingqing_Campus_of_Xi%27an_Jiaotong_University | 文件各有独立上传和拍摄时间 | 图书馆与主楼的俯视比例及周边树阵可进一步核对 | 需逐文件检查许可证；当前未下载或放入本次模型 |

说明：这些来源拍摄于不同年份，**不能**将其中临时广告、旗帜、海报、展陈等简单认定为 2026 年永久外观。

## 直接代码施工

- `src/library-facade.js`：整合更宽的蓝灰玻璃幕墙、石材横向馆名带，修正门廊与正面比例；同时保留前一轮入口门窗与主楼退台。
- `src/library-clock.js`：新增独立钟楼几何，坡屋顶、檐口、时钟面及分钟刻度；总高不超学校资料引用的 49.75m。
- `src/library-forecourt.js`：新增圆形院落的石材环带、钢制环形栏杆（40 根支柱）、步行引导带及馆前胸像的红石基座。**因为无法精确改动现有场地高程，中心圆形区域只是“非挖方的下沉空间视觉示意”，不宣称真下沉。** 尚无足够授权多视角雕塑资料，故不捏造钱学森面部像。
- `src/world.js`：聚焦图书馆使用正立面摄影角度；原来额外添加的重复“钱学森图书馆”字样删除，只保留建筑自带横向门头；聚焦建筑时降低其他浮动标签对钟楼与外墙的遮挡。
- `scripts/verify-library-forecourt.mjs` 并入 `npm run verify`：钟楼高度、庭院圈与 OSM 建筑碰撞、校园边界、主要模型结构、无重复外墙标志均自动检查。

## 逐张真实渲染 QA

照片比对不是以“写了代码”或“没有报错”为验收标准。本轮曾生成三轮以上本机 Edge WebGL 的截图：

- `library-clock-forecourt-desktop-r1.png` 和 `library-clock-forecourt-mobile-r1.png`：看到了钟楼和环形院落，但镜头仍从空中俯看、重复题字未消除。
- `library-front-photo-matched-desktop-r2.png` 和 `library-front-photo-matched-mobile-r2.png`：转到正面，发现一个高处馆名加一个低处馆名，外观差异很明显，未通过。
- `library-integrated-atrium-clock-desktop.png` 和 `library-integrated-atrium-clock-mobile.png`：整合新版更宽入口和单一馆名，初步接近 2016 年学校正面照片中的宽玻璃形状。
- `library-bright-glass-photo-desktop-r3.png` 和 `library-bright-glass-photo-mobile-r3.png`：蓝灰色玻璃不再过暗，正面已没有重复馆名和相机标签遮挡；移动端主体能够识别，但远景仍是低多边形整体环境。

## 独立可验证结果

- `node scripts/verify-library-forecourt.mjs`：通过。图书馆钟楼模型顶高 50.52 个 Three.js 场景单位（其中地表基准 1.1m），低于绝对上限 50.85。
- `npm run verify`、`npm run build`：通过。
- 没有移动、覆盖或修改 OSM 原始地理数据；没有把网上版权图片直接导入前端。

## 遗留问题和不能夸大的部分

1. 现有 OSM 及模型缺乏最新测绘的真实外墙尺寸与摄影测量数据：只能称 **2026 年资料与历史图片对照的解释性建筑模型**，远非照片级。
2. 圆形下沉庭院缺少真实地形挖方，栏杆构件与实测长度未核准。
3. 馆前钱学森铜像缺少授权的精细 3D 雕塑（当前仅基座，不是钱学森肖像）。
4. 建筑周边普通教学楼与树木仍是大规模风格化实例，尚不能“以假乱真”。
5. 未在实际 iPhone Safari 上做持续 GPU 稳定与手势回归，桌面 390px Edge 截图只能验证浏览器响应布局和当前 WebGL 画面。
