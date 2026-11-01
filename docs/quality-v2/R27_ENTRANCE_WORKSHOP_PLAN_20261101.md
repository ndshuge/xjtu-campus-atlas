# R27 | Two committed Z-negative entrance assets integration

## Goal
From R26 baseline 80c757a, add committed source-constrained Workshop A building OSM 263633887 and an independent East One electrical college entrance overlay OSM 263625677 to the live Atlas scene. Preserve existing East One whole-building historical geometry, as the overlay has photo-provisional edge orientation. Do not integrate uncommitted construction files.

## Evidence and conflict boundaries
- Workshop A from `feature/r21-south-building-realism`, committed SHA 2f594d8, module `src/assets/south/engineering-workshop-a-asset.js`. Building B 264420412 is distinct, cannot be reused.
- East One Commons-backed committed SHA ef89b87, module `src/assets/south/east-one-entrance-overlay.js`. It is **OVERLAY_ON_EXISTING_EAST_HISTORIC_ASSET**, so never replace or duplicate the whole East One shell. Electrical insulation building 264414271 is distinct.
- Use existing `src/photo-building-integration.js` registry for Workshop A only (count 11→12), and a separate `createPhotoBuildingEntranceOverlays` group for East One; attach this to CampusWorld scene and picking/color-mode pipeline. No source OSM, photo reuse, external images, renderer, RAF, racing or Pages changes without verification.
- Keep existing two building teams' worktrees untouched and independently commit only copied source-committed files and integration code.

## TDD and release
- [x] RED: test workshop A has independent OSM ownership, 12 unique full-building assets; East One overlay exists only on existing historic shell and remains pickable; non-ownership of insulation building and old memorial.
- [x] GREEN: copy only committed two source modules from south branch; add registry and overlay group, robust cleanup and setColorMode, scene attach.
- [x] Run R24–R27 building tests, old regression verify, npm run build.
- [x] Real Edge desktop/portrait/landscape screenshot and test actual East One and Workshop A sources, check main shell overlap, photo-details and racing entry/exit. Acknowledge entrance edge provisional and no photo-real claim.
- [x] Independent commit, non-force push. Verify newest Pages head before new R27 preview; public browser online QA and archive, leave older versions untouched.
