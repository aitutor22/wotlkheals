const Shaman = require('./shaman');
const Utility = require('../common/utilities');

const thresholdItemsToCreate = ['crit', 'soup', 'dmcg'];
let rng = Utility.setSeed(0);
const defaultOptions = {
    manaPool: 28000,
    mp5FromGearAndRaidBuffs: 300,
    spellPower: 2400,
    critChance: 0.3,
    trinkets: [],
    cpm: {
        CHAIN_HEAL: 30,
    },
    talents: {
    },
    manaOptions: {
      injector: false,
      innervate: false,
      manaTideTotem: false,
    },
    manaCooldowns: [{key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0}],
};


test('baseCritChance for Shaman', () => {
    let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.critChance).toBe(0.44);
});

// // comparing values against currelius' sheet
// test('calculateHealingHelper', () => {
//     let options = Object.assign({}, defaultOptions);
//     options['critChance'] = 0.3;
//     options['spellPower'] = 2500;
//     let player = new Shaman(options, rng, thresholdItemsToCreate);
//     let uncritAmount = player.calculateHealing('CHAIN_HEAL', false);
//         critAmount = player.calculateHealing('CHAIN_HEAL', true);
//     expect(Math.floor(uncritAmount)).toBe(12867); // from lovelace's sheet
//     expect(Math.floor(critAmount)).toBe(19301);

// //     uncritAmount = player.calculateHealing('FLASH_OF_LIGHT', false);
// //     critAmount = player.calculateHealing('FLASH_OF_LIGHT', true);
// //     expect(Math.floor(uncritAmount)).toBe(7660); //double checked againstr currelius' sheet
// //     expect(Math.floor(critAmount)).toBe(11491); //double checked againstr currelius' sheet

// //     uncritAmount = player.calculateHealing('HOLY_SHOCK', false);
// //     critAmount = player.calculateHealing('HOLY_SHOCK', true);
// //     expect(Math.floor(uncritAmount)).toBe(10435); //double checked againstr currelius' sheet
// //     expect(Math.floor(critAmount)).toBe(15653); //double checked againstr currelius' sheet
// });

test('system should add spellpower if soup is selected', () => {
    let copiedOptions = JSON.parse(JSON.stringify(defaultOptions));
    copiedOptions['trinkets'] = ['soup'];
    let player = new Shaman(copiedOptions, rng, thresholdItemsToCreate);
    expect(player.spellPower).toBe(2475);
});

test('system should add int and spellpower if owl is selected', () => {
    let copiedOptions = JSON.parse(JSON.stringify(defaultOptions));
    copiedOptions['trinkets'] = ['owl'];
    let player = new Shaman(copiedOptions, rng, thresholdItemsToCreate);
    expect(player.maxMana).toBe(29343);
    expect(player.spellPower).toBe(2417);
});

test('system should add spellpower from 90 int if dmcg is selected', () => {
    let options = JSON.parse(JSON.stringify(defaultOptions));
    options.trinkets.push('dmcg');
    let player = new Shaman(options, rng, thresholdItemsToCreate);
    expect(player.spellPower).toBe(2421);
});

test('system should add mana from 90 int if dmcg is selected', () => {
    let options = JSON.parse(JSON.stringify(defaultOptions));
    options.trinkets.push('dmcg');
    let player = new Shaman(options, rng, thresholdItemsToCreate);
    expect(player.maxMana).toBe(29633);
});

test('system should add crit from 90 int if dmcg is selected', () => {
    let options = JSON.parse(JSON.stringify(defaultOptions));
    options.trinkets.push('dmcg');
    let player = new Shaman(options, rng, thresholdItemsToCreate);
    expect((Math.abs(player.critChance - 0.4465339869320261))).toBeLessThan(1e-5);
});


test('passing no discount factors in subtractManaHelper returns just base cost', () => {
    let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.subtractManaHelper('CHAIN_HEAL', 2)[1]).toBe(835);
});


test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.subtractManaHelper('CHAIN_HEAL', 2, {}, {'totemOfForestGrowth': 78})[1]).toBe(757);
});

test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.subtractManaHelper('CHAIN_HEAL', 2, {}, {'totemOfForestGrowth': 78}, 0.95)[1]).toBe(719);
    expect(player.subtractManaHelper('CHAIN_HEAL', 2, {}, {'totemOfForestGrowth': 78}, 0.85)[1]).toBe(643);
});


test('testing addManaHelper cannot add beyond maxMana', () => {
    let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
    player._currentMana = 27000;
    player.addManaHelper(1300, 'adhoc');
    expect(player._currentMana).toBe(28000);
    expect(player._statistics.manaGenerated['adhoc']).toBe(1000);
});

// // test('testing addManaFromIllumination', () => {
// //     let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
// //     player._currentMana = 20000;
// //     player.addManaFromIllumination('HOLY_LIGHT');
// //     expect(player._currentMana).toBe(20382);
// //     player.addManaFromIllumination('HOLY_SHOCK');
// //     expect(player._currentMana).toBe(20619);
// // });


// // test('testing useManaCooldown', () => {
// //     let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
// //     expect(player._manaCooldowns.length).toBe(1);
// //     player.useManaCooldown();
// // });

// // test('testing addSpellCastToStatistics', () => {
// //     let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
// //     expect(player._statistics['spellsCasted']).toEqual({});
// //     player.addSpellCastToStatistics('HOLY_LIGHT', false);
// //     expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 1, 'crit': 0, 'total': 1});
// //     player.addSpellCastToStatistics('HOLY_LIGHT', false);
// //     expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 2, 'crit': 0, 'total': 2});
// //     player.addSpellCastToStatistics('HOLY_LIGHT', true);
// //     expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 2, 'crit': 1, 'total': 3});
// // });

// // test('testing calculate_statistics_after_sim_ends', () => {
// //     let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
// //     player._statistics = {
// //       manaGenerated: {
// //         libramOfRenewal: 10914,
// //         illumination: 18757,
// //         Replenishment: 10528,
// //         otherMP5: 15134,
// //         soup: 6736,
// //         eog: 6885,
// //         divinePlea: 21000,
// //         divineIllumination: 5500,
// //         RUNIC_MANA_POTION: 4300,
// //         sow: 2240
// //       },
// //       spellsCasted: {
// //         HOLY_LIGHT: { normal: 61, crit: 46, total: 107 },
// //         HOLY_SHOCK: { normal: 4, crit: 5, total: 9 }
// //       },
// //       // placeholder values
// //       healing: {
// //         HOLY_LIGHT: 0,
// //         HOLY_SHOCK: 0,
// //       }

// //     }

// //     let results = player.calculate_statistics_after_sim_ends(240);

// //     // cpm is rounded to 1 dp
// //     expect(results['spellsCasted'].length).toBe(2);
// //     // expect(results['spellsCasted'].length).toBe(2);
// //     expect((Math.abs(results['spellsCasted'][0]['cpm'] - 26.8))).toBeLessThan(1e-2);
// //     expect((Math.abs(results['spellsCasted'][1]['cpm'] - 2.3))).toBeLessThan(1e-2);
// //     // MP5 is floored
// //     expect(results['manaGenerated'].length).toBe(10);
// //     expect((Math.abs(results['manaGenerated'][0]['MP5'] - 227))).toBeLessThan(1e-1);

// // });

