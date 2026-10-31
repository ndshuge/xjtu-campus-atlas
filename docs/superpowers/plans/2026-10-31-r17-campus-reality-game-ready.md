# R17 Campus Reality & Game-Ready Implementation Plan

> For agentic workers: use the relevant execution Skill; execute the NEXT unchecked task after reading this plan and the spec. All tasks require lock, actual HEAD/status and pre-existing dirty-file preservation. Do not start fresh planning each round. Each check box denotes an actual not-yet-done step.

**Goal:** Incrementally give the Xingqing 3D Atlas photo-verified localized elevation, a real multi-level library forecourt, per-building materials, optional AMap navigation, and a narrow mode/collider contract that can later host race and target-practice prototypes without sacrificing the map.

**Architecture:** Preserve existing Vite + Three.js + OSM registered footprints and camera/picking. A spatial data layer distinguishes single-valued ground terrain from overlapping level surfaces and connectivity; render and physics adapters consume immutable snapshots. High-quality architecture belongs to the scene but games own their own transient modes. AMap stays in an isolated, licensing-compliant navigation mode.

**Tech Stack:** Existing Three.js 0.186.1, Vite 8.3.5, node:test, existing Edge headless QA, Mice Hole; optional future Rapier JS/WASM behind dynamic loading only after proof. Do not migrate the renderer or introduce a framework as a prerequisite.

**Spec:** docs/quality-v2/R17_CAMPUS_REALITY_RESEARCH_GAME_COMPAT_20261031.md.

## Global constraints

- Work from actual current HEAD, original repo instructions E:\CHATGPT\AGENTS.md and existing R16 handoff; R17 plan itself is not release authorization. The base at document creation was 094d935; never treat this as future HEAD.
- Before ANY write/build/test/commit in the shared R16 worktree, acquire E:\CHATGPT\_system\xjtu-r16-run-guard.ps1; BUSY → no writes. Always release own token in finally. Lock does not protect against outsiders: stop if other writers change shared files.
- Preserve OSM way/263624481 and existing building IDs, boundary, search, picking, collision, navigation, night/category mode, LOD/mobile fallback; no geometry guessed from copyright-restricted maps or crude DEM.
- Dirty files already in worktree (R16_ENTRY, verification JSON, local screenshots and .superpowers) belong to others. Do not reset/clean/stage/overwrite. For shared source edits with conflicts prefer one deliberate isolated feature worktree and reintegration with user visibility, not invisible extra construction lanes.
- Implement each source change RED → minimum GREEN → focused regression → npm run verify → Vite relative-path production build → Edge WebGL 1440×900 + 390×844 same camera before/after and relevant input → renderer.info metrics, screenshot and source evidence → scoped commit. Do not fake real-phone testing.
- Public preview R16 at https://ndshuge.github.io/xjtu-campus-atlas/r16-library-20261031/ is a protected fallback; new R17 Pages preview requires separate active-session authorization and clean integration, no force push or legacy version replacement.
- Attribution and restrictive provider terms: Commons photo credits and CC BY-SA 4.0; AMap licensed display only, never persist tiles, commercial 3D building data or screenshots into project assets; production proxy/domain-review and Chinese map compliance before release.
- Today the deliverable is this PLAN only. Every checkbox below is NOT STARTED, unless a future executor marks completion with its own SHA + evidence. Game slices are conditional and not prerequisites for improving the map.

## Review focus / highest-risk failure cases

1. Two surfaces at identical x/z (ground + underground courtyard): querySurfaces returns both with distinct levelId, and walking does not teleport to the wrong level (Task 2/3).
2. A terrain patch meets existing flat road/footpath and OSM building base: no floating pavement, z-fighting, collider gap or displaced OSM footprint (Task 2/3).
3. Unknown/out-of-bounds elevation, steep/nonexistent stair/route or API failure: clear safe fallback and unavailable path, not imaginary geometry or invalid NaN (Task 1/3/5).
4. Game mode leave / WebGL device loss / input cancel: camera, handlers, collision state, selection and mobile controls fully restored, game entity disposed (Task 6).
5. Unsupported mobile device or map key/permission failure: default explore mode retains a working independent 3D/2D fallback and never exposes Security JS Code (Task 5/7).

---

### Task 1 — Evidence and local height datum inventory (P0)

**Files**:
- Create: docs/quality-v2/r17-elevation-material-evidence.json (only user-owned/authorized sources with provenance).
- Modify only if needed: docs/quality-v2/R17_CAMPUS_REALITY_RESEARCH_GAME_COMPAT_20261031.md (confidence updates after real research).
- Test: tests/r17-evidence-provenance.test.mjs.

**Interfaces:** Ledger entries contain objectId, geomType, evidenceUri, license, capturedAt, coordSystem, elevationDatum, sourceKind, confidence, acceptedBy; no fabricated meters.

