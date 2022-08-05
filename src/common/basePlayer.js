const DATA = require('./gamevalues');

class BasePlayer {
    // procs include isCrit, isEoG, etc
    constructor(maxMana, playerClass, otherMP5, critChance, options) {
        this._options = options;
        if (typeof this._options['logsLevel'] === 'undefined') {
            this._options['logsLevel'] = 0;
        }
        if (typeof this._options['trinkets'] === 'undefined') {
            this._options['trinkets'] = [];
        }

        this._playerClass = playerClass;
        // console.log(DATA);
        this._intModifier = DATA['classes'][playerClass]['intModifier']; // different classes have different int modifiers

        // when there is dmc: greatness proc, we increase mana_pool, so need baseMaxMana as a reference
        this._baseMaxMana = maxMana;
        this._baseCritChance = critChance;

        // loops through the trinkets selected, and adds base stat values - currently only supports int
        for (let key of this._options['trinkets']) {
            let item = DATA['items'][key];
            if (typeof item['base']['int'] !== 'undefined') {
                this._baseMaxMana += this.manaIncreaseFromInt(item['base']['int']);
                this._baseCritChance += this.critIncreaseFromInt(item['base']['int']);
            }
        }

        this._otherMP5 = otherMP5; // does not include raid buffs
        this._currentMana = this._baseMaxMana;

        // tracks potential buffs like dmcg
        this._buffs = {};
        this.initialiseBuffs();
        this._spells = this.initialiseSpells();
    }

    // start getters
    // checks for whether dmcg buff is active; if so, then uses the increased mana pool
    get maxMana() {
        if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['active']) {
            return this._baseMaxMana + this.manaIncreaseFromInt(DATA['items']['dmcg']['proc']['int']);
        } else {
            return this._baseMaxMana;
        }
    }

    get critChance() {
        if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['active']) {
            return this._baseCritChance + this.critIncreaseFromInt(DATA['items']['dmcg']['proc']['int']);
        } else {
            return this._baseCritChance;
        }
    }
    // end getters

    // start setters
    setDmcgActive(val, timestamp) {
        if (typeof this._buffs['dmcg'] === 'undefined') return;
        this._buffs['dmcg']['active'] = val;
        // if it has been toggled active, we need to track when it was last used
        if (val) {
            this._buffs['dmcg']['availableForUse'] = false;
            this._buffs['dmcg']['lastUsed'] = timestamp;
        } else {
           this._buffs['dmcg']['availableForUse'] = false;
        }
        if (this._options['logsLevel'] === 2) {
            console.log(`${timestamp}s: SETTING DMCG to ${val}`);
            console.log(`Crit Chance: ${this.critChance}`);
        }
    }
    // end setters

    initialiseBuffs() {
        let defaultValue = {
            active: false, // is it currently active
            availableForUse: true, // can it be used; should be set to false if currently active
            lastUsed: -9999, // timestamp of last usage
        };
        if (this._options['trinkets'].indexOf('dmcg') > -1) {
            this._buffs['dmcg'] = {};
            Object.assign(this._buffs['dmcg'], defaultValue);
        }
    }

    initialiseSpells() {
        let results = [];
        for (let _spell of DATA['classes'][this._playerClass]['spells']) {
            let entry = Object.assign({}, _spell);
            entry['availableForUse'] = true;
            entry['lastUsed'] = -9999;
            results.push(entry);
        }
        return results;
    }

    selectSpell(timestamp, overrideSpellSelection='') {
        let spellSelected = null;

        // # we first look among spells with cd (e.g. holy shock, sacred shield), and update their availability
        let spellsWithCooldown = this._spells.filter((_spell) => _spell['cooldown'] > 0);
        let spellsWithNoCooldown = this._spells.filter((_spell) => _spell['cooldown'] === 0);

        for (let _spell of spellsWithCooldown) {
            if (!_spell['availableForUse'] && (timestamp - _spell['lastUsed'] >= _spell['cooldown'])) {
                _spell['availableForUse'] = true;
            }
        }

        // if there is an overrideSpellSelection, cast it if its not on cd
        if (overrideSpellSelection !== '') {
            spellSelected = this._spells.find((_spell) => (_spell['key'] === overrideSpellSelection && _spell['availableForUse']));
            if (spellSelected) return spellSelected;
        }

        // otherwise, we first try to cast spells that have cd and are available
        const availableSpellsWithCd = spellsWithCooldown.filter((_spell) => _spell['availableForUse'])
        if (availableSpellsWithCd.length > 0) {
            spellSelected = availableSpellsWithCd[0];
            spellSelected['lastUsed'] = timestamp
            spellSelected['availableForUse'] = false
            return spellSelected   
        }

        // if all cd spells are not available, then cast a non-cd spell
        // in future return based on cast profile
        return spellsWithNoCooldown[0];
    }


    manaIncreaseFromInt(value) {
        return Math.floor(value * DATA['constants']['manaFromOneInt'] * this._intModifier);
    }

    critIncreaseFromInt(value) {
        return value * this._intModifier * DATA['constants']['critChanceFromOneInt'];
    }

    // return 'Mana: {:d} / {:d}'.format(self._current_mana, self._max_mana)
    toString() {
        // return `${this._timestamp}s: ${this._eventType}`;
    }
}
module.exports = BasePlayer;