# R26 | Building Near-Camera UX Fix (2026-11-01)

## Problem verified in R25 public production
- Selecting the math building `263625090` focused an overview camera **220 m** from its `OrbitControls.target`.
- Clicking the detail card's "近看这里" called the same `world.focus(p)`, leaving the camera at the exact same ~220 m and never switching to facade inspection.
- Wheel magnification was a separate behavior driven by OrbitControls `zoomToCursor`, not a reliable substitute for a dedicated near action.
- Existing ordinary select/gate/library/photo UI must remain untouched.

## R26 change
- `src/building-near-camera.js` is a **pure** data-driven frame planner. It uses the existing OSM building polygon envelope, approximate height, camera heading and viewport ratio to choose a closer, finite, above-ground eye and a building-centered orbit target.
- `src/world.js` adds `focusNear(p)`. Only this method uses close-up planning. Ordinary `focus(p)` remains unchanged. It reuses existing fly easing, Three.js camera and OrbitControls — no second RAF or renderer.
- `src/app.js` routes the selected-building detail CTA to `focusNear` and collapses expanded mobile details after clicking, so users can see the zoomed 3D building.
- Maps, source polygons, height data, existing photo assets and racing physics are unchanged; no new dependency.

## Actual local QA (Edge)
- Automated `tests/r26-building-near-camera.test.mjs` verifies pure framing, responsive portrait distance, stable repeated calls, zero source-OSM mutations and real CTA wiring. Observed RED before new implementation, RED for missing footprint/portrait safety and RED for mobile panel collapse; all pass after changes.
- `npm run build`: exit 0. `npm run verify`: 40/40. Related `node --test`: 46/46 (re-run fresh before release).
- `scripts/qa-r26-near-camera.mjs` covers desktop 1440x900, touch-emulated portrait 390x844, touch-emulated landscape 844x390, 3 OSM IDs each: math building `263625090`, sports education center `264108763`, existing Nanyang East8 `263808679`.
- All **3 profiles × 3 buildings** pass. Desktop overview/near math 220/87 m; sports 221/87 m; East8 188/65 m. Portrait 220/112 m, 221/112 m and 188/82 m. Portrait CTA closes expanded sheet; all profiles' camera flights finish; OSM target coordinates preserved; JS/HTTP errors 0. Physical campus racing still launches, has wheel contact and exits.
- Screenshots and machine-readable results in `docs/quality-v2/r26-near-camera-qa/`; portrait snapshot inspected with visible model and collapsed bottom card.

## Known limits
- Near-camera frame points toward footprint center from the preexisting camera side; it does NOT identify an actual photographed entrance orientation for every building. Some facades are obscured by existing vegetation or neighboring models.
- The open 3D model and UI remain illustrative: OSM building heights are generally approximate, no photo-real facade guarantee or surveyed terrain.
- Genuine iPhone Safari (hardware, GPU/thermals, full gestures): **NOT_TESTED**; Edge touch emulation is not equivalent.
- No uncommitted north/south specialist files are integrated. Historical R25 published preview remains a separate version.
- Public Pages publishing and online QA evidence are logged in a separate record.
