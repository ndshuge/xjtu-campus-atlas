# 思源学生活动中心：屋檐外形复核

## 依据与局限

- [Wikimedia Commons 正面照片](https://commons.wikimedia.org/wiki/File:Xi%27an_Jiaotong_University_2.jpg)，Peter Potrowl 拍摄于 2010-04-02，许可 CC BY 3.0 或 GFDL 1.2+。此次仅作为人工建模参考，没有把照片或纹理加入站点。
- [西安交通大学教育基金会修缮基金介绍](https://www.ef.xjtu.edu.cn/info/1845/7839.htm)，发布于 2025-05-14；拍摄日期未注明。校方照片许可未明确，不复制到站点。照片与 2010 正面照都可见宽大浅色檐口、下方结构带、玻璃入口和两根暖色柱。
- 楼体轮廓、平面位置仍沿用 OSM `way/263624056`；真实屋檐尺寸、高度和侧后屋面均未测绘。此次修改是根据照片作的外形近似，不声称其比例为测量值。2010 年照片不能证明今日前场的景观与高差，应避免据此添加下沉结构。

## 修改和截图

保留 `siyuan-center-asset.js` 唯一负责外观、原建筑 ID、拾取和入口碰撞，移除直角盒状檐口，改用有厚度的倾斜浅色前缘及两端斜切。未改变 OSM 面积或位置。角度和悬挑距离为视觉估算；前场及侧后立面尚需更多现况资料。

- 旧版：[桌面正面](r13-siyuan-collision-final/r13-siyuan-front-1440.png)、[手机正面](r13-siyuan-collision-final/r13-siyuan-front-390.png)、[桌面斜视](r13-siyuan-collision-final/r13-siyuan-oblique-1440.png)。
- 新版：[桌面正面](r15-siyuan-final/r13-siyuan-front-1440.png)、[手机正面](r15-siyuan-final/r13-siyuan-front-390.png)、[桌面斜视](r15-siyuan-final/r13-siyuan-oblique-1440.png)、[手机斜视](r15-siyuan-final/r13-siyuan-oblique-390.png)。固定的 Edge 摄像机与旧版一致；手机为模拟视口，非真实 iPhone。

参考照片前方是层叠地形与广场，而项目当前为简化平地，二者仍有明显差距。此轮只修正可辨认屋檐形态，不声称整栋建筑或前场已精确还原。专项验证同时检查 ID、南侧拾取、入口柱碰撞与屋顶覆盖。完整构建和回归由集成阶段执行。
