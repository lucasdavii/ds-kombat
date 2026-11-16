FIGHTERS.paje={
 name:'PAJÉ',subtitle:'SOL DE BRASA',accent:'#ff8937',
 hp:98,speed:350,guard:96,size:247,atk:1,role:'Velocidade',
 specials:[
  ['PASSO DE FAÍSCA','Avanço rasante seguido de chute rápido.'],
  ['PONTO DE IGNIÇÃO','Soco explosivo de perto. Errou ou bateu na guarda, dá abertura.'],
 ],
 ultimate:'SOL DE BRASA',
 moves:{
  punch:{...COMBAT.punch,startup:6,range:98,damage:9},
  kick:{...COMBAT.kick,startup:10,range:132,damage:13},
 },
 powers:[
  {startup:15,duration:36,damage:10,range:125,knock:48,cooldown:230},
  {startup:18,duration:55,damage:21,range:108,knock:64,cooldown:300},
  {startup:22,duration:68,damage:10,range:105,knock:4,meterCost:100,invulnerability:0},
 ],
};
