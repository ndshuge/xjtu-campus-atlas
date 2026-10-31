/**
 * SYNTHETIC enclosed driving proof-ground, unrelated to campus OSM.
 * Colliders are light static CANNON.Box bodies and never Three visual meshes.
 */
import * as CANNON from 'cannon-es'
import * as THREE from 'three'

/**
 * External road collision proxy contract for future host integration.
 * Positions use the SAME local metric XYZ coordinates as Atlas:
 * X east, Y up, Z south. All source inputs remain read-only.
 * This creates only CANNON static colliders, never visual track meshes.
 */
export function mountRoadCollisionProxies(physics, descriptors) {
  if (!physics?.world) throw new TypeError('physics.world required')
  if (!Array.isArray(descriptors)) throw new TypeError('descriptors must be an array')
  for (const d of descriptors) {
    if (!d || !Array.isArray(d.size) || d.size.length !== 3 ||
        !d.size.every(v => Number.isFinite(v) && v > 0)) {
      throw new RangeError('proxy size must have three positive finite values')
    }
    if (!Array.isArray(d.center) || d.center.length !== 3 ||
        !d.center.every(Number.isFinite)) {
      throw new TypeError('proxy center must have three finite metre coordinates')
    }
    if (![d.yaw ?? 0, d.slope ?? 0].every(Number.isFinite)) {
      throw new TypeError('proxy angles must be finite radians')
    }
  }
  const proxies = descriptors.map((d, index) => {
    const body = new CANNON.Body({ mass: 0, material: physics.world.defaultMaterial })
    body.addShape(new CANNON.Box(new CANNON.Vec3(d.size[0]/2,d.size[1]/2,d.size[2]/2)))
    body.position.set(...d.center)
    const yaw = new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,1,0),d.yaw ?? 0)
    const slope = new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1,0,0),d.slope ?? 0)
    body.quaternion.copy(yaw.mult(slope))
    physics.world.addBody(body)
    return { id: d.id ?? 'proxy-' + index, kind: d.kind ?? 'road', body,
      size: [...d.size], center: [...d.center], slope: d.slope ?? 0, yaw: d.yaw ?? 0 }
  })
  let destroyed = false
  return {
    proxies,
    destroy() {
      if (destroyed) return
      destroyed = true
      for (const {body} of proxies) physics.world.removeBody(body)
    }
  }
}

export function createSyntheticTrack({physics,scene=null,origin=[0,0,0]}){
  if(!physics?.world) throw new TypeError('physics required')
  const proxies=[], visuals=[]
  const asphalt=new THREE.MeshStandardMaterial({color:0x303b47,roughness:0.96})
  const concrete=new THREE.MeshStandardMaterial({color:0xaeb9c4,roughness:0.92})
  const hazard=new THREE.MeshStandardMaterial({color:0xe0b965,roughness:0.8})
  const bright=new THREE.MeshBasicMaterial({color:0xe7edf2})
  const terrain=new THREE.MeshStandardMaterial({color:0x53674d,roughness:1})
  function box(kind,id,size,center,{slope=0,yaw=0,material=asphalt}={}){
    const [sx,sy,sz]=size,[cx,cy,cz]=center; const [x,y,z]=[cx+origin[0],cy+origin[1],cz+origin[2]]
    const body=new CANNON.Body({mass:0,material:physics.world.defaultMaterial})
    body.addShape(new CANNON.Box(new CANNON.Vec3(sx/2,sy/2,sz/2)))
    body.position.set(x,y,z)
    const qYaw=new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,1,0),yaw)
    const qSlope=new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1,0,0),slope)
    body.quaternion.copy(qYaw.mult(qSlope))
    physics.world.addBody(body)
    const obj={kind,id,body,size:[...size],center:[x,y,z],slope,yaw}
    proxies.push(obj)
    if(scene){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material)
      mesh.position.set(x,y,z)
      mesh.quaternion.set(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w)
      mesh.receiveShadow=true
      mesh.castShadow=kind==='obstacle'||kind==='curb'
      scene.add(mesh)
      visuals.push(mesh)
    }
    return obj
  }
  box('road','flat-road',[12,0.65,52],[0,-0.325,0])
  box('slope','uphill-ramp',[12,0.65,12],[0,0.72-0.325,32],{slope:-0.12})
  box('road','upper-road',[12,0.65,18],[0,1.44-0.325,47])
  box('obstacle','impact-block',[1.2,1.5,1.2],[2.4,0.75,12],{material:hazard})
  for(const x of [-6.3,6.3]){
    box('curb','curb-'+x,[0.65,0.55,52],[x,0.15,0],{material:concrete})
    box('curb','upper-curb-'+x,[0.65,0.55,18],[x,1.6,47],{material:concrete})
  }
  for(const x of [-9,9])box('boundary','side-wall-'+x,[0.75,2.7,94],[x,1.3,14],{material:concrete})
  for(const z of [-28,58])box('boundary','end-wall-'+z,[18,2.7,0.75],[0,1.3,z],{material:concrete})
  if(scene){
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(130,145),terrain)
    ground.rotation.x=-Math.PI/2;ground.position.set(origin[0],origin[1]-0.72,origin[2])
    scene.add(ground);visuals.push(ground)
    // Lane lines are visual only, slightly lifted so there is no Z-fighting.
    for(let z=-23;z<24;z+=5){
      const stripe=new THREE.Mesh(new THREE.PlaneGeometry(0.13,2.45),bright)
      stripe.rotation.x=-Math.PI/2;stripe.position.set(origin[0],origin[1]+0.018,origin[2]+z)
      scene.add(stripe);visuals.push(stripe)
    }
    for(const x of [-5.4,5.4]){
      const line=new THREE.Mesh(new THREE.PlaneGeometry(0.12,51),bright)
      line.rotation.x=-Math.PI/2;line.position.set(origin[0]+x,origin[1]+0.018,origin[2])
      scene.add(line);visuals.push(line)
    }
    // Keep the driver's sightline unobstructed by decorative crossbars.
  }
  return {
    proxies,
    destroy(){
      for(const proxy of proxies)physics.world.removeBody(proxy.body)
      for(const mesh of visuals){
        mesh.removeFromParent();mesh.geometry.dispose()
      }
      for(const mat of [asphalt,concrete,hazard,bright,terrain])mat.dispose()
    }
  }
}
