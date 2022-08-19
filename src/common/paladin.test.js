const Paladin = require('./paladin');
const Utility = require('./utilities');

const thresholdItemsToCreate = ['crit', 'soup', 'eog', 'sow', 'dmcg'];
let rng = Utility.setSeed(0);
const defaultOptions = {
    manaPool: 28000,
    mp5FromGearAndRaidBuffs: 300,
    spellPower: 2400,
    critChance: 0.3,
    trinkets: [],
    cpm: {
        HOLY_LIGHT: 2,
        HOLY_SHOCK: 2,
    },
    talents: {
      enlightenedJudgements: 1,
    },
    manaOptions: {
      divineIllumination: true,
      canSoW: true,
      selfLoh: false,
      injector: false,
      innervate: false,
      manaTideTotem: false,
    },
    manaCooldowns: [{key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0}],
};

const dmcgOptions = {
    manaPool: 28000,
    mp5FromGearAndRaidBuffs: 300,
    spellPower: 2400,
    critChance: 0.3,
    trinkets: ['dmcg'],
    cpm: {
        HOLY_LIGHT: 2,
        HOLY_SHOCK: 2,
    },
    talents: {
      enlightenedJudgements: 1,
    },
    manaOptions: {
      divineIllumination: true,
      canSoW: true,
      selfLoh: false,
      injector: false,
      innervate: false,
      manaTideTotem: false,
    },
    manaCooldowns: [{key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0}],
};


// test('setBuffActive should create a buff entry if not currently present', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(Object.keys(player._buffs).length).toBe(0);

//     player.setBuffActive('dmcg', true, 2);
//     expect(Object.keys(player._buffs).length).toBe(1);
// });

// test('setBuffActive', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     player.setBuffActive('dmcg', true, 2);
//     expect(player._buffs['dmcg']['active']).toBe(true);
//     expect(player._buffs['dmcg']['availableForUse']).toBe(false);
//     expect(player._buffs['dmcg']['lastUsed']).toBe(2);

//     player.setBuffActive('dmcg', false, 16);
//     expect(player._buffs['dmcg']['active']).toBe(false);
//     expect(player._buffs['dmcg']['availableForUse']).toBe(false);
//     // lastUsed is updated when active is set to true not when set to false
//     expect(player._buffs['dmcg']['lastUsed']).toBe(2);
// });


// test('getManaIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     let manaGenerated = player.manaIncreaseFromInt(300);
//     expect(manaGenerated).toBe(5445);
// });

// test('getCritIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     let getCritIncreaseFromInt = player.critIncreaseFromInt(300);
//     expect((Math.abs(getCritIncreaseFromInt - 0.021779956440087123))).toBeLessThan(1e-9);
// });

// test('spellPowerIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     let amount = player.spellPowerIncreaseFromInt(300);
//     expect(amount).toBe(72);
// });


// comparing values against currelius' sheet
test('calculateHealingHelper', () => {
    let options = Object.assign({}, defaultOptions);
    options['critChance'] = 0.25;
    options['spellPower'] = 2400;
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    let uncritAmount = player.calculateHealing('HOLY_LIGHT', false);
        critAmount = player.calculateHealing('HOLY_LIGHT', true);
    expect(Math.floor(uncritAmount)).toBe(26897); //double checked againstr currelius' sheet
    expect(Math.floor(critAmount)).toBe(40345); //double checked againstr currelius' sheet

    uncritAmount = player.calculateHealing('FLASH_OF_LIGHT', false);
    critAmount = player.calculateHealing('FLASH_OF_LIGHT', true);
    expect(Math.floor(uncritAmount)).toBe(7621); //double checked againstr currelius' sheet
    expect(Math.floor(critAmount)).toBe(11431); //double checked againstr currelius' sheet

    uncritAmount = player.calculateHealing('HOLY_SHOCK', false);
    critAmount = player.calculateHealing('HOLY_SHOCK', true);
    expect(Math.floor(uncritAmount)).toBe(10382); //double checked againstr currelius' sheet
    expect(Math.floor(critAmount)).toBe(15573); //double checked againstr currelius' sheet
});



