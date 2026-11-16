// Preparation, release and recovery use the actual gameplay contact time.
function powerPoseIndex(move,count=4){
 const e=Math.max(0,move.elapsed),c=Math.max(0,move.contact);
 if(e<c)return Math.min(1,Math.floor(e/Math.max(c,.001)*2));
 const recovery=Math.max(.001,move.duration-c);
 return Math.min(count-1,2+Math.floor((e-c)/recovery*Math.max(1,count-2)));
}
// Explicit pose mapping from inspected sheets; draw cells with uniform nearest-neighbor scale.
const revisionAtlases=Object.fromEntries(Object.entries(REVISION_SPRITES).map(([key, meta])=>{
 let path=meta.image;
 if(key==='dino')path=path.replace('.png','_verde.png');
 if(key==='chapinha'||key==='chapinhaCombat')path=path.replace('_revision03.png','_berserker.png');
 return [key,imageAsset(path)];
}));
function revisionFrame(key,index,height,wideLegs=false){
 const m=REVISION_SPRITES[key],im=revisionAtlases[key];if(!m||!im?.naturalWidth)return false;
 const frame=m.frames[Math.max(0,Math.min(index,m.frames.length-1))];
 const [x,y,w,h]=frame.cell,[ax,ay]=frame.anchor;
 // Os ataques baixos e aéreos do Dino vieram de uma folha com
 // cabeça maior que a do sprite parado. Corrige a sequência inteira.
 const scale=height/64*(key==='dino'&&index>=8&&index<20?.90:1);
 if(wideLegs)drawGagaLegs(im,x,y,w,h,ax,ay,scale);
 else ctx.drawImage(im,x,y,w,h,-Math.round(ax*scale),-Math.round(ay*scale),Math.round(w*scale),Math.round(h*scale));return true;
}
function revisionAttackIndex(f){
 return attackTimeline(f).step;
}
function visualMode(f){
 if(game.roundOver)return null;
 if(f.buffTimer>0&&(f.key==='chapinha'||f.key==='gaga'))return f.key;
 if(f.key==='mucutuba'&&f.shockVisual>0)return 'mucutuba';
 return null;
}
const auraColors = {
 chapinha: ['#7d1525', '#ff3844', '#ffb456'],
 gaga: ['#603578', '#ceb0ee', '#fff3ff'],
 heal: ['#245b4e', '#67d9a2', '#eaffc2']
};

const mucutubaArcadeHeadRows=[13,16,17,27,26,17,28,19,16,16,33,28,15,56,21,16,16,14,18,14];
const mucutubaAirHeadRows=[53,53,53,55,48,48,48,51,50,52,49,50];

function mucutubaCrownHeight(f,t){
 if(f.action==='attack'&&f.basicMove){
  const frame=revisionAttackIndex(f);
  if(!f.basicMove.launch&&(f.attackStance==='air'||f.attackStance==='low'&&f.attackKind==='punch')){
   const row=f.attackStance==='low'?0:f.attackKind==='punch'?1:2;
   return (112-mucutubaAirHeadRows[row*4+frame])*f.c.size/64;
  }
 }
 const move=f.powerMove;
 if(move?.pose==='special'&&f.action==='special'&&powerAtlases.mucutuba.naturalWidth){
  const frames=powerFrames.mucutuba[move.slot];
  return frames[powerPoseIndex(move,frames.length)][5]*scaleFromIdle(f,62);
 }
 const pose=f.action==='attack'&&f.basicMove?.launch?[3,5,8,5][revisionAttackIndex(f)]:arcadePose(f,t);
 const size=Math.round(f.c.size*1.28);
 return Math.round(size*121/128)-mucutubaArcadeHeadRows[pose]*size/80;
}

