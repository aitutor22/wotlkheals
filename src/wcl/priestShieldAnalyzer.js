const Utility = require('../common/utilities');


// used to analyze how many damage events are batched together for rapture
class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._castsData = this._rawdata['casts']['data'];
        this._healsData = this._rawdata['healing']['data'];
    }

    run(startTime) {
        let combined = this._healsData.concat(this._castsData);
        combined.sort((a, b) => (a['timestamp'] - b['timestamp']));
        for (let entry of combined) {
            entry['timestamp'] = (entry['timestamp'] - startTime) / 1000;
        }   
        return combined;
        // for (let entry of combined) {
        //     let key = entry['targetID'];
        //     if (!(key in castsSequence)) {
        //         castsSequence[key] = [];
        //     }
        //     castsSequence[key].push(entry);
        // }

        // function checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, damageTaken) {
        //     if (damageTaken > minDamageAbsorbedThreshold) return;
        //     // if (!(targetID in whiffed)) whiffed[targetID] = 0;
        //     // whiffed[targetID]++;
        //     totalWhiffedCasts++;
        //     let name = (targetID in playerIdToNames) ? playerIdToNames[targetID] : 'pet';
        //     let timestamp = (pwsCastedTimestamp - fightStartTimestamp) / 1000;
        //     logs.push({timestamp: timestamp, message: `PWS casted on ${timestamp}s on ${name} whiffed`});
        // }

        // for (let targetID in castsSequence) {
        //     let totalDamageAbsorbed = 0;
        //     let startedCounting = false;
        //     let pwsCastedTimestamp = 0;
        //     let finishedCountingForPlayer = false;
        //     for (let event of castsSequence[targetID]) {
        //         // initial cast of PWS on this target -> we only start counting from this onwards
        //         if (event['type'] === 'cast') {
        //             if (!startedCounting) {
        //                 if (event['timestamp'] > fightStartTimestamp + endAnalysisTimeOffset) break;
        //                 startedCounting = true;
        //                 pwsCastedTimestamp = event['timestamp'];
        //                 totalCasts++;
        //                 continue;
        //             }
        //             checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, totalDamageAbsorbed);
        //             // resets for next pws
        //             totalDamageAbsorbed = 0;
        //             pwsCastedTimestamp = event['timestamp'];

        //             // if we find a pws cast after the end of analysis time, it means we stop analysing after this
        //             if (event['timestamp'] > fightStartTimestamp + endAnalysisTimeOffset) {
        //                 finishedCountingForPlayer = true;
        //                 break;
        //             }
        //             totalCasts++;
        //         } else {
        //             if (!startedCounting) continue;
        //             // we stop counting until 30s after last pws cast since that's how long pws lasts
        //             if (event['timestamp'] > fightStartTimestamp + endAnalysisTimeOffset + 30000) {
        //                 checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, totalDamageAbsorbed);
        //                 finishedCountingForPlayer = true;
        //                 break;
        //             }
        //             totalDamageAbsorbed += event['amount'];
        //         }
        //     }
        //     if (startedCounting && !finishedCountingForPlayer) {
        //         checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, totalDamageAbsorbed);
        //     }
        // }
        // logs.sort((a, b) => (a['timestamp'] - b['timestamp']))
        // return {logs: logs, totalCasts: totalCasts, totalWhiffedCasts: totalWhiffedCasts};
    }
}

module.exports = Analyzer;