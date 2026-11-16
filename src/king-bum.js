'use strict';

const kingChargeStart=7/60;
const kingCombo=[{delay:8/60,damage:11,knock:6},{delay:17/60,damage:17,knock:52}];

function kingArmored(f,damage,type,impact){
 const move=f.powerMove;
 if(f.key!=='kingbum'||!move||move.slot!==0||move.armorSpent||
    move.elapsed<kingChargeStart||move.elapsed>move.contact||
    type!=='normal'||damage>10||impact.launch)return false;
 move.armorSpent=true;
 return true;
}

function dropKingBread(f){
 const move=f.powerMove;
 if(f.key==='kingbum'&&move?.slot===1&&!move.fired){
  f.kingBreadDrop=.18;
  fx('kingBread',f.x+f.dir*38,f.y-f.c.size*.65,'#dd9b52',.48,0,{direction:f.dir});
 }
}

function kingContact(f,target,reach){
 const tip=f.x+f.dir*reach;
 return boxesOverlap({left:Math.min(f.x,tip),right:Math.max(f.x,tip),
  top:f.y-f.c.size*.77,bottom:f.y-f.c.size*.34},hurtbox(target));
}

function advanceKingPower(f,move,previous){
 if(move.slot!==1){
  const start=move.slot===0?kingChargeStart:12/60;
  const activeTime=Math.max(0,Math.min(move.elapsed,move.contact)-Math.max(previous,start));
  f.x=clamp(f.x+f.dir*activeTime*(move.slot===0?325:235),55,W-55);
 }
 if(!move.comboTarget)return;
 const next=kingCombo[move.comboIndex];
 if(!next||move.elapsed<move.contact+next.delay)return;
 const target=move.comboTarget;
 if(target.action!=='hit'||target.stun<=0||!kingContact(f,target,f.c.powers[2].range+22)){
  move.comboTarget=null;
  return;
 }
 move.comboIndex++;
 const area=hurtbox(target);
 hit(f,target,next.damage,next.knock,Infinity,f.x,f.dir,'high','special',{
  x:f.dir>0?area.left:area.right,y:target.y-target.c.size*.51,
  knockdown:move.comboIndex===kingCombo.length,
 });
}

function resolveKingSpecial(f,target,slot){
 const move=f.c.powers[slot];
 if(slot===0){
  if(kingContact(f,target,move.range))hit(f,target,move.damage,move.knock);
  return;
 }
 const amount=Math.min(f.maxHp*.05,f.maxHp-f.hp);
 f.hp+=amount;
 if(amount>0)fx('text',f.x,f.y-f.c.size,'#b7ff91',.75,0,{text:'+'+Number(amount.toFixed(1))+' VIDA'});
 sound(310,.14,'triangle',.06);
}

function resolveKingUltimate(f,target){
 const move=f.powerMove,data=f.c.powers[2];
 if(!move||!kingContact(f,target,data.range))return;
 const area=hurtbox(target);
 hit(f,target,data.damage,data.knock,Infinity,f.x,f.dir,'high','special',{
  x:f.dir>0?area.left:area.right,y:target.y-target.c.size*.58,
  onHit:()=>{
   if(f.powerMove!==move)return;
   move.comboIndex=0;
   move.comboTarget=target;
  },
 });
}

// Each four-by-four atlas shares the same cell and floor pivot.
const kingAtlases={
 movement:imageAsset('assets/fighters/king-bum-movement.png'),
 combat:imageAsset('assets/fighters/king-bum-combat.png'),
 powers:imageAsset('assets/fighters/king-bum-powers.png'),
 results:imageAsset('assets/fighters/king-bum-results.png'),
};
// Pixel coordinates of the fist or boot in the contact frame, measured from the floor pivot.
const kingStrikeProfiles={
 stand:{punch:[29,36,48],kick:[35,20,39]},
 low:{punch:[31,21,33],kick:[38,1,14]},
 air:{punch:[33,33,45],kick:[26,13,31]},
};
function kingStrikeProfile(f){
 const profile=f.basicMove.launch?[20,43,65]:kingStrikeProfiles[f.attackStance][f.attackKind];
 return profile.map(pixel=>pixel*f.c.size/62);
}

