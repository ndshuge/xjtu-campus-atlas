// Photo-review-only camera; geometry is an estimated OSM/photo-informed shell.
// No effect on the default visitor camera or navigation.
export function librarySouthInspectionPose(plan,baseY,mobile=false){
 const front=plan.courses[0].rect[3];
 return {
  eye:[plan.centerX,baseY+(mobile?42:32),front+(mobile?110:62)],
  look:[plan.centerX,baseY+25,front-10],
  fov:mobile?67:50
 };
}
