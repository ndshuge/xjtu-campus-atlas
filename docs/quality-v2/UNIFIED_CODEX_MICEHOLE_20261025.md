# Codex + Mice Hole 联合施工版整合验收（2026-10-25）

## 集成对象与责任边界

这次从已发布的 `ac42824` 开始，在**相同现有仓库**中整合两条本机施工线，未执行覆盖式 Git reset。

Codex 的本机未提交模型：
- `src/architecture-kit.js`：建筑石材/玻璃材质、几何批处理。
- `src/library-facade.js`：钱学森图书馆更多细分立面、玻璃和台阶。
- `src/main-tower-facade.js`：主楼 E 座立面与开放屋顶门廊；将屋顶框架从超出 80.5m 上限的高度下调，恢复原有高度测试。
- `src/axis-monuments.js`：腾飞塔与饮水思源碑的摄影参考独立模型。
- `src/cultural-facades.js`：逸夫科学馆与思源活动中心的摄影参考入口立面。

ChatGPT / Mice Hole 的本机改动：
- `src/four-inventions.js`：四大发明广场从错误的一组中心雕塑更改为四角四组示意模型；其中倾斜石块参考 2013 年的真实照片，造纸纸页按照官方历史资料的 20 片设计。
- `src/world.js`：四大发明广场专用桌面/手机聚焦视角；完整接入 Codex 的腾飞塔、逸夫科学馆、思源活动中心；替代旧的腾飞塔金环造型。
- `scripts/verify-four-inventions.mjs` 与 `scripts/verify-integrated-landmarks.mjs`，加入 `npm run verify`。
- 文档与浏览器实机渲染截图。

注意：Codex 的 `createSiyuanStele` 独立模型已纳入测试，但是当前 `campus.json` **没有可信的饮水思源碑独立定位数据**，因此没有凭空指定现场坐标；待官方图纸核对后再放入场景。

## 自动验收

- `npm run verify`：通过。
- `npm run build`：通过。
- `scripts/verify-integrated-landmarks.mjs`：4 个模型可生成且边界有限，场景含有 6 个必要模型接入，旧的腾飞塔金环造型已移除。
- `scripts/verify-four-inventions.mjs`：四组四角构件、20 片纸页、场地中心开放、无 OSM 建筑占地重叠。
- `git diff --check`（源码）：通过。

## 浏览器视觉 QA

本机 Edge 使用实际 Three.js 页面、WebGL 绘制，非拼接图：
- `integrated-library-desktop.png`：图书馆分层、台阶和幕墙可以看到。
- `integrated-tengfei-desktop.png`：腾飞塔已采用新的锥形塔，旧金环不再出现。
- `integrated-yifu-desktop.png`：逸夫科学馆仍在远景中不够醒目，主立面需更好的镜头与建筑细节。
- `integrated-plaza-mobile.png`：390px 手机视口的四角雕塑均落入画面，无相机穿楼现象。

局限：静态截图无法验证 iPhone Safari 真机下的运动闪烁、手势稳定性；各建筑仍大量使用参考推导体量，不应称为照片级复原。主楼、腾飞塔和雕塑仍有相当部分属于视觉解释。

## 来源

- 图书馆与其他建筑的具体参考见已有 `docs/quality-v2` 资料。
- 四大发明历史雕塑参考：https://commons.wikimedia.org/wiki/File:Sidafaming_Guangchang.JPG
- 四角布局和作者参考：https://www.xjtu.edu.cn/info/1016/29901.htm 和 https://rwxy.xjtu.edu.cn/info/1038/5694.htm

此版目的是**展示两条施工线真实集成后的统一工作现场**，不是宣布西交校园高保真项目最终完成。
