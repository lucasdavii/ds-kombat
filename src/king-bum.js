'use strict';

const kingChargeStart=7/60;
const kingCombo=[{delay:8/60,damage:11,knock:6},{delay:17/60,damage:17,knock:52}];

function kingArmored(f,damage,type,impact){
 const move=f.powerMove;
 if(f.key!=='kingbum'||!move||move.slot!==0||move.armorSpent||
    move.elapsed<kingChargeStart||move.elapsed>move.contact||
    type!=='normal'||damage>10||impact.launch)return false;
 move.armorSpent=true;
 kingEffect(f,'kingArmor',f.x,f.y-f.c.size*.58,.22,50);
 sound(125,.09,'triangle',.055);
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

function kingEffect(f,type,x,y,duration,radius){
 fx(type,x,y,'#ffcb72',duration,radius,{direction:f.dir});
}

function kingPowerWindup(f,move,previous){
 if(previous===0){
  if(move.slot===0)kingEffect(f,'kingDust',f.x,f.y,.24,73);
  if(move.slot===2){
   kingEffect(f,'kingCrown',f.x,f.y-f.c.size-19,.46,56);
   kingEffect(f,'kingDust',f.x,f.y,.38,105);
  }
 }
 if(move.slot===0&&previous<kingChargeStart&&move.elapsed>=kingChargeStart)
  kingEffect(f,'kingStreak',f.x+f.dir*41,f.y-f.c.size*.58,.27,115);
 if(move.slot===1){
  for(const beat of [.23,.50,.64]){
   if(previous<beat&&move.elapsed>=beat){
    kingEffect(f,'kingCrumbs',f.x+f.dir*48,f.y-f.c.size*.80,.28,35);
    if(beat>=.5)sound(190,.045,'triangle',.035);
   }
  }
 }
}

function kingImpact(f,point,finisher=false){
 kingEffect(f,finisher?'kingFinisher':'kingImpact',point.x,point.y,finisher?.38:.21,finisher?132:71);
 if(finisher){
  kingEffect(f,'kingDust',point.x,FLOOR,.38,145);
  sound(67,.21,'triangle',.08);
 }
}

function advanceKingPower(f,move,previous){
 kingPowerWindup(f,move,previous);
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
  onHit:point=>kingImpact(f,point,move.comboIndex===kingCombo.length),
 });
}

function resolveKingSpecial(f,target,slot){
 const move=f.c.powers[slot];
 if(slot===0){
  if(kingContact(f,target,move.range)){
   const area=hurtbox(target);
   hit(f,target,move.damage,move.knock,Infinity,f.x,f.dir,'high','special',{
    x:f.dir>0?area.left:area.right,y:f.y-f.c.size*.55,
    onHit:point=>kingImpact(f,point),
   });
  }
  return;
 }
 const amount=Math.min(f.maxHp*.05,f.maxHp-f.hp);
 f.hp+=amount;
 kingEffect(f,'kingHeal',f.x,f.y-f.c.size*.40,.62,83);
 if(amount>0)fx('text',f.x,f.y-f.c.size,'#b7ff91',.75,0,{text:'+'+Number(amount.toFixed(1))+' VIDA'});
 sound(310,.14,'triangle',.06);
}

function resolveKingUltimate(f,target){
 const move=f.powerMove,data=f.c.powers[2];
 if(!move||!kingContact(f,target,data.range))return;
 const area=hurtbox(target);
 hit(f,target,data.damage,data.knock,Infinity,f.x,f.dir,'high','special',{
  x:f.dir>0?area.left:area.right,y:target.y-target.c.size*.58,
  onHit:point=>{
   kingImpact(f,point);
   if(f.powerMove!==move)return;
   move.comboIndex=0;
   move.comboTarget=target;
  },
 });
}

function drawKingEffect(v,q){
 const {type,x,y,radius,direction:dir}=v;
 if(type==='kingBread')return false;
 const bright='#fff2bc',gold=v.color,amber='#d87633',shadow='#74382d';
 const pixel=(dx,dy,w,h,color)=>rect(Math.round(x+dx),Math.round(y+dy),w,h,color);
 if(type==='kingDust'){
  for(let j=-3;j<=3;j++){
   const drift=j*(12+q*radius*.28);
   const rise=(1-Math.abs(j)/4)*q*34;
   pixel(drift,-rise,Math.max(4,16-Math.floor(q*10)),6,j%2?gold:'#9b6848');
   pixel(drift+7,-rise-9,5,4,'#714c3e');
  }
 }else if(type==='kingStreak'){
  for(let j=0;j<4;j++){
   const tip=(25+q*radius)*dir;
   const tail=(-radius*.63+q*29)*dir;
   const h=(j-1.5)*20;
   poly([[x+tail,y+h],[x+tip,y+h-7],[x+tip-18*dir,y+h+5],[x+tail+21*dir,y+h+5]],j%2?gold:amber);
  }
 }else if(type==='kingCrown'){
  const lift=-Math.round(q*30);
  poly([[x-44,y+lift-19],[x-22,y+lift-3],[x,y+lift-28],[x+22,y+lift-3],[x+44,y+lift-19],[x+34,y+lift+16],[x-34,y+lift+16]],shadow);
  poly([[x-35,y+lift-10],[x-21,y+lift+1],[x,y+lift-17],[x+21,y+lift+1],[x+35,y+lift-10],[x+28,y+lift+11],[x-28,y+lift+11]],gold);
  pixel(-6,lift+2,12,8,bright);
 }else if(type==='kingHeal'||type==='kingCrumbs'){
  const healing=type==='kingHeal';
  for(let j=0;j<(healing?9:6);j++){
   const angle=j*2.399;
   const dx=Math.cos(angle)*radius*(.36+q*.64);
   const dy=Math.sin(angle)*radius*.38-q*(healing?127:24);
   const color=healing?(j%2?'#b7ff91':'#e8ffc1'):(j%2?gold:amber);
   if(healing){pixel(dx-2,dy-6,4,12,color);pixel(dx-6,dy-2,12,4,color);}
   else pixel(dx,dy,6,5,color);
  }
 }else{
  const size=radius*(.44+q*.73);
  const armor=type==='kingArmor',finisher=type==='kingFinisher';
  const color=armor?'#a9dcff':gold;
  for(let j=0;j<(finisher?10:7);j++){
   const a=j*(Math.PI*2/(finisher?10:7));
   const cos=Math.cos(a),sin=Math.sin(a);
   const near=size*.36,far=size*(j%2?1:.70);
   const spread=finisher?13:8;
   poly([[x+cos*near-sin*spread,y+sin*near+cos*spread],
    [x+cos*far,y+sin*far],[x+cos*near+sin*spread,y+sin*near-cos*spread]],
    j%3===0?bright:color);
  }
  if(q<.28)pixel(-8,-8,16,16,bright);
 }
 return true;
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
