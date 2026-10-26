import * as THREE from 'three';
import {createHuman} from './characters.js';
export const H=3.6, W=24, D=18;
export const materials={
 concrete:new THREE.MeshStandardMaterial({color:0x777b70,roughness:.96}),
 edge:new THREE.MeshStandardMaterial({color:0x414a43,roughness:.9}),
 metal:new THREE.MeshStandardMaterial({color:0x344438,roughness:.8,metalness:.3}),
 glass:new THREE.MeshStandardMaterial({color:0x7caaa2,roughness:.22,metalness:.55,transparent:true,opacity:.54,side:THREE.DoubleSide}),
 darkGlass:new THREE.MeshStandardMaterial({color:0x273c36,roughness:.3,metalness:.45,transparent:true,opacity:.76,side:THREE.DoubleSide}),
 wood:new THREE.MeshStandardMaterial({color:0x706047,roughness:.92}),
 rust:new THREE.MeshStandardMaterial({color:0x806448,roughness:.9}),
 white:new THREE.MeshStandardMaterial({color:0xc6cab9,roughness:.9}),
 green:new THREE.MeshStandardMaterial({color:0x536549,roughness:1}),
 asphalt:new THREE.MeshStandardMaterial({color:0x3b443b,roughness:1}),
 stone:new THREE.MeshStandardMaterial({color:0x9b9c89,roughness:1}),
 brick:new THREE.MeshStandardMaterial({color:0xb8a495,roughness:.95})
};
const boxGeometry=new THREE.BoxGeometry(1,1,1);
export function box(parent,x,y,z,sx,sy,sz,mat,shadow=true){const m=new THREE.Mesh(boxGeometry,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
export function textSign(parent,text,x,y,z,width,height,bg='#293c31',color='#e2e5cb'){
 const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=color;ctx.font='bold 130px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,135,950);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:tex,roughness:.9}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
export function makeWorld(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xb4c8d2);scene.fog=new THREE.FogExp2(0xb4c8d2,.0035);
 scene.add(new THREE.HemisphereLight(0xd4e4ed,0x75674e,1.8));materials.green.color.setHex(0x667452);materials.edge.color.setHex(0x48504e);materials.wood.color.setHex(0x9c7954);materials.glass.color.setHex(0xa0b7ba);materials.darkGlass.color.setHex(0x556c70);materials.glass.opacity=.42;
 const sun=new THREE.DirectionalLight(0xffedcf,3.2);sun.position.set(-38,80,50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:170});sun.shadow.normalBias=.06;scene.add(sun);scene.add(sun.target);
 const concreteMap=new THREE.TextureLoader().load('assets/concrete.jpg');concreteMap.colorSpace=THREE.SRGBColorSpace;concreteMap.wrapS=concreteMap.wrapT=THREE.RepeatWrapping;concreteMap.repeat.set(4,4);concreteMap.anisotropy=4;materials.concrete.map=concreteMap;materials.concrete.color.setHex(0xc0c4b2);materials.concrete.needsUpdate=true;
 const loader=new THREE.TextureLoader();for(const name of ['brick','wood','metal','asphalt']){const mat=materials[name],map=loader.load('assets/'+name+'.jpg'),normal=loader.load('assets/'+name+'-normal.png');map.colorSpace=THREE.SRGBColorSpace;for(const tex of [map,normal]){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(name==='asphalt'?12:2,name==='asphalt'?5:2);tex.anisotropy=4;}mat.map=map;mat.normalMap=normal;mat.normalScale.set(.25,.25);mat.needsUpdate=true;}
 const ground=box(scene,0,-.35,0,350,.6,350,materials.green,false);
 box(scene,0,-.02,18,72,.18,15,materials.concrete,false);box(scene,0,-.04,34,340,.15,13,materials.asphalt,false);
 for(let x=-140;x<150;x+=9)box(scene,x,.055,34,4,.015,.13,materials.white,false);
 box(scene,0,-.05,0,29,.2,23,materials.concrete,false);
 const breakables=[],pickups=[],solids=[],platforms=[],surfaces=[],stairPath=[],resident=new Set(),savedFloors=new Map();let generatingFloor=null,revision=0;
 const fixtureMat=new THREE.MeshStandardMaterial({color:0xaaa792,emissive:0xffe4b1,emissiveIntensity:.3});
 const stairMat=new THREE.MeshStandardMaterial({color:0x7a817b,roughness:.9}),railMat=new THREE.MeshStandardMaterial({color:0x6b807e,metalness:.4,roughness:.7}),landingMat=new THREE.MeshStandardMaterial({color:0x85877a,roughness:.9});
 function surface(x0,x1,z0,z1,y0,y1=y0){surfaces.push({x0,x1,z0,z1,y0,y1,floor:generatingFloor});}
 function flight(x,y,z0,z1,h){const steps=18,mesh=new THREE.InstancedMesh(boxGeometry,stairMat,steps),dummy=new THREE.Object3D();for(let s=0;s<steps;s++){const t=(s+.5)/steps;dummy.position.set(x,y+t*h-.08,z0+(z1-z0)*t);dummy.scale.set(2.8,.18,Math.abs(z1-z0)/steps+.03);dummy.updateMatrix();mesh.setMatrixAt(s,dummy.matrix);}mesh.receiveShadow=true;scene.add(mesh);surface(x-1.4,x+1.4,Math.min(z0,z1),Math.max(z0,z1),z0<z1?y:y+h,z0<z1?y+h:y);for(const side of [-1,1]){const rail=box(scene,x+side*1.45,y+h/2+.85,(z0+z1)/2,.07,.07,Math.hypot(z1-z0,h),railMat,false);rail.rotation.x=-Math.atan2(h,z1-z0);rail.userData.collider=true;}}
 function addBreak(kind,x,y,z,sx,sy,sz,mat,floor=0){
  const mesh=box(scene,x,y,z,sx,sy,sz,mat,floor<6);const size=new THREE.Vector3(sx,sy,sz);
  const stats={window:[26,1250,40000],desk:[65,850,2400],cabinet:[90,1400,7200],crate:[38,450,700],wall:[150,2800,26000],vent:[60,1100,9500],column:[2400,4500,45000],slab:[1600,1800,18000],sofa:[80,1700,5600],lamp:[22,300,1200],chair:[35,400,450],monitor:[28,900,1800],printer:[70,1100,2500],bookshelf:[95,1400,3200],locker:[120,1300,2600],vending:[170,2400,8500],barrel:[85,1200,1800],hydrant:[140,1500,4500],bench:[90,1000,2100],planter:[55,650,1200],server:[160,2800,16000],toolbox:[65,950,1600],extinguisher:[40,800,900],aircon:[125,1800,6200]}[kind]||[50,500,1000];
  const o={kind,mesh,pos:mesh.position,size,hp:stats[0]*Math.max(.18,1-floor*.027),maxHp:stats[0]*Math.max(.18,1-floor*.027),score:Math.round(stats[1]*(1+floor*.055)),cost:stats[2],floor,alive:true,solid:kind!=='lamp',bounds:new THREE.Box3().setFromCenterAndSize(mesh.position,size),shake:0};
  if(kind==='column')o.hp=o.maxHp=stats[0];
  mesh.userData.object=o;breakables.push(o);return o;
 }
 const propProxy=new THREE.MeshBasicMaterial({visible:false});
 function addProp(kind,x,y,z,f){
  const sizes={chair:[.8,1.1,.8],monitor:[1,.85,.45],printer:[1.1,.9,.8],bookshelf:[1.5,2.3,.55],locker:[.85,2.2,.65],vending:[1.3,2.3,.9],barrel:[.9,1.25,.9],hydrant:[.6,.95,.6],bench:[2.2,.9,.8],planter:[.85,1.5,.85],server:[1.1,2.4,.85],toolbox:[1,.7,.6],extinguisher:[.4,.85,.4],aircon:[1.7,1.1,.7]};
  const [sx,sy,sz]=sizes[kind],o=addBreak(kind,x,y+sy/2+.07,z,sx,sy,sz,propProxy,f);
  const part=(px,py,pz,w,h,d,mat)=>box(o.mesh,px/sx,py/sy,pz/sz,w/sx,h/sy,d/sz,mat,false);
  if(kind==='chair'||kind==='bench'){
   part(0,-.08,0,sx,.12,sz,materials.wood);part(0,.3,-sz*.4,sx,.6,.1,materials.green);
   for(const dx of [-1,1])for(const dz of [-1,1])part(dx*sx*.38,-sy*.28,dz*sz*.35,.075,sy*.45,.075,materials.metal);
  }else if(kind==='monitor'){
   part(0,.1,0,.95,.58,.1,materials.edge);part(0,.1,.06,.83,.45,.02,materials.darkGlass);part(0,-.25,0,.08,.3,.12,materials.metal);part(0,-.4,0,.5,.05,.35,materials.metal);
  }else if(kind==='planter'){
   part(0,-.48,0,.8,.5,.8,materials.rust);part(0,-.05,0,.12,.5,.12,materials.wood);part(0,.35,0,.6,.7,.6,materials.green);part(.2,.15,.12,.5,.4,.45,materials.green);
  }else if(kind==='barrel'||kind==='hydrant'||kind==='extinguisher'){
   part(0,0,0,sx*.8,sy,sz*.8,materials.rust);for(const yy of [-.3,.3])part(0,yy*sy,0,sx,.08,sz,materials.metal);
   if(kind!=='barrel'){part(0,sy*.35,0,sx*1.3,.12,sz*.5,materials.metal);part(sx*.5,0,0,.1,sy*.75,.1,materials.edge);}
  }else{
   part(0,0,0,sx,sy,sz,kind==='bookshelf'?materials.wood:materials.metal);
   if(kind==='bookshelf'){for(let row=0;row<4;row++)for(let i=0;i<5;i++)part(-.55+i*.27,-.8+row*.52,sz/2+.02,.18,.35,.08,[materials.rust,materials.green,materials.white][i%3]);}
   else if(kind==='vending'){part(-.16,.18,sz/2+.03,.8,1.5,.05,materials.darkGlass);for(let i=0;i<3;i++)part(.48,.55-i*.22,sz/2+.08,.11,.09,.04,materials.white);part(0,-.8,sz/2+.04,.7,.22,.07,materials.edge);}
   else if(kind==='server'||kind==='aircon'){for(let i=0;i<6;i++)part(0,-sy*.35+i*sy*.13,sz/2+.015,sx*.82,.045,.03,materials.edge);part(sx*.3,sy*.38,sz/2+.025,.08,.08,.04,materials.green);}
   else if(kind==='printer'){part(0,sy*.4,0,sx*.85,.07,sz*.8,materials.darkGlass);part(0,-sy*.2,sz/2+.02,sx*.7,.08,.06,materials.white);}
   else {part(0,0,sz/2+.025,sx*.8,sy*.87,.035,materials.edge);part(sx*.3,sy*.1,sz/2+.055,.08,.22,.06,materials.rust);}
  }
  return o;
 }
 function generateFloor(f){
  if(resident.has(f)||f<0)return;generatingFloor=f;resident.add(f);
  const firstMesh=scene.children.length;
  const y=f*H;
  const bays=[];for(let bx=0;bx<4;bx++)for(let bz=0;bz<3;bz++){const parts=bx===3&&bz===2?[[6.8,6,1.6,6],[11.2,6,1.6,6],[9,3.8,2.8,1.6],[9,8.2,2.8,1.6]]:[[-9+bx*6,-6+bz*6,6,6]];for(const [x,z,sx,sz] of parts){const slab=addBreak('slab',x,y-.13,z,sx,.26,sz,materials.concrete,f);slab.solid=false;slab.hp=slab.maxHp=1600*Math.max(.65,1-f*.005);bays.push(slab);}}platforms[f]=bays;
  for(let x of [-12,12])for(let z of [-9,9])addBreak('column',x,y+H/2,z,.55,H,.55,materials.edge,f);
  for(const x of [7.5,10.5])box(scene,x,y+H/2,4.5,.1,H,.1,railMat,false);
  textSign(scene,'E / ELEVATOR',9,y+2.5,7.5,2,.35,'#063c54','#5effee');
  box(scene,0,y+3.35,-9,W,.32,.38,materials.edge,f<5);box(scene,0,y+3.35,9,W,.32,.38,materials.edge,f<5);
  box(scene,-12,y+3.35,0,.38,.32,D,materials.edge,f<5);box(scene,12,y+3.35,0,.38,.32,D,materials.edge,f<5);
  for(let i=0;i<8;i++){
   const x=-10.5+i*3;
   for(let z of [-9,9]){box(scene,x-1.45,y+1.7,z,.1,3.1,.18,materials.edge,false);addBreak('window',x,y+1.7,z,2.78,2.9,.12,(i+f)%4===0?materials.darkGlass:materials.glass,f);}
  }
  for(let i=0;i<6;i++){
   const z=-7.5+i*3;
   for(let x of [-12,12]){box(scene,x,y+1.7,z-1.45,.18,3.1,.1,materials.edge,false);if(!(x===12&&i===5))addBreak('window',x,y+1.7,z,.12,2.9,2.78,(i+f)%4===0?materials.darkGlass:materials.glass,f);}
  }
  const count=8+(f%9);
  for(let i=0;i<count;i++){
   const x=-8.8+(i%5)*3.8,z=-5.6+Math.floor(i/5)*3.4;
   if(x>6&&z<-3)continue;
   const kind=['desk','crate','cabinet','sofa','vent'][i%5];
   const sizes={desk:[2.3,.8,1.3],crate:[1.1,1.1,1.1],cabinet:[1.1,2.2,.7],sofa:[2.5,.9,1.1],vent:[1.5,1,1.5]}[kind];
   const o=addBreak(kind,x,y+sizes[1]/2+.07,z,...sizes,kind==='sofa'?materials.green:kind==='vent'||kind==='cabinet'?materials.metal:materials.wood,f);
   if(kind==='desk'){o.mesh.scale.y=.12;o.mesh.position.y=y+.83;o.size.y=.12;o.bounds.setFromCenterAndSize(o.pos,o.size);for(let dx of [-.9,.9])for(let dz of [-.48,.48])box(o.mesh,dx/2.3,-.4/.12,dz/1.3,.07/2.3,.8/.12,.07/1.3,materials.edge,false);}
  }
  const propKinds=['chair','monitor','printer','bookshelf','locker','vending','barrel','hydrant','bench','planter','server','toolbox','extinguisher','aircon'];
  for(let i=0;i<12;i++)addProp(propKinds[(i+f*5)%propKinds.length],-10+(i%6)*3.2,y,i<6?-7.35:5.25,f);
  // External switchbacks: two physical flights and landings connect every floor.
  box(scene,16,y-.08,8.05,11,.16,2.1,landingMat,false);surface(10.5,21.5,7,9.1,y);
  stairPath[f*5]=new THREE.Vector3(17.2,y,8.05);
  {
   flight(15,y,7,-5,H/2);flight(19.2,y+H/2,-5,7,H/2);
   box(scene,17.1,y+H/2-.08,-5.8,7,.16,1.7,landingMat,false);surface(13.6,20.6,-6.65,-4.95,y+H/2);
   stairPath[f*5+1]=new THREE.Vector3(15,y,6.8);stairPath[f*5+2]=new THREE.Vector3(15,y+H/2,-5.5);stairPath[f*5+3]=new THREE.Vector3(19.2,y+H/2,-5.5);stairPath[f*5+4]=new THREE.Vector3(19.2,y+H,7.7);
   for(const x of [13.4,21])box(scene,x,y+1.2,-6.5,.08,2.4,.08,railMat,false);
   box(scene,17.1,y+H/2+.85,-6.6,7,.07,.07,railMat,false);
  }
  for(let x of [10.5,21.5])box(scene,x,y+.8,8.95,.07,1.6,.07,railMat,false);
  if(f>0)box(scene,16,y+.8,9.1,11,.07,.07,railMat,false).userData.collider=true;
  if(f%3===0)box(scene,0,y+3.35,9.22,24,.06,.08,railMat,false);
  // Optional close-up fixtures are batched separately for the Triple-A detail setting.
  const detail=(x,yy,z,sx,sy,sz,mat)=>{const mesh=box(scene,x,yy,z,sx,sy,sz,mat,false);mesh.userData.highDetail=true;return mesh;};
  for(const o of breakables.filter(o=>o.floor===f&&o.kind==='desk')){const start=scene.children.length,x=o.pos.x,z=o.pos.z;detail(x,y+1.12,z,1,.55,.09,materials.metal);detail(x,y+1.13,z+.051,.88,.42,.015,materials.darkGlass);detail(x,y+.91,z,.13,.18,.12,materials.metal);detail(x,y+.91,z+.38,.6,.04,.23,materials.edge);detail(x,y+.46,z+1.1,.65,.12,.65,materials.metal);detail(x,y+.83,z+1.4,.65,.7,.1,materials.metal);for(let i=start;i<scene.children.length;i++)scene.children[i].userData.detailOwner=o;}
  for(const x of [-10.8,10.8]){detail(x,y+3.02,0,.22,.22,16,materials.metal);for(const z of [-6,0,6])detail(x,y+3.02,z,.34,.34,.1,materials.rust);}
  for(let x=-10.5;x<12;x+=3)for(const z of [-9.08,9.08]){detail(x,y+1.7,z,.055,2.9,.12,railMat);detail(x,y+1.65,z,2.8,.055,.12,railMat);}
  if(f%2===0){const wall=addBreak('wall',-4,y+1.35,-1,8,2.7,.18,materials.brick,f);wall.hp=wall.maxHp=190;box(scene,-.05,y+1.35,0,.18,2.7,4,materials.edge,false).userData.collider=true;}
  for(const x of [-6,6])box(scene,x,y+3.12,0,1.3,.05,.18,new THREE.MeshStandardMaterial({color:0xaaa792,emissive:0xffe4b1,emissiveIntensity:.3}),false);
  textSign(scene,'F'+String(f+1).padStart(2,'0')+'  /  STAIRS',12.13,y+2.2,7.5,2,.5,'#273249','#53e8fa').rotation.y=Math.PI/2;
  for(let i=firstMesh;i<scene.children.length;i++)scene.children[i].userData.level=f;
 }
 generatingFloor=null;for(let f=0;f<8;f++)generateFloor(f);
 textSign(scene,'AVALON / SITE CLOSED',0,5,9.14,12,1.9).userData.level=0;textSign(scene,'PRIVATE PROPERTY / NO TRESPASSING',0,2.6,9.15,9,.65,'#b7b689','#293c31').userData.level=0;
 box(scene,-48,2.8,52,24,5.6,13,materials.white,false);box(scene,-48,5.8,52,25,.4,14,materials.edge,false);textSign(scene,'NORTHSIDE SCHOOL',-48,4,58.6,15,1.3,'#334c60','#ffffff');
 textSign(scene,'AVALON RESIDENCES',26,1.8,42,8,.7,'#edece7','#364241');
 // Temporary boundary, discarded materials and an entrance into the site.
 for(let x=-30;x<=30;x+=3){if(Math.abs(x)<5)continue;box(scene,x,1,25,.1,2,.1,materials.rust);box(scene,x,1,25,2.9,.035,.05,materials.metal);box(scene,x,1.8,25,2.9,.035,.05,materials.metal);}
 for(let i=0;i<14;i++){const x=(i%7)*3.4-20,z=i<7?13.5:-15;addBreak(i%3?'crate':'cabinet',x,.65,z,1.2,1.3,1.2,i%3?materials.wood:materials.metal);}
 const stoneGeo=new THREE.DodecahedronGeometry(.18,0),stickGeo=new THREE.CylinderGeometry(.04,.065,1.3,5),heavyGeo=new THREE.CylinderGeometry(.1,.16,1.5,6);
 function pickup(kind,x,y,z){const mesh=new THREE.Mesh(kind==='rock'?stoneGeo:kind==='thin'?stickGeo:heavyGeo,kind==='rock'?materials.stone:materials.wood);mesh.position.set(x,y+.12,z);mesh.rotation.set(kind==='rock'?Math.random()*2:Math.PI/2,Math.random()*6,Math.random());mesh.castShadow=true;scene.add(mesh);const o={kind,mesh,pos:mesh.position,active:true};pickups.push(o);return o;}
 for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=15+Math.random()*15;pickup('rock',Math.cos(a)*r,0,Math.sin(a)*r);}
 for(let i=0;i<15;i++)pickup(i%2?'thin':'heavy',-20+Math.random()*40,0,11+Math.random()*11);
 pickup('rock',-6.9,0,20);pickup('rock',-5.8,0,19.8);pickup('thin',-7.8,0,19);pickup('heavy',-4.5,0,20);
 for(let f=0;f<8;f++)for(let i=0;i<3;i++)pickup(i===0?'rock':i===1?'thin':'heavy',-3+i*3,f*H,3.8);
 // Quiet streets behind Avalon give the tower scale without getting in the way.
 for(let i=0;i<21;i++){
  let x=i<10?-65+(i%5)*25:-68+(i%6)*26,z=i<10?-65-Math.floor(i/5)*24:64+Math.floor((i-10)/6)*30;
  if(z>40&&Math.abs(x)<24)continue;
  const height=5.8,mat=new THREE.MeshStandardMaterial({color:i%3?0xf1f0eb:0xe5e6e1,roughness:.85});box(scene,x,height/2,z,17,height,13,mat,false);box(scene,x,height+.15,z,17.5,.3,13.5,materials.edge,false);
  box(scene,x+5,1.3,z+6.55,5,2.6,.08,materials.edge,false);box(scene,x-2,1.25,z+6.6,1.1,2.5,.1,materials.wood,false);
  for(const dx of [-5,3])box(scene,x+dx,4.1,z+6.55,4,1.7,.08,materials.darkGlass,false);
  box(scene,x,-.03,z+11,19,.15,8,materials.concrete,false);box(scene,x+5,.04,z+10,5,.12,6,materials.asphalt,false);
  box(scene,x-6,.4,z+10,4,.8,1,materials.green,false);
 }
 // Angular trees and sodium lamps frame the approach.
 for(let i=0;i<18;i++){
  const x=i%2?-34:34,z=-25+Math.floor(i/2)*10;box(scene,x,2.4,z,.38,4.8,.38,materials.wood);
  const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(3.5,1),materials.green);tree.position.set(x,6,z);tree.scale.y=1.2;tree.castShadow=true;scene.add(tree);
 }
 for(let x of [-28,28]){box(scene,x,5,23,.13,10,.13,materials.metal);box(scene,x-1.2,9.8,23,2.5,.13,.13,materials.metal);box(scene,x-2.4,9.6,23,.6,.15,.9,materials.white);}
 function batchNew(){
 for(const m of scene.children)if(m.userData.collider&&!m.userData.registered){m.userData.registered=true;m.updateMatrixWorld(true);solids.push({floor:m.userData.level,pos:m.position.clone(),quaternion:m.quaternion.clone(),size:m.scale.clone(),bounds:new THREE.Box3().setFromObject(m)});}
 // Batch structural pieces by level and material; breakable meshes stay individually addressable.
 for(const f of [undefined,...resident]){const groups=new Map();for(const m of [...scene.children])if(m.userData.level===f&&m.geometry===boxGeometry&&!m.isInstancedMesh&&!m.userData.object){const key=m.material.uuid+':'+!!m.userData.highDetail,group=groups.get(key)||{mat:m.material,list:[]};group.list.push(m);groups.set(key,group);}for(const {mat,list} of groups.values()){const batch=new THREE.InstancedMesh(boxGeometry,mat,list.length);batch.userData.highDetail=!!list[0].userData.highDetail;list.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);if(m.userData.detailOwner){const owner=m.userData.detailOwner;owner.detailVisuals??=[];owner.detailVisuals.push({batch,index:i,matrix:m.matrix.clone()});}scene.remove(m);});batch.userData.level=f;batch.receiveShadow=true;scene.add(batch);}}
 // Draw destructibles in batches while retaining individual collision / aiming proxies.
 scene.updateMatrixWorld(true);
 const visualGroups=new Map();
 for(const o of breakables){if(o.visuals)continue;o.visuals=[];o.mesh.traverse(m=>{if(!m.geometry)return;const key=o.floor+':'+m.material.uuid;const group=visualGroups.get(key)||{floor:o.floor,material:m.material,parts:[]};group.parts.push({object:o,matrix:m.matrixWorld.clone()});visualGroups.set(key,group);});scene.remove(o.mesh);o.mesh.updateMatrixWorld(true);}
 for(const g of visualGroups.values()){const batch=new THREE.InstancedMesh(boxGeometry,g.material,g.parts.length);batch.userData.level=g.floor;batch.castShadow=g.floor<5;batch.receiveShadow=true;g.parts.forEach((part,index)=>{batch.setMatrixAt(index,part.matrix);part.object.visuals.push({batch,index,matrix:part.matrix});});scene.add(batch);}

 }
 batchNew();
 const fallingFloors=new Set();
 const hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);
 function setBreakVisible(o,visible){for(const v of [...o.visuals,...(o.detailVisuals||[])]){v.batch.setMatrixAt(v.index,visible?v.matrix:hiddenMatrix);v.batch.instanceMatrix.needsUpdate=true;v.batch.setColorAt(v.index,new THREE.Color(0xffffff));v.batch.instanceColor.needsUpdate=true;}}
 function setDamageTint(o,amount){const c=new THREE.Color(0xffffff).lerp(new THREE.Color(0xbf9d7b),Math.min(.55,amount));for(const v of [...o.visuals,...(o.detailVisuals||[])]){v.batch.setColorAt(v.index,c);v.batch.instanceColor.needsUpdate=true;}}
 function unloadFloor(f){
 const objects=breakables.filter(o=>o.floor===f);const damage=objects.map((o,i)=>({i,hp:o.hp,alive:o.alive})).filter((s,i)=>s.hp!==objects[i].maxHp||!s.alive);if(damage.length)savedFloors.set(f,damage);
 for(const m of [...scene.children])if(m.userData.level===f){scene.remove(m);if(m.isInstancedMesh)m.dispose();else if(m.geometry!==boxGeometry){m.geometry?.dispose();if(m.material?.map)m.material.map.dispose();m.material?.dispose();}}
 for(let i=breakables.length-1;i>=0;i--)if(breakables[i].floor===f)breakables.splice(i,1);for(let i=surfaces.length-1;i>=0;i--)if(surfaces[i].floor===f)surfaces.splice(i,1);for(let i=solids.length-1;i>=0;i--)if(solids[i].floor===f)solids.splice(i,1);
 delete platforms[f];for(let i=0;i<5;i++)delete stairPath[f*5+i];resident.delete(f);
 }
 function ensureFloors(center,occupied=[]){const needed=new Set([0]);for(let f=Math.max(0,center-4);f<=center+5;f++)needed.add(f);for(const value of occupied)for(let f=Math.max(0,value-1);f<=value+1;f++)needed.add(f);let changed=false;
 for(const f of [...resident])if(!needed.has(f)){unloadFloor(f);changed=true;}
 for(const f of needed)if(!resident.has(f)){generateFloor(f);changed=true;}
 if(changed){batchNew();for(const [f,states] of savedFloors)if(resident.has(f)){const objects=breakables.filter(o=>o.floor===f);for(const s of states){const o=objects[s.i];if(o){o.hp=s.hp;o.alive=s.alive;setBreakVisible(o,o.alive);}}savedFloors.delete(f);}revision++;}return changed;
 }
 function resetTower(){for(const f of [...resident])if(f>0)unloadFloor(f);savedFloors.clear();for(let f=1;f<8;f++)generateFloor(f);batchNew();revision++;}
 return {scene,sun,fallingFloors,breakables,pickups,platforms,solids,surfaces,stairPath,addBreak,pickup,setBreakVisible,setDamageTint,ensureFloors,resetTower,resident,get revision(){return revision;}};
}
export function createPerson(color=0x819565,cop=false){return createHuman(color,cop);}
export function makeVehicle(scene,truck=false){
 const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:truck?0x33473e:0xc2ccbd,metalness:.35,roughness:.5}),navy=new THREE.MeshStandardMaterial({color:0x213841,roughness:.5});
 const len=truck?7:4.8,width=truck?3:2.3;
 box(g,0,1,0,width,truck?1.5:.9,len,white);box(g,0,truck?2.2:1.85,truck?1.4:-.2,width*.86,truck?1.6:1,truck?2:2.5,navy);
 box(g,0,truck?2.3:1.9,len*.24,width*.8,.7,.05,materials.darkGlass);box(g,0,.75,len/2+.1,width+.15,.3,.3,materials.metal);
 for(let side of [-1,1])for(let end of [-1,1]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(truck?.65:.43,truck?.65:.43,.3,12),materials.edge);wheel.rotation.z=Math.PI/2;wheel.position.set(side*(width/2+.05),.58,end*len*.31);g.add(wheel);}
 const red=new THREE.MeshStandardMaterial({color:0xf04a30,emissive:0xf03720,emissiveIntensity:2}),blue=new THREE.MeshStandardMaterial({color:0x579cb7,emissive:0x287bff,emissiveIntensity:2});
 const lights=[box(g,-.38,truck?3.15:2.45,0,.55,.16,.3,red),box(g,.38,truck?3.15:2.45,0,.55,.16,.3,blue)];
 scene.add(g);return {mesh:g,truck,lights,velocity:new THREE.Vector3(),hp:truck?4000:240,ramTime:truck?1e6:9,age:0,dead:false,air:false,radius:truck?2:1.5};
}
export function makeHelicopter(scene){const g=new THREE.Group(),rotor=new THREE.Group();box(g,0,0,0,2.7,2.1,4.4,materials.metal);const glass=new THREE.Mesh(new THREE.SphereGeometry(1.6,10,8),materials.darkGlass);glass.scale.set(.8,.65,1);glass.position.z=1.4;g.add(glass);box(g,0,.3,-4,.35,.5,5,materials.metal);box(g,0,1,-6,.15,2,1,materials.metal);box(g,-1.7,-1.4,0,.1,.1,5,materials.edge);box(g,1.7,-1.4,0,.1,.1,5,materials.edge);box(rotor,0,0,0,11,.08,.2,materials.edge);box(rotor,0,0,0,.2,.08,11,materials.edge);rotor.position.y=1.5;g.add(rotor);box(g,-1.2,-.8,1.7,.2,.2,2,materials.edge);scene.add(g);return {mesh:g,rotor,angle:0,cooldown:3,hp:400,maxHp:400,dead:false};}
