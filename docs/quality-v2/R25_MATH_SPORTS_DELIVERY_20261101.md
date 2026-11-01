# R25 | Two Additional Source-Committed Photo-Building Assets

**Status:** Desktop/mobile-emulation feature acceptance passed; genuine iPhone Safari not tested. Published-preview status is tracked separately.

## Scope and provenance
- Starting point: R24 2186016 (9 photo-guided assets).
- New committed Z-negative construction source `5197ff8`: math building OSM `263625090`. **Do not confuse** with the mathematically oriented teaching lab `1219695761`.
- New committed Z-negative construction source `06a976d`: sports education center OSM `264108763`. Architectural courtyard elements based on a partial university photo reference, not measured engineering drawings.
- Existing historic migration memorial `264288694` is **not integrated**: source candidly marks which 1956/1970s wing matches the source polygon unresolved.
- Only copied the two committed asset files from `782465e`'s source tree. No uncommitted files from active north/south building worktrees were read into production.

## Implementation
- `src/photo-building-integration.js` now registers two extra photo factories alongside the original 9. All 11 have distinct OSM IDs; `src/world.js` retains its generic-geometry suppression, picking, category color mode and cleanup for photo assets.
- `tests/r25-math-sports-integration.test.mjs` tests 11 unique IDs, non-ownership of the mathematical lab and old memorial, presence of meshes and `buildingIndex` pick attributes, color mode and cleanup.
- The earlier R24 regression now validates the retention of its original photo assets without freezing the absolute count at 9.

## Verified output
- TDD: new integration test was observed failing `9 != 11`, then passing after registering new factories.
- `npm run verify` 40/40 passed.
- Physics/building `node --test` suite 45/45 passed.
- `npm run build` succeeded.
- Edge QA `scripts/qa-r25-photo-buildings.mjs`: 1440x900, touch-emulated 390x844, touch-emulated 844x390, all 3 passed (0 JS / 0 HTTP errors). For each viewport it selected math building, sports center, and existing Nanyang East8, verified source title and photoBuildingCount=11, captured screenshots, entered/exited campus racing.
- QA report: `docs/quality-v2/r25-math-sports-qa/results.json`; screenshots alongside it.
- Representative actual screenshots were inspected for both buildings. Sports building has identifiable courtyard awning and steps without an obvious overlapping original generic mass; math building appears with a distinct mass/roof.

## Known visual and reference limits
- Building labels still display the underlying OSM source height as an estimate, not real survey.
- The sports center photo mainly supports courtyard elements; full footprint and back/side elevations remain approximations.
- Interactive `focus` / scroll zoom was not reliable in a separate manual test and sometimes increased campus viewing distance instead of inspecting the front elevation. **Do not label screenshots from this zoom attempt as verified close-up acceptance.** Treat as a separate navigation/QA defect.
- Real iPhone Safari and field-verified photo/height comparison NOT_TESTED. User has not formally approved visual authenticity.
- North and Z-negative building workers have additional uncommitted work that R25 deliberately leaves untouched.

## Next
After publishing R25 as an isolated preview and verifying public access, audit selected-building camera focus/zoom separately in an isolated follow-up, then incrementally merge additional completed building assets with explicit OSM evidence.
