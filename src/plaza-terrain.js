import * as THREE from 'three';
import {BASE} from './geo.js';

// Interpretive paving only within the empty corridor confirmed by the
// campus OSM footprint grid. NOT an as-built survey or contour elevation.
// No alteration to the underlying roads, building data or terrain height.
export const PLAZA_PAVING={left:-76,right:13,south:-42,north:10};
export function buildFourInventionsPaving(scene){
 const {left,right,south,north}=PLAZA_PAVING;
 const group=new THREE.Group();group.name='Four Inventions / courtyard paving inferred from open OSM ground';
 const stone=new THREE.MeshStandardMaterial({color:'#d5d1c4',roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const walk=new THREE.MeshStandardMaterial({color:'#e1d9c8',roughness:.96,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 const joint=new THREE.LineBasicMaterial({color:'#bcb5a7',transparent:true,opacity:.44,depthWrite:false});
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
 const pts=[];
 for(let x=left+4;x<right-2;x+=5.5){pts.push(new THREE.Vector3(x,BASE+.059,south+.8),new THREE.Vector3(x,BASE+.059,north-.8));}
 for(let z=south+3;z<north-1;z+=5.6){pts.push(new THREE.Vector3(left+.6,BASE+.059,z),new THREE.Vector3(right-.6,BASE+.059,z));}
 const lines=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),joint);
 lines.name='Paving expansion joints';lines.renderOrder=2;group.add(lines);
 // Tactile stone border is inset inside the known empty corridor; no fake cliffs.
 for(const [x,z,w,d] of [
  [cx,south+.75,right-left-1,1.0],[cx,north-.75,right-left-1,1.0],
  [left+.7,cz,1.0,north-south-1],[right-.7,cz,1.0,north-south-1]
 ])slab('Courtyard edging',x,z,w,d,border,BASE+.053);
 group.userData={accuracy:'interpretive courtyard paving from current open OSM corridor; not surveyed',terrain:'flat, no invented contour or elevation',osmBuildingsPreserved:true};
 scene.add(group);return group;
}
