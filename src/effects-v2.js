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
function drawFittedAura(f,t,x,feet,colors){
  const opacity=ctx.globalAlpha;
  const low=f.action==='crouch'||(f.action==='guard'&&f.lowGuard);
  const height=f.c.size*(f.action==='down'?.63:low?1.16:1.58);
  const width=f.c.size*(f.action==='down'?1.04:.85);
  
  const phase=Math.floor(t*20)*Math.PI*2/5;
  ctx.save();
  for(let y=0;y<height;y+=4){
   const u=y/height;
   const spread=width*(1-Math.pow(u,2.1))*(.93+.07*Math.cos(u*25+phase));
   
   const edge=Math.min(spread,8+4*Math.sin(u*21+phase));
   ctx.globalAlpha=opacity*.65;
   rect(Math.round(x-spread),Math.round(feet+8-y),Math.round(spread*2),4,colors[0]);
   ctx.globalAlpha=opacity*.96;
   for(const side of [-1,1]){
    const border=Math.round(x+(side<0?-spread:spread-edge));
    rect(border,Math.round(feet+8-y),Math.round(edge),4,colors[1]);
    if(edge>=6&&Math.sin(u*36+phase+side)>0)rect(border+3,Math.round(feet+8-y),3,4,colors[2]);
   }
  }
  if(f.key==='paje'){
   // Separate tapered tongues rise around the solid back layer.
   ctx.globalAlpha=opacity;
   for(let n=-4;n<=4;n++){
    const tip=height*(.58+.31*(1-Math.abs(n)/5)+.12*Math.sin(phase+n*2));
    for(let y=0;y<tip;y+=4){
     const u=y/tip;
     const x0=x+n*width*.24*(1-u*.48)+Math.sin(u*7+phase+n)*width*.10*u;
     const w=Math.max(4,width*.31*(1-u));
     rect(Math.round(x0-w/2),Math.round(feet+8-y),Math.round(w),4,'#d63313');
     if(w>8)rect(Math.round(x0-w*.32),Math.round(feet+8-y),Math.round(w*.64),4,'#ff7518');
     if(u<.58&&w>10)rect(Math.round(x0-w*.13),Math.round(feet+8-y),Math.round(w*.26),4,'#fff09a');
    }
   }
  }
  ctx.restore();
}
const originalAura=drawPersistentAura;
drawPersistentAura=function(f,t,foreground=false){
 if(!foreground&&!game.roundOver&&f.powerMove){
  const move=f.powerMove,frame=revisedLoop(move.elapsed);
  if(f.key==='pitufo')revisedFrame('pitufo',move.slot,frame,f.x+f.dir*70,f.y,160,100,true);
  if(f.key==='gaga'&&move.slot===0){ctx.save();ctx.translate(f.x,f.y-f.c.size*.6);ctx.scale(f.dir,1);revisedFrame('gaga',0,frame,110,0,220,70);ctx.restore();}
 }
 const mode=visualMode(f);
 if(!foreground&&mode){
  drawFittedAura(f,t,f.x,f.y,auraColors[mode] || ['#155f3a','#8cff4c','#ffffe4']);
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
 drawFittedAura(f,move.elapsed,0,0,['#55262e','#ee8b44','#ffcf77']);ctx.restore();return;
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
