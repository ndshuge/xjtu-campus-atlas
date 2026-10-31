# R17/R18 Campus integration contract — racing isolated prototype

**Approval status**: implementation available for main contractor review. **No merge, deployment, or main-project write authorized.** Last read-only main-project observations on 2026-10-31.

Main project: `E:\CHATGPT\work\xjtu-r15-unified-quality-20261030`; standalone: `E:\CHATGPT\projects\xjtu-racing-physics-prototype`.

## Module interfaces

```js
import {createRacingPhysics} from './physics.js'
import {mountRoadCollisionProxies} from './track.js'
import {createDesktopInput, createTouchInput} from './controls.js'
import {loadVehicleVisuals} from './visuals.js' // pass main Vite/Pages base URLs
import {createDriveCameraRig} from './camera-rig.js'

const sim = createRacingPhysics({spawn:[x,y,z]})
// sim.world: CANNON.World; sim.body: CANNON.Body; sim.vehicle: CANNON.RaycastVehicle
sim.setInput({throttle:1,steer:-0.3,brake:0,handbrake:false})
// normalized throttle and steer in [-1,1]; brake in [0,1]; handbrake boolean
sim.stepFixed(1/60) // no RAF and no renderer created inside physics module
const state = sim.getState()
// state.position [x,y,z], quaternion [x,y,z,w], velocity [vx,vy,vz], speedKmh,
// state.wheels four: contact, suspensionLength, rotation, steering,
//                  position [x,y,z], quaternion [x,y,z,w]
sim.reset([x,y,z])
const collision = mountRoadCollisionProxies(sim,[
 {id:'verified-road-A',kind:'road',size:[width,thickness,length],
  center:[x,y,z],slope:0,yaw:0}
])
collision.destroy()
sim.destroy()
```

**Mobile reversing:** the optional `reverse` touch element emits `throttle:-1` via the same normalized physics input; simultaneous accelerator and reverse produce neutral throttle, while service brake wins over both. To offer complete mobile gameplay, provide the dedicated reverse touch control rather than repurposing the brake.

**Coordinates:** independent app and Atlas: x east, y up, z south, units **metres**. Finite X/Y/Z spawn and reset positions are validated and copied; invalid data is rejected before corrupting the physics state. Steering follows the driver's perspective: while facing south (+Z), turning right means heading toward west (−X). Angles in radians; vehicle forward is local +Z. `mountRoadCollisionProxies` validates all input descriptors before constructing colliders and accepts only local static box proxies. No renderer-bound visual mesh converted into a physics collider.

**Main-project source constraints**:
- `src/game-mode-host.js`: actual `createGameModeHost({capture,restore})`, `registerMode({id,onEnter,onTick,onExit,dispose})` and `onCleanup` callback. Main's mode-host must be wired into main renderer; isolated standalone app never modifies it.
- `src/world-collision-adapter.js` currently returns frozen `shape:'horizontal-surface'` metadata for **verified walkable surfaces** `{bounds,y,levelId,confidence,sourceVersion}` only. It does NOT contain Cannon colliders, lane widths, validated car clearance, incline or full campus road geometry.
- `src/campus-spatial-levels.js` requires verified elevation and provenance for each registered level. Never fill unknown slopes/heights by guessing from visual roads.
- `src/modes/race-sandbox.js` is lap timing only, not vehicle dynamics. It can later subscribe to physical chassis crossing checkpoint planes.

### Main-only RAF integration outline

```js
// PSEUDOCODE for main contractor, not a modification of main project:
const raceMode = {
 id: 'race',
 async onEnter({options,onCleanup}) {
   const sim = createRacingPhysics({spawn:options.verifiedSpawn})
   const road = mountRoadCollisionProxies(sim,options.approvedColliderProxies)
   const base = import.meta.env.BASE_URL // main contractor must copy CC0 assets into public/models
   const visuals = await loadVehicleVisuals(mainThreeScene,{bodyUrl:base+'models/race.glb',wheelUrl:base+'models/wheel-racing.glb'})
   const touchDevice = window.matchMedia('(pointer: coarse)').matches
   const keys = touchDevice ? null : createDesktopInput({onInput:input=>sim.setInput(input),onExit:requestExit})
   const touch = touchDevice ? createTouchInput({stick,gas,brake,handbrake,reverse,onInput:input=>sim.setInput(input)}) : null
   const cameraRig = createDriveCameraRig(mainCamera)
   // main RAF calls modeHost.tick(delta), never a second requestAnimationFrame.
   let accumulator=0
   this.onTick = delta => {
     accumulator = Math.min(accumulator + Math.min(delta,0.055),0.055)
     for(let k=0;k<4 && accumulator>=1/60;k++,accumulator-=1/60)sim.stepFixed(1/60)
     const state=sim.getState()
     visuals.update(state)
     cameraRig.update(state,delta) // yaw-stable without taking over main RAF
   }
   onCleanup(()=>{ keys?.destroy();touch?.destroy();visuals.destroy();road.destroy();sim.destroy() }) // idempotent input + physics cleanup
 },
 onExit(){ /* optional, cleanup handled by host onCleanup */ }
}
```

Actual `createGameModeHost` invokes the mode object's `onTick(delta)`, and `onCleanup` callbacks on exit. Main implementation must restore OrbitControls/walk input, camera, selected building, labels, HUD, etc from `capture/restore`, avoid double input intercepts and avoid accumulating render listeners. The standalone `src/main.js` must **never** be imported into Atlas because it creates its own renderer and RAF.

For production, lazy-import physics and CC0 assets when entering race; use the Atlas renderer/camera and pixel-ratio policy, and keep physics proxy counts low. Do **not** import `createSyntheticTrack` for real campus. Do **not** upload fabricated campus elevations or claim walkable ground equals drivable roadway.

## Integration acceptance and revert

Before any main-site integration, have main contractor separately prove: mode entry/exit round-trips, map controls restored, 0 leaked listeners, correct OSM-space vehicle location, no tall building collisions missing, slope and bridge verified elevations, three-point turn/obstacle avoidance, 390px Edge plus actual iPhone Safari, true measured frame-time, mobile touch DPR limits, and return to original map without reload.

Revert main integration by unregistering the racing mode / removing its lazy-entry and build import. Independent prototype is untouched. Keep baseline main HEAD and Git commit for rollback; no automatic push/merge/deploy under this task.
