import * as THREE from 'three';
import {makeVehicle,createPerson,box,textSign,materials} from './world.js';
import {animateHuman,restorePose} from './characters.js';
import {caseText} from './crimes.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export function createCinematics({scene,camera,player,rivals,audio,onIntroEnd,onOutroEnd}){
 const $=id=>document.getElementById(id);let active=null,time=0,lastLine=-1,cast=[],poses=[],props=[],officers=[],car=null,phone=null,stage='',outcome={};
 const intro=[
 [0,'WEDNESDAY / NORTHSIDE SCHOOL / 12:30','MALIK','Half a day. And somehow we still stood by the gate for ten minutes.'],
 [5,'THE WALK HOME','CISCO','Because nobody can decide where we are going. I am not walking to the shops again.'],
 [10,'AVALON RESIDENCES','JAY','Every house looks exactly the same. White wall, black window, tiny lawn.'],
 [15,'BEHIND THE HOUSES','MALIK','What about that abandoned building? The tall one behind Avalon. We could look around.'],
 [21,'THE BROKEN FENCE','CISCO','That sign says private property. Going through there is already trespassing.'],
 [27,'ONE BAD IDEA','JAY','I know. I am just looking. ...Reckon a rock would reach that window?'],
 [33,'THE FIRST STONE','CISCO','Do not. Seriously. Someone still owns this place.'],
 [38,'THE WINDOW','JAY','One throw. Then we go.'],
 [43,'BASED OFF OF A TRUE STORY','CISCO','That was loud. You said one. ...Guys?']];
 const normal=[
 [0,'THURSDAY / NORTHSIDE SCHOOL / 11:48','CISCO','I barely slept. Every car outside sounded like it was stopping at our house.'],
 [6,'THE NEXT DAY','JAY','Keep your voice down. Nobody has said anything. Maybe they do not know it was us.'],
 [12,'INCOMING CALL / MOM','MOM','Cisco? I have called the office to dismiss you. Bring your bag. I am outside.'],
 [19,'THE CLASSROOM','CISCO','Right now? Okay. I just need to put my stuff away.'],
 [25,'STILL NOT LEAVING','MALIK','Your mom is literally outside. What are you looking for?'],
 [31,'ONE MORE MINUTE','CISCO','My charger. And I need to tell the office I am going. ...Did you hear anything about yesterday?'],
 [38,'THE CORRIDOR','JAY','No. Just go, Cisco. We will talk later.'],
 [44,'THE EXIT','MOM','Cisco, come on. I have been waiting.'],
 [49,'RIGHT AT THE DOOR','POLICE','Cisco? Stay there a moment. We need to speak about the building behind Avalon.'],
 [56,'THE SCHOOL GATE','CISCO','Mom? I was just leaving.'],
 [62,'NO WAY AROUND IT','POLICE','You are coming to the station with us. Your mother can come with you.'],
 [69,'AVALON POLICE STATION / 12:24','MOM','Look at me, Cisco. Tell me what happened. Start at the beginning.'],
 [76,'THE INTERVIEW ROOM','CISCO','We were walking home from the half day. We went through the fence. Then someone picked up a rock.'],
 [84,'THURSDAY / THE CONSEQUENCES','MOM','You had so many chances to walk away.']];
 const early=[
 [0,'WEDNESDAY / CAUGHT AT THE SITE','POLICE','Hands where I can see them. Do not run.'],
 [6,'THE BROKEN FENCE','CISCO','Okay. Okay, I am stopping. Can I call my mom?'],
 [13,'ARREST AT THE SITE','POLICE','We will contact her from the station. You are under arrest.'],
 [20,'AVALON POLICE STATION / WEDNESDAY','CISCO','We were only supposed to look. I thought we would be gone before anyone came.'],
 [28,'THE INTERVIEW ROOM','MOM','Cisco. The fence. The windows. What were you thinking?'],
 [36,'THURSDAY / THE NEXT DAY','CISCO','There is no version of yesterday where I can say it was worth it.']];
 const death=[
 [0,'WEDNESDAY / THE ABANDONED BUILDING','MALIK','Cisco? ...Cisco, can you hear me?'],
 [5,'EVERYTHING STOPS','JAY','Do not move him. Somebody call an ambulance. Now.'],
 [11,'EMERGENCY RESPONSE','PARAMEDIC','Give us some room. Everyone back, please.'],
 [18,'TOO LATE','PARAMEDIC','I am sorry. He did not survive.'],
 [25,'THURSDAY / AN EMPTY DESK','MOM','He was supposed to come home.']];
 function deathStep(dt){const lead=player.mesh.position;if(time>=11&&!props.length){const medic=createPerson(0xe29a4c);medic.position.copy(lead).add(V(.4,0,1));medic.rotation.y=Math.PI;medic.userData.bones.hips.position.y=.5;medic.userData.knees.forEach(k=>k.rotation.x=1.5);medic.userData.bones.chest.rotation.x=.55;scene.add(medic);props.push(medic);}for(const a of cast){if(a===player)continue;animateHuman(a.mesh,0,time,dt||.016);a.mesh.userData.head.rotation.x=.35;a.mesh.userData.arms.forEach(b=>b.rotation.x=-.15);}const target=lead.clone().add(V(-.7,.3,0));camera.position.copy(lead).add(time<11?V(-2.8,1.5,4):time<25?V(2.5,3,4.5):V(0,9,6));camera.lookAt(target);camera.updateMatrixWorld(true);if(time>=33)finish();}
 function cleanup(){const geos=new Set(),mats=new Set(),shared=new Set(Object.values(materials));for(const p of props){scene.remove(p);p.traverse(m=>{if(m.geometry&&m.geometry!==p.userData.sharedGeometry&&m.geometry.type!=='BoxGeometry')geos.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:m.material?[m.material]:[])if(!shared.has(mat))mats.add(mat);if(m.isSkinnedMesh)m.skeleton.dispose();});}geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});props=[];officers=[];car=null;phone?.removeFromParent();phone=null;for(const x of poses){x.a.mesh.position.copy(x.position);x.a.mesh.quaternion.copy(x.quaternion);x.a.mesh.scale.copy(x.scale);restorePose(x.a.mesh);x.a.mesh.visible=x.visible&&!x.a.splatted;}poses=[];active=null;stage='';$('cinemaCharges').classList.add('hidden');$('cinematic').classList.add('hidden');}
 function room(station=false){if(stage===(station?'station':'school'))return;stage=station?'station':'school';const g=new THREE.Group();g.position.set(70,0,-65);box(g,0,-.12,0,18,.2,17,materials.concrete);box(g,0,2.5,-5,18,5,.3,materials.white);box(g,-7,2.5,0,.3,5,10,materials.white);box(g,0,2.5,5,18,5,.3,materials.white);box(g,6,2.5,-4.8,1,5,.15,materials.wood);box(g,0,.85,0,station?3.4:2,.16,1.5,materials.wood);for(const x of [-1.1,1.1]){box(g,x,.4,1.6,.8,.12,.8,materials.edge);box(g,x,.85,1.95,.8,.9,.12,materials.edge);}textSign(g,station?'AVALON POLICE / INTERVIEW 02':'NORTHSIDE / THURSDAY',0,3.1,-4.8,7,.7,'#33444a','#e9ece5');scene.add(g);props.push(g);cast.forEach((a,i)=>{a.mesh.position.set(69+i%3*1.25,0,-63-Math.floor(i/3)*1.8);a.mesh.rotation.y=Math.PI;});if(station){for(let i=1;i<cast.length;i++)cast[i].mesh.visible=i===1;const officer=createPerson(0x315390,true);officer.position.set(70,0,-67);scene.add(officer);props.push(officer);officers.push(officer);const mom=createPerson(0xa77b96);mom.scale.set(1.08,1.08,1.08);mom.position.set(71.6,0,-64);mom.rotation.y=-1.4;scene.add(mom);props.push(mom);officers.push(mom);}}
 function exterior(){stage='exit';cast.forEach((a,i)=>{a.mesh.position.set(-46+i%4*1.2,0,60+Math.floor(i/4)*1.6);a.mesh.rotation.y=0;});const mom=createPerson(0xa77b96);mom.scale.set(1.08,1.08,1.08);mom.position.set(-46,0,66);mom.rotation.y=Math.PI;scene.add(mom);props.push(mom);officers.push(mom);}
 function arrive(){if(car)return;car=makeVehicle(scene);car.mesh.position.set(-43,0,69);car.mesh.rotation.y=-Math.PI/2;props.push(car.mesh);for(let i=0;i<2;i++){const p=createPerson(0x315390,true);p.position.set(-44+i*1.4,0,65);p.rotation.y=Math.PI;scene.add(p);props.push(p);officers.push(p);}audio.cue('siren');}
 function begin(kind,data={}){cleanup();active=kind;outcome=data;$('cinemaCharges').textContent=data.charges?caseText(data.charges,kind==='death'):'';time=0;lastLine=-1;cast=[player,...rivals];poses=cast.map(a=>({a,position:a.mesh.position.clone(),quaternion:a.mesh.quaternion.clone(),scale:a.mesh.scale.clone(),visible:a.mesh.visible}));if(kind==='death'){cast=cast.filter(a=>a===player||a.alive);for(const a of [player,...rivals]){a.mesh.visible=cast.includes(a)&&!a.splatted;if(a.mesh.visible)restorePose(a.mesh);}player.mesh.position.copy(data.position||player.pos);player.mesh.position.y+=.15;player.mesh.rotation.set(0,0,Math.PI/2);cast.filter(a=>a!==player).forEach((a,i)=>{a.mesh.position.copy(player.mesh.position).add(V(-2+(i%3)*1.4,-.15,2+Math.floor(i/3)));a.mesh.rotation.y=Math.PI;});stage='death';$('cinematic').classList.remove('hidden');step(0);return;}for(const a of cast){if(a.splatted){a.mesh.visible=false;continue;}restorePose(a.mesh);a.mesh.visible=true;}rivals[0].mesh.scale.set(1.35,1,1.25);if(kind==='intro'){cast.forEach((a,i)=>{a.mesh.position.set(-40+i%4*1.2,0,58+Math.floor(i/4)*1.5);a.mesh.rotation.y=1.9;});}else if(data.early||data.arrested){cast.forEach((a,i)=>{a.mesh.position.set(2+i%4*1.2,0,20+Math.floor(i/4)*1.5);a.mesh.rotation.y=0;});}else room();$('cinematic').classList.remove('hidden');step(0);}
 function finish(){if(!active)return;const kind=active;cleanup();if(kind==='death')player.mesh.visible=false;if(kind==='intro')onIntroEnd();else onOutroEnd();}
 function step(dt){if(!active)return;time+=dt;let lines=active==='death'?death:active==='intro'?intro:(outcome.early||outcome.arrested)?early:normal;const chargeStart=outcome.early||outcome.arrested?46:91;if(active==='outro'&&outcome.charges){lines=[...lines,...outcome.charges.rows.map((r,i)=>[chargeStart+i*5,'CASE FILE / CHARGES','CLERK',r.label+' / '+r.count+' count'+(r.count===1?'':'s')+'. '+r.punishment+'.']),[chargeStart+outcome.charges.rows.length*5,'LATER / FICTIONAL SENTENCE','CASE FILE',outcome.charges.sentence+'. Arcade fiction, not real sentencing law.']];}const index=lines.findLastIndex(l=>time>=l[0]),line=lines[index];if(index!==lastLine){lastLine=index;$('cinemaScene').textContent=line[1];$('cinemaSpeaker').textContent=line[2];$('cinemaLine').textContent=line[3];audio.cue(line[1].startsWith('INCOMING')?'phone':'click');}
 if(active==='death'){deathStep(dt);return;}
 if(active==='intro'){
  const travel=Math.min(1,time/29);cast.forEach((a,i)=>{a.mesh.position.set(-40+travel*42+i%4*1.2,0,58-travel*32+Math.floor(i/4)*1.5);a.mesh.rotation.y=2.2;});
  if(time>38&&time<40){const d=rivals[1].mesh.userData;d.arms[1].rotation.x=-1.7+(time-38)*1.1;}
  if(time>=40&&!props.length){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.14),materials.stone);scene.add(rock);props.push(rock);audio.cue('glass');}if(props[0]){const t=Math.min(1,(time-40)/.6);props[0].position.set(4,1.5+t*2.5,26-t*17);props[0].visible=t<1;}
 }else if((outcome.early||outcome.arrested)){if(time<20){if(!car){arrive();car.mesh.position.set(6,0,27);officers.forEach((p,i)=>p.position.set(3+i*1.4,0,24));}}else room(true);if(time>=36&&time<chargeStart){$('cinemaLine').textContent=outcome.deported?"The inquiry exposed that Cisco's parents had no legal immigration status. The family was deported.":early.at(-1)[3];}}
 else{if(time>=38&&time<69&&stage!=='exit')exterior();if(time>=49&&time<69)arrive();if(time>=69)room(true);if(time>=12&&time<25&&!phone)phone=box(player.mesh.userData.held,0,0,0,.07,.14,.02,materials.metal,false);if(stage==='exit'){player.mesh.position.z=60+Math.min(4.2,Math.max(0,time-38)*.35);}}
 $('cinemaCharges').classList.toggle('hidden',active!=='outro'||!outcome.charges||stage!=='station');
 cast.forEach((a,i)=>{const moving=active==='intro'&&time<29||stage==='exit'&&time<49;animateHuman(a.mesh,moving?2.2:0,time*(moving?5:1)+i,dt||.016);const d=a.mesh.userData;d.head.rotation.y=Math.sin(time*.65+i)*.1;d.head.rotation.x=active==='intro'?0:.08;if(i===0&&phone&&time<25){d.arms[1].rotation.x=-2;d.forearms[1].rotation.x=-1.3;}if(i===1&&active==='intro'&&time>15&&time<21)d.arms[0].rotation.x=-1.2;if(active==='intro'&&i===2&&time>38&&time<40)d.arms[1].rotation.x=-1.7+(time-38)*1.1;});officers.forEach(p=>animateHuman(p,0,time,dt||.016));
 if(car)car.lights.forEach((m,i)=>m.visible=(Math.floor(time*7)+i)%2===0);
 const lead=player.mesh.position,target=lead.clone().add(V(0,1.25,0));let pos;if(active==='intro'){pos=lead.clone().add(time<10?V(5,2.8,7):time<29?V(-4,2.1,5):V(6,2.7,6));if(time>40)target.set(1,3,15);}else if(stage==='station'||stage==='school'){pos=lead.clone().add(lastLine%2?V(2.6,1.7,-3.1):V(-2.5,2,3.3));}else{pos=lead.clone().add(time>=49?V(7,2.5,5):V(3,1.8,5));}camera.position.copy(pos);camera.lookAt(target);camera.updateMatrixWorld(true);if(time>=(active==='intro'?49:outcome.charges?chargeStart+outcome.charges.rows.length*5+12:chargeStart))finish();}
 $('skipCinema').onclick=finish;return {begin,step,finish,cancel:cleanup,get active(){return active;},get time(){return time;}};
}
