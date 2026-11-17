FIGHTERS.neneu={
 name:'NENEU',subtitle:'O DONO DA MATILHA',role:'Invocador',
 accent:'#e8ad62',hp:110,speed:290,guard:100,size:245,atk:1,
 moves:{
  punch:{...COMBAT.punch,startup:7,damage:8},
  kick:{...COMBAT.kick,startup:12,range:132,damage:12},
 },
 specials:[
  ['PEGA, CARAMELO!','Um avanço baixo. Pule ou defenda agachado.'],
  ['FICA, BRUTUS!','Guarda o espaço à frente. Ataca quando o rival se aproxima.'],
 ],
 ultimate:'SOLTA A MATILHA',
 powers:[
  {startup:14,duration:30,damage:10,cooldown:240},
  {startup:16,duration:32,damage:14,cooldown:300},
  {startup:18,duration:92,damage:10,meterCost:100,invulnerability:0},
 ],
};
