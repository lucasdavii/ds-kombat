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
 fx('burst',x,FLOOR-26,f.c.accent,ultimate?.39:.23,ultimate?88:47);
 if(ultimate)fx('shock',f.x,FLOOR,'#ffd28c',.38,125);
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
   fx('burst',nose,point.y,dog.color,dog.combo?.34:.23,dog.combo?105:brutus?80:53);
   if(dog.combo)dog.combo.neneuCombo={target,started:dog.combo.elapsed,stage:0,dir:dog.dir};
  },
  onBlock:()=>fx('burst',nose,point.y,'#9ae7ff',.14,38),
 };
 if(hit(f,target,dog.damage,brutus?67:dog.combo?3:18,Infinity,previous,dog.dir,
  brutus?'mid':'low','special',point)){
  dog.life=dog.combo?.18:.27;dog.phase='exit';
 }
 return false;
}

function advanceNeneuPower(f,move){
 const combo=move.neneuCombo;
 if(!combo||combo.stage===2)return;
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
   onHit:()=>{
    fx('shock',target.x,FLOOR,'#ed635b',.34,125);
    fx('burst',target.x,target.y-52,'#ff8e63',.26,100);
   },
  });
 }
 if(combo.stage===1&&elapsed>=.42){
  combo.stage=2;
  f.x=clamp(target.x-dir*120,55,W-55);
  hit(f,target,19,62,150,f.x,dir,'high','special',{
   x:target.x,y:target.y-95,knockdown:true,
   onHit:()=>{
    fx('burst',target.x,target.y-95,'#ffd28c',.38,150);
    fx('shock',target.x,FLOOR,'#ffaa64',.42,150);
    spawnParticle(target.x,target.y-95,'#ffdfaa',16,240);
   },
  });
 }
}

const neneuAtlases=Object.fromEntries(['base','combat','results','dogs','powers'].map(
 sheet=>[sheet,imageAsset('assets/fighters/neneu-'+sheet+'.png')]));

function neneuPose(f,t){
 if(game.roundOver){
  const elapsed=2.45-game.resultTime;
  if(f.hp<=0)return ['results',elapsed<.16?4:5];
  return ['results',game.winner===f.player?(elapsed<.7?13:14):15];
 }
 if(f.grabbedBy)return ['results',f.grounded?8:9];
 if(f.grab||f.action==='throwRecovery')return ['powers',6];
 const move=f.powerMove;
 if(move&&f.action===move.pose){
  if(move.slot<2){
   const stage=move.elapsed<move.contact?.5+Math.floor(move.elapsed/move.contact*2):
    move.elapsed-move.contact<.095?2:3;
   return ['powers',move.slot*4+Math.floor(stage)];
  }
  const combo=move.neneuCombo;
  const age=combo?move.elapsed-combo.started:0;
  return ['powers',!move.fired?8:!combo?9:combo.stage===2?(age<.51?13:age<.64?14:15):age<.2?10:12];
 }
 switch(f.action){
 case 'walk':return ['combat',Math.floor(f.walkClock*10)%4];
 case 'quickStep':return ['combat',f.actionTime>.1?4:5];
 case 'crouch':return ['base',4];
 case 'land':return ['combat',7];
 case 'jump':return ['combat',6];
 case 'guard':case 'blockstun':return ['results',f.lowGuard?1:0];
 case 'hit':return ['results',f.grounded?(f.actionTime>.18?3:2):4];
 case 'down':return ['results',f.grounded?5:4];
 case 'wakeup':return ['results',f.rollDirection&&f.actionTime>.1?6:7];
 case 'escape':return ['results',10];
 case 'attack':{
  const {active,step}=attackTimeline(f);
  const kick=f.attackKind==='kick';
  if(f.attackStance==='low')return active?['combat',kick?15:11]:['base',4];
  if(f.attackStance==='air'&&!active)return ['combat',6];
  return ['combat',(kick?12:8)+(active?1:step===3?2:0)];
 }
 default:return game.phase==='intro'?['results',12]:['base',Math.floor(t*3)%2];
 }
}

function drawNeneuFrame(sheet,frame,scale){
 const image=neneuAtlases[sheet];
 if(!image.naturalWidth)return false;
 ctx.drawImage(image,frame%4*96,Math.floor(frame/4)*84,96,84,
  -48*scale,-78*scale,96*scale,84*scale);
 return true;
}

function drawNeneu(f,t){
 const [sheet,frame]=neneuPose(f,t);
 drawNeneuFrame(sheet,frame,f.c.size/62);
 if(sheet==='powers'&&frame===2){
  const phase=f.powerMove.elapsed-f.powerMove.contact;
  pixelText('♪',45+phase*160,-215-phase*240,23,'#ffe1a6','center',2);
 }
}

function drawNeneuDog(dog){
 ctx.save();
 ctx.translate(dog.x,dog.y);
 ctx.scale(dog.dir,1);
 ctx.imageSmoothingEnabled=false;
 const brutus=dog.kind==='brutus';
 const stride=[2,3,4][Math.floor(dog.age*25)%3];
 const frame=dog.phase==='exit'?(dog.combo&&brutus&&dog.life>.13?13:brutus?15:7):
  brutus?(dog.phase==='guard'?10:dog.age<.11?11:12+Math.floor(dog.age*20)%2):
  dog.age<.08?1:stride;
 const size=brutus?3.65:3.45;
 drawNeneuFrame('dogs',frame,size*(dog.combo?1.12:1));
 ctx.restore();
}
