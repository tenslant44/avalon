import * as THREE from 'three';
import {makeHelicopter,H,materials,box} from './world.js';
export function createAirlifts({scene,player,getRun,getFloor,drop,dispose,crash,toast}){
 const flights=[];let cooldown=0;
 function launch(){const run=getRun();if(flights.length>=(run.gameMode==='insane'||run.siege?4:2)||run.gameMode==='single'&&run.spawnedTypes.has('transport'))return;run.spawnedTypes.add('transport');const floor=getFloor(),h=makeHelicopter(scene);h.mesh.position.set(100,floor*H+8,55);box(h.mesh,0,-.8,-.5,2.8,.3,2,materials.green);flights.push({...h,floor,target:new THREE.Vector3(18,floor*H+5,8.05),state:'approach',timer:0,dropped:0});toast('AIRLIFT INBOUND / FLOOR '+(floor+1),2);}
 function update(dt){const run=getRun();if(run.threat>=4){cooldown-=dt;if(cooldown<=0){launch();cooldown=run.gameMode==='insane'?9:20;}}
  for(let i=flights.length-1;i>=0;i--){const h=flights[i];if(h.dead){if(crash(h,dt)){dispose(h.mesh);flights.splice(i,1);}continue;}h.rotor.rotation.y+=dt*65;h.timer-=dt;
   if(h.state==='deploy'){if(h.timer<=0){drop(h.target.clone().add(new THREE.Vector3(0,-2,0)),h.dropped%2?'military':'swat',h.floor);h.dropped++;h.timer=.55;if(h.dropped===4){h.state='depart';h.target.add(new THREE.Vector3(110,25,-70));}}}
   else {const delta=h.target.clone().sub(h.mesh.position),distance=delta.length();h.mesh.lookAt(h.target);h.mesh.position.addScaledVector(delta.normalize(),Math.min(distance,dt*65));if(distance<1){if(h.state==='approach'){h.state='deploy';h.timer=.4;h.mesh.rotation.set(0,-Math.PI/2,0);}else{dispose(h.mesh);flights.splice(i,1);}}}
  }
 }
 function clear(){for(const h of flights)dispose(h.mesh);flights.length=0;cooldown=0;}
 return {launch,update,clear,get flights(){return flights;},get count(){return flights.length;}};
}
