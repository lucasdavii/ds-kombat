'use strict';

// Executa a física e o combate em quadros fixos, separados do desenho.

function fighterGravity(f){
 if(!f.pendingGroundPunch)return COMBAT.gravity;
 return f.key==='chapinha'||f.key==='gaga'?3200:COMBAT.slamGravity;
}
function updateFighter(f, opponent, input, dt, captured = false) {
 if (f.hp <= 0) return;
 const wasGrounded=f.grounded;
 if (!captured) captureInput(f, input);
 tryComboBreak(f,opponent,input);

 // Os efeitos temporários continuam contando durante um agarrão.
 f.buffTimer = Math.max(0, f.buffTimer - dt);
 f.damageBuff = Math.max(0, f.damageBuff - dt);
 f.healthBuff = Math.max(0, f.healthBuff - dt);
 f.shockVisual = Math.max(0, (f.shockVisual || 0) - dt);
 if (f.grabbedBy) {
  f.inputBuffer ||= {};
  return;
 }
 if (f.grab) {
  updateGrab(f, dt);
  return;
 }

 updatePushback(f,dt);
 f.recentHp = Math.max(f.hp, (f.recentHp ?? f.hp) - dt * 35);
 f.hitFlash = Math.max(0, (f.hitFlash || 0) - dt);
 if (f.actionTime <= 0 && f.stun <= 0 && !f.block && f.grounded) {
  f.dir = opponent.x >= f.x ? 1 : -1;
 }
 f.stun = Math.max(0, f.stun - dt);
 f.invincible = Math.max(0, f.invincible - dt);
 f.actionTime = Math.max(0, f.actionTime - dt);
 f.cooldowns = f.cooldowns.map(value => Math.max(0, value - dt));
 f.guard = clamp(f.guard + (input.block ? 4 : 17) * dt, 0, f.maxGuard);
 f.walkClock += dt;
 f.comboTimer = Math.max(0, (f.comboTimer || 0) - dt);
 f.comboDisplay = Math.max(0, (f.comboDisplay || 0) - dt);

 if (f.action === 'down' && f.grounded) {
  if (f.actionTime <= 0) {
   const retreat=input[f.dir===1?'left':'right'];
   f.rollDirection=retreat?-f.dir:0;
   f.action = 'wakeup';
   f.actionTime = .25;
   f.stun = .25;
   f.invincible = .25 + COMBAT.wakeupInvulnerability / 60;
  }
  return;
 }
 if (f.action === 'wakeup') {
  if (f.actionTime > 0) {
   f.x=clamp(f.x+(f.rollDirection||0)*320*dt,55,W-55);
   return;
  }
  f.action = 'idle';
 }
 updateQuickStep(f,dt);
 updatePower(f,dt);
 tryAttackCancel(f);
 const actionable=f.stun<=0&&f.actionTime<=0;
 if(actionable)f.lowGuard=!!input.down&&f.grounded;
 const blocking=f.action==='blockstun'&&f.guard>0||!!(input.block||f.inputBuffer?.block)&&actionable&&f.guard>0&&f.grounded;f.block=blocking;
 if(actionable&&!blocking){
 if(f.grounded&&input.punch&&input.kick&&f.inputBuffer?.punch&&f.inputBuffer?.kick){
  consumeInput(f,'punch');
  consumeInput(f,'kick');
  if(!startGrab(f,opponent,true)){f.action='throwRecovery';f.actionTime=.20;}
 }

 if(f.actionTime<=0&&f.grounded&&!input.down){
  for(const [key,direction] of [['dashLeft',-1],['dashRight',1]]){
   if(consumeInput(f,key)){startQuickStep(f,direction);break;}
  }
 }
 if(f.actionTime<=0&&f.grounded&&f.inputBuffer?.punch&&(input.up||f.inputBuffer.up)){
  consumeInput(f,'up');
  consumeInput(f,'punch');
  basicAttack(f,'punch',true);
 }
 if(f.actionTime<=0&&f.grounded&&consumeInput(f,'up')){
  const direction=Number(!!input.right)-Number(!!input.left);
  f.vy=COMBAT.jumpVelocity;
  f.airVX=direction*f.c.speed*COMBAT.jumpSpeedMultiplier;
  f.grounded=false;
  f.lowGuard=false;
  f.action='jump';
  sound(255,.06,'triangle',.016);
 }

 if(f.actionTime<=0)for(const key of ['ult','sp1','sp2','punch','kick'])if(f.inputBuffer?.[key]){
  if(key==='ult'&&f.energy<100||key==='sp1'&&(f.cooldowns[0]>0||f.energy<specialCost(f.c,0))||key==='sp2'&&(f.cooldowns[1]>0||f.energy<specialCost(f.c,1)))continue;
  consumeInput(f,key);
  if(key==='ult')ultimate(f);else if(key==='sp1'||key==='sp2')special(f,key==='sp1'?0:1);else basicAttack(f,key);
  break;
 }
 }
 if(f.dashTime>0){
  f.x+=f.dir*f.dashPower*dt;
  f.dashTime=Math.max(0,f.dashTime-dt);
  spawnParticle(f.x-f.dir*20,f.y-36,f.c.accent,1,55);
 }else if(actionable&&f.actionTime<=0){let horizontal=(input.right?1:0)-(input.left?1:0);if(blocking||input.down&&f.grounded||!f.grounded)horizontal=0;
 f.backstep=horizontal*f.dir<0;f.lowGuard=input.down;f.x+=horizontal*f.c.speed*dt*(input.down?.45:1);if(input.down&&f.grounded&&!blocking)f.action='crouch';else if(blocking)f.action='guard';else if(horizontal!==0&&f.grounded)f.action='walk';else if(f.grounded&&f.actionTime<=0)f.action='idle';
 }
 f.x=clamp(f.x,55,W-55);
 if(!f.grounded){f.x=clamp(f.x+(f.airVX||0)*dt,55,W-55);f.vy+=fighterGravity(f)*dt;f.y+=f.vy*dt;if(f.y>=FLOOR){f.y=FLOOR;f.vy=0;f.grounded=true;f.airVX=0;spawnParticle(f.x,FLOOR-4,'#b99572',5,90);if(f.fallOnLanding){f.fallOnLanding=false;knockdown(f,true);}if(f.action==='attack'&&f.attackStance==='air'){f.pendingStrike=false;f.action='land';f.actionTime=.10;}if(f.pendingGroundPunch){f.pendingGroundPunch=false;if(f.action==='special'){const move=f.groundMove||{range:260,damage:21,color:'#ff5b6c'};areaHit(f,move.range,move.damage,move.color);game.screenShake=11;}}if(f.actionTime<=0)f.action='idle';}else if(f.actionTime<=0)f.action='jump';}
 if(f.actionTime===0&&['attack','special','ultimate','hit','run','land','blockstun','throwRecovery','escape'].includes(f.action)){f.action=f.grounded?(input.down?'crouch':'idle'):'jump';}
 if(f.key==='kingbum')updateKingIdle(f,dt,!wasGrounded&&f.grounded);
 f.prev={...input};
}

