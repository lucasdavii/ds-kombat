FIGHTERS.dino={name:'DINO',subtitle:'O DINO DA QUADRA',accent:'#a1ff4e',hp:110,speed:294,guard:115,size:275,atk:1.13,
    specials:[['AGARRÃO','Agarra o rival e o arremessa.'],['BAFORADA','Solta uma rajada verde à distância.']],ultimate:'FORMA PRIMAL'};
FIGHTERS.dino.moves={punch:{...COMBAT.punch},kick:{...COMBAT.kick}};
FIGHTERS.dino.powers=[{"startup": 18, "active": 1, "recovery": 19, "duration": 38, "damage": 22, "range": 148, "knock": 70, "type": "throw", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 132, "meterCost": 0, "meterHit": 8, "meterBlock": 3, "invulnerability": 0, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}, {"startup": 19, "active": 1, "recovery": 18, "duration": 38, "damage": 18, "range": 0, "knock": 26, "type": "projectile", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 282, "meterCost": 0, "meterHit": 8, "meterBlock": 3, "invulnerability": 0, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}, {"startup": 33, "active": 1, "recovery": 19, "duration": 53, "damage": 36, "range": 1050, "knock": 75, "type": "ultimate", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 0, "meterCost": 100, "meterHit": 8, "meterBlock": 3, "invulnerability": 48, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}];
// Fôlego de grappler; ver docs/balanceamento.md.
FIGHTERS.dino.hp=125;
// Primal: transformação, pé gigante, impacto no quadro 60 e retorno.
FIGHTERS.dino.powers[2].startup=60;
FIGHTERS.dino.powers[2].duration=108;
FIGHTERS.dino.powers[2].recovery=47;
FIGHTERS.dino.powers[2].range=1280;
FIGHTERS.dino.powers[2].invulnerability=78; // termina ao reaparecer; 30q finais puníveis