// test('system should add mana from 90 int if dmcg is selected', () => {
//     let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
//     expect(player.maxMana).toBe(29633);
// });

// test('system should add crit from 90 int if dmcg is selected', () => {
//     let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
//     expect((Math.abs(player.critChance - 0.3565339869320261))).toBeLessThan(1e-5);
// });

// test('testing setting dmcg to true', () => {
//     let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
//     player.setBuffActive('dmcg', true, 2);
//     expect(player._buffs['dmcg']['active']).toBe(true);
//     expect(player._buffs['dmcg']['availableForUse']).toBe(false);
//     expect(player._buffs['dmcg']['lastUsed']).toBe(2);
// });

// test('setting dmcg to true', () => {
//     let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
//     player.setBuffActive('dmcg', true, 2);
//     player.setBuffActive('dmcg', false, 17);
//     expect(player._buffs['dmcg']['active']).toBe(false);
//     expect(player._buffs['dmcg']['availableForUse']).toBe(false);
//     expect(player._buffs['dmcg']['lastUsed']).toBe(2);
// });

// test('testing isBuffActive', () => {
//     let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
//     expect(player.isBuffActive('dmcg')).toBe(false);
//     player.setBuffActive('dmcg', true, 2);
//     expect(player.isBuffActive('dmcg')).toBe(true);
//     player.setBuffActive('dmcg', false, 17);
//     expect(player.isBuffActive('dmcg')).toBe(false);
//     expect(player.isBuffActive('others')).toBe(false);
// });

// test('maxMana and critChance when dmcg active', () => {
//     let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
//     player.setBuffActive('dmcg', true, 2);
//     expect(player.maxMana).toBe(35078);
//     expect((Math.abs(player.critChance - 0.3783139433721132))).toBeLessThan(1e-5);
// });

// test('selectSpell overrideSpellSelection', () => {
//     let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
//     let spell = player.selectSpellHelper(2, 0, 'HOLY_LIGHT');
//     expect(spell['key']).toBe('HOLY_LIGHT');
// });

// test('selectSpell', () => {
//     let options = Object.assign({}, defaultOptions);
//     options['holyShockCPM'] = 1;
//     let player = new Paladin(options, rng, thresholdItemsToCreate);
//     let spell = player.selectSpellHelper(1, 0);
//     // if we don't override, then first spell should be holy shock
//     expect(spell['key']).toBe('HOLY_SHOCK');
//     let holyShockSpell = player._spells.find((_spell) => _spell['key'] === 'HOLY_SHOCK');
//     expect(holyShockSpell['lastUsed']).toBe(1);
//     expect(holyShockSpell['availableForUse']).toBe(false);

//     spell = player.selectSpellHelper(3.5, 1);
//     expect(spell['key']).toBe('HOLY_LIGHT');
// });

// test('passing no discount factors in subtractManaHelper returns just base cost', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2)[1]).toBe(1274);
// });

// test('testing baseCostMultiplicativeFactors arugment for subtractManaHelper', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {})[1]).toBe(637);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'powerInfusion': 0.2}, {})[1]).toBe(1019);
// });

// test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'libramOfRenewal': 113})[1]).toBe(1161);
// });

// test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800})[1]).toBe(474);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800, 'libramOfRenewal': 113})[1]).toBe(361);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113})[1]).toBe(524);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113, soup: 800})[1]).toBe(0);
// });

