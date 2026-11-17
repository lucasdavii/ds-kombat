'use strict';

const pajeAssets=Object.fromEntries(['movement','combat','powers','results','fire'].map(
 name=>[name,imageAsset('assets/fighters/paje-'+name+'.png')]));
const pajeLiftTime=9/60;
const pajeBlastTime=22/60;

function advancePajePower(f,move,previous){
 const start=(move.slot===0?5:11)/60;
 if(move.slot!==1){
  const advance=Math.max(0,Math.min(move.elapsed,move.contact)-Math.max(previous,start));
  f.x=clamp(f.x+f.dir*advance*(move.slot===0?620:490),55,W-55);
 }
 const target=move.confirmed;
 if(!target||target.action!=='hit'||target.stun<=0)return;
 const since=move.elapsed-move.contact;
 if(since>=pajeBlastTime&&move.lifted&&!move.blast){
  move.blast=true;
  hit(f,target,23,52,Infinity,f.x,f.dir,'high','special',{
   x:target.x,y:target.y-target.c.size*.45,knockdown:true,
   onHit:()=>fx('pajePillar',target.x,FLOOR,'#ff963a',.43),
  });
 }else if(since>=pajeLiftTime&&!move.lifted){
  move.lifted=true;
  hit(f,target,14,0,Infinity,f.x,f.dir,'high','special',{
   x:target.x,y:target.y-target.c.size*.55,launch:true,
  });
 }
}

function resolvePajePower(f,target,slot){
 const data=f.c.powers[slot],move=f.powerMove;
 const tip=f.x+f.dir*data.range;
 const box=hurtbox(target);
 if(!boxesOverlap({left:Math.min(f.x,tip),right:Math.max(f.x,tip),
  top:f.y-f.c.size*.73,bottom:f.y-f.c.size*(slot===0?.19:.39)},box))return;
 hit(f,target,data.damage,data.knock,Infinity,f.x,f.dir,'high','special',{
  x:f.dir>0?box.left:box.right,y:f.y-f.c.size*(slot===0?.38:.58),
  onHit:point=>{
   if(slot===2&&f.powerMove===move)move.confirmed=target;
   fx('burst',point.x,point.y,'#ff9d48',.19,slot===1?90:52);
  },
 });
}

function pajePowerFrame(move){
 const since=move.elapsed-move.contact;
 if(move.slot===0)return move.elapsed<5/60?0:since<0?1:since<.09?2:3;
 if(move.slot===1)return move.elapsed<.13?4:since<0?5:since<.10?6:7;
 if(move.elapsed<.10)return 8;
 if(move.elapsed<11/60)return 9;
 if(since<0)return 10;
 if(since<.09)return 11;
 if(!move.confirmed)return 15;
 if(since<.14)return 9;
 if(since<.25)return 12;
 return move.blast?14:13;
}

function pajePose(f,t){
 if(game.roundOver){
  const elapsed=2.45-game.resultTime;
  if(f.hp<=0)return ['results',elapsed<.16?14:6];
  return ['results',game.winner===f.player?(elapsed<.38?2:elapsed<1.05?3:4):5];
 }
 if(f.grabbedBy)return ['results',f.grounded?12:13];
 if(f.grab)return ['results',15];
 if(f.powerMove)return ['powers',pajePowerFrame(f.powerMove)];
 switch(f.action){
  case 'down':return ['results',f.knockdownLanded?6:14];
  case 'wakeup':return ['results',f.actionTime>.16&&f.rollDirection?7:f.actionTime>.08?8:9];
  case 'hit':return f.grounded?['combat',f.actionTime>.17?3:2]:['results',13];
  case 'escape':return ['results',f.actionTime>.11?10:11];
  case 'throwRecovery':return ['results',15];
  case 'guard':
  case 'blockstun':return ['combat',f.lowGuard?1:0];
  case 'crouch':return ['movement',12];
  case 'land':return ['movement',15];
  case 'jump':return ['movement',f.vy<-690?13:14];
  case 'quickStep':return ['movement',8+Math.floor(t*18)%4];
  case 'walk':return ['movement',4+Math.floor(f.walkClock*10)%4];
  case 'attack':{
   const {active,step}=attackTimeline(f);
   const kick=f.attackKind==='kick';
   if(f.attackStance==='low')return ['combat',active?(kick?11:7):1];
   return ['combat',(kick?8:4)+(active?1:step>=2?2:0)];
  }
  default:return game.phase==='intro'?['results',Math.floor(t*3)%2]:['movement',Math.floor(t*7)%4];
 }
}

