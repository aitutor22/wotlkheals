const BasePlayer = require('../common/basePlayer');
const DATA = require('./gamevalues');

// helper function - given an object, check if a key exists and whether it is true/false
function getKeyBoolean(obj, key) {
    return (obj && typeof obj[key] !== 'undefined') && obj[key];
}

// methods that must be implemented by all player class
// subtractMana

class Paladin extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(maxMana, otherMP5, critChance, options) {
        super(maxMana, 'paladin', otherMP5, critChance, options);

        // second part of this is we assume 1.1 sow procs a min, and convert it to mp5 terms
        // should be refactored in future
        this._otherMP5 = otherMP5 + 1.1 * this._baseMaxMana * 0.04 / 12;
        this._otherMultiplicativeTotal = 1;
        // glyph of SOW reduces healing cost by 5%; note that we don't put 4pt7 here as it only affects HL
        this._baseOtherMultiplicativeTotal = getKeyBoolean(this._options, 'glyphSOW') ? (1 - this.classInfo['manaCostModifiers']['glyphSOW']) : 1;
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
        if (getKeyBoolean(procs, 'soup')) {
            baseCostAdditiveFactors['soup'] = DATA['items']['soup']['proc']['manaReduction'];
        } else if (getKeyBoolean(procs, 'eog')) {
            baseCostAdditiveFactors['eog'] = DATA['items']['eog']['proc']['manaReduction'];
        }

        return this.subtractManaHelper(spellKey, timestamp, {}, baseCostAdditiveFactors, otherMultiplicativeTotal);
    }
}

module.exports = Paladin;