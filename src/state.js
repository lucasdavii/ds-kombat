'use strict';

// Estado da partida, referências da página e funções compartilhadas.

const W=1280, H=720, FLOOR=576, ROUND_SECONDS=90, ROUNDS_TO_WIN=2;
const $=id=>document.getElementById(id);
const canvas=$('arena'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const modal=$('modal');
const CHARS=Object.keys(FIGHTERS);

let mode='solo',screen='home',selectFocus=0,selected=[null,null],difficulty='normal',game=null,last=0,gamepads=0;
let frame=0;const particles=[],projectiles=[],minions=[],visualFX=[];
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}function rnd(a,b){return a+Math.random()*(b-a);}function choice(a){return a[Math.floor(Math.random()*a.length)];}
function rgba(hex,alpha){const s=hex.replace('#','');const n=parseInt(s,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`}

const query=new URLSearchParams(window.location?.search||'');
const review=query.has('revisao')||query.has('treino');
let debugBoxes=false;
const training={enabled:query.has('treino'),health:false,meter:false,dummy:'idle'};
let reviewPaused=false,reviewSpeed=1,reviewClock=0,reviewAnchors=false;
const FIXED_STEP=1/COMBAT.fps;
let accumulator=0;
