const cash=n=>'$'+Math.round(n).toLocaleString();
export function crimeReport(run){
 const rows=[];
 function add(id,label,count,fine,hours,months=0){if(!count)return;rows.push({id,label,count,fine,hours,months,punishment:[cash(fine)+' fine',hours+'h community service',...(months?[months+' months juvenile detention']:[])].join(' / ')});}
 add('trespass','Trespassing',1,200,8);
 add('vandalism','Property destruction',run.destroyed||0,(run.destroyed||0)*100,Math.min(80,(run.destroyed||0)*2));
 add('assault','Assault',run.civilianAssaults||0,(run.civilianAssaults||0)*500,(run.civilianAssaults||0)*12,Math.min(6,run.civilianAssaults||0));
 add('officer','Assaulting an officer',run.policeAssaults||0,(run.policeAssaults||0)*1000,(run.policeAssaults||0)*20,Math.min(18,(run.policeAssaults||0)*2));
 add('homicide','Homicide',run.kills||0,(run.kills||0)*5000,0,(run.kills||0)*24);
 add('evading','Evading police',run.evasions||0,(run.evasions||0)*300,(run.evasions||0)*8);
 const fine=rows.reduce((n,r)=>n+r.fine,0),hours=rows.reduce((n,r)=>n+r.hours,0),months=rows.reduce((n,r)=>n+r.months,0),restitution=run.playerDamage||0;
 const sentence=run.died?"No sentence. Case closed following Cisco's death.":[cash(fine)+' in fines',cash(restitution)+' restitution',hours+' hours community service',months?months+' months juvenile detention':'6 months probation'].join(' / ');
 return {rows,fine,hours,months,restitution,sentence};
}
export function crimeList(report){return report.rows.map(r=>r.label+' x'+r.count).join('\n');}
export function caseText(report,dead=false){return report.rows.map(r=>r.label+' x'+r.count+(dead?'':' / '+r.punishment)).join('\n')+'\n\n'+(dead?'CASE CLOSED':'FICTIONAL SENTENCE')+'\n'+report.sentence+'\nArcade fiction, not real sentencing law.';}
