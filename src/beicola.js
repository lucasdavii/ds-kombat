'use strict';

// Sprites do Beiçola: corpo, ataques e vento/som são atlas independentes.
const beicolaAttacks=imageAsset('assets/fighters/beicola_attacks.png?v=posefix2');
const beicolaMovement=imageAsset('assets/fighters/beicola_movement.png?v=posefix2');
const beicolaSpecials=imageAsset('assets/fighters/beicola_specials.png?v=posefix2');
const beicolaResults=imageAsset('assets/fighters/beicola_results.png?v=posefix2');
const beicolaEffects=imageAsset('assets/fighters/beicola_fx.png?v=posefix2');

function drawBeicolaAtlasFrame(image,index,columns,cell,scale){
 const x=(index%columns)*cell,y=Math.floor(index/columns)*cell;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(image,x,y,cell,cell,-cell*.5*scale,-cell*scale,cell*scale,cell*scale);
}

function drawBeicola(f,t){
 const base=arcadeSprites.beicola;
 if(!base?.naturalWidth)return false;
 const scale=f.c.size*1.28/80;

 if(game.roundOver){
  if(beicolaResults.naturalWidth){
   let frame;
   if(f.hp<=0)frame=8; // ajoelhado na derrota
   else if(game.winner===f.player)frame=game.resultTime>1.65?1:4; // pose confiante / punho erguido
   else frame=8;
   drawBeicolaAtlasFrame(beicolaResults,frame,4,96,f.c.size*1.28/96);
   return true;
  }
 }
 if(beicolaMovement?.naturalWidth){
  if(f.action==='quickStep'&&f.quickStep){
   const progress=clamp(f.quickStep.elapsed/Math.max(.001,f.quickStep.duration),0,1);
   const col=f.backstep?Math.floor((1-progress)*2)%2:clamp(Math.floor(progress*6),0,5);
   const row=f.backstep?0:1;
   drawBeicolaAtlasFrame(beicolaMovement,row*6+col,6,96,f.c.size*1.28/96);
   return true;
  }
  if(f.action==='walk'){
   const col=Math.floor((f.walkClock||0)*8)%2;
   drawBeicolaAtlasFrame(beicolaMovement,col,6,96,f.c.size*1.28/96);
   return true;
  }
  if(f.action==='run'){
   const col=2+Math.floor((f.walkClock||0)*10)%4;
   drawBeicolaAtlasFrame(beicolaMovement,6+col,6,96,f.c.size*1.28/96);
   return true;
  }
 }
 if((f.action==='special'||f.action==='ultimate')&&beicolaSpecials.naturalWidth){
  const move=f.powerMove;
  const slot=move?.slot??(f.action==='ultimate'?2:0);
  const progress=move?clamp(move.elapsed/Math.max(.01,move.duration),0,1):0;
  const col=clamp(Math.floor(progress*6),0,5);
  const row=f.action==='ultimate'?2:slot===1?1:0;
  drawBeicolaAtlasFrame(beicolaSpecials,row*6+col,6,96,f.c.size*1.28/96);
  return true;
 }
 if(f.action==='attack'&&beicolaAttacks.naturalWidth){
  const move=f.basicMove||{duration:.4};
  const elapsed=clamp(move.duration-f.actionTime,0,move.duration);
  const col=clamp(Math.floor(elapsed/Math.max(.001,move.duration)*6),0,5);
  const row=f.attackStance==='low'?(f.attackKind==='kick'?3:2):
   f.attackKind==='kick'?3:(f.uppercut?1:0);
  drawBeicolaAtlasFrame(beicolaAttacks,row*6+col,6,96,f.c.size*1.28/96);
  return true;
 }
 let frame=arcadePose(f,t);
 if(f.action==='special')frame=16;
 if(f.action==='ultimate')frame=17;
 if(f.action==='hit'||f.action==='grabbed')frame=12;
 if(f.action==='down')frame=13;
 if(f.action==='wakeup')frame=14;
 drawBeicolaAtlasFrame(base,clamp(frame,0,19),5,80,scale);
 return true;
}

function drawBeicolaEffect(f){
 if(!beicolaEffects?.naturalWidth||!f.powerMove)return;
 const move=f.powerMove;
 if(f.action!=='special'&&f.action!=='ultimate')return;
 const slot=move.slot;
 const progress=clamp(move.elapsed/Math.max(.01,move.duration),0,1);
 const col=clamp(Math.floor(progress*6),0,5);
 const row=slot===0?1:slot===1?0:3;
 const enemy=game.f?.[1-f.player];
 const range=f.c.powers[slot]?.range||180;
 const distance=enemy?Math.min(range,Math.max(105,Math.abs(enemy.x-f.x))):range;
 const width=clamp(distance*1.05,110,640);
 ctx.save();
 ctx.translate(f.x+f.dir*28,f.y-f.c.size*.68);
 ctx.scale(f.dir,1);
 ctx.globalAlpha=.86;
 ctx.imageSmoothingEnabled=false;
 // A camada visual é desenhada separada e não altera o corpo nem as hitboxes.
 ctx.drawImage(beicolaEffects,col*96,row*96,96,96,0,-32,width,64);
 ctx.restore();
}

function resolveBeicolaSpecial(f,enemy,slot){
 const data=f.c.powers[slot];
 const box=hurtbox(enemy);
 const impact={x:f.dir>0?box.left:box.right,y:(box.top+box.bottom)/2};
 const connected=hit(f,enemy,data.damage,data.knock,data.range,f.x,f.dir,'high','special',impact);
 if(connected&&slot===1&&enemy.action!=='blockstun'&&enemy.hp>0){
  // O vácuo puxa; o assobio do slot 1 não causa dano extra.
  enemy.pushVX=-f.dir*Math.max(180,data.knock*9);
 }
 if(connected)game.screenShake=Math.max(game.screenShake||0,slot===0?4:5);
}

function resolveBeicolaUltimate(f,enemy){
 const data=f.c.powers[2];
 const box=hurtbox(enemy);
 const impact={x:f.dir>0?box.left:box.right,y:(box.top+box.bottom)/2,knockdown:true};
 if(hit(f,enemy,data.damage,data.knock,data.range,f.x,f.dir,'high','special',impact))
  game.screenShake=Math.max(game.screenShake||0,11);
}
