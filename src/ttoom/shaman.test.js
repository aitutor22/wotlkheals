const Shaman = require('./shaman');
const Utility = require('../common/utilities');

const thresholdItemsToCreate = ['crit', 'soup', 'dmcg'];
let rng = Utility.setSeed(0);
const defaultOptions = {
    unbuffedSpellPower: 1741,
    mp5FromGear: 300,
    unbuffedInt: 1000,
    trinkets: [],
    cpm: {
        CHAIN_HEAL: 30,
    },
    talents: {
    },
    manaOptions: {
      injector: false,
      innervate: false,
      manaTideTotem: false,
    },
    manaCooldowns: [{key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0}],
};

test('modifyStacks should create a stacks entry if not currently present', () => {
    let player = new Shaman(defaultOptions, rng, thresholdItemsToCreate);
    // expect(Object.keys(player._buffs).length).toBe(0);
    expect(Object.keys(player._stacks).length).toBe(0);
    player.modifyStacks('tidalWaves', 'set', 2);
    expect(Object.keys(player._stacks).length).toBe(1);
    expect(player._stacks['tidalWaves']).toBe(2);

    player.modifyStacks('tidalWaves', 'decrement', 1);
    expect(player._stacks['tidalWaves']).toBe(1);
    player.modifyStacks('tidalWaves', 'decrement', 1);
    expect(player._stacks['tidalWaves']).toBe(0);
    player.modifyStacks('tidalWaves', 'decrement', 1);
    // cannot decrement below 0
    expect(player._stacks['tidalWaves']).toBe(0);

    player.modifyStacks('tidalWaves', 'increment', 1);
    expect(player._stacks['tidalWaves']).toBe(1);
    player.modifyStacks('tidalWaves', 'increment', 2);
    expect(player._stacks['tidalWaves']).toBe(3);
});
