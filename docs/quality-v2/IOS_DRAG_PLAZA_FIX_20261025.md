# iPhone 全景拖动 + 北门背面题字 + 四大发明广场铺装修复（2026-10-25）

## 用户实机反馈
用户上传 iPhone Safari/ChatGPT 内嵌浏览器的兴庆校园全景截图，显示北门附近的白色题字条带在错误视角显现、单指拖动动作诡异、四大发明广场仍像一整片空白平地。此前的截图验收以静态画面为主，不足以验收触摸交互。

## 真正修复的项目

### 手机拖动（根因在交互映射）
- 原 `OrbitControls.touches.ONE=ROTATE`：单指拖动实际是绕一个固定中心旋转，像地图失控。
- 改为 Three.js 官方 `MapControls` 使用的手势配置：`ONE=PAN`，`TWO=DOLLY_ROTATE`。一指平移，双指缩放、旋转。
- 触摸设备用 `pointer:coarse` 和 `navigator.maxTouchPoints` 判断，兼容宽屏平板和 iPhone 横屏，而不只依靠 768px 媒体查询。
- 降低手势转动速度、优化平移速度；移动中的相机目标点约束在校园外围的有限范围。
- 将取消飞行动画的监听器改为事件捕获阶段：防止正在导航飞行时第一次手势被已经禁用的控制器吞掉。
- 按新手势修改“操作帮助”文本。
- 参考 Three.js 官方 MapControls：https://threejs.org/docs/pages/MapControls.html

### 北门全景反面
- 正面照片题字和英文校名的贴图材质只渲染正面，不再从校内方向看见镜像、像横幅一样浮在道路上。
- 北门远距 LOD：在距离 950m 以上停止绘制复杂白色门廊；800m 以内才恢复，以两个不同阈值避免临界距离来回闪烁。
- 距离使用已有 OSM 北门实际坐标，不虚构新地点；标记不随 LOD 消失。

### 四大发明广场的地面
- 原始 OSM 四大发明广场附近空地没有详细 `plaza` 铺装多边形，过去显示成一大片几乎无纹理的底色。
- `src/plaza-terrain.js` 新增**解释性**平坦铺装，明确限制在已检查过的 OSM 空地矩形内：局部 x=[-76,13]、z=[-42,10]；不改变原始 OSM 建筑、道路或地形高程。
- 铺设单一底板、主中轴通道、十字穿行通道、石板缝及四处周边草地区块。独立平面采用逐层偏移，避免重叠面 z-fighting。
- 园林和边缘绿化参考 2013 年真实四大发明广场照片，但没有精确测量全部石板尺寸，未自称“实测广场”。
- 实景照片参考：https://commons.wikimedia.org/wiki/File:Sidafaming_Guangchang.JPG
- 校园广场资料：https://www.xjtu.edu.cn/info/1016/29901.htm

## 自动与图形验收

- `node scripts/verify-mobile-plaza.mjs`：检查单指平移/双指相机映射、飞行中手势捕获、移动边界、门廊背面处理、广场面积与 OSM 建筑占地无交叉、四块草坪及单层平坦铺装。
- `npm run verify` 与 `npm run build`：通过。
- `node scripts/qa-touch-cdp.mjs`：Windows Edge 手机模式 390px，使用真实 CDP `Input.dispatchTouchEvent` 触摸事件模拟一次约 65px 的单指拖动。三个可见建筑地标分别位移 (63,19)、(56,16)、(71,24) 像素，基本同方向，说明场景以平移为主。结果保存为 `docs/quality-v2/qa-touch-pan-result.json`。
- 本地真实 Three.js 视觉截图：
  - `home-mobile-no-mirrored-gate-r2.png`：手机首页无背面白字横幅。
  - `plaza-terrain-r2-grass-mobile.png`：390px 广场内四角装置可见。
  - `plaza-terrain-r2-grass-desktop.png`：桌面广场有主要十字铺装层次与周边绿化。

## 尚未完成
- 无法从 Windows Chromium 模拟证明真实 iPhone Safari 的连续多手势、动态 GPU 闪烁完全稳定。需用户在最新版实机持续拖动、捏合、切换全景和步行再检。
- 广场布局和四组雕塑的位置仍为 OSM 空地上的解释性近似；没有校方施工图/精确高程/实景摄影测量，不得称高精度地形。图书馆周边原始 OSM 仍有部分非精准绿化。
- 早先用户截图的北门背面异常是特定视角问题，本轮已针对透明材质双面显示与远距显示处理；其他地标需要更密集的实机视觉检查。
