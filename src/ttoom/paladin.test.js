const Paladin = require('./paladin');
const Utility = require('../common/utilities');
const Logger = require('../common/logger');

const thresholdItemsToCreate = ['crit', 'soup', 'eog', 'sow', 'dmcg'];
const logger = new Logger();
let rng = Utility.setSeed(0);
const defaultOptions = {
    mp5FromGearAndRaidBuffs: 300,
    unbuffedInt: 1201,
    critChance: 0.1,
    unbuffedSpellPower: 1741,
    trinkets: [],
    cpm: {
        HOLY_LIGHT: 2,
        HOLY_SHOCK: 2,
    },
    gcd: 1.5,
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
    flask: 'distilledWisdom',
};

const dmcgOptions = {
    unbuffedInt: 1201,
    unbuffedSpellPower: 1741,
    mp5FromGearAndRaidBuffs: 300,
    critChance: 0.1,
    trinkets: ['dmcg'],
    cpm: {
        HOLY_LIGHT: 2,
        HOLY_SHOCK: 2,
    },
    gcd: 1.5,
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
    flask: 'distilledWisdom',
};

test('when creating character, first 20 points of int give 1 int only', () => {
    let options = Object.assign({}, defaultOptions);
    options['unbuffedInt'] = 102
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    expect(player._unbuffedInt).toBe(102);
    expect(player._buffedInt).toBe(336);
    expect(player._baseMaxMana).toBe(9154);
})

test('buffed int', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    expect(player._unbuffedInt).toBe(1201);
    expect(player._buffedInt).toBe(1666);
})

test('spellpower', () => {
let options = Object.assign({}, defaultOptions);
    options['unbuffedInt'] = 1201
    options['unbuffedSpellPower'] = 1798
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    expect(player.spellPower).toBe(2457);
})

test('setBuffActive should create a buff entry if not currently present', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    // expect(Object.keys(player._buffs).length).toBe(0);

    player.setBuffActive('dmcg', true, 2);
    expect(Object.keys(player._buffs).length).toBe(1);
});

test('setBuffActive', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    player.setBuffActive('dmcg', true, 2);
    expect(player._buffs['dmcg']['active']).toBe(true);
    player.setBuffActive('dmcg', false, 16);
    expect(player._buffs['dmcg']['active']).toBe(false);
});

test('getManaIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    let manaGenerated = player.manaIncreaseFromInt(300);
    expect(manaGenerated).toBe(5445);
});

test('getCritIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    let getCritIncreaseFromInt = player.critIncreaseFromInt(300);
    expect((Math.abs(getCritIncreaseFromInt - 0.021779956440087123))).toBeLessThan(1e-9);
});

test('spellPowerIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    let amount = player.spellPowerIncreaseFromInt(300);
    expect(amount).toBe(72);
});

// comparing values against currelius' sheet
test('calculateHealingHelper', () => {
    let options = Object.assign({}, defaultOptions);
    options['critChance'] = 0.25;
    options['glyphHolyLightHits'] = 5;
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    expect(player._baseSpellPower).toBe(2400)

    let uncritAmount = player.calculateHealing('HOLY_LIGHT', false);
        critAmount = player.calculateHealing('HOLY_LIGHT', true);
    expect(Math.floor(uncritAmount)).toBe(27035); //double checked againstr currelius' sheet
    expect(Math.floor(critAmount)).toBe(40552); //double checked againstr currelius' sheet

    uncritAmount = player.calculateHealing('FLASH_OF_LIGHT', false);
    critAmount = player.calculateHealing('FLASH_OF_LIGHT', true);
    expect(Math.floor(uncritAmount)).toBe(7660); //double checked againstr currelius' sheet
    expect(Math.floor(critAmount)).toBe(11491); //double checked againstr currelius' sheet

    uncritAmount = player.calculateHealing('HOLY_SHOCK', false);
    critAmount = player.calculateHealing('HOLY_SHOCK', true);
    expect(Math.floor(uncritAmount)).toBe(10435); //double checked againstr currelius' sheet
    expect(Math.floor(critAmount)).toBe(15653); //double checked againstr currelius' sheet


    // testing divine plea should halve healing
    uncritAmount = player.calculateHealing('HOLY_LIGHT', false, true);
    expect(Math.floor(uncritAmount)).toBe(13517);

    // testing divine plea should halve healing
    critAmount = player.calculateHealing('FLASH_OF_LIGHT', true, true);
    expect(Math.floor(critAmount)).toBe(5745);

    // reducing glyphHolyLightHits should reduce Holy Light but not Holy Shock or Flash Of Light
    player._options['glyphHolyLightHits'] = 0
    uncritAmount = player.calculateHealing('HOLY_LIGHT', false);
    critAmount = player.calculateHealing('HOLY_LIGHT', true);
    expect(Math.floor(uncritAmount)).toBe(21628); // reduced since 0 glyph hits
    expect(Math.floor(critAmount)).toBe(32442); 


    uncritAmount = player.calculateHealing('HOLY_SHOCK', false);
    critAmount = player.calculateHealing('HOLY_SHOCK', true);
    expect(Math.floor(uncritAmount)).toBe(10435); // not affected by reducing glyph hl hits
    expect(Math.floor(critAmount)).toBe(15653);
});

