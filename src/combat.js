'use strict';

// Caixas de contato, dano, guarda, agarrões e resolução de golpes.

function updatePower(f,dt){
 const move=f.powerMove;
 if(!move)return;
 if(f.action!==move.pose){f.powerMove=null;return;}
 move.elapsed+=dt;
 if(!move.fired&&move.elapsed>=move.contact){
  move.fired=true;
  if(move.slot===2)resolveUltimate(f);
  else resolveSpecial(f,move.slot);
 }
 if(move.elapsed>=move.duration)f.powerMove=null;
}

function energy(f,n){f.energy=clamp(f.energy+n,0,100)}
// Aplica a defesa ou o dano no ponto de contato. Durante a simulação,
// enfileira o acerto para permitir trocas de golpes no mesmo quadro.
function hit(source,target,damage,knock=15,range=Infinity,contactX=source.x,direction=source.dir,level='high',type='special',point=null){
 if(game.roundOver||!target||target.hp<=0||Math.abs(source.x-target.x)>range||target.invincible>0||target.action==='down'||target.action==='wakeup')return false;
 if(game.collectHits){game.hitQueue.push([source,target,damage,knock,range,contactX,direction,level,type,point]);return true;}
 const box=hurtbox(target);
 const impact=point??{x:direction>0?box.left:box.right,y:(box.top+box.bottom)/2};
 const front=target.dir*(contactX-target.x)>-12;
 const blocked=target.grounded&&type!=='throw'&&target.block&&target.guard>0&&front&&(level==='high'||level==='low'&&target.lowGuard||level==='mid'&&!target.lowGuard);
 let multiplier=source.damageBuff>0?(source.c.powers[2].damageMultiplier??1.4):1;
 let amount=damage*multiplier*(source.c.atk||1);
 if(blocked){
  amount=type==='normal'?0:Math.min(Math.max(0,target.hp-1),Math.round(amount*.13));
  target.guard=Math.max(0,target.guard-18);target.stun=(type==='normal'?(source.basicMove?.blockstun||12):16)/60;
  target.action='blockstun';target.actionTime=target.stun;applyPushback(source,target,direction,knock*.35);
  if(target.perfectGuardFrames>0){
   target.perfectGuardFrames=0;
   target.guard=Math.min(target.maxGuard,target.guard+18);
   target.stun*=.55;
   target.actionTime=target.stun;
   amount=0;
   energy(target,7);
   fx('text',target.x,target.y-target.c.size-18,'#9ae7ff',.45,0,{text:'DEFESA PRECISA'});
  }
  if(target.guard===0){target.stun=.8;target.actionTime=.8;target.block=false;target.action='hit';fx('text',target.x,target.y-150,'#ffe38c',.7,0,{text:'GUARDA QUEBRADA'});}
  fx('guardContact',impact.x,impact.y,'#9ae7ff',.18,34,{direction});
 }else{
  const chain=target.comboTimer>0?(target.comboTaken||0)+1:1;
  target.comboTaken=chain;source.combo=chain;source.comboDisplay=1.4;
  amount*=Math.max(.35,1-(chain-1)*.15);
  const slamArmor=(target.key==='chapinha'||target.key==='gaga')&&target.action==='special'&&
   target.pendingGroundPunch&&!target.grounded&&type!=='throw';
  if(!slamArmor){
   target.stun=(type==='normal'?source.basicMove?.hitstun||24:30)/60;target.action='hit';target.actionTime=target.stun;target.comboTimer=target.stun;target.hitPoseDuration=target.stun;
   target.pendingStrike=false;target.powerMove=null;target.dashTime=0;target.pendingGroundPunch=false;target.dashHitPending=false;
   applyPushback(source,target,direction,knock);
   if(!target.grounded){target.vy=Math.max(180,target.vy);target.airVX=direction*Math.max(90,knock*5);target.fallOnLanding=true;}
   if(impact.launch){
    target.grounded=false;
    target.vy=-530;
    target.airVX=direction*85;
    target.fallOnLanding=true;
   }else if(chain>=COMBAT.comboLimit||type==='throw'){knockdown(target,type==='throw');}
  }
  fx('contact',impact.x,impact.y,'#fff0bd',.18,damage>=15?54:39);target.hitFlash=.12;
 }
 target.hp=game.reviewSession&&training.enabled&&training.health?target.maxHp:clamp(target.hp-amount,0,target.maxHp);energy(source,blocked?3:8);energy(target,blocked?3:6);
 spawnParticle(impact.x,impact.y,blocked?'#79caff':source.c.accent,blocked?5:10,180);
 sound(blocked?210:type==='normal'?110:85,.07,blocked?'triangle':'sawtooth',.035);
 game.screenShake=blocked?2:Math.min(10,3+damage*.15);
 game.hitStop=Math.max(game.hitStop||0,blocked?2/60:damage>=30?7/60:damage>=15?5/60:3/60);
 if(target.hp<=0&&!game.resolvingHits)endRound(source.player);
 return true;
}
// Recuo distribuído no tempo: o contato congela primeiro, depois desloca o corpo.
// No canto, parte da pressão retorna ao atacante, mantendo espaço entre os dois.
function applyPushback(source,target,direction,distance){
 target.pushVX=direction*distance*12;
 if(target.grounded&&((direction>0&&target.x>W-90)||(direction<0&&target.x<90))){
  source.pushVX=-direction*distance*6;
 }
}
function updatePushback(f,dt){
 const velocity=f.pushVX||0;
 if(Math.abs(velocity)<1){f.pushVX=0;return;}
 const decay=Math.exp(-12*dt);
 f.x=clamp(f.x+velocity*(1-decay)/12,55,W-55);
 f.pushVX=velocity*decay;
}

