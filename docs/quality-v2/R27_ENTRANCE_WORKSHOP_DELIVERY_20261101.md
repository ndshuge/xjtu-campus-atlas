# R27 | Entrance and Workshop A Asset Integration | 2026-11-01

## Source and scope
- R26 baseline `80c757a` built on an isolated `feature/r27-entrance-workshop-20261101` worktree.
- **Workshop A**, OSM `263633887`: exact committed source module from south building branch commit `2f594d8`. Separate from **Workshop B**, `264420412`.
- **East One EE College entrance**, OSM `263625677`: exact committed photo-guided source module from south branch commit `ef89b87`. Commons credited/source constrained in `userData`, but the precise facing of the photo remains provisional. The whole East One historical model already exists via `east-historic-asset.js`, so the extra geometry is an **entrance overlay** and NOT a new whole-building shell.
- Original `public/data/campus.json` unchanged; no uncommitted building worker modifications included. `263625677` is not added to `PHOTO_BUILDING_IDS` (owned by EastHistoric), while Workshop A brings registered full-building assets from 11 to **12**.
- Original East One source's insulation laboratory `264414271` deliberately excluded.

## Implementation
- Source files: `src/assets/south/engineering-workshop-a-asset.js` and `src/assets/south/east-one-entrance-overlay.js`.
- `src/photo-building-integration.js` registers Workshop A through the normal photo building registry, suppressing its old generic box, and separately exports `createPhotoBuildingEntranceOverlays`. Overlay group has its own color-mode and idempotent dispose; no duplicate East One footprint.
- `src/world.js` mounts the overlay as a separately selectable/pickable scene group, recolors it on theme changes. Existing historical shell retained.
- `src/building-near-camera.js` accepts optional `preferredFace` (local `front` or `face` metadata); `src/world.js` uses it for the two source-constrained facades. Generic buildings, monuments, gates and original R26 framing remain unchanged. The recorded facade normal is a **provisional photo-to-OSM alignment**, not a true entrance position surveyed on site.

## Verification
- TDD observed missing integration exports/registry and missing preferred photo-facing camera as RED; new and historical tests GREEN.
- `node --test` architecture/OSM/photo/facade/camera/racing suite **58/58** passed; `npm run verify` original campus **40/40** passed; `npm run build` successful.
- Actual Microsoft Edge desktop `1440x900`, portrait mobile touch simulation `390x844`, landscape touch simulation `844x390`; `scripts/qa-r27-entrance-workshop.mjs` **3/3** passed after synchronizing camera-flight state. Three buildings individually visited each profile: Workshop A, East One, previous math building. Correct 12 full-building assets, camera frame and original selection, racing mode with real wheel contacts and exit restoration; JS/HTTP errors zero.
- Machine-readable output and screenshots in `docs/quality-v2/r27-entrance-workshop-qa/`. Visual review confirms facade-facing orientation now exposes the dark horizontal-glass workshop exterior and the small historical East One entrance. Photos are reference only; none of the unlicensed workshop photo bytes were embedded as a site texture.

## Explicit limitations and next tasks
- Workshop A's photographed facade is partly obscured by a near unrelated building; East One's entrance by campus trees. Not a measured or guaranteed unobstructed street-level photograph.
- Photo camera azimuth and exact facade geometry are provisional; heights/roof details are not surveyed. Workshop A photo is third-party with uncertain date. No claim of final photo-real look.
- No real iPhone Safari/thermal/physical device QA, only Edge touch emulation.
- A future improvement should use OSM obstacle-aware vantage selection and source-confirmed entrance direction; do not move trees/other buildings merely to cosmetically expose the facade.
- Live Pages deployment and online tests are separate from this source acceptance; do not claim public launch until the actual URL is checked.
