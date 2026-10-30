# Qian Xuesen Library Facade Material Pass Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in the existing isolated R16 feature worktree. Each task uses test-first development and a verified local commit.

**Goal:** Make the selected Qian Xuesen Library facade retain its warm architectural stone identity while selection and hover remain clearly visible without washing the whole building green.

**Architecture:** Keep the change inside the existing library-owned material pipeline in `src/library-asset.js`. Continue using opaque `MeshStandardMaterial` and existing merged meshes; replace broad diffuse selection tint with a low-cost Fresnel focus cue and slightly warmer stone albedo. No new geometry, render pass, texture, dependency, or global material behavior.

**Tech Stack:** Three.js 0.186.1, Node.js built-in test runner, Vite production build.

**Spec:** Existing R15/R12 library asset and licensed reference `public/assets/reference/library-front-2021.jpg`; provenance and license are recorded in `public/assets/reference/README.md`.

## Global Constraints

- Preserve OSM building footprint, floor/height scope, pick identity, selection/hover uniforms, category mode, night behavior, collision, and navigation.
- Do not present estimated geometry or shader detail as surveyed or photogrammetric truth.
- Keep library glass opaque; do not add transmission, PMREM, bloom, post-processing, textures, or extra meshes in this pass.
- Keep the change library-scoped; do not change shared `architecture-kit.js` materials or other campus buildings.
- Do not publish Pages, change the formal root, or push shared branches without explicit authorization.
- Run focused RED/GREEN tests, full project verification, production build, and real 1440px/390px browser captures.

## Review Focus

- `stage: 'massing'` must retain its neutral, shader-light behavior.
- Selected and hovered states must remain distinguishable without a broad green diffuse wash.
- Category color mode must continue to work.
- Night-time glass emission must remain intact.
- The change must not add meshes, draw calls, textures, or transparency.
- Desktop and mobile captures must retain the same library framing and touch/navigation behavior.

---

### Task 1: Warm stone and restrained library focus material

**Files:**
- Modify: `src/library-asset.js`
- Modify: `package.json`
- Create: `tests/library-material.test.mjs`
- Test: `node --test tests/library-material.test.mjs`

**Interfaces:**
- Consumes: `createLibraryAsset({ building, baseY, buildingIndex, uniforms, stage })` and the existing `public/data/campus.json` library record.
- Produces: the same asset and mesh/material ownership contract; the wall material uses warm stone `#c8b2a2`; selected/hovered focus is expressed by a subtle Fresnel rim and minimal value cue, not a green full-surface tint.

- [ ] **Step 1: Write the failing test** in `tests/library-material.test.mjs`.
  - Construct the real library asset from the checked-in campus data.
  - Assert the wall material color is `c8b2a2`, roughness remains physically matte, and the glass remains opaque.
  - Run the wall material's `onBeforeCompile` against a minimal standard-material shader stub.
  - Assert selection and hover uniforms remain present, a Fresnel rim contributes to `totalEmissiveRadiance`, the old green `vec3(.48,.70,.35)` full-surface tint is absent, and category-mode uniforms remain.
  - Compile the glass shader and assert its existing night-emission path remains.
  - Dispose the constructed asset.

- [ ] **Step 2: Run the focused test and verify RED.**
  - Run: `node --test tests/library-material.test.mjs`
  - Expected: FAIL because the current wall albedo and green selection tint do not satisfy the new assertions.

- [ ] **Step 3: Implement the minimum change** in `src/library-asset.js`.
  - Warm only the library's primary wall albedo to `#c8b2a2`.
  - Preserve the category-mode diffuse mix.
  - Replace the broad green selection/hover diffuse mix with selected/hovered focus factors and a restrained view-space Fresnel rim after `#include <emissivemap_fragment>`.
  - Preserve the existing night-glass emission and massing-stage behavior.
  - Update the program cache key so the revised shader cannot reuse the previous R11 program.
  - Add `verify:library-material` and include it in `npm run verify`.

- [ ] **Step 4: Run the focused test and verify GREEN.**
  - Run: `node --test tests/library-material.test.mjs`
  - Expected: all assertions pass.

- [ ] **Step 5: Run full verification and production build.**
  - Run: `npm run verify`
  - Run: `npm run build -- --outDir .sites-local/r16-library-material`
  - Expected: both exit 0; any pre-existing advisory must be reported, not hidden.

- [ ] **Step 6: Capture and inspect the new local production build.**
  - Serve `.sites-local/r16-library-material/` with a local static server and run `scripts/qa-render.mjs` against that built artifact for `place:钱学森图书馆` and `library-north`, at 1440px and 390px.
  - Compare the selected facade with the pre-change public R15 capture `public-final-library/place_钱学森图书馆-1440.png` and the 2021 licensed photo. Do not use the public R15 URL as the new-code target because this pass is intentionally not published.
  - Record actual renderer calls/triangles and JS/HTTP errors. The expected structural change is zero added meshes/draw calls; do not claim hardware FPS from headless capture.

- [ ] **Step 7: Commit the verified R16 material pass.**
  - Commit only this task's source, test, package, plan, and its new evidence/receipt files.
  - Preserve pre-existing dirty verification JSONs and earlier untracked QA folders unless deliberately reviewed and staged.
  - Commit message: `feat(r16): refine library stone and selection materials`.
