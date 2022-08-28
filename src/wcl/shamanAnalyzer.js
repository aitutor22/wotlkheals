const Utility = require('../common/utilities');

const MAX_GAP_TO_BE_CONSIDERED_SAME_CHAIN_HEAL = 500; // in miliseconds
const NATURE_SWIFTNESS_ID = 16188;

// used to analyze how many hits each chain heal does
// requires chain heal healing events, and nature swiftness casts
// we need NS because after NS, the next CH is much faster, and could be within the MAX_GAP_TO_BE_CONSIDERED_SAME_CHAIN_HEAL
class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._healingData = this._rawdata['data']['reportData']['report']['healing']['data'];
        this._natureSwiftnessCastData = this._rawdata['data']['reportData']['report']['natureSwiftness']['data'];
    }

    // given a list of heals (should be 1-4, each representing hits from a single CH cast)
    // determine which heal corresponds to which hit, and calculate overhealing percentage and updates in overhealingCounter
    static calculateOverhealing(healingEvents, overhealingCounter) {
        // using timestamp to determine which is the first hit and third hit doesn't work if they use the same timestamp
        // a better way is to rank based on healing amount (but need to consider crit)
        for (let entry of healingEvents) {
            // in WCL, overheal doesn't show up if it's 0
            let overheal = 'overheal' in entry ? entry['overheal'] : 0;
            entry['rawHeal'] = entry['amount'] + overheal;
            entry['overhealingPercent'] = overheal / entry['rawHeal'];
            // if we want to rank based on healing amount, we need consider only uncrit heal
            entry['uncritRawHeal'] = entry['rawHeal'] / (entry['hitType'] === 2 ? 1.5 : 1);
        }
        // we sort from highest to lowest uncritRawHeal, which will correspond to the hits
        // the largest item is the first item, etc
        healingEvents.sort((a, b) => b['uncritRawHeal'] - a['uncritRawHeal']);
        
        for (let i = 0; i < healingEvents.length; i++) {
            overhealingCounter[i + 1].push(healingEvents[i]['overhealingPercent']);
        }
        return overhealingCounter;
    }

    categorizeChainHeal(maxNumChainHealHits=4) {
        let combined = this._healingData.concat(this._natureSwiftnessCastData),
            counter = {}, // tracks the total counts for 1, 2, 3, hits (or 4 for WOTLK)
            currentHits = 0,
            totalCasts = 0,
            currentTimestamp = 0,
            castBreakdown = [],
            overhealingCounter = {1: [], 2: [], 3: [], 4: []},
            currentCastHealingEvents = [];
        // we sort all data first as it's possible that timestamps are jumbled up
        // looking at logs, NS will always come before the spell it is used on, so don't need a second sort condition
        combined.sort((a, b) => a['timestamp'] - b['timestamp']);

        // console.log(this._healingData.length)

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
                    Analyzer.calculateOverhealing(currentCastHealingEvents, overhealingCounter);
                    currentCastHealingEvents = [];
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
                currentCastHealingEvents.push(entry);
                totalCasts++;
                continue
            }

            // within 500ms of current cast, thus increment hits
            currentHits++;
            currentCastHealingEvents.push(entry);
        }
        // after we finish looping thru, we still need to store the final cast's hits
        if (currentHits > 0) {
            counter[currentHits]++;
            Analyzer.calculateOverhealing(currentCastHealingEvents, overhealingCounter);
        }

        for (let key in counter) {
            castBreakdown.push({
                targetsHit: key,
                amount: counter[key],
                percentage: counter[key] / totalCasts,
                medianOverhealing: overhealingCounter[key].length > 0 ? Utility.median(overhealingCounter[key]) : 0,
            })
        }
        // console.log(castBreakdown);
        return {counter: counter, totalCasts: totalCasts, castBreakdown: castBreakdown};
    }
}

module.exports = Analyzer;