// comparing values against currelius' sheet
test('calculateHealingHelper for SacredShield', () => {
    let options = Object.assign({}, defaultOptions);
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    let amount = player.calculateHealing('SACRED_SHIELD', false);
    expect(Math.floor(amount)).toBe(2764); //double checked againstr currelius' sheet

    // divine plea does not affect sacred shield
    let amountWithPlea = player.calculateHealing('SACRED_SHIELD', false, true);
    expect(Math.floor(amountWithPlea)).toBe(2764); //double checked againstr currelius' sheet
});


test('system should add spellpower if soup is selected', () => {
    let copiedOptions = JSON.parse(JSON.stringify(defaultOptions));
    copiedOptions['trinkets'] = ['soup'];
    let player = new Paladin(copiedOptions, rng, thresholdItemsToCreate);
    expect(player.spellPower).toBe(2475);
});

test('system should add int and spellpower if owl is selected', () => {
    let copiedOptions = JSON.parse(JSON.stringify(defaultOptions));
    copiedOptions['trinkets'] = ['owl'];
    let player = new Paladin(copiedOptions, rng, thresholdItemsToCreate);
    expect(player.maxMana).toBe(29104 + 1343);
    expect(player.spellPower).toBe(2417);
});

test('system should add spellpower from 90 int if dmcg is selected', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    expect(player.spellPower).toBe(2421);
});

test('system should add mana from 90 int if dmcg is selected', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    expect(player.maxMana).toBe(29104 + 1633);
});

test('system should add crit from 90 int if dmcg is selected', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    expect((Math.abs(player.critChance - 0.33985378701))).toBeLessThan(1e-5);
});

test('testing setting dmcg to true', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    player.setBuffActive('dmcg', true, 2);
    expect(player._buffs['dmcg']['active']).toBe(true);
});

test('setting dmcg to true 2', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    player.setBuffActive('dmcg', true, 2);
    player.setBuffActive('dmcg', false, 17);
    expect(player._buffs['dmcg']['active']).toBe(false);
});

test('testing isBuffActive', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    expect(player.isBuffActive('dmcg')).toBe(false);
    player.setBuffActive('dmcg', true, 2);
    expect(player.isBuffActive('dmcg')).toBe(true);
    player.setBuffActive('dmcg', false, 17);
    expect(player.isBuffActive('dmcg')).toBe(false);
    expect(player.isBuffActive('others')).toBe(false);
});

test('maxMana and critChance when dmcg active', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    player.setBuffActive('dmcg', true, 2);
    expect(player.maxMana).toBe(36182);
    expect((Math.abs(player.critChance - 0.36163374345))).toBeLessThan(1e-5);
});

test('setting holy_shock cpm to 0 should remove it from the spells', () => {
    let options = JSON.parse(JSON.stringify(defaultOptions));
    options['cpm']['HOLY_SHOCK'] = 0; // set holy shock to 0 so it is not casted
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    expect(player._spells.find((_spell) => _spell['key'] === 'HOLY_SHOCK')).toBe(undefined);
});


test('selectSpell overrideSpellSelection', () => {
    let player = new Paladin(dmcgOptions, rng, thresholdItemsToCreate);
    let spell = player.selectSpellHelper(2, 0, 'HOLY_LIGHT');
    expect(spell['key']).toBe('HOLY_LIGHT');
});

test('selectSpell', () => {
    let options = Object.assign({}, defaultOptions);
    options['cpm']['HOLY_SHOCK'] = 1;
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    let spell = player.selectSpellHelper(1, 0);
    // if we don't override, then first spell should be holy shock
    expect(spell['key']).toBe('HOLY_SHOCK');
    let holyShockSpell = player._spells.find((_spell) => _spell['key'] === 'HOLY_SHOCK');
    expect(holyShockSpell['lastUsed']).toBe(1);
    expect(holyShockSpell['availableForUse']).toBe(false);

    spell = player.selectSpellHelper(3.5, 1);
    expect(spell['key']).toBe('HOLY_LIGHT');
});

test('selectSpell should not select SacredShield if precasted is set to true', () => {
    let options = Object.assign({}, defaultOptions);
    options['cpm']['HOLY_SHOCK'] = 0; // set holy shock to 0 so it is not casted
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    let spell = player.selectSpellHelper(1, 0);
    expect(spell['key']).not.toBe('SACRED_SHIELD');

    // at 61s, we are past the original cooldown, and should pick sacred shield
    spell = player.selectSpellHelper(61, 0);
    expect(spell['key']).toBe('SACRED_SHIELD');
});

