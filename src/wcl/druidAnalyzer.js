const Utility = require('../common/utilities');

const MAX_GAP_TO_BE_CONSIDERED_SAME_CHAIN_HEAL = 50; // in miliseconds


class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._revitalizeData = this._rawdata['revitalize']['data'];
        this._wildGrowthData = this._rawdata['wildgrowth']['data'];
        this._rejuvenationData = this._rawdata['rejuvenation']['data'];
    }

    run(fightStartTimestamp, petIds) {
        let combined = [];
        let resultsBreakdown = {total: {pet: 0, player: 0, total: 0}};
        let results = {wildGrowth: 0, rejuvenation: 0, total: 0};
        for (let entry of this._wildGrowthData) {
            entry['spell'] = 'wildGrowth';
            entry['timestamp'] -= fightStartTimestamp;
        }

        for (let entry of this._rejuvenationData) {
            entry['spell'] = 'rejuvenation';
            entry['timestamp'] -= fightStartTimestamp;
        }

        combined = this._wildGrowthData.concat(this._rejuvenationData)
        combined.sort((a, b) => {
            if (a['timestamp'] === b['timestamp']) {
                return a['spell'] === 'rejuvenation' ? -1 : 1;
            }
            return a['timestamp'] - b['timestamp'];
        });

        for (let entry of this._revitalizeData) {
            entry['timestamp'] -= fightStartTimestamp;
        }

        this._revitalizeData.sort((a, b) => (a['timestamp'] - b['timestamp']));

        function updateResults(entry) {
            try {
                let targetId = entry['targetID'],
                    spell = entry['spell'];

                let onPet = petIds.indexOf(targetId) > -1;
                results['total']++;
                results[spell]++;
                resultsBreakdown['total']['total']++;       
                if (onPet) {
                    resultsBreakdown['total']['pet']++;
                } else {
                    resultsBreakdown['total']['player']++;
                }

                if (typeof resultsBreakdown[spell] === 'undefined') {
                    resultsBreakdown[spell] = {pet: 0, player: 0, total: 0};
                }

                resultsBreakdown[spell]['total']++;       
                if (onPet) {
                    resultsBreakdown[spell]['pet']++;
                } else {
                    resultsBreakdown[spell]['player']++;
                }
            } catch (error) {
                console.log('error with update results in druid');
                console.log(error)
                throw error;
            }

        }

        // tracker for combined (healing spells)
        let index = 0;
        for (let [revitalizeIndex, revitalizeProc] of this._revitalizeData.entries()) {
            index = 0
            while (index < combined.length) {
                let healingHit = combined[index];
                if (healingHit['timestamp'] < revitalizeProc['timestamp']) {
                    index++;
                    continue;
                }
                if (healingHit['timestamp'] === revitalizeProc['timestamp']) {
                    updateResults(healingHit);
                    // results[healingHit['spell']]++;
                    // results['total']++;
                    break;
                }

                // due to batching and weird blizz fuckery, it's possible that revitalize happens after
                // and who knows, before the spell

                // when index is 0, we don't test for i - 1
                if (index === 0) {
                    updateResults(healingHit);
                    // results[healingHit['spell']]++;
                    // results['total']++;
                    break;
                }

                if ((healingHit['timestamp'] - revitalizeProc['timestamp']) < 
                        (revitalizeProc['timestamp'] - combined[index - 1]['timestamp'])) {
                    updateResults(healingHit);
                    // results[healingHit['spell']]++;
                    // results['total']++;
                    break;
                } else {
                    updateResults(combined[index - 1]);
                    // results[combined[index - 1]['spell']]++;
                    // results['total']++;
                    break;
                }
            }

        }

        // occurs when final revitalize proc occurs after the final healing hit
        if (results['total'] < this._revitalizeData.length) {
            updateResults(combined[combined.length - 1]);
            // results[combined[combined.length - 1]['spell']]++;
            // results['total']++;
        }
        return resultsBreakdown;
    }
}

module.exports = Analyzer;