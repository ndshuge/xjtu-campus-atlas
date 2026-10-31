# R16 Qian Xuesen Library — Continuous Implementation and Preview Plan

> For agentic workers: execute the **next incomplete bounded task** in sequence, not a fresh discovery project each hour. Use test-first development and a fresh visual check; record one precise handoff. Do not automatically publish after the one explicitly authorized R16 preview.

**Goal:** Move the library from R12-style schematic massing toward a photo-grounded, authored architectural landmark while keeping campus map interactions and mobile performance recoverable.

**Architecture:** Keep `src/library-asset.js` and `src/library-asset-plan.js` as authoritative working R12/R16 procedural geometry and safe fallback. Improve one photographed face/module at a time, reuse existing material/mesh batches and LOD; only adopt a Blender GLB if it demonstrably improves authorship without breaking load, picking or budgets. Do not silently replace runtime with an experimental asset.

**Tech Stack:** Three.js 0.186.1, Vite 8.3.5, Node tests, Edge WebGL/390px emulation, existing Python/Blender only if required.

**Current truth (2026-10-31):** Branch `feature/r16-qian-library-asset-20261030`, committed starting revision `960adee`; previous iterations completed south tiers 1–3 narrow bays, south entrance, center ribs, and center curtain articulation on tiers 1–2. Earlier `44e0b92` is historical baseline, NOT active HEAD. Pre-existing unrelated dirty files belong to other work and must be preserved. R15 public preview is `/r15-unified-20261030/`. See `docs/quality-v2/R16_QIAN_LIBRARY_NARROW_BAYS_20261031.md` and photo-licensing `public/assets/reference/README.md`.

## Global constraints / acceptance contract

- Exact worktree `E:\CHATGPT\work\xjtu-r15-unified-quality-20261030`, exact active branch; no branch switching, no destructive reset or indiscriminate staging; stop on other-writer file conflicts.
- Scope only Qian Xuesen Library unless new measured evidence demands a shared technical fix; preserve OSM `way/263624481`, footprint, selection/picking, collision, navigation, category/color mode, mobile fallback and data.
- Source priority: licensed 2021 front and 2025 aerial in `public/assets/reference/`; describe every unsupported width/recess as **estimated**, not survey/photogrammetry. No undocumented third-party photo as texture.
- Preserve existing seven building material/mesh batches where practicable. Record local near/far asset triangle budget and whole-scene renderer info (draw calls/triangles/geometries/textures, frame time if available). Headless desktop FPS never equals real iPhone performance.
- For behavior/code: test RED -> minimum GREEN -> focused regressions -> `npm run verify` -> `npm run build` using relative `base:'./'` -> real static-subpath 1440×900 and 390×844 WebGL screenshots and interaction/asset load tests. Compare same camera with previous screenshot and photo. Report negative result and biggest remaining defect.
- Commit **only owned verified files**, update existing `docs/quality-v2/R16_QIAN_LIBRARY_NARROW_BAYS_20261031.md` handoff, no empty updates. Never remove other-process dirty output. A later runner must read current HEAD/status before taking the next box, because work may already be complete.
- No automatic publish of subsequent increments. The user authorized one new **isolated R16 preview**; do not overwrite Pages root or R13/R14/R15, do not force push.

## Sequenced milestones (one independently testable architectural increment per run)

### [x] M0 — establish documented R16 authoring baseline
Completed before this plan: south course 1–3 narrow vertical bays, south entrance, piers, center curtain lower levels; visual and browser evidence recorded in existing handoff. Existing work is NOT a finished high-fidelity asset.

### [x] M1 — central upper curtain of south-course-3
**Files:** `src/library-asset.js`, focused `tests/library-south-course3-curtain.test.mjs` (or equivalent), `package.json` only to enroll new test, existing R16 quality handoff.
- [x] Re-open 2021 frontal photo and fixed 1440/390 previous captures; assess whether upper glass needs a different bay count/stone course (not automatically clone tier 2).
- [x] Write a failing structural regression on intended window count, recess, spandrel depth and neutral gray/massing mode; run RED and keep failure output.
- [x] Author only the supported central tier-3 glazing/mullion/stone relation, using existing shared buffers and estimated metadata.
- [x] Verify GREEN; run library+picking+LOD+full verify, static subpath build and four same-view captures (detail/selected × desktop/mobile), with renderer and interaction diagnostics.
- [x] Compare critically and record next most material defect; commit verified owned files.

