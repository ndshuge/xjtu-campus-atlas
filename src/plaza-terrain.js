import * as THREE from 'three';
import {BASE} from './geo.js';

// Interpretive paving only within the empty corridor confirmed by the
// campus OSM footprint grid. NOT an as-built survey or contour elevation.
// No alteration to the underlying roads, building data or terrain height.
export const PLAZA_PAVING={left:-76,right:13,south:-42,north:10};
export function createCourtyardStoneTexture(){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 ctx.fillStyle='#d1cdc4';ctx.fillRect(0,0,256,256);
 // Subtle stone patches and staggered expansion seams, baked as a mipmapped texture.
 for(let row=0;row<8;row++)for(let col=-1;col<9;col++){
  const x=col*32+(row%2)*16,y=row*32;
  const noise=(row*23+col*17+101)%9;
  ctx.fillStyle='rgb('+[209+noise,205+noise,194+noise].join(',')+')';
  ctx.fillRect(x+1,y+1,30,30);
  ctx.fillStyle='rgba(122,116,105,.065)';
  ctx.fillRect(x+1,y+30,30,1);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(3.2,1.9);texture.anisotropy=8;
 texture.minFilter=THREE.LinearMipmapLinearFilter;
 return texture;
}
export function buildFourInventionsPaving(scene){
 const {left,right,south,north}=PLAZA_PAVING;
 const group=new THREE.Group();group.name='Four Inventions / courtyard paving inferred from open OSM ground';
 const stone=new THREE.MeshStandardMaterial({color:'#f8f7f4',map:createCourtyardStoneTexture(),roughness:.95,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const walk=new THREE.MeshStandardMaterial({color:'#e1d9c8',roughness:.96,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 const joint=new THREE.LineBasicMaterial({color:'#bcb5a7',transparent:true,opacity:.20,depthWrite:false});
 const border=new THREE.MeshStandardMaterial({color:'#aaa898',roughness:1});
 const grass=new THREE.MeshStandardMaterial({color:'#9cae83',roughness:1});
 function slab(name,x,z,w,d,mat,y=BASE+.044){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);
  m.receiveShadow=true;m.name=name;group.add(m);return m;
 }
 const cx=(left+right)/2,cz=(south+north)/2;
 slab('OSM open corridor / single paved base',cx,cz,right-left,north-south,stone,BASE+.025);
 // Stone approach along north/south campus pedestrian axis and one cross walk.
 slab('North-south accessible walkway',-31.5,cz,8.5,north-south-3,walk,BASE+.045);
 slab('Open courtyard crossing',cx,-16.5,right-left-3,6.2,walk,BASE+.047);
 // Historic square photographs show grass adjoining stone sculpture pads.
 // Keep planted pockets outside the four sculpture foundations.
 for(const xx of [left+5.7,right-5.7])for(const zz of [-31,-1]){
  slab('Perimeter lawn / interpretive planting pocket',xx,zz,8.4,13.5,grass,BASE+.050);
 }
 // Fine joint pattern with an intentional surface offset to prevent z-fighting.
 // The four interpreted sculpture locations must have complete, level
 // landing pads. Their 2D centres match campus.json + four-inventions.js.
 // No ground is dug or raised beyond a thin nonstructural surface layer.
 const sculpturalCentre=[-31.32,0];
 const foundations=[];
 for(const dx of [-18,18])for(const dz of [-18,10]){
  const x=sculpturalCentre[0]+dx,z=sculpturalCentre[1]+dz;
  const disk=new THREE.Mesh(new THREE.CircleGeometry(3.68,48),walk);
  disk.rotation.x=-Math.PI/2;disk.position.set(x,BASE+.070,z);
  disk.receiveShadow=true;disk.name='Sculpture foundation landing / level retained';
  group.add(disk);foundations.push([x,z]);
 }
 // Do not draw seam lines across grass or under the sculptures.
 const pts=[];
 for(const z of [-34.0,-25.0,-7.5,1.0]){pts.push(new THREE.Vector3(-35.7,BASE+.061,z),new THREE.Vector3(-27.3,BASE+.061,z));}
 // The peripheral paving stays uncluttered; the precise stone pattern is unverified.
 const lines=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),joint);
 lines.name='Limited axial paving expansion seams';lines.renderOrder=2;group.add(lines);
 // Tactile stone border is inset inside the known empty corridor; no fake cliffs.
 for(const [x,z,w,d] of [
  [cx,south+.75,right-left-1,1.0],[cx,north-.75,right-left-1,1.0],
  [left+.7,cz,1.0,north-south-1],[right-.7,cz,1.0,north-south-1]
 ])slab('Courtyard edging',x,z,w,d,border,BASE+.053);
 group.userData={accuracy:'interpretive courtyard paving from current open OSM corridor; not surveyed',terrain:'flat, no invented contour or elevation',osmBuildingsPreserved:true,sculpturalLandings:foundations,foundationPositionSource:'public/data/campus.json interpretive/four-inventions',northEdgeKeptAt:PLAZA_PAVING.north};
 scene.add(group);return group;
}