// test('testing subtractManaHelper', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800}, 0.9)[1]).toBe(426);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800}, 0.95)[1]).toBe(450);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {libramOfRenewal: 113}, 0.9)[1]).toBe(1045);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {soup: 800, libramOfRenewal: 113}, 0.9)[1]).toBe(325);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {divineIllumination: 0.5}, {libramOfRenewal: 113}, 0.9)[1]).toBe(471);
//     expect(player.subtractManaHelper('HOLY_LIGHT', 2, {divineIllumination: 0.5}, {soup: 800, libramOfRenewal: 113}, 0.9)[1]).toBe(0);
// });

// test('testing subtractMana', () => {
//     let options = Object.assign({}, defaultOptions);
//     options['glyphSOW'] = true;
//     options['2pT7'] = true;
//     options['4pT7'] = true;
//     let player = new Paladin(options, rng, thresholdItemsToCreate);

//     [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 2);
//     expect(status).toBe(1);
//     expect(manaCost).toBe(1045);
//     expect(currentMana).toBe(26955);

//     [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 4, {soup: true});
//     expect(status).toBe(1);
//     expect(manaCost).toBe(325);
//     expect(currentMana).toBe(26630);

//     [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 6, {eog: true});
//     expect(status).toBe(1);
//     expect(manaCost).toBe(640);
//     expect(currentMana).toBe(25990);

//     // if both soup and eog are passed, only use soup
//     [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 8, {soup: true, eog: true});
//     expect(status).toBe(1);
//     expect(manaCost).toBe(325);
//     expect(currentMana).toBe(25665);
// });

// test('testing addManaHelper cannot add beyond maxMana', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     player._currentMana = 27000;
//     player.addManaHelper(1300, 'adhoc');
//     expect(player._currentMana).toBe(28000);
//     expect(player._statistics.manaGenerated['adhoc']).toBe(1000);
// });

// test('testing addManaFromIllumination', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     player._currentMana = 20000;
//     player.addManaFromIllumination('HOLY_LIGHT');
//     expect(player._currentMana).toBe(20382);
//     player.addManaFromIllumination('HOLY_SHOCK');
//     expect(player._currentMana).toBe(20619);
// });


// test('testing useManaCooldown', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(player._manaCooldowns.length).toBe(1);
//     player.useManaCooldown();
// });

// test('testing addSpellCastToStatistics', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     expect(player._statistics['spellsCasted']).toEqual({});
//     player.addSpellCastToStatistics('HOLY_LIGHT', false);
//     expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 1, 'crit': 0, 'total': 1});
//     player.addSpellCastToStatistics('HOLY_LIGHT', false);
//     expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 2, 'crit': 0, 'total': 2});
//     player.addSpellCastToStatistics('HOLY_LIGHT', true);
//     expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 2, 'crit': 1, 'total': 3});
// });

// test('testing calculate_statistics_after_sim_ends', () => {
//     let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
//     player._statistics = {
//       manaGenerated: {
//         libramOfRenewal: 10914,
//         illumination: 18757,
//         Replenishment: 10528,
//         otherMP5: 15134,
//         soup: 6736,
//         eog: 6885,
//         divinePlea: 21000,
//         divineIllumination: 5500,
//         RUNIC_MANA_POTION: 4300,
//         sow: 2240
//       },
//       spellsCasted: {
//         HOLY_LIGHT: { normal: 61, crit: 46, total: 107 },
//         HOLY_SHOCK: { normal: 4, crit: 5, total: 9 }
//       }
//     }

//     let results = player.calculate_statistics_after_sim_ends(240);

//     // cpm is rounded to 1 dp
//     expect(results['spellsCasted'].length).toBe(2);
//     expect((Math.abs(results['spellsCasted'][0]['cpm'] - 26.8))).toBeLessThan(1e-2);
//     expect((Math.abs(results['spellsCasted'][1]['cpm'] - 2.3))).toBeLessThan(1e-2);
//     // MP5 is floored
//     expect(results['manaGenerated'].length).toBe(10);
//     expect((Math.abs(results['manaGenerated'][0]['MP5'] - 227))).toBeLessThan(1e-1);

// });

