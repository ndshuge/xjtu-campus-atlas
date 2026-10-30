# R15 Combined Codex × ChatGPT 3D Integration — 2026-10-30

## Outcome / release posture
**Integrated locally and published as an isolated GitHub Pages R15 preview.** Source branch `integration/r15-unified-quality-20261030`, source commit `471bbc7`; Pages branch commit `1c3802856cd4b9415847f449047521941629ecee` (parent `1bb28cbe18a9e93af6072d90241cdeec42746759`). URL: `https://ndshuge.github.io/xjtu-campus-atlas/r15-unified-20261030/`. The R13.1 homepage and R14 preview folder remain unchanged. New independent source worktree: `E:\CHATGPT\work\xjtu-r15-unified-quality-20261030`.
This branch was created from ChatGPT environment commit `3472bae`, which is a direct descendant of Codex R15 integration commit `5f0b701`. Therefore all **committed** Codex R15 building improvements are included without a separate cherry-pick or any merge conflicts.

Codex changes already inherited:
- `46d6298`: West 1 photo-guided building.
- `b166d8e`: Siyuan eave canopy silhouette.
- `9211fdb`: Westward relocation museum entrance.
- `5f0b701`: historic East 1/East 3 sloped-roof building forms.

Our separate work inherited:
- `3472bae`: physically modest procedural paving/road albedo, trilinear texture policy, organic multi-lobe foliage, tests and A/B.

## New integration-stage professional material pass
Files: `src/relocation-museum-asset.js`, `tests/museum-material.test.mjs`, `package.json`.
- Applied installed SHUGE `threejs-materials` workflow, `threejs-lights` budget guidance, `threejs-aaa-graphics-builder` technical art guidance, and `threejs-qa-release` evidence process. These were actually read via ChatGPT-native Skills; local source edits, npm execution and screenshots were actually performed via Mice Hole.
- Museum existing stone mesh gets subtle physically-informed repeatable panel variation; panel seams use `fwidth` anti-aliasing. Dimensions and seams are **illustrative**, not survey measurements.
- Museum opaque glass adjusted to warmer blue-green, roughness 0.22 and metalness 0.12. No transparency, transmission pass, or new meshes: maintains scene sorting / performance.
- Scoped to `!gray` detail mode. Gray massing and world geometry unchanged. Original museum ownership, building ID, search/picking, source OSM footprint, roof heights all preserved.
- Test exercises injected material code with mocked shader input, per-mesh caches, translucent/opaque policy and batch count.
- `npm run verify:environment-art` now runs both our environmental and museum material tests.

## Actual verification evidence
- `npm run verify`: passed (all existing checks).
- `node --test tests/environment-art.test.mjs tests/museum-material.test.mjs`: 4 pass, 0 fail.
- `npm run build -- --outDir build-r15-unified`: passed, JS bundle 799.00 kB (gzip 224.99 kB); longstanding Vite >750kB chunk advisory remains.
- 1440px Edge real WebGL: museum before 187 calls, 725755 triangles; after 187 calls, 723727 triangles. Triangle difference is scene tree-LOD timing, not the museum material (no mesh added). All runs 0 JS errors / 0 HTTP errors.
- 390px Edge emulation: museum 57 calls / 424393 triangles, East 1 47 / 461273, both 0 errors.
- 1440px East 1: 298 calls / 539836 triangles, 0 errors.
- 1440px South Gate: 482 calls / 594505 triangles, 0 errors; previous central sign alignment retained.
- Environment change previously measured on same poses: 1440 avenue 345 calls / 797919 triangles, 390 avenue 102 calls / 511221 triangles, unchanged call counts; see `R15_CHATGPT_ENVIRONMENT_HANDOFF_20261030.md`.
- Evidence: `docs/quality-v2/r15-unified-integration/`: museum-before-1440.png, museum-after-1440.png, museum-after-390.png, east-one-after-1440.png, south-gate-after-1440.png.
- Screenshots are simulated Edge viewports; **not** physical iPhone Safari. Headless instantaneous FPS not trustworthy enough to claim hardware perf benefit.

## Visual review / open issues
- Museum panel texture and opaque glass are visibly nuanced in oblique close view but in default map-selection framing the improvement is **subtle**; definitely not a photo-real asset conversion.
- Existing hero-building walls, roof geometry, environmental surfaces and far trees remain illustrative. Actual 3D realism needs multi-angle licensed/surveyed source evidence and careful asset authorship; cannot be guaranteed by adding procedural shader noise.
- Avoid unsupported 3D map hybrid adoption. Full MapLibre/AMap depth/occlusion and mobile GPU checks remain separate experiments.

## Worktree safety
- Codex working tree `E:\CHATGPT\work\xjtu-r15-integration` retained untouched, including five dirty generated verification JSONs and untracked `build-r15-west1/` and two reference JPGs. Those are **not** automatically accepted or copied as licensed publishable assets.
- Separate ChatGPT environment worktree `E:\CHATGPT\work\xjtu-chatgpt-r15-environment-20261030` has its own uncommitted source changes; deliberately left intact, never auto-merged.
- R15 Pages preview was added by a fast-forward-only update to `gh-pages`: commit `1c3802856cd4b9415847f449047521941629ecee`, parent `1bb28cbe18a9e93af6072d90241cdeec42746759`. Only new top-level folder `r15-unified-20261030/` was added. No force push, root overwrite, main merge, cleanup/reset of other worktrees, or replacement of R14.
- Public HTTP verification: page, JS (799005 bytes), CSS (36904 bytes), `data/campus.json` (201536 bytes), `data/osm-source.json` (352124 bytes), library reference image and ceramic material texture all returned HTTP 200.
- Public production URL was loaded in Edge WebGL at 1440px and 390px for Westward Relocation Museum, East 1 and South Gate: 6 screenshots, 0 JS errors, 0 HTTP errors. Results and captures: `docs/quality-v2/r15-unified-integration/public-final/`. 390px remains Edge emulation, **not physical iPhone Safari**.
- The formal Pages root still serves the prior homepage; this R15 deployment is a separately addressable preview, not a replacement of the formal root.
- Remaining before any promotion to the formal root: real iPhone Safari if available, controlled GPU frame-time A/B, further evidence-based high-fidelity building work, and explicit approval for root promotion.
