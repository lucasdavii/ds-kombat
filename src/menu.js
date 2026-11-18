'use strict';

// Menus, seleção de lutadores e navegação dos controles.

function btn(label,action,klass='primary'){return `<button class="${klass}" data-action="${action}">${label}</button>`;}
function showModal(content){menuFocus=0;modal.classList.remove('hidden');modal.innerHTML=`<div class="modal-inner">${content}</div>`;}
function hideModal(){modal.classList.add('hidden');modal.innerHTML='';}
function setStatus(text){$('stateText').textContent=text;}

function showHome(){clearTransient();screen='home';game=null;setStatus('MENU INICIAL');$('moveInfo').innerHTML='<div class="moves-placeholder">Escolha um personagem para ver os movimentos especiais.</div>';
 showModal(`<div class="hero-menu">
  <h1 class="hero-title">DS <em>KOMBAT</em></h1>
  <div class="home-modes">
   ${btn('1 JOGADOR <small>VS CPU</small>','solo')}
   ${mobileMode?'':btn('2 JOGADORES <small>DUELO LOCAL</small>','local','secondary')}
   ${mobileMode?'':btn('TREINO <small>REVISÃO DE GOLPES</small>','training','secondary')}
  </div>
  ${btn('COMO JOGAR','help','ghost')}
 </div>`);
}
function selectMode(m){mode=mobileMode?'solo':m;selectedArena=undefined;selected=[null,null];selectFocus=0;showSelection();}
function fighterProfileName(fighter){
 const name=fighter.name.toLocaleLowerCase('pt-BR');
 return name[0].toLocaleUpperCase('pt-BR')+name.slice(1);
}

let selectedArena;
const arenaNames=['Mercado','Posto Catatau','Bar do Rubim','Borracharia','Heliponto','Quadra de Futsal'];
const arenaFiles=['mercado','posto','bar','borracharia','heliponto','quadra-futsal'];

function showArenaSelection(){
 if(!selected.every(Boolean))return;
 setStatus('ESCOLHA A ARENA');
 const arenas=arenaNames.map((name,i)=>`
  <button class="arena-card" data-action="arena-${i}">
   <img src="assets/stages/${arenaFiles[i]}.webp" alt="">
   <strong>${name}</strong>
  </button>`).join('');
 showModal(`<div class="arena-selection">
  <h2 class="screen-heading">ESCOLHA A ARENA</h2>
  <div class="arena-grid">${arenas}</div>
  <div class="buttons">${btn('VOLTAR','fighters','ghost')}${btn('⚄ ALEATÓRIO','arena-random','secondary')}</div>
 </div>`);
}
function selectionPortrait(key){
 return `<canvas class="selection-portrait" width="64" height="64" data-idle-portrait="${key}" aria-hidden="true"></canvas>`;
}

// Portrait framing is independent of combat sprites and hitboxes.
const selectionCropCache=new WeakMap();
function selectionSpriteBounds(image,x,y,w,h){
 let frames=selectionCropCache.get(image);
 if(!frames){frames=new Map();selectionCropCache.set(image,frames);}
 const key=[x,y,w,h].join(',');
 if(frames.has(key))return frames.get(key);
 const canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,x,y,w,h,0,0,w,h);
 const pixels=ctx.getImageData(0,0,w,h).data;
 let left=w,top=h,right=-1,bottom=-1;
 for(let row=0;row<h;row++)for(let col=0;col<w;col++){
  if(pixels[(row*w+col)*4+3]===0)continue;
  left=Math.min(left,col);right=Math.max(right,col);
  top=Math.min(top,row);bottom=Math.max(bottom,row);
 }
 const bounds=right<0?null:[x+left,y+top,right-left+1,bottom-top+1];
 frames.set(key,bounds);
 return bounds;
}

