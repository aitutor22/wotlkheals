const Utility = require('./utilities');
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

    // spellQueue = new SpellQueue({'HOLY_LIGHT': 30});
    // [simplifiedCastProfile, sequence] = spellQueue.createSimplifiedCastProfile(rng);
    // expect(simplifiedCastProfile['HOLY_LIGHT']).toBe(1);
    // expect(sequence.length).toBe(1);
    // expect(sequence[0]).toBe('HOLY_LIGHT');


    // spellQueue = new SpellQueue({'HOLY_LIGHT': 30, 'FLASH_OF_LIGHT': 7});
    // [simplifiedCastProfile, sequence] = spellQueue.createSimplifiedCastProfile(rng);
    // expect(simplifiedCastProfile['HOLY_LIGHT']).toBe(30);
    // expect(simplifiedCastProfile['FLASH_OF_LIGHT']).toBe(7);
    // expect(sequence.length).toBe(37);

    // let counter = {HOLY_LIGHT: 0, FLASH_OF_LIGHT: 0};
    // for(let i = 0; i < sequence.length; i++) {
    //     counter[sequence[i]]++;
    // }
    // expect(counter['FLASH_OF_LIGHT']).toBe(7);
    // expect(counter['HOLY_LIGHT']).toBe(30);
});
