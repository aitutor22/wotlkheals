const BasePlayer = require('../common/basePlayer');
const DATA = require('./gamevalues');

class Paladin extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(maxMana, otherMP5, critChance, options) {
        super(maxMana, 'paladin', otherMP5, critChance, options);

        // second part of this is we assume 1.1 sow procs a min, and convert it to mp5 terms
        // should be refactored in future
        this._otherMP5 = otherMP5 + 1.1 * this._baseMaxMana * 0.04 / 12
    }
}

module.exports = Paladin;