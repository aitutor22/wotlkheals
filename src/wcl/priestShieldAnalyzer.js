const Utility = require('../common/utilities');


// used to analyze how many damage events are batched together for rapture
class Analyzer {
    constructor(data, playerIdToData) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._castsData = this._rawdata['casts']['data'];
        this._healsData = this._rawdata['healing']['data'];
        this._rapturesData = this._rawdata['raptures']['data'];
        this._shieldBreaksData = this._rawdata['shieldBreaks']['data'].filter((entry) => entry.type === 'removebuff');
        this._playerIdToData = playerIdToData;
        // this._damageTakenShieldBreaksData = this._rawdata['damageTakenShieldBreaks']['data'];
    }

    // determines which player led to a rapture proc
    getRaptureProccer(pwsHealedWhichAbilityMap) {
        let results = [];

        // to deal with the case of multiple raptures, we count backwards instead
        let j = this._shieldBreaksData.length - 1;
        for (let i = this._rapturesData.length - 1; i >= 0; i--) {
            let currentRapture = this._rapturesData[i];
            // traverse shields break data until we find the shield break event that is just before rapture
            while (j >= 0 && this._shieldBreaksData[j]['timestamp'] > currentRapture['timestamp']) {
                // console.log(`rejecting; ${this._shieldBreaksData[j]['timestamp']}`)
                j--;
            }

            // if reached end of shieldbreaks data
            if (j < 0) {
                break;
            }

            // console.log(pwsHealedWhichAbilityMap)
            let targetID = this._shieldBreaksData[j]['targetID'],
                timestamp = this._shieldBreaksData[j]['timestamp'],
                target = this._playerIdToData[targetID];
            // trying to get which ability caused it to proc
            let abilityNames = [];
            // console.log(pwsHealedWhichAbilityMap)
            if (targetID in pwsHealedWhichAbilityMap) {
                if (timestamp in pwsHealedWhichAbilityMap[targetID]) {
                    abilityNames = pwsHealedWhichAbilityMap[targetID][timestamp]
                } else {
                    // sometimes there is a lag between healing event and shield breaking (buff gone)
                    // healing event should come before shield breaking, and in that case, we look for the next closet event
                    let prev = [];
                    for (let _ts in pwsHealedWhichAbilityMap[targetID]) {
                        if (_ts > timestamp) break;
                        prev = pwsHealedWhichAbilityMap[targetID][_ts];   
                    }
                    abilityNames = prev;
                }
            }
            
            results.unshift({timestamp: currentRapture['timestamp'], name: target['name'], id: target['id'], abilityNames: abilityNames})
            j--;
        }
        return results;
    }

    run(startTime) {
        let combined = this._healsData.concat(this._castsData);
        combined.sort((a, b) => (a['timestamp'] - b['timestamp']));
        // track 
        let pwsHealedWhichAbilityMap = {},
            pwsHealedWhichAbilityList = [];
        for (let entry of combined) {
            entry['timestamp'] = (entry['timestamp'] - startTime) / 1000;
            // we want to track what each pws healed
            // that way we can link each rapture to a specific enemy ability
            if (entry['type'] === 'absorbed') {
                if (!(entry['targetID'] in pwsHealedWhichAbilityMap)) {
                    pwsHealedWhichAbilityMap[entry['targetID']] = {}
                }
                // pwsHealedWhichAbilityMap[entry['targetID']].push({
                //     timestamp: entry['timestamp'],
                //     abilityName: entry['extraAbility']['name'],
                // });
                if (!(entry['timestamp'] in pwsHealedWhichAbilityMap[entry['targetID']])) {
                    pwsHealedWhichAbilityMap[entry['targetID']][entry['timestamp']] = [];
                }
                if (pwsHealedWhichAbilityMap[entry['targetID']][entry['timestamp']].indexOf(entry['extraAbility']['name']) === -1) {
                    pwsHealedWhichAbilityMap[entry['targetID']][entry['timestamp']].push(entry['extraAbility']['name']);
                }
            }
        }

        for (let raptureEntry of this._rapturesData) {
            raptureEntry['timestamp'] = (raptureEntry['timestamp'] - startTime) / 1000;
        }

        for (let shieldBreakEntry of this._shieldBreaksData) {
            shieldBreakEntry['timestamp'] = (shieldBreakEntry['timestamp'] - startTime) / 1000;
        }

        let raptureProccers = this.getRaptureProccer(pwsHealedWhichAbilityMap);
        // add the name and id of the player who actually caused the rapture proc
        for (let i = 0; i < this._rapturesData.length; i++) {
            this._rapturesData[i]['proccerID'] = raptureProccers[i]['id'];
            this._rapturesData[i]['proccerName'] = raptureProccers[i]['name'];
            this._rapturesData[i]['abilitiesCausingProc'] = raptureProccers[i]['abilityNames'];
        }
        // console.log(raptureProccers)

        return [combined, this._rapturesData, raptureProccers];
    }
}

module.exports = Analyzer;