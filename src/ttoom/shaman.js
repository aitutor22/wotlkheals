
const BasePlayer = require('./basePlayer');
const DATA = require('./gamevalues');
const Utility = require('../common/utilities');


// methods that must be implemented by all player class
// subtractMana

/*
    Some notes about Shaman
    - The initial cast of earthshield and each subsequent hit can proc soup (note that each ES hit can also crit)
    - This is different from Sacred Shield - which can proc soup only on cast, and all subsequent hits cannot proc soup (cannot crit too)
*/

class Shaman extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(options, rng, thresholdItemsToCreate, maxMinsToOOM) {
        super('shaman', options, rng, thresholdItemsToCreate, maxMinsToOOM);

        // if (!this._options['2pT7'] && this._options['4pT7']) {
        //     throw new Error('4PT7 was selected but not 2PT7');
        // }

        this._otherMP5 = options['mp5FromGearAndRaidBuffs'];
        this._otherMultiplicativeTotal = 1;
        // tidalFocus reduces healing cost by 5%; note that we don't put 2pt6 here as it only affects CHAIN_HEAL
        this._baseOtherMultiplicativeTotal = Utility.getKeyBoolean(this._options['talents'], 'tidalFocus') ? (1 - this.classInfo['manaCostModifiers']['tidalFocus']) : 1;
        this._numchainHealHits = Math.floor(this._options['chainHealHits']);
   
