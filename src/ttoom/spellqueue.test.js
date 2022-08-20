const Utility = require('../common/utilities');
const SpellQueue = require('./spellqueue');


test('gcd function', () => {
    let rng = Utility.setSeed(1);
    let spellQueue = new SpellQueue({'HOLY_LIGHT': 30, 'FLASH_OF_LIGHT': 10}, rng);
    expect(spellQueue.gcd(30, 10)).toBe(10);
    expect(spellQueue.gcd(10, 30)).toBe(10);
    expect(spellQueue.gcd(30, 17)).toBe(1);
    expect(spellQueue.gcd(8, 5)).toBe(1);
    expect(spellQueue.gcd(38, 2)).toBe(2);
});

test('findGCFofList function', () => {
    let rng = Utility.setSeed(1);
    let spellQueue = new SpellQueue({'HOLY_LIGHT': 30, 'FLASH_OF_LIGHT': 10}, rng);
    expect(spellQueue.findGCFofList([30, 10, 2])).toBe(2);
    expect(spellQueue.findGCFofList([30, 10])).toBe(10);
    expect(spellQueue.findGCFofList([10, 30])).toBe(10);
    expect(spellQueue.findGCFofList([30, 17])).toBe(1);
    expect(spellQueue.findGCFofList([8, 5])).toBe(1);
    expect(spellQueue.findGCFofList([38, 2])).toBe(2);
});


test('findGCFofList function', () => {
    let rng = Utility.setSeed(1);
    let spellQueue = new SpellQueue({'HOLY_LIGHT': 30, 'FLASH_OF_LIGHT': 10}, rng);
    let simplifiedCastProfile, sequence;

    [simplifiedCastProfile, sequence] = spellQueue.createSimplifiedCastProfile();
    expect(simplifiedCastProfile['HOLY_LIGHT']).toBe(3);
    expect(simplifiedCastProfile['FLASH_OF_LIGHT']).toBe(1);
    expect(sequence.length).toBe(4);

    spellQueue = new SpellQueue({'HOLY_LIGHT': 30}, rng);
    [simplifiedCastProfile, sequence] = spellQueue.createSimplifiedCastProfile();
    expect(simplifiedCastProfile['HOLY_LIGHT']).toBe(1);
    expect(sequence.length).toBe(1);
    expect(sequence[0]).toBe('HOLY_LIGHT');


    spellQueue = new SpellQueue({'HOLY_LIGHT': 30, 'FLASH_OF_LIGHT': 7}, rng);
    [simplifiedCastProfile, sequence] = spellQueue.createSimplifiedCastProfile();
    expect(simplifiedCastProfile['HOLY_LIGHT']).toBe(30);
    expect(simplifiedCastProfile['FLASH_OF_LIGHT']).toBe(7);
    expect(sequence.length).toBe(37);

    let counter = {HOLY_LIGHT: 0, FLASH_OF_LIGHT: 0};
    for(let i = 0; i < sequence.length; i++) {
        counter[sequence[i]]++;
    }
    expect(counter['FLASH_OF_LIGHT']).toBe(7);
    expect(counter['HOLY_LIGHT']).toBe(30);
});


test('getSpell function', () => {
    // this seed sequence is [ 'FLASH_OF_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT' ]
    let rng = Utility.setSeed(12), element;
    let spellQueue = new SpellQueue({'HOLY_LIGHT': 30, 'FLASH_OF_LIGHT': 10}, rng);
    expect(spellQueue._queue.length).toBe(4);

    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(3);
    expect(element).toBe('FLASH_OF_LIGHT');

    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(2);
    expect(element).toBe('HOLY_LIGHT');

    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(1);
    expect(element).toBe('HOLY_LIGHT');

    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(0);
    expect(element).toBe('HOLY_LIGHT');

    // should repeat
    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(3);
    expect(element).toBe('FLASH_OF_LIGHT');

    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(2);
    expect(element).toBe('HOLY_LIGHT');

    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(1);
    expect(element).toBe('HOLY_LIGHT');

    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(0);
    expect(element).toBe('HOLY_LIGHT');
});

test('getSpell function should remove/return spell that is passed in even if order is off', () => {
    // this seed sequence is ['HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT', 'FLASH_OF_LIGHT']
    let rng = Utility.setSeed(10), element;
    let spellQueue = new SpellQueue({'HOLY_LIGHT': 30, 'FLASH_OF_LIGHT': 10}, rng);
    expect(spellQueue._queue).toEqual(['HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT', 'FLASH_OF_LIGHT']);
    expect(spellQueue._queue.length).toBe(4);


    element = spellQueue.getSpell('FLASH_OF_LIGHT');
    expect(spellQueue._queue.length).toBe(3);
    expect(element).toBe('FLASH_OF_LIGHT');
    expect(spellQueue._queue).toEqual(['HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT']);

    // when queue is missing the element, add the sequence to it
    element = spellQueue.getSpell('FLASH_OF_LIGHT');
    expect(spellQueue._queue.length).toBe(6);
    expect(element).toBe('FLASH_OF_LIGHT');
    expect(spellQueue._queue).toEqual(['HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT']);

    // if we are just pulling spells, should keep returning holy light
    for (let i = 0; i < 6; i++) {
        element = spellQueue.getSpell();
        expect(spellQueue._queue.length).toBe(6 - i - 1);
        expect(element).toBe('HOLY_LIGHT');  
    }

    // restocks
    element = spellQueue.getSpell();
    expect(spellQueue._queue.length).toBe(3);
    expect(spellQueue._queue).toEqual(['HOLY_LIGHT', 'HOLY_LIGHT', 'FLASH_OF_LIGHT']);
});

test('getSpell function should ignore spellKeyRequested if not in base cast profile', () => {
    // this seed sequence is ['HOLY_LIGHT', 'HOLY_LIGHT', 'HOLY_LIGHT', 'FLASH_OF_LIGHT']
    let rng = Utility.setSeed(10), element;
    let spellQueue = new SpellQueue({'HOLY_LIGHT': 30}, rng);
    expect(spellQueue._queue).toEqual(['HOLY_LIGHT']);
    expect(spellQueue._queue.length).toBe(1);


    element = spellQueue.getSpell('FLASH_OF_LIGHT');
    expect(spellQueue._queue.length).toBe(0);
    expect(element).toBe('HOLY_LIGHT');
});