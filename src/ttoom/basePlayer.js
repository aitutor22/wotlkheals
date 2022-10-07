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
    constructor(playerClass, options, rng, thresholdItemsToCreate, maxMinsToOOM, spellsToExclude=null) {
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

        // adds buffs and consumes to int
        this._unbuffedInt = options['unbuffedInt'];
        let intAfterRaidBuffs = options['unbuffedInt'] + DATA['constants']['intRaidBuffs'] +
            (options['flask'] === 'distilledWisdom' ? DATA['battleConsumables']['flaskDistilled']['base']['int'] : 0);
        this._buffedInt = Math.floor(intAfterRaidBuffs * this.classInfo['intModifier']);

        // first 20 points of int gives 1 mana, 15 mana thereafter (note that we already multiplifed by int modifier above)
        let baseMaxMana = Math.floor(this.classInfo['baseMana'] + (this._buffedInt - 20) * DATA['constants']['manaFromOneInt'] + 20 );

        // when there is dmc: greatness proc, we increase mana_pool, so need baseMaxMana as a reference
        this._baseMaxMana = baseMaxMana;
        this._baseCritChance = options['critChance'] + this.classInfo['baseCritChanceModifier'] + DATA['constants']['critChanceRaidBuffs'] + 
            this._buffedInt * DATA['constants']['critChanceFromOneInt'] + this.classInfo['baseCritChance'];

        // note: we don't use haste for spell cast times typically - we use cpm instead
        // however, we still use the haste rating for certain tasks, like for melee weaving for paladins
        this._haste = options['haste'] * DATA['constants']['hasteRaidBuffs'] * this.classInfo['otherHasteBuff'];

        this._baseSpellPower = Math.floor(options['unbuffedSpellPower'] + this._buffedInt * this.classInfo['spellPowerFromInt'] 
            + DATA['constants']['spellPowerRaidBuffs']
            + (options['flask'] === 'frostWyrm' ? DATA['battleConsumables']['flaskFrostWyrm']['base']['spellpower'] : 0));

        // loops through the trinkets selected, and adds base stat values - currently only supports int and spellpower and crit
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

            if (typeof item['base']['critRating'] !== 'undefined') {
                this._baseCritChance += (item['base']['critRating'] / DATA['constants']['critRatingConversion']) / 100;
            }

            if (typeof item['base']['hasteRating'] !== 'undefined') {
                throw new Error('Haste not implemented yet');
            }
        }

        this._otherMP5 = options['mp5FromGear'] + DATA['constants']['mp5RaidBuffs'];
        // checks if user has passed in startingMana
        if (options['manaOptions']['manaNotFull']) {
            this._currentMana = Math.min(this._baseMaxMana, options['manaOptions']['startingMana']);
        } else {
            this._currentMana = this._baseMaxMana;
        }

        // tracks potential buffs like dmcg (15s duration)
        this._buffs = {};
        // tracks icds like ied and also dmcg (the 45s cooldown)
        this._icds = {};
        // similar to buffs, but has counter (like Tidal Waves)
        this._stacks = {};
        // assume all healers are using IED
        this._procsOnCastToCheck = ['ied'];
        this._procsOnCritToCheck = [];

        // checks if player is using items that have procs like dmcg that are checked on cast
        for (let potentialProc of DATA['itemProcsOnCast']) {
            if (this._options['trinkets'].indexOf(potentialProc) > -1) {
                this._procsOnCastToCheck.push(potentialProc);
            }
        }

        // checks for procs like soul of the dead
        for (let potentialProc of DATA['itemProcsOnCrit']) {
            if (this._options['trinkets'].indexOf(potentialProc) > -1) {
                this._procsOnCritToCheck.push(potentialProc);
            }
        }

        this._manaCooldowns = [];
        this._rngThresholds = {};
        this.createRngThresholds(rng, thresholdItemsToCreate, maxMinsToOOM);

        this._spells = this.initialiseSpells(spellsToExclude);
        this._validSpells = this._spells.map((_spell) => _spell['key']);
        this._instantSpells = this._spells.filter((_spell) => _spell['instant']).map((_spell) => _spell['key']);
        this._statistics = {
            'manaGenerated': {},
            'manaSpent': {},
            'spellsCasted': {},
            'healing': {},
            'overall': {spellsCasted: 0, nonHealingSpellsWithGcd: 0, healing: 0},
            'raidBuffedStats': {},
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
        this._gcd = Math.max(1, this._gcd); // gcd cannot be below 1s
        for (let i in this._spells) {
            // spellcast times cannot be below 1s
            // but only applies for non instants
            this._spells[i]['castTime'] =  this._spells[i]['baseCastTime'] / this._hasteFactor;
            if (!this._spells[i]['instant'] && this._spells[i]['castTime'] < 1 && this._spells[i]['castTime'] > 0) {
                this._spells[i]['castTime'] = 1
            }
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

    // split this into a separate function as we want to use this to work out dmcg proc benefit
    get incrementalManaFromDmcgProc() {
        return this.manaIncreaseFromInt(DATA['items']['dmcg']['proc']['int']);
    }

    // checks for whether dmcg buff is active; if so, then uses the increased mana pool
    get maxMana() {
        if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['active']) {
            return this._baseMaxMana + this.incrementalManaFromDmcgProc;
        } else {
            return this._baseMaxMana;
        }
    }

    // split this into a separate function as we want to use this to work out dmcg proc benefit
    get incrementalCritChanceFromDmcgProc() {
        return this.critIncreaseFromInt(DATA['items']['dmcg']['proc']['int']);
    }

    get critChance() {
        if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['active']) {
            return this._baseCritChance + this.incrementalCritChanceFromDmcgProc;
        } else {
            return this._baseCritChance;
        }
    }

    get classInfo() {
        return DATA['classes'][this._playerClass];
    }

    // end getters


    // NEED TO DO MORE WORK HERE WITH UNIT TESTS
    // -> should split 
    // buffs are just simple active, or not active and will reply on BUFF_EXPIRE
    // ICDs are more complex and need to be constantly checked

    // start setters
    // typically, we don't pass in availableForUse, as usually it will be set to false here
    // and set back to active in another function.
    // exceptions to these include initialising dmcg (where we want active to be false, but have it still be availableForUse)
    // takes an optional logger if we want to log when buff is activated or deactivated
    setBuffActive(buffKey, isActive, timestamp, logger=null) {
        if (typeof this._buffs[buffKey] === 'undefined') {
            this._buffs[buffKey] = {
                active: false, // is it currently active
            }
        }

        this._buffs[buffKey]['active'] = isActive;
        if (isActive) {
            if (logger) logger.log(`${timestamp}s: ${buffKey} activated`, 2);
        } else {
           if (logger) logger.log(`${timestamp}s: ${buffKey} expired`, 2);
        }
    }

    // operation can be set, increment, or decrement
    modifyStacks(stackKey, operation, amount, timestamp, logger=null) {
        if (typeof this._stacks[stackKey] === 'undefined') {
            this._stacks[stackKey] = {
                amount: 0,
            }
        }

        if (operation === 'set') {
            let oldAmount = this._stacks[stackKey];
            this._stacks[stackKey] = amount;
            // only log if there is a change in stacks
            if (logger && amount !== oldAmount) logger.log(`${timestamp}s: setting ${stackKey} stacks to ${amount}`, 2);
        } else if (operation === 'decrement') {
            this._stacks[stackKey] = Math.max(0, this._stacks[stackKey] - amount);
            if (logger) logger.log(`${timestamp}s: decreasing ${stackKey} stacks to ${amount}`, 2);
        } else if (operation === 'increment') {
            this._stacks[stackKey] += amount;
            if (logger) logger.log(`${timestamp}s: increasing ${stackKey} stacks to ${amount}`, 2);
        } else {
            throw new Error('Invalid operation: ' + operation);
        }
    }
    // end setters

    isStackActive(stackKey) {
        return (typeof this._stacks[stackKey] !== 'undefined') && this._stacks[stackKey] > 0;
    }

    isBuffActive(buffKey) {
        return (typeof this._buffs[buffKey] !== 'undefined') && this._buffs[buffKey]['active'];
    }

    // will run through a list of procs with internal cooldown that can trigger after a spell cast
    // we need to first check if the proc is off cooldown
    // then we check if it procs
    // and then for each proc, we have a specific effect
    // after a proc, we then return a list of expire buff events (for stuff like dmcg)
    checkHandleProcsWithICDHelper(procsToCheck, timestamp, spellIndex, logger) {
        let eventsToCreate = [];
        for (let procName of procsToCheck) {
            let info = DATA['items'][procName]['proc'];
            if (typeof this._icds[procName] === 'undefined') {
                this._icds[procName] = {
                    availableForUse: true, // can it be used
                    lastUsed: -9999, // timestamp of last usage
                }
            }

            // checks and see if procs have come off cd
            if (!this._icds[procName]['availableForUse'] && (timestamp - this._icds[procName]['lastUsed'] >= info['icd'])) {
                this._icds[procName]['availableForUse'] = true;
            }

            if (this._icds[procName]['availableForUse']) {
                let isProc = this.checkProcHelper(procName, spellIndex, 1, info['chance']);
                if (isProc) {
                    this._icds[procName]['availableForUse'] = false;
                    this._icds[procName]['lastUsed'] = timestamp;

                    // if proc leads to a direct mana gain like ied, call addManaHelper
                    if ('mana' in info) {
                        this.addManaHelper(info['mana'], procName, logger);
                    }

                    // if proc results in creation of a buff, we call setBuffActive and also returns a buff_expire event
                    if ('createsBuff' in info && info['createsBuff']) {
                        this.setBuffActive(procName, true, timestamp, logger);
                        eventsToCreate.push({timestamp: timestamp + info['duration'], eventType: 'BUFF_EXPIRE', subEvent: procName});
                    }
                }
            }
        }
        return eventsToCreate;
    }

    // checks procs that arise from cast like IED, dmcg
    checkHandleProcsOnCastWithICD(timestamp, spellIndex, logger) {
        return this.checkHandleProcsWithICDHelper(this._procsOnCastToCheck, timestamp, spellIndex, logger);
    }

    // checks procs that arise from cast like IED, dmcg
    checkHandleProcsOnCritWithICD(timestamp, spellIndex, logger) {
        return this.checkHandleProcsWithICDHelper(this._procsOnCritToCheck, timestamp, spellIndex, logger);
    }


    // checks to see if currentMana has exceeded max mana at end of turn
    // e.g. when dmcg expires
    checkOverflowMana(timestamp) {
        if (this._currentMana > this.maxMana) {
            this._currentMana = this.maxMana;
        }
    }

    // start functions that are used for initialisation
    initialiseSpells(spellsToExclude) {
        let results = [];
        if (!spellsToExclude) {
            spellsToExclude = [];
        }
        for (let _spell of this.classInfo['spells']) {
            // checks that this isn't part of a spell to be excluded
            if (spellsToExclude.indexOf(_spell['key']) > -1) continue;
            // object.assign is fine here as no nested stuff
            let entry = Object.assign({}, _spell);

            // for spells that have a cooldown (e.g. HOLY_SHOCK) and user passes in the cpm
            // we modify the cooldown in the system
            if (entry['key'] in this._options['cpm']) {
                let spellCpm = this._options['cpm'][entry['key']];
                // if user has said don't cast the spell, then we don't include in _spells
                if (spellCpm === 0) continue;

                // if spell has a cooldown, then we should modify it according to the passed in cpm
                // spells with no cooldowns like FoL or HL won't be affected
                if (entry['cooldown'] > 0) {
                    entry['cooldown'] = 60 / spellCpm;
                }
            }

            // for precasted hots (e.g. earthshield, sacred shield), system will assume that it is casted just before fight begins
            // will also put the spell on cooldown
            if (typeof entry['precasted'] !== 'undefined' && entry['precasted']) {
                entry['availableForUse'] = false;
                entry['lastUsed'] = 0;    
            } else {
                entry['availableForUse'] = true;
                entry['lastUsed'] = -9999;
            }
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
            entry['maxNumUsesPerFight'] = 'maxNumUsesPerFight' in cd ? cd['maxNumUsesPerFight'] : 999; // high number means no limit
            entry['lastUsed'] = -9999;
            entry['numTimesUsed'] = 0; // could be useful for stuff like divine plea, when we want to cap the number of times we use it per fight
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
            if (item === 'waterShield' || (this._playerClass === 'shaman' && (item === 'crit' || item === 'earthliving' || item === 'soulDead'))) {
                factor = 4; // up to max of 4 chances for water shield to proc when we use chain heal; same for crit; soulDead is based on crit, so need 4x more rng numbers too
            }
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

    // for spells that are not healing spells
    castOtherSpell(spellKey, timestamp, spellIndex, logger) {
        let spellInfo = this.classInfo['spells'].find(_spell => _spell['key'] === spellKey);
        let originalMana = this._currentMana;
        let [status, manaUsed, currentMana, errorMessage] = this.subtractMana(spellKey, timestamp, {});
        let eventsToCreate = [];

        if (status === 0) {
            return [status, errorMessage, 0, eventsToCreate];
        }

        let offset = this._instantSpells.indexOf(spellKey) > -1 ? this._gcd : 0;
        let msg = `${timestamp}s: Casted ${spellKey} (spent ${originalMana - currentMana} mana)`;
        logger.log(msg, 2);
        return [status, errorMessage, offset, eventsToCreate];
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

            // e.g. if we want to limit the number of uses in a fight
            if (cd['maxNumUsesPerFight'] !== '' && cd['numTimesUsed'] >= cd['maxNumUsesPerFight']) {
                continue;
            }
            cooldownSelected = cd;
            break; //ensures if there are two or more potential mana cooldowns, we use the first one 
        }

        // no cooldown is available
        if (cooldownSelected === null) {
            return [0, eventsToCreate];
        }

        if (cooldownSelected['category'] === 'immediate') {
            // e.g. arcane torrent uses % of max mana pool rather than fixed amount
            if (cooldownSelected['subCategory'] === 'percentageManaPool') {
                this.addManaRegenPercentageOfManaPool(timestamp, cooldownSelected['value'], cooldownSelected['key'], logger);
            } else {
                let value = cooldownSelected['value'];
                // checks for injector bonus if runic mana potion
                if (cooldownSelected['key'] === 'RUNIC_MANA_POTION' && this._options['manaOptions']['injector']) {
                    value *= (1 + DATA['manaCooldowns']['RUNIC_MANA_POTION']['injectorBonus']);
                }
                this.addManaHelper(value, cooldownSelected['key'], logger);
            }
        }
        cooldownSelected['lastUsed'] = timestamp;
        cooldownSelected['availableForUse'] = false;
        cooldownSelected['numTimesUsed']++;

        // adds a buff
        // assumes that manacooldowns are instant and not on gcd??
        // if not, modify this code
        if (cooldownSelected['category'] === 'buff') {
            // sets buff active, and returns an event for buff to expire
            this.setBuffActive(cooldownSelected['key'], true, timestamp, false, logger);
            if (logger) logger.log(`${Utility.roundDp(timestamp, 2)}s: ${cooldownSelected['key']} used`, 2);
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

    addHealingToStatistics(spellKey, amount) {
        // stores in statistics
        if (!(spellKey in this._statistics['healing'])) {
            this._statistics['healing'][spellKey] = 0;
        }

        this._statistics['healing'][spellKey] += amount;
        this._statistics['overall']['healing'] += amount;
    }

    // returns uncrit healing amount
    // multplicative factors are passed as an array of dictionaries
    // each dictionary is added together before mulitplied with the healingValue
    // lets say multiplicativeFactors = [{'healingLight': 0.12}, {'divinity': 0.05}, {'beacon': 1, 'glpyh': 0.5}]
    // then we multiply x by (1 + 0.12) * (1 + 0.05) * (1 + 1 + 0.5)
    // additiveFactors not implemented yet; it's for when we add stuff to amount before multiplication
    // coefficientAddition is for situations like tidalWaves where we add bonus healing effects
    calculateHealingHelper(spellKey, additiveFactors=null, multiplicativeFactors=null, isCrit=false, coefficientAddition=0) {
        // if we get something like RIPTIDE|HOT, we want to calculate the hot portion while attributing the heal to riptide
        let isHot = false;
        if (spellKey.indexOf('|HOT') > -1) {
            spellKey = spellKey.split('|HOT')[0];
            isHot = true;
        }

        const spellData = this.classInfo['spells'].find((_spell) => _spell['key'] === spellKey);
        let amount = !isHot ? spellData['baseHeal'] + this.spellPower * (spellData['coefficient'] + coefficientAddition) :
            spellData['hotBaseHeal'] + this.spellPower * (spellData['hotCoefficient'] + coefficientAddition);
        let factorSum = 0;
        if (multiplicativeFactors !== null) {
            for (let factor of multiplicativeFactors) {
                factorSum = Utility.sum(Object.values(factor)) + 1;
                amount *= factorSum;
            }
        }
        
        amount = Math.floor(amount * (isCrit ? 1.5 : 1));
        this.addHealingToStatistics(spellKey, amount);
        return amount;
    }

    // takes an optional parameter allowMultipleHits
    // if set to false, returns a boolean indicating whether there is a successful hit
    // if set to true, returns the number of hits
    // originally wrote this for watershield when we were modelling chain heal crits as binary (either all crit or all dont crit)
    // subsequently, changed the behaviour to consider each hit separately
    // but leave the code in, in case we need it in future
    checkProcHelper(key, spellIndex, numHits, procChance, allowMultipleHits=false) {
        let arr = this._rngThresholds[key].slice(spellIndex * numHits, (spellIndex + 1) * numHits);
        if (arr.length === 0) throw new Error('ran out of rng numbers for ' + key);
        if (!allowMultipleHits) return Utility.anyValueBelowThreshold(arr, procChance);

        let numProcs = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] < procChance) numProcs++;
        }
        return numProcs;
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

    // for mana cooldowns that are based off max manapool, we need to check if dmcg was active
    addManaRegenPercentageOfManaPool(timestamp, percentage, category, logger=null) {
        // console.log('mana regen percentage: ' + category);
        let key = category,
            manaRegenExcludingDMCG = Math.floor(percentage * this.maxMana);
        
        if (key.indexOf('_') > -1) {
            key = Utility.camalize(key);
        }

        // if dmcg is active, we split out the dmcg and non-dmcg portions and report both
        if (this.isBuffActive('dmcg')) {
            // console.log(category);
            let manaRegenFromDMCG = Math.floor(percentage * this.incrementalManaFromDmcgProc);
            let dmcgKey = key + 'DMCG';
            manaRegenExcludingDMCG -= manaRegenFromDMCG;
            this.addManaHelper(manaRegenFromDMCG, dmcgKey, logger, timestamp);    
        }

        this.addManaHelper(manaRegenExcludingDMCG, key, logger, timestamp);
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

            logger.log(msg, 1);
        }
        return this._currentMana - oldMana;
    }

    // normally this function is in basePlayer
    // but due to water shield being tricky behaviour, we override the function instead
    addManaRegenFromReplenishmentAndOtherMP5(logger=null, timestamp=null) {
        const replenishmentFactor = DATA['constants']['replenishment'] / 5 * 2 * this._options['manaOptions']['replenishmentUptime'];
        const replenishmentTick = this.maxMana * replenishmentFactor;
        const otherMP5Tick = (this._otherMP5 / 5 * 2);
        const tickAmount = Math.floor(replenishmentTick + otherMP5Tick);
        // since replenishment might tick outside spellcast, we print timestamp
        if (logger) logger.log(`${timestamp}s: Gained ${tickAmount} from mana tick (replenishment + others)`, 1);

        // we record the ticks from replenishment and othermp5 separately; need to ensure we don't lose values due to floor function
        this.addManaRegenPercentageOfManaPool(timestamp, replenishmentFactor, 'replenishment', logger);
        // this.addManaHelper(Math.floor(replenishmentTick), 'Replenishment');
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

    // isCrit can be three values
    // 1 === crits (updates both spellcast and hits)
    // 0 === no crit (updates both spellcast and hits)
    // -1 === updates spellcast but not hits (will update this separately -
    // -1 is for hots that can crit like earthshield or for spells with multiple hits like CH
    addSpellCastToStatistics(spellKey, isCrit) {
        // actual casting
        if (!(spellKey in this._statistics['spellsCasted'])) {
            this._statistics['spellsCasted'][spellKey] = {
                'total': 0, // tracks total spellCasts
                'totalHits': 0,
                'critHits': 0,
            }
        }
        // tracks spellcasted
        this._statistics['spellsCasted'][spellKey]['total']++;
        this._statistics['overall']['spellsCasted']++;

        // for normal spells
        if (isCrit >= 0) {
            this.addHitsToStatistics(spellKey, isCrit);
        }
    }

    // this should be called directly for spells like chain heal with multiple hits
    // or earthshield
    addHitsToStatistics(spellKey, isCrit) {
        if (!(spellKey in this._statistics['spellsCasted'])) {
            this._statistics['spellsCasted'][spellKey] = {
                'total': 0, // tracks total spellCasts
                'totalHits': 0,
                'critHits': 0,
            }
        }
        this._statistics['spellsCasted'][spellKey]['totalHits']++;
        this._statistics['spellsCasted'][spellKey]['critHits'] += (isCrit ? 1 : 0);
    }

    getSoupEogProcs(spellIndex, numHits) {
        let procs = {};
        for (let _key of ['soup', 'eog']) {
            if (this._options['trinkets'].indexOf(_key) > -1) {
                procs[_key] = this.isSoupEogProc(_key === 'soup', spellIndex, numHits);
            };
        }
        return procs;
    }

    calculateStatisticsAfterSimEnds(totalTime) {
        let toReturn = {manaGenerated: [], spellsCasted: []};
        for (let key in this._statistics['manaGenerated']) {
            // poor code: manually converts certain keys to what is shown on client's table
            let newKey = key in DATA['manaCooldownNamesMap'] ? DATA['manaCooldownNamesMap'][key] : Utility.capitalizeFirstLetter(key);
            // the keys here are what is shown on the client table, hence the weird notation
            toReturn['manaGenerated'].push({
                'source': newKey,
                'MP5': Math.floor(this._statistics['manaGenerated'][key] / totalTime * 5),
            });
        }

        for (let key in this._statistics['spellsCasted']) {
            let totalCasts = this._statistics['spellsCasted'][key]['total'],
                // there are spells like chain heal which has multiple hits
                // or like earth shield which can crit but only on hits and not initial cast
                // thus, we separate totalCasts from totalHits
                totalHits = this._statistics['spellsCasted'][key]['totalHits'],
                critHits = this._statistics['spellsCasted'][key]['critHits'],
                normalCasts = totalCasts - critHits,
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
            // only applicable for paladin & shaman - subtract mana saved from illumination / water shield
            for (let manaSavingKey of ['illumination', 'illuminationDMCG', 'waterShieldProc', 'waterShieldProcDMCG']) {
                if ((typeof this._statistics[manaSavingKey] !== 'undefined') &&
                        (typeof this._statistics[manaSavingKey][key] !== 'undefined')) {
                    totalManaSpent -= this._statistics[manaSavingKey][key];
                }       
            }

            hpet = Math.floor((this._statistics['healing'][key] / totalCasts) / castTime)

            // we don't really want to do mean of crit % as that can be inaccurate
            // instead, we sum up all the crits across the entire batch (e.g. 400 runs)
            // and then calculate a final crit %
            toReturn['spellsCasted'].push({
                // converts HOLY_LIGHT to Holy Light
                'spell': key.split('_').map(k => Utility.capitalizeFirstLetter(k.toLowerCase())).join(' '),
                'cpm': Utility.roundDp(totalCasts / totalTime * 60, 1),
                'avgManaCost': Math.floor(totalManaSpent / totalCasts),
                'hpet': hpet,
                'hps': Math.floor((this._statistics['healing'][key] / totalTime)),
                'hpm': totalManaSpent > 0 ? Math.floor(this._statistics['healing'][key] / totalManaSpent) : 0,
                'critHits': critHits,
                'totalHits': totalHits,
            });
        }

        return toReturn;
    }

    toString() {
        return `Mana: ${this._currentMana} / ${this.maxMana}`;
    }
}
module.exports = BasePlayer;