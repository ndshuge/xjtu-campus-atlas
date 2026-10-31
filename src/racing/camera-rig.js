import * as THREE from 'three'

/**
 * Camera logic independent of input listeners, RAF and rendering.
 * Follows only the horizontal HEADING of the physics chassis, deliberately
 * filtering out pitch/roll from suspension and collisions to prevent nausea.
 */
export function createDriveCameraRig(camera){
  if(!camera?.isPerspectiveCamera)throw new TypeError('PerspectiveCamera required')
  const yAxis=new THREE.Vector3(0,1,0)
  const forward=new THREE.Vector3(0,0,1)
  const rotation=new THREE.Quaternion()
  const yawRotation=new THREE.Quaternion()
  const anchor=new THREE.Vector3()
  const offset=new THREE.Vector3()
  const desired=new THREE.Vector3()
  const look=new THREE.Vector3()
  let mode=0,orbitYaw=0,orbitPitch=0,lastHeading=0

  function update(state,dt=1/60){
    if(!Array.isArray(state?.position)||!Array.isArray(state?.quaternion))
      throw new TypeError('physics position and quaternion required')
    anchor.fromArray(state.position)
    rotation.fromArray(state.quaternion)
    forward.set(0,0,1).applyQuaternion(rotation)
    if(Math.hypot(forward.x,forward.z)>.04){
      lastHeading=Math.atan2(forward.x,forward.z)
    }
    yawRotation.setFromAxisAngle(yAxis,lastHeading)
    const step=Math.min(Math.max(Number.isFinite(dt)?dt:0,0),.08)
    camera.up.set(0,1,0)
    if(mode===0){
      const distance=9.1
      offset.set(Math.sin(orbitYaw)*distance,3.8+orbitPitch,-Math.cos(orbitYaw)*distance)
      offset.applyQuaternion(yawRotation)
      desired.copy(anchor).add(offset)
      camera.position.lerp(desired,1-Math.exp(-step*5.5))
      look.copy(anchor).add(new THREE.Vector3(0,camera.aspect<.68?-.25:1.15,0))
      // Keep look target in front of chassis but don't rotate with roll.
      look.addScaledVector(new THREE.Vector3(0,0,1).applyQuaternion(yawRotation),.4)
      camera.lookAt(look)
      if(camera.fov!==64){camera.fov=64;camera.updateProjectionMatrix()}
    }else{
      offset.set(0,1.22,.35).applyQuaternion(yawRotation)
      camera.position.copy(anchor).add(offset)
      look.copy(camera.position)
      const focus=new THREE.Vector3(Math.sin(orbitYaw)*.5,0,8).applyQuaternion(yawRotation)
      look.add(focus)
      camera.lookAt(look)
      if(camera.fov!==76){camera.fov=76;camera.updateProjectionMatrix()}
    }
  }
  function drag(dx,dy){
    orbitYaw=THREE.MathUtils.clamp(orbitYaw+dx*.006,-Math.PI,Math.PI)
    orbitPitch=THREE.MathUtils.clamp(orbitPitch-dy*.023,-1.1,3)
  }
  function cycle(){mode=(mode+1)%2;orbitYaw=0;orbitPitch=0}
  function reset(){orbitYaw=0;orbitPitch=0;lastHeading=0;mode=0}
  function getState(){return {mode,orbitYaw,orbitPitch,heading:lastHeading}}
  return {update,drag,cycle,reset,getState}
}
