FIGHTERS.kingbum={
 name:'PAPATEU',subtitle:'O REI DA FOME',accent:'#e0af59',
 hp:139,speed:241,guard:120,size:255,atk:1,role:'Tanque',
 specials:[
  ['ABRE ESPAÇO','Ombrada curta. Aguenta um golpe leve durante o avanço.'],
  ['ÚLTIMA MORDIDA','Cura 5% da vida ao engolir após 0,8 s. Pode ser interrompido. Recarga de 14 s.'],
 ],
 ultimate:'COROA DA FOME',
 moves:{
  punch:{...COMBAT.punch,startup:8,range:98,damage:8},
  kick:{...COMBAT.kick,startup:16,recovery:18,range:150,damage:15},
 },
 powers:[
  {startup:17,active:1,recovery:23,duration:41,damage:15,range:102,knock:78,cooldown:240},
  {startup:48,active:1,recovery:6,duration:55,damage:0,cooldown:840,energyCost:24},
  {startup:20,active:1,recovery:35,duration:56,damage:10,range:113,knock:5,meterCost:100,invulnerability:0},
 ],
};
