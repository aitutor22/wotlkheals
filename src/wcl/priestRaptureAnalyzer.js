const Utility = require('../common/utilities');
const analyzerOptions = require('../wcl/analyzerOptions');

const MIN_THRESHOLD_TO_REPORT = analyzerOptions['rapture']['minThresholdToReport'];
const ABILITIES_TO_EXCLUDE = analyzerOptions['rapture']['abilitiesToExclude'];

// used to analyze how many damage events are batched together for rapture
class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._damageTakenData = this._rawdata['data']['reportData']['report']['damageTaken']['data'];
    }

    run(fightStartTimestamp) {
        let counter = {},
            results = [];

        for (let entry of this._damageTakenData) {
            // console.log(entry);
            let name = entry['ability']['name'],
                timestamp = Number(entry['timestamp']) - fightStartTimestamp,
                unshieldedAmount;

            // example of abilities that are not really PWS-able or worth rapturing
            if (ABILITIES_TO_EXCLUDE.indexOf(name) > -1) continue;

            if (typeof counter[name] === 'undefined') {
                counter[name] = {};
            }
            if (typeof counter[name][timestamp] === 'undefined') {
                counter[name][timestamp] = {
                    count: 0,
                    damageTaken: [],
                };
            }
            counter[name][timestamp]['count']++;
            // we want to see how much it hits for to see how much of a shield we need
            // was considering doing either amount + overkill + shield vs rawDamage
            unshieldedAmount = entry['amount'] +
                (typeof entry['absorbed'] !== 'undefined' ? entry['absorbed'] : 0);

            // for deaths, we need to add back overkill
            if (typeof entry['overkill'] !== 'undefined') {
                unshieldedAmount += entry['overkill']
            }
            counter[name][timestamp]['damageTaken'].push(unshieldedAmount);
        };

        for (let name in counter) {
            for (let timestamp in counter[name]) {
                if (counter[name][timestamp]['count'] >= MIN_THRESHOLD_TO_REPORT) {
                    let _toPush = {
                        name: name,
                        timestamp: timestamp / 1000,
                        numHits: counter[name][timestamp]['count'],
                        avgDamageTaken: Math.floor(Utility.median(counter[name][timestamp]['damageTaken'])),
                    }
                    if (_toPush['avgDamageTaken'] === 0) continue; //to avoid adding in abilities that both miss
                    results.push(_toPush);
                }
            }
        }
        // const colorVariants = ['danger', 'primary', 'success', 'warning', 'info', 'light', 'dark'];
        // we want to ensure that the key colors are taken by abilities that appear at the top (hence need damage -> hits)
        results.sort((a, b) => (b['avgDamageTaken'] - a['avgDamageTaken']) || (b['hits'] - a['hits']));
        return results;
    }
}

module.exports = Analyzer;