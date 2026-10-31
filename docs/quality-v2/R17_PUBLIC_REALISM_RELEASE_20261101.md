# R17 校园真实度独立预览发布凭证（2026-11-01）

- 发布授权：用户明确要求「提交最新版上线，然后继续施工」。
- 源码：`feature/r16-qian-library-asset-20261030` @ `26fe136948abbd0004451b3a84309560a4b8673b`，已普通快进推送到远端同名分支，SHA 一致。
- Pages：`gh-pages` 由 `a2ed8ddb52196e8ec08d8bd796a678c79216a147` 快进至 `83bccc064152d262103359390a1d46412c7a25db`；**只新增 `r17-campus-realism-20261101/` 下的 20 个文件**。旧 R16、R17 游戏实验室、R15、根首页和 main 均保留；无 force push 或历史改写。
- URL：https://ndshuge.github.io/xjtu-campus-atlas/r17-campus-realism-20261101/
- 独立快照全量 `npm run verify` exit 0，R17 Node tests 33/33；Vite 8.3.5/Three.js 0.186.1 的静态生产构建成功，JS chunk 警告仍在。
- 同一 Pages 风格嵌套路径 Edge 390/1440 原生 WebGL 与搜索、地图旋转、触摸、双指、漫游、退出/恢复均通过，无 JS/HTTP 错误。真机 iPhone Safari 未验收。
- 公开 URL、index.html、JS、CSS、campus.json 实际 HTTP 200；线上 JS SHA-256=`36875994C15C88550D83FDE83931E2BA5FB696A96C5FB030A4CBA265F5CBC403`，与本机源码构建完全一致。部署前短暂存在 CDN 404，后重验稳定返回 200。
- 本次上线停在源码 26fe136。**发布之后的屋顶分隔缝提交不属于本次上线，不能误报线上已有。**
