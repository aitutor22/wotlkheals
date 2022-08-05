const BasePlayer = require('../common/basePlayer');
const DATA = require('../common/gamevalues');

class Paladin extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(maxMana, otherMP5, critChance, options) {
        super(maxMana, 'paladin', otherMP5, critChance, options);
    }
}

module.exports = Paladin;