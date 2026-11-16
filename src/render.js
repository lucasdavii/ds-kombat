'use strict';

// Desenho da arena, lutadores, efeitos e HUD, em ordem de profundidade.

function pixelText(text,x,y,size=26,color='#fff',align='left',outline=5){ctx.save();ctx.font=`900 ${size}px Impact, "Arial Black", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=outline;ctx.strokeStyle='#09060d';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function poly(pts,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();ctx.fill();}
function renderBackdrop(t){if(court.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(court,0,0,W,H);return;}const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#121023');grd.addColorStop(.5,'#4a223a');grd.addColorStop(1,'#1b1018');rect(0,0,W,H,grd);
 // Estádio urbano noturno — fundo original renderizado por Canvas.
 const glow=ctx.createRadialGradient(640,260,55,640,260,470);glow.addColorStop(0,'#84365088');glow.addColorStop(1,'#46263a00');rect(0,0,W,540,glow);
 for(let i=0;i<20;i++){const x=i*74-34,h=105+((i*47)%140);rect(x,340-h,62,h,'#1c1b2c');for(let wy=348-h;wy<333;wy+=18)for(let wx=x+10;wx<x+56;wx+=18)if((wy+wx)%4>0)rect(wx,wy,7,10,'#59405955');}
 // alambrado na arena
 for(let x=0;x<W+25;x+=51)rect(x,320,4,212,'#353449');rect(0,326,W,6,'#51485d');for(let y=330;y<529;y+=36){ctx.strokeStyle='#51415888';ctx.lineWidth=1;for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+25,y+20);ctx.lineTo(x+50,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+20);ctx.lineTo(x+25,y);ctx.lineTo(x+50,y+20);ctx.stroke();}}
 rect(0,502,W,36,'#261c2f');for(let i=0;i<120;i++){let x=i*19,y=526+Math.sin(i*2)*5;rect(x,y,14,12,['#231725','#311c2e','#532336'][i%3]);}
 rect(0,FLOOR,W,H-FLOOR,'#1e1a26');rect(0,FLOOR-7,W,7,'#e25464');rect(0,FLOOR+12,W,3,'#583b48');for(let i=0;i<14;i++){let yy=FLOOR+20+i*i*0.7;rect(0,yy,W,1,i%2?'#3b303a':'#2d2630');}for(let x=-180;x<W+300;x+=155){ctx.strokeStyle='#37333a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(640+(x-640)*.45,FLOOR);ctx.lineTo(x,H);ctx.stroke();}
 // Luzes e banners no topo
 rect(0,0,W,16,'#07070c');rect(0,24,W,3,'#5b2c44');for(let i=0;i<7;i++){const x=105+i*180;ctx.globalAlpha=.15+.07*Math.sin(t*2+i);const rg=ctx.createRadialGradient(x,90,4,x,260,175);rg.addColorStop(0,i%2?'#ad78ff':'#ff7196');rg.addColorStop(1,'#ff719600');rect(x-160,80,320,360,rg);ctx.globalAlpha=1;rect(x-4,46,8,12,'#ffebbb');}
 pixelText('DS KOMBAT',639,396,95,'#211725','center',8);
}
function drawFighterShadow(f) {
 const lift = clamp((FLOOR - f.y) / 210, 0, 1);
 const width = f.c.size * (.31 - .10 * lift);
 ctx.save();
 ctx.fillStyle = '#100a18';
 // Keep the shadow at floor level as the fighter rises.
 for (const layer of [1, .76, .48]) {
  ctx.globalAlpha = (.14 - .09 * lift);
  ctx.beginPath();
  ctx.ellipse(f.x + 12 * lift, FLOOR + 5, width * layer, 13 * layer, 0, 0, Math.PI * 2);
  ctx.fill();
 }
 if (f.grounded) {
  // Darken the small area where the sprite meets the floor.
  ctx.globalAlpha = .32;
  ctx.beginPath();
  ctx.ellipse(f.x, FLOOR, width * .65, 4, 0, 0, Math.PI * 2);
  ctx.fill();
 }
 ctx.restore();
}
function drawFighter(f,t){const current=f.action;let st=current;
 if(current==='quickStep')st='walk';
 if(current==='walk')st=(Math.floor(f.walkClock*8)%2===0&&assets[`assets/fighters/${f.key}_walk.png`]?.complete)?'walk':'idle';
 if(current==='attack'&&f.key==='gaga')st='attack';if(current==='jump')st=f.key==='gaga'?'jump':'run';if(current==='hit')st='hit';if(current==='guard')st='guard';if(current==='special')st=f.key==='pneuson'?'special':f.key==='gaga'?'special':f.key==='dino'?'special':f.key==='mucutuba'?'special':'attack';if(current==='crouch')st='crouch';
 const fallback=assets[`assets/fighters/${f.key}_idle.png`],img=assets[`assets/fighters/${f.key}_${st}.png`]?.naturalWidth?assets[`assets/fighters/${f.key}_${st}.png`]:fallback;
 pixelText('P'+(f.player+1),f.x,FLOOR+26,15,f.player?'#ff8ea7':'#69daff','center',2);
 const c=f.c,h=c.size*(st==='crouch'?.81:st==='ultimate'&&f.key==='dino'?1.9:1),iw=img?.naturalWidth||80,ih=img?.naturalHeight||100;
 let spriteW=iw/ih*h;
 // Algumas poses incluem projéteis ou aura; limitamos a largura para os sprites não dominarem a tela.
 spriteW=Math.min(spriteW,410);

 if(typeof drawPersistentAura==='function')drawPersistentAura(f,t);
 ctx.save();ctx.translate(f.x,f.y);
 if(f.grabbedBy?.grab&&!f.grabbedBy.grab.basic){
  const grab=f.grabbedBy.grab;
  const {rise,fall}=dinoThrowPhase(grab.clock);
  const tilt=rise*(.76+.72*fall);
  const shoulder=f.c.size*.61;
  ctx.translate(0,-shoulder);
  ctx.rotate(-grab.dir*tilt);
  ctx.translate(0,shoulder);
 }
 ctx.scale(f.dir,1);if(f.hitFlash>0)ctx.filter='brightness(1.12)';ctx.imageSmoothingEnabled=false;
 if(f.key==='kingbum'){
  drawKingBum(f);
 }else if(drawMovementPose(f)){
  // O movimento tem sua própria sequência.
 }else if(typeof drawRevisionFighter==='function'&&drawRevisionFighter(f,t)){
  // Reviewed revision sprites take precedence over legacy poses.
 }else if(drawPower(f)){
  // A sequência do poder já foi desenhada.
 }else if(current==='ultimate'&&f.key==='pneuson'&&ultimateAtlas.naturalWidth){
  const index=Math.min(7,Math.floor((.88-f.actionTime)/CALL_TIME*8));
  drawUltimateFrame('call',Math.max(0,index),f.c.size/165);
 }else if(f.key==='pneuson'&&pneusonAtlas.naturalWidth){
  if(f.lastPose!==f.action){f.lastPose=f.action;f.poseStart=t;}
  const [key,progress,loop]=pneusonPose(f,t);
  if(key==='recuar')ctx.scale(-1,1);
  drawPneusonFrame(key,progress,c.size*(key==='guarda_baixa'?1.22:1),loop);
 }else if(f.key==="dino"&&dinoAtlas.naturalWidth){
  drawDino(f);
 }else if(arcadeSprites[f.key]?.naturalWidth){
  const pose=arcadePose(f,t),size=Math.round(c.size*1.28);
  if(f.key==='gaga'&&f.buffTimer>0&&!game.roundOver){
   drawGagaLegs(arcadeSprites.gaga,pose%5*80,Math.floor(pose/5)*80,80,80,40,80*121/128,size/80);
  }else{
  ctx.drawImage(arcadeSprites[f.key],pose%5*80,Math.floor(pose/5)*80,80,80,-size/2,-Math.round(size*121/128),size,size);
  }
 }else if(img?.naturalWidth){ctx.drawImage(img,-spriteW/2,-h,spriteW,h);}else{rect(-33,-150,66,150,c.accent);}
 if(f.key==='pitufo'&&current==='special'&&f.specialSlot===1&&f.actionTime<=.31&&!(typeof revisionAtlases!=='undefined'&&revisionAtlases.pitufo?.naturalWidth)){
  ctx.save();
  ctx.scale(c.size/245,c.size/245);
  ctx.translate(84,-154);
  rect(0,0,72,27,'#21182d');
  rect(8,5,55,16,'#6c4ca0');
  rect(8,5,55,4,'#b191d0');
  rect(13,23,18,22,'#21182d');
  rect(17,25,10,15,'#79523c');
  rect(59,-3,16,33,'#21182d');
  rect(62,2,9,23,'#e6b45d');
  ctx.restore();
 }
 ctx.restore();
 if(f.block){ctx.strokeStyle='#8addff';ctx.lineWidth=6;ctx.globalAlpha=.5+.1*Math.sin(t*14);ctx.beginPath();ctx.ellipse(f.x+f.dir*34,f.y-110,56,100,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 if(typeof drawPersistentAura==='function')drawPersistentAura(f,t,true);
}
function drawParticles(){for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);rect(p.x,p.y,p.r,p.r,p.color);}ctx.globalAlpha=1;}
// Draw at a 32-row pixel grid while keeping the old height in the arena.
function drawMiniPitufo(t, pixel, armed=false){
 const unit=pixel/2;
 const ink='#101626';
 const blue='#2785c4', light='#64c5f5', shade='#175083';
 const white='#fff2dc', fold='#aeb4ca';
 const stride=Math.floor(t*12)%4;
 const step=[-4,-1,4,1][stride];

 const box=(x,y,w,h,color)=>rect(x*unit,y*unit,w*unit,h*unit,color);
 const shape=(points,color)=>poly(points.map(([x,y])=>[x*unit,y*unit]),color);

 // Back leg, then front leg. The shoes have separate silhouettes as he runs.
 for(const side of [-1,1]){
  const x=side*4+side*step;
  const y=side*step>0?-3:0;
  shape([[side*4,-12],[x-4,-7+y],[x-7,-4+y],[x-7,-1+y],
   [x+4,-1+y],[x+6,-4+y],[x+4,-7+y],[side*4+4,-12]],ink);
  box(x-4,-7+y,7,4,side<0?fold:white);
  box(x-6,-4+y,10,2,white);
 }
 shape([[-6,-15],[5,-15],[7,-11],[4,-8],[-6,-8],[-8,-11]],ink);
 box(-6,-14,11,5,white);
 box(-6,-11,11,2,fold);

 // Torso, round face and nose.
 shape([[-5,-19],[4,-19],[8,-16],[7,-12],[-7,-12],[-8,-15]],ink);
 box(-6,-17,12,4,blue);
 box(-5,-16,6,3,light);
 shape([[-8,-25],[6,-25],[9,-22],[12,-21],[12,-18],[7,-17],
  [6,-15],[-5,-15],[-9,-18]],ink);
 box(-7,-23,14,6,blue);
 box(-7,-21,3,4,shade);
 box(6,-21,5,3,light);
 box(-4,-18,8,2,light);
 box(2,-17,4,1,ink);

 // Sunglasses, with a short bridge and reflective pixels in each lens.
 box(-5,-23,14,2,ink);
 box(-4,-22,5,3,ink);
 box(3,-22,5,3,ink);
 box(-3,-22,2,1,'#929bb5');
 box(4,-22,2,1,'#929bb5');

 // The floppy white cap has a pale crown and a shaded lower fold.
 shape([[-9,-24],[-11,-27],[-10,-30],[-6,-32],[2,-32],[7,-30],
  [8,-27],[6,-24],[0,-24],[-4,-22],[-8,-22]],ink);
 shape([[-8,-25],[-9,-27],[-8,-30],[-5,-31],[2,-31],[6,-29],
  [6,-26],[0,-26],[-4,-23],[-7,-23]],white);
 shape([[-8,-25],[-3,-27],[1,-28],[6,-28],[6,-26],[0,-26],[-4,-23],[-7,-23]],fold);

 if(armed){
  // Leave a gap below the long barrel so it reads as a pistol at game scale.
  shape([[7,-18],[18,-18],[21,-17],[21,-13],[13,-13],[10,-9],[6,-9],[7,-14]],ink);
  box(8,-17,12,2,'#828da1');
  box(13,-15,7,1,'#465269');
  box(19,-17,2,4,'#293348');
  box(20,-16,1,2,'#0b101c');
  box(7,-13,3,3,'#33384b');
  box(5,-14,4,4,blue);
  box(6,-14,2,2,light);
 }else{
  box(-9,-17,4,5,ink);
  box(-8,-16,3,3,light);
 }
}

function drawProjectiles(t=reviewClock){for(const p of projectiles){ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
 if(typeof drawPowerProjectile==='function'&&drawPowerProjectile(p)){ctx.restore();continue;}
 if(pneusonAtlas.naturalWidth&&(p.type==='tire'||p.type==='grease')){
  ctx.scale(p.dir,1);drawPneusonFrame(p.type==='tire'?'pneu_fx':'graxa_fx',t*1.8,p.radius*2,true);
  ctx.restore();continue;
 }
 if(p.type==='pitufo'){
  ctx.scale(p.dir,1);
  const phase=Math.floor((p.age||0)*30)%3;
  // Leave the face unobstructed and put the streak behind the flight path.
  for(let i=0;i<3;i++){
   const tail=phase*5+i*8;
   rect(-58-tail,-13+i*11,27+i*5,4,'#286d9e');
   rect(-46-tail,-15+i*11,22,3,'#8ddfff');
  }
  ctx.rotate(Math.PI/2);
  ctx.translate(0,34);
  drawMiniPitufo(p.age||0,4.25);
  ctx.restore();continue;
 }
 ctx.rotate(t*8*p.dir);
 if(p.type==='tire'){ctx.strokeStyle='#1a171b';ctx.lineWidth=17;ctx.beginPath();ctx.arc(0,0,p.radius,0,7);ctx.stroke();ctx.strokeStyle='#6c6b78';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,p.radius-1,0,7);ctx.stroke();ctx.fillStyle='#e3a04c';ctx.beginPath();ctx.arc(0,0,13,0,7);ctx.fill();ctx.strokeStyle='#ffad34';ctx.lineWidth=7;ctx.beginPath();ctx.arc(-5,-1,46,0,2.7);ctx.stroke();}
 else if(p.type==='grease'){ctx.fillStyle='#131018';ctx.beginPath();ctx.ellipse(0,0,p.radius,p.radius*.8,0,0,7);ctx.fill();ctx.fillStyle='#9167c9';ctx.fillRect(-9,-15,19,6);}
 else{ctx.globalAlpha=.75;ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.radius*1.2,p.radius*.65,0,0,7);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#ecffe9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-p.radius,0);ctx.lineTo(p.radius,0);ctx.stroke();}
 ctx.restore();}}

function drawMinions(){for(const m of minions){if(m.delay>0)continue;if(m.type==='pitufo'){
  ctx.save();ctx.translate(Math.round(m.x),Math.round(m.y));ctx.scale(m.dir,1);
  const age=m.activeAge??0;
  const entry=clamp(age/.16,0,1);
  const runClock=age*(1+.25*entry);
  const stride=Math.floor(runClock*12)%4;
  if(m.fromHouse){
   ctx.globalAlpha=clamp(.30+entry,0,1);
   const grow=.82+.18*entry;
   ctx.scale(grow,grow);
  }
  rect(-27,-3,57,5,'#201925');
  if(entry>.5){
   for(let i=0;i<3;i++)rect(-23-i*9-stride*3,-5-i*4,7,4,i===0?'#eee0bc':'#99836c');
  }
  ctx.translate(0,-Math.round(Math.sin(entry*Math.PI)*10)-(stride%2?4:0));
  ctx.rotate(.10*entry);
  drawMiniPitufo(runClock,5,true);
  ctx.restore();
 }
 else if(m.type==='brother'&&ultimateAtlas.naturalWidth){
  const count=m.phase==='entry'?pneusonUltimateFrames.entry.length:m.phase==='attack'?7:pneusonUltimateFrames.exit.length;
  const duration=m.phase==='attack'?STRIKE_FRAME:EXIT_FRAME;
  const step=Math.floor(m.clock/duration);
  const index=m.phase==='entry'?step%count:Math.min(count-1,step);
  ctx.save();ctx.translate(Math.round(m.x),m.y);
  ctx.scale(m.dir*(m.phase==='exit'?-1:1),1);
  if(m.phase!=='attack'){
   rect(-48,-3,92,6,'#261a24');
   for(let i=0;i<4;i++)rect(-38-i*12-(step%3)*5,-5-i*5,8,5,i<2?'#e2b781':'#89634f');
  }
  drawUltimateFrame(m.phase,index,1.35);ctx.restore();
 }
}}
// Efeitos, HUD e ferramentas de treino
function drawFX(t,foreground=false){for(const v of visualFX){if(foreground!==(v.type==='contact'||v.type==='guardContact'||v.type==='pitufoMuzzle'||v.type==='workshopRelease'||v.type==='dinoBeam'||v.type==='lightning'||v.type==='ancestorImpact'||v.type==='slamDebris'||v.type.startsWith('king')))continue;const q=1-v.life/v.max;ctx.save();ctx.globalAlpha=clamp(v.life/v.max,0,1);const c=v.color;if(v.type.startsWith('king')&&drawKingEffect(v,q)){ctx.restore();continue;}if(typeof drawPowerEffect==='function'&&drawPowerEffect(v,q,t)){ctx.restore();continue;}switch(v.type){
 case 'burst':ctx.strokeStyle=c;ctx.lineWidth=6;ctx.beginPath();ctx.arc(v.x,v.y,v.radius*(.6+q),0,7);ctx.stroke();break;
 case 'slash':ctx.strokeStyle=c;ctx.lineWidth=10;ctx.beginPath();ctx.arc(v.x,v.y,v.radius,Math.PI*1.12,Math.PI*1.95);ctx.stroke();break;
 case 'shock':ctx.strokeStyle=c;ctx.lineWidth=10;ctx.beginPath();ctx.ellipse(v.x,FLOOR+3,v.radius*q,22,0,0,7);ctx.stroke();break;
 case 'shield':ctx.strokeStyle=c;ctx.lineWidth=8;ctx.beginPath();ctx.arc(v.x,v.y,v.radius,0,7);ctx.stroke();break;
 case 'inflate':ctx.fillStyle=rgba(c,.24);ctx.beginPath();ctx.ellipse(v.x,v.y,82+q*22,80+q*14,0,0,7);ctx.fill();break;
 case 'stretch':ctx.strokeStyle=c;ctx.lineWidth=23;ctx.beginPath();ctx.moveTo(v.x,v.y);ctx.lineTo(v.x+v.dir*260*q,v.y);ctx.stroke();break;
 case 'stomp':{ctx.strokeStyle=c;ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(v.x,FLOOR-8,v.radius*q,31,0,0,7);ctx.stroke();break;}
 case 'kingBread':{
  const x=Math.round(v.x+v.direction*q*76),y=Math.round(v.y+q*q*138);
  rect(x-12,y-7,24,14,'#553120');rect(x-9,y-7,18,11,c);rect(x-5,y-5,10,4,'#ffe0a1');
  break;
 }
 case 'heal':ctx.strokeStyle=c;ctx.lineWidth=7;ctx.beginPath();ctx.arc(v.x,v.y,v.radius*(1+q),0,7);ctx.stroke();break;
 case 'ancestor':{ctx.strokeStyle=c;ctx.lineWidth=5;for(let j=-1;j<=1;j++){let xx=v.x+j*65;ctx.beginPath();ctx.arc(xx,v.y-25,16,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(xx,v.y-8);ctx.lineTo(xx,v.y+45);ctx.stroke();}break;}
 case 'lightning':{ctx.strokeStyle=c;ctx.lineWidth=8;for(let j=0;j<7;j++){ctx.beginPath();let x=v.x+(j-3)*42;ctx.moveTo(x,-15);for(let y=24;y<v.y+130;y+=45)ctx.lineTo(x+Math.sin(y+j*8+t*23)*25,y);ctx.stroke();}break;}
 case 'house':{
  if(pitufoHouse.naturalWidth){
   const emerge=clamp((v.max-v.life)/.25,0,1);
   const h=Math.round(330*(.73+.27*(1-(1-emerge)**2)));
   const w=Math.round(h*pitufoHouse.naturalWidth/pitufoHouse.naturalHeight);
   ctx.save();
   ctx.globalAlpha=Math.min(1,emerge*2,v.life*6);
   ctx.drawImage(pitufoHouse,Math.round(v.x-w/2),v.y-h,w,h);
   ctx.restore();
  }
  break;
 }
 case 'guardContact':{
  const x=v.x,y=v.y,d=v.direction;
  poly([[x,y-37],[x+12*d,y-20],[x+16*d,y],[x+12*d,y+20],[x,y+37],[x+4*d,y+12],[x+4*d,y-12]],'#449add');
  poly([[x,y-27],[x+8*d,y-13],[x+10*d,y],[x+8*d,y+13],[x,y+27],[x+4*d,y]],v.color);
  break;
 }
 case 'workshopRelease':{
  for(let i=0;i<7;i++){
   const dx=(i%3+1)*q*35*v.direction;
   const dy=(i-3)*q*12+q*q*16;
   const color=v.tire?(i%2?'#ffc35c':'#ff6632'):(i%3?'#282632':'#858090');
   const size=Math.max(4,Math.round((1-q)*9));
   rect(Math.round(v.x+dx),Math.round(v.y+dy),size+4,size,color);
  }
  break;
 }
 case 'pitufoMuzzle':{
  const x=v.x,y=v.y,d=v.direction;
  const length=24+Math.floor(q*4)*8;
  poly([[x-7*d,y],[x+9*d,y-15],[x+(length*.65)*d,y-7],
   [x+length*d,y],[x+(length*.65)*d,y+7],[x+9*d,y+15]],'#43b8f4');
  rect(x-4,y-4,16,8,v.color);
  break;
 }
 case 'contact':{
  const r=v.radius*(.6+q*.45),x=v.x,y=v.y;
  ctx.save();ctx.globalAlpha=1-q;
  poly([[x-r,y],[x-7,y-6],[x-13,y-r],[x+3,y-10],[x+r,y-16],[x+10,y+2],[x+18,y+r],[x-4,y+10]],'#df7a39');
  poly([[x-r*.6,y],[x-3,y-4],[x+2,y-r*.65],[x+6,y-4],[x+r*.65,y-9],[x+8,y+4],[x+9,y+r*.55],[x-3,y+6]],c);
  ctx.restore();break;
 }
 case 'text':pixelText(v.text,v.x,v.y-q*36,Math.max(18,v.text.length>22?27:34),c,'center',5);break;
 case 'trail':ctx.strokeStyle=c;ctx.lineWidth=6;for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(v.x-155,v.y+j*21-35);ctx.lineTo(v.x-35,v.y+j*21-35);ctx.stroke();}break;
 }ctx.restore();}}
// Emblemas em pixel art: estrela, cogumelo, mola, coroa, garra e pneu.
const fighterEmblems={
 kingbum:['1010101','1111111','0111110','0111110','0111110','0111110','0000000'],
 chapinha:['0001000','0001000','1111111','0111110','0011100','0110110','0100010'],
 pitufo:['0011100','0111110','1111111','1111111','0011100','0011100','0111110'],
 gaga:['1111100','0000110','0111100','1100000','0111100','0000110','0011100'],
 mucutuba:['1001001','1101011','1111111','1111111','0111110','0111110','0000000'],
 dino:['0010010','0110110','0110110','0110110','1111110','1111110','0111100'],
 pneuson:['0011100','0111110','1100011','1100011','1100011','0111110','0011100'],
};

function drawFighterEmblem(key,x,y,color){
 const glyph=fighterEmblems[key];
 if(!glyph)return;
 for(let row=0;row<7;row++)for(let col=0;col<7;col++){
  if(glyph[row][col]==='1')rect(x+col*3,y+row*3,3,3,color);
 }
}

const hudInk='#ffe9cb';
const healthMeter={track:'#662a46',rim:'#f3a2a3',body:'#dc3951',shine:'#ff8591',shade:'#a82040'};
const lowHealthMeter={...healthMeter,body:'#f14148',shine:'#ffc0a1'};
const guardMeter={track:'#404d67',rim:'#b6d6eb',body:'#79b7df',shine:'#bbebff',shade:'#4f80ae'};
const ultimateMeter={track:'#705139',rim:'#f6d288',body:'#eeb338',shine:'#fff09f',shade:'#ba7426'};
const readyMeter={...ultimateMeter,body:'#ffcf51',shine:'#fff9bd'};

// Degraus feitos com retângulos inteiros para manter os cantos nítidos.
function hudGauge(x,y,w,h,ratio,palette,reverse,trail=0){
 const steps=Math.min(4,Math.floor(h/2));
 const span=amount=>Math.round(w*clamp(amount,0,1));
 const live=span(ratio), recent=span(trail);
 const paint=(width,first,last,row,color)=>{
  const start=Math.max(first,reverse?w-width:0);
  const end=Math.min(last,reverse?w:width);
  if(end>start)rect(x+start,y+row,end-start,1,color);
 };
 for(let row=0;row<h;row++){
  const inset=Math.max(0,steps-Math.min(row,h-1-row));
  rect(x+inset,y+row,w-2*inset,1,palette.track);
  paint(recent,inset,w-inset,row,'#ffc7aa');
  paint(live,inset,w-inset,row,row<4?palette.shine:row>=h-3?palette.shade:palette.body);
 }
 rect(x+steps,y-1,w-2*steps,1,palette.rim);
}

function drawRoundPip(x,y,won){
 const widths=[4,8,12,16,12,8,4];
 for(let i=0;i<widths.length;i++){
  const w=widths[i];
  const color=won?(i<3?'#ffeabb':i<5?'#eeb755':'#b7783d'):'#ac8690';
  rect(x-w/2,y+i*2,w,2,color);
  if(!won&&i>0&&i<6&&w>4)rect(x-w/2+2,y+i*2,w-4,2,'#634656');
 }
}

function drawVitals(f,wins){
 const right=f.player===1,side=right?'right':'left';
 const edge=right?W-38:38;
 const hp=clamp(f.hp/f.maxHp,0,1);
 drawFighterEmblem(f.key,right?edge-22:edge,31,hudInk);
 pixelText(f.c.name,edge+(right?-34:34),42,26,'#fff0e3',side,3);
 pixelText(`P${f.player+1}`,right?W-495:495,42,16,hudInk,right?'left':'right',2);
 hudGauge(right?W-502:38,59,464,24,hp,hp<=.22?lowHealthMeter:healthMeter,right,
  (f.recentHp??f.hp)/f.maxHp);
 pixelText(`${Math.ceil(f.hp)} / ${f.maxHp}`,edge+(right?-9:9),71,15,'#fff8ef',side,3);
 hudGauge(right?W-327:38,95,289,7,f.guard/f.maxGuard,guardMeter,right);
 for(let i=0;i<ROUNDS_TO_WIN;i++){
  const x=right?W-351-i*25:351+i*25;
  drawRoundPip(x,91,i<wins);
 }
}

function drawUltimateMeter(f){
 const right=f.player===1;
 const x=right?W-452:38,w=414;
 const ready=f.energy>=100;
 const color=ready?'#fff09f':'#ffdc83';
 pixelText(ready?'ULT PRONTA':f.c.ultimate,right?x+w:x,643,19,color,right?'right':'left',3);
 pixelText(Math.floor(f.energy)+'%',right?x:x+w,643,16,'#fff3e2',right?'left':'right',2);
 hudGauge(x,660,w,23,f.energy/100,ready?readyMeter:ultimateMeter,right);
 // A primeira divisão de cada lado indica o custo de um especial.
 for(let i=1;i<5;i++)rect(Math.round(x+i*w/5),661,2,21,'#7543278c');
 const [first,second]=f.c.specials;
 pixelText(first[0]+'  •  '+second[0],right?x+w:x,695,14,'#ded4e7',right?'right':'left',2);
}

function drawHUD(){
 if(!game)return;
 const [a,b]=game.f;
 drawVitals(a,game.p1Wins);
 drawVitals(b,game.p2Wins);
 rect(W/2-40,24,80,2,'#eacfa4');
 rect(W/2-40,102,80,2,'#eacfa4');
 pixelText(`ROUND ${game.round}`,W/2,40,17,'#ffd98c','center',2);
 pixelText(String(Math.max(0,Math.ceil(game.timer))).padStart(2,'0'),
  W/2,76,48,game.timer<=10?'#ff596d':'#fff0d8','center',5);
 for(const f of game.f)drawUltimateMeter(f);
 for(const f of game.f){if(f.comboDisplay>0&&f.combo>1)pixelText(f.combo+' ACERTOS',f.player?W-40:40,157,24,'#ffdf72',f.player?'right':'left');const timer=Math.max(f.buffTimer,f.healthBuff);if(timer>0)pixelText('MODO '+timer.toFixed(1)+'s',f.player?W-40:40,184,20,f.c.accent,f.player?'right':'left');}
 if(game.phase==='intro'){rect(0,244,W,166,'#0b0911b5');pixelText(game.announcer,W/2,312,72,'#ffe39d','center',10);pixelText('PREPARE-SE PARA LUTAR',W/2,376,24,'#e9bed1','center');}
 if(game.phase==='end'){
  const winner=game.winner===null?null:game.f[game.winner];
  const matchWon=Math.max(game.p1Wins,game.p2Wins)>=ROUNDS_TO_WIN;
  rect(0,245,W,167,'#050509e5');
  rect(W/2-170,269,340,3,'#ffe39d');
  pixelText(winner?winner.c.name+' VENCEU':'EMPATE',W/2,317,54,'#fff1bf','center',8);
  pixelText(matchWon?'FIM DE PARTIDA':`ROUND ${game.round}  •  ${game.p1Wins} × ${game.p2Wins}`,W/2,376,22,'#ffe39d','center',3);
 }
}

function render(t) {
 ctx.clearRect(0, 0, W, H);
 ctx.save();

 if (game?.phase==='fight' && !game.roundOver && game.screenShake>0 && screen==='fight') {
  const shake = game.screenShake;
  ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
 }
 renderBackdrop(t);

 if (!game) {
  rect(0, 0, W, H, '#15101d55');
  ctx.restore();
  return;
 }

 for (const fighter of game.f) drawFighterShadow(fighter);
 drawFX(t);
 drawMinions();
 drawProjectiles(t);

 // A vítima do agarrão fica atrás do braço do lutador que a segura.
 const fighters = [...game.f].sort((a, b) =>
  Number(!!b.grabbedBy) - Number(!!a.grabbedBy) || a.y - b.y
 );
 for (const fighter of fighters) drawFighter(fighter, t);
 if (typeof drawPrimalFoot === 'function') drawPrimalFoot();

 // Faíscas de acerto e partículas entram na frente das sprites.
 drawFX(t, true);
 drawParticles();
 if (debugBoxes) drawDebugBoxes();
 if (reviewAnchors) {
  for (const f of game.f) {
   rect(f.x - 8, f.y, 17, 1, '#ffe1b4');
   rect(f.x, f.y - 8, 1, 17, '#ffe1b4');
  }
 }
 if (!game.roundOver && game.flash > 0) rect(0, 0, W, H, `rgba(255,255,255,${game.flash * 2.3})`);
 ctx.restore();
 drawHUD();
}
