'use strict';

function summonNeneuDog(f,slot){
 const target=game.f[1-f.player];
 const ultimate=slot===2;
 if(!target||minions.some(dog=>dog.type==='neneuDog'&&dog.source===f))return;
 const x=clamp(f.x+f.dir*50,30,W-30);
 minions.push({type:'neneuDog',kind:slot===1?'brutus':'caramelo',source:f,
  dir:f.dir,x,y:FLOOR,life:ultimate?.58:slot===0?.8:1.1,age:0,
  phase:slot===1?'guard':'run',color:slot===1?'#ed635b':'#edba65',
  combo:ultimate?f.powerMove:null,damage:f.c.powers[slot].damage});
 fx('burst',x,FLOOR-26,f.c.accent,.23,47);
 sound(slot===1?175:790,.13,slot===1?'triangle':'sine',.05);
}

function updateNeneuDog(dog,dt){
 const f=dog.source,target=game.f[1-f.player];
 if(!target||dog.life<=0||dog.x<-100||dog.x>W+100||
    (dog.combo&&f.powerMove!==dog.combo))return true;
 dog.age+=dt;
 if(dog.phase==='exit'){
  dog.x-=dog.dir*440*dt;
  return false;
 }
 const brutus=dog.kind==='brutus';
 const previous=dog.x;
 if(dog.phase==='guard'){
  const gap=(target.x-dog.x)*dog.dir;
  if(gap<0||gap>104||!target.grounded)return false;
  dog.phase='run';dog.age=0;
 }
 if(dog.age<(brutus?.11:.08))return false;
 dog.x+=dog.dir*(brutus?590:760)*dt;
 if(Math.floor(dog.age*22)!==Math.floor((dog.age-dt)*22))
  spawnParticle(dog.x-dog.dir*23,FLOOR-5,'#dba86b',2,75);
 const nose=dog.x+dog.dir*(brutus?42:30);
 const dogBox={left:Math.min(previous,nose),right:Math.max(previous,nose),
  top:FLOOR-(brutus?84:57),bottom:FLOOR-2};
 if(!boxesOverlap(dogBox,hurtbox(target)))return false;
 const point={x:nose,y:FLOOR-(brutus?51:33),
  onHit:()=>{
   fx('burst',nose,point.y,dog.color,.23,brutus?80:53);
   if(dog.combo)dog.combo.neneuCombo={target,started:dog.combo.elapsed,stage:0,dir:dog.dir};
  },
  onBlock:()=>fx('burst',nose,point.y,'#9ae7ff',.14,38),
 };
 if(hit(f,target,dog.damage,brutus?67:dog.combo?3:18,Infinity,previous,dog.dir,
  brutus?'mid':'low','special',point)){
  if(dog.combo)return true;
  dog.life=.27;dog.phase='exit';
 }
 return false;
}

function advanceNeneuPower(f,move){
 const combo=move.neneuCombo;
 if(!combo)return;
 const {target,dir}=combo;
 const elapsed=move.elapsed-combo.started;
 if(target.action!=='hit'||target.stun<=0){move.neneuCombo=null;return;}
 if(combo.stage===0&&elapsed>=.22){
  combo.stage=1;
  const x=clamp(target.x+dir*62,30,W-30);
  minions.push({type:'neneuDog',kind:'brutus',source:f,dir:-dir,x,y:FLOOR,
   life:.25,age:.11,phase:'exit',color:'#ed635b',combo:move});
  hit(f,target,12,34,Infinity,x,-dir,'mid','special',{
   x:target.x,y:target.y-52,
   onHit:()=>fx('shock',target.x,FLOOR,'#ed635b',.25,83),
  });
 }
 if(combo.stage===1&&elapsed>=.42){
  combo.stage=2;
  f.x=clamp(target.x-dir*120,55,W-55);
  hit(f,target,19,62,150,f.x,dir,'high','special',{
   x:target.x,y:target.y-95,knockdown:true,
   onHit:()=>fx('burst',target.x,target.y-95,'#ffd28c',.31,112),
  });
 }
}

// Marcadores para validar a lógica local enquanto faltam as folhas aprovadas.
function drawNeneuLocalPreview(f){
 const crouching=f.action==='crouch'||f.lowGuard;
 const down=f.action==='down'||f.hp<=0;
 const height=f.c.size*(crouching?.55:.83);
 rect(down?-80:-30,down?-32:-height,down?160:60,down?30:height,f.c.accent);
 if(f.action==='attack'&&attackTimeline(f).active){
  const reach=strikeBox(f);
  rect(20,reach.top-f.y,Math.max(0,(reach.right-reach.left)-20),12,'#f8d5a2');
 }
 pixelText('N',0,down?-32:-height*.7,26,'#21171a','center',1);
}

function drawNeneuDogLocalPreview(dog){
 ctx.save();
 ctx.translate(dog.x,dog.y);
 ctx.scale(dog.dir,1);
 const brutus=dog.kind==='brutus';
 const h=brutus?50:39;
 const body=brutus?'#48424c':'#c88c42';
 rect(-32,-h,61,h*.56,body);
 rect(15,-h-13,29,25,body);
 rect(14,-h-2,7,23,brutus?'#ed635b':'#5489c4');
 const step=dog.phase==='guard'?0:Math.floor(dog.age*18)%2*7;
 rect(-24+step,-h*.5,11,h*.5,body);
 rect(13-step,-h*.5,11,h*.5,body);
 rect(-40,-h-7,16,8,body);
 ctx.restore();
}
