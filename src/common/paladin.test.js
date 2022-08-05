const Paladin = require('./paladin');

test('getManaIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: []});
    let manaGenerated = player.manaIncreaseFromInt(300);
    expect(manaGenerated).toBe(5445);
});

test('getCritIncreaseFromInt for a paladin should use 1.1 x 1.1 modifier', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: []});
    let getCritIncreaseFromInt = player.critIncreaseFromInt(300);
    expect((Math.abs(getCritIncreaseFromInt - 0.021779956440087123))).toBeLessThan(1e-9);
});

test('system should add mana from 90 int if dmcg is selected', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: ['dmcg']});
    expect(player.maxMana).toBe(29633);
});

test('system should add crit from 90 int if dmcg is selected', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: ['dmcg']});
    expect((Math.abs(player.critChance - 0.306533869322614))).toBeLessThan(1e-5);
});

test('setDmcgActive to true', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: ['dmcg']});
    player.setDmcgActive(true, 2);
    expect(player._buffs['dmcg']['active']).toBe(true);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);
});

test('setDmcgActive to true', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: ['dmcg']});
    player.setDmcgActive(true, 2);
    player.setDmcgActive(false, 17);
    expect(player._buffs['dmcg']['active']).toBe(false);
    expect(player._buffs['dmcg']['availableForUse']).toBe(false);
    expect(player._buffs['dmcg']['lastUsed']).toBe(2);
});

test('maxMana and critChance when dmcg active', () => {
    let player = new Paladin(28000, 300, 0.3, {trinkets: ['dmcg']});
    player.setDmcgActive(true, 2);
    expect(player.maxMana).toBe(35078);
    expect((Math.abs(player.critChance - 0.328308338))).toBeLessThan(1e-5);
});