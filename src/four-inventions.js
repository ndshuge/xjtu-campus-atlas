import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Campus history documents FOUR independent sculptural installations at the
// corners of the square; positions and designs here are interpretations, not
// surveyed/as-built works by the original sculptor Jia Zhuofei.
export function createFourInventionsMarker(position){
 const [cx,cz]=position;
 const g=new THREE.Group();g.name='Four Great Inventions / four corner installations';
 const stone=new THREE.MeshStandardMaterial({color:'#b4aea3',roughness:.86});
 const metal=new THREE.MeshStandardMaterial({color:'#526064',metalness:.48,roughness:.46});
 const dark=new THREE.MeshStandardMaterial({color:'#383e40',metalness:.55,roughness:.38});
 const bronze=new THREE.MeshStandardMaterial({color:'#897263',metalness:.4,roughness:.52});
 const add=(geometry,material,name,x,y,z)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
  g.add(mesh);return mesh;
 };
 // Deliberately open, unobstructed plaza centre, unlike the previous
 // incorrect single central sculpture. No large flat floor is placed
 // over existing mapped roads or buildings.
 const bases=[[-18,-18],[18,-18],[-18,10],[18,10]];
 const label=['Papermaking','Printing','Compass','Gunpowder'];
 for(let i=0;i<4;i++){
  const [dx,dz]=bases[i],x=cx+dx,z=cz+dz;
  add(new THREE.CylinderGeometry(3.25,3.45,.42,32),stone,label[i]+' / granite foundation',x,1.39,z);
  add(new THREE.CylinderGeometry(2.86,3.08,.12,32),bronze,label[i]+' / plinth rim',x,1.67,z);
  if(i===0){
   // The university's historical AR game article explicitly describes
   // TWENTY paper leaves on the paper-making sculpture. Their exact
   // shape is unmeasured, so represent each leaf as an individually curved
   // metallic ribbon rather than inventing a four-leaf object.
   const paper=new THREE.MeshStandardMaterial({color:'#a3a9a6',metalness:.32,roughness:.55,side:THREE.DoubleSide});
   for(let j=0;j<20;j++){
    const u=j/19,phase=(u-.5)*1.85;
    const points=[];
    for(let k=0;k<=20;k++){
     const t=k/20,angle=phase+(t-.5)*.2;
     points.push(new THREE.Vector3(x+Math.sin(angle)*(1.15+2.05*t),2.08+3.55*t-.35*t*t,
      z+Math.cos(angle)*(1.15+1.95*t)));
    }
    const arr=[],indices=[];
    for(let k=0;k<points.length;k++){
     const pt=points[k],width=.095+.065*Math.sin(k/20*Math.PI);
     arr.push(pt.x-width,pt.y,pt.z,pt.x+width,pt.y,pt.z);
     if(k<points.length-1){const v=k*2;indices.push(v,v+1,v+2,v+1,v+3,v+2);}
    }
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
    geom.setIndex(indices);geom.computeVertexNormals();
    add(geom,paper,'Papermaking / one of twenty interpretive leaves '+j,0,0,0);
   }
  }else if(i===1){
   // Historic photograph by Danielinblue (2013) shows a leaning mass of
   // stone type-blocks with raised Chinese characters. This is sculptural,
   // not a literal movable-type printing machine.
   const granite=new THREE.MeshStandardMaterial({color:'#b9b3a8',roughness:.98,flatShading:true});
   const engraved=new THREE.MeshStandardMaterial({color:'#9b948a',roughness:.99});
   const tilt=-.38;
   for(let j=0;j<9;j++){
    const row=Math.floor(j/3),col=j%3;
    const u=(col-1)*1.54+.16*(row%2),v=(row-1)*1.38;
    const w=1.72,h=1.49,d=1.8+((j*3)%4)*.15;
    const block=add(new RoundedBoxGeometry(w,h,d,3,.07),granite,'Printing / photo-based carved stone block '+j,
     x+u*Math.cos(tilt)-v*Math.sin(tilt),4.04+u*Math.sin(tilt)+v*Math.cos(tilt),z+.22*Math.sin(row));
    block.rotation.z=tilt;block.rotation.y=.16;
    // The original photograph shows raised calligraphic glyphs across the
    // facets. An illustrative monochrome canvas gives the masses recognizable
    // carved faces without importing copyrighted reference photographs.
    if(typeof document!=='undefined'){
     const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
     const ctx=canvas.getContext('2d');
     if(ctx){
      ctx.clearRect(0,0,192,192);
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='bold 132px KaiTi, STKaiti, "Microsoft YaHei", serif';
      ctx.fillStyle='#968f84';ctx.fillText('印刷文创字形术技'[j],96,98);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const lettering=add(new THREE.PlaneGeometry(1.10,1.06),
       new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}),
       'Printing / illustrative raised lettering '+j,block.position.x,block.position.y,block.position.z+d/2+.16);
      lettering.rotation.z=tilt;lettering.rotation.y=.16;lettering.castShadow=false;
     }
    }
    if(j%2===0){
     const relief=add(new RoundedBoxGeometry(.78,.17,.11,2,.03),engraved,'Printing / shallow relief carving '+j,
       block.position.x+.23,block.position.y-.47,block.position.z+d/2+.10);
     relief.rotation.z=tilt-.3;
    }
   }
   // Heavy offset supporting masonry keeps the asymmetrical mass grounded.
   const foot=add(new RoundedBoxGeometry(2.7,.9,3.1,3,.065),granite,'Printing / leaning stone heel',x-.5,1.99,z);
   foot.rotation.z=-.38;
  }else if(i===2){
   // Compass: bronze ring supported by stone and needle.
   const ring=add(new THREE.TorusGeometry(1.6,.19,10,60),bronze,'Compass / circle',x,3.35,z);
   ring.rotation.y=.22;
   const needle=add(new THREE.ConeGeometry(.5,3.7,4),metal,'Compass / pointing needle',x,3.25,z);
   needle.rotation.z=Math.PI/2;
   add(new THREE.BoxGeometry(.55,2.45,.55),dark,'Compass / stem',x,2.7,z);
  }else{
   // Gunpowder: upward oxidised metal fountain of arcs, not a weapon.
   for(let j=0;j<7;j++){
    const a=j/7*Math.PI*2;
    const pts=[];
    for(let k=0;k<=14;k++){
     const t=k/14;
     pts.push(new THREE.Vector3(x+Math.sin(a)*(1.7*t+.12),1.91+4.45*t,
      z+Math.cos(a)*(1.7*t+.12)));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),22,.12,7),metal,'Gunpowder / radial stem '+j,0,0,0);
   }
   add(new THREE.IcosahedronGeometry(.74,1),bronze,'Gunpowder / upper flame form',x,6.38,z);
  }
 }
 g.userData={
  interpretive:true,notForNavigation:true,sculptor:'Jia Zhuofei',
  arrangement:'four corners, not a central monument',
  exactPlacementsUnverified:true,individualSculptureShapesUnverified:true,
  reference:'https://www.xjtu.edu.cn/info/1016/29901.htm',
  artistReference:'https://rwxy.xjtu.edu.cn/info/1038/5694.htm'
 };
 return g;
}