function paintSelectionPortraits(){
 const [px,py,pw,ph]=pneusonFrames.idle[0];
 const idleFrames={
  dino:[dinoAtlas,0,0,100,120],
  pneuson:[pneusonAtlas,px,py,pw,ph],
  kingbum:[kingAtlases.movement,0,0,96,80],
  paje:[pajeAssets.movement,0,0,96,84],
  neneu:[neneuAtlases.base,0,0,96,84]
 };
 for(const portrait of modal.querySelectorAll('[data-idle-portrait]')){
  const key=portrait.dataset.idlePortrait;
  const [image,x,y,w,h]=idleFrames[key]??[arcadeSprites[key],0,0,80,80];
  const draw=()=>{
   if(!portrait.isConnected)return;
   const context=portrait.getContext('2d');
   context.clearRect(0,0,64,64);
   const bounds=selectionSpriteBounds(image,x,y,w,h);
   if(!bounds)return;
   const [sx,sy,sw,sh]=bounds;
   // Use roster height, not atlas padding; keep short/tall fighters distinct.
   const tallest=Math.max(...CHARS.map(id=>FIGHTERS[id].size));
   const targetHeight=58*FIGHTERS[key].size/tallest;
   const scale=Math.min(58/sw,targetHeight/sh);
   const width=Math.round(sw*scale),height=Math.round(sh*scale);
   context.imageSmoothingEnabled=false;
   context.drawImage(image,sx,sy,sw,sh,Math.floor((64-width)/2),61-height,width,height);
  };
  if(image.naturalWidth)draw();
  else image.addEventListener('load',draw,{once:true});
 }
}

function showSelection(){
 screen='select';
 setStatus(mode==='solo'?'VS CPU':'DUELO LOCAL');
 const sides=['JOGADOR 1',mode==='solo'?'CPU':'JOGADOR 2'];
 const canStart=selected.every(Boolean);
 const slots=selected.map((key,i)=>`
  <button class="match-slot slot-${i+1} ${selectFocus===i?'slot-active':''}"
   data-action="slot-${i}" aria-pressed="${selectFocus===i}">
   <span>${sides[i]}</span>
   ${key?selectionPortrait(key):''}
   <strong>${key?fighterProfileName(FIGHTERS[key]):'Escolher lutador'}</strong>
  </button>`);
 const roster=CHARS.map(key=>{
  const labels=selected.map((value,i)=>value===key?
   `<span class="pick-tag slot-${i+1}">${i===0?'J1':mode==='solo'?'CPU':'J2'}</span>`:'').join('');
  return `<button class="fighter-card${labels?' fighter-picked':''}" data-char="${key}">
   ${selectionPortrait(key)}
   <span class="fighter-name">${fighterProfileName(FIGHTERS[key])}</span>
   <span class="fighter-stats">${FIGHTERS[key].role} · ${FIGHTERS[key].hp} PV</span>
   <span class="pick-tags">${labels}</span>
  </button>`;
 }).join('');
 const settings=mode==='solo'?`<label class="select-config">DIFICULDADE
  <select id="difficulty">${[['facil','FÁCIL'],['normal','NORMAL'],['dificil','DIFÍCIL']]
   .map(([key,label])=>`<option value="${key}" ${difficulty===key?'selected':''}>${label}</option>`).join('')}</select>
 </label>`:'';
 showModal(`<div class="selection kombat-select">
  <h2 class="screen-heading">ESCOLHA SEU LUTADOR</h2>
  <div class="matchup">${slots[0]}<span class="vs">VS</span>${slots[1]}</div>
  <p class="select-status">${selectFocus===null?'CONFRONTO PRONTO':`ESCOLHENDO PARA ${sides[selectFocus]}`}</p>
  <div class="roster-grid">${roster}</div>
  <div class="select-actions">${settings}<div class="buttons">
   ${btn('VOLTAR','menu','ghost')}${btn('ALEATÓRIO','random','secondary')}
   <button class="primary" data-action="start" ${canStart?'':'disabled'}>ESCOLHER ARENA</button>
  </div></div>
 </div>`);
 paintSelectionPortraits();
 if(selected[0])showMoves(selected[0]);
}

