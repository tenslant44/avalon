import * as THREE from 'three';
import {box,materials} from './world.js';
export function rifleModel(){const g=new THREE.Group();box(g,0,0,.2,.13,.17,.65,materials.edge);box(g,0,.02,.67,.055,.055,.4,materials.metal);box(g,0,-.16,.16,.1,.23,.13,materials.metal);box(g,0,0,-.24,.12,.18,.28,materials.edge);return g;}
export function createLoot({scene,support,getRun,toast,equip}){
 const drops=[];
 function spawn(actor,credited){const kind=actor.unit==='swat'&&credited?'gun':'ammo',mesh=kind==='gun'?rifleModel():new THREE.Group();if(kind==='ammo'){box(mesh,0,0,0,.35,.2,.25,materials.green);box(mesh,0,.11,0,.26,.035,.2,materials.metal);}mesh.position.copy(actor.pos).y+=.2;mesh.rotation.y=Math.random()*Math.PI*2;scene.add(mesh);drops.push({kind,mesh,velocity:0});if(kind==='gun')actor.mesh.userData.held.clear();}
 function near(player){return drops.filter(d=>d.mesh.position.distanceTo(player.pos.clone().add(new THREE.Vector3(0,.2,0)))<2.3).sort((a,b)=>a.mesh.position.distanceToSquared(player.pos)-b.mesh.position.distanceToSquared(player.pos))[0];}
 function collect(player){const d=near(player);if(!d)return false;const run=getRun();run.gunAmmo+=d.kind==='gun'?30:12;if(d.kind==='gun'){run.gun=true;equip('gun');}toast(d.kind==='gun'?'SWAT RIFLE STOLEN / 4 EQUIP / +30 ROUNDS':'+12 RIFLE ROUNDS',2);scene.remove(d.mesh);drops.splice(drops.indexOf(d),1);return true;}
 function update(dt){for(const d of drops){const before=d.mesh.position.y;d.velocity-=24*dt;d.mesh.position.y+=d.velocity*dt;const y=support(d.mesh.position.x,d.mesh.position.z,before)+.2;if(d.mesh.position.y<=y){d.mesh.position.y=y;d.velocity=0;}}}
 function clear(){for(const d of drops)scene.remove(d.mesh);drops.length=0;}
 return {spawn,near,collect,update,clear,get drops(){return drops;}};
}
