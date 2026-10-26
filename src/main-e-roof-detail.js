import * as THREE from 'three';

/**
 * Historic Xingqing Main E top portal interpretation.
 * Evidence: Danielinblue, "Zhulou xjtu.jpg", 2012-11-06,
 * https://commons.wikimedia.org/wiki/File:Zhulou_xjtu.jpg (CC BY 3.0).
 * The glazed, open rooftop frame has a dark elliptical element inside it.
 * Size and depth are approximate, NOT derived from measured photography.
 */
export function createMainERoofDetail({footprint,height,baseY}){
  const [x0,z0,x1,z1]=footprint;
  const cx=(x0+x1)/2,cz=(z0+z1)/2;
  const group=new THREE.Group();
  group.name='Main E / open roof portal circular suspended shade (photo-informed)';
  const dark=new THREE.MeshStandardMaterial({color:'#465157',metalness:.35,roughness:.57,side:THREE.DoubleSide});
  const rim=new THREE.MeshStandardMaterial({color:'#808783',metalness:.55,roughness:.44});
  const y=baseY+height-11.25,z=cz+5;
  const disc=new THREE.Mesh(new THREE.SphereGeometry(1,40,20),dark);
  disc.name='recessed oval roof shade / approximate';
  disc.position.set(cx,y,z);
  disc.scale.set(6.9,2.3,1.65);
  disc.castShadow=true;
  group.add(disc);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(1,.038,12,72),rim);
  lip.name='thin elliptical metallic rim';
  lip.scale.set(7.15,2.5,1);
  lip.position.set(cx,y,z+1.25);
  group.add(lip);
  for(const side of [-1,1]){
    const support=new THREE.Mesh(new THREE.BoxGeometry(.23,4.8,.23),rim);
    support.name='recessed oval roof support';
    support.position.set(cx+side*7.35,y,z);
    group.add(support);
  }
  group.userData={
    photography:'Danielinblue / Wikimedia Commons, 2012-11-06',
    link:'https://commons.wikimedia.org/wiki/File:Zhulou_xjtu.jpg',
    license:'CC BY 3.0; no image textures copied',
    accuracy:'Historical photo-informed approximate ornament; unsurveyed'
  };
  return group;
}
