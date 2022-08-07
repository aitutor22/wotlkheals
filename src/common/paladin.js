const BasePlayer = require('../common/basePlayer');
const DATA = require('./gamevalues');
const Utility = require('./utilities');

// helper function - given an object, check if a key exists and whether it is true/false
function getKeyBoolean(obj, key) {
    return (obj && typeof obj[key] !== 'undefined') && obj[key];
}

// methods that must be implemented by all player class
// subtractMana

class Paladin extends BasePlayer {
    // note that maxMana doesn't include mana pool from dmcg
    constructor(options) {
        super(options['manaPool'], 'paladin', options['otherMP5'], options['critChance'], options);

        // second part of this is we assume 1.1 sow procs a min, and convert it to mp5 terms
        // should be refactored in future
        this._otherMP5 = options['otherMP5'] + 1.1 * this._baseMaxMana * 0.04 / 12;
        this._otherMultiplicativeTotal = 1;
        // glyph of SOW reduces healing cost by 5%; note that we don't put 4pt7 here as it only affects HL
        this._baseOtherMultiplicativeTotal = Utility.getKeyBoolean(this._options, 'glyphSOW') ? (1 - this.classInfo['manaCostModifiers']['glyphSOW']) : 1;
    }

    // when eventHeap gets a spellcast event, it tries to cast it

    // # returns (status, error_message, offset_timing)


    castSpell(spellKey, timestamp, logsLevel=0) {
        if (this._validSpells.indexOf(spellKey) === -1) {
            throw new Error('other spells not handled yet');
        }

        let originalMana = this._currentMana;

        // player.add_spellcast_to_statistics(event._name, event._is_crit, event._is_soup_proc, event._is_eog_proc)
        let procs = {};
        let status, manaUsed, currentMana, errorMessage, offset;
        [status, manaUsed, currentMana, errorMessage] = this.subtractMana(spellKey, timestamp, procs);

        // player oom
        if (status === 0){
            return [status, errorMessage, 0];
        }

        // # try to get 1 hit
        // if event._name == 'Holy Shock' and event._is_sow_proc:
        //     player.add_mana_from_sow_proc()

        // # player not oom -> can either be normal cast or crit
        // if event._is_crit:
        //     player.add_mana_from_illumination(spell_key)

        if (logsLevel >= 2) {
        //     if event._is_soup_proc:
        //         print('🥣🥣🥣SOUP🥣🥣🥣')
        //     elif event._is_eog_proc:
        //         print('👀 👀EOG👀 👀')
            // msg = f'{event._time}s: **CRIT {event._name}** (spent {original_mana - player._current_mana} mana)' if event._is_crit \
            //     else f'{event._time}s: Casted {event._name} (spent {original_mana - player._current_mana} mana)'
            let msg = `${timestamp}s: Casted ${spellKey} (spent ${originalMana - currentMana} mana)`;
            console.log(msg);
        }

        // if we cast an instant spell, we need to account for it using the gcd
        offset = this._instantSpells.indexOf(spellKey) > -1 ? this._options['gcd'] : 0;
        return [status, errorMessage, offset];

        // let originalMana = this._currentMana;
        // status, current_mana, error_message = player.subtract_mana(self.get_spell_cost(spell_key, self._options), event._time, event._is_soup_proc, event._is_eog_proc)
        // player.add_spellcast_to_statistics(event._name, event._is_crit, event._is_soup_proc, event._is_eog_proc)

        // # player oom
        // if status == 0:
        //     return (0, error_message, 0)
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
}

module.exports = Paladin;