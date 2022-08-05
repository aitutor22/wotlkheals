const DATA = require('../common/gamevalues');

class BasePlayer {
    // procs include isCrit, isEoG, etc
    constructor(maxMana, playerClass, otherMP5, critChance, options) {
        this._options = options;
        this._playerClass = playerClass;
        this._otherMP5 = otherMP5; // does not include raid buffs
        this._intModifier = DATA['classes'][playerClass]['intModifier'];

        // when there is dmc: greatness proc, we increase mana_pool, so need baseMaxMana as a reference
        this._baseMaxMana = maxMana;
        this._baseCritChance = critChance;

        // loops through the trinkets selected, and adds base stat values - currently only supports int
        for (let key of this._options['trinkets']) {
            let item = DATA['items'][key];
            if (typeof item['base']['int'] !== 'undefined') {
                this._baseMaxMana += this.getManaIncreaseFromInt(item['base']['int']);
                this._baseCritChance += this.getCritIncreaseFromInt(item['base']['int']);
            }
        }

        this._currentMana = this._baseMaxMana;

        // tracks potential buffs like dmcg
        this._buffs = {};
        this.initialiseBuffs();
    }

    initialiseBuffs() {
        let defaultValue = {
            active: false, // is it currently active
            availableFor_Use: true, // can it be used; should be set to false if currently active
            lastUsed: -9999, // timestamp of last usage
        };
        if (typeof this._options['trinkets']['dmcg'] !== 'undefined' && this._options['trinkets']['dmcg']) {
            this._buffs['dmcg'] = {};
            Object.assign(this._buffs['dmcg'], defaultValue);
        }
    }

     getManaIncreaseFromInt(value) {
         return Math.floor(value * DATA['constants']['manaFromOneInt'] * this._intModifier);
     }

     getCritIncreaseFromInt(value) {
         return value * this._intModifier * DATA['constants']['critChanceFromOneInt'];
     }

    // checks for whether dmcg buff is active; if so, then uses the increased mana pool
    get maxMana() {
        if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['active']) {
            return this._baseMaxMana + this.getManaIncreaseFromInt(DATA['items']['dmcg']['value']);
        } else {
            return this._baseMaxMana;
        }
    }

    // return 'Mana: {:d} / {:d}'.format(self._current_mana, self._max_mana)
    toString() {
        // return `${this._timestamp}s: ${this._eventType}`;
    }
}
module.exports = BasePlayer;