function drawMucutubaElectricity(f,t,foreground){
 const low=f.action==='crouch'||f.lowGuard;
 const fallen=f.action==='down';
 const height=f.c.size*(fallen?.25:low?.60:.93);
 const width=f.c.size*(fallen?.40:.27);
 const lean=f.action==='hit'?-f.dir*f.c.size*.12:0;
 const phase=Math.floor(t*21);
 ctx.save();
 ctx.translate(Math.round(f.x),Math.round(f.y));
 ctx.lineJoin='bevel';
 for(let i=0;i<5;i++){
  const angle=t*4+i*Math.PI*2/5;
  const front=Math.sin(angle)>0;
  if(front!==foreground||(phase+i)%5===0)continue;
  const x=Math.round((Math.cos(angle)*width+lean)/4)*4;
  const y=Math.round((-height*(.22+.15*i))/4)*4;
  const zig=(phase+i)%2?1:-1;
  ctx.beginPath();
  ctx.moveTo(x-8*zig,y-17);
  ctx.lineTo(x+8*zig,y-5);
  ctx.lineTo(x-5*zig,y+4);
  ctx.lineTo(x+10*zig,y+14);
  ctx.strokeStyle='#206845';ctx.lineWidth=8;ctx.stroke();
  ctx.strokeStyle='#8fff59';ctx.lineWidth=4;ctx.stroke();
 }
 if(foreground&&!fallen){
  const y=Math.round(-mucutubaCrownHeight(f,t)-7);
  const x=Math.round(lean);
  poly([[x-20,y-2],[x-23,y-19],[x-10,y-12],[x,y-24],
   [x+10,y-12],[x+23,y-19],[x+20,y-2]],'#1e583a');
  poly([[x-16,y-5],[x-18,y-14],[x-9,y-8],[x,y-19],
   [x+9,y-8],[x+18,y-14],[x+16,y-5]],'#adff67');
 }
 ctx.restore();
}

function drawPersistentAura(f, t, foreground = false) {
 if (game.roundOver) return;
 const mode = visualMode(f) || (f.healthBuff > 0 ? 'heal' : null);
 if (!mode) return;
 if(mode==='mucutuba'){drawMucutubaElectricity(f,t,foreground);return;}

 const low = f.action === 'crouch' || f.action === 'down' ||
  (f.action === 'guard' && f.lowGuard) ||
  (f.action === 'attack' && f.attackStance === 'low');
 const fallen=f.action==='down';
 const recoil=f.action==='hit'||f.action==='grabbed';
 const height=f.c.size*(fallen?.42:low?.67:f.grounded?.97:.88);
 const width=f.c.size*(fallen?.59:mode==='gaga'?.46:.43);
 const recoilLean=recoil?-f.dir*f.c.size*.15:0;
 const [shadow, color, highlight] = auraColors[mode];
 const clock = Math.floor(t * 24) / 24;
 const pixel = 4;

 ctx.save();
 ctx.translate(Math.round(f.x), Math.round(f.y));
 function block(x, y, w, h, ink) {
  ctx.fillStyle = ink;
  ctx.fillRect(Math.round(x / pixel) * pixel, Math.round(y / pixel) * pixel, w, h);
 }

 if (!foreground && mode !== 'heal') {
  const auraHeight=height*1.20;
  const inner=mode==='chapinha'?'#ff6268':'#e5caff';
  for(let y=-auraHeight;y<=8;y+=pixel){
   const u=clamp((y+auraHeight)/(auraHeight+8),0,1);
   const envelope=Math.pow(Math.sin(u*Math.PI),.48);
   const waves=10*Math.sin(u*16+clock*11);
   const radius=width*(.40+.78*envelope);
   const lean=8*Math.sin(u*10-clock*9)*envelope+recoilLean*(1-u);
   const left=lean-radius+waves,right=lean+radius+waves*.5;
   const edge=8+4*Math.sin(u*15-clock*12);
   // Paint the edge separately so no opaque backing sits behind the fill.
   ctx.globalAlpha=.92;
   block(left-4,y,edge+4,pixel,shadow);
   block(right-edge,y,edge+4,pixel,shadow);
   ctx.globalAlpha=.68;
   block(left+edge,y,5,pixel,color);
   block(right-edge-5,y,5,pixel,color);
   ctx.globalAlpha=.23;
   block(left+edge+5,y,Math.max(0,right-left-2*edge-10),pixel,inner);

  }
 }

 if(mode==='gaga'){
  // Each cloud drifts outward from a shoulder and evaporates there.
  for(const side of [-1,1]){
   const front=side===f.dir;
   if(foreground!==front)continue;
   for(let i=0;i<2;i++){
    const age=(clock*.74+i*.5+(side<0?.22:0))%1;
    const x=side*(width*.68+age*37)+recoilLean*.64;
    const y=-height*.68-age*32+Math.sin(clock*5+i)*6;
    const grow=1+age*.35;
    ctx.globalAlpha=.82*Math.sin(age*Math.PI);
    // Nine stepped rows give the cloud rounded lobes and a shaded underside.
    const shape=[[-8,8],[-16,16],[-20,20],[-24,25],[-28,28],
                 [-28,29],[-24,28],[-19,23],[-11,15]];
    for(let row=0;row<shape.length;row++){
     const [left,right]=shape[row];
     block(x+Math.round(left*grow),y+row*4,Math.round((right-left)*grow),4,shadow);
     if(row>0&&row<8){
      const ink=row<4?highlight:color;
      block(x+Math.round(left*grow)+4,y+row*4,Math.round((right-left)*grow)-8,4,ink);
     }
    }
   }
  }
 }

 if(mode==='heal'){
  const lift=(clock*.42)%1;
  ctx.globalAlpha=.28+.40*Math.sin(lift*Math.PI);
  for(let i=0;i<64;i++){
   const angle=i*Math.PI/32;
   const depth=Math.sin(angle);
   if(foreground!==(depth>0))continue;
   const x=Math.cos(angle)*width*.9+recoilLean*.64;
   const y=-height*(.12+.68*lift)+depth*20;
   block(x,y,12,12,shadow);
   block(x,y,12,8,color);
   block(x,y,8,4,highlight);
  }
 }

 const motes=mode==='gaga'?0:mode==='chapinha'?3:2;
 for (let i = 0; i < motes; i++) {
  const angle = clock * (mode === 'gaga' ? 5 : 3.4) + i * Math.PI * 2 / motes;
  const depth = Math.sin(angle);
  if (foreground !== (depth > 0)) continue;
  const lift = (clock * .9 + i / motes) % 1;
  const x = Math.cos(angle) * (width + 10) + recoilLean*lift;
  const y = -8 - lift * height;
  ctx.globalAlpha = .28 + .48 * Math.sin(lift * Math.PI);
  if (mode === 'chapinha') {
   // Orange embers with a bright core.
   block(x, y, 12, 12, color);
   block(x + 4, y - 4, 8, 8, highlight);
  } else {
   block(x - 4, y, 12, 4, color);
   block(x, y - 4, 4, 12, highlight);
  }
 }
 ctx.restore();
}
const uppercutAtlas = imageAsset('assets/fighters/uppercuts.png');
const uppercutRows = {chapinha:0,pitufo:1};

