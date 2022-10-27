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
    }
}

module.exports = Analyzer;