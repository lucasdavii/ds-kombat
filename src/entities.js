'use strict';

// Cria e atualiza projéteis, aliados, partículas e efeitos temporários.

function spawnParticle(x,y,color,n=9,speed=260){for(let i=0;i<n&&particles.length<300;i++){const a=rnd(0,Math.PI*2),sp=rnd(speed*.22,speed);particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-20,life:rnd(.25,.55),max:.55,r:rnd(2,6),color});}}
function fx(type,x,y,color,duration=.4,radius=60,extra={}){if(visualFX.length<100)visualFX.push({type,x,y,color,life:duration,max:duration,radius,...extra});}

function projectile(source,type,options={}){if(projectiles.filter(p=>p.source===source).length>=2)return;const p={x:source.x+source.dir*(options.offsetX??67),y:source.y-(options.offsetY??116),vx:source.dir*(options.speed||500),radius:options.radius||28,damage:options.damage||14,age:0,life:options.life||1.8,source,dir:source.dir,type,color:options.color||source.c.accent};projectiles.push(p);
 if(type==='pitufo')fx('pitufoMuzzle',p.x-18*p.dir,p.y,'#d9faff',.13,32,{direction:p.dir});
 else if(type==='grease'||type==='tire'){
  const hand=options.hand??{x:options.offsetX??67,y:options.offsetY??116};
  fx('workshopRelease',source.x+source.dir*hand.x,source.y-hand.y,p.color,.19,32,{direction:p.dir,tire:type==='tire'});
 }else fx('burst',p.x,p.y,p.color,.18,32);}

function dinoBeamLength(beam){
 return 620*clamp((beam.max-beam.life)/.085,0,1);
}

function updateDinoBeam(beam){
 if(beam.connected||game.roundOver||beam.source.action!=='special')return;
 const target=game.f[1-beam.source.player];
 const box=hurtbox(target);
 const tip=beam.x+beam.direction*dinoBeamLength(beam);
 const radius=dinoBeamWidth(beam,1-beam.life/beam.max);
 if(box.left>Math.max(beam.x,tip)||box.right<Math.min(beam.x,tip)||
    beam.y+radius<box.top||beam.y-radius>box.bottom)return;
 const point={x:clamp(beam.direction>0?box.left:box.right,Math.min(beam.x,tip),Math.max(beam.x,tip)),
  y:clamp(beam.y,box.top,box.bottom)};
 beam.connected=hit(beam.source,target,beam.damage,26,Infinity,beam.x,beam.direction,'high','special',point);
}

// Projéteis se encontram antes de consultar as caixas de dano dos lutadores.
function updateEntities(dt){
 // After removing a pair, restart at the surviving slot below it.
 for(let i=projectiles.length-1;i>=0;i--){
  const a=projectiles[i];
  for(let j=i-1;j>=0;j--){
   const b=projectiles[j],reach=a.radius+b.radius;
   if(a.source===b.source||Math.abs(a.x-b.x)>=reach||Math.abs(a.y-b.y)>=reach)continue;
   fx('contact',(a.x+b.x)/2,(a.y+b.y)/2,'#fff1bc',.18,25);
   projectiles.splice(i,1);
   projectiles.splice(j,1);
   i--;
   break;
  }
 }
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];const previousX=p.x;p.x+=p.vx*dt;p.life-=dt;p.age=(p.age||0)+dt;if(Math.random()<.34)spawnParticle(p.x-p.dir*17,p.y,p.color,1,100);const target=game.f[1-p.source.player];if(target.hp>0&&Math.max(previousX,p.x)+p.radius>=hurtbox(target).left&&Math.min(previousX,p.x)-p.radius<=hurtbox(target).right&&p.y+p.radius>=hurtbox(target).top&&p.y-p.radius<=hurtbox(target).bottom){hit(p.source,target,p.damage,26,Infinity,p.x-p.dir*24,p.dir,'high','special',{x:clamp(p.x,hurtbox(target).left,hurtbox(target).right),y:clamp(p.y,hurtbox(target).top,hurtbox(target).bottom)});if(game.roundOver)return;fx(p.type==='ancestor'?'ancestorImpact':'burst',p.x,p.y,p.color,.26,60);projectiles.splice(i,1);}else if(p.life<0||p.x<-130||p.x>W+130)projectiles.splice(i,1);}
 for(let i=minions.length-1;i>=0;i--){const m=minions[i];m.life-=dt;if(m.delay>0){m.delay-=dt;continue;}if(m.type==='brother'){const finished=updateGordin(m,dt);if(game.roundOver)return;if(finished)minions.splice(i,1);continue;}m.activeAge=(m.activeAge??0)+dt;
  const acceleration=.35+.65*clamp(m.activeAge/.18,0,1);
  m.x+=m.dir*m.speed*acceleration*dt;
  const target=game.f[1-m.source.player];if(target.hp>0&&Math.abs(target.x-m.x)<40&&hurtbox(target).bottom>=m.y-75&&hurtbox(target).top<=m.y){hit(m.source,target,m.damage,14,Infinity,m.x-m.dir*24,m.dir);if(game.roundOver)return;fx('burst',m.x,m.y-65,m.color,.36,62);minions.splice(i,1);}else if(m.life<0||m.x<-140||m.x>W+140)minions.splice(i,1);}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;if(p.life<=0)particles.splice(i,1);}
 for(let i=visualFX.length-1;i>=0;i--){const v=visualFX[i];v.life-=dt;if(v.type==='dinoBeam'){if(v.source.action!=='special')v.life=0;else if(v.life>0)updateDinoBeam(v);if(game.roundOver&&i>=visualFX.length)return;}if(v.delayedQuake&&v.life<.14&&!v.fired){v.fired=true;areaHit(v.owner,260,21,'#ff5b6c');game.screenShake=11;}if(v.life<=0)visualFX.splice(i,1);}
}

function updateGordin(m,dt){
 const target=game.f[1-m.source.player];
 const previous=m.clock;
 m.clock+=dt;
 if(m.phase==='entry'){
  const stop=target.x-m.dir*92;
  m.x+=m.dir*Math.min(m.speed*dt,Math.max(0,(stop-m.x)*m.dir));
  if((stop-m.x)*m.dir<=0){m.phase='attack';m.clock=0;}
 }else if(m.phase==='attack'){
  const impact=6*STRIKE_FRAME;
  if(previous<impact&&m.clock>=impact&&Math.abs(target.x-m.x)<190&&hurtbox(target).bottom>=m.y-140){
   hit(m.source,target,m.damage,110,Infinity,m.x,m.dir);
   fx('workshopRelease',target.x,m.y-65,m.color,.24,62,{direction:m.dir,tire:true});
   fx('shock',target.x,FLOOR,'#d4a269',.32,83);
  }
  if(m.clock>=7*STRIKE_FRAME){m.phase='exit';m.clock=0;}
 }else{
  m.x-=m.dir*m.speed*.85*dt;
  return m.x<-390||m.x>W+390;
 }
 return false;
}