function drawPajeFire(frame,x,y,scale){
 const image=pajeAssets.fire;
 if(!image.naturalWidth)return;
 ctx.drawImage(image,frame%4*96,Math.floor(frame/4)*112,96,112,
  x-48*scale,y-108*scale,96*scale,112*scale);
}

function drawPaje(f,t){
 const [atlas,frame]=pajePose(f,t);
 const image=pajeAssets[atlas],scale=f.c.size/62;
 if(!image.naturalWidth)return;
 if(atlas==='powers'&&frame>=9&&frame<=14){
  drawFittedAura(f,f.powerMove.elapsed,0,0,['#7a1b0e','#ff7518','#fff09a']);
 }
 if(!drawPowerIntermediate(f,scale))ctx.drawImage(image,frame%4*96,Math.floor(frame/4)*84,96,84,
  -48*scale,-78*scale,96*scale,84*scale);
 drawPajeStrikeFlames(f,atlas,frame,scale);

}

// As posições usam as mesmas coordenadas locais e espelhamento do sprite.
function drawPajeStrikeFlames(f,atlas,frame,scale){
 if(atlas!=='powers'||!f.powerMove)return;
 const clock=f.powerMove.elapsed;
 if(frame===1){
  drawPajeSparkStep(clock,scale,false);
 }else if(frame===2){
  drawPajeSparkStep(clock,scale,true);
 }else if(frame===5){
  drawPajeFlame(-12,-39,clock,scale,.65);
 }else if(frame===6){
  drawPajeFlame(36,-39,clock,scale,1.25);
 }
}
function drawPajeFlame(x,y,clock,scale,strength){
 const tick=Math.floor(clock*18);
 ctx.save();
 ctx.translate(Math.round(x*scale),Math.round(y*scale));
 ctx.scale(scale*strength,scale*strength);
 const colors=['#d63313','#ff7518','#ffbd32','#fff09a'];
 for(let layer=0;layer<4;layer++){
  ctx.fillStyle=colors[layer];
  const width=12-layer*2;
  ctx.fillRect(-width/2,-5,width,10-layer);
  for(let tongue=0;tongue<3;tongue++){
   const rise=6+(tick+tongue*3)%5-layer;
   ctx.fillRect(-width/2+tongue*width/3,-5-rise,
    Math.max(2,width/3),rise);
  }
 }
 ctx.restore();
}

function drawPajeSparkStep(clock,scale,kicking){
 const tick=Math.floor(clock*24);
 ctx.save();
 ctx.scale(scale,scale);
 if(kicking){
  poly([[25,-48],[32,-48],[39,-43],[43,-36],[41,-29],[35,-25],[29,-26],[35,-30],[37,-36],[34,-41],[25,-44]],'#e44818');
  poly([[29,-46],[34,-44],[39,-38],[40,-33],[36,-29],[38,-35],[34,-41],[29,-42]],'#ff9c22');
  poly([[34,-41],[38,-37],[38,-33],[36,-35]],'#fff1a0');
 }else{
  const flutter=[0,3,-2,1][tick%4];
  poly([[-9,-2],[-17,-11],[-24,-15],[-22,-9],[-35,-14-flutter],[-31,-8],[-49,-11],[-42,-5],[-59,-6],[-48,-1],[-30,1],[-17,1]],'#d73b17');
  poly([[-12,-2],[-20,-8],[-28,-9],[-24,-5],[-38,-8-flutter],[-34,-3],[-49,-4],[-40,-1],[-22,0]],'#ff8720');
  poly([[-14,-2],[-21,-5],[-28,-4],[-25,-2],[-37,-3],[-31,-1],[-21,0]],'#ffe386');
 }
 for(let i=0;i<7;i++){
  const age=(tick+i*3)%11;
  const x=(kicking?26:-24)-i*5-age*2;
  const y=(kicking?-34:-4)-(i%3)*4-age;
  const size=age<5?2:1;
  rect(x,y,size,size,age<5?'#ffd65b':'#f56a1c');
 }
 ctx.restore();
}