function pickChar(key){
 if(!CHARS.includes(key))return;
 const side=selectFocus??0;
 selected[side]=key;
 selectFocus=selected[1-side]?null:1-side;
 showSelection();
}
function randomPick(){
 const rival=selected[1-(selectFocus??0)];
 pickChar(choice(CHARS.filter(key=>key!==rival)));
}
function showHelp(){if(mobileMode){screen='help';showModal('<h2>COMO JOGAR</h2><p>Use o direcional à esquerda para andar, pular e agachar. Deslize na diagonal para pular para os lados.</p><p>À direita: SOCO, CHUTE, ESP 1, ESP 2 e ULT. Segure DEFESA para bloquear. Você pode mover e atacar ao mesmo tempo. Dois toques na direção fazem o dash.</p><p>ULT exige a barra cheia. Use Ⅱ para pausar. Jogue com o celular deitado.</p>'+btn('VOLTAR','menu','secondary'));return;}screen='help';showModal(`<div><h2 class="screen-heading">COMO JOGAR</h2><div class="help-grid"><div><h3>OBJETIVO</h3><p>Vença dois rounds para ganhar a luta. Reduza a barra de vida do rival a zero antes que os 90 segundos terminem. A barra de ULTIMATE aumenta ao atacar e apanhar.</p></div><div><h3>DEFESA E MOVIMENTO</h3><p>Segure H (J1) ou L (J2) para bloquear golpes vindos da frente. A defesa diminui o dano, mas consome a barra azul; se ela acabar, a guarda quebra por um instante. Agache com S ou ↓, pule com W ou ↑.</p></div><div><h3>ATAQUES</h3><p>J1: F soco, G chute, R e T especiais, Y ultimate. J2: J soco, K chute, U e I especiais, O ultimate. Os especiais possuem tempo de recarga. Também há comandos combinados: ↓ ↘ → + soco (especial 1) ou chute (especial 2), espelhado ao virar. Alguns personagens ativam transformações temporárias.</p></div><div><h3>CONTROLES 🎮</h3><p>Xbox: direcional ou analógico esquerdo move. A soca, B chuta, LB usa o Especial 1, RB usa o Especial 2, LT ativa a ultimate e RT bloqueia. No duelo local, um controle fica com o J2 e o J1 usa o teclado. Com dois controles, cada jogador usa um.</p></div></div><div style="margin-top:20px;text-align:right">${btn('← VOLTAR','menu','secondary')}</div></div>`);}
function showMoves(k){const c=FIGHTERS[k];$('moveInfo').innerHTML=`<div class="move-title" style="color:${c.accent}">${c.name}</div><div class="move-entry"><b>ESPECIAL 1 • R / U / LB</b><span>${c.specials[0][0]} — ${c.specials[0][1]} (${specialCost(c,0)} de energia)</span></div><div class="move-entry"><b>ESPECIAL 2 • T / I / RB</b><span>${c.specials[1][0]} — ${c.specials[1][1]} (${specialCost(c,1)} de energia)</span></div><div class="move-entry"><b>ULTIMATE • Y / O / LT</b><span>${c.ultimate} — requer 100% de energia.</span></div><div class="move-entry"><b>DEFESA • H / L / RT</b><span>Segure para bloquear no chão. Defender no instante do impacto recupera energia.</span></div><div class="move-entry"><b>MOVIMENTO RÁPIDO</b><span>Dois toques para frente ou para trás. Segure para trás ao levantar para recuar.</span></div><div class="move-entry"><b>AGARRÃO • SOCO + CHUTE</b><span>Aperte juntos perto do rival.</span></div><div class="move-entry"><b>ESCAPE • DEFESA + SOCO</b><span>Interrompe um combo uma vez por round.</span></div>`;}
modal.addEventListener('change',e=>{if(e.target.id==='difficulty')difficulty=e.target.value;});
modal.addEventListener('click',e=>{unlockAudio();const char=e.target.closest('[data-char]');if(char){pickChar(char.dataset.char);return;}const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
 if(/^arena-(?:[0-9]+|random)$/.test(action)&&selected.every(Boolean)){
  const choice=action==='arena-random'?Math.floor(Math.random()*arenaNames.length):Number(action.slice(6));
  if(choice<0||choice>=arenaNames.length)return;
  selectedArena=choice;
  startMatch();return;
 }
 switch(action){case 'fighters':showSelection();break;case 'solo':selectMode('solo');break;case 'local':selectMode('local');break;case 'help':showHelp();break;case 'training':window.location.href='?treino';break;case 'menu':showHome();$('pausedOverlay').classList.add('hidden');break;case 'slot-0':case 'slot-1':selectFocus=Number(button.dataset.action.at(-1));showSelection();break;case 'random':randomPick();break;case 'start':showArenaSelection();break;case 'rematch':startMatch();break;case 'newSelection':selectMode(mode);break;}});
