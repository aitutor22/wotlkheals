const Experiment = require('../ttoom/experiment');
const DATA = require('../ttoom/gamevalues');


// helper function that combines playerOptions passed from client to create
// a set of options that is passed to experiment
// ONE KEY DIFFERENCE - use critChance is in % (e.g 30), so we need to convert it to probability (0.3) by dividing by 100
function createOptions(playerClass, playerOptions) {
    // https://code.tutsplus.com/articles/the-best-way-to-deep-copy-an-object-in-javascript--cms-39655
    // WARNING: Object.assign doesn't do a full deep copy - this was the cause of some bugs originally
    // doing let options = Object.assign({}, defaultOptions);
    // and modifiying options['manaCooldowns'] affected source as well
    // use the following method instead (not that this doesnt work if there are functions in the source object)
    let options = JSON.parse(JSON.stringify(DATA['classes'][playerClass]['defaultValues']));
    for (let key in playerOptions) {
        if (key === 'critChance') {
            options[key] = playerOptions[key] / 100;    
        } else {
            options[key] = playerOptions[key];
        }
    }

    options['manaOptions']['replenishmentUptime'] = options['manaOptions']['replenishmentUptime'] / 100;

    // start handling of mana options
    // values are currently hardcoded; should improve in future
    // the order we push is important, as the first to be pushed will be evaluated first, assuming same mana deficit
    // to avoid a situation where mana tide totem is always trigged by dmcg, we set both a minimum mana and minimum time requirement for MTT
    if (playerOptions['manaOptions']['arcaneTorrent']) {
        if (playerOptions['trinkets'].indexOf('dmcg') > -1 && playerOptions['manaOptions']['useArcaneTorrentWithDmcg']) {
            options['manaCooldowns'].push({key: 'ARCANE_TORRENT', minimumManaDeficit: 3000, minimumTimeElapsed: 0, waitForBuff: 'dmcg'});
        } else {
            options['manaCooldowns'].push({key: 'ARCANE_TORRENT', minimumManaDeficit: 3000, minimumTimeElapsed: 0});
        }
    }

    if (playerOptions['manaOptions']['divinePlea']) {
        options['manaCooldowns'].push({
            key: 'DIVINE_PLEA',
            minimumManaDeficit: playerOptions['manaOptions']['divinePleaMinimumManaDeficit'],
            minimumTimeElapsed: 0
        });
    }

    if (playerOptions['manaOptions']['divineIllumination']) {
        options['manaCooldowns'].push({key: 'DIVINE_ILLUMINATION', minimumManaDeficit: 9000, minimumTimeElapsed: 0});
    }

    // adds owl to manaCooldowns if player has equipped it
    if (playerOptions['trinkets'].indexOf('owl') > -1) {
        options['manaCooldowns'].push({key: 'OWL', minimumManaDeficit: 10000, minimumTimeElapsed: 0});
    }

    // to avoid a situation where mana tide totem is always trigged by dmcg, we set both a minimum mana and minimum time requirement for MTT
    if (playerOptions['manaOptions']['manaTideTotem']) {
        options['manaCooldowns'].push({key: 'MANA_TIDE_TOTEM', minimumManaDeficit: 12000, minimumTimeElapsed: 40});
    }

    if (playerOptions['manaOptions']['innervate']) {
        options['manaCooldowns'].push({key: 'INNERVATE', minimumManaDeficit: 18000, minimumTimeElapsed: 0});
    }

    if (playerOptions['manaOptions']['manaPotion']) {
        options['manaCooldowns'].push({key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0});
    }

    if (playerOptions['manaOptions']['selfLoh']) {
        // use LoH when left 3k mana as it's last resort
        let manaDeficit = playerOptions['manaPool'] - 3000;
        options['manaCooldowns'].push({key: 'LAY_ON_HANDS', minimumManaDeficit: manaDeficit, minimumTimeElapsed: 0});
    }

    return options;
}

exports.ttoom = (req, res) => {
    let playerClass = req.body.playerClass,
        options = createOptions(playerClass, req.body.options);

    let batchSeed = 'seed' in options && options['seed'] > 0 ? options['seed'] : 0;

    try {
        // second argument is where logs are sent - 0 for console.log, 1 to an arr that is returned to the client
        let experiment = new Experiment(options, 1);
        let result = experiment.runBatch(3, batchSeed, playerClass);
        res.send(result);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message)
    }
};

exports.ttoomSeed = (req, res) => {
    let playerClass = req.body.playerClass,
        options = createOptions(playerClass, req.body.options);

    try {
        // second argument is where logs are sent - 0 for console.log, 1 to an arr that is returned to the client
        let experiment = new Experiment(options, 1);
        // console.log(options);
        // first argument is logLevel - 2 shows most details but ommits crti details
        let result = experiment.runSingleLoop(3, req.params.seed, playerClass);
        res.send(result['logs']);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message)
    }
};