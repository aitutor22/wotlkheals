const BasePlayer = require('../common/basePlayer');
const DATA = require('./gamevalues');
const Utility = require('./utilities');

// helper function - given an object, check if a key exists and whether it is true/false
function getKeyBoolean(obj, key) {
    return (obj && typeof obj[key] !== 'undefined') && obj[key];
}

// methods that must be implemented by all player class
// subtractMana

// kiv -> have we implemented function that checks avaialbility of spells and cds?

class Paladin extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(options) {
        super(options['manaPool'], 'paladin', options['mp5FromGearAndRaidBuffs'], options['critChance'], options);

        if (!this._options['2pT7'] && this._options['4pT7']) {
            throw new Error('4PT7 was selected but not 2PT7');
        }

        // second part of this is we assume 1.1 sow procs a min, and convert it to mp5 terms
        // should be refactored in future
        this._otherMP5 = options['mp5FromGearAndRaidBuffs'] + 1.1 * this._baseMaxMana * 0.04 / 12;
        this._otherMultiplicativeTotal = 1;
        // glyph of SOW reduces healing cost by 5%; note that we don't put 4pt7 here as it only affects HL
        this._baseOtherMultiplicativeTotal = Utility.getKeyBoolean(this._options, 'glyphSOW') ? (1 - this.classInfo['manaCostModifiers']['glyphSOW']) : 1;
        this._numHitsPerHolyLight = Math.floor(2 + this._options['glyphHolyLightHits']) // beacon + original target + glpyh