const kingBasicPoses={
 stand:{punch:[0,1],kick:[2,3]},
 low:{punch:[4,5],kick:[6,7]},
 air:{punch:[8,9],kick:[10,11]},
};

function updateKingIdle(f,dt,landed){
 f.kingLanding=landed?.08:Math.max(0,(f.kingLanding||0)-dt);
 f.kingBreadDrop=Math.max(0,(f.kingBreadDrop||0)-dt);
 if(f.action!=='idle'||!f.grounded){f.kingIdleTime=0;return;}
 const previous=f.kingIdleTime||0;
 f.kingIdleTime=(previous+dt)%7;
 if(previous<3&&f.kingIdleTime>=3)sound(66,.28,'triangle',.025);
}

function kingPowerPose(move){
 const elapsed=move.elapsed,contact=move.contact;
 if(move.slot===0){
  if(elapsed<kingChargeStart)return 0;
  return elapsed<contact+.10?1:2;
 }
 if(move.slot===1){
  if(move.fired)return 6;
  return elapsed<.22?3:elapsed<.48?4:5;
 }
 const index=move.comboIndex||0;
 if(!move.fired)return 8;
 const sincePunch=elapsed-contact-(index?kingCombo[index-1].delay:0);
 if(sincePunch<.085)return 9+index;
 return index<kingCombo.length&&move.comboTarget?8:0;
}

function kingPose(f){
 if(game.roundOver){
  const elapsed=2.45-game.resultTime;
  if(f.hp<=0)return elapsed<.16?['powers',14]:['results',6];
  if(game.winner===f.player)return ['results',elapsed<.38?2:elapsed<1.05?3:4];
  return ['results',5];
 }
 if(f.grabbedBy)return ['combat',15];
 if(f.grab)return ['combat',14];
 if(f.powerMove)return ['powers',kingPowerPose(f.powerMove)];
 switch(f.action){
  case 'down':return ['results',f.actionTime>.48&&!f.knockdownLanded?14:f.actionTime>.17?6:7];
  case 'wakeup':
   if(f.actionTime>.16)return f.rollDirection?['results',7]:['powers',15];
   return ['results',f.actionTime>.08?8:9];
  case 'hit':
   if(f.kingBreadDrop>0)return ['powers',7];
   if(!f.grounded)return f.actionTime>.17?['powers',13]:['results',13];
   return f.actionTime>.17?['powers',12]:['results',12];
  case 'escape':return ['results',f.actionTime>.11?10:11];
  case 'throwRecovery':return ['results',15];
  case 'guard':return ['movement',f.lowGuard?13:12];
  case 'blockstun':return ['movement',f.lowGuard?15:14];
  case 'crouch':return ['movement',13];
  case 'land':return ['movement',11];
  case 'jump':return ['movement',f.vy<-690?8:f.vy<0?9:10];
  case 'quickStep':return ['movement',f.backstep?(f.actionTime>.09?4:5):(f.actionTime>.09?6:7)];
  case 'walk':{
   const feet=Math.floor(f.walkClock*8)%2;
   return ['movement',(f.backstep?4:2)+feet];
  }
  case 'attack':{
   const {active,step}=attackTimeline(f);
   const frames=f.basicMove.launch?[12,13]:kingBasicPoses[f.attackStance][f.attackKind];
   if(step===3)return ['movement',f.attackStance==='low'?13:f.attackStance==='air'?10:12];
   return ['combat',frames[Number(active)]];
  }
  default:{
   if(f.kingLanding>0)return ['movement',11];
   const clock=f.kingIdleTime||0;
   if(clock>=2.85&&clock<3.55)return ['movement',1];
   return clock<.3?['movement',0]:['results',Math.floor(clock*3)%2];
  }
 }
}

function drawKingBum(f){
 const [atlas,frame]=kingPose(f);
 const image=kingAtlases[atlas];
 if(!image.naturalWidth)return;
 const scale=f.c.size/62;
 ctx.drawImage(image,frame%4*96,Math.floor(frame/4)*80,96,80,
  Math.round(-48*scale),Math.round(-72*scale),Math.round(96*scale),Math.round(80*scale));
}
