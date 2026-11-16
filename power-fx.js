// Independent pixel effects. No change to damage, collision or cooldowns.
const powerFXImage=imageAsset('assets/fighters/power-fx-04.png');
function powerFXFrame(row,index,x,y,size,ground=false){
 if(!powerFXImage.naturalWidth)return false;
 ctx.imageSmoothingEnabled=false;
 const n=Math.max(0,Math.min(7,index));
 ctx.drawImage(powerFXImage,n*96,row*96,96,96,Math.round(x-size/2),Math.round(y-size*(ground?88/96:.5)),Math.round(size),Math.round(size));
 return true;
}
function drawGreaseWave(p){
 const step=Math.floor(p.age*26);
 const radius=p.radius;
 for(let y=-radius;y<=radius;y+=4){
  const shape=Math.sqrt(Math.max(0,1-(y/radius)**2));
  const ripple=4*Math.sin(y*.18-step);
  const nose=radius*shape+ripple;
  const tail=-radius*(.35+shape)+ripple;
  rect(Math.round(tail),y,Math.max(4,Math.round(nose-tail)),4,'#24232c');
  rect(Math.round(tail+8),y,Math.max(4,Math.round(nose-tail-13)),4,'#090910');
  if(y<-radius*.22&&shape>.45)rect(Math.round(nose-14),y,8,4,'#77717f');
  if((y/4+step)%3===0)rect(Math.round(tail-9),y,5,4,'#514956');
 }
}

function dinoBeamWidth(beam,q){
 return beam.radius*(q>.66?clamp((1-q)*3,.10,1):1);
}

function drawDinoBeam(beam,q){
 const length=dinoBeamLength(beam);
 const width=dinoBeamWidth(beam,q);
 ctx.translate(Math.round(beam.x),Math.round(beam.y));
 ctx.scale(beam.direction,1);
 ctx.globalAlpha=1;
 for(let x=0;x<length;x+=8){
  const wave=Math.sin(x*.085-q*28);
  const h=Math.round(width*(.82+.18*wave));
  const w=Math.min(8,length-x);
  rect(x,-h,w,h*2,'#207849');
  rect(x,-h+5,w,Math.max(2,h*2-10),'#8cf237');
  rect(x,-h*.32,w,h*.64,'#eeffae');
 }
 if(length>0)rect(-5,-width*.55,12,width*1.10,'#f2ffbd');
}

function drawPowerProjectile(p){
 if(p.type==='grease'){
  ctx.scale(p.dir,1);
  drawGreaseWave(p);
  return true;
 }
 if(p.type==='ancestor'&&powerFXImage.naturalWidth){
  ctx.scale(p.dir,1);
  const step=Math.floor(p.age/.065)%8;
  for(let i=2;i>=1;i--){
   ctx.globalAlpha=.20/i;
   powerFXFrame(3,(step+8-i)%8,-i*32,i%2?8:-8,p.radius*(2.8-i*.45));
  }
  ctx.globalAlpha=1;
  return powerFXFrame(3,step,0,0,p.radius*3.55);
 }
 const row={tire:1,ancestor:3}[p.type];
 if(row===undefined||!powerFXImage.naturalWidth)return false;
 ctx.scale(p.dir,1);
 // Each projectile starts at frame zero; pause and hitstop freeze its age.
 return powerFXFrame(row,Math.floor((p.age||0)/.065)%8,0,0,p.radius*3.45);
}
function drawFighterSlam(v,q){
 const {x,y,belly,color,radius}=v;
 const spread=radius*(1-(1-q)**2);
 const lift=belly?12:4;
 ctx.globalAlpha=(1-q)*.85;
 for(const side of [-1,1]){
  for(let i=0;i<5;i++){
   const distance=spread*(.63+i*.086);
   const px=Math.round((x+side*distance)/4)*4;
   const py=y+Math.round(i*lift/4);
   const width=belly?32-i*4:20-i*2;
   rect(px-width/2,py,width,belly?7:4,belly?'#783f96':'#6f2337');
   rect(px-width/2,py-3,width,4,color);
   if(i===4)rect(px-4,py-7,8,4,belly?'#f9dcff':'#ffdda0');
  }
 }
 ctx.globalAlpha=1;
 const dustFrame=Math.min(7,1+Math.floor(q*7));
 powerFXFrame(4,dustFrame,x,y,belly?410:350,true);
 for(const side of [-1,1]){
  ctx.globalAlpha=(1-q)*.43;
  powerFXFrame(4,Math.min(7,2+Math.floor(q*6)),x+side*spread*.58,y+5,belly?250:210,true);
 }
}