- [ ] Step 1: Write test RED for entries lacking provenance, bogus height from photo-only reference, illegal provider-derived geometry and unlicensed embedded images; run node --test tests/r17-evidence-provenance.test.mjs.
- [ ] Step 2: Build a minimal ledger using existing Commons 2021/2025 photos, official public descriptions, OSM data and known R16 evidence; explicitly store downcourt depth as unknown. Run test GREEN.
- [ ] Step 3: Compare six candidate buildings and library forecourt against actual authorized photos at corresponding camera poses. Note source, aspect and uncertain face.
- [ ] Step 4: Commit only ledger + test + changed spec, and preserve next single action in existing R17 plan evidence notes. Stop material modeling if evidence insufficient.

**Gate:** At least one reliable proof that the courtyard has a genuine separate level; no accepted unsupported metric height; a test rejects missing license/confidence.

### Task 2 — Terrain and multiple-level surface contracts (P0→P1)

**Files**:
- Create: src/campus-spatial-levels.js; tests/campus-spatial-levels.test.mjs.
- Modify later when behavior validated: src/geo.js, src/world.js.
- Preserve: public/data/campus.json, existing OSM footprint coordinate conversion.

**Interfaces (proposed signatures; adjust only with documented tests):**
- createSpatialLevels({groundZones=[],levelSurfaces=[],passages=[]}) -> immutable registry
- queryGround(x,z,zoneId='campus') -> {y,normal,confidence}|null
- querySurfaces(x,z) -> ordered [{levelId,y,kind,walkable,confidence}]
- getPassage(fromLevelId,toLevelId) -> verified connector|null

- [ ] Step 1: RED test two overlapping floors, invalid coordinates, missing area, unsupported depth, and immutable registry.
- [ ] Step 2: Implement data-only registry with explicit units, source accuracy and no implicit ground hole. GREEN; ensure existing R16 ground untouched when registry empty.
- [ ] Step 3: Add deterministic visual geometry for a small masked test patch in an isolated test scene, not to entire world.js yet. RED/GREEN for normals/winding and collider source geometry agreement.
- [ ] Step 4: Run full existing regression/build + static 1440/390 before integration; record geometry/triangles/draw calls.

**Gate:** Registry can represent two distinct y values at one x/z and no live campus behavior changes before Task 3.

### Task 3 — Library real 3D forecourt pilot and access topology (P1)

**Files**:
- Modify: src/library-forecourt.js, src/world.js, src/geo.js and src/mobile-render-stability.js ONLY if tests require.
- Create: tests/library-sunken-court-3d.test.mjs, tests/library-level-traversal.test.mjs.
- Reference: public/assets/reference/library-front-2021.jpg, university 2016 photo linked from src/library-forecourt.js, signed-off level geometry.

- [ ] Step 1: RED test center ray hits lower floor rather than an unexcavated flat dark decal, intact outer ring/OSM surroundings, distinct wall and lower space, negative/unknown depth rejection.
- [ ] Step 2: Implement a *bounded local ground patch* with an explicit central opening and two surfaces; do not excavate entire large single plane or introduce coplanar overlaps. Keep a feature flag preserving R16 if evidence is insufficient.
- [ ] Step 3: RED test walk/pointercancel/orbit/surface selection cannot fall, tunnel, or jump levels; implement only photographed stairs/connection and walking collider. Unknown access remains blocked.
- [ ] Step 4: GREEN, focused tests then full verify and static nested build; capture fixed front/oblique 1440/390 with standing at ground and lower platform, desktop + emulated touch/cancel, OSM ID/picking.
- [ ] Step 5: Inspect near/far LOD, photo-matched geometry and renderer counts; commit only if clearly improved. Otherwise retain documented candidate outside release and keep R16.

**Gate:** Real vertical level separation, physical lower surface and documented traversability; 0 visual z-fighting/HTTP/JS regressions; low-end mobile fallback.

### Task 4 — Per-building evidence-driven material catalog (P2)