const dinoUppercut=imageAsset('assets/fighters/dino-uppercut.png');
const uppercutTransitions = imageAsset('assets/fighters/uppercut-transitions.png');
const transitionRows = ['chapinha','pitufo','gaga','dino','pneuson','mucutuba'];

function drawUppercutTransition(f){
 if(!uppercutTransitions.naturalWidth)return false;
 const move=f.basicMove;
 const elapsed=move.duration-f.actionTime;
 const impact=move.impact;
 const recovery=impact+move.active;
 let column;
 if(elapsed>=impact-.033&&elapsed<impact)column=1;
 else if(elapsed>=impact*.35&&elapsed<impact*.60)column=0;
 else if(elapsed>=recovery&&elapsed<recovery+.05)column=2;
 else if(elapsed>=recovery+.05&&elapsed<recovery+.10)column=3;
 else return false;
 const scale=f.c.size/64;
 const row=transitionRows.indexOf(f.key);
 if(row<0)return false;
 ctx.drawImage(uppercutTransitions,column*96,row*96,96,96,
  Math.round(-48*scale),Math.round(-90*scale),Math.round(96*scale),Math.round(96*scale));
 return true;
}

function drawUppercut(f, step){
 const row=uppercutRows[f.key];
 if(row===undefined||!uppercutAtlas.naturalWidth)return false;
 const scale=f.c.size/64;
 ctx.drawImage(uppercutAtlas,step*96,row*96,96,96,
  Math.round(-48*scale),Math.round(-90*scale),Math.round(96*scale),Math.round(96*scale));
 return true;
}

const pneusonKickRecoil=imageAsset('assets/fighters/pneuson-kick-recoil.png');
const pneusonJabs=imageAsset('assets/fighters/pneuson-jabs.png');

