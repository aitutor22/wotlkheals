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

    run(fightStartTimestamp) {
        let combined = [];
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
                    results[healingHit['spell']]++;
                    results['total']++;
                    break;
                }

                // due to batching and weird blizz fuckery, it's possible that revitalize happens after
                // and who knows, before the spell

                // when index is 0, we don't test for i - 1
                if (index === 0) {
                    results[healingHit['spell']]++;
                    results['total']++;
                    break;
                }

                if ((healingHit['timestamp'] - revitalizeProc['timestamp']) < 
                    (revitalizeProc['timestamp'] - combined[index - 1]['timestamp'])) {
                    results[healingHit['spell']]++;
                    results['total']++;
                    break;
                } else {
                    results[combined[index - 1]['spell']]++;
                    results['total']++;
                    break;
                }
            }

        }

        // occurs when final revitalize proc occurs after the final healing hit
        if (results['total'] < this._revitalizeData.length) {
            results[combined[combined.length - 1]['spell']]++;
            results['total']++;
        }
        return results;
    }
}

module.exports = Analyzer;