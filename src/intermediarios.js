'use strict';

const intermediateAtlas=imageAsset('assets/fighters/intermediarios.png');

function drawIntermediateFrame(group,action,index,scale){
 const frame=INTERMEDIATE_FRAMES[group+'/'+action]?.[index];
 if(!frame||!intermediateAtlas.naturalWidth)return false;
 const [x,y,w,h,ax,ay]=frame;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(intermediateAtlas,x,y,w,h,-Math.round(ax*scale),-Math.round(ay*scale),
  Math.round(w*scale),Math.round(h*scale));
 return true;
}

function intermediateFighterScale(f,variant){
 if(variant){
  if(f.key==='pneuson'||f.key==='kingbum'||f.key==='paje'||f.key==='neneu')return f.c.size/(f.key==='pneuson'?64:62);
  return f.c.size/68;
 }
 if(f.key==='pneuson')return f.c.size/64;
 if(f.key==='dino')return scaleFromIdle(f,f.action==='attack'?(f.attackKind==='kick'?66:65):63);
 if(arcadeSprites[f.key])return f.c.size*1.28/80;
 return f.c.size/62;
}

function drawFighterIntermediate(f){
 if(f.grabbedBy||f.grab||visualMode(f))return false;
 const key=f.key==='kingbum'?'papateu':f.key;
 const action=f.action;
 const scale=intermediateFighterScale(f,false);
 if(game.roundOver){
  const elapsed=2.45-game.resultTime;
  return f.hp>0&&game.winner===f.player&&elapsed>=.27&&elapsed<.36&&
   drawIntermediateFrame(key,'vitoria',0,scale);
 }
 if(action==='attack'&&f.basicMove&&!f.basicMove.launch){
  const move=f.basicMove;
  const {elapsed,active}=attackTimeline(f);
  if(active)return false;
  const strike=f.attackKind==='kick'?'chute':'soco';
  const suffix=f.attackStance==='low'?'-baixo':f.attackStance==='air'?'-aereo':'';
  const since=elapsed-move.impact-move.active;
  // Use only part of startup and recovery. The existing animation draws every contact frame.
  const slot=elapsed>=move.impact*.66&&elapsed<move.impact?0:since>=0&&since<.041?1:-1;
  return drawIntermediateFrame(key+(suffix?'-variacoes':''),strike+suffix,slot,
   suffix?intermediateFighterScale(f,true):scale);
 }
 if(action==='quickStep'&&f.quickStep&&!f.backstep){
  const progress=f.quickStep.elapsed/f.quickStep.duration;
  const slot=progress>=.17&&progress<.33?0:progress>=.78&&progress<.94?1:-1;
  return drawIntermediateFrame(key,'dash',slot,scale);
 }
 if(action==='hit'&&f.grounded&&f.hitFlash<=0){
  const elapsed=(f.hitPoseDuration||0)-f.actionTime;
  return elapsed>=.095&&elapsed<.145&&drawIntermediateFrame(key,'dano',0,scale);
 }
 if(action==='down'&&f.actionTime>.48){
  return drawIntermediateFrame(key,'queda',f.actionTime>.54?0:1,scale);
 }
 if(action==='wakeup'&&!f.rollDirection&&f.actionTime>.12&&f.actionTime<.17){
  return drawIntermediateFrame(key,'levantar',0,scale);
 }
 return false;
}

const intermediateSpecials={
 kingbum:['ombrada','ultima-mordida','coroa-da-fome'],
 paje:['passo-de-faisca','ponto-de-ignicao','sol-de-brasa'],
 neneu:['caramelo','brutus','solta-a-matilha'],
};

function drawPowerIntermediate(f,scale){
 const move=f.powerMove;
 if(game.roundOver||!move||f.action!==move.pose||move.fired||move.elapsed<move.contact*.36||move.elapsed>=move.contact*.56)return false;
 const key=f.key==='kingbum'?'papateu':f.key;
 const action=intermediateSpecials[f.key]?.[move.slot]||['especial-1','especial-2','ultimate'][move.slot];
 return drawIntermediateFrame(key+'-poderes',action,0,scale);
}

function drawDogIntermediate(dog,brutus,scale){
 if(dog.phase!=='run'||dog.age<(brutus?.11:.08))return false;
 const clock=dog.age*(brutus?20:25);
 if(clock%1<.5)return false;
 return drawIntermediateFrame('matilha',brutus?'brutus-corrida':'caramelo-corrida',Math.floor(clock)%3,scale);
}
