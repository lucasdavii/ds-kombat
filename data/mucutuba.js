FIGHTERS.mucutuba={name:'MUCUTUBA',subtitle:'O NEGO TRIBAL',accent:'#6bff44',hp:130,speed:305,guard:105,size:254,atk:1.0,
    specials:[['ANCESTRAIS NEGROS','Invoca ancestrais para atingir o rival.'],['NEGO DOCE','Recupera até 6 de vida e 15 de guarda. Custa 30 de energia e recarrega em 10 s.']],ultimate:'SUPER SHOCK (15s)'};
FIGHTERS.mucutuba.moves={punch:{...COMBAT.punch},kick:{...COMBAT.kick}};
FIGHTERS.mucutuba.powers=[{"startup": 18, "active": 1, "recovery": 19, "duration": 38, "damage": 19, "range": 0, "knock": 26, "type": "projectile", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 132, "meterCost": 0, "meterHit": 8, "meterBlock": 3, "invulnerability": 0, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}, {"startup": 14, "active": 1, "recovery": 23, "duration": 38, "damage": 0, "range": 0, "knock": 0, "type": "heal", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 282, "meterCost": 0, "meterHit": 8, "meterBlock": 3, "invulnerability": 0, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}, {"startup": 29, "active": 1, "recovery": 23, "duration": 53, "damage": 34, "range": 1050, "knock": 70, "type": "ultimate", "height": "high", "hitstun": 30, "blockstun": 16, "cooldown": 0, "meterCost": 100, "meterHit": 8, "meterBlock": 3, "invulnerability": 48, "cancel": [], "note": "Janela ativa representa o evento; projéteis/invocados têm duração própria."}];
Object.assign(FIGHTERS.mucutuba.powers[1],{
 healing:6,
 guardRestore:15,
 energyCost:30,
 cooldown:600,
});

FIGHTERS.mucutuba.shockDuration=15;
