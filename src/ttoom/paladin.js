const BasePlayer = require('./basePlayer');
const DATA = require('./gamevalues');
const Utility = require('../common/utilities');
const SpellQueue = require('./spellqueue');

// helper function - given an object, check if a key exists and whether it is true/false
function getKeyBoolean(obj, key) {
    return (obj && typeof obj[key] !== 'undefined') && obj[key];
}

// methods that must be implemented by all player class
// subtractMana

// kiv -> have we implemented function that checks avaialbility of spells and cds?

class Paladin extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(options, rng, thresholdItemsToCreate, maxMinsToOOM) {
        super('paladin', options, rng, thresholdItemsToCreate, maxMinsToOOM);

        if (!this._options['2pT7'] && this._options['4pT7']) {
            throw new Error('4PT7 was selected but not 2PT7');
        }

        // calculates SoW chances
        let normalHitRate = 1 - this.classInfo['sow']['missChance'] - this.classInfo['sow']['dodgeChance'] +
            this.classInfo['sow']['improvementInHitChancePerPointInEnglightenedJudgements'] * options['talents']['enlightenedJudgements']
        let judgementHitRate = normalHitRate + this.classInfo['sow']['dodgeChance']; //judgement can't be dodged
        this._sowProcChace = {
            'normal': this.classInfo['sow']['chance'] * normalHitRate,
            'judgement': this.classInfo['sow']['chance'] * judgementHitRate,
        }

        // if beacon is selected, add 30s to cooldown
        if (options['finalGlyph'] === 'beacon') {
            this._spells.find((_spell) => _spell.key === 'BEACON_OF_LIGHT')['cooldown'] += this.classInfo['glyphEffects']['beacon'];
        }

        // glyph of SOW reduces healing cost by 5%; note that we don't put 4pt7 here as it only affects HL
        this._baseOtherMultiplicativeTotal = Utility.getKeyBoolean(this._options, 'glyphSOW') ? (1 - this.classInfo['manaCostModifiers']['glyphSOW']) : 1;
        this._numHitsPerHolyLight = Math.floor(2 + this._options['glyphHolyLightHits']) // beacon + original target + glpyh
   
        this.initialiseManaCooldowns(options['manaCooldowns']);

