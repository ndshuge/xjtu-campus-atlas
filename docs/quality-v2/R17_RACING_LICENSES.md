# Reusable source and asset provenance ledger

## Physics source

- Upstream https://github.com/icurtis1/raycast-vehicle
- **Pinned upstream SHA**: `f9d2457e94c18f71a8eca5884c68d943b6f1e9e5`, verified via git ls-remote and local shallow clone at `vendor/raycast-vehicle`.
- **Source license**: MIT, copyright **2026 Ian Curtis**. Exact required text retained in `licenses/RAYCAST_VEHICLE_MIT.txt`.
- Reused design/data/algorithms: Cannon-es RaycastVehicle 4-wheel configuration; wheel attachment and suspension values; rear-wheel drive, speed cap, braking and steering; physical chassis and corner contact spheres. These are adapted into slim headless `src/physics.js` with original copyright clearly credited in source header.
- Original `src/Vehicle.js` plus upstream `src/World.js` and `src/main.js` can be audited at pinned SHA. Upstream **example GLB assets and rc-level.glb intentionally NOT imported or copied into release** because their separate artist permissions were not independently proven.

## Replacement car art

- Original author: Kenney; pack **Car Kit 3.1**. Official landing page: https://kenney.nl/assets/car-kit
- Source package mirror downloaded for local audit: https://opengameart.org/sites/default/files/kenney_car-kit_3.1.zip
- Verified package-embedded `License.txt`: **CC0**, including commercial use; exact file copied to `licenses/KENNEY_CAR_KIT_CC0.txt`.
- `public/models/race.glb`: **167,272 bytes**, glTF JSON counts **5 mesh entries**: body + FL/FR/BL/BR original static wheels, **1,952 triangles** in indexed GLB geometry; Blender independent report **~1,958 faces / 6 mesh objects**; 1 source material `colormap`, 1 external PNG atlas. Render path removes four embedded wheel nodes, leaves authentic body. No skeletal armature.
- `public/models/wheel-racing.glb`: **29,120 bytes**, **1 mesh**, **332 indexed triangles**, 1 material `colormap`, 1 referenced texture. Four visible clones share the exact same mesh geometry; each follows **real CANNON RaycastVehicle worldTransform**. No armature; wheel rotations and suspension are physics-derived.
- `public/models/Textures/colormap.png`: **12,371 bytes**. Explicit required external PNG, **was absent in initial run and is now present**; without it the model incorrectly rendered white.
- Visible car geometry ~1,952 body-source triangles (including embedded wheels removed) + 4×332=1,328 wheel-model triangles, approximate upper bound **3,280 car triangles** (actual displayed car lower due removal of embedded wheels). Source race body is not a box substitute.

## Core runtime libraries

- `three` exact **0.186.1**, MIT (per npm release/package license).
- `cannon-es` exact **0.20.0**, MIT (per npm release/package license).
- `vite` exact **8.3.5**, MIT (build/dev only).
- `playwright-core` **1.56.1**, Apache-2.0 (E2E developer tooling).
- `src/track.js` synthetic geometry created locally, not from OSM or source art.

## Production restriction

Do not ship `vendor/`, `assets/source/` archives, unverified upstream GLBs or screenshot captures in a production bundle. Assets in `public/models` are the full legal source of car art for this prototype. Revalidate all licenses and attribution when substituting models.