test('casting sacred shield should create INITIALIZE_HOT_EVENTS', () => {
    let options = Object.assign({}, defaultOptions);
    options['cpm']['HOLY_SHOCK'] = 0; // set holy shock to 0 so it is not casted
    let player = new Paladin(options, rng, thresholdItemsToCreate, 10);

    // at 61s, we are past the original cooldown, and should pick sacred shield
    let results = player.castSpell('SACRED_SHIELD', 61, 0, logger);
    expect(results[0]).toBe(1);
    expect(results[1]).toBe(null);
    let hotEvent = results[3];
    expect(hotEvent.length).toBe(1)
    expect(hotEvent[0]).toEqual({
        timestamp: 61, 
        eventType: 'INITIALIZE_HOT_EVENTS',
        subEvent: 'SACRED_SHIELD',
    });

});

test('passing no discount factors in subtractManaHelper returns just base cost', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2)[1]).toBe(1274);
});

test('testing baseCostMultiplicativeFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {})[1]).toBe(637);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'powerInfusion': 0.2}, {})[1]).toBe(1019);
});

test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'libramOfRenewal': 113})[1]).toBe(1161);
});

test('testing baseCostAdditiveFactors arugment for subtractManaHelper', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800})[1]).toBe(474);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {}, {'soup': 800, 'libramOfRenewal': 113})[1]).toBe(361);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113})[1]).toBe(524);
    expect(player.subtractManaHelper('HOLY_LIGHT', 2, {'divineIllumination': 0.5}, {'libramOfRenewal': 113, soup: 800})[1]).toBe(0);
});

test('testing subtractManaHelper', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
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
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    let [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 2);
    expect(status).toBe(1);
    expect(manaCost).toBe(1045);
    expect(currentMana).toBe(28059);

    [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 4, {soup: true});
    expect(status).toBe(1);
    expect(manaCost).toBe(325);
    expect(currentMana).toBe(27734);

    [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 6, {eog: true});
    expect(status).toBe(1);
    expect(manaCost).toBe(640);
    expect(currentMana).toBe(27094);

    // if both soup and eog are passed, only use soup
    [status, manaCost, currentMana, _] = player.subtractMana('HOLY_LIGHT', 8, {soup: true, eog: true});
    expect(status).toBe(1);
    expect(manaCost).toBe(325);
    expect(currentMana).toBe(26769);
});

test('testing addManaHelper cannot add beyond maxMana', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    player._currentMana = 28000;
    player.addManaHelper(1300, 'adhoc');
    expect(player._currentMana).toBe(29104);
    expect(player._statistics.manaGenerated['adhoc']).toBe(1104);
});

test('testing addManaFromIllumination', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    player._currentMana = 20000;
    player.addManaFromIllumination('HOLY_LIGHT');
    expect(player._currentMana).toBe(20382);
    player.addManaFromIllumination('HOLY_SHOCK');
    expect(player._currentMana).toBe(20619);
});


test('testing useManaCooldown', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    expect(player._manaCooldowns.length).toBe(1);
    player.useManaCooldown();
});

test('testing addSpellCastToStatistics', () => {
    let player = new Paladin(defaultOptions, rng, thresholdItemsToCreate);
    expect(player._statistics['spellsCasted']).toEqual({});
    player.addSpellCastToStatistics('HOLY_LIGHT', false);
    expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 1, 'crit': 0, 'total': 1});
    player.addSpellCastToStatistics('HOLY_LIGHT', false);
    expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 2, 'crit': 0, 'total': 2});
    player.addSpellCastToStatistics('HOLY_LIGHT', true);
    expect(player._statistics['spellsCasted']['HOLY_LIGHT']).toEqual({'normal': 2, 'crit': 1, 'total': 3});
});

test('testing calculateStatisticsAfterSimEnds', () => {
    let options = JSON.parse(JSON.stringify(defaultOptions));
    options['cpm']['HOLY_SHOCK'] = 1;
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    player._statistics = {
      manaGenerated: {
        libramOfRenewal: 10914,
        illumination: 18757,
        Replenishment: 10528,
        otherMP5: 15134,
        soup: 6736,
        eog: 6885,
        divinePlea: 21000,
        divineIllumination: 5500,
        RUNIC_MANA_POTION: 4300,
        sow: 2240
      },
      spellsCasted: {
        HOLY_LIGHT: { normal: 61, crit: 46, total: 107 },
        HOLY_SHOCK: { normal: 4, crit: 5, total: 9 }
      },
      // placeholder values
      healing: {
        HOLY_LIGHT: 0,
        HOLY_SHOCK: 0,
      }

    }

    let results = player.calculateStatisticsAfterSimEnds(240);

    // cpm is rounded to 1 dp
    expect(results['spellsCasted'].length).toBe(2);
    // expect(results['spellsCasted'].length).toBe(2);
    expect((Math.abs(results['spellsCasted'][0]['cpm'] - 26.8))).toBeLessThan(1e-2);
    expect((Math.abs(results['spellsCasted'][1]['cpm'] - 2.3))).toBeLessThan(1e-2);
    // MP5 is floored
    expect(results['manaGenerated'].length).toBe(10);
    expect((Math.abs(results['manaGenerated'][0]['MP5'] - 227))).toBeLessThan(1e-1);

});

