# iPhone screenshots guided rendering repair R1 · 2026-10-26

User screenshots: five iPhone Safari views, supplied directly in chat. No image copying to the repository. Issues observed: gate appears visually detached from approach, distant pavement flickers during movement (user observation), and vegetation looks blurred.

Changes:
- src/world.js: orbit camera near 0.6 → 1.5; far 6000 → 4800. Same 1.5 near restored on exiting walk mode. This increases perspective depth resolution without touching mapped geographic coordinates. Walk near 0.2 remains unchanged.
- src/campus-vegetation.js: leaf texture sampler 8x anisotropy and explicit trilinear mipmapping; near/far alpha-test thresholds .42/.16 → .38/.12 to reduce abrupt thin-leaf disappearance at LOD distance. Existing branch geometry and clearance rules preserved.
- scripts/verify-mobile-render-precision.mjs: regression checks.

QA: npm run verify and npm run build passed; 1440x900 and 390x844 Chromium screenshots captured in docs/quality-v2/fix-overview-*.png. First mobile capture displayed loading overlay; the subsequent loaded capture exists. A static screenshot cannot verify time-dependent ground flicker; additional moving-camera recording and real iPhone Safari verification remain required.

Ground: changing near/far may reduce depth quantization; **does not by itself prove coplanar overlays eliminated**. Multiple ground surfaces and paving layers are not yet exhaustively audited. Do not claim z-fighting fixed.

Gate: north-gate piers and side walls have bases calculated from the shared BASE. No safe evidence that the whole gate is vertically offset; avoid arbitrarily lowering all gate meshes. Real local ground reference / approach geometry and 2026 imagery required.

Trees: sampling quality adjusted, but real iPhone sharpness and alpha artifacts still unverified; canopy geometry not reverted to spheres.

Status: **tested engineering mitigation, visual issues not yet conclusively resolved**. Not eligible for publication under original high-fidelity acceptance requirements. Work isolated from main and other Codex worktrees.
