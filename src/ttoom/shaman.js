
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

        if (!this._options['2pT7'] && this._options['4pT7']) {
            throw new Error('4PT7 was selected but not 2PT7');
        }
        
        // we calculate how much mp2 water shield  is -> note that the base value is in mp5 while proc value is in absolute terms
        // thus need to divide differently to get denominator
        this._waterShieldBaseBaseTick = this.classInfo['waterShield']['baseMp5'] / 5 * 2 + 
            options['manaOptions']['waterShieldProcsPerMinFromDamage'] * this.classInfo['waterShield']['procValue'] / 30;

        // 2PT7 increases water shield by 10%
        if (Utility.getKeyBoolean(this._options, '2pT7')) {
            this._waterShieldBaseBaseTick *= 1.1;
        }

        this._otherMultiplicativeTotal = 1;
        // tidalFocus reduces healing cost by 5%; note that we don't put 2pt6 here as it only affects CHAIN_HEAL
        this._baseOtherMultiplicativeTotal = Utility.getKeyBoolean(this._options['talents'], 'tidalFocus') ? (1 - this.classInfo['manaCostModifiers']['tidalFocus']) : 1;
        this._numchainHealHits = Math.floor(this._options['chainHealHits']);
   
        this.initialiseManaCooldowns(options['manaCooldowns']);
    }

    // due to water shield being more complicated, we overwrite parent function
    // converts mp5 to a mp2 tick value
    addManaRegenFromReplenishmentAndOtherMP5(logger=null, timestamp=null) {
        // we could use a cached value, but DMCG increases max mana pool, so for time being, we recalculate each time we call this
        const replenishmentTick = (this.maxMana * DATA['constants']['replenishment'] / 5 * 2 * this._options['manaOptions']['replenishmentUptime']);
        const otherMP5Tick = (this._otherMP5 / 5 * 2);
        const tickAmount = Math.floor(replenishmentTick + otherMP5Tick + this._waterShieldBaseBaseTick);
        // since replenishment might tick outside spellcast, we print timestamp
        if (logger) logger.log(`${timestamp}s: Gained ${tickAmount} from mana tick`, 2);

        // we record the ticks from replenishment, water shield and othermp5 separately; need to ensure we don't lose values due to floor function
        this.addManaHelper(Math.floor(replenishmentTick), 'Replenishment');
        this.addManaHelper(Math.floor(this._waterShieldBaseBaseTick), 'Water Shield Base');
        this.addManaHelper(tickAmount - Math.floor(replenishmentTick) - Math.floor(this._waterShieldBaseBaseTick), 'otherMP5');
    }

    // chain heal is a bit funky with how it work since it's multiple hits off the spellIndex
    // each spell should have a separate proc, and we use a special proc function to handle
    // for each chain heal cast, we pull out an array of 4 random numbers, and select the appropriate number based on chainHealHitIndex
    checkChainHealProcHelper(key, spellIndex, chainHealHitIndex, procChance) {
        let arr = this._rngThresholds[key].slice(spellIndex * 4, (spellIndex + 1) * 4);
        if (arr.length === 0) throw new Error('ran out of rng numbers for ' + key);
        return arr[chainHealHitIndex] < procChance;
    }

    // majority of spell selection is done in basePlayer's selectSpellHelper
    // the only logic we want to add is if infusion of light is active, always cast Holy Light unless CPM is set to 0
    selectSpell(timestamp, spellIndex) {
        // let overrideSpellSelection = this.isBuffActive('infusionOfLight') && this._options['cpm']['HOLY_LIGHT'] > 0 
        //     ? 'HOLY_LIGHT' : '';
        return this.selectSpellHelper(timestamp, spellIndex);
    }

    // if spellKey is Chain heal, requires chainHealHitIndex, which can be 0, 1, 2 or 3
    // reduces the chain heal bounce accordingly
    calculateHealing(spellKey, isCrit, chainHealHitIndex=0) {
        let amount = 0,
            multiplicativeFactors = [];

        if (spellKey === 'CHAIN_HEAL') {
            // note: when we pass chainHealFactor into calculateHealingFactor, we will automatically +1 to it
            // hence need to subtract by 1 here
            let chainHealFactor = this.classInfo['chainHealBounceFactor'][chainHealHitIndex] - 1;
            multiplicativeFactors = [{purification: 0.1}, {improvedChainHeal: 0.2}, {'chainHealFactor': chainHealFactor}];
            // 4PT7 increases chain heal and healing wave healing by 5%
            if (Utility.getKeyBoolean(this._options, '4pT7')) {
                multiplicativeFactors.push({'4pT7': 0.05});
            }
        } else if (spellKey === 'LESSER_HEALING_WAVE') {
            multiplicativeFactors = [{purification: 0.1}];
            // glpyh
            // Your Lesser Healing Wave heals for 20% more if the target is also affected by Earth Shield.
            if (Utility.getKeyBoolean(this._options, 'glyphLesserHealingWave')) {
                let glpyhLHWBonus = this._options['lesserHealingWaveCastPercentageOnEarthShield'] / 100 * 0.2;
                multiplicativeFactors.push({'glyphLesserHealingWave': glpyhLHWBonus});
            }
        }
        else {
            throw new Error('Unknown spellkey: ' + spellKey);
        }
        return Math.floor(this.calculateHealingHelper(spellKey, {}, multiplicativeFactors, isCrit));
    }

    // chain heal functions quite differently from other spells due to multiple hits
    // since EoG/Soup can only proc once, we don't need to handle here
    // but water shield proc needs to be handled separatedly
    // returns a boolean indicating whether it was crit
    castChainHealHelper(spellKey, timestamp, spellIndex, critChance, logger) {
        let numCritsTotal = 0, 
            offset = 0, // since chain heal is not an instant, no offset
            numChainHealHits = this._numchainHealHits,
            msg;

        // to be in for loop
        // we loop through each of the hits and checks healing and crit separately
        // this behaves differently from beacon/glyph of holy light because for those, they can't crit separately
        // bug - crit/water shield are all proccing together
        for (let chainHealHitIndex = 0; chainHealHitIndex < numChainHealHits; chainHealHitIndex++) {
            let isCrit = this.checkChainHealProcHelper('crit', spellIndex, chainHealHitIndex, critChance)

            let amountHealed = this.calculateHealing(spellKey, isCrit, chainHealHitIndex);


            msg = isCrit ? `${timestamp}s: **CRIT ${spellKey} for ${amountHealed}**` :
                    `${timestamp}s: Casted ${spellKey} for ${amountHealed}`;

            logger.log(msg, 2);

            // after spell is casted, add effects
            if (isCrit) {
                this.checkAndAddManaFromWaterShieldProc(spellKey, spellIndex, logger, chainHealHitIndex, timestamp);
                numCritsTotal++;
            }
        }
        return numCritsTotal > 0;
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

        // for chain heal, we assume each hit is separate, and can crit and proc WS separately
        // however, we also assume that there can be only max of 1 eog/soup proc
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

        // for chain heal, we handle all of this in a separate function
        if (spellKey !== 'CHAIN_HEAL') {
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
        }
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

        // for chainHeal, we handle this separately because the behaviour is more complex
        if (spellKey === 'CHAIN_HEAL') {
            logger.log(`Spent ${originalMana - currentMana} mana on CHAIN_HEAL`, 2);
            let isChainHealCrit = this.castChainHealHelper(spellKey, timestamp, spellIndex, modifiedCritChance, logger);
            this.addSpellCastToStatistics(spellKey, isChainHealCrit);
            // chain heal has 0 offset as it's not instant spell
            return [status, errorMessage, 0, eventsToCreate];
        }

        // BE CAREFUL WHERE THIS CODE GOES - if you put it before the oom check, will add 1 to final tally
        this.addSpellCastToStatistics(spellKey, isCrit);

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
            this.checkAndAddManaFromWaterShieldProc(spellKey, spellIndex, logger);
            // this.addManaFromIllumination(spellKey, logger);
            // // holy shock crits triggers infusion of light
            // if (spellKey === 'HOLY_SHOCK') {
            //     this.setBuffActive('infusionOfLight', true, timestamp, true, logger);
            // }
        }

        return [status, errorMessage, offset, eventsToCreate];
    }


    // procs can be eog/soup
    subtractMana(spellKey, timestamp, procs) {
        let baseCostMultiplicativeFactors = {};

        // Chain Heal gets a further 10% discount on mana cost
        let otherMultiplicativeTotal = (spellKey === 'CHAIN_HEAL' && Utility.getKeyBoolean(this._options, '2pT6')) ?
            this._baseOtherMultiplicativeTotal - this.classInfo['manaCostModifiers']['2pT6'] : this._baseOtherMultiplicativeTotal;

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

    // given that a spell has crit, check if it then procs water shield
    // if spellKey is CHAIN_HEAL, need to pass in a separate chainHealHitIndex so system can use the specialised chainHealProcHelper
    checkAndAddManaFromWaterShieldProc(spellKey, spellIndex, logger=null, chainHealHitIndex=0, timestamp) {
        let procChance = this.classInfo['waterShield']['chance'][spellKey],
            amount = 0,
            isProc;

        isProc = spellKey !== 'CHAIN_HEAL' ? this.checkProcHelper('waterShield', spellIndex, 1, procChance) :
            this.checkChainHealProcHelper('waterShield', spellIndex, chainHealHitIndex, procChance);

        if (!isProc) return;

        // 2PT7 increases water shield by 10%
        amount = this.classInfo['waterShield']['procValue'] * (Utility.getKeyBoolean(this._options, '2pT7') ? 1.1 : 1);

        if (typeof this._statistics['waterShieldProc'] === 'undefined') {
            this._statistics['waterShieldProc'] = {};
        }
        if (!(spellKey in this._statistics['waterShieldProc'])) {
            this._statistics['waterShieldProc'][spellKey] = 0;
        }
        this._statistics['waterShieldProc'][spellKey] += amount;
        return this.addManaHelper(amount, 'waterShieldProc', logger, timestamp);
    }


}

module.exports = Shaman;