        this.initialiseManaCooldowns(options['manaCooldowns']);
    }

    // majority of spell selection is done in basePlayer's selectSpellHelper
    // the only logic we want to add is if infusion of light is active, always cast Holy Light unless CPM is set to 0
    selectSpell(timestamp, spellIndex) {
        // let overrideSpellSelection = this.isBuffActive('infusionOfLight') && this._options['cpm']['HOLY_LIGHT'] > 0 
        //     ? 'HOLY_LIGHT' : '';
        return this.selectSpellHelper(timestamp, spellIndex);
    }

    calculateHealing(spellKey, isCrit) {
        let amount = 0,
            multiplicativeFactors = [];
            // glyphHLFactor = this._options['glyphHolyLightHits'] * this.classInfo['glyphHolyLightHitHealingPercentage'];

        if (spellKey === 'CHAIN_HEAL') {
            let chainHealBounceFactor = 0.6 + 0.36 + 0.216; // 40% reduction per bounce, 4 hits with glyph
            // {'healingLight': 0.12}, {'divinity': 0.05}, {'beacon': 1, 'glpyh': glyphHLFactor}
            multiplicativeFactors = [{purification: 0.1}, {improvedChainHeal: 0.2}, {'bounces': chainHealBounceFactor}];
        }
        // else if (spellKey === 'FLASH_OF_LIGHT' || spellKey === 'HOLY_SHOCK') {
        //     multiplicativeFactors = [{'healingLight': 0.12}, {'divinity': 0.05}, {'beacon': 1}];
        // } 
        else {
            throw new Error('Unknown spellkey: ' + spellKey);
        }
        return Math.floor(this.calculateHealingHelper(spellKey, {}, multiplicativeFactors, isCrit));
    }

    // selectSpell and castSpell work differently
    // selectSpell (in basePlayer) selects a spell given spellIndex, and returns the spell
    // castSpell is run when the event loop receves the spellcast event, and we determine if the spell is a crit, or has other procs
    // one might wonder might we don't just cast the spell directly after selecting it. 
    // this is because there could be events in between like mana ticks and/or buffs expiring (like dmcg)
    castSpell(spellKey, timestamp, spellIndex, logger) {
        if (this._validSpells.indexOf(spellKey) === -1) throw new Error('other spells not handled yet');

        let originalMana = this._currentMana;

        let procs = {},
            eventsToCreate = [];
        let status, manaUsed, currentMana, errorMessage, offset, isCrit, msg, modifiedCritChance, amountHealed;

        // checks for soup, and eog procs
        // chain heal has more hits; all other spells have 1 hit
        procs = this.getSoupEogProcs(spellIndex, spellKey === 'CHAIN_HEAL' ? this._numchainHealHits : 1);

        modifiedCritChance = this.critChance;
        // // 10% additional crit chance to holy shock from 2pT7
        // if (spellKey === 'HOLY_SHOCK' && this._options['2pT7']) {
        //     modifiedCritChance += 0.1
        // } 
        // // infusion of lights adds 20% crit chance to holy light
        // if (spellKey === 'HOLY_LIGHT' && this.isBuffActive('infusionOfLight')) {
        //     this.setBuffActive('infusionOfLight', false, timestamp, true, logger);
        //     modifiedCritChance += 0.2
        // }

        let statMsg = '';
        statMsg += `Crit Chance: ${Utility.roundDp(modifiedCritChance * 100, 1)}% ; `;
        statMsg += `Spellpower: ${this.spellPower}`;
        logger.log(statMsg, 3);

        let spellInfo = this.classInfo['spells'].find(_spell => _spell['key'] === spellKey);
        // NOTE: Earthshield can crit, but when we cast spell here, it merely applies the spell and thus earth shield is 0 healing
        isCrit = spellInfo['category'] === 'directHeal' ? this.checkProcHelper('crit', spellIndex, 1, modifiedCritChance) : false;
        // directHeals should just calculate actual healing amount, for hots, just cast the spell
        if (spellInfo['category'] === 'directHeal') {
            amountHealed = this.calculateHealing(spellKey, isCrit);
        } else {
            eventsToCreate.push({
                timestamp: timestamp, 
                eventType: 'INITIALIZE_HOT_EVENTS',
                subEvent: spellInfo['key'],
            })
        }
        [status, manaUsed, currentMana, errorMessage] = this.subtractMana(spellKey, timestamp, procs);

        // player oom
        if (status === 0) {
            return [status, errorMessage, 0, eventsToCreate];
        }

        // BE CAREFUL WHERE THIS CODE GOES - if you put it before the oom check, will add 1 to final tally
        this.addSpellCastToStatistics(spellKey, isCrit);
        if (procs['soup']) {
            logger.log('🥣🥣🥣 SOUP 🥣🥣🥣', 2);
        } else if (procs['eog']) {
            logger.log('👀 👀 EOG 👀 👀', 2);
        }

        if (spellInfo['category'] === 'directHeal' ) {
            msg = isCrit ? `${timestamp}s: **CRIT ${spellKey} for ${amountHealed}** (spent ${originalMana - currentMana} mana)` :
                `${timestamp}s: Casted ${spellKey} for ${amountHealed} (spent ${originalMana - currentMana} mana)`;
        } else {
            // don't show amountHealed for casting of hots
            msg = `${timestamp}s: Casted ${spellKey} (spent ${originalMana - currentMana} mana)`;
        }
        logger.log(msg, 2);

        // if we cast an instant spell, we need to account for it using the gcd (modified by haste factor)
        offset = this._instantSpells.indexOf(spellKey) > -1 ? this._gcd : 0;

        // after spell is casted, add effects
        if (isCrit) {
            // this.addManaFromIllumination(spellKey, logger);
            // // holy shock crits triggers infusion of light
            // if (spellKey === 'HOLY_SHOCK') {
            //     this.setBuffActive('infusionOfLight', true, timestamp, true, logger);
            // }
        }

        eventsToCreate = eventsToCreate.concat(this.handleDmcg(timestamp, spellIndex, logger));

        return [status, errorMessage, offset, eventsToCreate];
    }


    // procs can be eog/soup
    subtractMana(spellKey, timestamp, procs) {
        let baseCostMultiplicativeFactors = {};

        // Chain Heal gets a further 10% discount on mana cost
        let otherMultiplicativeTotal = (spellKey === 'CHAIN_HEAL' && Utility.getKeyBoolean(this._options, '2pT6')) ?
            this._baseOtherMultiplicativeTotal - this.classInfo['manaCostModifiers']['2pT6'] : this._baseOtherMultiplicativeTotal;
        console.log('subtract mana', otherMultiplicativeTotal);

        let baseCostAdditiveFactors = {};
        // // gonna assume that all hpals are wearing libramOfRenewal
        if (spellKey === 'CHAIN_HEAL') {
            baseCostAdditiveFactors['totemOfForestGrowth'] = this.classInfo['manaCostModifiers']['totemOfForestGrowth'];
        }

        // handles soup and eog; if both soup and eog are true, only use soup
        if (Utility.getKeyBoolean(procs, 'soup')) {
            baseCostAdditiveFactors['soup'] = DATA['items']['soup']['proc']['manaReduction'];
        } else if (Utility.getKeyBoolean(procs, 'eog')) {
            baseCostAdditiveFactors['eog'] = DATA['items']['eog']['proc']['manaReduction'];
        }
        return this.subtractManaHelper(spellKey, timestamp, baseCostMultiplicativeFactors, baseCostAdditiveFactors, otherMultiplicativeTotal);
    }

    // addManaFromIllumination(spellKey, logger=null) {
    //     let baseManaCost = this.classInfo['spells'].find((_spell) => _spell['key'] === spellKey)['baseManaCost'];
    //     let amount = Math.floor(baseManaCost * 0.3);
        
    //     if (typeof this._statistics['illumination'] === 'undefined') {
    //         this._statistics['illumination'] = {};
    //     }
    //     if (!(spellKey in this._statistics['illumination'])) {
    //         this._statistics['illumination'][spellKey] = 0;
    //     }
    //     this._statistics['illumination'][spellKey] += amount;
    //     return this.addManaHelper(amount, 'illumination', logger);
    // }


}

module.exports = Shaman;