function update(dt) {
 frame++;
 if (screen !== 'fight' || !game) return;

 const pads = getGamepads();
 const [p1, p2] = game.f;
 const a = game.demo ? aiInput(p1, p2, dt) : readInput(0, pads);
 let b;
 if (game.demo || mode === 'solo') b = aiInput(p2, p1, dt);
 else if (game.reviewSession&&training.enabled) {
  b = {
   block: training.dummy === 'guard' || training.dummy === 'low',
   down: training.dummy === 'low',
  };
 } else b = readInput(1, pads);
 if (screen !== 'fight') return;

 // Aceita comandos durante a pausa de impacto, sem gastar o buffer.
 const freezeBuffer = game.hitStop > 0 && !game.roundOver;
 captureInput(p1, a, freezeBuffer);
 captureInput(p2, b, freezeBuffer);
 if (freezeBuffer) {
  game.hitStop = Math.max(0, game.hitStop - dt);
  return;
 }

 if (game.phase === 'intro') {
  game.roundWait -= dt;
  if (game.roundWait <= 0) {
   game.phase = 'fight';
   game.announcer = 'LUTEM!';
   sound(430, .12, 'square', .05);
  }
  return;
 }
 if (game.phase === 'end') {
  game.resultTime -= dt;
  updateEntities(Math.min(dt, .016));
  if (game.resultTime <= 0) {
   if (game.p1Wins >= ROUNDS_TO_WIN || game.p2Wins >= ROUNDS_TO_WIN) finishMatch();
   else {
    game.round++;
    resetRound();
   }
  }
  return;
 }

 if (game.reviewSession&&training.enabled) {
  if (training.health) for (const fighter of game.f) fighter.hp = fighter.maxHp;
  if (training.meter) for (const fighter of game.f) fighter.energy = 100;
 } else game.timer -= dt;

 if (game.timer <= 0) {
  endRound(p1.hp === p2.hp ? null : p1.hp > p2.hp ? 0 : 1);
  return;
 }

 // Avalia os dois lutadores antes de aplicar os acertos do mesmo quadro.
 const leftBefore = p1.x <= p2.x;
 game.hitQueue = [];
 game.collectHits = true;
 updateFighter(p1, p2, a, dt, true);
 if (!game.roundOver) updateFighter(p2, p1, b, dt, true);
 resolveBodyCollision(p1, p2, leftBefore);
 updateBasicStrike(p1,p2);
 updateBasicStrike(p2,p1);
 updateDashStrike(p1,p2);
 updateDashStrike(p2,p1);
 resolveHitQueue();
 if (game.roundOver) return;
 updateEntities(dt);
 game.flash = Math.max(0, game.flash - dt);
 game.screenShake = Math.max(0, game.screenShake - 38 * dt);
}

// O monitor pode desenhar em outra taxa, mas a luta avança sempre em passos de 1/60 s.
function advanceClock(seconds){
 accumulator+=Math.min(Math.max(seconds,0),.25)*(game?.reviewSession?reviewSpeed:1);
 let ticks=0;
 while(accumulator+1e-10>=FIXED_STEP){
  if(!reviewPaused&&screen==='fight'){const frozen=game&&game.hitStop>0;update(FIXED_STEP);if(!frozen)reviewClock+=FIXED_STEP;}
  accumulator-=FIXED_STEP;ticks++;
 }
 return ticks;
}
function gameLoop(now){
 const elapsed=last?Math.max(0,(now-last)/1000):0;last=now;
 advanceClock(elapsed);
 if(screen!=='fight'){const pads=getGamepads();pollMenuPads(pads);if(screen==='pause'){readInput(0,pads);readInput(1,pads);}}
 render(reviewClock);
 requestAnimationFrame(gameLoop);
}
