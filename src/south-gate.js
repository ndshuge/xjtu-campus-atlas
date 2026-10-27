import * as THREE from 'three';

// Photo-informed South Gate model. Historic 2011 Commons reference.
// Coordinates from two OSM gate nodes; dimensions and present-day status not surveyed.
export function createSouthGate(position,baseY=1.1,passagePositions=[]){
 const [x,z]=position,group=new THREE.Group();
 // Center the monument between two mapped passage openings rather than
 // guessing a 31-metre shift west; size it to leave BOTH lanes unobstructed.
 const xs=passagePositions.map(p=>p[0]).filter(Number.isFinite).sort((a,b)=>a-b);
 const span=xs.length>=2?xs.at(-1)-xs[0]:23.3;
 const wallWidth=Math.min(26.5,span-6);
 if(wallWidth<9)throw new RangeError('South Gate mapped passage span too narrow for the monument');
 const wallHeight=wallWidth*(3.65/26.5);
 const signX=x,wallZ=z+2.7,plinthHeight=.36;
 const signY=baseY+plinthHeight+wallHeight/2;
 group.name='XJTU Xingqing South Gate — historic-photo interpretation';
 const plaque=new THREE.MeshStandardMaterial({color:'#98574b',roughness:.74});
 const edges=new THREE.MeshStandardMaterial({color:'#62594c',roughness:.83});
 const add=(geo,material,name,xp=x,yp=baseY,zp=z)=>{
  const mesh=new THREE.Mesh(geo,material);mesh.name=name;mesh.position.set(xp,yp,zp);
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 // A compact centre-median monument leaves the two OSM passages open.
 // Its estimated width is constrained by observed passage spacing, not a survey.
 add(new THREE.BoxGeometry(wallWidth+.45,plinthHeight,3),edges,'sign plinth',signX,baseY+plinthHeight/2,wallZ-.2);
 add(new THREE.BoxGeometry(wallWidth,wallHeight,2.3),plaque,'red granite sign wall',signX,signY,wallZ);
 add(new THREE.BoxGeometry(wallWidth+.26,.2,2.5),edges,'sign cap',signX,baseY+plinthHeight+wallHeight+.1,wallZ);
 // Central seal, simplified circular representation.
 // The historical photographic facade texture includes the central university seal.
 // Photo facade includes historic real calligraphy, bilingual name and seal.
 const historicTexture=new THREE.TextureLoader().load((import.meta.env?.BASE_URL||'./')+'assets/reference/south-gate-signage-crop.png');
 historicTexture.colorSpace=THREE.SRGBColorSpace;historicTexture.anisotropy=8;
 const historicFacade=add(new THREE.PlaneGeometry(wallWidth-.2,wallHeight-.14),new THREE.MeshBasicMaterial({map:historicTexture,side:THREE.DoubleSide}),'2011 photographed south gate signage',signX,signY,wallZ+1.27);
 historicFacade.castShadow=false;
 // Other rail and back-building shapes in the 2011 image are NOT georeferenced.
 // They are deliberately omitted to keep the two present OSM gate corridors clear.
 group.userData={
  source:'Wikimedia Commons XJTU Gate.jpg, Jucember, 2011 (CC BY-SA 3.0)',
  accuracy:'historic-photo-informed schematic; not a current architectural survey',
  positionBasis:'OSM passage midpoint, visually aligned with Siyuan Student Activity Center; exact position not surveyed',
  estimatedOpenCorridors:'both mapped passage anchors remain unobstructed; clearance envelope is not certified',
  estimatedMonumentWidth:wallWidth
 };
 return group;
}
