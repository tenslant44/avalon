import * as THREE from 'three';
export function createBodyCarry({player,getActors,getForward,physics,hurt,toast}){
 let carried=null;const thrown=[];
 function near(){return getActors().filter(a=>!a.alive&&!a.splatted&&a.rag&&a.mesh.userData.ragdolled&&a.mesh.visible&&a.rag.pelvisPosition.distanceTo(player.pos.clone().add(new THREE.Vector3(0,.8,0)))<2.6).sort((a,b)=>a.rag.pelvisPosition.distanceToSquared(player.pos)-b.rag.pelvisPosition.distanceToSquared(player.pos))[0];}
 function release(throwing=false){if(!carried)return;const a=carried;carried=null;const velocity=throwing?getForward().multiplyScalar(18).add(new THREE.Vector3(0,5,0)):player.vel.clone();physics.releaseRagdoll(a.rag,velocity);if(throwing)thrown.push({actor:a,life:2,previous:a.rag.pelvisPosition.clone(),hits:new Set()});toast(throwing?'BODY THROWN':'BODY DROPPED',1);}
 function interact(){if(carried){release();return true;}const a=near();if(!a)return false;if(!physics.holdRagdoll(a.rag,player.pos.clone().add(getForward()).add(new THREE.Vector3(0,1.4,0))))return false;carried=a;toast('CARRYING BODY / E DROP / ATTACK THROW',2);return true;}
 function update(dt){if(carried){if(!player.alive||player.stumble>0||!physics.holdRagdoll(carried.rag,player.pos.clone().addScaledVector(getForward(),1.1).add(new THREE.Vector3(0,1.4,0))))release();}
  for(let i=thrown.length-1;i>=0;i--){const t=thrown[i];t.life-=dt;const a=t.actor;if(t.life<=0||!a.mesh.userData.ragdolled){thrown.splice(i,1);continue;}const pos=a.rag.pelvisPosition,segment=new THREE.Line3(t.previous,pos);for(const victim of getActors())if(victim.alive&&!t.hits.has(victim)){const center=victim.pos.clone().add(new THREE.Vector3(0,.9,0));if(segment.closestPointToPoint(center,true,new THREE.Vector3()).distanceTo(center)<.8){t.hits.add(victim);hurt(victim,55,'a thrown body',getForward().multiplyScalar(6),'player');}}t.previous.copy(pos);}
 }
 function clear(){if(carried)physics.releaseRagdoll(carried.rag);carried=null;thrown.length=0;}
 return {interact,update,release,clear,near,get carried(){return carried;}};
}
