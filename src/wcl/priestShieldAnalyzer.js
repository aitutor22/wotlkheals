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
        // console.log(this._shieldBreaksData);
        // console.log(this._rapturesData)
    }

    // determines which player led to a rapture proc
    getRaptureProccer() {
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

            // console.log(currentRapture, this._shieldBreaksData[j])
            let target = this._playerIdToData[this._shieldBreaksData[j]['targetID']]
            results.unshift({timestamp: currentRapture['timestamp'], name: target['name'], id: target['id']})
            // console.log(target['name']);
            j--;
        }
        return results;
    }

    run(startTime) {
        let combined = this._healsData.concat(this._castsData);
        combined.sort((a, b) => (a['timestamp'] - b['timestamp']));
        for (let entry of combined) {
            entry['timestamp'] = (entry['timestamp'] - startTime) / 1000;
        }
        for (let raptureEntry of this._rapturesData) {
            raptureEntry['timestamp'] = (raptureEntry['timestamp'] - startTime) / 1000;
        }

        for (let shieldBreakEntry of this._shieldBreaksData) {
            shieldBreakEntry['timestamp'] = (shieldBreakEntry['timestamp'] - startTime) / 1000;
        }
        let raptureProccers = this.getRaptureProccer();
        // add the name and id of the player who actually caused the rapture proc
        for (let i = 0; i < this._rapturesData.length; i++) {
            this._rapturesData[i]['proccerID'] = raptureProccers[i]['id'];
            this._rapturesData[i]['proccerName'] = raptureProccers[i]['name'];
        }

        return [combined, this._rapturesData, raptureProccers];
    }
}

module.exports = Analyzer;