### [ ] M2 — architecture-wide near-view silhouette review (not more decorative windows)
**Files:** `src/library-asset-plan.js` / `src/library-asset.js` only if evidence warrants, matched tests and handoff.
- [ ] Compare photographed north/south/tower/roof volumes and shadow separations at fixed near and oblique views, prioritizing a visible structural mismatch over small trim.
- [ ] Fix ONE photo-supported volume, setback or roof silhouette mismatch test-first; reject uncertain reverse/hidden elevations.
- [ ] Verify OSM envelope and navigation/selection; compare 1440/390 visual A/B, near/far triangles and budget; commit and hand off.

### [ ] M3 — material authored quality (only after main silhouette)
**Files:** `src/library-asset.js` and material tests or a shared material asset only with clear measured payoff.
- [ ] Photo-compare warm light stone, dark glass, window mullion albedo/roughness and contact shadow; choose ONE surface whose material mismatch dominates the actual frame.
- [ ] RED -> GREEN a material role/opacity/picking fallback test; avoid glossy transmission, bloom and unique textures for repeated small parts.
- [ ] Static 1440/390 A/B and renderer metrics; assess whether change survives normal map distance; commit or revert if only subtle noise.

### [ ] M4 — decide on editable Blender source and GLB, evidence gate
**Files if approved by measured need:** `assets/models/library-r16/`, `public/models/library-r16/`, tests and narrow loader.
- [ ] Check whether procedural authoring still blocks facade/roof coherence; inspect Blender 5.x availability and model-license constraints.
- [ ] If justified, build ONE south-facing representative .blend/GLB slice with clear units/origin/bounds, reuse R12 fallback; do not convert entire building blindly.
- [ ] Test fallback on GLB failure, picking identity, load path under nested Pages, color mode, LOD, collision proxy, bundle/network and 1440/390 appearance. Only integrate with demonstrated visual benefit and safe budget.
- [ ] If not justified, document 'deferred' and proceed with existing pipeline rather than endless conversion planning.

### [ ] M5 — mobile-performance and release-candidate hardening
- [ ] Attack the largest proven 390px bottleneck only after profiling; current historic readings exceed 150 calls / 300k triangles starting budget. Keep fidelity in hero close view.
- [ ] Reproduce or resolve intermittent walking displacement spike (prior 105.42m failure), test real pointer cancel/resize and navigation; do not call the one-time passing emulation a permanent fix.
- [ ] Final 1440px/390px production WebGL, selection/walk/touch, error logs, performance diagnostics and at least one physical iPhone Safari run when device is available. Independent artistic judgment remains separate.

## Release track — R16 isolated preview (one-time explicit authorization)
- Publish only a **clean committed SHA**, never dirty uncommitted work, to a new `gh-pages` top-level directory `r16-library-20261031/`. Base remains relative. Keep formal root and all historical previews untouched.
- Before release refresh `github-pages/gh-pages` and `github-pages/main`, build and inspect committed source from an isolated clean worktree, compare files, run existing safety checks and HTTP/browser smoke. Stage **only** the new preview directory on a separate publication worktree at the latest gh-pages SHA; regular non-force push and remote SHA/live URL check. On a concurrent update STOP/reintegrate safely.
- This preview indicates **work in progress**, not architectural survey accuracy, real iPhone approval or final art acceptance.
- No scheduled future auto-promotion: each future release needs explicit new authorization.

## Next-run algorithm
1. Check bridge, root instructions, current branch/HEAD/status, existing quality handoff and this file. If HEAD has moved, trust Git and inspect which milestone already landed.
2. Choose the first genuinely incomplete/highest-impact item; do not repeat completed work or reprint the whole plan.
3. Complete one test-first incremental improvement; inspect real screenshots against licensed reference; verify metrics and limitations; commit only owned paths.
4. Append a brief evidence-based handoff to the existing R16 quality document: SHA, files/tests, real screenshot/data paths, one visual defect, **one next runnable task**. Continue in the next scheduled run without another user prompt.
5. Stop and report a precise blocker rather than claiming to be working offline or repeating an empty progress message.
