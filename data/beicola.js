FIGHTERS.beicola={
 name:'BEIÇOLA',subtitle:'O ASSOBIO DE PRESSÃO',accent:'#58d9d0',
 hp:96,speed:325,guard:98,size:245,atk:1,role:'Controle',
 specials:[
  ['ASSOBIO CORTANTE','Rajada rápida que empurra o rival à distância.'],
  ['SUCÇÃO DE AR','Puxa o oponente para perto; dá para bloquear.'],
 ],
 ultimate:'VENDAVAL DA FAMÍLIA',
 moves:{
  punch:{...COMBAT.punch,startup:9,range:110,damage:8},
  kick:{...COMBAT.kick,startup:13,range:148,damage:11},
 },
 powers:[
  {startup:9,duration:30,damage:10,range:360,knock:44,cooldown:240},
  {startup:12,duration:34,damage:12,range:420,knock:32,cooldown:300},
  {startup:20,duration:60,damage:30,range:880,knock:105,meterCost:100,invulnerability:0},
 ],
};