        let loh = this._manaCooldowns.find((_cd) => _cd['key'] === 'LAY_ON_HANDS');
        if (typeof loh !== 'undefined') {
            loh['value'] = options['finalGlyph'] === 'divinity' ? 7800 : 1950;
        }
        // console.log(this._manaCooldowns);
        // do this here rather than end of basePlayer, as we might make changes to some fields while running the constructor of the specific player class
        this._statistics['raidBuffedStats'] = {
            'int': this._buffedInt,
            'manaPool': this.maxMana,
            'spellPower': this._baseSpellPower,
            'critChance': this.critChance,
            'mp5': this._otherMP5,
        };
    }


    // we overwrite createSpellQueue function for paladin as it's more complicated
    // if user selects melee weaving, then we need to change our entire approach
    // usually we don't consider haste, and just adjust cast times based on the user input cpm
    // however for melee weaving, we calculate the amount of downtime for melee based on haste
    // and work in MELEE_SWING, which is a fake spell that costs 0 mana and can proc sow
    createSpellQueue(rng) {
        // if user hasn't select melee weave, we can just use the parent function
        if (!this._options['meleeWeave']) return super.createSpellQueue(rng);

        let castProfile = {},
            totalTimeUsed = 0,
            freeTimeForMelee,
            spellInfo;

        // paladins get a 30% bonus
        let meleeHasteRatingConversion = DATA['constants']['hasteRatingConversion']  / (1 + DATA['constants']['meleeHasteBonusFactor']);
        // melee hit haste for SoW
        this._meleeHaste = 1 + (this._options['statsBeforeTrinket']['hasteRating'] / meleeHasteRatingConversion) / 100;
        this._meleeHaste *= (1.20 * 1.03 * 1.15); //icy talon, moonkin, jotp

        // we only want want to include spells with non-cd in spellqueue
        // cooldown spells are automatically casted on cooldown
        for (let key in this._options['cpm']) {
            spellInfo = this.classInfo['spells'].find(_spell => _spell['key'] === key)
            if (spellInfo['cooldown'] === 0) {
                castProfile[key] = this._options['cpm'][key];
            }
            totalTimeUsed += this._options['cpm'][key] * Math.max(spellInfo['baseCastTime'], DATA['constants']['baseGCD']);
        }
        this._gcd = Math.max(1, this._gcd / this._haste); // gcd cannot go below 1s

        totalTimeUsed /= this._haste;
        freeTimeForMelee = 60 - totalTimeUsed;
        // we first find how many melees in perfect condition
        // then we reduce according to melee weaving, and then inflat the melee cast time
        // this is to ensure that in low melee weaving periods, the other spells aren't inflated
        let baseMeleeCastTime = this._spells.find((_spell) => _spell['key'] === 'MELEE_SWING')['baseCastTime']
        let numMeleesPerfectCondition = freeTimeForMelee / (baseMeleeCastTime / this._meleeHaste);
        // we also enforce that there must be at least 1 melee
        let realNumMelees = Math.max(1, Math.floor(numMeleesPerfectCondition * this._options['meleeWeaveUptime'] / 100));
        
        for (let i in this._spells) {
            if (this._spells[i]['key'] !== 'MELEE_SWING') {
                this._spells[i]['castTime'] = this._spells[i]['baseCastTime'] / this._haste;
                // spell cast cannot go below gcd
                if (!this._spells[i]['instant'] && this._spells[i]['castTime'] < 1 && this._spells[i]['castTime'] > 0) {
                    this._spells[i]['castTime'] = 1;
                }
            } else {
                if (realNumMelees === 0) continue;
                this._spells[i]['castTime'] = freeTimeForMelee / realNumMelees;
            }
        }
        
        castProfile['MELEE_SWING'] = realNumMelees;
        return new SpellQueue(castProfile, rng);
    }

    // majority of spell selection is done in basePlayer's selectSpellHelper
    // the only logic we want to add is if infusion of light is active, always cast Holy Light unless CPM is set to 0
    selectSpell(timestamp, spellIndex) {
        let overrideSpellSelection = this.isBuffActive('infusionOfLight') && this._options['cpm']['HOLY_LIGHT'] > 0 
            ? 'HOLY_LIGHT' : '';
        return this.selectSpellHelper(timestamp, spellIndex, overrideSpellSelection);
    }

    // should eventually support wings
    // reduces healing by half when divinePlea is active
    calculateHealing(spellKey, isCrit, isDivinePleaActive=false) {
        let amount = 0,
            multiplicativeFactors = [],
            glyphHLFactor = this._options['glyphHolyLightHits'] * this.classInfo['glyphHolyLightHitHealingPercentage'];

        if (spellKey === 'HOLY_LIGHT') {
            multiplicativeFactors = [{'healingLight': 0.12}, {'divinity': 0.05}, {'beacon': 1, 'glpyh': glyphHLFactor}];
        } else if (spellKey === 'FLASH_OF_LIGHT' || spellKey === 'HOLY_SHOCK') {
            multiplicativeFactors = [{'healingLight': 0.12}, {'divinity': 0.05}, {'beacon': 1}];
        } else if (spellKey === 'SACRED_SHIELD') {
            multiplicativeFactors = [{'divineGuardian': 0.2}];
        }
        else {
            throw new Error('Unknown spellkey: ' + spellKey);
        }

        // sacred shield is unaffected by plea
        if (isDivinePleaActive && spellKey !== 'SACRED_SHIELD') {
            // calculateHealingHelper does  amount x (1 + val); so for divine plea, we need to pay in -0.5
            multiplicativeFactors.push({'divinePlea': -DATA['manaCooldowns']['DIVINE_PLEA']['healingPenalty']})
        }
        return Math.floor(this.calculateHealingHelper(spellKey, {}, multiplicativeFactors, isCrit));
    }

    calculateHoT(spellKey, timestamp, logger) {
        let amountHealed = this.calculateHealing(spellKey, false, this.isBuffActive('divinePlea'));
        let msg = `${timestamp}s: ${spellKey} ticked for ${amountHealed}`;
        logger.log(msg, 2);
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
        let status, manaUsed, currentMana, errorMessage, offset, isCrit, msg, modifiedCritChance, sanctifiedLightCritChance, amountHealed;

        let spellInfo = this.classInfo['spells'].find(_spell => _spell['key'] === spellKey);
        
        // for melee_swing (placeholder), beacon and judgement
        // note that beacon cannot proc SoW
        if (spellInfo['category'] === 'others') {
            let toReturn = this.castOtherSpell(spellKey, timestamp, spellIndex, logger);
            // this is for the fake swings we added in when we introduce melee weaving
            if (spellKey === 'MELEE_SWING') {
                this.checkForAndHandleSoWProc(timestamp, spellIndex, logger, 'normal');
            } else if (spellKey === 'JUDGEMENT') {
                // judgement has 2 opportunites
                this.checkForAndHandleSoWProc(timestamp, spellIndex, logger, 'normal');
                // we dont want to use the same spell index; otherwise it will either proc or both not proc always
                // thus just check from end
                this.checkForAndHandleSoWProc(timestamp, this._rngThresholds['sow'].length - spellIndex - 1, logger, 'judgement');
            }
            // need to do the cast first before checking for SoW, otherwise if first cast is judgement and get a sow proc
            // will gain 0 mana instead of reimbursing the mana cost of the judgement
            return toReturn;
        }


        // checks for soup, and eog procs
        // holy light has more hits; all other spells have 2 hits (due to beacon)
        if (spellInfo['healingSpell']) {
            procs = this.getSoupEogProcs(spellIndex, spellKey === 'HOLY_LIGHT' ? this._numHitsPerHolyLight : 2);
        }

        // 6% crit bonus from sanctified light for HL and HS only
        sanctifiedLightCritChance = ['HOLY_LIGHT', 'HOLY_SHOCK'].indexOf(spellKey) > -1 ? this.classInfo['sanctifiedLightCritChanceModifier'] : 0;
        modifiedCritChance = this.critChance + sanctifiedLightCritChance;
        // 10% additional crit chance to holy shock from 2pT7
        if (spellKey === 'HOLY_SHOCK' && this._options['2pT7']) {
            modifiedCritChance += 0.1
        } 
        // infusion of lights adds 20% crit chance to holy light
        if (spellKey === 'HOLY_LIGHT' && this.isBuffActive('infusionOfLight')) {
            this.setBuffActive('infusionOfLight', false, timestamp, logger);
            modifiedCritChance += 0.2
        }

        let statMsg = '';
        statMsg += `Crit Chance: ${Utility.roundDp(modifiedCritChance * 100, 1)}% ; `;
        statMsg += `Spellpower: ${this.spellPower}`;
        logger.log(statMsg, 3);

        // all pally direcHeals spells have 1 chance to crit (beacon just mirrors the spell cast); hots cannot crit
        isCrit = spellInfo['category'] === 'directHeal' ? this.checkProcHelper('crit', spellIndex, 1, modifiedCritChance) : false;

        // isCrit = spellInfo['category'] === 'directHeal' ? Math.random() < modifiedCritChance : false;

        // directHeals should just calculate actual healing amount, for hots, just cast the spell
        if (spellInfo['category'] === 'directHeal') {
            amountHealed = this.calculateHealing(spellKey, isCrit, this.isBuffActive('divinePlea'));
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
            // don't show amountHealed for hots
            msg = `${timestamp}s: Casted ${spellKey} (spent ${originalMana - currentMana} mana)`;
        }
        logger.log(msg, 2);

        // if we cast an instant spell, we need to account for it using the gcd (modified by haste factor)
        offset = this._instantSpells.indexOf(spellKey) > -1 ? this._gcd : 0;

        // after spell is casted, add effects
        if (isCrit) {
            this.addManaFromIllumination(spellKey, logger);
            // holy shock crits triggers infusion of light
            if (spellKey === 'HOLY_SHOCK') {
                this.setBuffActive('infusionOfLight', true, timestamp, logger);
            }
            this.checkHandleProcsOnCritWithICD(timestamp, spellIndex, logger);
        }

        // eventsToCreate = eventsToCreate.concat(this.handleDmcg(timestamp, spellIndex, logger));

        // checks if sow proc (instants lke holy shock or sacred shield)
        if (spellInfo['instant']) this.checkForAndHandleSoWProc(timestamp, spellIndex, logger, 'normal');
        return [status, errorMessage, offset, eventsToCreate];
    }

    // procs can be eog/soup
    subtractMana(spellKey, timestamp, procs) {
        // 50% mana reduction when divine illuminatin is active
        let baseCostMultiplicativeFactors = this.isBuffActive('DIVINE_ILLUMINATION') ? {'divineIllumination': 0.5} : {};

        // Holy Light gets a further 5% discount on mana cost
        let otherMultiplicativeTotal = (spellKey === 'HOLY_LIGHT' && getKeyBoolean(this._options, '4pT7')) ?
            this._baseOtherMultiplicativeTotal - this.classInfo['manaCostModifiers']['4pT7'] : this._baseOtherMultiplicativeTotal;

        // for beacon, just override otherMultiplicativeTotal as it's not affected by the glyph of SoW
        if (spellKey === 'BEACON_OF_LIGHT') {
            otherMultiplicativeTotal = 1
        }

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
        return this.subtractManaHelper(spellKey, timestamp, baseCostMultiplicativeFactors, baseCostAdditiveFactors, otherMultiplicativeTotal);
    }

    addManaFromIllumination(spellKey, logger=null) {
        let baseManaCost = this.classInfo['spells'].find((_spell) => _spell['key'] === spellKey)['baseManaCost'];
        let amount = Math.floor(baseManaCost * 0.3);
        
        if (typeof this._statistics['illumination'] === 'undefined') {
            this._statistics['illumination'] = {};
        }
        if (!(spellKey in this._statistics['illumination'])) {
            this._statistics['illumination'][spellKey] = 0;
        }
        this._statistics['illumination'][spellKey] += amount;
        return this.addManaHelper(amount, 'illumination', logger);
    }

    // checks if there is a sow proc, and adds mana if there is
    // note that melee have a lower proc chance than judgement hit (only the spell portion; the melee portion is the normal proc rate)
    checkForAndHandleSoWProc(timestamp, spellIndex, logger, normalOrJudgement='normal') {
        if (!this._options['manaOptions']['canSoW']) return false;
        let hasProc = this.checkProcHelper('sow', spellIndex, 1, this._sowProcChace[normalOrJudgement]);

        if (hasProc) {
            let amount = Math.floor(this.maxMana * this.classInfo['sow']['value']);
            this.addManaHelper(amount, 'sow', logger, timestamp);
        }
        return hasProc;
    }

}

module.exports = Paladin;