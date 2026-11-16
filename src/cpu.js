'use strict';

// Decisões do adversário controlado pelo jogo.

const AI_LEVELS={facil:{reaction:24,decision:38,guard:.23,special:.35,jump:.08},normal:{reaction:14,decision:24,guard:.48,special:.55,jump:.17},dificil:{reaction:8,decision:16,guard:.72,special:.72,jump:.27}};
function aiInput(f,enemy,dt){
 const cfg=AI_LEVELS[difficulty];const input={};
 // Decisions use a delayed observation, never the opponent's input.
 f.aiDecision-=dt;
 if(f.aiDecision<=0){
  f.aiDecision=(cfg.decision+Math.floor(Math.random()*12))/60;
  const d=Math.abs(enemy.x-f.x),forward=f.x<enemy.x?'right':'left',back=forward==='right'?'left':'right';
  const projectileThreat=projectiles.some(p=>p.source!==f&&(f.x-p.x)*p.dir>0&&Math.abs(f.x-p.x)<350);
  const preferred=f.key==='kingbum'?125:f.key==='dino'?115:f.key==='chapinha'?125:f.key==='gaga'?230:f.key==='pitufo'?270:220;
  const plan={};if(d>preferred+25)plan[forward]=true;else if(d<preferred-60&&f.x>85&&f.x<W-85)plan[back]=true;
  if((enemy.action==='attack'&&d<210||projectileThreat)&&Math.random()<cfg.guard){plan.block=true;plan.down=enemy.attackStance==='low';}
  else if(Math.random()<cfg.jump&&(projectileThreat||d<230))plan.up=true;
  if(f.energy>=100&&(f.key!=='kingbum'||d<145)&&Math.random()<.65)plan.ult=true;
  else if(d<155&&Math.random()<.62){plan[Math.random()<.55?'punch':'kick']=true;if(Math.random()<.22)plan.down=true;}
  else if(Math.random()<cfg.special){
   if(f.key==='dino'){
    const canGrab=d<122&&enemy.grounded&&enemy.stun<=0&&enemy.invincible<=0&&f.cooldowns[0]<=0;
    plan[canGrab?'sp1':'sp2']=true;
   }
   else if(f.key==='kingbum'){
    if(f.hp<f.maxHp*.9&&d>220&&f.cooldowns[1]<=0&&f.energy>=specialCost(f.c,1))plan.sp2=true;
    else if(d<190)plan.sp1=true;
   }
   else if(f.key==='gaga')plan[d>170?'sp1':'sp2']=true;
   else if(f.key==='chapinha')plan[d>190?'sp1':'sp2']=true;
   else if(f.key==='mucutuba'){
    const canHeal=d>230&&f.hp<=f.maxHp-15&&f.energy>=specialCost(f.c,1)&&f.cooldowns[1]<=0;
    plan[canHeal?'sp2':'sp1']=true;
   }
   else plan[Math.random()<.5?'sp1':'sp2']=true;
  }
  f.aiPending={plan,wait:cfg.reaction/60};
 }
 if(f.aiPending){f.aiPending.wait-=dt;if(f.aiPending.wait<=0){f.aiPlan=f.aiPending.plan;f.aiPending=null;}}
 const plan=f.aiPlan||{};
 for(const key of ['left','right','block','down'])input[key]=!!plan[key];
 for(const key of ['up','punch','kick','sp1','sp2','ult'])if(plan[key]){input[key]=true;plan[key]=false;}
 if(f.grabbedBy&&difficulty==='dificil'&&Math.random()<.08){input.punch=true;input.kick=true;}
 return input;
}
