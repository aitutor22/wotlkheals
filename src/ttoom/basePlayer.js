const DATA = require('./gamevalues');
const Utility = require('../common/utilities');
const SpellQueue = require('./spellqueue');


/**
 *  - Base class that will be extended by a specific healing class (e.g. Paladin)
 *  - Contains common methods that are used by all healers such as initialization of spellQueues, mana updating helper functions, etc
 *  - Class-specific logic should be implemented in the respective child classes, such as castSpell and subtractMana
 *  - After creating a player object, run createRngThresholds and createSpellQueue to complete the initialization.
 */
class BasePlayer {
    constructor(playerClass, options, rng, thresholdItemsToCreate, maxMinsToOOM) {
        /** 
         * The description begins here.
         * More description continues here.
         */

        this._options = options;
        if (typeof this._options['logsLevel'] === 'undefined') {
            this._options['logsLevel'] = 0;
        }
        if (typeof this._options['trinkets'] === 'undefined') {
            this._options['trinkets'] = [];
        }
        this._rng = rng;

        this._playerClass = playerClass;
        this._gcd = options['gcd'];
        this._intModifier = this.classInfo['intModifier']; // different classes have different int modifiers
        
        // when there is dmc: greatness proc, we increase mana_pool, so need baseMaxMana as a reference
        this._baseMaxMana = options['manaPool'];
        this._baseCritChance = options['critChance'] + this.classInfo['baseCritChanceModifier'];
        this._baseSpellPower = options['spellPower'];

        // loops through the trinkets selected, and adds base stat values - currently only supports int and spellpower
        for (let key of this._options['trinkets']) {
            let item = DATA['items'][key];
            if (typeof item['base']['int'] !== 'undefined') {
                this._baseMaxMana += this.manaIncreaseFromInt(item['base']['int']);
                this._baseCritChance += this.critIncreaseFromInt(item['base']['int']);
                this._baseSpellPower += this.spellPowerIncreaseFromInt(item['base']['int']);
            }
            if (typeof item['base']['spellpower'] !== 'undefined') {
                this._baseSpellPower += item['base']['spellpower'];
            }
            if (typeof item['base']['crit'] !== 'undefined') {
                this._baseCritChance += item['base']['crit'];
            }
        }

        this._otherMP5 = options['mp5FromGearAndRaidBuffs'];
        this._currentMana = this._baseMaxMana;

        // tracks potential buffs like dmcg
        this._buffs = {};
        // dmcg is a unique case where we want to initialise it at the start under _buffs
        // this is because it can be procced by every spell cast
        if (this._options['trinkets'].indexOf('dmcg') > -1) {
            this.setBuffActive('dmcg', false, 0, true);
        }

        this._manaCooldowns = [];
        this._rngThresholds = {};
        this.createRngThresholds(rng, thresholdItemsToCreate, maxMinsToOOM);

        this._spells = this.initialiseSpells();
        this._validSpells = this._spells.map((_spell) => _spell['key']);
        this._instantSpells = this._spells.filter((_spell) => _spell['instant']).map((_spell) => _spell['key']);
        this._statistics = {
            'manaGenerated': {},
            'manaSpent': {},
            'spellsCasted': {},
            'healing': {},
            'overall': {spellsCasted: 0, nonHealingSpellsWithGcd: 0, healing: 0},
        }

        this._hasteFactor = 0;
        this._spellQueue = this.createSpellQueue(rng);
    }

    // in this function, we 1. create spell queue for non-cd spells
    // 2. determine a haste factor for all the spells 
    // to determine haste factor, use formula -- sum(spell_cpm * base_cast) / 60
    // modify the cast time of all spells
    createSpellQueue(rng) {
        let castProfile = {},
            hasteNumerator = 0,
            spellInfo;
        // we only want want to include spells with non-cd in spellqueue
        // cooldown spells are automatically casted on cooldown
        for (let key in this._options['cpm']) {
            spellInfo = this.classInfo['spells'].find(_spell => _spell['key'] === key)
            if (spellInfo['cooldown'] === 0) {
                castProfile[key] = this._options['cpm'][key];
            }
            // instants are considered to have 0 cast time, but we need to account it when calculating haste factor since it still invokes gcd
            // baseGCD is 1.5, hence
            hasteNumerator += this._options['cpm'][key] * Math.max(spellInfo['baseCastTime'], DATA['constants']['baseGCD']);
        }
        // we need to also consider cooldowns like divine plea - which appear in the simulation but are not under the spells portion
        hasteNumerator += this.classInfo['numGcdsPerMinNotCountedUnderSpells'] * DATA['constants']['baseGCD'];
        this._hasteFactor = hasteNumerator / 60;
        // gcd is also reduced by haste factor
        this._gcd /= this._hasteFactor;
        for (let i in this._spells) {
            this._spells[i]['castTime'] = this._spells[i]['baseCastTime'] / this._hasteFactor;
        }
        return new SpellQueue(castProfile, rng);
    }

