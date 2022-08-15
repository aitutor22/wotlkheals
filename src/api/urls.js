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
    critChance: 0.3, // from gear and raid buffs; does not include talents
    manaCooldowns: [
        {key: 'DIVINE_PLEA', minimumManaDeficit: 8000, minimumTimeElapsed: 0},
        {key: 'DIVINE_ILLUMINATION', minimumManaDeficit: 9000, minimumTimeElapsed: 0},
        {key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0},
        // {key: 'LAY_ON_HANDS', minimumManaDeficit: 28000, minimumTimeElapsed: 0},
    ],
};

// helper function that combines playerOptions passed from client to create
// a set of options that is passed to experiment
// ONE KEY DIFFERENCE - use critChance is in % (e.g 30), so we need to convert it to probability (0.3) by dividing by 100
function createOptions(playerOptions) {
    let options = Object.assign({}, defaultOptions);
    for (let key in playerOptions) {
        if (key === 'critChance') {
            options[key] = playerOptions[key] / 100;    
        } else {
            options[key] = playerOptions[key];
        }
    }
    // console.log(playerOptions)

    // adds owl to manaCooldowns if player has equipped it
    if (playerOptions['trinkets'].indexOf('owl') > -1) {
        options['manaCooldowns'].push({key: 'OWL', minimumManaDeficit: 10000, minimumTimeElapsed: 0});
    }
    return options;
}

router.post('/ttoom/paladin/:seed', function(req, res) {
    let options = createOptions(req.body);

    try {
        // second argument is where logs are sent - 0 for console.log, 1 to an arr that is returned to the client
        let experiment = new Experiment(options, 1);
        // console.log(options);
        // first argument is logLevel - 2 shows most details but ommits crti details
        let result = experiment.runSingleLoop(3, req.params.seed);
        res.send(result['logs']);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message)
    }
});

router.post('/ttoom/paladin/', function(req, res) {
    let options = createOptions(req.body);

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