// Uma sequência curta exige contato: soco → chute → especial.
// Golpes no vazio conservam a recuperação e não podem ser cancelados.
function tryAttackCancel(f){
 if(f.action!=='attack'||!f.strikeConnected||f.stun>0||f.actionTime<=0)return;
 // Preserve a pose de contato durante o hitstop antes de aceitar o próximo golpe.
 if(f.strikeContactTime===f.actionTime)return;
 if(f.attackKind==='punch'&&!f.basicMove.launch&&f.inputBuffer?.kick){
  consumeInput(f,'kick');f.actionTime=0;f.pendingStrike=false;
  basicAttack(f,'kick');return;
 }
 for(const [key,slot] of [['sp1',0],['sp2',1]]){
  if(!f.inputBuffer?.[key]||f.cooldowns[slot]>0||f.energy<specialCost(f.c,slot)||!f.grounded)continue;
  consumeInput(f,key);f.actionTime=0;f.pendingStrike=false;special(f,slot);return;
 }
}

function knockdown(f,landed=false){
 f.knockdownLanded=landed;
 f.action='down';f.actionTime=.60;f.stun=.60;f.pendingStrike=false;f.powerMove=null;f.block=false;f.comboTaken=0;f.comboTimer=0;
 if(f.grounded){f.y=FLOOR;f.vy=0;}else f.fallOnLanding=true;
}
function resolveHitQueue(){
 const queue=game.hitQueue;game.collectHits=false;game.resolvingHits=true;
 for(const args of queue)hit(...args);
 game.resolvingHits=false;game.hitQueue=[];
 if(game.f.some(f=>f.hp<=0))endRound(game.f.every(f=>f.hp<=0)?null:game.f[0].hp<=0?1:0);
}
function startGrab(f,target,basic=false){
 if(!f.grounded||!target.grounded||target.stun>0||target.invincible>0||Math.abs(target.x-f.x)>(basic?96:148)||target.grabbedBy||target.grab)return false;
 f.dir=target.x>=f.x?1:-1;
 f.grab={target,clock:0,dir:f.dir,startX:target.x,basic};f.action='grab';f.actionTime=.85;f.powerMove=null;
 target.grabbedBy=f;target.action='grabbed';target.actionTime=.85;target.pendingStrike=false;target.powerMove=null;target.block=false;
 return true;
}
const DINO_THROW={grip:.12,lift:.31,drop:.45,impact:.55,recovery:.24};

// A trajetória do rival e sua inclinação usam as mesmas fases do agarrão.
function dinoThrowPhase(clock){
 const {grip,lift,drop,impact}=DINO_THROW;
 const rise=clamp((clock-grip)/(lift-grip),0,1);
 const fall=clamp((clock-drop)/(impact-drop),0,1);
 return {rise:rise*rise*(3-2*rise),fall:fall*fall};
}

