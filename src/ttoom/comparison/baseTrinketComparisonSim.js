const DATA = require('../gamevalues');
const Utility = require('../../common/utilities');
const Paladin = require('../paladin');
const Experiment = require('../experiment');

/**
 *  - Base class that will be extended by a specific healing class (e.g. Paladin)
 *  - Used to compare different options (e.g. which trinkets to wear)
 */
class BaseTrinketComparisonSim {
    constructor(playerClass, playerOptions, batchSeed) {
        if (playerClass !== 'paladin') throw new Error('Invalid player class: ' + playerClass);
        this._trinketsCombinations = BaseTrinketComparisonSim.generateTrinkets(['soup', 'eog', 'dmcg', 'illustration', 'owl']);
        this._options = playerOptions;
        this._batchSeed = batchSeed;
    }

    run() {
     for (let combination of this._trinketsCombinations) {
         let r = this.runComparison(combination);
         console.log(combination, r.ttoom, r.hps);
     }   
    }

    runComparison(trinketCombination) {
        let options = JSON.parse(JSON.stringify(this._options));
        options.trinkets = trinketCombination;
        let experiment = new Experiment(options, 1);
        let result = experiment.runBatch(200, this._batchSeed, this._playerClass);
        return result;
    }

    // given a list of trinkets, generate list of combinations
    // to improve performance, if a trinket is strictly overshadowed (e.g eog is worse than soup)
    // then we do not need to consider it in simulations, except when together (e.g. soup + eog)
    static generateTrinkets(selectedTrinkets) {
        let strictlyOvershadowedTrinkets = DATA.strictlyOvershadowedTrinkets;

        let results = [];
        for (let i = 0; i < selectedTrinkets.length; i++) {
            for (let j = i + 1; j < selectedTrinkets.length; j++) {
                // || selectedTrinkets[j] in strictlyOvershadowedTrinkets
                if (selectedTrinkets[i] in strictlyOvershadowedTrinkets &&
                    strictlyOvershadowedTrinkets[selectedTrinkets[i]].indexOf(selectedTrinkets[j]) === -1) {
                    continue;
                } else if (selectedTrinkets[j] in strictlyOvershadowedTrinkets &&
                    strictlyOvershadowedTrinkets[selectedTrinkets[j]].indexOf(selectedTrinkets[i]) === -1) {
                    continue;
                }
                results.push([selectedTrinkets[i], selectedTrinkets[j]]);
            }
        }
        return results;
    }
}
module.exports = BaseTrinketComparisonSim;