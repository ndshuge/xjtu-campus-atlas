# R15 Environment Art — ChatGPT × Native Skills × Mice Hole

Date: 2026-10-30. Independent base: `5f0b701`, branch `feature/r15-chatgpt-environment-art`.
No Codex working-tree files, pages branch or published site were changed.

## Division of responsibility
- Codex R15: 3D **building** assets for East 1/East 3, West 1, Siyuan, relocation museum.
- ChatGPT branch: **campus environmental** art, specifically roads/plazas and foliage sprites.
- Shared files intentionally untouched: `src/world.js`, building assets, camera, HTML/CSS, GIS datasets, and Codex's verification outputs.

## Three completed changes
1. **Major — surfaces:** `src/surface-textures.js`: replaces nearly uniform per-pixel noise with reproducible, multi-scale color texture for stone paving, asphalt aggregate and water. Stone-by-stone variations and staggered joints remain spatially coherent in repeated UVs. All pixels generated locally; no third-party map tiles/photos.
2. **Minor — texture sampling:** the same texture API now explicitly uses `SRGBColorSpace`, trilinear mipmapping and linear magnification; `surfaceSampling()` gives bounds for anisotropy (1–8). No second layer or extra render passes.
3. **Major — plane-tree foliage:** `src/campus-vegetation.js`: procedural sprays change from star-like glyphs to overlapping asymmetric ellipses and needles with per-spray rotation, palette and small crown jitter. Keeps existing 2,092 tree positions, material batching, near/far LOD, alpha thresholds, CPU tree-buffer invalidation optimization, and draw-call count. Canvas mock fallback is retained for Node tests.

## Real native-plugin calls (not only prompt references)
- `skills__read`: SHUGE `game-3d-director`; `threejs-aaa-graphics-builder` and authoring, technical-art, shader recipes; `threejs-debug-profiler`; `threejs-qa-release`; Doers `3d-visual-direction` and `visual-qa-handoff`; Superpowers planning, TDD and verification.
- Mice Hole read, run, patch, process, observe: actual Windows worktree, npm tests/build, Python static HTTP servers, Edge real render QA and image inspection.
- Blender **not used**: this work modifies large-scale repeatable albedo and foliage atlases, where procedural CanvasTexture is both cheaper and more maintainable than a Blender-generated model. No external generative 3D job or copyrighted image asset was needed.

## Reproducible evidence
- `node --test tests/environment-art.test.mjs`: **3 pass / 0 fail** (determinism and stone joints; texture policy; organic sprays/species separation).
- `npm run verify`: **exit 0**.
- `npm run build -- --outDir build-r15-art`: **exit 0**. JS bundle 798.04 kB (gzip 224.80 kB); original was 796.50 kB (gzip 224.11 kB). Existing chunk-size warning remains.
- Edge on compiled production build, both 1440px and 390px: screenshot/error checks recorded.
- `avenue-ground` view at 1440: base vs new **345 calls / 797,919 triangles**, both. 390px: **102 calls / 511,221 triangles**, both. All observed checks reported **0 JS errors / 0 HTTP errors**. `home` at 1440: **510 calls / 579,759 triangles**, unchanged. FPS from short headless sessions is **not** a trustworthy GPU performance win.
- Paired raw screenshots under `docs/quality-v2/r15-chatgpt-environment/`: `before-avenue-1440.png`, `after-avenue-1440.png`, `before-home-1440.png`, `after-home-1440.png`, `before-avenue-390.png`, `after-avenue-390.png`.

## Honest visual verdict
Visual surface and canopy detailing differs in close/oblique views, but **not a full-campus visual leap**. Hero building flatness, real elevation evidence, far-horizon realism and GPU frame-time variance remain independent issues. No claim of measured 20% FPS gain, actual photographic reconstruction, or real iPhone Safari QA.

## Parallel merge handoff
1. Wait for Codex to finish and commit its R15 building tasks.
2. Check `git status` in all worktrees. Don't reset or clean Codex's modifications or build directories.
3. Compare `git diff --name-only <codex-tip> feature/r15-chatgpt-environment-art`; this branch changes just `src/surface-textures.js`, `src/campus-vegetation.js`, tests and the QA documents. Do not merge auto-generated verification JSONs.
4. Merge (or cherry-pick) our verified commit(s) on a **new integration worktree**; resolve any overlapping `src/campus-vegetation.js` changes by preserving Codex's performance LOD cache and our texture only when both verified.
5. Run `node --test tests/environment-art.test.mjs`, `npm run verify`, `npm run build`, viewport QA and fresh equal-camera screenshots. Publish only after formal release approval.

## References / provenance
- Three.js official Textures & color management: https://threejs.org/manual/pages/textures.html
- Three.js official Material alpha cutout/alpha-to-coverage: https://threejs.org/docs/pages/Material.html
- Three.js official transparency tradeoffs: https://threejs.org/manual/pages/transparency.html
- Skill references: `threejs-aaa-graphics-builder/references/technical-art.md`, `references/visual-scorecard.md` and `threejs-qa-release/skill.md`.
