const Utility = require('../common/utilities');

const MAX_GAP_TO_BE_CONSIDERED_SAME_CHAIN_HEAL = 500; // in miliseconds
const NATURE_SWIFTNESS_ID = 16188;

class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._healingData = this._rawdata['data']['reportData']['report']['healing']['data'];
        this._natureSwiftnessCastData = this._rawdata['data']['reportData']['report']['natureSwiftness']['data'];
    }

    categorizeChainHeal(maxNumChainHealHits=4) {
        let combined = this._healingData.concat(this._natureSwiftnessCastData),
            counter = {}, // tracks the total counts for 1, 2, 3, hits (or 4 for WOTLK)
            currentHits = 0,
            totalCasts = 0,
            currentTimestamp = 0,
            castBreakdown = [];
        // we sort all data first as it's possible that timestamps are jumbled up
        // looking at logs, NS will always come before the spell it is used on, so don't need a second sort condition
        combined.sort((a, b) => a['timestamp'] - b['timestamp']);

        // initializes the counter to track the num of chain heals
        for (let i = 1; i <= maxNumChainHealHits; i++) {
            counter[i] = 0
        }

        currentTimestamp = -999;

        for (let j = 0; j < combined.length; j++) {
            let entry = combined[j];

            // either NS is used or is new CH cast
            if (entry['abilityGameID'] === NATURE_SWIFTNESS_ID || entry['timestamp'] - currentTimestamp > MAX_GAP_TO_BE_CONSIDERED_SAME_CHAIN_HEAL) {
                // updates the previous cast's hits and stores it in counter
                if (currentHits > 0) {
                    counter[currentHits]++;
                }

                // if NS is casted, then we want to ensure that the next CH cast will always be considered, so we set timestamp to a low number
                if (entry['abilityGameID'] === NATURE_SWIFTNESS_ID) {
                    currentTimestamp = -999;
                    currentHits = 0;
                    continue;
                }

                // if this is a new Chain heal, then we update hits and casts accordingly, and we want this to be the new comparison timestamp
                currentTimestamp = entry['timestamp'];
                currentHits = 1;
                totalCasts++;
                continue
            }

            // within 500ms of current cast, thus increment hits
            currentHits++;
        }
        // after we finish looping thru, we still need to store the final cast's hits
        if (currentHits > 0) {
            counter[currentHits]++;
        }

        for (let key in counter) {
            castBreakdown.push({
                targetsHit: key,
                amount: counter[key],
                percentage: counter[key] / totalCasts,
            })
        }
        return {counter: counter, totalCasts: totalCasts, castBreakdown: castBreakdown};
    }
}

module.exports = Analyzer;