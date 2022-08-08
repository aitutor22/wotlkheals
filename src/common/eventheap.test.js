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


