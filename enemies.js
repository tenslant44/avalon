import {box,materials} from './world.js';
export const ENEMY_TYPES={
 patrol:{threat:1,name:'POLICE',hp:100,speed:1,damage:0,color:0x315390},
 swat:{threat:3,name:'SWAT',hp:100,speed:1,damage:0,color:0x202a31},
 military:{threat:5,name:'ARMY',hp:100,speed:1,damage:28,color:0x59664b},
 scout:{threat:2,name:'SCOUT',hp:100,speed:1.35,damage:12,color:0xf09732},
 riot:{threat:3,name:'RIOT',hp:100,speed:.8,damage:20,color:0x31577e},
 sniper:{threat:4,name:'SNIPER',hp:100,speed:.8,damage:30,color:0x8066a1,range:58,shotSpeed:65,cooldown:3.8,aim:1.1},
 grenadier:{threat:5,name:'GRENADIER',hp:100,speed:.9,damage:24,color:0xc55a35,range:26,shotSpeed:15,cooldown:4.8,aim:.9},
 medic:{threat:4,name:'MEDIC',hp:100,speed:1.05,damage:10,color:0xf0eeee},
 juggernaut:{threat:5,name:'JUGGERNAUT',hp:100,speed:.62,damage:45,color:0x95453e}
};
export const SPECIALISTS=['scout','riot','sniper','grenadier','medic','juggernaut'];
export function dressSpecialist(a){const t=ENEMY_TYPES[a.unit];a.maxHp=t.hp;a.hp=t.hp;if(!SPECIALISTS.includes(a.unit))return;
 const d=a.mesh.userData;d.shirt.color.setHex(t.color);d.pants.color.setHex(0x253541);d.held.clear();
 if(a.unit==='riot'){box(d.bones.leftForearm,0,-.1,.22,.65,1.05,.1,materials.metal);box(d.bones.leftForearm,0,.18,.29,.48,.16,.02,materials.glass);}
 if(a.unit==='sniper'||a.unit==='grenadier'){box(d.held,0,0,.28,.1,.14,a.unit==='sniper'?1.2:.6,materials.metal);box(d.head,0,.13,0,.3,.12,.3,materials.edge);}
 if(a.unit==='medic'){box(d.bones.chest,0,0,.19,.25,.07,.04,materials.rust);box(d.bones.chest,0,0,.2,.07,.25,.04,materials.rust);box(d.bones.chest,0,0,-.18,.36,.35,.2,materials.white);}
 if(a.unit==='juggernaut'){box(d.bones.chest,0,0,.1,.57,.5,.25,materials.metal);box(d.head,0,.04,0,.32,.3,.32,materials.metal);box(d.held,0,0,.2,.17,.17,.9,materials.rust);}
 if(a.unit==='scout')box(d.head,0,.12,0,.29,.1,.27,materials.rust);
}
