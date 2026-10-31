import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/**
 * Kenney Car Kit 3.1 race.glb and wheel-racing.glb (CC0).
 * Four embedded static source wheels are removed; each live visual wheel
 * follows a corresponding CANNON.RaycastVehicle world transform.
 */
/**
 * Return a wheel pivot whose local origin is the tire's true geometry center.
 * Scale is placed on a parent AFTER centering, so off-center glTF origins
 * cannot produce an artificial orbit when raycast steering/rolling occurs.
 */
export function createFittedWheel(source, radius=.42) {
  if(!source?.isObject3D || !Number.isFinite(radius) || radius<=0)
    throw new TypeError('source model and positive radius required')
  const content=source.clone(true)
  const bounds=new THREE.Box3().setFromObject(content)
  const size=bounds.getSize(new THREE.Vector3())
  const center=bounds.getCenter(new THREE.Vector3())
  const diameter=Math.max(size.y,size.z)
  if(!Number.isFinite(diameter)||diameter<=0)
    throw new Error('wheel model must contain nonzero Y/Z diameter')
  content.position.sub(center)
  const scale=new THREE.Group()
  scale.scale.setScalar(2*radius/diameter)
  scale.add(content)
  const pivot=new THREE.Group()
  pivot.add(scale)
  return pivot
}

/**
 * Dispose resources owned by GLB models once, even when several visible
 * wheels share geometry, material and GPU texture references.
 */
export function disposeVehicleResources(roots) {
  const geometries=new Set(),materials=new Set(),textures=new Set()
  for(const root of roots)root.traverse(node=>{
    if(!node.isMesh)return
    if(node.geometry)geometries.add(node.geometry)
    for(const mat of [node.material].flat()) {
      if(!mat)continue
      materials.add(mat)
      for(const val of Object.values(mat))if(val?.isTexture)textures.add(val)
    }
  })
  for(const geo of geometries)geo.dispose()
  for(const mat of materials)mat.dispose()
  for(const texture of textures)texture.dispose()
}

export async function loadVehicleVisuals(scene,{bodyUrl='/models/race.glb',wheelUrl='/models/wheel-racing.glb'}={}) {
  const loader=new GLTFLoader()
  const [car,wheel]=await Promise.all([
    loader.loadAsync(bodyUrl),
    loader.loadAsync(wheelUrl)
  ])
  const pivot=new THREE.Group()
  scene.add(pivot)
  const carRoot=car.scene
  // race.glb contains named four stationary wheels. Never draw a double wheel.
  for(const obj of [...carRoot.children]){
    if(obj.name.startsWith('wheel-'))obj.removeFromParent()
  }
  const carBounds=new THREE.Box3().setFromObject(carRoot)
  const carSize=carBounds.getSize(new THREE.Vector3())
  const carCenter=carBounds.getCenter(new THREE.Vector3())
  if(!Number.isFinite(carSize.z)||carSize.z<=0)throw new Error('Invalid Kenney body GLB')
  const centered=new THREE.Group()
  carRoot.position.sub(carCenter)
  centered.add(carRoot)
  centered.scale.setScalar(Math.min(4/carSize.z,1.8/carSize.x))
  centered.position.y=0.5
  pivot.add(centered)
  const wheels=[]
  for(let i=0;i<4;i++){
    const group=createFittedWheel(wheel.scene,0.42)
    scene.add(group)
    wheels.push(group)
  }
  for(const root of [pivot,...wheels])root.traverse(obj=>{
    if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true}
  })
  let isDisposed=false
  return {
    pivot,wheels,
    update(state){
      if(isDisposed)return
      pivot.position.fromArray(state.position)
      pivot.quaternion.fromArray(state.quaternion)
      state.wheels.forEach((w,i)=>{
        wheels[i].position.fromArray(w.position)
        wheels[i].quaternion.fromArray(w.quaternion)
      })
    },
    destroy(){
      if(isDisposed)return
      isDisposed=true
      disposeVehicleResources([pivot,...wheels])
      for(const obj of [pivot,...wheels])obj.removeFromParent()
    }
  }
}
