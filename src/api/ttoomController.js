const Experiment = require('./experiment');
const DATA = require('../common/gamevalues');


// helper function that combines playerOptions passed from client to create
// a set of options that is passed to experiment
// ONE KEY DIFFERENCE - use critChance is in % (e.g 30), so we need to convert it to probability (0.3) by dividing by 100
function createOptions(playerOptions) {
    // https://code.tutsplus.com/articles/the-best-way-to-deep-copy-an-object-in-javascript--cms-39655
    // WARNING: Object.assign doesn't do a full deep copy - this was the cause of some bugs originally
    // doing let options = Object.assign({}, defaultOptions);
    // and modifiying options['manaCooldowns'] affected source as well
    // use the following method instead (not that this doesnt work if there are functions in the source object)
    let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
    for (let key in playerOptions) {
        if (key === 'critChance') {
            options[key] = playerOptions[key] / 100;    
        } else {
            options[key] = playerOptions[key];
        }
    }

    // start handling of mana options
    // values are currently hardcoded; should improve in future
    if (playerOptions['manaOptions']['selfLoh']) {
        // use LoH when left 3k mana as it's last resort
        let manaDeficit = playerOptions['manaPool'] - 3000;
        options['manaCooldowns'].push({key: 'LAY_ON_HANDS', minimumManaDeficit: manaDeficit, minimumTimeElapsed: 0});
    }

    if (playerOptions['manaOptions']['innervate']) {
        options['manaCooldowns'].push({key: 'INNERVATE', minimumManaDeficit: 18000, minimumTimeElapsed: 0});
    }

    // to avoid a situation where mana tide totem is always trigged by dmcg, we set both a minimum mana and minimum time requirement for MTT
    if (playerOptions['manaOptions']['manaTideTotem']) {
        options['manaCooldowns'].push({key: 'MANA_TIDE_TOTEM', minimumManaDeficit: 12000, minimumTimeElapsed: 40});
    }

    // adds owl to manaCooldowns if player has equipped it
    if (playerOptions['trinkets'].indexOf('owl') > -1) {
        options['manaCooldowns'].push({key: 'OWL', minimumManaDeficit: 10000, minimumTimeElapsed: 0});
    }

    return options;
}

exports.paladinTtoom = (req, res) => {
    let options = createOptions(req.body);

    try {
        // second argument is where logs are sent - 0 for console.log, 1 to an arr that is returned to the client
        let experiment = new Experiment(options, 1);
        let result = experiment.runBatch(1);
        res.send(result);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message)
    }
};

exports.paladinTtoomSeed = (req, res) => {
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
};