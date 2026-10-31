# R22 Off-road Driving Guard - Implementation Plan
Goal: Allow unrestricted driving on campus roads, grass, plazas, and sports fields while preventing cars from driving onto OSM-mapped water or into blank space outside mapped campus.

Architecture: Build a read-only geographic predicate from the existing campus boundaries and water polygons. The R8 Cannon vehicle resets to its mapped starting position only on invalid terrain. Slight boundary tolerance accounts for uncertain mapping; height and road traffic permissions are not asserted.

Files: src/racing/free-roam.js (createDriveSafetyGuard), src/racing-mode.js (call guard after physics tick), tests/r22-drive-safety.test.mjs, docs/quality-v2/R22_DRIVE_SAFETY_20261101.md.

Constraints: do not modify original OSM, parallel building worktrees, buildings, renderer or RAF. No new dependencies.
- [x] Write red tests covering actual campus grass, lakes, out-of-bound, and Cannon vehicle reset.
- [x] Implement minimal policy and integration, run focused green tests.
- [x] Run full existing physics and npm run verify/build.
- [x] Independently commit source and release global construction lock for building specialists.
