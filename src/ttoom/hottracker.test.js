const EventHeap = require('../ttoom/eventheap');
const HotTracker = require('./hottracker');

test('test creation of hottracker and trackHot', () => {
    let eventHeap = new EventHeap();
    let hotTracker = new HotTracker(eventHeap, 'shaman');

    hotTracker.trackHot('RIPTIDE', 3, 5, 2);
    expect(hotTracker._data['RIPTIDE'].length).toBe(1);
});

test('test canConsumeHot', () => {
    let eventHeap = new EventHeap();
    let hotTracker = new HotTracker(eventHeap, 'shaman');

    expect(hotTracker.canConsume('RIPTIDE', 8)).toBe(false);
    hotTracker.trackHot('RIPTIDE', 3, 5, 2);
    expect(hotTracker.canConsume('RIPTIDE', 8)).toBe(false);
    expect(hotTracker.canConsume('RIPTIDE', 12)).toBe(true);
});

test('test consumeHot', () => {
    let eventHeap = new EventHeap();
    let hotTracker = new HotTracker(eventHeap, 'shaman');
    eventHeap.addIntervalEvents(3, 'HOT_TICK', 'RIPTIDE', 5, 3, false, 0);
    hotTracker.trackHot('RIPTIDE', 0, 0, 2);
    expect(eventHeap.priorityQueue.length).toBe(5);
    expect(hotTracker._data['RIPTIDE'].length).toBe(1);
    expect(hotTracker.canConsume('RIPTIDE', 3)).toBe(false);
    expect(hotTracker.canConsume('RIPTIDE', 6)).toBe(false);
    expect(hotTracker.canConsume('RIPTIDE', 6.1)).toBe(true);
    expect(hotTracker.canConsume('RIPTIDE', 7)).toBe(true);

    // should remove from eventHeap as well
    hotTracker.consume('RIPTIDE', 12);
    expect(hotTracker._data['RIPTIDE'].length).toBe(0);
    expect(eventHeap.priorityQueue.length).toBe(0);
});

// trackHot arguments - spellKey, spellIndex, timestamp, minTicksBeforeConsumable
test('test consumeHot on multiple entries', () => {
    let eventHeap = new EventHeap();
    let hotTracker = new HotTracker(eventHeap, 'shaman');
    eventHeap.addIntervalEvents(3, 'HOT_TICK', 'RIPTIDE', 5, 3, false, 0);
    eventHeap.addIntervalEvents(3, 'HOT_TICK', 'RIPTIDE', 5, 3, false, 7);
    hotTracker.trackHot('RIPTIDE', 0, 0, 2);
    hotTracker.trackHot('RIPTIDE', 1, 7, 2);
    expect(eventHeap.priorityQueue.length).toBe(10);
    expect(hotTracker._data['RIPTIDE'].length).toBe(2);
    expect(hotTracker.consume('RIPTIDE', 8)).toBe(true);

    expect(eventHeap.priorityQueue.length).toBe(5);
    expect(hotTracker._data['RIPTIDE'][0].spellIndex).toBe(1);
});

// should do a consumehot test with a hot that is consumed immediately