function drawGrabbedFighter(f){
 const grab=f.grabbedBy?.grab;
 if(!grab)return false;
 const {rise,fall}=dinoThrowPhase(grab.clock);
 const phase=fall>0?2:rise>.5?1:0;
 if(f.key==='pneuson'&&pneusonAtlas.naturalWidth){
  drawPneusonFrame('dano',[1,2,3][phase]/6,f.c.size);
  return true;
 }
 if(f.key==='pitufo')return revisionFrame('pitufo',25+phase,f.c.size);

 if(f.key==='chapinha'&&visualMode(f)==='chapinha')return revisionFrame('chapinha',12,f.c.size);
 if(f.key==='dino'&&dinoAtlas.naturalWidth){
  const scale=f.c.size/64;
  ctx.drawImage(dinoAtlas,(phase+1)*100,600,100,120,
   Math.round(-50*scale),Math.round(-109*scale),Math.round(100*scale),Math.round(120*scale));
  return true;
 }
 if(['chapinha','gaga','mucutuba'].includes(f.key)&&arcadeSprites[f.key]?.naturalWidth){

  const pose=grab.clock<.05?5:12;
  const size=Math.round(f.c.size*1.28);
  ctx.drawImage(arcadeSprites[f.key],pose%5*80,Math.floor(pose/5)*80,80,80,
   -size/2,-Math.round(size*121/128),size,size);
  return true;
 }
 return false;
}

const gagaBellySlam=imageAsset('assets/fighters/gaga-belly-slam.png');

