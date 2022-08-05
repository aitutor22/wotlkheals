const Paladin = require('./paladin');

test('getManaIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: []});
    let manaGenerated = player.getManaIncreaseFromInt(300);
    expect(manaGenerated).toBe(5445);
});

test('getCritIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: []});
    let getCritIncreaseFromInt = player.getCritIncreaseFromInt(300);
    expect((Math.abs(getCritIncreaseFromInt - 0.021779956440087123))).toBeLessThan(1e-9);
});

test('system should add mana from 90 int if dmcg is selected', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: ['dmcg']});
    expect(player.maxMana).toBe(29633);
});