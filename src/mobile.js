'use strict';
const mobileMode=!!navigator.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints>1 && (/Macintosh/i.test(navigator.userAgent) || matchMedia('(pointer: coarse)').matches));
const touchActions=new Set(),touchPointers=new Map();
function clearTouchInputs(){touchPointers.clear();touchActions.clear();document.querySelectorAll('.touch-held').forEach(el=>el.classList.remove('touch-held'));}
function syncTouchActions(){
 touchActions.clear();
 for(const item of touchPointers.values())for(const action of item.actions)touchActions.add(action);
 document.querySelectorAll('[data-touch]').forEach(el=>el.classList.toggle('touch-held',touchActions.has(el.dataset.touch)));
}
function setupMobile(){
 if(!mobileMode)return;
 document.body.classList.add('mobile-mode');
 const panel=document.createElement('div');panel.className='touch-controls';panel.hidden=true;
 panel.innerHTML='<div class="touch-pad" aria-label="Direcional"><span class="pad-up">▲</span><span class="pad-left">◀</span><span class="pad-center">●</span><span class="pad-right">▶</span><span class="pad-down">▼</span></div><div class="touch-buttons">'+[['sp1','ESP 1'],['sp2','ESP 2'],['ult','ULT'],['punch','SOCO'],['kick','CHUTE'],['block','DEFESA']].map(([a,label])=>'<button type="button" data-touch="'+a+'" aria-label="'+label+'">'+label+'</button>').join('')+'</div>';
 document.getElementById('gamebox').append(panel);
 const pause=document.createElement('button');pause.className='touch-pause';pause.textContent='Ⅱ';pause.setAttribute('aria-label','Pausar luta');pause.hidden=true;
 document.getElementById('gamebox').append(pause);pause.addEventListener('click',()=>togglePause(true));
 const hint=document.createElement('div');hint.className='rotate-hint';hint.textContent='Gire o celular para jogar deitado';document.body.append(hint);
 const pad=panel.querySelector('.touch-pad');
 function padActions(e){
  const r=pad.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width*2-1,dy=(e.clientY-r.top)/r.height*2-1,actions=[];
  if(dx<-.25)actions.push('left');if(dx>.25)actions.push('right');
  if(dy<-.35)actions.push('up');if(dy>.35)actions.push('down');
  return actions;
 }
 panel.addEventListener('pointerdown',e=>{
  if(screen!=='fight')return;
  const button=e.target.closest('[data-touch]'),onPad=pad.contains(e.target);
  if(!button&&!onPad)return;
  e.preventDefault();unlockAudio();const owner=onPad?pad:button;owner.setPointerCapture(e.pointerId);
  touchPointers.set(e.pointerId,{pad:onPad,actions:onPad?padActions(e):[button.dataset.touch]});syncTouchActions();
 });
 panel.addEventListener('pointermove',e=>{const item=touchPointers.get(e.pointerId);if(!item?.pad)return;e.preventDefault();item.actions=padActions(e);syncTouchActions();});
 const release=e=>{touchPointers.delete(e.pointerId);syncTouchActions();};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])panel.addEventListener(event,release);
 panel.addEventListener('contextmenu',e=>e.preventDefault());
 window.addEventListener('blur',clearTouchInputs);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTouchInputs();});
 window.addEventListener('resize',()=>{clearTouchInputs();if(screen==='fight'&&innerHeight>innerWidth)togglePause(true);});
 let previous;
 function updateMobile(){
  const fighting=screen==='fight';
  if(previous!==screen){clearTouchInputs();panel.hidden=!fighting;pause.hidden=!fighting;document.body.classList.toggle('mobile-fighting',fighting);previous=screen;}
  requestAnimationFrame(updateMobile);
 }
 requestAnimationFrame(updateMobile);
}