function updateGrab(f,dt){
 const g=f.grab;if(!g)return;const v=g.target;g.clock+=dt;
 if(g.clock<=.12&&v.inputBuffer?.punch&&v.inputBuffer?.kick){
  v.grabbedBy=null;f.grab=null;v.action=f.action='idle';v.actionTime=f.actionTime=.12;v.inputBuffer={};
  f.x=clamp(f.x-g.dir*35,55,W-55);v.x=clamp(v.x+g.dir*35,55,W-55);fx('text',v.x,v.y-170,'#fff1bd',.5,0,{text:'ESCAPOU'});return;
 }
 const pull=clamp(g.clock/DINO_THROW.grip,0,1);
 const {rise,fall}=dinoThrowPhase(g.clock);
 const reach=f.c.size*(.34-.12*rise+.38*fall);
 v.x=clamp(g.startX+(f.x+g.dir*reach-g.startX)*pull,55,W-55);
 v.y=FLOOR-f.c.size*.63*rise*(1-fall);
 v.dir=-g.dir;
 if(g.clock>=DINO_THROW.impact){
  v.grabbedBy=null;v.y=FLOOR;v.grounded=true;
  f.grab=null;f.action='throwRecovery';f.actionTime=DINO_THROW.recovery;
  hit(f,v,g.basic?13:f.c.powers[0].damage,g.basic?18:f.c.powers[0].knock,Infinity,f.x,g.dir,'mid','throw',
   {x:v.x,y:FLOOR-24});
  fx('shock',v.x,FLOOR,'#b8de72',.32,95);
  game.screenShake=Math.max(game.screenShake,14);
 }
}
function areaHit(source,range,dmg,color){
 const fighterSlam=source.key==='gaga'||source.key==='chapinha';
 if(fighterSlam){
  const belly=source.key==='gaga';
  fx('fighterSlam',source.x,FLOOR,color,belly?.46:.39,range,{belly});
  fx('slamDebris',source.x,FLOOR,color,.29,range,{belly});
 }else fx('shock',source.x,source.y-8,color,.48,range);
 let enemy=game.f[1-source.player];if(Math.abs(source.x-enemy.x)<range&&Math.abs(source.y-enemy.y)<130){hit(source,enemy,dmg,Math.round(range*.15),range)}spawnParticle(source.x,source.y-10,color,20,390);}

