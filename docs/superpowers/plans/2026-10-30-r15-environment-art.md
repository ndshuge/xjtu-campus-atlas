# R15 Environmental Art — Implementation Plan

**Goal:** Three independent deliverables: (1) campus paving/roads, (2) texture sampling, (3) tree canopy.
**Architecture:** Preserve Three.js 0.186.1 world geometry, campus-building modules, vegetation instances, LOD and scene draws. Improve existing procedural CanvasTexture and foliage maps. Use same API signatures, pure deterministic image sampler for tests. No external licensed art.
**Source:** 5f0b701. **Branch:** feature/r15-chatgpt-environment-art. **Do not merge/push.**

### Task 1 — Major: believable road, paths, plaza surface
Files: src/surface-textures.js; tests/environment-art.test.mjs.
- Write failing sample tests for tileable differentiated albedo and paved joint contrast.
- Run test expecting RED.
- Implement deterministic organic asphalt aggregate / stone paver joints with color role, no external assets.
- Run GREEN, capture 1440 and 390 avenue-ground, commit.

### Task 2 — Minor: antialiasing stability
Files: src/surface-textures.js; tests/environment-art.test.mjs.
- Write failing test for sRGB, mipmaps, min/mag filter and safe anisotropy.
- Run RED.
- Implement stable texture settings with bounded anisotropy, no extra maps or calls.
- Run GREEN, oblique QA, commit.

### Task 3 — Major: natural layered foliage
Files: src/campus-vegetation.js; tests/environment-art.test.mjs.
- Write failing test for deterministic multi-lobe alpha clusters / mode coverage.
- Run RED.
- Improve foliage appearance without adding tree count, draw calls, or changing LOD bands; keep all API contracts.
- Run GREEN, compare canopy near and far, commit.

### Final acceptance
- npm run verify and npm run build; 1440/390 browser captures with renderer counts and errors.
- Cite actual Skills: AAA Graphics Builder authoring-recipes + technical-art + shader-cookbook; Three.js QA release and Debug Profiler; 3D visual direction; Mice Hole Windows execution.
- Verify independent-worktree cleanliness. Do not touch Codex worktree or production Pages.
- Leave notes for later merge of parallel branches. Real iPhone Safari remains separate.
