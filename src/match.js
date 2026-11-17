'use strict';

// Início e fim de luta, troca de rodada e limpeza de entidades.

// Ao trocar de round, descarta comandos, sons e entidades do round anterior.
function clearTransient(){
 stopSounds();clearInputs();particles.length=projectiles.length=minions.length=visualFX.length=0;
 if(game){game.hitStop=0;game.flash=0;game.screenShake=0;}
}

function createFighter(key,x,dir,player,cpu=false){const c=FIGHTERS[key];return {key,c,x,y:FLOOR,dir,player,cpu,vy:0,grounded:true,hp:c.hp,maxHp:c.hp,guard:c.guard,maxGuard:c.guard,energy:50,healthBuff:0,damageBuff:0,buffTimer:0,stun:0,actionTime:0,action:'idle',dashTime:0,dashPower:0,cooldowns:[0,0],walkClock:0,invincible:0,combo:0,prev:{},aiDecision:0,aiAttack:null,aiBlock:false,shake:0};}
let nextPixelStage=0;
function startMatch(reviewSession=false){clearTransient();reviewPaused=false;accumulator=0;screen='fight';hideModal();$('pausedOverlay').classList.add('hidden');
 game={stageIndex:selectedArena??(nextPixelStage++%5),reviewSession,round:1,p1Wins:0,p2Wins:0,timer:ROUND_SECONDS,roundOver:false,roundWait:1.7,roundResult:'',resultTime:0,screenShake:0,flash:0,announcer:'ROUND 1',winner:null,phase:'intro',f:[createFighter(selected[0],320,1,0),createFighter(selected[1],960,-1,1,mode==='solo')]};
 particles.length=0;projectiles.length=0;minions.length=0;visualFX.length=0;showMoves(selected[0]);setStatus(mode==='solo'?'SINGLEPLAYER — VS CPU':'MULTIPLAYER LOCAL');sound(170,.13);}
// Rodadas, dano e agarrões
function resetRound(){clearTransient();game.f=[createFighter(selected[0],320,1,0),createFighter(selected[1],960,-1,1,mode==='solo')];game.roundOver=false;game.hitStop=0;game.timer=ROUND_SECONDS;game.roundWait=1.6;game.phase='intro';game.announcer=`ROUND ${game.round}`;game.flash=0;projectiles.length=0;minions.length=0;particles.length=0;visualFX.length=0;}
function endRound(winner){if(!game||game.roundOver)return;game.roundOver=true;game.resultTime=2.45;game.phase='end';game.winner=winner;game.roundResult=winner===null?'EMPATE':`K.O. • ${winner===0?'JOGADOR 1':mode==='solo'?'CPU':'JOGADOR 2'} VENCEU`;
 if(winner===0)game.p1Wins++;else if(winner===1)game.p2Wins++;projectiles.length=0;minions.length=0;visualFX.length=0;
 for(const f of game.f){f.grab=null;f.grabbedBy=null;f.powerMove=null;f.pendingGroundPunch=false;f.pendingStrike=false;f.inputBuffer={};f.motion=[];f.dashTime=0;f.invincible=0;f.block=false;f.buffTimer=f.damageBuff=f.healthBuff=0;f.shockVisual=0;}
 game.screenShake=0;game.flash=0;sound(95,.42,'sawtooth',.08);}
