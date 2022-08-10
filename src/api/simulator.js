const Experiment = require('./experiment');

let playerOptions = {
    playerClass: 'paladin',
    glyphSOW: true,
    '2pT7': true, // +10% crit chance to holy shock
    '4pT7': true, // 5% reduction to HL mana cost
    trinkets: ['soup', 'eog'],
    // trinkets: [],
    // only for spells that are not instants
    castTimes: {
        HOLY_LIGHT: 1.5,
    },
    // for holy shock to proc sow, user is using a 1.6s weapon and/or pauses for a short while after.
    // for simplicity sakes, assume that after a holy_shock, player always waits for full GCD (1.5s) to allow for melee hit to happen
    holyShockCPM: 0,
    gcd: 1.5,
    firstSpell: 'HOLY_LIGHT', // fix which is the first spell we want to cast
    glyphHolyLightHits: 4, 
    manaPool: 29000,
    mp5FromGearAndRaidBuffs: 300,
    critChance: 0.41, // 30% from gear and buffs, 11% from talents
    manaCooldowns: [
        {key: 'DIVINE_PLEA', minimumManaDeficit: 6000, minimumTimeElapsed: 0},
        {key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0}],
};


let experiment = new Experiment(playerOptions);
// arguments: logsLevel, seed, maxMinsToOOM=10

experiment.runSingleLoop(2);
// experiment.runBatch(200);


// OPTIONS = {
//     '2p_t7': True,
//     'soup': True,
//     'eog': True,
//     'dmcg': False, # do not include dmcg buffs here, system will auto add if necesary
//     'owl': False,
//     # end trinket choices
//     'MAX_TIME_TO_OOM': 10 * 60, # stop calculations after how many seconds; default is 10 mins
//     'CAST_TIMES': {
//         'HOLY_LIGHT': 1.6,
//         'HOLY_SHOCK': 0,
//     },
//     'CAST_PROFILE': {
//         'HOLY_SHOCK': {
//             # for holy shock to proc sow, user is using a 1.6s weapon and/or pauses for a short while after.
//             # for simplicity sakes, assume that after a holy_shock, player always waits for full GCD (1.5s) to allow for melee hit to happen
//             'CPM': 0,
//         },
//     },
//     'MP5_FROM_GEAR_AND_RAID_BUFFS': 300,
//     'GCD': 1.5,
//     'GLYPH_HOLY_LIGHT_HITS': 4, # please use integer here
//     # the following values are base values
//     # system will automatically add int/crit values from the trinket choices
//     # e.g. if u select DMCG, DO NOT add 90 int to mana pool or crit chance
//     'MANA_POOL': 29000,
//     'CRIT_CHANCE': 0.41, #assume 30% from gear + buffs, 11% from talents
//     # other mana options
//     'MANA_TIDE_TOTEM': False,
//     # cast profile options
//     # holy shock is used as mana saver via infusion of light and SoW - assumption is there will always be 1 melee hit during HS, which has 45% chance to proc SoW
//     # this requires a 1.6 attack speed weapon - e.g. PVP weapon, and not your usual 1.8 att weapon
//     'USE_HOLY_SHOCK_ON_CD': False,
//     # log options
//     # 0 - hide all logs
//     # 1 - show only summary
//     # 2 - show summary and events
//     # 3 - show crit chance as well
//     'LOGS_LEVEL': 2
// }