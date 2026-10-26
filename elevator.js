import * as THREE from 'three';
import {box,textSign,materials,H} from './world.js';
export function createElevator({scene,player,getActive,getFloor,toast,resetKeys,onDamage=()=>{}}){
 const car=new THREE.Group();car.position.set(9,0,6);scene.add(car);
 box(car,0,-.12,0,2.7,.24,2.7,materials.metal);
 box(car,1.3,1.35,0,.1,2.7,2.7,materials.metal);
 box(car,-1.3,1.35,0,.1,2.7,2.7,materials.glass);
 box(car,0,1.35,-1.3,2.7,2.7,.1,materials.metal);
 box(car,0,2.75,0,2.7,.15,2.7,materials.metal);
 box(car,0,2.64,0,1.5,.035,.5,new THREE.MeshStandardMaterial({color:0xb4ffff,emissive:0x19eaff,emissiveIntensity:2}));
 textSign(car,'LIFT',0,2.25,-1.23,1.5,.35,'#063c54','#5effee');
 const hitbox=new THREE.Mesh(new THREE.BoxGeometry(2.7,2.9,2.7),new THREE.MeshBasicMaterial({visible:false}));hitbox.position.y=1.3;car.add(hitbox);
 const object={kind:'elevator',mesh:hitbox,pos:new THREE.Vector3(9,1.3,6),size:new THREE.Vector3(2.7,2.9,2.7),bounds:new THREE.Box3(),alive:true,hp:900,maxHp:900,score:6500,cost:35000,solid:false};hitbox.userData.object=object;
 let wreckVelocity=0;
 function syncHitbox(){object.pos.copy(car.position).y+=1.3;object.bounds.setFromCenterAndSize(object.pos,object.size);car.updateMatrixWorld(true);}
 syncHitbox();
 function damage(amount,source='player'){if(!enabled||!object.alive||!getActive()||!Number.isFinite(amount)||amount<=0)return false;object.hp=Math.max(0,object.hp-amount);if(object.hp===0){object.alive=false;enabled=false;const passenger=riding;riding=calling=false;close();status.classList.add('hidden');if(passenger){player.vel.y=-2;player.grounded=false;player.invincible=0;player.fallTop=player.pos.y;}toast('ELEVATOR DESTROYED / USE THE STAIRS',4);}else toast('ELEVATOR DAMAGED / '+Math.ceil(object.hp)+' HP',1);onDamage(object.pos.clone(),!object.alive,source);return true;}
 let target=0,riding=false,calling=false,open=false,enabled=true;
 const panel=document.getElementById('elevatorPanel'),input=document.getElementById('elevatorFloor'),status=document.getElementById('elevatorStatus');
 const near=()=>enabled&&Math.hypot(player.pos.x-9,player.pos.z-6)<3&&player.alive&&player.stumble<=0;
 function close(){open=false;panel.classList.add('hidden');resetKeys();}
 function interact(){if(!getActive()||!near())return false;if(riding||calling){toast('ELEVATOR / '+(calling?'car approaching':'travelling to floor '+(Math.round(target/H)+1)));return true;}open=true;resetKeys();document.exitPointerLock?.();input.value=getFloor()+1;panel.classList.remove('hidden');input.focus();return true;}
 document.getElementById('elevatorCancel').onclick=close;
 panel.addEventListener('submit',e=>{e.preventDefault();const floor=Number(input.value);if(!Number.isSafeInteger(floor)||!Number.isSafeInteger(floor+16)||floor<1||!Number.isFinite((floor-1)*H)){input.setCustomValidity('Enter a whole floor number of 1 or higher.');input.reportValidity();return;}input.setCustomValidity('');const destination=(floor-1)*H;close();if(Math.abs(car.position.y-player.pos.y)>.4){target=getFloor()*H;calling=true;car.userData.destination=destination;toast('ELEVATOR CALLED / wait by the doors',3);}else board(destination);});
 input.oninput=()=>input.setCustomValidity('');
 function board(destination){target=destination;riding=true;player.vel.set(0,0,0);player.grounded=false;player.pos.set(9,car.position.y,6);toast('ELEVATOR / floor '+(Math.round(target/H)+1),3);}
 function update(dt){if(!object.alive){wreckVelocity+=24*dt;car.position.y=Math.max(0,car.position.y-wreckVelocity*dt);car.rotation.z=THREE.MathUtils.damp(car.rotation.z,.16,3,dt);syncHitbox();return;}if(!enabled)return;const moving=riding||calling;if(moving){const delta=target-car.position.y;car.position.y+=Math.sign(delta)*Math.min(Math.abs(delta),dt*1.25);if(riding){player.pos.set(9,car.position.y+.02,6);player.vel.set(0,0,0);player.mesh.position.copy(player.pos);player.fallTop=car.position.y;player.invincible=Math.max(player.invincible,.1);}if(Math.abs(car.position.y-target)<.001){if(calling){calling=false;if(near()&&Math.abs(player.pos.y-car.position.y)<.5)board(car.userData.destination);else toast('ELEVATOR ARRIVED / press E to select a floor',3);}else{riding=false;player.pos.set(9,target,7.85);player.mesh.position.copy(player.pos);player.grounded=true;toast('FLOOR '+(Math.round(target/H)+1)+' / doors open',2);}}}status.textContent=(calling?'CALLING / ':riding?'RIDING / ':'')+'F'+(Math.floor(car.position.y/H)+1);status.classList.toggle('hidden',!moving);syncHitbox();}
 function disable(){object.alive=false;object.hp=0;enabled=false;riding=calling=false;close();car.visible=false;status.classList.add('hidden');}
 function reset(){close();enabled=true;car.visible=true;car.position.y=0;car.rotation.set(0,0,0);wreckVelocity=0;object.alive=true;object.hp=object.maxHp;syncHitbox();target=0;riding=calling=false;status.classList.add('hidden');}
 return {object,damage,interact,update,reset,disable,get destroyed(){return !object.alive;},get near(){return near();},get riding(){return riding;},get open(){return open;},get floor(){return Math.floor(car.position.y/H);}};
}
