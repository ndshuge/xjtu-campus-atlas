/**
 * Isolated Atlas racing core. Adapted from Ian Curtis, Raycast RC Car,
 * src/Vehicle.js @ f9d2457e94c18f71a8eca5884c68d943b6f1e9e5 (MIT).
 * CANNON.RaycastVehicle, wheel data, suspension and steering/engine math reused.
 * No renderer, DOM, RAF, gamepad, unverified upstream assets or global listeners.
 */
import * as CANNON from 'cannon-es'

const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:0))
const START=[0,2.1,-18]
const UP=new CANNON.Vec3(0,1,0)
const FORWARD=new CANNON.Vec3(0,0,1)
const validatedPosition=(position)=>{
  if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))
    throw new RangeError('spawn/reset requires three finite metre coordinates')
  return [...position]
}

export function createRacingPhysics({ spawn=START, heading=0 }={}) {
  if(!Number.isFinite(heading))throw new RangeError('finite heading required')
  const spawnPosition=validatedPosition(spawn)
  const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)})
  world.allowSleep=false
  world.solver.iterations=12
  world.broadphase=new CANNON.SAPBroadphase(world)
  world.defaultContactMaterial.friction=0.65
  const chassisMaterial=new CANNON.Material('race-chassis')
  world.addContactMaterial(new CANNON.ContactMaterial(chassisMaterial,world.defaultMaterial,{friction:0.01,restitution:0}))
  const body=new CANNON.Body({mass:250,material:chassisMaterial,linearDamping:0.015,angularDamping:0.12})
  body.addShape(new CANNON.Box(new CANNON.Vec3(0.9,0.3,1.55)),new CANNON.Vec3(0,0.5,0))
  for (const sx of [-1,1]) for(const sz of [-1,1])
    body.addShape(new CANNON.Sphere(0.3),new CANNON.Vec3(sx*0.6,0.5,sz*1.25))
  body.position.set(...spawnPosition)
  body.allowSleep=false

  const vehicle=new CANNON.RaycastVehicle({chassisBody:body,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2})
  const defaults={
    radius:0.42,directionLocal:new CANNON.Vec3(0,-1,0),
    suspensionStiffness:70,suspensionRestLength:0.55,
    frictionSlip:7.8,dampingRelaxation:3.5,dampingCompression:4.4,
    maxSuspensionForce:100000,rollInfluence:0.008,
    axleLocal:new CANNON.Vec3(1,0,0),maxSuspensionTravel:0.42,
    customSlidingRotationalSpeed:-30,useCustomSlidingRotationalSpeed:true
  }
  for(const [x,z] of [[-0.95,1.55],[0.95,1.55],[-0.95,-1.55],[0.95,-1.55]])
    vehicle.addWheel({...defaults,chassisConnectionPointLocal:new CANNON.Vec3(x,0.35,z)})
  vehicle.addToWorld(world)
  // Source's pitch/roll inertia stabilization, preserving free yaw dynamics.
  body.updateMassProperties()
  body.inertia.x*=3
  body.inertia.z*=3
  body.invInertia.set(1/body.inertia.x,1/body.inertia.y,1/body.inertia.z)
  body.updateInertiaWorld(true)

  let input={throttle:0,steer:0,brake:0,handbrake:false}
  let currentSteer=0
  let wheelRollAngles=[0,0,0,0]
  let lastContact=[false,false,false,false]
  let destroyed=false
  const spawnQuaternion=new CANNON.Quaternion().setFromAxisAngle(UP,heading)
  const setInput=(next={})=>{
    input={throttle:clamp(next.throttle??0,-1,1),steer:clamp(next.steer??0,-1,1),
      brake:clamp(next.brake??0,0,1),handbrake:next.handbrake===true}
  }
  function forwardDir(){return body.quaternion.vmult(FORWARD,new CANNON.Vec3())}
  function stepFixed(dt=1/60) {
    if(destroyed) throw new Error('physics destroyed')
    if(!Number.isFinite(dt)||dt<=0||dt>1/30) throw new Error('stepFixed requires positive dt <= 1/30')
    // Steering and rear-wheel drive adapted from Vehicle._applyControls().
    const speed=Math.hypot(body.velocity.x,body.velocity.z)*3.6
    // At road speeds the same thumb/key angle must command a smaller
    // physical steering angle; at parking speeds full steering is retained.
    const steerSpeedScale=Math.max(0.32,1-0.85*clamp((speed-8)/70,0,1))
    const targetSteer=-input.steer*0.55*steerSpeedScale
    currentSteer=clamp(targetSteer,currentSteer-6*dt,currentSteer+6*dt)
    vehicle.setSteeringValue(currentSteer,0)
    vehicle.setSteeringValue(currentSteer,1)
    const velocityForward=body.velocity.dot(forwardDir())
    let force=0
    if(input.throttle>0.05 && input.brake<0.05 && !input.handbrake && speed<90) {
      force=-1400*input.throttle
      // Preserve upstream front-wheel-load anti-wheelie safeguard.
      const frontLoad=vehicle.wheelInfos[0].suspensionForce+vehicle.wheelInfos[1].suspensionForce
      force*=clamp(frontLoad/((250*9.82/2)*0.4),0.35,1)
    } else if(input.throttle< -0.05 && !input.handbrake && velocityForward<0.5) {
      force=1400*0.6*Math.abs(input.throttle)
    }
    vehicle.applyEngineForce(force,2)
    vehicle.applyEngineForce(force,3)
    const reverseBraking=input.throttle< -0.05&&velocityForward>0.5 ? 18 : 0
    const reversing=input.throttle < -0.05 && velocityForward < 0.5
    // S is brake while moving forward, reverse when almost stopped.
    // Never hold the service brake against reverse engine torque.
    const brake=reversing?0:Math.max(input.brake*8,reverseBraking,
      Math.abs(input.throttle)<0.05?1.2:0)
    for(let i=0;i<4;i++) vehicle.setBrake(brake,i)
    if(input.handbrake) for(const i of [2,3]) vehicle.setBrake(6,i)
    world.step(dt)
    // cannon-es updateWheelTransformWorld() clears wheel.isInContact.
    // Preserve the raycast result before refreshing rendering transforms.
    lastContact=vehicle.wheelInfos.map(w=>!!w.isInContact)
    // cannon-es' small coast brake stops updating built-in wheel.rotation
    // even as the chassis still physically travels. As in the upstream
    // Vehicle._syncVisuals, integrate true chassis-ground displacement / radius
    // into each raycast wheel transform. Never move the mesh independently.
    const forwardRoll=body.velocity.dot(forwardDir())
    for(let i=0;i<4;i++){
      const wheel=vehicle.wheelInfos[i]
      if(lastContact[i])wheelRollAngles[i]-=forwardRoll*dt/wheel.radius
      wheel.rotation=wheelRollAngles[i]
      vehicle.updateWheelTransform(i)
    }
    if(body.position.y< -20) reset()
  }
  function getState(){
    if(destroyed) throw new Error('physics destroyed')
    return {
      position:[body.position.x,body.position.y,body.position.z],
      quaternion:[body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w],
      velocity:[body.velocity.x,body.velocity.y,body.velocity.z],
      speedKmh:Math.hypot(body.velocity.x,body.velocity.z)*3.6,steer:currentSteer,
      wheels:vehicle.wheelInfos.map((w,i)=>({
        index:i,contact:lastContact[i],suspensionLength:w.suspensionLength,
        rotation:w.rotation,steering:w.steering,
        position:[w.worldTransform.position.x,w.worldTransform.position.y,w.worldTransform.position.z],
        quaternion:[w.worldTransform.quaternion.x,w.worldTransform.quaternion.y,w.worldTransform.quaternion.z,w.worldTransform.quaternion.w]
      }))
    }
  }
  function reset(position=spawnPosition){
    const next=validatedPosition(position)
    body.position.set(...next);body.quaternion.copy(spawnQuaternion)
    body.velocity.setZero();body.angularVelocity.setZero();body.force.setZero();body.torque.setZero()
    body.aabbNeedsUpdate=true;currentSteer=0;lastContact=[false,false,false,false];wheelRollAngles=[0,0,0,0]
    setInput()
    for(const w of vehicle.wheelInfos){w.rotation=0;w.suspensionLength=w.suspensionRestLength}
    for(let i=0;i<4;i++) vehicle.updateWheelTransform(i)
  }
  function destroy(){
    if(destroyed) return
    destroyed=true
    setInput()
    vehicle.removeFromWorld(world)
    if(world.bodies.includes(body))world.removeBody(body)
  }
  reset(spawnPosition)
  return {world,body,vehicle,setInput,getInput:()=>({...input}),stepFixed,getState,reset,destroy}
}