        this.initialiseManaCooldowns([{key: 'RUNIC_MANA_POTION', minimumManaDeficit: 18000, minimumTimeElapsed: 0}])
    }

    // when eventHeap gets a spellcast event, it tries to cast it

    // # returns (status, error_message, offset_timing, eventsToCreate)

    // selectSpell and castSpell work differently
    // selectSpell (in basePlayer) selects a spell given spellIndex, and returns the spell
    // castSpell is run when the event loop receves the spellcast event, and we determine if the spell is a crit, or has other procs
    // one might wonder might we don't just cast the spell directly after selecting it. 
    // this is because there could be events in between like mana ticks and/or buffs expiring (like dmcg)

    castSpell(spellKey, timestamp, spellIndex, logger) {
        if (this._validSpells.indexOf(spellKey) === -1) throw new Error('other spells not handled yet');

        let originalMana = this._currentMana;

        // player.add_spellcast_to_statistics(event._name, event._is_crit, event._is_soup_proc, event._is_eog_proc)
        let procs = {},
            eventsToCreate = [];
        let status, manaUsed, currentMana, errorMessage, offset, isCrit, msg, modifiedCritChance;

        // checks for soup, and eog procs
        // holy light has more hits; all other spells have 2 hits (due to beacon)
        for (let _key of ['soup', 'eog']) {
            if (this._options['trinkets'].indexOf(_key) > -1) {
                procs[_key] = this.isSoupEogProc(_key === 'soup', spellIndex, spellKey === 'HOLY_LIGHT' ? this._numHitsPerHolyLight : 2);
            };
        }

        modifiedCritChance = this.critChance;
        // 10% additional crit chance to holy shock from 2pT7
        if (spellKey === 'HOLY_SHOCK' && this._options['2pT7']) {
            modifiedCritChance += 0.1
        } 
        // infusion of lights adds 20% crit chance to holy light
        if (spellKey === 'HOLY_LIGHT' && this.isBuffActive('infusionOfLight')) {
            this.setBuffActive('infusionOfLight', false, timestamp, true, logger);
            modifiedCritChance += 0.2
        }

        logger.log(`Crit Chance: ${modifiedCritChance}`, 3);

        // all pally spells have 1 chance to crit (beacon just mirrors the spell cast)
        isCrit = this.checkProcHelper('crit', spellIndex, 1, modifiedCritChance);
        [status, manaUsed, currentMana, errorMessage] = this.subtractMana(spellKey, timestamp, procs);

        // player oom
        if (status === 0) {
            return [status, errorMessage, 0, eventsToCreate];
        }

        if (procs['soup']) {
            logger.log('🥣🥣🥣 SOUP 🥣🥣🥣', 2);
        } else if (procs['eog']) {
            logger.log('👀 👀 EOG 👀 👀', 2);
        }

        msg = isCrit ? `${timestamp}s: **CRIT ${spellKey}** (spent ${originalMana - currentMana} mana)` :
            `${timestamp}s: Casted ${spellKey} (spent ${originalMana - currentMana} mana)`;
        logger.log(msg, 2);

        // if we cast an instant spell, we need to account for it using the gcd
        offset = this._instantSpells.indexOf(spellKey) > -1 ? this._options['gcd'] : 0;

        // after spell is casted, add effects
        if (isCrit) {
            this.addManaFromIllumination(spellKey, logger);
            // holy shock crits triggers infusion of light
            if (spellKey === 'HOLY_SHOCK') {
                this.setBuffActive('infusionOfLight', true, timestamp, true, logger);
            }
        }

        // if dmcg is worn, see if it can proc
        if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['availableForUse']) {
            let isDmcg = this.checkProcHelper('dmcg', spellIndex, 1, DATA['items']['dmcg']['proc']['chance']);
            if (isDmcg) {
                this.setBuffActive('dmcg', true, timestamp, false, logger);
                eventsToCreate.push({timestamp: timestamp + DATA['items']['dmcg']['proc']['duration'], eventType: 'BUFF_EXPIRE', subEvent: 'dmcg'});
            }
        }

        // checks if sow proc from holy shock
        if (spellKey === 'HOLY_SHOCK' && this.checkProcHelper('sow', spellIndex, 1, this.classInfo['sow']['chance'])) {
            this.addManaFromSOWProc(logger);
        }

        return [status, errorMessage, offset, eventsToCreate];
    }

    // procs can be eog/soup
    subtractMana(spellKey, timestamp, procs) {
        // Holy Light gets a further 5% discount on mana cost
        let otherMultiplicativeTotal = (spellKey === 'HOLY_LIGHT' && getKeyBoolean(this._options, '4pT7')) ?
            this._baseOtherMultiplicativeTotal - this.classInfo['manaCostModifiers']['4pT7'] : this._baseOtherMultiplicativeTotal;

        let baseCostAdditiveFactors = {};
        // gonna assume that all hpals are wearing libramOfRenewal
        if (spellKey === 'HOLY_LIGHT') {
            baseCostAdditiveFactors['libramOfRenewal'] = this.classInfo['manaCostModifiers']['libramOfRenewal'];
        }

        // handles soup and eog; if both soup and eog are true, only use soup
        if (Utility.getKeyBoolean(procs, 'soup')) {
            baseCostAdditiveFactors['soup'] = DATA['items']['soup']['proc']['manaReduction'];
        } else if (Utility.getKeyBoolean(procs, 'eog')) {
            baseCostAdditiveFactors['eog'] = DATA['items']['eog']['proc']['manaReduction'];
        }
        return this.subtractManaHelper(spellKey, timestamp, {}, baseCostAdditiveFactors, otherMultiplicativeTotal);
    }

    addManaFromIllumination(spellKey, logger=null) {
        let baseManaCost = this.classInfo['spells'].find((_spell) => _spell['key'] === spellKey)['baseManaCost'];
        let amount = Math.floor(baseManaCost * 0.3);
        return this.addManaHelper(amount, 'illumination', logger);
    }

    // seal of wisdom proc
    addManaFromSOWProc(logger) {
        let amount = Math.floor(this.maxMana * this.classInfo['sow']['value']);
        return this.addManaHelper(amount, 'sow', logger);
    }
}

module.exports = Paladin;