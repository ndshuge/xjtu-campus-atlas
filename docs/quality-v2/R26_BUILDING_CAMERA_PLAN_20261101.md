# R26: Selected-Building Close-Up Camera | Design and implementation plan

> XJTU Atlas independent branch `feature/r26-building-near-camera-20261101`; source base R25 `1b5e2bd`. All other north/south construction worktrees remain independent.

**Goal:** Make the UI action “近看这里” genuinely and reliably approach the selected source OSM building, without changing the existing normal place selection framing, special gates, museum/library framing, touch behavior or vehicle controls.

**Observed production R25 root cause:** selected math building OSM 263625090 is viewed at camera-to-orbit-target distance ~220m; clicking its detail card's primary “近看这里” calls `world.focus(p)` with identical normal framing, causing exactly the same 220m camera distance. Wheel zoom-to-cursor requires many gestures. These are observable public-site measurements.

**Design:** Retain `world.focus(p,fly)` for selection/overview. Add a separate `world.focusNear(p)` action for building-only UI, invoking a pure camera-frame planner in `src/building-near-camera.js` that uses local OSM footprint width/depth, source height and current camera angle. Target remains near the building, minimum camera clearance above terrain, and max near-view distance bounded; preserve existing flight easing, OrbitControls target and fly cancellation semantics. For nonbuilding POIs, existing `focus` is unchanged. No second renderer/RAF, no new dependencies, no data mutation.

## Tasks
- [x] Write tests first: the 90m math building and sports center must plan a camera far closer than original 220m, finite above ground, stable repeated framing, no OSM mutation, no close behavior for nonbuilding.
- [x] Verify RED on baseline, implement pure planner plus `focusNear` bridge and detail-card click hook in `src/world.js`/`src/app.js`.
- [x] Run unit tests + full campus verify + Vite build, inspect existing photo-building and racing regressions.
- [x] Actual local Edge browser: 1440x900, 390x844 touch, 844x390 touch; inspect both buildings and verify target offset, camera-to-target distance, cameraFlight completion, no JS/HTTP errors; screenshot visual near view, homepage/racing smoke.
- [x] Commit source on isolated R26 branch, push non-force, publish isolated new Pages preview only after QA and fresh remote compare; validate live public link and preserve historical versions.
- [x] Document realistic limits: viewpoint based on OSM, not surveyed facade entrance; real iPhone Safari not tested.

Official reference: https://threejs.org/docs/pages/OrbitControls (camera and target are independently managed, controls.update after manual changes). `zoomToCursor` remains enabled and is not modified.
