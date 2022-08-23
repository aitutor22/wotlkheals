
const BasePlayer = require('./basePlayer');
const DATA = require('./gamevalues');
const Utility = require('../common/utilities');


// methods that must be implemented by all player class
// subtractMana

// kiv -> have we implemented function that checks avaialbility of spells and cds?

class Shaman extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(options, rng, thresholdItemsToCreate, maxMinsToOOM) {
        super('shaman', options, rng, thresholdItemsToCreate, maxMinsToOOM);

        // if (!this._options['2pT7'] && this._options['4pT7']) {
        //     throw new Error('4PT7 was selected but not 2PT7');
        // }

        this._otherMP5 = options['mp5FromGearAndRaidBuffs'];
        // this._otherMultiplicativeTotal = 1;
        // // glyph of SOW reduces healing cost by 5%; note that we don't put 4pt7 here as it only affects HL
        // this._baseOtherMultiplicativeTotal = Utility.getKeyBoolean(this._options, 'glyphSOW') ? (1 - this.classInfo['manaCostModifiers']['glyphSOW']) : 1;



        // // removes Divine Illumination depending on user input
        // if (!this._options['manaOptions']['divineIllumination']) {
        //     let divineIlluminationIndex = options['manaCooldowns'].findIndex((entry) => entry['key'] === 'DIVINE_ILLUMINATION');
        //     options['manaCooldowns'].splice(divineIlluminationIndex, 1);
        // }        
        // this.initialiseManaCooldowns(options['manaCooldowns']);

