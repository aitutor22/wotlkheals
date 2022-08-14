// for testing
// require('./simulator');

var express = require('express');
var router = express.Router();

const Experiment = require('./experiment');

const defaultOptions = {
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
    spellPower: 2400, // includes spellpower from holy guidance (though if dmcg procs, system will auto calculate)
    critChance: 0.46, // 30% from gear and buffs, 11% from talents
    manaCooldowns: [
        {key: 'DIVINE_PLEA', minimumManaDeficit: 6000, minimumTimeElapsed: 0},
        {key: 'DIVINE_ILLUMINATION', minimumManaDeficit: 9000, minimumTimeElapsed: 0},
        {key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0},
        // {key: 'LAY_ON_HANDS', minimumManaDeficit: 28000, minimumTimeElapsed: 0},
    ],
};

router.post('/ttoom/paladin/:seed', function(req, res) {
    let options = Object.assign({}, defaultOptions);
    // console.log(req.body);
    for (let key in req.body) {
        options[key] = req.body[key];
    }

    try {
        // second argument is where logs are sent - 0 for console.log, 1 to an arr that is returned to the client
        let experiment = new Experiment(options, 1);
        // console.log(options);
        let result = experiment.runSingleLoop(2, req.params.seed);
        res.send(result['logs']);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message)
    }
});

router.post('/ttoom/paladin/', function(req, res) {
    let options = Object.assign({}, defaultOptions);
    for (let key in req.body) {
        options[key] = req.body[key];
    }

    try {
        // second argument is where logs are sent - 0 for console.log, 1 to an arr that is returned to the client
        let experiment = new Experiment(options, 1);
        let result = experiment.runBatch(300);
        res.send(result);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message)
    }
});

router.get('/', function(req, res) {
    res.send('Just a test');
});

module.exports = router;