// // import Heap from 'heap-js';

const EventHeap = require('../common/eventheap');
const Paladin = require('../common/paladin');

let eventHeap = new EventHeap()
eventHeap.addEvent(2, 'MANA', 'TICK', {});
eventHeap.addEvent(4, 'MANA', 'TICK', {});
eventHeap.addEvent(3, 'SPELLCAST', 'HOLYSHOCK', {});
// eventHeap.printEvents();

let player = new Paladin(28000, 300, 200, 0.3, {});
// console.log(player.getManaIncreaseFromInt(300));

// const timestampComparator = (a, b) => a.timestamp - b.timestamp;

// let event = new Event(2, 'MANA', 'TICK', {})
// console.log(`${event}`);

