// Valores em quadros lógicos (60 Hz). Altos: ambas guardas; médios: em pé; baixos: agachada.
const FIGHTERS={};
const COMBAT={fps:60,buffer:6,gravity:1920,slamGravity:1560,jumpVelocity:-830,jumpSpeedMultiplier:1.32,wakeupInvulnerability:18,comboLimit:5,
 punch:{startup:10,active:5,recovery:9,damage:8,knock:17,range:106,hitstun:24,blockstun:12},
 kick:{startup:14,active:5,recovery:10,damage:12,knock:32,range:160,hitstun:28,blockstun:16}};

// Medidas no quadro de contato dos sprites: alcance a partir do pivô,
// altura inferior e superior do braço, em unidades da arena.
const PUNCH_CONTACT={
 neneu:{stand:[108,126,169],low:[104,60,100],air:[108,117,158]},
 beicola:{stand:[110,118,162],low:[110,70,112],air:[110,112,158]},
 paje:{stand:[98,130,175],low:[98,65,105],air:[98,130,175]},
 chapinha:{stand:[108,94,137],low:[111,58,95],air:[116,88,130]},
 pitufo:{stand:[113,110,146],low:[131,72,109],air:[130,99,139]},
 gaga:{stand:[112,130,169],low:[125,103,147],air:[125,114,155]},
 dino:{stand:[143,158,207],low:[161,135,191],air:[125,142,185]},
 pneuson:{stand:[121,153,195],low:[121,79,121],air:[123,161,201]},
 mucutuba:{stand:[109,100,140],low:[124,99,140],air:[119,111,156]},
};
