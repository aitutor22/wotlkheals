const { Heap } = require('heap-js');

const timestampComparator = (a, b) => a.timestamp - b.timestamp;

/*
    eventType: subEvent
    SPELLCAST: HOLY_LIGHT, HOLY_SHOCK, etc
    MANA: DIVINE_PLEA_TICK, RUNIC_MANA_POTION
*/

class Event {
    // procs include isCrit, isEoG, etc
    constructor(timestamp, eventType, subEvent, procs) {
        this._timestamp = Math.round(timestamp, 2); // time in seconds from start of fight
        this._eventType = eventType;
        this._subEvent = subEvent;
        this._procs = procs;
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

    addEvent(timestamp, eventType, subEvent, procs) {
        let event = new Event(timestamp, eventType, subEvent, procs);
        this.priorityQueue.push(event);
    }

    printEvents() {
        for (let event of this.priorityQueue) {
            console.log(event);
        }
    }
}

module.exports = EventHeap;