    // start getters
    get spellPower() {
        if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['active']) {
            return this._baseSpellPower + this.spellPowerIncreaseFromInt(DATA['items']['dmcg']['proc']['int']);
        } else {
            return this._baseSpellPower;
        }
    }

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
    // takes an optional logger if we want to log when buff is activated or deactivated
    setBuffActive(buffKey, isActive, timestamp, availableForUse=false, logger=null) {
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
            if (logger) logger.log(`${timestamp}s: ${buffKey} activated`, 2);
        } else {
           this._buffs[buffKey]['availableForUse'] = availableForUse;
           if (logger) logger.log(`${timestamp}s: ${buffKey} expired`, 2);
        }
    }
    // end setters

    isBuffActive(buffKey) {
        return (typeof this._buffs[buffKey] !== 'undefined') && this._buffs[buffKey]['active'];
    }

    // checks if dmcg is available for use
    // if it is, then checks if spell can proc dmcg
    // if dmcg is activated, then also need to pass a dmcg expire event
    handleDmcg(timestamp, spellIndex, logger) {
        let eventsToCreate = [];
        // if dmcg is worn, see if it can proc
        if (typeof this._buffs['dmcg'] !== 'undefined') {
            // NOTE -> while mana cooldowns availability are checked regularly (under useManaCooldown), dmcg isn't as it is not a mana cooldown
            // hence we need to update it's availability
            if (!this._buffs['dmcg']['availableForUse'] && (timestamp - this._buffs['dmcg']['lastUsed'] >= DATA['items']['dmcg']['proc']['icd'])) {
                this._buffs['dmcg']['availableForUse'] = true;
            }

            if (this._buffs['dmcg']['availableForUse']) {
                let isDmcg = this.checkProcHelper('dmcg', spellIndex, 1, DATA['items']['dmcg']['proc']['chance']);
                if (isDmcg) {
                    this.setBuffActive('dmcg', true, timestamp, false, logger);
                    eventsToCreate.push({timestamp: timestamp + DATA['items']['dmcg']['proc']['duration'], eventType: 'BUFF_EXPIRE', subEvent: 'dmcg'});
                }
            }
        }
        return eventToCreate;
    }

    // checks to see if currentMana has exceeded max mana at end of turn
    // e.g. when dmcg expires
    checkOverflowMana(timestamp) {
        if (this._currentMana > this.maxMana) {
            this._currentMana = this.maxMana;
        }
    }

    // start functions that are used for initialisation
    initialiseSpells() {
        let results = [];
        for (let _spell of this.classInfo['spells']) {
            // object.assign is fine here as no nested stuff
            let entry = Object.assign({}, _spell);

            // // KIV -> to remove
            // // setting cast time for each spell based on user options
            // if (_spell['instant']) {
            //     entry['castTime'] = 0;
            // } else if (typeof this._options['castTimes'][_spell['key']] === 'undefined') {
            //     throw new Error('missing cast time for ' + _spell['key']);
            // } else {
            //     entry['castTime'] = this._options['castTimes'][_spell['key']];
            // }
            entry['availableForUse'] = true;
            entry['lastUsed'] = -9999;
            results.push(entry);
        }
        return results;
    }

    // takes an array of cooldowns, in order of cooldowns to be used first, together with relevant metrics
    initialiseManaCooldowns(manaArr) {
        for (let cd of manaArr) {
            let entry = JSON.parse(JSON.stringify(DATA['manaCooldowns'][cd['key']]));
            entry['minimumManaDeficit'] = cd['minimumManaDeficit'];
            entry['minimumTimeElapsed'] = cd['minimumTimeElapsed'];
            entry['waitForBuff'] = 'waitForBuff' in cd ? cd['waitForBuff'] : '';
            entry['lastUsed'] = -9999;
            this._manaCooldowns.push(entry);
        }
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


    selectSpellHelper(timestamp, spellIndex, overrideSpellSelection='') {
        let spellSelected = null, selectedSpellKey;

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
        // we use the spellQueue to decide what spell to select (to try to adhere to user's input cast profile)
        selectedSpellKey = this._spellQueue.getSpell();
        return spellsWithNoCooldown.find((_spell) => _spell['key'] === selectedSpellKey);
    }

    // checks to see if a mana cooldown should be used
    // note that manacooldowns are listed in order in importance
    // only go to next item if current item is unavailable
    // returns [status, eventToCreate]
    // status: 0: no cooldown selected
    // 1: cooldown selected but doesn't require gcd
    // 2: cooldownselected, and requires gcd
    useManaCooldown(timestamp, logger=null) {
        let cooldownSelected = null,
            // offset = 0,
            requireGCD = false,
            eventsToCreate = [],
            manaDeficit;

        manaDeficit = this.maxMana - this._currentMana;
        // updates and checks if any cds are now available for use
        for (let cd of this._manaCooldowns) {
            if (!cd['availableForUse'] && (timestamp - cd['lastUsed'] >= cd['cooldown'])) {
                cd['availableForUse'] = true;
            }

            // if still not available, skip
            if (!cd['availableForUse'] || manaDeficit < cd['minimumManaDeficit'] || timestamp < cd['minimumTimeElapsed']) {
                continue;
            }

            // e.g. if we want to only use arcane torrent when dmcg is active
            if (cd['waitForBuff'] !== '' && !this.isBuffActive(cd['waitForBuff'])) {
                continue;
            }
            cooldownSelected = cd;
        }

        // no cooldown is available
        if (cooldownSelected === null) {
            return [0, eventsToCreate];
        }

        if (cooldownSelected['category'] === 'immediate') {
            let value = cooldownSelected['value'];
            // e.g. arcane torrent uses % of max mana pool rather than fixed amount
            if (cooldownSelected['subCategory'] === 'percentageManaPool') {
                value = Math.floor(this.maxMana * value);
            }
            // checks for injector bonus if runic mana potion
            if (cooldownSelected['key'] === 'RUNIC_MANA_POTION' && this._options['manaOptions']['injector']) {
                value *= (1 + DATA['manaCooldowns']['RUNIC_MANA_POTION']['injectorBonus']);
            }

            this.addManaHelper(value, cooldownSelected['key'], logger);
        }
        cooldownSelected['lastUsed'] = timestamp;
        cooldownSelected['availableForUse'] = false;

        // adds a buff
        // assumes that manacooldowns are instant and not on gcd??
        // if not, modify this code
        if (cooldownSelected['category'] === 'buff') {
            // sets buff active, and returns an event for buff to expire
            this.setBuffActive(cooldownSelected['key'], true, timestamp, false, logger);
            eventsToCreate.push({timestamp: timestamp + DATA['manaCooldowns'][cooldownSelected['key']]['duration'], eventType: 'BUFF_EXPIRE', subEvent: cooldownSelected['key']});
        }

        // certain spells like divine plea put the system on gcd
        // though if it's from a different class (e.g. you are pally, and benefit from Mana tide)
        // then u aren't affected
        if (!cooldownSelected['offGcd'] && cooldownSelected['playerClass'] === this._playerClass) {
            requireGCD = true;
            eventsToCreate.push({
                timestamp: timestamp, 
                eventType: 'MANA_COOLDOWN_SPELL_CAST',
                subEvent: cooldownSelected['key'],
            });
        } 

        // first condition: we see if there are spells that are casted by other classes
        // these are always considered offGCD even if they actually require a spell cast since they are casted by another player
        // e.g. if player is pally, mana tide totem falls under this category
        // second condition -> any sort of cooldown that is off gcd and interval (e.g owl)
        if ((cooldownSelected['playerClass'] !== this._playerClass && cooldownSelected['playerClass'] !== 'all') ||
                (cooldownSelected['offGcd'] && cooldownSelected['category'] === 'interval')) {
            requireGCD = false;
            eventsToCreate.push({
                timestamp: timestamp, 
                eventType: 'MANA_COOLDOWN_OFF_GCD',
                subEvent: cooldownSelected['key'],
            });
        }

        return [requireGCD ? 2 : 1, eventsToCreate];
    }

    // returns uncrit healing amount
    // multplicative factors are passed as an array of dictionaries
    // each dictionary is added together before mulitplied with the healingValue
    // lets say multiplicativeFactors = [{'healingLight': 0.12}, {'divinity': 0.05}, {'beacon': 1, 'glpyh': 0.5}]
    // then we multiply x by (1 + 0.12) * (1 + 0.05) * (1 + 1 + 0.5)
    // additiveFactors not implemented yet; it's for when we add stuff to amount before multiplication
    calculateHealingHelper(spellKey, additiveFactors=null, multiplicativeFactors=null, isCrit=false) {
        const spellData = this.classInfo['spells'].find((_spell) => _spell['key'] === spellKey);
        let amount = spellData['baseHeal'] + this.spellPower * spellData['coefficient'];
        let factorSum = 0;
        if (multiplicativeFactors !== null) {
            for (let factor of multiplicativeFactors) {
                factorSum = Utility.sum(Object.values(factor)) + 1;
                amount *= factorSum;
            }
        }

        amount = Math.floor(amount * (isCrit ? 1.5 : 1));

        // stores in statistics
        if (!(spellKey in this._statistics['healing'])) {
            this._statistics['healing'][spellKey] = 0;
        }

        this._statistics['healing'][spellKey] += amount;
        this._statistics['overall']['healing'] += amount;
        return amount;
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
            this._statistics['manaGenerated'][key] += Math.abs(Math.floor(value - oldValue));
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
            this._statistics['manaGenerated'][key] += Math.abs(Math.floor(otherMultiplicativeTotal * (value - oldValue)));
        }

        value = Math.floor(value * otherMultiplicativeTotal);

        if (value > this._currentMana) {
            return [0, 0, this._currentMana, 'Insufficient Mana'];
        }
        else {
            this._currentMana -= value
            if (!(spellKey in this._statistics['manaSpent'])) {
                this._statistics['manaSpent'][spellKey] = 0;
            }
            this._statistics['manaSpent'][spellKey] += value;
            return [1, value, this._currentMana, null];
        }
    }

    addManaRegenPercentageOfManaPool(timestamp, percentage, category, logger=null) {
        let key = category;
        if (key.indexOf('_') > -1) {
            key = Utility.camalize(key);
        }
        this.addManaHelper(Math.floor(percentage * this.maxMana), key, logger, timestamp);
    }

    // timestamp should be optional; if we don't pass anything here, then it just doesnt print out timestamp
    addManaHelper(amount, category, logger=null, timestamp=-1) {
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
        if (logger && amount > 0) {
            let msg =  (timestamp !== -1 ? `${timestamp}s: ` : '') +
                `Gained ${this._currentMana - oldMana} from ${category}`;

            logger.log(msg, 2);
        }
        return this._currentMana - oldMana;
    }

    // converts mp5 to a mp2 tick value
    addManaRegenFromReplenishmentAndOtherMP5(logger=null, timestamp=null) {
        // we could use a cached value, but DMCG increases max mana pool, so for time being, we recalculate each time we call this
        const replenishmentTick = (this.maxMana * DATA['constants']['replenishment'] / 5 * 2 * this._options['manaOptions']['replenishmentUptime']);
        const otherMP5Tick = (this._otherMP5 / 5 * 2);
        const tickAmount = Math.floor(replenishmentTick + otherMP5Tick);
        // since replenishment might tick outside spellcast, we print timestamp
        if (logger) logger.log(`${timestamp}s: Gained ${tickAmount} from mana tick`, 2);

        // we record the ticks from replenishment and othermp5 separately; need to ensure we don't lose values due to floor function
        this.addManaHelper(Math.floor(replenishmentTick), 'Replenishment');
        this.addManaHelper(tickAmount - Math.floor(replenishmentTick), 'otherMP5');
    }

    manaIncreaseFromInt(value) {
        return Math.floor(value * DATA['constants']['manaFromOneInt'] * this._intModifier);
    }

    critIncreaseFromInt(value) {
        return value * this._intModifier * DATA['constants']['critChanceFromOneInt'];
    }

    spellPowerIncreaseFromInt(value) {
        return Math.floor(value * this._intModifier * this.classInfo['spellPowerFromInt']);
    }

    addNonHealingSpellsWithGcdToStatistics() {
        this._statistics['overall']['nonHealingSpellsWithGcd']++;
    }

    addSpellCastToStatistics(spellKey, isCrit) {
        // actual casting
        if (!(spellKey in this._statistics['spellsCasted'])) {
            this._statistics['spellsCasted'][spellKey] = {
                'normal': 0,
                'crit': 0,
                'total': 0,
            }
        }
        this._statistics['spellsCasted'][spellKey][isCrit ? 'crit' : 'normal']++;
        this._statistics['spellsCasted'][spellKey]['total']++;
        this._statistics['overall']['spellsCasted']++;
    }

    calculate_statistics_after_sim_ends(total_time) {
        // for spell in self._statistics['spells']:
        //     this._statistics['spells'][spell]['hps'] = this._statistics['spells'][spell]['total_healing'] / total_time
        //     total_casts = self._statistics['spells'][spell]['normal'] + this._statistics['spells'][spell]['crit']
        //     this._statistics['spells'][spell]['cpm'] = total_casts / total_time * 60
        //     this._statistics['spells'][spell]['crit_rate'] = 0 if total_casts == 0 else self._statistics['spells'][spell]['crit'] / total_casts
        //     this._statistics['overall']['total_healing'] += this._statistics['spells'][spell]['total_healing']
        // # self._statistics['spells'][key]['soup'] += 1

        // this._statistics['overall']['mps'] = this._statistics['overall']['total_mana_used'] / total_time
        // this._statistics['overall']['hps'] = this._statistics['overall']['total_healing'] / total_time
        // console.log(this._spells);
        // if (logger) logger.log(this._statistics, 2);
        // console.log('printing statistics');
        // console.log(this._statistics);

        let toReturn = {manaGenerated: [], spellsCasted: []};
        for (let key in this._statistics['manaGenerated']) {
            // poor code: manually converts certain keys to what is shown on client's table
            let newKey = key in DATA['manaCooldownNamesMap'] ? DATA['manaCooldownNamesMap'][key] : Utility.capitalizeFirstLetter(key);
            // the keys here are what is shown on the client table, hence the weird notation
            toReturn['manaGenerated'].push({
                'source': newKey,
                'MP5': Math.floor(this._statistics['manaGenerated'][key] / total_time * 5),
            });
        }

        for (let key in this._statistics['spellsCasted']) {
            let totalCasts = this._statistics['spellsCasted'][key]['total'],
                totalManaSpent = 0,
                castTime = this._spells.find((_spell) => _spell['key'] === key)['castTime'],
                hpet = 0; // healing per effective time

            // for instants, use gcd to calculate
            if (castTime === 0) {
                castTime = this._gcd;
            }
            // trying to calculate how much mana we spent on average
            totalManaSpent = (typeof this._statistics['manaSpent'] !== 'undefined') && (typeof this._statistics['manaSpent'][key] !== 'undefined')
                ? this._statistics['manaSpent'][key] : 0;
            // only applicable for paladin - subtract mana saved from illumination
            if ((typeof this._statistics['illumination'] !== 'undefined') &&
                    (typeof this._statistics['illumination'][key] !== 'undefined')) {
                totalManaSpent -= this._statistics['illumination'][key]
            }

            hpet = Math.floor((this._statistics['healing'][key] / totalCasts) / castTime)

            toReturn['spellsCasted'].push({
                // converts HOLY_LIGHT to Holy Light
                'spell': key.split('_').map(k => Utility.capitalizeFirstLetter(k.toLowerCase())).join(' '),
                'cpm': Utility.roundDp(totalCasts / total_time * 60, 1),
                'avgManaCost': Math.floor(totalManaSpent / totalCasts),
                'hpet': hpet, 
            });
        }

        return toReturn;
    }

    toString() {
        return `Mana: ${this._currentMana} / ${this.maxMana}`;
    }
}
module.exports = BasePlayer;