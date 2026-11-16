'use strict';

// Escolhe e desenha os quadros do lutador e de seus poderes.

// A mesma janela governa a caixa de ataque e a pose: preparação, contato, retorno.
function attackTimeline(f){
 const m=f.basicMove;
 const elapsed=Math.max(0,m.duration-f.actionTime);
 const end=m.impact+m.active;
 const active=elapsed+1e-9>=m.impact&&elapsed<end-1e-9;
 return {elapsed,active,step:elapsed<m.impact*.5?0:elapsed+1e-9<m.impact?1:active?2:3,
  progress:elapsed<m.impact ? .5*elapsed/Math.max(m.impact,.001) :
   active ? .5 : .75+.25*clamp((elapsed-end)/Math.max(.001,m.duration-end),0,1)};
}

const ultimateAtlas=imageAsset('assets/fighters/pneuson_ultimate_atlas_pixel.png');
const ULTIMATE_PIXEL_SCALE=165/64;
const CALL_TIME=.56, STRIKE_FRAME=.067, EXIT_FRAME=.075;
function drawUltimateFrame(sequence,index,scale){
 scale*=ULTIMATE_PIXEL_SCALE;
 const [x,y,w,h,ax,ay]=pneusonUltimateFrames[sequence][index];
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(ultimateAtlas,x,y,w,h,-Math.round(ax*scale),-Math.round(ay*scale),Math.round(w*scale),Math.round(h*scale));
}

const pneusonAtlas=imageAsset('assets/fighters/pneuson_movimentos_pixel.png');
function drawPneusonFrame(key,progress,height,loop=false,clipWidth=null){
 const frames=pneusonFrames[key];
 const tick=Math.max(0,Math.floor(progress*frames.length));
 const [x,y,w,h,ax,ay,reference]=frames[loop?tick%frames.length:Math.min(tick,frames.length-1)];
 const scale=height/reference;
 ctx.imageSmoothingEnabled=false;
 const width=clipWidth===null?w:Math.min(w,clipWidth);
 ctx.drawImage(pneusonAtlas,x,y,width,h,-Math.round(ax*scale),-Math.round(ay*scale),Math.round(width*scale),Math.round(h*scale));
}
// Poses próprias do Pneuson e do Dino
const PNEUSON_ATTACKS={
 punch:{pose:'soco',duration:.40,impact:.18,damage:8,knock:17,range:126},
 kick:{pose:'chute',duration:.48,impact:.25,damage:12,knock:32,range:156}
};
function pneusonPose(f,t){
 if(game.roundOver){
  const elapsed=2.45-game.resultTime;
  if(f.hp<=0)return ['ko',elapsed/.85];
  if(game.winner===f.player)return ['vitoria',elapsed/1.35];
 }
 switch(f.action){
  case 'attack':{
   const move=f.basicMove;
   const elapsed=move.duration-f.actionTime;
   if(f.attackStance==='low'&&f.attackKind==='punch'){
    if(elapsed<move.impact*.55||elapsed>=move.impact+move.active+.06)return ['guarda_baixa',.32];
    return ['soco',elapsed<move.impact?.31:.60];
   }
   const pose=f.attackStance==='low'?'rasteira':
    f.attackStance==='air'?'avanco':
    PNEUSON_ATTACKS[f.attackKind].pose;
   // Line up the most extended pose with the active hitbox.
   if(elapsed<move.impact)return [pose,.48*clamp(elapsed/move.impact,0,1)];
   if(elapsed<move.impact+move.active)return [pose,.61];
   const recovery=move.duration-move.impact-move.active;
   return [pose,.68+.32*clamp((elapsed-move.impact-move.active)/Math.max(.001,recovery),0,1)];
  }
  case 'special':return [f.specialSlot?'pneu':'graxa',1-f.actionTime/.44];
  case 'down':return ['ko',.8];case 'wakeup':return ['levantar',1-f.actionTime/.25];
  case 'hit':case 'grabbed':return ['dano',1-f.actionTime/.22];
  case 'jump':return ['pular',clamp((f.vy-COMBAT.jumpVelocity)/(-2*COMBAT.jumpVelocity),0,1)];
  case 'land':return ['agachar',.55+clamp(1-f.actionTime/.10,0,1)*.44];
  case 'blockstun':case 'guard':return [f.lowGuard?'guarda_baixa':'guarda',(t-f.poseStart)/.33];
  case 'crouch':return ['agachar',Math.min(.32,(t-f.poseStart)/.30)];
  case 'quickStep':
  case 'walk':return [f.backstep?'recuar':'andar',f.walkClock*1.7,true];
  default:return ['idle',t*1.2,true];
 }
}