function drawRevisionFighter(f,t){
 if(game.roundOver){
  if(f.key==='dino'&&game.winner===f.player){revisionFrame('dino',24+Math.min(3,Math.floor((2.45-game.resultTime)*5)),f.c.size);return true;}
  return false;
 }
 const mode=visualMode(f),a=f.action,step=f.basicMove?revisionAttackIndex(f):0;
 if(f.key==='gaga'&&a==='special'&&f.specialSlot===1&&f.powerMove&&gagaBellySlam.naturalWidth){
  const frame=!f.powerMove.fired?0:f.pendingGroundPunch?
   (f.vy< -310?1:f.vy<0?2:f.vy<160?3:f.vy<380?4:5):
   f.actionTime>.09?6:7;
  const scale=f.c.size/64;
  ctx.drawImage(gagaBellySlam,frame*112,0,112,96,
   Math.round(-56*scale),Math.round(-84*scale),Math.round(112*scale),Math.round(96*scale));
  return true;
 }
 if(drawGrabbedFighter(f))return true;
 if(f.key==='dino'&&a==='ultimate'&&f.powerMove){
  const elapsed=f.powerMove.elapsed;
  if(elapsed<.72){
   const growth=clamp((elapsed-.25)/.47,0,1);
   const lift=clamp((elapsed-.48)/.24,0,1);
   ctx.save();
   ctx.translate(0,-Math.round(lift*lift*(FLOOR+110)));
   const scale=1+.84*growth*growth;
   ctx.scale(scale,scale);
   const pose=Math.min(3,Math.floor(elapsed/.52*4));
   revisionFrame('dino',pose,f.c.size);
   ctx.restore();
  }else if(elapsed>=1.3){
   const progress=clamp((elapsed-1.3)/.39,0,1);
   ctx.save();
   const scale=1+.33*(1-progress)*(1-progress);
   ctx.scale(scale,scale);
   revisionFrame('dino',28+Math.min(3,Math.floor(progress*4)),f.c.size);
   ctx.restore();
  }
  return true;
 }
 if(f.key==='chapinha'&&a==='ultimate'&&f.powerMove){revisionFrame('chapinhaCombat',12+Math.min(3,Math.floor(f.powerMove.elapsed/(f.c.powers[2].duration/60)*4)),f.c.size);return true;}
 if(f.key==='gaga'&&a==='ultimate'&&f.powerMove&&arcadeSprites.gaga?.naturalWidth){
  const pose=f.powerMove.fired?5:3;
  const size=Math.round(f.c.size*1.28);
  if(mode==='gaga'){
   drawGagaLegs(arcadeSprites.gaga,pose%5*80,Math.floor(pose/5)*80,80,80,40,80*121/128,size/80);
  }else{
   ctx.drawImage(arcadeSprites.gaga,pose%5*80,Math.floor(pose/5)*80,80,80,
    -size/2,-Math.round(size*121/128),size,size);
  }
  return true;
 }
 if(a==='attack'&&f.basicMove?.launch){
  const base={chapinha:20,gaga:20,mucutuba:20,dino:8,pitufo:0,pneuson:0}[f.key];
  if(mode==='chapinha')return revisionFrame('chapinha',[5,3,8,5][step],f.c.size);
  if(f.key==='dino'&&step>0&&dinoUppercut.naturalWidth){
   const scale=f.c.size/64;
   ctx.drawImage(dinoUppercut,(step-1)*100,0,100,120,
    -Math.round(50*scale),-Math.round(109*scale),Math.round(100*scale),Math.round(120*scale));
   return true;
  }
  if(f.key!=='dino'&&!mode&&drawUppercutTransition(f))return true;
  if(!mode&&drawUppercut(f,step))return true;

  // Original character sheets keep the same face and clothes as normal play.
  if((!mode||mode==='gaga'||mode==='mucutuba')&&(f.key==='gaga'||f.key==='mucutuba')&&arcadeSprites[f.key]?.naturalWidth){
   const pose=[3,5,8,5][step];
   const size=Math.round(f.c.size*1.28);
   if(mode==='gaga'){
    drawGagaLegs(arcadeSprites.gaga,pose%5*80,Math.floor(pose/5)*80,80,80,40,80*121/128,size/80);
   }else{
   ctx.drawImage(arcadeSprites[f.key],pose%5*80,Math.floor(pose/5)*80,80,80,
    -size/2,-Math.round(size*121/128),size,size);
   }
   return true;
  }
  if(f.key==='pneuson'&&pneusonAtlas.naturalWidth){
   drawPneusonFrame('uppercut',[0,2,4,6][step]/7,f.c.size);
   return true;
  }
  if(f.key==='dino'&&dinoAtlas.naturalWidth){
   const [row,col]=[[9,2],[2,1],[6,4],[2,0]][step];
   const scale=f.c.size/64;
   ctx.drawImage(dinoAtlas,col*100,row*120,100,120,-Math.round(50*scale),
    -Math.round(109*scale),Math.round(100*scale),Math.round(120*scale));
   return true;
  }

  return revisionFrame(f.key,base+4+step,f.c.size);
 }
 if(mode==='chapinha'){
  if(a==='special'&&f.specialSlot===1&&f.powerMove){
   if(f.pendingGroundPunch){
    const pose=f.vy< -200?4:8;
    return revisionFrame('chapinha',pose,f.c.size);
   }
   const pose=f.actionTime>.085?16:f.actionTime>.035?6:5;
   return revisionFrame('chapinha',pose,f.c.size);
  }
  if(a==='attack'&&(f.attackStance==='air'||f.attackStance==='low'&&f.attackKind==='punch')){
   const row=f.attackStance==='low'?0:f.attackKind==='punch'?1:2;
   revisionFrame('chapinhaCombat',row*4+step,f.c.size);return true;
  }
  revisionFrame('chapinha',arcadePose(f,t),f.c.size);return true;
 }
 if(f.key==='pneuson'&&a==='attack'&&f.attackKind==='punch'&&
    (f.attackStance==='low'||f.attackStance==='air')&&pneusonJabs.naturalWidth){
  const scale=f.c.size/64;
  const low=f.attackStance==='low';
  const poseScale=scale*(low?1.22:1);
  ctx.drawImage(pneusonJabs,step*80,low?0:80,80,80,
   Math.round(-40*poseScale),Math.round(-76*poseScale),Math.round(80*poseScale),Math.round(80*poseScale));
  return true;
 }
 if(f.key==='pneuson'&&pneusonKickRecoil.naturalWidth){
  const airKick=a==='attack'&&f.attackStance==='air'&&f.attackKind==='kick';
  if(airKick||a==='hit'){
   let frame;
   if(airKick){
    const move=f.basicMove,elapsed=move.duration-f.actionTime;
    const after=elapsed-move.impact-move.active;
    if(elapsed<move.impact)frame=clamp(Math.floor(elapsed/move.impact*3),0,2);
    else if(after<=0)frame=3;
    else frame=after<.065?4:5;
   }else{
    const duration=f.hitPoseDuration||.4;
    frame=clamp(Math.floor((1-f.actionTime/duration)*6),0,5);
   }
   const scale=f.c.size/64;
   ctx.drawImage(pneusonKickRecoil,frame*80,airKick?0:80,80,80,
    Math.round(-40*scale),Math.round(-76*scale),Math.round(80*scale),Math.round(80*scale));
   return true;
  }
 }
 if(f.key==='pneuson'&&a==='special'&&f.powerMove&&pneusonAtlas.naturalWidth){
  const move=f.powerMove;
  const elapsed=move.elapsed-move.contact;
  const tire=move.slot===1;
  const preparation=clamp(move.elapsed/Math.max(move.contact,.001),0,1);
  // Pick up and wind back with the same atlas used for idle and walking.
  // At release the separate projectile takes over from the held tire.
  if(tire){
   const frame=move.fired?(elapsed<.11?6:7):Math.min(5,Math.floor(preparation*6));
   drawPneusonFrame('pneu',(frame+.25)/8,f.c.size,false,frame===6?57:null);
  }else{
   const frame=move.fired?(elapsed<.10?5:6):Math.min(4,Math.floor(preparation*5));
   drawPneusonFrame('graxa',(frame+.25)/7,f.c.size);
  }
  return true;
 }
 // Keep regular combat on the same mechanic atlas as walking and idle.
 if(f.key==='pneuson'&&pneusonAtlas.naturalWidth&&!f.powerMove)return false;
 if(a==='attack'&&(f.attackStance==='air'||f.attackStance==='low'&&f.attackKind==='punch')){
  const base=['chapinha','gaga','mucutuba'].includes(f.key)?20:f.key==='dino'?8:0;
  const row=f.attackStance==='low'?0:f.attackKind==='punch'?1:2;
  revisionFrame(f.key,base+row*4+step,f.c.size,mode==='gaga');return true;
 }
 if(['pitufo','pneuson'].includes(f.key)){
  if(a==='attack'&&f.attackStance==='low'&&f.attackKind==='kick'){revisionFrame(f.key,28+step,f.c.size);return true;}
  if(a==='hit'){revisionFrame(f.key,24+Math.min(3,Math.floor((1-f.actionTime/.5)*4)),f.c.size);return true;}
  if(f.powerMove&&a===f.powerMove.pose){const m=f.powerMove;
   if(f.key==='pneuson'&&m.slot===2&&ultimateAtlas.naturalWidth)return false;
   const row=m.slot===2?5:f.key==='pitufo'?(m.slot===1?3:4):m.slot===0?3:4;
   // On release the separate projectile takes over. Don't duplicate the tire/mini baked in pose 2.
   let idx=powerPoseIndex(m);
   if(m.fired&&f.key==='pitufo'&&m.slot===1){
    const elapsed=m.elapsed-m.contact;
    idx=elapsed<.065?3:elapsed<.14?1:0;
   }else if(m.fired&&f.key==='pneuson'&&m.slot<2){
    const elapsed=m.elapsed-m.contact;
    if(m.slot===1&&elapsed<.10&&revisionAtlases.pneuson.naturalWidth){
     // Draw the throwing pose up to the hand; the live tire supplies the flame.
     const scale=f.c.size/64;
     ctx.drawImage(revisionAtlases.pneuson,256,512,56,128,
      Math.round(-39*scale),Math.round(-112*scale),Math.round(56*scale),Math.round(128*scale));
     return true;
    }
    idx=m.slot===0&&elapsed<.10?1:3;
   }
   revisionFrame(f.key,row*4+idx,f.c.size);return true;
  }
 }
 if(f.key==='dino'&&a==='grab'&&f.grab){
  const clock=f.grab.clock;
  const {grip,lift,drop}=DINO_THROW;
  const pose=clock<grip*.5?20:clock<lift?21:clock<drop?22:20;
  return revisionFrame('dino',pose,f.c.size);
 }
 if(f.key==='dino'&&a==='throwRecovery'){
  return revisionFrame('dino',f.actionTime>.14?20:23,f.c.size);
 }

 return false;
}
function drawPrimalFoot(){
 if(game.roundOver)return;
 for(const f of game.f){
  const move=f.powerMove;
  if(f.key!=='dino'||f.action!=='ultimate'||!move)continue;
  const t=move.elapsed;
  if(t<.55||t>=1.3)continue;
  const impact=move.contact;
  const travel=clamp((t-.55)/Math.max(.001,impact-.55),0,1);
  const exit=clamp((t-impact-.125)/Math.max(.001,1.3-impact-.125),0,1);
  const floor=FLOOR+2;
  const lift=(1-travel*travel)*(FLOOR+35)+exit*exit*(FLOOR+100);
  const target=game.f[1-f.player];
  const x=move.stompX??target.x;

  // The sole stays planted for the impact beat. The enlarged shin extends
  // past the top edge even at the lowest point, so no cut edge is visible.
  ctx.save();
  ctx.globalAlpha=(.15+.38*travel)*(1-exit);
  ctx.fillStyle='#0b0810';
  ctx.beginPath();
  ctx.ellipse(x,floor,74+travel*155,8+travel*13,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(Math.round(x),Math.round(floor-lift));
  ctx.scale(f.dir,1);
  const pose=t<impact?4:exit===0?6:7;
  revisionFrame('dino',pose,64*14);
  ctx.restore();
 }
}
