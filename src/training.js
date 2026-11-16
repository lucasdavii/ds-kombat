'use strict';

// Caixas de debug, dados de quadro e controles de treino e revisão.

// As caixas são desenhadas a partir das mesmas medidas usadas pelo combate.
function drawDebugBoxes(){
 for(const f of game.f){
  const box=(b,color)=>{ctx.strokeStyle=color;ctx.lineWidth=2;ctx.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);};
  box(hurtbox(f),'#65dbff');const half=f.c.size*.22;
  box({left:f.x-half,right:f.x+half,top:f.y-f.c.size*.6,bottom:f.y},'#ffe15a');
  if(f.pendingStrike&&f.basicMove){const elapsed=f.basicMove.duration-f.actionTime;if(elapsed>=f.basicMove.impact&&elapsed<=f.basicMove.impact+f.basicMove.active)box(strikeBox(f),'#ff5265');}
  pixelText(f.action+' '+Math.ceil(f.actionTime*60)+'q',f.x,f.y-f.c.size-20,16,'#fff1d5','center',2);
 }
 for(const p of projectiles){ctx.strokeStyle='#ff5265';ctx.strokeRect(p.x-p.radius,p.y-p.radius,p.radius*2,p.radius*2);}
}
function updateFrameData(){
 if(!game||!$('frame-data'))return;const f=game.f[0];
 $('frame-data').innerHTML='<strong>'+f.c.name+' — quadros a 60 Hz</strong><table><tr><th>Golpe</th><th>Preparação</th><th>Ativos</th><th>Recuperação</th><th>Dano base</th><th>Hitstun</th><th>Blockstun</th></tr>'+Object.entries(f.c.moves).map(([key,m])=>`<tr><td>${key==='punch'?'Soco':'Chute'}</td><td>${m.startup}</td><td>${m.active}</td><td>${m.recovery}</td><td>${m.damage}</td><td>${m.hitstun}</td><td>${m.blockstun}</td></tr>`).join('')+f.c.powers.map((m,i)=>`<tr><td>${i===2?'Ultimate':f.c.specials[i][0]}</td><td>${m.startup}</td><td>${m.active} evento</td><td>${m.recovery}</td><td>${m.damage}</td><td>${m.hitstun}</td><td>${m.blockstun}</td></tr>`).join('')+'</table><small>Azul: receber dano. Vermelho: causar dano. Amarelo: corpo. Baixo + golpe: baixo; no ar: médio. Normais cancelam em especiais após contato.</small>';
}

if(review){
 const panel=document.createElement('section');
 panel.className='review-controls';
 panel.innerHTML=`<label>Lutador <select id="review-fighter">${CHARS.map(key=>`<option value="${key}">${FIGHTERS[key].name}</option>`).join('')}</select></label>
 <label>Ação <select id="review-action"><option value="idle">Postura</option><option value="guard">Guarda alta</option><option value="low">Guarda baixa</option><option value="punch">Soco</option><option value="kick">Chute</option><option value="low-punch">Soco baixo</option><option value="low-kick">Chute baixo</option><option value="air-punch">Soco aéreo</option><option value="air-kick">Chute aéreo</option><option value="0">Especial 1</option><option value="1">Especial 2</option><option value="2">Ultimate</option></select></label>
 <label>Lado <select id="review-side"><option value="1">Esquerda</option><option value="-1">Direita</option></select></label>
 <button id="review-play">Testar na arena</button><button id="review-pause">Pausar / continuar</button><button id="review-step">Avançar 1 quadro</button>
 <label>Velocidade <select id="review-speed"><option value="1">1×</option><option value=".5">½×</option><option value=".25">¼×</option></select></label>
 <label><input type="checkbox" id="review-anchors"> Pivôs</label>
 <label><input type="checkbox" id="review-boxes"> Caixas de colisão</label>
 <label><input type="checkbox" id="training-health"> Vida infinita</label>
 <label><input type="checkbox" id="training-meter"> Barra infinita</label>
 <label>Boneco <select id="training-dummy"><option value="idle">Parado</option><option value="guard">Defesa em pé</option><option value="low">Defesa agachada</option></select></label>
 <button id="training-reset">Resetar posições</button><div id="frame-data"></div>`;
 document.querySelector('.game-column').prepend(panel);
 $('review-play').onclick=()=>{
  const key=$('review-fighter').value,dir=Number($('review-side').value);
  mode='local';selected=[key,key==='dino'?'chapinha':'dino'];startMatch(true);
  game.phase='fight';reviewPaused=false;updateFrameData();
  const [fighter,rival]=game.f;
  fighter.x=640-dir*55;rival.x=640+dir*55;fighter.dir=dir;
  const action=$('review-action').value;
  if(action==='2'){fighter.energy=100;ultimate(fighter);}
  else if(action==='0'||action==='1')special(fighter,Number(action));
  else if(action.includes('punch')||action.includes('kick')){fighter.lowGuard=action.startsWith('low');if(action.startsWith('air')){fighter.grounded=false;fighter.vy=-330;fighter.y-=60;}basicAttack(fighter,action.endsWith('kick')?'kick':'punch');}
  else if(action==='guard'||action==='low'){
   fighter.action='guard';fighter.lowGuard=action==='low';reviewPaused=true;
  }
 };
 $('review-pause').onclick=()=>{if(game?.reviewSession)reviewPaused=!reviewPaused;};
 $('review-step').onclick=()=>{if(!game?.reviewSession)return;reviewPaused=true;update(1/60);reviewClock+=1/60;};
 $('review-speed').onchange=event=>{reviewSpeed=Number(event.target.value);};
 $('review-anchors').onchange=event=>{reviewAnchors=event.target.checked;};
 $('review-boxes').onchange=e=>{debugBoxes=e.target.checked;};
 $('training-health').onchange=e=>{training.enabled=true;training.health=e.target.checked;if(training.health&&game?.reviewSession)for(const f of game.f)f.hp=f.maxHp;};
 $('training-meter').onchange=e=>{training.enabled=true;training.meter=e.target.checked;if(training.meter&&game?.reviewSession)for(const f of game.f)f.energy=100;};
 $('training-dummy').onchange=e=>{training.enabled=true;training.dummy=e.target.value;};
 $('training-reset').onclick=()=>{if(game?.reviewSession){resetRound();game.phase='fight';}};

}