// Alturas do corpo em repouso, em pixels de origem, convertidas para
// a unidade visual do jogo. A grade arcade usa a proporção 1,28 / 80.
const idleBodyScale = {
 chapinha:63*1.28/80, pitufo:63*1.28/80, gaga:63*1.28/80,
 mucutuba:63*1.28/80, dino:63/64, pneuson:1,
};

function scaleFromIdle(f,referencePixels){
 return f.c.size*idleBodyScale[f.key]/referencePixels;
}

const dinoLowKickAtlas=imageAsset('assets/fighters/dino-low-kick.png');

const dinoKnockdownAtlas=imageAsset('assets/fighters/dino-knockdown.png');

function drawDinoKnockdown(f){
 if(!dinoKnockdownAtlas.naturalWidth)return false;
 const ko=game.roundOver&&f.hp<=0;
 let frame,drop=0;
 if(ko){
  const elapsed=Math.max(0,2.45-game.resultTime);
  const progress=clamp(elapsed/.36,0,1);
  frame=Math.min(4,Math.floor(progress*5));
  drop=Math.max(0,FLOOR-f.y)*Math.min(1,(progress*1.35)**2);
 }else if(f.action==='down'&&f.grounded){
  const elapsed=Math.max(0,.60-f.actionTime);
  frame=f.knockdownLanded?(elapsed<.085?3:4):Math.min(4,Math.floor(elapsed/.07));
 }else if(!f.grounded&&f.fallOnLanding){
  frame=f.vy<0?1:2;
 }else return false;
 // The whole sequence shares one scale and a hip pivot above the floor.
 const scale=f.c.size/64;
 ctx.drawImage(dinoKnockdownAtlas,frame*96,0,96,80,
  -Math.round(48*scale),Math.round(drop-72*scale),Math.round(96*scale),Math.round(80*scale));
 return true;
}

