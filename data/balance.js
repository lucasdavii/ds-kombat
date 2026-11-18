'use strict';

// Recargas em quadros a 60 Hz. As janelas de animação ficam no arquivo de cada lutador.
{
 const balance = {
  chapinha: {role:'Pressão', hp:102, speed:322, atk:1.02, cooldowns:[210,312]},
  pitufo: {role:'Tanque de invocação', hp:138, speed:250, cooldowns:[240,282]},
  gaga: {role:'Alcance', hp:103, speed:331, cooldowns:[240,312]},
  dino: {role:'Agarrador', hp:125, speed:306, atk:1.09, cooldowns:[168,270]},
  pneuson: {role:'Tanque de projéteis', hp:145, speed:232, cooldowns:[198,312]},
  mucutuba: {role:'Alcance e cura', hp:108, speed:333, cooldowns:[198,720]},
  kingbum: {role:'Tanque de pressão', hp:139, speed:241, cooldowns:[228,840]},
  paje: {role:'Velocidade', hp:88, speed:372, atk:1.17, cooldowns:[195,312]},
  neneu: {role:'Invocação', hp:116, speed:296, cooldowns:[216,276]}
 };
 for(const [key,{cooldowns,...stats}] of Object.entries(balance)){
  const fighter=FIGHTERS[key];
  Object.assign(fighter,stats);
  cooldowns.forEach((frames,slot)=>{fighter.powers[slot].cooldown=frames;});
 }
 FIGHTERS.chapinha.powers[0].damage=15;
 FIGHTERS.chapinha.powers[1].damage=16;
 FIGHTERS.paje.powers[0].damage=17;
 FIGHTERS.paje.powers[1].damage=29;
 FIGHTERS.paje.powers[2].damage=14;
 FIGHTERS.paje.moves.punch.range+=14;
 FIGHTERS.paje.moves.kick.range+=18;
 [22,26,15].forEach((reach,slot)=>{FIGHTERS.paje.powers[slot].range+=reach;});
 FIGHTERS.dino.powers[0].range+=12;
 FIGHTERS.dino.powers[1].damage+=2;
 FIGHTERS.gaga.powers[0].damage=16;
 FIGHTERS.mucutuba.powers[1].healing=5;
}