        // // filters out holyShock if cpm is set to 0
        // if (this._options['cpm']['HOLY_SHOCK'] === 0) {
        //     this._spells = this._spells.filter((_spell) => _spell['key'] !== 'HOLY_SHOCK');
        // } else {
        //     // otherwise change cooldown according to cpm
        //     this._spells.find((_spell) => _spell['key'] === 'HOLY_SHOCK')['cooldown'] = 60 / this._options['cpm']['HOLY_SHOCK'];
        // }
    }

    // majority of spell selection is done in basePlayer's selectSpellHelper
    // the only logic we want to add is if infusion of light is active, always cast Holy Light unless CPM is set to 0
    selectSpell(timestamp, spellIndex) {
        // let overrideSpellSelection = this.isBuffActive('infusionOfLight') && this._options['cpm']['HOLY_LIGHT'] > 0 
        //     ? 'HOLY_LIGHT' : '';
        return this.selectSpellHelper(timestamp, spellIndex);
    }

    // should eventually support wings
    // reduces healing by half when divinePlea is active
    calculateHealing(spellKey, isCrit, isDivinePleaActive=false) {
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
        // if (isDivinePleaActive) {
        //     // calculateHealingHelper does  amount x (1 + val); so for divine plea, we need to pay in -0.5
        //     multiplicativeFactors.push({'divinePlea': -DATA['manaCooldowns']['DIVINE_PLEA']['healingPenalty']})
        // }
        return Math.floor(this.calculateHealingHelper(spellKey, {}, multiplicativeFactors, isCrit));
    }

    // selectSpell and castSpell work differently
    // selectSpell (in basePlayer) selects a spell given spellIndex, and returns the spell
    // castSpell is run when the event loop receves the spellcast event, and we determine if the spell is a crit, or has other procs
    // one might wonder might we don't just cast the spell directly after selecting it. 
    // this is because there could be events in between like mana ticks and/or buffs expiring (like dmcg)
    castSpell(spellKey, timestamp, spellIndex, logger) {
        // if (this._validSpells.indexOf(spellKey) === -1) throw new Error('other spells not handled yet');

        // let originalMana = this._currentMana;

        // // player.add_spellcast_to_statistics(event._name, event._is_crit, event._is_soup_proc, event._is_eog_proc)
        // let procs = {},
        //     eventsToCreate = [];
        // let status, manaUsed, currentMana, errorMessage, offset, isCrit, msg, modifiedCritChance, sanctifiedLightCritChance, amountHealed;

        // // checks for soup, and eog procs
        // // holy light has more hits; all other spells have 2 hits (due to beacon)
        // for (let _key of ['soup', 'eog']) {
        //     if (this._options['trinkets'].indexOf(_key) > -1) {
        //         procs[_key] = this.isSoupEogProc(_key === 'soup', spellIndex, spellKey === 'HOLY_LIGHT' ? this._numHitsPerHolyLight : 2);
        //     };
        // }

        // // 6% crit bonus from sanctified light for HL and HS only
        // sanctifiedLightCritChance = ['HOLY_LIGHT', 'HOLY_SHOCK'].indexOf(spellKey) > -1 ? this.classInfo['sanctifiedLightCritChanceModifier'] : 0;
        // modifiedCritChance = this.critChance + sanctifiedLightCritChance;
        // // 10% additional crit chance to holy shock from 2pT7
        // if (spellKey === 'HOLY_SHOCK' && this._options['2pT7']) {
        //     modifiedCritChance += 0.1
        // } 
        // // infusion of lights adds 20% crit chance to holy light
        // if (spellKey === 'HOLY_LIGHT' && this.isBuffActive('infusionOfLight')) {
        //     this.setBuffActive('infusionOfLight', false, timestamp, true, logger);
        //     modifiedCritChance += 0.2
        // }

        // let statMsg = '';
        // statMsg += `Crit Chance: ${Utility.roundDp(modifiedCritChance * 100, 1)}% ; `;
        // statMsg += `Spellpower: ${this.spellPower}`;
        // logger.log(statMsg, 3);

        // // all pally spells have 1 chance to crit (beacon just mirrors the spell cast)
        // isCrit = this.checkProcHelper('crit', spellIndex, 1, modifiedCritChance);

        // amountHealed = this.calculateHealing(spellKey, isCrit, this.isBuffActive('divinePlea'));
        // [status, manaUsed, currentMana, errorMessage] = this.subtractMana(spellKey, timestamp, procs);

        // // player oom
        // if (status === 0) {
        //     return [status, errorMessage, 0, eventsToCreate];
        // }

        // // BE CAREFUL WHERE THIS CODE GOES - if you put it before the oom check, will add 1 to final tally
        // this.addSpellCastToStatistics(spellKey, isCrit);
        // if (procs['soup']) {
        //     logger.log('🥣🥣🥣 SOUP 🥣🥣🥣', 2);
        // } else if (procs['eog']) {
        //     logger.log('👀 👀 EOG 👀 👀', 2);
        // }

        // msg = isCrit ? `${timestamp}s: **CRIT ${spellKey} for ${amountHealed}** (spent ${originalMana - currentMana} mana)` :
        //     `${timestamp}s: Casted ${spellKey} for ${amountHealed} (spent ${originalMana - currentMana} mana)`;
        // logger.log(msg, 2);

        // // if we cast an instant spell, we need to account for it using the gcd (modified by haste factor)
        // offset = this._instantSpells.indexOf(spellKey) > -1 ? this._gcd : 0;
        // // console.log(offset)

        // // after spell is casted, add effects
        // if (isCrit) {
        //     this.addManaFromIllumination(spellKey, logger);
        //     // holy shock crits triggers infusion of light
        //     if (spellKey === 'HOLY_SHOCK') {
        //         this.setBuffActive('infusionOfLight', true, timestamp, true, logger);
        //     }
        // }

        // // if dmcg is worn, see if it can proc
        // if ((typeof this._buffs['dmcg'] !== 'undefined') && this._buffs['dmcg']['availableForUse']) {
        //     let isDmcg = this.checkProcHelper('dmcg', spellIndex, 1, DATA['items']['dmcg']['proc']['chance']);
        //     if (isDmcg) {
        //         this.setBuffActive('dmcg', true, timestamp, false, logger);
        //         eventsToCreate.push({timestamp: timestamp + DATA['items']['dmcg']['proc']['duration'], eventType: 'BUFF_EXPIRE', subEvent: 'dmcg'});
        //     }
        // }

        // // checks if sow proc from holy shock
        // if (spellKey === 'HOLY_SHOCK') this.checkForAndHandleSoWProc(timestamp, spellIndex, logger, 'normal');

        // return [status, errorMessage, offset, eventsToCreate];
    }

    // procs can be eog/soup
    subtractMana(spellKey, timestamp, procs) {
        // // 50% mana reduction when divine illuminatin is active
        // let baseCostMultiplicativeFactors = this.isBuffActive('DIVINE_ILLUMINATION') ? {'divineIllumination': 0.5} : {};

        // // Holy Light gets a further 5% discount on mana cost
        // let otherMultiplicativeTotal = (spellKey === 'HOLY_LIGHT' && getKeyBoolean(this._options, '4pT7')) ?
        //     this._baseOtherMultiplicativeTotal - this.classInfo['manaCostModifiers']['4pT7'] : this._baseOtherMultiplicativeTotal;

        // let baseCostAdditiveFactors = {};
        // // gonna assume that all hpals are wearing libramOfRenewal
        // if (spellKey === 'HOLY_LIGHT') {
        //     baseCostAdditiveFactors['libramOfRenewal'] = this.classInfo['manaCostModifiers']['libramOfRenewal'];
        // }

        // // handles soup and eog; if both soup and eog are true, only use soup
        // if (Utility.getKeyBoolean(procs, 'soup')) {
        //     baseCostAdditiveFactors['soup'] = DATA['items']['soup']['proc']['manaReduction'];
        // } else if (Utility.getKeyBoolean(procs, 'eog')) {
        //     baseCostAdditiveFactors['eog'] = DATA['items']['eog']['proc']['manaReduction'];
        // }
        // return this.subtractManaHelper(spellKey, timestamp, baseCostMultiplicativeFactors, baseCostAdditiveFactors, otherMultiplicativeTotal);
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