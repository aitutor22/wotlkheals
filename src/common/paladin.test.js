const Paladin = require('./paladin');

const defaultOptions = {
    manaPool: 28000,
    mp5FromGearAndRaidBuffs: 300,
    critChance: 0.3,
    trinkets: [],
    castTimes: {
        HOLY_LIGHT: 1.5,
    },
};

const dmcgOptions = {
    manaPool: 28000,
    mp5FromGearAndRaidBuffs: 300,
    critChance: 0.3,
    trinkets: ['dmcg'],
    castTimes: {
        HOLY_LIGHT: 1.5,
    },
};


test('setBuffActive should create a buff entry if not currently present', () => {
    let player = new Paladin(defaultOptions);
    expect(Object.keys(player._buffs).length).toBe(0);

    player.setBuffActive('dmcg', true, 2);
    expect(Object.keys(player._buffs).length).toBe(1);
});

test('setBuffActive', () => {
    let player = new Paladin(defaultOptions);
    player.setBuffActive('dmcg', true, 2);
    expect(player._buffs['dmcg']['active']).toBe(true);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);

    player.setBuffActive('dmcg', false, 16);
    expect(player._buffs['dmcg']['active']).toBe(false);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    // lastUsed is updated when active is set to true not when set to false
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);
});


test('getManaIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(defaultOptions);
    let manaGenerated = player.manaIncreaseFromInt(300);
    expect(manaGenerated).toBe(5445);
});

test('getCritIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(defaultOptions);
    let getCritIncreaseFromInt = player.critIncreaseFromInt(300);
    expect((Math.abs(getCritIncreaseFromInt - 0.021779956440087123))).toBeLessThan(1e-9);
});

test('system should add mana from 90 int if dmcg is selected', () => {
    let player = new Paladin(dmcgOptions);
    expect(player.maxMana).toBe(29633);
});

test('system should add crit from 90 int if dmcg is selected', () => {
    let player = new Paladin(dmcgOptions);
    expect((Math.abs(player.critChance - 0.306533869322614))).toBeLessThan(1e-5);
});

test('testing setting dmcg to true', () => {
    let player = new Paladin(dmcgOptions);
    player.setBuffActive('dmcg', true, 2);
    expect(player._buffs['dmcg']['active']).toBe(true);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);
});

test('setting dmcg to true', () => {
    let player = new Paladin(dmcgOptions);
    player.setBuffActive('dmcg', true, 2);
    player.setBuffActive('dmcg', false, 17);
    expect(player._buffs['dmcg']['active']).toBe(false);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);
});

test('testing isBuffActive', () => {
    let player = new Paladin(defaultOptions);
    expect(player.isBuffActive('dmcg')).toBe(false);
    player.setBuffActive('dmcg', true, 2);
    expect(player.isBuffActive('dmcg')).toBe(true);
    player.setBuffActive('dmcg', false, 17);
    expect(player.isBuffActive('dmcg')).toBe(false);
    expect(player.isBuffActive('others')).toBe(false);
});

test('maxMana and critChance when dmcg active', () => {
    let player = new Paladin(dmcgOptions);
    player.setBuffActive('dmcg', true, 2);
    expect(player.maxMana).toBe(35078);
    expect((Math.abs(player.critChance - 0.328308338))).toBeLessThan(1e-5);
});

test('selectSpell overrideSpellSelection', () => {
    let player = new Paladin(dmcgOptions);
    let spell = player.selectSpell(2, 0, 'HOLY_LIGHT');
    expect(spell['key']).toBe('HOLY_LIGHT');
});

test('selectSpell', () => {
    let player = new Paladin(dmcgOptions);
    let spell = player.selectSpell(1, 0);
    // if we don't override, then first spell should be holy shock
    expect(spell['key']).toBe('HOLY_SHOCK');
    let holyShockSpell = player._spells.find((_spell) => _spell['key'] === 'HOLY_SHOCK');
    expect(holyShockSpell['lastUsed']).toBe(1);
    expect(holyShockSpell['availableForUse']).toBe(false);

    spell = player.selectSpell(3.5, 1);
    expect(spell['key']).toBe('HOLY_LIGHT');
});

test('passing no discount factors in subtractManaHelper returns just base cost', () => {
    let player = new Paladin(defaultOptions);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2)[1]).toBe(1274);
});

test('testing baseCostMultiplicativeFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(defaultOptions);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {})[1]).toBe(637);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'powerInfusion': 0.2}, {})[1]).toBe(1019);
});

test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(defaultOptions);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'libramOfRenewal': 113})[1]).toBe(1161);
});

test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(defaultOptions);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800})[1]).toBe(474);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800, 'libramOfRenewal': 113})[1]).toBe(361);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113})[1]).toBe(524);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113, soup: 800})[1]).toBe(0);
});

test('testing subtractManaHelper', () => {
    let player = new Paladin(defaultOptions);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800}, 0.9)[1]).toBe(426);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800}, 0.95)[1]).toBe(450);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {libramOfRenewal: 113}, 0.9)[1]).toBe(1045);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800, libramOfRenewal: 113}, 0.9)[1]).toBe(325);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {divineIllumination: 0.5}, {libramOfRenewal: 113}, 0.9)[1]).toBe(471);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {divineIllumination: 0.5}, {soup: 800, libramOfRenewal: 113}, 0.9)[1]).toBe(0);
});

test('testing subtractMana', () => {
    let options = Object.assign({}, defaultOptions);
    options['glyphSOW'] = true;
    options['2pT7'] = true;
    options['4pT7'] = true;
    let player = new Paladin(options);

    [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 2);
    expect(status).toBe(1);
    expect(manaCost).toBe(1045);
    expect(currentMana).toBe(26955);

    [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 4, {soup: true});
    expect(status).toBe(1);
    expect(manaCost).toBe(325);
    expect(currentMana).toBe(26630);

    [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 6, {eog: true});
    expect(status).toBe(1);
    expect(manaCost).toBe(640);
    expect(currentMana).toBe(25990);

    // if both soup and eog are passed, only use soup
    [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 8, {soup: true, eog: true});
    expect(status).toBe(1);
    expect(manaCost).toBe(325);
    expect(currentMana).toBe(25665);
});

test('testing addManaHelper cannot add beyond maxMana', () => {
    let player = new Paladin(defaultOptions);
    player._currentMana = 27000;
    player.addManaHelper(1300, 'adhoc');
    expect(player._currentMana).toBe(28000);
    expect(player._statistics.manaGenerated['adhoc']).toBe(1000);
});

test('testing addManaFromIllumination', () => {
    let player = new Paladin(defaultOptions);
    player._currentMana = 20000;
    player.addManaFromIllumination('HOLY_LIGHT');
    expect(player._currentMana).toBe(20382);
    player.addManaFromIllumination('HOLY_SHOCK');
    expect(player._currentMana).toBe(20619);
});




