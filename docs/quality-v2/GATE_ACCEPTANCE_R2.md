# 兴庆校区入口复原验收 · 2026-10-25 第二轮

## 实际数据与入口完整性

- 北门：OSM `node/1703824040`，北侧咸宁西路。原工程简化方柱已替换为有曲线檐口、侧翼浮雕、双语校名和栏杆的摄影参考模型。照片来源 Wikimedia Commons 的 **XJTU Main Gate.JPG**，IronBlood，2011 年，CC BY-SA 3.0。侧翼 OSM 的估算高度保留在数据中，但渲染降低到 5.3m 近似体量。
- 南门：OSM `node/11303872079` 和 `node/11303872080`，使用两个 gate 节点的中点作为入口标记；参考 **XJTU Gate.jpg**，Jucember，2011 年，CC BY-SA 3.0，新增与北门不同的红褐色校名墙、徽章、后方楼体及栏杆示意。
- 东南门：OSM `node/1614214665`，校区东南侧真实门点。
- 西北门：OSM `node/1614232375`，OSM 标有 access=no；这是位置示意，不代表今日开放。
- 东北门：OSM `node/11454811779`，真实门点。
- 西南门：OSM `node/11454811780`，真实门点。

以上六处都可从网页搜索和地图标签找到，北门与南门有不同的摄影参考立面，其余四处只有真实位置 + **抽象入口结构**，不能声称已获得其原始模型或测量尺寸。东门彩虹桥、教学二区大门以及行政或临时出入口目前缺乏足够可靠的坐标或与当前场景一致的模型，未伪造。

## 工程链条的修复

1. 原始 OSM `data/source-osm.json` 已经有南门两个节点和东南门 gate 节点，但 `scripts/prepare-data.mjs` 使用只保留校区多边形内部节点的规则，错误丢掉了边界上的这些入口。已修复，明确允许校园附近符合位置边界的 `barrier=gate` 节点进入 POI。
2. 新增 `src/gate-entries.js` 统一网页搜索与三维标签的入口数据，去重合并南门双节点；六处入口实际数据由源文件生成，不硬编码假坐标。
3. 新增独立 `src/south-gate.js`，保留 `src/north-gate.js`，另外 `src/secondary-gates.js` 用于缺乏建筑照片的入口。侧门示意结构朝校外围道路小幅偏移以避免被建筑盒体遮挡，但标记仍使用原始 OSM 位置。移动端独立查看截图覆盖南北门。
4. 下载 Commons 960px 预览版，两份新图像都保留原作者、原图与 CC BY-SA 3.0 许可链接，并在地点详情中提供真实照片对照。
5. `scripts/verify-gates.mjs` 检查 5 个非北门条目的完整性、南门两节点合并、模型顶点有限、合法空间边界、北门与南门关键结构。`scripts/verify-photos.mjs` 增加 CC BY-SA 3.0 两份照片的 JPEG 与署名检查。
6. 保持原有 `npm run verify`、`npm run build` 和 GIS/步行/操场测试，不中断原来的页面交互。

## 结果与局限

- 本机桌面 Edge WebGL 对北门、南门、东北门、西北门等进行真实渲染截图。
- 390x844 窄屏 Edge 视口显示南北门，地点卡片不溢出。
- 用户真实 iPhone Safari 上的持续双指旋转、画质、GPU 闪烁无法通过桌面模拟完全证明；不得声称 iOS 实机全面通过。
- 官方北门“慧识界”浮雕确认为 1989/1991 建造的文化设施，但是模型上的纹饰只是近似艺术表达；南门以 **2011 年**照片为参考，未代表 **2026 年**变化。
- 目前尚未取得学校官方可授权的整校 CAD/BIM/摄影测量资产，也未训练 3D Gaussian Splatting。场景依然是精细化图志与几处重点地标的近似复原，不是照片级数字孪生。

## 官方与授权参考

- https://dwxcb.xjtu.edu.cn/info/1085/17811.htm
- https://www.ef.xjtu.edu.cn/info/1845/7846.htm
- https://commons.wikimedia.org/wiki/File:XJTU_Main_Gate.JPG
- https://commons.wikimedia.org/wiki/File:XJTU_Gate.jpg
- https://creativecommons.org/licenses/by-sa/3.0/

详细图像与作者条款见 `public/assets/reference/README.md`。
