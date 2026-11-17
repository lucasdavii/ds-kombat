'use strict';
// Rendering-only adapter. Simulation, hitboxes and action clocks remain untouched.
const revisedFX=imageAsset('assets/fighters/effects-v2.png?v=fx2');
function revisedFrame(key,slot,index,x,y,w,h=w,ground=false){
 const row=EFFECT_ROWS[key+'/'+slot];
 if(row===undefined||!revisedFX.naturalWidth)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(revisedFX,Math.max(0,Math.min(11,index|0))*48,row*48,48,48,
  Math.round(x-w/2),Math.round(y-h*(ground?46/48:.5)),Math.round(w),Math.round(h));
 ctx.restore();return true;
}
function revisedLoop(clock){return 3+(Math.floor(Math.max(0,clock)*20)%5);}
const originalPowerEffect=drawPowerEffect;
drawPowerEffect=function(v,q,t){
 const frame=Math.min(11,Math.floor(q*12));
 if(v.type==='burst'&&['#ffd28c','#ff8e63','#ed635b','#edba65'].includes(v.color)&&revisedFrame('neneu',2,frame,v.x,v.y,v.radius*1.6))return true;
 if(v.type==='fighterSlam'&&revisedFrame(v.belly?'gaga':'chapinha',1,frame,v.x,v.y,v.belly?410:350,170,true))return true;
 if(v.type==='shock'||v.type==='stomp'){
  if(revisedFrame('dino',0,frame,v.x,FLOOR,Math.min(600,Math.max(150,v.radius*2)),150,true))return true;
 }
 if(v.type==='heal'&&revisedFrame('mucutuba',1,frame,v.x,v.y,130,130))return true;
 if(v.type==='stretch'&&revisedFX.naturalWidth){
  ctx.save();ctx.translate(v.x,v.y);ctx.scale(v.dir||1,1);
  revisedFrame('gaga',0,frame,130*q,0,260*q+1,65);ctx.restore();return true;
 }
 if(v.type==='pajePillar'&&revisedFrame('paje',2,frame,v.x,v.y,480,560,true))return true;
 if(v.type==='pitufoMuzzle'&&revisedFrame('pitufo',1,frame,v.x,v.y,100,70))return true;
 return originalPowerEffect(v,q,t);
};
const originalProjectile=drawPowerProjectile;
drawPowerProjectile=function(p){
 const slot={grease:0,tire:1,ancestor:0}[p.type];
 const who=p.type==='ancestor'?'mucutuba':'pneuson';
 if(slot!==undefined&&revisedFX.naturalWidth){
  ctx.scale(p.dir,1);
  return revisedFrame(who,slot,revisedLoop(p.age||0),0,0,p.radius*(p.type==='grease'?2.4:3.45));
 }
 return originalProjectile(p);
};
const originalAura=drawPersistentAura;
drawPersistentAura=function(f,t,foreground=false){
 if(!foreground&&!game.roundOver&&f.powerMove){
  const move=f.powerMove,frame=revisedLoop(move.elapsed);
  if(f.key==='pitufo')revisedFrame('pitufo',move.slot,frame,f.x+f.dir*70,f.y,160,100,true);
  if(f.key==='gaga'&&move.slot===0){ctx.save();ctx.translate(f.x,f.y-f.c.size*.6);ctx.scale(f.dir,1);revisedFrame('gaga',0,frame,110,0,220,70);ctx.restore();}
 }
 const mode=visualMode(f);
 if(!game.roundOver&&!foreground&&['chapinha','gaga','mucutuba'].includes(mode)&&revisedFX.naturalWidth){
  const low=f.action==='down'||f.action==='crouch'||(f.action==='guard'&&f.lowGuard);
  revisedFrame(mode,2,revisedLoop(t),f.x,f.y,f.c.size*.95,f.c.size*(low?.7:1.2),true);
  return;
 }
 originalAura(f,t,foreground);
 if(!foreground&&!game.roundOver&&f.key==='chapinha'&&f.dashTime>0){
  ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.dir,1);
  revisedFrame('chapinha',0,revisedLoop(t),-55,0,180,100,true);ctx.restore();
 }
};
const originalKingAura=drawKingCrownAura;
drawKingCrownAura=function(f,move,foreground){
 if(!foreground&&revisedFX.naturalWidth){
 ctx.save();ctx.globalAlpha*=clamp(move.elapsed*11,0,1)*clamp((move.duration-move.elapsed)*10,0,1);
 revisedFrame('kingbum',2,revisedLoop(move.elapsed),0,0,f.c.size*.95,f.c.size*1.15,true);ctx.restore();return;
 }
 originalKingAura(f,move,foreground);
};
const originalKingFX=drawKingEffect;
drawKingEffect=function(v,q){
 if(['kingHeal','kingCrumbs'].includes(v.type)&&revisedFrame('kingbum',1,Math.floor(q*12),v.x,v.y,80,70))return true;
 return originalKingFX(v,q);
};
const originalPajeFire=drawPajeFire;
drawPajeFire=function(frame,x,y,scale){
 if(revisedFrame('paje',2,frame<4?3+frame:Math.min(11,frame+4),x,y,96*scale,112*scale,true))return;
 originalPajeFire(frame,x,y,scale);
};
const originalPajeFlame=drawPajeFlame;
drawPajeFlame=function(x,y,clock,scale,strength){
 if(revisedFrame('paje',1,revisedLoop(clock),x*scale,y*scale,24*scale*strength,22*scale*strength))return;
 originalPajeFlame(x,y,clock,scale,strength);
};
const originalSparkStep=drawPajeSparkStep;
drawPajeSparkStep=function(clock,scale,kicking){
 if(!kicking&&revisedFrame('paje',0,revisedLoop(clock),-32*scale,0,65*scale,22*scale,true))return;
 originalSparkStep(clock,scale,kicking);
};
const originalDogTrail=drawNeneuDogTrail;
drawNeneuDogTrail=function(dog,brutus){
 if(dog.phase==='run'&&dog.age>=(brutus?.11:.08)&&revisedFrame('neneu',brutus?1:0,revisedLoop(dog.age),-45,-2,110,50,true))return;
 originalDogTrail(dog,brutus);
};
