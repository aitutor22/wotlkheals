
const BasePlayer = require('./basePlayer');
const HotTracker = require('./hottracker');
const DATA = require('./gamevalues');
const Utility = require('../common/utilities');

// methods that must be implemented by all player class
// subtractMana

/*
    Some notes about Shaman
    - The initial cast of earthshield and each subsequent hit can proc soup (note that each ES hit can also crit)
    - This is different from Sacred Shield - which can proc soup only on cast, and all subsequent hits cannot proc soup (cannot crit too)
*/


// SUPER IMPORTANT: chain heal and otherspells are handled in separate functions
// thus, BE VERY CAREFUL AND MAKE SURE to consider that effects are handled in both places
// for instance, this.checkHandleProcsOnCritWithICD(timestamp, spellIndex, logger) needs to be in both functions

// IMPLEMENTATION NOTE FOR HEALING_WAVE INTERACTION WITH TIDAL WAVES
// todo: improve when free
// temporary hack: we divide baseCastTime in gamevalues.js by 1.3 to simulate cast time reduction
// tidal wave stacks will be consumed as per usual when healing wave is cast
// thus, main problem is if TW stack is not up in system, the HW will still be casted 30% faster

class Shaman extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(options, rng, thresholdItemsToCreate, maxMinsToOOM) {
        // checks if user wants us to include bloodlust
        let spellsToExclude = [];
        if (!options['bloodlust']) spellsToExclude.push('BLOODLUST');

        super('shaman', options, rng, thresholdItemsToCreate, maxMinsToOOM, spellsToExclude);

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

        // adds earthliving weapon to spellpower
        this._baseSpellPower += this.classInfo['earthliving']['bonusSpellPower'];
        // EL glyph adds 5% chance
        this._earthlivingProcChance = this.classInfo['earthliving']['procChance'] +
            (options['finalGlyph'] === 'earthliving' ? 0.05 : 0);

        // tidalFocus reduces healing cost by 5%; note that we don't put 2pt6 here as it only affects CHAIN_HEAL
        this._baseOtherMultiplicativeTotal = Utility.getKeyBoolean(this._options['talents'], 'tidalFocus') ? (1 - this.classInfo['manaCostModifiers']['tidalFocus']) : 1;
        this._numchainHealHits = Math.floor(this._options['chainHealHits']);
        this.initialiseManaCooldowns(options['manaCooldowns']);
        // tracks ES for crit
        this._earthShieldHitIndex = 0;

