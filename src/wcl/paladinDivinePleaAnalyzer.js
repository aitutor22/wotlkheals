const Utility = require('../common/utilities');

class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._damageTakenData = data['damageTaken']['data'];
    }

    run(fightStartTimestamp) {
        let endTimestamp = this._damageTakenData[this._damageTakenData.length - 1]['timestamp'] - fightStartTimestamp;
        let results = {overall: [], rawData: []};
        for (let i = 0; i < Math.floor(endTimestamp / 1000) + 1; i++) {
            results['overall'].push(0);
        }

        for (let entry of this._damageTakenData) {
            entry['timestamp'] -= fightStartTimestamp;
            entry['editedTimestamp'] = Utility.roundDp(entry['timestamp'] / 1000, 3);
            entry['second'] = Math.floor(entry['timestamp'] / 1000);
            results['overall'][entry['second']] += entry['amount'];
        }

        results['rawData'] = this._damageTakenData
        return results;

    }
}

module.exports = Analyzer;