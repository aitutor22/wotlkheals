const Utility = require('../common/utilities');
const DATA = require('../ttoom/gamevalues');

// used to track effects like riptide hot
// where 1. we want to know how many hot ticks are left on a hot
// 2. we want to consume it (aka remove it from event heap);
class HotTracker {
    constructor(eventHeap, playerClass) {
        this._data = {};
        this._eventHeap = eventHeap;
        this._playerClass = playerClass;
    }

    // hots of the same type are tracked together
    // since they presumable all have the same duration, then it is a FIFO
    // NOTE: this does not actually add the hot to eventheap
    trackHot(spellKey, spellIndex, timestamp, minTicksBeforeConsumable) {
        // secsBetweenInterval, startAtTimestamp,
        let spellInfo = DATA['classes'][this._playerClass]['spells'].find((_spell) => _spell['key'] === spellKey);
        if (typeof this._data[spellKey] === 'undefined') {
            this._data[spellKey] = [];
        }

        const timestampAvailableForConsumption = timestamp +
            (minTicksBeforeConsumable - ((spellInfo['startAtTimestamp'] ? 0 : 1))) * spellInfo['secsBetweenInterval'];
        this._data[spellKey].push({
            spellIndex: spellIndex,
            timestampAvailableForConsumption: timestampAvailableForConsumption,
        });
    }

    // returns a boolean indicating if we have a hot available for consumption
    // but don't actually use it yet (similar to peep in a heap)
    canConsume(spellKey, timestamp) {
       if ((typeof this._data[spellKey] === 'undefined') || this._data[spellKey].length === 0) return false;

       // _data[spellKey] is auto sorted from oldest to newest, so just need to check the first element
       return timestamp > this._data[spellKey][0]['timestampAvailableForConsumption'];
    }

    // returns a boolean on whether a hot is consumed
    // also removes from eventHeap
    consume(spellKey, timestamp) {
        let canConsume = this.canConsume(spellKey, timestamp);
        if (!canConsume) return false;
        let entry = this._data[spellKey].splice(0, 1)[0];
        this._eventHeap.removeIntervalEvents('HOT_TICK', spellKey, entry['spellIndex']);
        return true;
    }
}

module.exports = HotTracker;