        this._statistics['raidBuffedStats'] = {
            'int': this._buffedInt,
            'manaPool': this.maxMana,
            'spellPower': this._baseSpellPower,
            'critChance': this.critChance,
            'mp5': this._otherMP5,
        };
    }

    createRiptideTracker(eventHeap) {
        this._riptideTracker = new HotTracker(eventHeap, 'shaman');
    }

    // due to water shield being more complicated, we overwrite parent function
    // converts mp5 to a mp2 tick value
    addManaRegenFromReplenishmentAndOtherMP5(logger=null, timestamp=null) {
        // we could use a cached value, but DMCG increases max mana pool, so for time being, we recalculate each time we call this
        const replenishmentTick = (this.maxMana * DATA['constants']['replenishment'] / 5 * 2 * this._options['manaOptions']['replenishmentUptime']);
        const otherMP5Tick = (this._otherMP5 / 5 * 2);
        const tickAmount = Math.floor(replenishmentTick + otherMP5Tick + this._waterShieldBaseBaseTick);
        // since replenishment might tick outside spellcast, we print timestamp
        if (logger) logger.log(`${timestamp}s: Gained ${tickAmount} from mana tick`, 1);

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

    // if spellKey is Chain heal, requires options to have chainHealHitIndex, which can be 0, 1, 2 or 3
    // reduces the chain heal bounce accordingly
    calculateHealing(spellKey, isCrit, options=null) {
        let amount = 0,
            multiplicativeFactors = [],
            coefficientAddition = 0

        if (spellKey === 'CHAIN_HEAL') {
            if (typeof options['chainHealHitIndex'] === 'undefined') {
                throw new Error('Missing key: chainHealHitIndex');
            }
            // note: when we pass chainHealFactor into calculateHealingFactor, we will automatically +1 to it
            // hence need to subtract by 1 here
            let chainHealFactor = this.classInfo['chainHealBounceFactor'][options['chainHealHitIndex']] - 1;
            multiplicativeFactors = [{purification: 0.1}, {improvedChainHeal: 0.2}, {'chainHealFactor': chainHealFactor}];

            // consuming riptide adds 25% healing to all
            if (options['riptideConsumed']) multiplicativeFactors.push({riptide: 0.25});

            // 4PT7 increases chain heal and healing wave healing by 5%
            if (Utility.getKeyBoolean(this._options, '4pT7')) {
                multiplicativeFactors.push({'4pT7': 0.05});
            }
        } else if (spellKey === 'LESSER_HEALING_WAVE') {
            multiplicativeFactors = [{purification: 0.1}];
            // tidalWaves increases LHW coefficient by 0.1
            coefficientAddition = this.isStackActive('tidalWaves') ? this.classInfo['tidalWaves']['bonusLHWHealCoefficient'] : 0;

            // glpyh - Your Lesser Healing Wave heals for 20% more if the target is also affected by Earth Shield.
            if (this._options['finalGlyph'] === 'lesserHealingWave') {
                let glpyhLHWBonus = this._options['lesserHealingWaveCastPercentageOnEarthShield'] / 100 * 0.2;
                multiplicativeFactors.push({'glyphLesserHealingWave': glpyhLHWBonus});
            }
        } else if (spellKey === 'HEALING_WAVE') {
            // tidalWaves increases HW coefficient by 0.2
            coefficientAddition = this.isStackActive('tidalWaves') ? this.classInfo['tidalWaves']['bonusHWHealCoefficient'] : 0;
            multiplicativeFactors = [{purification: 0.1}, {healingWay: 0.25}];
        }  else if (spellKey === 'EARTH_SHIELD') {
            multiplicativeFactors = [{'improvedShields': 0.15, 'improvedEarthShield': 0.1}, {'glyph': 0.2}, {'purification': 0.1}];
        }  else if (spellKey === 'RIPTIDE') {
            // riptide can refer to either the direct heal portion or the hot portion
            // if it is the hot_portion, instead of passing in RIPTIDE, we pass in RIPTIDE|HOT to calculateHealingHelper
            if (options && typeof options['isHotTick'] !== 'undefined' && options['isHotTick']) {
                spellKey = 'RIPTIDE|HOT';
            }
            multiplicativeFactors = [{purification: 0.1}];
        } else {
            throw new Error('Unknown spellkey: ' + spellKey);
        }
        return Math.floor(this.calculateHealingHelper(spellKey, {}, multiplicativeFactors, isCrit, coefficientAddition));
    }

    calculateHoT(spellKey, timestamp, logger) {
        let isCrit = false, //most hots cannot crit, except for earth shield
            options = {};
        if (spellKey === 'EARTH_SHIELD') {
            isCrit = this.checkProcHelper('earthShieldCrit', this._earthShieldHitIndex, 1, this.critChance);

            // since each earth shield hit can crit, we record separately
            this.addHitsToStatistics(spellKey, Number(isCrit));
            this._earthShieldHitIndex++;
        } else if (spellKey === 'RIPTIDE') {
            // this is only required for riptide, because it has both a direct heal and a hot
            options['isHotTick'] = true;
        }
        let amountHealed = this.calculateHealing(spellKey, isCrit, options);
        let msg = isCrit ? `**${timestamp}s: ${spellKey} CRIT for ${amountHealed}**` :
            `${timestamp}s: ${spellKey} ticked for ${amountHealed}`;
        logger.log(msg, 2);
    }

    // chain heal functions quite differently from other spells due to multiple hits
    // since EoG/Soup can only proc once, we don't need to handle here
    // but water shield proc needs to be handled separatedly
    // returns a boolean indicating whether it was crit
    castChainHealHelper(spellKey, timestamp, spellIndex, critChance, logger) {
        let offset = 0, // since chain heal is not an instant, no offset
            numChainHealHits = this._numchainHealHits,
            msg;

        // check if riptide is up. if so, add 25% to chain heal
        let riptideConsumed = this._riptideTracker.consume('RIPTIDE', timestamp);
        if (riptideConsumed) {
            logger.log('Consuming riptide', 2);
        }

        // to be in for loop
        // we loop through each of the hits and checks healing and crit separately
        // this behaves differently from beacon/glyph of holy light because for those, they can't crit separately
        for (let chainHealHitIndex = 0; chainHealHitIndex < numChainHealHits; chainHealHitIndex++) {
            let isCrit = this.checkChainHealProcHelper('crit', spellIndex, chainHealHitIndex, critChance)
            let amountHealed = this.calculateHealing(spellKey, isCrit, {chainHealHitIndex: chainHealHitIndex, riptideConsumed: riptideConsumed});

            msg = isCrit ? `${timestamp}s: **CRIT ${spellKey} for ${amountHealed}**` :
                    `${timestamp}s: Casted ${spellKey} for ${amountHealed}`;

            logger.log(msg, 2);
            this.checkForEarthliving(spellKey, spellIndex, logger, chainHealHitIndex);
            // after spell is casted, add effects
            if (isCrit) {
                this.checkAndAddManaFromWaterShieldProc(spellKey, spellIndex, logger, chainHealHitIndex, timestamp);
                let hackedSpellIndex = (spellIndex * 4 + chainHealHitIndex); // super hackish way to ensure each chain heal hit is handled separately
                this.checkHandleProcsOnCritWithICD(timestamp, hackedSpellIndex, logger);
            }
            // since chain heal has multiple hits, we need to record the hits separately
            this.addHitsToStatistics('CHAIN_HEAL', Number(isCrit));
        }
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
            eventsToCreate = [],
            spellInfo = this.classInfo['spells'].find(_spell => _spell['key'] === spellKey);
        let status, manaUsed, currentMana, errorMessage, offset, isCrit, msg, modifiedCritChance, amountHealed;

        if (spellInfo['category'] === 'others') {
            return this.castOtherSpell(spellKey, timestamp, spellIndex, logger);
        }

        // for chain heal, we assume each hit is separate, and can crit and proc WS separately
        // however, we also assume that there can be only max of 1 eog/soup proc
        // checks for soup, and eog procs
        // chain heal has more hits; all other spells have 1 hit
        if (spellInfo['healingSpell']) {
            procs = this.getSoupEogProcs(spellIndex, spellKey === 'CHAIN_HEAL' ? this._numchainHealHits : 1);
        }
        modifiedCritChance = this.critChance;

        if (this.isStackActive('tidalWaves') && spellKey === 'LESSER_HEALING_WAVE') {
            // 25% additional crit chance to LHW if Tidal Waves is up
            modifiedCritChance += this.classInfo['tidalWaves']['lhwCritChance'];
        }

        // // infusion of lights adds 20% crit chance to holy light
        // if (spellKey === 'HOLY_LIGHT' && this.isBuffActive('infusionOfLight')) {
        //     this.setBuffActive('infusionOfLight', false, timestamp, true, logger);
        //     modifiedCritChance += 0.2
        // }

        let statMsg = '';
        statMsg += `Crit Chance: ${Utility.roundDp(modifiedCritChance * 100, 1)}% ; `;
        statMsg += `Spellpower: ${this.spellPower}`;
        logger.log(statMsg, 3);

        // for chain heal, we handle all of this in a separate function
        if (spellKey !== 'CHAIN_HEAL') {
            // NOTE: Earthshield can crit, but when we cast spell here, it merely applies the spell and thus earth shield is 0 healing
            isCrit = spellInfo['category'].startsWith('directHeal') ? this.checkProcHelper('crit', spellIndex, 1, modifiedCritChance) : false;
            // || spellInfo['category'] === 'directHealWithHot'
            // directHeals should just calculate actual healing amount, for hots, just cast the spell
            // for this line, we search for both directHeal and directHealWithHot
            if (spellInfo['category'].startsWith('directHeal')) {
                amountHealed = this.calculateHealing(spellKey, isCrit);
            } 

            if (spellInfo['category'] === 'hot' || spellInfo['category'] === 'directHealWithHot') {
                eventsToCreate.push({
                    timestamp: timestamp, 
                    eventType: 'INITIALIZE_HOT_EVENTS',
                    // we want to pass in the spellIndex for the hot, so if need be, we can remove it (e.g. riptide ticks consumed)
                    subEvent: `${spellInfo['key']}|${spellIndex}`,
                })
            }
        }
        [status, manaUsed, currentMana, errorMessage] = this.subtractMana(spellKey, timestamp, procs);

        // player oom
        if (status === 0) {
            return [status, errorMessage, 0, eventsToCreate];
        }

        if (procs['soup']) {
            logger.log('🥣🥣🥣 SOUP 🥣🥣🥣', 1);
        } else if (procs['eog']) {
            logger.log('👀 👀 EOG 👀 👀', 1);
        }

        // casting CH or riptide should add tidal waves
        if (spellKey === 'CHAIN_HEAL' || spellKey === 'RIPTIDE') {
            this.modifyStacks('tidalWaves', 'set', this.classInfo['tidalWaves']['maxStacks'], timestamp, logger);
        } else if (spellKey === 'LESSER_HEALING_WAVE' || spellKey === 'HEALING_WAVE') {
            this.modifyStacks('tidalWaves', 'decrement', 1, timestamp, logger);
        }

        // adds riptide to tracker for chain heal consumption purposes
        if (spellKey === 'RIPTIDE') {
            this._riptideTracker.trackHot('RIPTIDE', spellIndex, timestamp, this._options['minEarthShieldTicksBeforeConsuming']);
        }

        // for chainHeal, we handle this separately because the behaviour is more complex
        if (spellKey === 'CHAIN_HEAL') {
            logger.log(`Spent ${originalMana - currentMana} mana on CHAIN_HEAL`, 2);
            this.castChainHealHelper(spellKey, timestamp, spellIndex, modifiedCritChance, logger);
            // NOTE: WE DO NOT PASS IN CRIT FOR CHAINHEAL
            this.addSpellCastToStatistics(spellKey, -1);
            // chain heal has 0 offset as it's not instant spell
            return [status, errorMessage, 0, eventsToCreate];
        }

        // BE CAREFUL WHERE THIS CODE GOES - if you put it before the oom check, will add 1 to final tally
        // this is for non-chain heal spells 
        if (spellKey === 'EARTH_SHIELD') {
            // for earthshield, don't add to hits as we will handle separately
            this.addSpellCastToStatistics(spellKey, -1);    
        } else {
            this.addSpellCastToStatistics(spellKey, Number(isCrit));
        }
        

        if (spellInfo['category'].startsWith('directHeal')) {
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
            if (this.classInfo['ancestralAwakening']['spells'].indexOf(spellKey) > -1) {
                let ancestralAwakeningAmount = Math.floor(amountHealed * this.classInfo['ancestralAwakening']['value']);
                logger.log(`Ancestral Awakening (${spellKey}) healed for ${ancestralAwakeningAmount}`, 2);
                // we count the AA healing under the spell that casted it
                this.addHealingToStatistics(spellKey, ancestralAwakeningAmount);
            }
            this.checkHandleProcsOnCritWithICD(timestamp, spellIndex, logger);
        }

        this.checkForEarthliving(spellKey, spellIndex, logger);
        return [status, errorMessage, offset, eventsToCreate];
    }


    // procs can be eog/soup
    subtractMana(spellKey, timestamp, procs) {
        let baseCostMultiplicativeFactors = {},
            otherMultiplicativeTotal;

        // unaffected by tidal focus
        if (spellKey === 'BLOODLUST') {
            otherMultiplicativeTotal = 1;
        }

        // Chain Heal gets a further 10% discount on mana cost
        else if (spellKey === 'CHAIN_HEAL' && Utility.getKeyBoolean(this._options, '2pT6')) {
            otherMultiplicativeTotal = this._baseOtherMultiplicativeTotal - this.classInfo['manaCostModifiers']['2pT6'];
        } else {
            otherMultiplicativeTotal = this._baseOtherMultiplicativeTotal;
        }

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
        return this.addManaHelper(Math.floor(amount), 'waterShieldProc', logger, timestamp);
    }

    checkForEarthliving(spellKey, spellIndex, logger=null, chainHealHitIndex=0) {
        let isProc = spellKey !== 'CHAIN_HEAL' ? this.checkProcHelper('earthliving', spellIndex, 1, this._earthlivingProcChance) :
            this.checkChainHealProcHelper('earthliving', spellIndex, chainHealHitIndex, this._earthlivingProcChance);

        if (!isProc) return;
        let earthlivingInfo = this.classInfo['earthliving'];
        let earthlivingAmount = Math.floor((earthlivingInfo['baseHeal'] + this.spellPower * earthlivingInfo['coefficient']) * (1 + earthlivingInfo['multiplier']));
        logger.log(`Earthliving (${spellKey}) healed for ${earthlivingAmount}`, 2);
        // we count the earthliving healing under the spell that casted it
        this.addHealingToStatistics(spellKey, earthlivingAmount);
    }


}

module.exports = Shaman;