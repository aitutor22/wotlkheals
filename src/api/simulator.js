// // import Heap from 'heap-js';

const EventHeap = require('../common/events');

let eventHeap = new EventHeap()
eventHeap.addEvent(2, 'MANA', 'TICK', {});
eventHeap.addEvent(4, 'MANA', 'TICK', {});
eventHeap.addEvent(3, 'SPELLCAST', 'HOLYSHOCK', {});
eventHeap.printEvents();

// const timestampComparator = (a, b) => a.timestamp - b.timestamp;

// let event = new Event(2, 'MANA', 'TICK', {})
// console.log(`${event}`);