$('pausedOverlay').addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a==='resume')togglePause(false);if(a==='restart')startMatch(game.reviewSession);if(a==='menu'){togglePause(false);showHome();}});
$('volume').oninput=e=>{soundVolume=Number(e.target.value);};
$('soundToggle').onclick=()=>{unlockAudio();soundOn=!soundOn;$('soundToggle').textContent=soundOn?'🔊 ÁUDIO':'🔇 MUDO';};
$('fullscreenBtn').onclick=()=>{if(!document.fullscreenElement){$('gamebox').requestFullscreen?.().catch(()=>{});}else document.exitFullscreen?.();};
let menuFocus=0;
const menuPadPrev=[{},{}];
function menuNavigate(action){
 const scope=screen==='pause'?$('pausedOverlay'):modal;
 const controls=Array.from(scope.querySelectorAll?.('button:not(:disabled),select,input')||[]);
 if(!controls.length)return;
 let current=controls.indexOf(document.activeElement);if(current<0)current=menuFocus%controls.length;
 if(action==='next'||action==='prev'){menuFocus=(current+(action==='next'?1:-1)+controls.length)%controls.length;controls[menuFocus].focus();}
 else if(action==='activate'){const el=controls[current];if(el.tagName==='SELECT'){el.selectedIndex=(el.selectedIndex+1)%el.options.length;el.dispatchEvent(new Event('change',{bubbles:true}));}else el.click();}
}
function pollMenuPads(pads){for(let i=0;i<2;i++){const p=pads[i];if(!p){menuPadPrev[i]={};continue;}const next=!!p.buttons[13]?.pressed||(p.axes[1]||0)>.55,prev=!!p.buttons[12]?.pressed||(p.axes[1]||0)<-.55,activate=!!p.buttons[0]?.pressed;
 if(next&&!menuPadPrev[i].next)menuNavigate('next');if(prev&&!menuPadPrev[i].prev)menuNavigate('prev');if(activate&&!menuPadPrev[i].activate){unlockAudio();menuNavigate('activate');}menuPadPrev[i]={next,prev,activate};}}

function finishMatch(){
 screen='results';
 const winner=game.p1Wins>game.p2Wins?0:1;
 const f=game.f[winner];
 setStatus(`VITÓRIA DE ${f.c.name}`);
 showModal(`<div class="result-wrap">
  <span class="screen-kicker">VENCEDOR</span>
  <h2>${f.c.name}</h2>
  <div class="result-score" aria-label="Placar final">
   <span>${game.p1Wins}</span><b>×</b><span>${game.p2Wins}</span>
  </div>
  <div class="menu-buttons">${btn('REVANCHE','rematch')}${btn('SELEÇÃO','newSelection','secondary')}${btn('MENU','menu','ghost')}</div>
 </div>`);
}
