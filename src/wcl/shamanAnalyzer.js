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
        this._healingData = this._rawdata['healing']['data'];
        this._natureSwiftnessCastData = this._rawdata['natureSwiftness']['data'];
    }

    // given a list of heals (should be 1-4, each representing hits from a single CH cast)
    // determine which heal corresponds to which hit, and calculate overhealing updates in overhealingCounter
    // originall did median of overhealing %, but that gave poor accuracy
    // don't want to mean overhealing% as that's inaccurate too
    // instead just sum overhealing and divide by sum of raw heal
    static calculateOverhealing(healingEvents, overhealingCounter) {
        try {
            // using timestamp to determine which is the first hit and third hit doesn't work if they use the same timestamp
            // a better way is to rank based on healing amount (but need to consider crit)
            for (let entry of healingEvents) {
                // in WCL, overheal doesn't show up if it's 0
                if (!('overheal' in entry)) {
                    entry['overheal'] = 0
                }
                entry['rawHeal'] = entry['amount'] + entry['overheal'];
                // if we want to rank based on healing amount, we need consider only uncrit heal
                entry['uncritRawHeal'] = entry['rawHeal'] / (entry['hitType'] === 2 ? 1.5 : 1);
            }
            // we sort from highest to lowest uncritRawHeal, which will correspond to the hits
            // the largest item is the first item, etc
            healingEvents.sort((a, b) => b['uncritRawHeal'] - a['uncritRawHeal']);
            
            for (let i = 0; i < healingEvents.length; i++) {
                overhealingCounter[i + 1]['rawHeal'] += healingEvents[i]['rawHeal'];
                overhealingCounter[i + 1]['overheal'] += healingEvents[i]['overheal']; 
            }
            return overhealingCounter;   
        } catch (error) {
            console.log(error);
            console.log('error with calculate overheal in shaman');
        }

    }

    categorizeChainHeal(maxNumChainHealHits=4) {
        let combined = this._healingData.concat(this._natureSwiftnessCastData),
            counter = {}, // tracks the total counts for 1, 2, 3, hits (or 4 for WOTLK)
            currentHits = 0,
            totalCasts = 0,
            currentTimestamp = 0,
            castBreakdown = [],
            overhealingCounter = {1: {rawHeal: 0, overheal: 0}, 2: {rawHeal: 0, overheal: 0}, 3: {rawHeal: 0, overheal: 0}, 4: {rawHeal: 0, overheal: 0}},
            currentCastHealingEvents = [];
        // we sort all data first as it's possible that timestamps are jumbled up
        // if CH and NS are at the same timestamp, want NS to be considered first; NS' abilityGameID is less than CH
        combined.sort((a, b) => ((a['timestamp'] - b['timestamp']) || (a['abilityGameID'] - b['abilityGameID'])));


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
                // if (entry['abilityGameID'] === NATURE_SWIFTNESS_ID) {
                //     // console.log('wtf')
                //     // console.log(currentHits)
                //     break;
                // }

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
            try {
                castBreakdown.push({
                    targetsHit: key,
                    amount: counter[key],
                    percentage: counter[key] / totalCasts,
                    overhealingPercent: overhealingCounter[key]['rawHeal'] > 0 ?
                        overhealingCounter[key]['overheal'] / overhealingCounter[key]['rawHeal'] : 0,
                })
            } catch (err) {
                console.log('error');
                console.log(err)
                console.log(key, overhealingCounter)
            }
        }
        return {counter: counter, totalCasts: totalCasts, castBreakdown: castBreakdown, overhealingCounter: overhealingCounter};
    }
}

module.exports = Analyzer;