const Utility = require('../common/utilities');
const analyzerOptions = require('../wcl/analyzerOptions');

const MIN_THRESHOLD_TO_REPORT = analyzerOptions['rapture']['minThresholdToReport'];
const ABILITIES_TO_EXCLUDE = analyzerOptions['rapture']['abilitiesToExclude'];

// // based on 2k spellpower
// // https://docs.google.com/spreadsheets/d/1QPo0d4rUYFvvsRt2Fpu5_2DlcWeeGylJNx6qCCI9ybk/edit#gid=0
// const pwsHealingToDamage = [
//     {rank: 14, value: 5821},
//     {rank: 13, value: 5471},
//     {rank: 12, value: 4032},
//     {rank: 11, value: 3098},
//     {rank: 10, value: 2267},
//     {rank: 9, value: 1133},
//     {rank: 8, value: 780},
//     {rank: 7, value: 625},
//     {rank: 6, value: 494},
//     {rank: 5, value: 392},
//     {rank: 4, value: 306},
//     {rank: 3, value: 208},
//     {rank: 2, value: 118},
//     {rank: 1, value: 60},
// ];

// // returns the highest rank PWS that can fully absorb all the damage
// function findPWSRank(damage) {
//     let val = 0;
//     damage = Number(damage);
//     for (let i = 0; i < pwsHealingToDamage.length; i++) {
//         if (damage >= pwsHealingToDamage[i]['value']) {
//             return pwsHealingToDamage[i]['rank'];
//         }
//     }
//     return 1;
// }

// used to analyze how many damage events are batched together for rapture
class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._damageTakenData = this._rawdata['data']['reportData']['report']['damageTaken']['data'];
    }

    run(fightStartTimestamp) {
        let counter = {},
            results = [],
            uniqueAbilities = [];
        // nettAdditionalHeal tracks how much more healing +1 spell power generated if we consider overhealing
        // rawAdditionalHeal tracks how much more healing +1 spell power generated if we DON'T consider overhealing
        // let counter = {'overall': {hitsOverHeal: 0, hitsTotal: 0, rawAdditionalHealAmount: 0, nettAdditionalHealAmount: 0}, spells: {}},
        //     sacredShieldHealing = 0; // tracks cumulative amount of sacred shield healing


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
                    results.push({
                        name: name,
                        timestamp: timestamp / 1000,
                        numHits: counter[name][timestamp]['count'],
                        avgDamageTaken: Math.floor(Utility.median(counter[name][timestamp]['damageTaken'])),
                    });
                    // only count unique abilities for those that meet the MIN_THRESHOLD_TO_REPORT
                    if (uniqueAbilities.indexOf(name) === -1) uniqueAbilities.push(name);
                }
            }
        }
        // const colorVariants = ['danger', 'primary', 'success', 'warning', 'info', 'light', 'dark'];
        // we want to ensure that the key colors are taken by abilities that appear at the top (hence need damage -> hits)
        results.sort((a, b) => (b['avgDamageTaken'] - a['avgDamageTaken']) || (b['hits'] - a['hits']));

        for (let i = 0; i < results.length; i++) {
            let pos = uniqueAbilities.indexOf(results[i]['name']);
            // results[i]['_rowVariant'] = (pos > -1  && pos < (colorVariants.length - 1)) ? colorVariants[pos] : 'dark';
        }
        return results;
    }
}

module.exports = Analyzer;