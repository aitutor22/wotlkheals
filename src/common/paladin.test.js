const Paladin = require('./paladin');

const defaultOptions = {trinkets: []};
const dmcgOptions = {trinkets: ['dmcg']};


test('getManaIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(28000, 300, 0.3, defaultOptions);
    let manaGenerated = player.manaIncreaseFromInt(300);
    expect(manaGenerated).toBe(5445);
});

test('getCritIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(28000, 300, 0.3, defaultOptions);
    let getCritIncreaseFromInt = player.critIncreaseFromInt(300);
    expect((Math.abs(getCritIncreaseFromInt - 0.021779956440087123))).toBeLessThan(1e-9);
});

test('system should add mana from 90 int if dmcg is selected', () => {
    let player = new Paladin(28000, 300, 0.3, dmcgOptions);
    expect(player.maxMana).toBe(29633);
});

test('system should add crit from 90 int if dmcg is selected', () => {
    let player = new Paladin(28000, 300, 0.3, dmcgOptions);
    expect((Math.abs(player.critChance - 0.306533869322614))).toBeLessThan(1e-5);
});

test('setDmcgActive to true', () => {
    let player = new Paladin(28000, 300, 0.3, dmcgOptions);
    player.setDmcgActive(true, 2);
    expect(player._buffs['dmcg']['active']).toBe(true);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);
});

test('setDmcgActive to true', () => {
    let player = new Paladin(28000, 300, 0.3, dmcgOptions);
    player.setDmcgActive(true, 2);
    player.setDmcgActive(false, 17);
    expect(player._buffs['dmcg']['active']).toBe(false);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);
});

test('maxMana and critChance when dmcg active', () => {
    let player = new Paladin(28000, 300, 0.3, dmcgOptions);
    player.setDmcgActive(true, 2);
    expect(player.maxMana).toBe(35078);
    expect((Math.abs(player.critChance - 0.328308338))).toBeLessThan(1e-5);
});

test('selectSpell overrideSpellSelection', () => {
    let player = new Paladin(28000, 300, 0.3, dmcgOptions);
    let spell = player.selectSpell(2, 'HOLY_LIGHT');
    expect(spell['key']).toBe('HOLY_LIGHT');
});

test('selectSpell', () => {
    let player = new Paladin(28000, 300, 0.3, dmcgOptions);
    let spell = player.selectSpell(1);
    // if we don't override, then first spell should be holy shock
    expect(spell['key']).toBe('HOLY_SHOCK');
    let holyShockSpell = player._spells.find((_spell) => _spell['key'] === 'HOLY_SHOCK');
    expect(holyShockSpell['lastUsed']).toBe(1);
    expect(holyShockSpell['availableForUse']).toBe(false);

    spell = player.selectSpell(3.5);
    expect(spell['key']).toBe('HOLY_LIGHT');
});

test('passing no discount factors in subtractManaHelper returns just base cost', () => {
    let player = new Paladin(28000, 300, 0.3, defaultOptions);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2)[1]).toBe(1274);
});

test('testing baseCostMultiplicativeFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(28000, 300, 0.3, defaultOptions);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {})[1]).toBe(637);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'powerInfusion': 0.2}, {})[1]).toBe(1019);
});

test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(28000, 300, 0.3, {});
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'libramOfRenewal': 113})[1]).toBe(1161);
});

test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(28000, 300, 0.3, {});
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800})[1]).toBe(474);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800, 'libramOfRenewal': 113})[1]).toBe(361);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113})[1]).toBe(524);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113, soup: 800})[1]).toBe(0);
});

test('testing subtractManaHelper', () => {
    let player = new Paladin(28000, 300, 0.3, {});
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800}, 0.9)[1]).toBe(426);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800}, 0.95)[1]).toBe(450);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {libramOfRenewal: 113}, 0.9)[1]).toBe(1045);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800, libramOfRenewal: 113}, 0.9)[1]).toBe(325);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {divineIllumination: 0.5}, {libramOfRenewal: 113}, 0.9)[1]).toBe(471);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {divineIllumination: 0.5}, {soup: 800, libramOfRenewal: 113}, 0.9)[1]).toBe(0);
});

test('testing subtractMana', () => {
    let player = new Paladin(28000, 300, 0.3, {'glyphSOW': true, '4pT7': true});
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