const dinoRows={"walk": [0, 6], "jump": [1, 6], "guard": [2, 6], "punch": [3, 6], "kick": [4, 6], "hit": [5, 6], "grab": [6, 6], "breath": [7, 6], "ultimate": [8, 6], "crouch": [9, 5], "low": [10, 5], "lowhit": [11, 5], "damage": [12, 5], "ko": [13, 5], "victory": [14, 4], "victory2": [15, 4]};
function drawDino(f){
 if(drawDinoKnockdown(f))return;
 if(!game.roundOver&&f.action==='attack'&&f.attackStance==='low'&&
    f.attackKind==='kick'&&dinoLowKickAtlas.naturalWidth){
  const {step}=attackTimeline(f);
  // Calibrado pelo tronco e pela cabeça juntos, mantendo os pés no chão.
  const scale=f.c.size/64*1.10;
  ctx.drawImage(dinoLowKickAtlas,step*96,0,96,80,
   -Math.round(42*scale),-Math.round(72*scale),Math.round(96*scale),Math.round(80*scale));
  return;
 }
 let key=f.action==='quickStep'?'walk':f.action, progress=1;
 if(key==='blockstun')key='guard';if(key==='grabbed')key='hit';if(key==='down'){key='ko';progress=.8;}if(key==='wakeup'){key='crouch';progress=.2;}
 if(game.roundOver&&f.hp<=0){key='ko';progress=(2.45-game.resultTime)/.75;}
 else if(game.roundOver&&game.winner===f.player){
  const elapsed=2.45-game.resultTime;
  key=elapsed<.65?'victory':'victory2';progress=elapsed<.65?elapsed/.65:(elapsed-.65)/.85;
 }else if(key==='attack'){key=f.attackStance==='low'?'lowhit':f.attackKind==='kick'?'kick':'punch';progress=attackTimeline(f).progress;}
 else if(key==='grab'){key='grab';progress=(f.grab?.clock||0)/.5;}
 else if(key==='ko')progress=.8;
 else if(key==='special'){key=f.specialSlot?'breath':'grab';progress=1-f.actionTime/(f.powerMove?.duration||.633333);}
 else if(key==='walk')progress=f.walkClock*1.7%1;
 else if(key==='ultimate')progress=1-f.actionTime/(f.c.powers[2].duration/60);
 else if(key==='jump')progress=clamp((f.vy+660)/1320,0,1);
 else if(key==='guard'||key==='crouch'){key=key==='guard'?(f.lowGuard?'low':'guard'):'crouch';progress=.4;}
 else if(key==='hit')progress=.34;
 else{key='walk';progress=0;}
 const [row,count]=dinoRows[key];
 const frame=clamp(Math.floor(progress*count),0,count-1);
 // A arte dos golpes em pé foi desenhada ligeiramente maior que a espera.
 const attackReference=key==='punch'?65:key==='kick'?66:63;
 const scale=scaleFromIdle(f,attackReference)*
  (key==='ultimate'?1+.35*progress:key==='victory2'?1.25:1);
 ctx.drawImage(dinoAtlas,frame*100,row*120,100,120,-Math.round(50*scale),-Math.round(109*scale),Math.round(100*scale),Math.round(120*scale));
}
function arcadePose(f,t){
 if(game.roundOver){
  if(f.hp<=0)return 13;
  if(game.winner===f.player)return game.resultTime>2.1?18:19;
 }
 switch(f.action){
  case 'quickStep':
  case 'walk':return [0,1,0,2][Math.floor(f.walkClock*10)%4];
  case 'jump':return 4;
  case 'blockstun':case 'guard':return f.lowGuard?6:5;
  case 'crouch':return 3;
  case 'down':return 13;case 'wakeup':return 14;case 'hit':case 'grabbed':return 12;
  case 'run':return 15;
  case 'special':return f.key==='pitufo'&&f.specialSlot===1?(f.actionTime>.31?5:7):15+f.specialSlot;
  case 'ultimate':return f.key==='mucutuba'?5:17;
  case 'attack':{const phase=attackTimeline(f);if(!phase.active)return f.attackStance==='low'?3:f.attackStance==='air'?4:5;return f.attackStance==='low'?10:f.attackStance==='air'?11:f.attackKind==='kick'?9:7;}
  // An active buff changes the artwork, not the idle pose index.
  default:return 0;
 }
}

function drawGagaLegs(image,x,y,w,h,ax,ay,scale){
 // Widen the trouser silhouette from the hips down, around the existing pivot.
 for(let row=0;row<h;row++){
  const fromFloor=ay-row;
  const widen=.24*clamp((32-fromFloor)/10,0,1)*clamp(fromFloor/5,.55,1);
  const stretch=1+widen;
  const top=Math.round((row-ay)*scale);
  const bottom=Math.round((row+1-ay)*scale);
  if(bottom<=top)continue;
  const left=Math.round(-ax*scale*stretch);
  const right=Math.round((w-ax)*scale*stretch);
  ctx.drawImage(image,x,y+row,w,1,left,top,right-left,bottom-top);
 }
}