function hurtbox(f){
 const low=f.grounded&&(f.action==='crouch'||f.action==='land'||f.action==='down'||f.action==='wakeup'||
  (f.action==='guard'||f.action==='blockstun')&&f.lowGuard||
  f.action==='attack'&&f.attackStance==='low');
 const halfWidth=f.c.size*(low?.18:.15);
 return {left:f.x-halfWidth,right:f.x+halfWidth,top:f.y-f.c.size*(low?.55:.91),bottom:f.y-3};
}
function pushbox(f){
 const body=hurtbox(f);
 const halfWidth=f.c.size*.22;
 return {left:f.x-halfWidth,right:f.x+halfWidth,top:body.top+(body.bottom-body.top)*.32,bottom:body.bottom};
}
function boxesOverlap(a,b){
 return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
}
function strikeBox(f){
 const move=f.basicMove,size=f.c.size;
 let reach=move.range,top,bottom;
 if(!move.launch&&f.attackKind==='punch'){
  const [measuredReach,low,high]=PUNCH_CONTACT[f.key][f.attackStance];
  reach=measuredReach;
  top=f.y-high;
  bottom=f.y-low;
 }else{
  const center=f.y-size*(move.launch?.79:f.attackStance==='low'?.18:f.attackStance==='air'?.30:.56);
  const halfHeight=size*(move.launch?.075:.105);
  top=center-halfHeight;
  bottom=center+halfHeight;
 }
 const start=f.x+f.dir*size*.06,end=f.x+f.dir*reach;
 return {left:Math.min(start,end),right:Math.max(start,end),top,bottom};
}
function resolveBasicStrike(f,target){
 const a=strikeBox(f),b=hurtbox(target);
 if(!boxesOverlap(a,b))return false;
 const m=f.basicMove;
 return hit(f,target,m.damage,m.knock,Infinity,f.x,f.dir,f.attackStance==='low'?'low':f.attackStance==='air'?'mid':'high','normal',{x:f.dir>0?Math.max(a.left,b.left):Math.min(a.right,b.right),y:(Math.max(a.top,b.top)+Math.min(a.bottom,b.bottom))/2,launch:m.launch});
}
function updateBasicStrike(f,target){
 if(!f.pendingStrike)return;
 const move=f.basicMove;
 const timeline=attackTimeline(f);
 if(f.action!=='attack'||timeline.elapsed>=move.impact+move.active-1e-9){
  f.pendingStrike=false;
  return;
 }
 if(timeline.active&&resolveBasicStrike(f,target)){
  f.strikeConnected=true;
  f.strikeContactTime=f.actionTime;
  f.pendingStrike=false;
 }
}
function updateDashStrike(f,target){
 if(!f.dashHitPending)return;
 if(f.dashTime<=0){f.dashHitPending=false;return;}
 const size=f.c.size, reach=f.x+f.dir*size*.43;
 const strike={left:Math.min(f.x,reach),right:Math.max(f.x,reach),top:f.y-size*.75,bottom:f.y-size*.30};
 if(!boxesOverlap(strike,hurtbox(target)))return;
 const data=f.c.powers[0];
 if(hit(f,target,data.damage,data.knock,Infinity))f.dashHitPending=false;
}
function basicAttack(f,kind,uppercut=false){
 if(!canAttack(f))return;
 const kick=kind==='kick';f.attackKind=kind;
 f.attackStance=!f.grounded?'air':f.lowGuard?'low':'stand';
 const data=f.c.moves[kind];f.basicMove={...data,duration:(data.startup+data.active+data.recovery)/60,impact:data.startup/60,active:data.active/60};
 if(uppercut){
  Object.assign(f.basicMove,{launch:true,duration:28/60,impact:7/60,active:3/60,knock:22});
 }
 if(f.attackStance==='air'){f.basicMove.duration=.38;f.basicMove.impact=.12;}
 f.action='attack';f.actionTime=f.basicMove.duration;f.pendingStrike=true;f.strikeConnected=false;f.strikeContactTime=-1;
 sound(kick?165:210,.08,'square',.04);
}
function canAttack(f){return !game.roundOver&&game.phase==='fight'&&f.stun<=0&&f.actionTime<=0&&f.hp>0;}
function specialCost(character,slot){return character.powers[slot].energyCost??20;}
function special(f,slot){if(!canAttack(f)||f.cooldowns[slot]>0||f.energy<specialCost(f.c,slot))return;energy(f,-specialCost(f.c,slot));const data=f.c.powers[slot];f.cooldowns[slot]=data.cooldown/60;f.specialSlot=slot;f.action='special';f.actionTime=data.duration/60;
 const contact=data.startup/60;
 f.powerMove={slot,pose:'special',duration:f.actionTime,elapsed:0,contact,fired:contact===0};
 if(contact===0)resolveSpecial(f,slot);
}
function resolveSpecial(f,slot){
 const data=f.c.powers[slot];const enemy=game.f[1-f.player];
 switch(f.key){
 case 'chapinha':if(slot===0){f.dashTime=.28;f.dashPower=990;fx('trail',f.x,f.y-100,'#ff5664',.4,90);f.dashHitPending=true;}else{f.vy=-650;f.airVX=0;f.grounded=false;f.pendingGroundPunch=true;f.groundMove={range:data.range,damage:data.damage,color:'#ff5b6c'};}break;
 case 'pitufo':
  if(slot===0){
   for(let j=0;j<3&&minions.filter(m=>m.source===f).length<10;j++)minions.push({type:'pitufo',x:clamp(f.x+f.dir*(48+j*54),55,W-55),y:FLOOR,dir:f.dir,speed:300,damage:data.damage,life:2.6+j*.08,delay:j*.08,source:f,scale:.29,color:'#66c9ff'});
   fx('text',f.x,f.y-214,'#74ceff',.7,0,{text:'PITUFOS!'});
  }else projectile(f,'pitufo',{offsetX:f.c.size*.66,offsetY:f.c.size*.59,radius:25,damage:data.damage,speed:590,color:'#6fc7ff'});
  break;
 case 'gaga':
  if(slot===0){
   const reach=f.buffTimer>0?data.buffRange:data.range;
   const tip=f.x+f.dir*reach;
   const strike={left:Math.min(f.x,tip),right:Math.max(f.x,tip),top:f.y-f.c.size*.72,bottom:f.y-f.c.size*.46};
   if(boxesOverlap(strike,hurtbox(enemy)))hit(f,enemy,data.damage,data.knock);
  }else{
   f.vy=-650;f.airVX=f.dir*180;f.grounded=false;f.pendingGroundPunch=true;
   f.groundMove={range:data.range,damage:data.damage,color:'#d6a6ff'};
  }
  break;
 case 'dino':if(slot===0){if(!startGrab(f,enemy))fx('text',f.x,f.y-195,'#dfb65d',.5,0,{text:'ERROU'});}else{
  const scale=f.c.size/64;
  fx('dinoBeam',f.x+f.dir*9*scale,f.y-55*scale,'#a2ff40',.24,38,
   {source:f,direction:f.dir,damage:data.damage});
 }break;
 case 'pneuson':{
  const scale=f.c.size/64;
  const hand=slot===0?{x:24*scale,y:37*scale}:{x:12*scale,y:34*scale};
  const offset={hand,offsetX:hand.x+25,offsetY:hand.y,damage:data.damage};
  if(slot===0)projectile(f,'grease',{...offset,radius:43,speed:550,color:'#494550'});
  else projectile(f,'tire',{...offset,radius:56,speed:420,life:2.4,color:'#ff8e40'});
  break;
 }
 case 'mucutuba':
  if(slot===0){
   projectile(f,'ancestor',{radius:48,damage:data.damage,speed:480,color:'#75ff51'});
   fx('ancestor',f.x,f.y-125,'#b4ff67',.34,110);
  }else{
   const recovered=Math.min(data.healing,f.maxHp-f.hp);
   f.hp+=recovered;
   f.guard=clamp(f.guard+data.guardRestore,0,f.maxGuard);
   fx('heal',f.x,f.y-135,'#81ff56',1,65);
   if(recovered>0)fx('text',f.x,f.y-211,'#a9ff72',.8,0,{text:'+'+Number(recovered.toFixed(1))+' VIDA'});
   sound(450,.35,'sine',.07);
  }
  break;
 }
}
function ultimate(f){if(!canAttack(f)||f.energy<100)return;const data=f.c.powers[2];f.energy-=data.meterCost;f.action='ultimate';f.actionTime=data.duration/60;f.invincible=data.invulnerability/60;game.flash=.12;game.screenShake=8;fx('text',W/2,252,f.c.accent,1.1,0,{text:`ULTIMATE • ${f.c.ultimate}`});sound(340,.35,'sawtooth',.06);
 const contact=data.startup/60;
 f.powerMove={slot:2,pose:'ultimate',duration:f.actionTime,elapsed:0,contact,fired:contact===0};
 if(contact===0)resolveUltimate(f);
}
function resolveUltimate(f){
 const data=f.c.powers[2];const enemy=game.f[1-f.player];
 switch(f.key){
 case 'chapinha':f.buffTimer=15;f.damageBuff=15;fx('burst',f.x,f.y-120,'#ff3243',1.1,110);break;
 case 'gaga':f.buffTimer=15;f.damageBuff=15;fx('burst',f.x,f.y-120,'#b45fff',1.2,115);break;
 case 'dino':if(f.powerMove)f.powerMove.stompX=enemy.x;fx('stomp',enemy.x,FLOOR-15,'#b7ff59',1.05,260);hit(f,enemy,data.damage,data.knock,data.range);game.screenShake=18;break;
 case 'pneuson':minions.push({type:'brother',phase:'entry',clock:0,delay:CALL_TIME,x:f.dir===1?-110:W+110,y:FLOOR,dir:f.dir,speed:810,damage:data.damage,life:2.3,source:f,scale:1,color:'#fa9a42'});fx('text',f.x,f.y-204,'#f6d06c',.9,0,{text:'GORDIN, VEM AÍ!'});break;
 case 'pitufo':{
  const houseX=clamp(f.x-f.dir*190,175,W-175);
  fx('house',houseX,FLOOR,'#fd515f',3.05,170);
  // The doorway is slightly right of the sprite's center.
  const doorX=houseX+24;
  for(let j=0;j<7&&minions.filter(m=>m.source===f).length<10;j++){
   minions.push({type:'pitufo',x:doorX,y:FLOOR,dir:f.dir,speed:320+j*12,
    damage:data.damage,life:2.65+j*.13,delay:.27+j*.18,source:f,fromHouse:true,color:'#5fcaff'});
  }
  break;
 }
 case 'mucutuba':{
  f.shockVisual=f.c.shockDuration;
  const impact={x:enemy.x,y:enemy.y-enemy.c.size*.53};
  const connected=hit(f,enemy,data.damage,data.knock,data.range,f.x,f.dir,'high','special',impact);
  const distance=Math.min(200,Math.max(85,Math.abs(enemy.x-f.x)*.5));
  const x=connected?impact.x:clamp(f.x+f.dir*distance,35,W-35);
  const y=connected?impact.y:f.y-f.c.size*.46;
  fx('lightning',x,y,'#8fff49',.74,connected?126:94,{
   originX:f.x,originY:f.y-f.c.size*.73,floorY:FLOOR,
  });
  break;
 }
 }
}

