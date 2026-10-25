# 钱学森图书馆 · 实景参考重建 R2（2026-10-26）

## 本轮的照片核实（施工前实际查找）

1. **2026-10-13 新华社**《校馆弦歌丨西安交大钱学森图书馆》，描述兴庆校区“书山形”图书馆外观：https://www.xinhuanet.com/20261013/d42e47404e3c4ab6b336946bc42d276a/c.html
2. **2026-10-13 中国之声**《图书馆与钱学森》，含图书馆外景：https://www.yangtse.com/news/yw/202610/t20261013_401928.html
3. **2016-04-08 西安交通大学新闻**《“书香交大 漫卷长安”》，可清楚看到入口宽幅蓝色玻璃幕墙、馆名题字、铜像基座，以及圆形下沉广场挡墙和不锈钢围栏：https://news.xjtu.edu.cn/info/1079/52073.htm
4. **西交官方钱学森图书馆介绍**：https://www.xjtu.edu.cn/tsda/qxstsg.htm 。北楼（1961 年）与南楼（1991 年）是两部分，不应做成一样的形态。
5. **2025-06-04 中国科普网**《打卡科学家地图》，文字与校图证明南楼为“书山形”，入口有钱学森青铜像：https://www.zgkpw.org.cn/kxjdt/content_350098.html

以上参考照片只用于视觉核对；未将未授权的新闻图片下载进仓库、用作网页照片纹理或公开再分发。只记录 URL、发布时间及可验证的视觉特征。**不存在建筑 BIM / 实测高程 / 多视角摄影测量成果。**

## 与旧版对比后的真实改造

- 新增 `src/library-clock.js`：分层钟楼、四角坡屋顶、表盘及轮廓；仅参考照片形状，位置与尺寸仍为近似。建筑最高点不超过学校历史文档支持的 49.75 米高度。
- 修改 `src/library-facade.js`：将过窄的 28 米门厅玻璃面改为约 66 米的宽幅中央玻璃立面；增加连续石质题字带、分格幕墙、中央门廊、入口台阶、立面结构。实际尺寸不代表竣工图。
- 新增 `src/library-forecourt.js`：圆形广场三级石质环带、深色庭院示意、半米高内侧挡墙、40 根栏杆立柱及双道环形不锈钢栏杆。**没有挖开 OSM 原有地面**，暗色圆心只是视觉高度差提示，不能称为真实下沉结构或实测地形。
- `src/world.js`：接入钟楼与广场模型，删除第二块重复悬浮题字；聚焦图书馆时清理周围所有标签，避免遮盖立面。
- `scripts/verify-library-reconstruction.mjs`、已有 `verify-library-forecourt.mjs`：检验五组建筑材质合批、宽幅玻璃、钟楼和围栏、图片参考出处、校园边界、有限几何和高度。纳入 `npm run verify`。

## 本机实际浏览器图形 QA

使用 Windows Edge、真实 Vite Three.js 渲染，对同一页 `#钱学森图书馆` 连续截图并人工检查：

- 第一轮：`library-clock-forecourt-desktop-r1.png`、`library-clock-forecourt-mobile-r1.png`；可见新钟楼和圆盘，但玻璃门厅过窄。
- 第二轮：`library-front-atrium-desktop-r2.png`、`library-front-atrium-mobile-r2.png`；玻璃幕墙已加宽，但图书馆还被多处建筑标签遮挡。
- 第三轮：`library-reconstruction-final-desktop-r3.png`、`library-reconstruction-final-mobile-r3.png`；增加广场内侧挡墙与立面分格细节。
- 交付验收：`library-clean-facade-desktop-r4.png`、`library-clean-facade-mobile-r4.png`；清除图书馆聚焦时的遮挡标签，玻璃中轴、钟楼与广场的主体均可见，没有明显黑面或页面横向溢出。

自动验收：`npm run verify`、`npm run build`、`git diff --check` 通过。Chromium 桌面/手机静态截图不能证明 iPhone Safari 真机手势、持续帧率、GPU 闪烁全通过。

## 尚未达到高保真的清单

- 图片中的圆形下沉庭院实际有明显高度差。现在仅用颜色、栏杆、挡墙近似表现，**底层地面没有真实开孔**。
- 2026 年的真实建筑窗格数量、台阶宽度、铜像形状及周边植物没有可靠实测尺寸，现有模型仍属于照片参考的程序化重建；不是激光扫描、BIM 或 3DGS。
- 不能将南楼与北楼全部使用同一种书山造型；需要各自的现场照片、地理轮廓和独立高精模型。
- 如要达到以假乱真，需要取得可合法处理的高分辨率多角度素材、现场量测尺寸、PBR 材质照片、实际高程与摄影测量或手工 Blender 建模，并在 iPhone 上持续验收。
