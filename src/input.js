'use strict';

// Leitura de teclado e gamepad, pausa e comandos guardados por alguns quadros.

const KEYMAP=[{left:'a',right:'d',up:'w',down:'s',punch:'f',kick:'g',block:'h',sp1:'r',sp2:'t',ult:'y'},
 {left:'arrowleft',right:'arrowright',up:'arrowup',down:'arrowdown',punch:'j',kick:'k',block:'l',sp1:'u',sp2:'i',ult:'o'}];
const keys=new Set(),padsPrev=[{},{}];

function clearInputs(){
 keys.clear();for(let i=0;i<2;i++)padsPrev[i]={};
 if(game)for(const f of game.f){f.prev={};f.inputBuffer={};f.motion=[];f.directionTaps={};f.aiPlan=null;f.aiPending=null;f.aiDecision=0;f.block=false;}
}

window.addEventListener('keydown',e=>{unlockAudio();const k=e.key.toLowerCase();if(screen!=='fight'&&k!=='escape'){if(document.activeElement?.tagName!=='SELECT'&&['arrowup','arrowdown'].includes(k)){e.preventDefault();menuNavigate(k==='arrowdown'?'next':'prev');}return;}if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'){if(screen==='fight'||screen==='pause')togglePause();else if(screen!=='home')showHome();return;}keys.add(k);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
document.addEventListener?.('visibilitychange',()=>{if(document.hidden&&screen==='fight')togglePause(true);});
window.addEventListener('blur',()=>{keys.clear();if(screen==='fight')togglePause(true);});
// Teclado, gamepad e pausa
function togglePause(force){if(!game)return;const pause=typeof force==='boolean'?force:screen==='fight';clearInputs();stopSounds();accumulator=0;screen=pause?'pause':'fight';$('pausedOverlay').classList.toggle('hidden',!pause);setStatus(pause?'JOGO PAUSADO':mode==='solo'?'VS CPU — COMBATE':'VS LOCAL — COMBATE');}
const padSlots=[null,null];
function getGamepads(){
 let raw=[];try{raw=Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected);}catch(_){}
 for(let i=0;i<2;i++)if(padSlots[i]&&!raw.some(p=>p.index===padSlots[i].index&&p.id===padSlots[i].id)){
  padSlots[i]=null;padsPrev[i]={};if(screen==='fight')togglePause(true);
 }
 for(const p of raw)if(!padSlots.some(s=>s&&s.index===p.index&&s.id===p.id)){const free=padSlots.indexOf(null);if(free!==-1)padSlots[free]={index:p.index,id:p.id};}
 gamepads=raw.length;
 const assigned=padSlots.map(slot=>slot?raw.find(p=>p.index===slot.index&&p.id===slot.id):null);
 if((screen==='fight'||screen==='pause')&&mode==='local'&&game&&!game.reviewSession&&raw.length===1){
  $('padsText').textContent='🎮 J1 TECLADO • J2 CONTROLE';
  return [null,raw[0]];
 }
 // No modo solo ou treino, o único controle atende o jogador humano.
 if(raw.length===1){assigned[0]=raw[0];assigned[1]=null;}
 $('padsText').textContent=`🎮 ${gamepads} CONTROLE${gamepads===1?'':'S'} DETECTADO${gamepads===1?'':'S'}`;
 return assigned;
}
function readInput(player,pads){const km=KEYMAP[player],obj={};Object.keys(km).forEach(k=>obj[k]=keys.has(km[k]));const p=pads[player];if(p&&p.connected){let ax=p.axes[0]||0,ay=p.axes[1]||0;const b=i=>!!p.buttons[i]?.pressed;obj.left ||=ax<-.25||b(14);obj.right ||=ax>.25||b(15);obj.up ||=ay<-.52||b(12);obj.down ||=ay>.52||b(13);obj.punch ||=b(0);obj.kick ||=b(1);obj.sp1 ||=b(4);obj.sp2 ||=b(5);obj.ult ||=b(6);obj.block ||=b(7);if(b(9)&&!padsPrev[player].start&&(screen==='fight'||screen==='pause'))togglePause();padsPrev[player].start=b(9);}
 return obj;}

const BUFFER_ACTIONS=['up','punch','kick','sp1','sp2','ult','block'];
// Armazena a borda do botão e reconhece o quarto de círculo na direção do rival.
function captureInput(f,input,freezeBuffer=false){
 f.inputBuffer ||= {};f.motion ||= [];
 if(input.block&&!f.prev.block)f.perfectGuardFrames=5;
 else if(!freezeBuffer)f.perfectGuardFrames=Math.max(0,(f.perfectGuardFrames||0)-1);
 if(!freezeBuffer)for(const key of Object.keys(f.inputBuffer))if(--f.inputBuffer[key]<=0)delete f.inputBuffer[key];
 f.directionTaps ||= {};
 for(const key of ['left','right']){
  if(!freezeBuffer&&f.directionTaps[key]>0)f.directionTaps[key]--;
  if(input[key]&&!f.prev[key]){
   if(f.directionTaps[key]>0){
    f.inputBuffer[key==='left'?'dashLeft':'dashRight']=COMBAT.buffer;
    f.directionTaps[key]=0;
   }else f.directionTaps[key]=12;
  }
 }
 const direction=input.down?(input[f.dir===1?'right':'left']?'df':'d'):input[f.dir===1?'right':'left']?'f':'n';
 if(f.motion.at(-1)?.dir!==direction)f.motion.push({dir:direction,t:frame});
 f.motion=f.motion.filter(m=>frame-m.t<=20);
 for(const key of BUFFER_ACTIONS)if(input[key]&&!f.prev[key]){
  const dirs=f.motion.map(m=>m.dir).join(',');
  const command=(key==='punch'||key==='kick')&&/d,df,f$/.test(dirs)?(key==='punch'?'sp1':'sp2'):key;
  f.inputBuffer[command]=COMBAT.buffer;
 }
 f.prev={...input};
}
function consumeInput(f,key){if(f.inputBuffer?.[key]){delete f.inputBuffer[key];return true;}return false;}