function drawSlamDebris(v,q){
 const {x,y,belly}=v;
 if(q<.48){
  const flare=1-q/.48;
  const w=(belly?115:94)*(.65+q);
  const h=(belly?60:83)*flare;
  ctx.globalAlpha=.96*flare;
  poly([[x-w,y],[x-w*.58,y-12],[x-w*.42,y-h*.42],[x-w*.16,y-h*.31],
   [x,y-h],[x+w*.14,y-h*.34],[x+w*.44,y-h*.48],[x+w*.61,y-12],[x+w,y],[x,y+9]],
   belly?'#cb7bff':'#ff6940');
  poly([[x-w*.65,y],[x-w*.19,y-10],[x,y-h*.68],[x+w*.21,y-12],[x+w*.65,y],[x,y+5]],
   belly?'#fff0ff':'#fff1b8');
 }
 ctx.globalAlpha=1-q;
 for(let i=0;i<7;i++){
  const side=i%2?1:-1;
  const speed=48+(i*37)%134;
  const px=Math.round((x+side*(15+speed*q))/4)*4;
  const py=Math.round((y-(18+(i*19)%60)*4*q*(1-q))/4)*4;
  const size=belly?8:4+(i%3)*2;
  rect(px,py,size+4,size,belly?'#704978':'#704b42');
  rect(px,py-2,size,3,belly?'#e8b8f3':'#ffbe76');
 }
}

function drawSuperShock(v,q){
 const {x,y,radius}=v;
 const floor=v.floorY??FLOOR;
 const flash=q<.30?1:clamp((.72-q)/.42,0,1);
 if(flash>0){
  const top=-12;
  const span=y-top;
  const trunk=[[x-82,top],[x-36,top+span*.20],[x-60,top+span*.34],
   [x+40,top+span*.48],[x+8,top+span*.61],[x+53,top+span*.71],[x,y],
   [x-24,y+(floor-y)*.43],[x+17,y+(floor-y)*.65],[x,floor]];
  const branches=[
   [[x-60,top+span*.34],[x-115,top+span*.42],[x-101,top+span*.48],[x-145,top+span*.61]],
   [[x+40,top+span*.48],[x+91,top+span*.51],[x+75,top+span*.58],[x+126,top+span*.66]]
  ];
  ctx.globalAlpha=flash;
  ctx.lineJoin='miter';
  for(const [path,weight] of [[trunk,1],...branches.map(points=>[points,.36])]){
   ctx.beginPath();
   path.forEach(([px,py],i)=>{
    if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
   });
   for(const [ink,width] of [['#155f3a',38],['#8cff4c',26],['#ffffe4',12]]){
    ctx.strokeStyle=ink;ctx.lineWidth=width*weight;ctx.stroke();
   }
  }
  const r=radius*(.48+q)*flash;
  poly([[x-r,y],[x-22,y-14],[x-r*.44,y-r*.79],[x-7,y-30],
   [x+r*.37,y-r*.83],[x+18,y-12],[x+r,y],[x+21,y+14],
   [x+r*.35,y+r*.52],[x-8,y+22],[x-r*.48,y+r*.54],[x-17,y+13]],'#a5ff64');
  rect(x-19,y-14,38,28,'#f8ffda');
  poly([[x-58,floor],[x-19,floor-8],[x-9,floor-22],[x+10,floor-9],
   [x+53,floor],[x+16,floor+6],[x-15,floor+6]],'#baff73');
  rect(x-14,floor-4,28,7,'#ffffe4');
 }
 ctx.globalAlpha=(1-q)*.88;
 for(let i=0;i<9;i++){
  const direction=i%2?1:-1;
  const px=x+direction*(18+i*11)*(q+.25);
  const py=floor-6-((i*17)%60)*Math.sin(q*Math.PI);
  rect(Math.round(px/4)*4,Math.round(py/4)*4,10,4,'#74f84d');
 }
}

function drawPowerEffect(v,q,t){
 if(v.type==='lightning'&&v.originX!==undefined){
  drawSuperShock(v,q);
  return true;
 }
 if(v.type==='fighterSlam'){
  drawFighterSlam(v,q);
  return true;
 }
 if(v.type==='slamDebris'){
  drawSlamDebris(v,q);
  return true;
 }
 if(v.type==='dinoBeam'){
  drawDinoBeam(v,q);
  return true;
 }
 if(!powerFXImage.naturalWidth)return false;
 if(v.type==='shock'||v.type==='stomp'){
  ctx.globalAlpha=1;
  return powerFXFrame(4,Math.floor(q*8),v.x,FLOOR,Math.min(600,Math.max(150,v.radius*2)),true);
 }
 if(v.type==='ancestorImpact'){
  return powerFXFrame(5,Math.floor(q*8),v.x,v.y,155);
 }
 if(v.type==='ancestor'){
  ctx.globalAlpha=1-q;return powerFXFrame(3,Math.min(7,Math.floor(q*8)),v.x,v.y,110);
 }
 return false;
}
