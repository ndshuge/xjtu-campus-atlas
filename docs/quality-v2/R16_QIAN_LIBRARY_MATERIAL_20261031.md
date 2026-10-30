# R16 Qian Xuesen Library Material Pass — 2026-10-31

## Status

**Local feature increment verified; not published.** Branch: `feature/r16-qian-library-asset-20261030`. Base: `44e0b92`.

R15 Pages preview remains unchanged:
`https://ndshuge.github.io/xjtu-campus-atlas/r15-unified-20261030/`

This pass is limited to the library's existing material/shader owner. It does not claim a new architectural reconstruction or final artistic acceptance.

## Reference and visual finding

- Used the checked-in 2021 frontal photograph and the 2025 aerial photograph as visual references. Their provenance and CC BY-SA 4.0 terms remain in `public/assets/reference/README.md`.
- The selected R15 library had a broad green diffuse wash across stone, glazing, and roof materials. This conflicted with the warm beige/rose stone visible in the 2021 photo and made the whole building read as a selection overlay.
- The library remains a procedural, photo-informed model. No source photo was baked into geometry or used as a texture.

## Changes

- `src/library-asset.js`: warm primary library wall albedo from `#c4b3a4` to `#c8b2a2`; the separate north concrete tone remains unchanged.
- Replaced the broad green selection/hover diffuse tint with a restrained view-space Fresnel rim and a minimal value lift.
- Preserved category-mode color mixing and the existing opaque glass night-emission path.
- Updated the library shader program cache key to `library-r16-focus`.
- No new meshes, textures, transparency, post passes, PMREM, dependencies, or changes to shared architecture materials.

## Specialist workflow

- **READ + APPLIED:** SHUGE Three.js AAA Graphics Builder principles and its visual-scorecard, authoring-recipes and technical-art references; Three.js Materials; 3D Visual Direction; 3D Scene Architecture; Three.js QA Release.
- **READ, not needed for this pass:** Three.js Textures and Loaders. No texture or imported-model pipeline was changed.
- Visual decision: match the warm stone reference and use an edge-focused selection cue rather than a whole-building color wash.
- Technical decision: retain the existing opaque, batched material pipeline to avoid added draw calls and transparency sorting costs.
- No independent reviewer tool was available; the final review is a self-review, not an independent design approval.

## Verification

- TDD RED: new test first failed because actual wall color was `c4b3a4` instead of the intended `c8b2a2`, and the old broad green tint remained in the shader.
- TDD GREEN: `npm run verify:library-material` — 2 passed, 0 failed.
- Full `npm run verify` — exit 0.
- Production build: `npm run build -- --outDir .sites-local/r16-library-material` — exit 0; 51 modules transformed. JS 799.36 kB (gzip 225.08 kB), CSS 36.90 kB. Existing Vite chunk advisory (>750 kB) remains.
- Local static production preview returned HTTP 200.
- `scripts/qa-render.mjs` loaded the local production artifact at 1440px and 390px for selected `钱学森图书馆` and the `library-north` inspection view: 4 captures, 0 JS errors, 0 HTTP errors.
- Mobile detail-layout check: detail panel visible, no overlap with view controls or toolbar; expanding and restoring detail controls both passed.
- Selected library renderer comparison (same public R15 vs local R16 view):
  - Desktop: 414 draw calls before/after; 875,200 → 870,130 triangles. The 5,070-triangle difference is consistent with vegetation LOD timing; no mesh was added by this pass.
  - Mobile: 267 draw calls and 556,948 triangles both before/after.
- Unselected library-north view: desktop 461 calls / 852,237 triangles both before/after; mobile 252 calls / 531,913 triangles both before/after.
- Headless FPS readings vary between runs and are not treated as device-performance evidence. 390px is Edge viewport emulation, not physical iPhone Safari.

Evidence folder:
`docs/quality-v2/r16-library-material-local/`
- `before-place-1440.png`, `before-place-390.png`
- `place_钱学森图书馆-1440.png`, `place_钱学森图书馆-390.png`
- `library-north-1440.png`, `library-north-390.png`
- `browser-results.json`

Mobile layout evidence:
`docs/quality-v2/r16-library-material-layout/`

## Remaining work

- The material now reads closer to the frontal reference, but the overall model remains a procedural approximation. The next high-value pass should target authored facade articulation and entrance/clock details from available source evidence, not more shader noise or decorative effects.
- Real iPhone Safari verification remains outstanding.
- No Pages deployment or root promotion was performed. R16 remains a local feature increment pending further work and explicit release approval.
