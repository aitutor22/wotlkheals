const DATA = require('./gamevalues');
const Utility = require('./utilities');

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
        this._intModifier = this.classInfo['intModifier']; // different classes have different int modifiers

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
        // dmcg is a unique case where we want to initialise it at the start under _buffs
        // this is because it can be procced by every spell cast
        if (this._options['trinkets'].indexOf('dmcg') > -1) {
            this.setBuffActive('dmcg', false, 0, true);
        }

        this._rngThresholds = {};
        this._spells = this.initialiseSpells();
        this._validSpells = this._spells.map((_spell) => _spell['key']);
        this._instantSpells = this._spells.filter((_spell) => _spell['instant']).map((_spell) => _spell['key']);
        this._statistics = {
            'manaGenerated': {},
        }
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

    get classInfo() {
        return DATA['classes'][this._playerClass];
    }
    // end getters

    // start setters
    // typically, we don't pass in availableForUse, as usually it will be set to false here
    // and set back to active in another function.
    // exceptions to these include initialising dmcg (where we want active to be false, but have it still be availableForUse)
    setBuffActive(buffKey, isActive, timestamp, availableForUse=false) {
        if (typeof this._buffs[buffKey] === 'undefined') {
            this._buffs[buffKey] = {
                active: false, // is it currently active
                availableForUse: true, // can it be used
                lastUsed: -9999, // timestamp of last usage
            }
        }

        this._buffs[buffKey]['active'] = isActive;
        if (isActive) {
            this._buffs[buffKey]['availableForUse'] = availableForUse;
            this._buffs[buffKey]['lastUsed'] = timestamp;
        } else {
           this._buffs[buffKey]['availableForUse'] = availableForUse;
        }
    }
    // end setters

    // start functions that are used for initialisation
    initialiseSpells() {
        let results = [];
        for (let _spell of this.classInfo['spells']) {
            let entry = Object.assign({}, _spell);

            // setting cast time for each spell based on user options
            if (_spell['instant']) {
                entry['castTime'] = 0;
            } else if (typeof this._options['castTimes'][_spell['key']] === 'undefined') {
                throw new Error('missing cast time for ' + _spell['key']);
            } else {
                entry['castTime'] = this._options['castTimes'][_spell['key']];
            }
            entry['availableForUse'] = true;
            entry['lastUsed'] = -9999;
            results.push(entry);
        }
        return results;
    }

    // rng is the random number generator
    // creates thresholds for each of the items and talents, and saves it to the player
    createRngThresholds(rng, items, maxMinsToOOM) {
        function createHelper(numItems) {
            let results = [];
            for (let i = 0; i < numItems; i++) {
                results.push(rng());
            }
            return results;
        }
        const soupHits = this.classInfo['maxSoupHits'];
        for (let item of items) {
            // soup and eog should have multiple chances to proc
            let factor = (['soup', 'eog'].indexOf(item) > -1) ? soupHits : 1;
            this._rngThresholds[item] = createHelper(maxMinsToOOM * 60 * factor);
        }
    }

    // end functions that are used for initialisation


    selectSpell(timestamp, spellIndex, overrideSpellSelection='') {
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
            spellSelected['lastUsed'] = timestamp;
            spellSelected['availableForUse'] = false;
            return spellSelected;
        }

        // if all cd spells are not available, then cast a non-cd spell
        // in future return based on cast profile
        return spellsWithNoCooldown[0];
    }

    checkProcHelper(key, spellIndex, numHits, procChance) {
        let arr = this._rngThresholds[key].slice(spellIndex * numHits, (spellIndex + 1) * numHits);
        return Utility.anyValueBelowThreshold(arr, procChance);
    }

    // can be either soup or eog
    isSoupEogProc(isSoup, spellIndex, numHits) {
        let key = isSoup ? 'soup' : 'eog',
            procChance = DATA['items'][key]['proc']['chance'];
        return this.checkProcHelper(key, spellIndex, numHits, procChance);
    }

    // returns [wasManaSuccessfullySubtracted, costOfSpell, currentMana, errorMessage]
    // example
    // (DI * basecost - relic - soup/eog) * (1 - SoW - 4pcT7)
    // baseCostMultiplicativeFactors and baseCostAdditiveFactors are dictionaries, with key being the factorName and value being the amount of the discount
    // otherMultiplicativeTotal should be just a float total of all the other multiplicative factors added together
    // (e.g. for pally with 4pT7 and glyph of SoW, should be 0.9)
    // if there are no discounts, then should be 1
    subtractManaHelper(spellKey, timestamp, baseCostMultiplicativeFactors, baseCostAdditiveFactors, otherMultiplicativeTotal=1) {
        const BASE_MANA_COST = this.classInfo['spells'].find((_spell) => _spell['key'] === spellKey)['baseManaCost'];
        let value = BASE_MANA_COST, oldValue;
        let manaSaved;

        // unsure how to handle if there are multiple values in baseCostMultiplicativeFactors
        // for now, assume it's multiplicative
        for (let key in baseCostMultiplicativeFactors) {
            if (typeof this._statistics['manaGenerated'][key] === 'undefined') {
                this._statistics['manaGenerated'][key] = 0;
            }
            oldValue = value;
            value = value * (1 - baseCostMultiplicativeFactors[key]);
            this._statistics['manaGenerated'][key] += Math.floor(value - oldValue);
        }

        // examples are soup/eog and libram
        for (let key in baseCostAdditiveFactors) {
            if (typeof this._statistics['manaGenerated'][key] === 'undefined') {
                this._statistics['manaGenerated'][key] = 0;
            }
            oldValue = value;
            // e.g. if soup proc (800) for a paladin with otherMultiplicativeFactor of 0.9, we should record soup savings as 800 x 0.9  under statistics
            // but the actual value, we subtract by 800 first, since we will be discounting by 0.9 in next step
            value = Math.max(value - baseCostAdditiveFactors[key], 0);
            this._statistics['manaGenerated'][key] += Math.floor(otherMultiplicativeTotal * (value - oldValue));
        }

        value = Math.floor(value * otherMultiplicativeTotal);

        if (value > this._currentMana) {
            return [0, 0, this._currentMana, 'Insufficient Mana'];
        }
        else {
            this._currentMana -= value
            // self._statistics['overall']['total_mana_used'] += mana_cost
            return [1, value, this._currentMana, null];
        }
    }

    addManaHelper(amount, category) {
        let oldMana = this._currentMana;
        this._currentMana += amount

        if (typeof this._statistics['manaGenerated'][category] === 'undefined') {
            this._statistics['manaGenerated'][category] = 0;
        }        

        // cannot exceed max mana
        if (this._currentMana > this.maxMana) {
            this._currentMana = this.maxMana;
        }

        this._statistics['manaGenerated'][category] += this._currentMana - oldMana;
        return this._currentMana - oldMana;
    }

    manaIncreaseFromInt(value) {
        return Math.floor(value * DATA['constants']['manaFromOneInt'] * this._intModifier);
    }

    critIncreaseFromInt(value) {
        return value * this._intModifier * DATA['constants']['critChanceFromOneInt'];
    }

    toString() {
        return `Mana: ${this._currentMana} / ${this.maxMana}`;
        // return `${this._timestamp}s: ${this._eventType}`;
    }
}
module.exports = BasePlayer;