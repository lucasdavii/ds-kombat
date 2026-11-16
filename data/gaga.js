FIGHTERS.gaga={name:'GÁGÁ',subtitle:'O ELÁSTICO ESTRATÉGICO',accent:'#b878ff',hp:110,speed:290,guard:100,size:244,atk:1.0,
    specials:[['BRAÇO ELÁSTICO','Um soco de longo alcance.'],['INFLAR E ESMAGAR','Incha e atinge o rival ao cair no chão.']],ultimate:'MODO BOMBADO (15s)'};
FIGHTERS.gaga.moves={punch:{...COMBAT.punch},kick:{...COMBAT.kick}};
FIGHTERS.gaga.powers=[{"startup": 15, "active": 1, "recovery": 22, "duration": 38, "damage": 20, "range": 0, "knock": 42, "type": "stretch", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 132, "meterCost": 0, "meterHit": 8, "meterBlock": 3, "invulnerability": 0, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}, {"startup": 6, "active": 1, "recovery": 33, "duration": 40, "damage": 20, "range": 226, "knock": 34, "type": "slam", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 282, "meterCost": 0, "meterHit": 8, "meterBlock": 3, "invulnerability": 0, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}, {"startup": 17, "active": 1, "recovery": 35, "duration": 53, "damage": 0, "range": 0, "knock": 0, "type": "mode", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 0, "meterCost": 100, "meterHit": 8, "meterBlock": 3, "invulnerability": 48, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}];
// Ajuste documentado em docs/balanceamento.md.
FIGHTERS.gaga.hp=120;
FIGHTERS.gaga.powers[0].range=473;
FIGHTERS.gaga.powers[0].startup=10;
FIGHTERS.gaga.powers[0].duration=32;
FIGHTERS.gaga.powers[0].recovery=21;
// Bombado acompanha o braço maior da nova pose; volta ao alcance normal ao expirar.
FIGHTERS.gaga.powers[0].buffRange=572;