function drawPower(f){
 const move=f.powerMove;
 if(!move||f.action!==move.pose)return false;
 if(f.key==='dino'&&move.slot===0)return false;
 if(f.key==='mucutuba'&&move.slot===2)return false;
 if(f.key==='pitufo'&&move.slot===1)return false;
 if(f.key==='pneuson'&&move.slot===2)return false;
 const key=f.key==='gaga'&&move.slot===0?'elastic':f.key;
 const frames=powerFrames[key][key==='elastic'?0:move.slot];
 const image=powerAtlases[key];
 if(!image.naturalWidth)return false;
 let n=Math.min(frames.length-1,(typeof powerPoseIndex==='function'?powerPoseIndex(move,frames.length):Math.floor(move.elapsed/move.duration*frames.length)));
 // Keep the impact pose tied to landing instead of the power timer.
 if(f.key==='chapinha'&&move.slot===1){
  if(f.pendingGroundPunch)n=f.vy< -220?0:f.vy<100?1:2;
  else if(f.grounded)n=f.actionTime>.085?3:f.actionTime>.035?4:5;
 }
 if(f.key==='dino'&&move.slot===1&&move.fired&&move.elapsed-move.contact<.20)n=2;
 const serpentine=key==='elastic'&&f.buffTimer>0;
 if(serpentine){
  const since=move.elapsed-move.contact;
  n=since<0?(move.elapsed<move.contact*.5?0:1):since<.085?2:since<.15?3:4;
 }
 const [x,y,w,h,ax,ay]=frames[n];
 // Os atlas dos especiais arcade foram montados com corpo neutro de 62 px.
 const scale=arcadeSprites[f.key]?scaleFromIdle(f,62):f.c.size/64;
 if(serpentine&&n===2){
  const bodyWidth=54;
  const destX=-ax*scale,destY=-ay*scale;
  drawGagaLegs(image,x,y,bodyWidth,h,ax,ay,scale);
  // Bend the arm only; preserve the body and the size of the fist.
  const bendTime=move.elapsed-move.contact;
  for(let col=bodyWidth;col<w;col+=2){
   const u=(col-bodyWidth)/(w-bodyWidth);
   const bend=Math.sin(u*Math.PI)*Math.sin(u*5+bendTime*23)*9;
   const left=Math.round(destX+col*scale);
   const right=Math.round(destX+Math.min(col+2,w)*scale);
   ctx.drawImage(image,x+col,y,Math.min(2,w-col),h,left,
    Math.round(destY+bend*scale),right-left,Math.round(h*scale));
  }
  return true;
 }

 if(f.key==='gaga'&&f.buffTimer>0)drawGagaLegs(image,x,y,w,h,ax,ay,scale);
 else ctx.drawImage(image,x,y,w,h,-Math.round(ax*scale),-Math.round(ay*scale),Math.round(w*scale),Math.round(h*scale));
 return true;
}

// Linhas dos atlas: avanço, recuo, rolagem, agarrão, queda e escape.
const movementAtlases=Object.fromEntries(CHARS.filter(key=>key!=='kingbum'&&key!=='paje').map(key=>[
 key,imageAsset(`assets/fighters/${key}_movement.png`)
]));
function drawMovementPose(f){
 const image=movementAtlases[f.key];
 if(!image?.naturalWidth||game.roundOver||visualMode(f))return false;
 let row,progress;
 if(f.action==='quickStep'&&f.quickStep){
  const step=f.quickStep;
  row=f.backstep?1:0;
  progress=step.elapsed/step.duration;
 }else if(f.action==='wakeup'&&f.rollDirection){
  row=2;
  progress=1-f.actionTime/.25;
 }else if(f.grab?.basic){
  row=3;
  progress=f.grab.clock/DINO_THROW.impact;
 }else if(f.grabbedBy?.grab?.basic){
  row=4;
  progress=f.grabbedBy.grab.clock/DINO_THROW.impact;
 }else if(f.action==='escape'){
  row=5;
  progress=1-f.actionTime/.18;
 }else return false;
 const col=clamp(Math.floor(progress*6),0,5);
 // O primeiro quadro de cada atlas de movimento foi exportado a 62 px.
 const scale=scaleFromIdle(f,62);
 ctx.drawImage(image,col*96,row*96,96,96,
  Math.round(-48*scale),Math.round(-92*scale),Math.round(96*scale),Math.round(96*scale));
 return true;
}
