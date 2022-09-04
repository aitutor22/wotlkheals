const { Heap } = require('heap-js');

const Utility = require('../common/utilities');

const timestampComparator = (a, b) => a._timestamp - b._timestamp;

/*
    eventType: subEvent
    SPELLCAST: HOLY_LIGHT, HOLY_SHOCK, etc
    MANA: DIVINE_PLEA_TICK, RUNIC_MANA_POTION
*/

class Event {
    // procs include isCrit, isEoG, etc
    constructor(timestamp, eventType, subEvent, spellIndex=-1) {
        this._timestamp = Utility.roundDp(timestamp, 2); // time in seconds from start of fight
        this._eventType = eventType;
        this._subEvent = subEvent;
        this._spellIndex = Number(spellIndex);
    }

    toString() {
        return `${this._timestamp}s: ${this._eventType}`;
    }
}

/*
    EventHeap class stores and pops events based on timestamp.
*/

class EventHeap {
    constructor() {
        // https://www.npmjs.com/package/heap-js
        // creates a heap where event with the lowest timestamp is popped first
        this.priorityQueue = new Heap(timestampComparator);
        this.priorityQueue.init([]);
    }

    addEvent(timestamp, eventType, subEvent, spellIndex=-1) {
        let event = new Event(timestamp, eventType, subEvent, spellIndex);
        this.priorityQueue.push(event);
        return event;
    }

    addIntervalEvents(timestamp, eventType, subEvent, numIntervals, secsBetweenInterval, startAtTimestamp=false, spellIndex=-1) {
        let currentTime;
        for (let i = 0; i < numIntervals; i++) {
            currentTime = timestamp + (i + (startAtTimestamp ? 0 : 1)) * secsBetweenInterval;
            this.addEvent(currentTime, eventType, subEvent, spellIndex);
        }
    }

    // removes all interval events  that are of the same eventType, subEvent and spellIndex
    // useful for situations like in riptide, where after a hot is consumed, we removed all future ticks
    removeIntervalEvents(eventType, subEvent, spellIndex) {
        let filteredElements = this.priorityQueue.toArray().filter((entry) => {
            return !(entry._eventType === eventType && entry._subEvent === subEvent && entry._spellIndex === spellIndex);
        });
       
        this.priorityQueue.clear();
        this.priorityQueue.addAll(filteredElements);
    }

    hasElements() {
        return this.priorityQueue.length > 0;
    }

    pop () {
        return this.priorityQueue.pop();
    }

    printEvents() {
        for (let event of this.priorityQueue) {
            console.log(event);
        }
    }
}

module.exports = EventHeap;