**Files**:
- Create: src/building-material-evidence.js; tests/building-material-evidence.test.mjs.
- Modify one building at a time: src/architecture-kit.js and the applicable src/*-asset.js (only where photographic evidence exists).
- Reference licensed images/official photos without embedding unauthorized image textures.

**Interfaces:** getBuildingMaterialProfile(osmId) -> {families,wallColor,glassColor,roughness,roof,confidence,sourceUri}|null, null → existing fallback.

- [ ] Step 1: RED for known vs unknown ID, profile provenance, allowed color space and no unnecessary new mesh batches.
- [ ] Step 2: Implement shared palette by surface family, then ONE highest-visible verified building profile as baseline. GREEN.
- [ ] Step 3: Sequentially add remaining five primary buildings only when each same-camera 1440/390 photo comparison improves recognizable wall/roof/glass/entrance relation; commit independently, not six arbitrary colors.
- [ ] Step 4: Verify performance, night category mode, selection/LOD, existing public JSON unchanged; preserve user configurable category colors separately from physical material colors.

**Gate:** Six independent, photo-supported records with source and confidence, reduced wrong uniform look at normal browse distance, no uncontrolled material explosion.

### Task 5 — Independent AMap navigation/view mode (P3, conditional)

**Files**:
- New: src/amap-mode-bridge.js and tests/amap-mode-bridge.test.mjs.
- Reuse selected ideas with review from E:\CHATGPT\work\xjtu-r13-amap-spike\experiment\geo-bridge.js and LIVE_INTEGRATION_AUDIT_20261027.md.
- Modify routing/UI only after acceptance; keep Three.js main world unchanged.

**Interfaces:** toMapCoords(worldPlace) -> licensed WGS84→GCJ02 output or explicit error; switchMapMode('amap'|'atlas') with reversible selection/camera state; no AMap assets in collider exports.

- [ ] Step 1: RED test coordinate and selection bridge with mocked map; no network or secret required for deterministic tests.
- [ ] Step 2: GREEN local dual-view with optional AMap separate map; on unavailable key, declined location, no quota or 403, return safely to atlas.
- [ ] Step 3: Validate actual provider terms, domain-verified server proxy for Security JS Code, map/审图号/attribution and privacy before requesting deployment. Do not copy AMap tiles/screenshots into repository.
- [ ] Step 4: Edge 1440/390 real key test only when authorized; iPhone Safari and mobile touch remain explicit human verification. If shared-depth overlay still broken, keep two distinct screens; no automatic map engine replacement.

**Gate:** Legal provider access and secure backend exist before any public release; absence of provider leaves original project usable.

### Task 6 — Minimum game compatibility seam (P4; NO full engine migration)

**Files**:
- Create: src/game-mode-host.js, src/world-collision-adapter.js; tests/game-mode-host.test.mjs, tests/world-collision-adapter.test.mjs.
- Read only: src/world.js, src/mobile-render-stability.js, navigation and picking owners; refactor only minimal lines needed.

**Interfaces:**
- registerMode({id,requiredCapabilities,onEnter,onTick,onExit,dispose})
- enterMode(id,options) -> entered or explicit fallback
- exitMode() -> explore with restored camera and controls
- getWorldSnapshot() -> read-only terrain/levels/passages/collider metadata with source version
- buildColliderProxies(snapshot,bounds) -> lightweight independent collision shapes, no visual mesh mutation

- [ ] Step 1: RED on empty mode transition, repeated enter/exit, cancels, invalid mode, failed dynamic import, user selection preserved, no leaked window event listeners.
- [ ] Step 2: Implement one blank plugin registered in a test-only mode without changing default explore. GREEN.
- [ ] Step 3: RED/GREEN collider queries for tree/stone wall/ground/lower platform and slope/curb; reject fabricated underground passage.
- [ ] Step 4: Verify 1440/390 explore ↔ empty mode ↔ explore, resize, pointercancel, context lost; new physics dependency stays lazy/not installed unless measured prototype need is approved.

**Gate:** No gameplay code imported into default map bundle if mode unused; base map tests still all pass.

### Task 7 — Small optional race + target-practice proofs (P5, only after Task 6)

**Files:** New isolated files in src/modes/race-sandbox.js and src/modes/target-practice.js with own tests; core source remains reusable.

- [ ] Step 1: Race RED for checkpoint order, lane/layer boundary, restart after collision, deterministic clock and mode exit, then GREEN minimal closed test course. No assertion that real campus vehicles can drive there.
- [ ] Step 2: Target-practice RED for target-only raycast hits, score, pause/reset, no damage to original building model, mouse/touch input, then GREEN minimal fixed target scene.
- [ ] Step 3: Validate dynamic physics choice (Rapier or none) only against actual tests, mobile budget and collision stability; no multiplayer or new persistent game framework yet.
- [ ] Step 4: Manual gameplay short loop, actual Edge mobile and desktop input, switch back to explore with absolutely no residual game entities/camera state.

**Gate:** One meaningful repeatable interaction per mode, no impact on campus accuracy or navigation; product maintains a non-gaming first-run experience.

### Task 8 — Quality, legal, performance and release hardening (P6)

**Files:** Existing R17 handoff in docs/quality-v2; QA harness and reports under scoped R17 directory only. No new redundant status managers.
- [ ] Step 1: Compare rendered screenshot/reference by building and slope, validate imagery rights and data origin, list unknown heights rather than invent them.
- [ ] Step 2: Run full npm run verify, nested static build, Edge 1440/390 camera states (walk/transition/map/search/selection), and actual mobile Safari on human device (if not possible mark NOT VERIFIED).
- [ ] Step 3: Capture renderer.info calls/triangles/geometries/textures, memory, page errors and input; run real graphics scorecard and targeted performance profiling. If mobile budgets exceeded, quantify owner and plan bounded improvement with A/B.
- [ ] Step 4: Reconcile fresh upstream and changed file ownership. No root Pages or legacy preview edit. Release only after an explicit user go-ahead and legal and performance gates.

**Gate:** Verified scope and fallback, no false surveyed claims, publicly deployed build tested via live URL only when separately authorized.

## Next exact action

1. Read spec and current git branch/HEAD/status; take only the shared run lock if writing.
2. Start Task 1 (elevation/material provenance ledger) with test-first acceptance. If source cannot establish lower-court depth, record unknown and keep Task 3 blocked rather than guess.
3. After every real implementation milestone update only the existing R17 plan checkboxes/evidence line, then select next uncompleted applicable task; no hourly automation, no silent publish.