function resolveBodyCollision(a,b,firstOnLeft){
 if(a.grab||b.grab||a.grabbedBy||b.grabbedBy)return;
 const boxA=pushbox(a),boxB=pushbox(b);
 if(boxA.bottom<=boxB.top||boxB.bottom<=boxA.top)return;
 const [left,right]=firstOnLeft?[a,b]:[b,a];
 const distance=(left.c.size+right.c.size)*.22;
 if(right.x-left.x>=distance)return;
 const center=(left.x+right.x)/2;
 left.x=clamp(center-distance/2,55,W-55-distance);
 right.x=left.x+distance;
}

// Defesa + soco durante uma reação interrompe um combo uma vez por round.
function tryComboBreak(f,opponent,input){
 if(f.breakUsed||f.action!=='hit'||f.stun<=0||f.grabbedBy)return false;
 if(!input.block||!f.inputBuffer?.punch)return false;
 consumeInput(f,'punch');
 f.breakUsed=true;
 f.stun=0;
 f.actionTime=.18;
 f.action='escape';
 f.invincible=.25;
 f.comboTimer=0;
 f.comboTaken=0;
 f.pushVX=0;
 f.fallOnLanding=false;
 opponent.pendingStrike=false;
 opponent.powerMove=null;
 opponent.dashTime=0;
 opponent.action='hit';
 opponent.stun=.18;
 opponent.actionTime=.18;
 applyPushback(f,opponent,opponent.x>=f.x?1:-1,65);
 game.hitStop=3/60;
 fx('guardContact',f.x,f.y-f.c.size*.5,'#9ae7ff',.22,65);
 fx('text',f.x,f.y-f.c.size-20,'#9ae7ff',.65,0,{text:'ESCAPE'});
 return true;
}

// Passos rápidos têm aceleração e freada, sem invulnerabilidade.
function startQuickStep(f,direction){
 if(!f.grounded||!canAttack(f))return false;
 f.backstep=direction!==f.dir;
 f.quickStep={direction,duration:f.backstep?.24:.22,elapsed:0,
  distance:f.backstep?85:115};
 f.action='quickStep';
 f.actionTime=f.quickStep.duration;
 return true;
}
function updateQuickStep(f,dt){
 const step=f.quickStep;
 if(!step)return;
 if(f.action!=='quickStep'){f.quickStep=null;return;}
 const before=step.elapsed/step.duration;
 step.elapsed=Math.min(step.duration,step.elapsed+dt);
 const after=step.elapsed/step.duration;
 // A integral do pulso evita saltos de posição no início e no fim.
 const ease=t=>t-Math.sin(2*Math.PI*t)/(2*Math.PI);
 f.x=clamp(f.x+step.direction*step.distance*(ease(after)-ease(before)),55,W-55);
 if(step.elapsed>=step.duration){f.quickStep=null;f.action='idle';f.actionTime=0;}
}
