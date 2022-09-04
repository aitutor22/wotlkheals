const EventHeap = require('./eventheap');


test('eventheap should pop events correctly', () => {
    let eventHeap = new EventHeap(), evt;
    let a = eventHeap.addEvent(1.5, 'SPELLCAST', 'HOLY_LIGHT');
    let b = eventHeap.addEvent(19, 'BUFF_EXPIRE', 'dmcg');
    let c = eventHeap.addEvent(3.0, 'SPELLCAST', 'HOLY_LIGHT');
    let d = eventHeap.addEvent(3.1, 'SPELLCAST', 'HOLY_SHOCK');
    evt = eventHeap.pop()
    
    expect(evt).toBe(a);

    evt = eventHeap.pop()
    expect(evt).toBe(c);

    evt = eventHeap.pop()
    expect(evt).toBe(d);
    
    evt = eventHeap.pop()
    expect(evt).toBe(b);
});

test('addIntervalEvents', () => {
    let eventHeap = new EventHeap(), evt;
    eventHeap.addIntervalEvents(0, 'MANA_TICK', 'DIVINE_PLEA', 5, 3);
    expect(eventHeap.priorityQueue.length).toBe(5);
    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(3);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(6);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(9);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(12);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(15);

    expect(eventHeap.hasElements()).toBe(false);
});

test('addIntervalEvents when timestamp is greater than 0', () => {
    let eventHeap = new EventHeap(), evt;
    eventHeap.addIntervalEvents(60, 'MANA_TICK', 'DIVINE_PLEA', 5, 3);
    expect(eventHeap.priorityQueue.length).toBe(5);
    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(63);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(66);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(69);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(72);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(75);

    expect(eventHeap.hasElements()).toBe(false);
});

test('addIntervalEvents with startAtTimestamp', () => {
    let eventHeap = new EventHeap(), evt;
    eventHeap.addIntervalEvents(0, 'MANA_TICK', 'test', 4, 2, true);
    expect(eventHeap.priorityQueue.length).toBe(4);
    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(0);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(2);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(4);

    evt = eventHeap.pop()
    expect(evt._timestamp).toBe(6);

    expect(eventHeap.hasElements()).toBe(false);
});

test('remove interval events', () => {
    let eventHeap = new EventHeap(), evt;
    eventHeap.addIntervalEvents(0, 'HOT_TICK', 'RIPTIDE', 5, 3, false, 2);
    eventHeap.addEvent(4.5, 'SPELLCAST', 'HOLY_LIGHT');
    eventHeap.addEvent(3, 'SPELLCAST', 'FLASH_OF_LIGHT');
    eventHeap.addEvent(8, 'SPELLCAST', 'RIPTIDE');
    expect(eventHeap.priorityQueue.length).toBe(8);
    eventHeap.removeIntervalEvents('HOT_TICK', 'RIPTIDE', 2);

    evt = eventHeap.pop();
    expect(evt._timestamp).toBe(3);
    evt = eventHeap.pop();
    expect(evt._timestamp).toBe(4.5);
    evt = eventHeap.pop();
    expect(evt._timestamp).toBe(8);
})
