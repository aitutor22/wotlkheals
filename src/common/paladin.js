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
        this._numHitsPerHolyLight = Math.floor(2 + this._options['glyphHolyLightHits']) // beacon + original target + glpyh
    }

    // when eventHeap gets a spellcast event, it tries to cast it

    // # returns (status, error_message, offset_timing)

    // selectSpell and castSpell work differently
    // selectSpell (in basePlayer) selects a spell given spellIndex, and returns the spell
    // castSpell is run when the event loop receves the spellcast event, and we determine if the spell is a crit, or has other procs
    // one might wonder might we don't just cast the spell directly after selecting it. 
    // this is because there could be events in between like mana ticks and/or buffs expiring (like dmcg)

    castSpell(spellKey, timestamp, spellIndex, logger) {
        if (this._validSpells.indexOf(spellKey) === -1) throw new Error('other spells not handled yet');

        let originalMana = this._currentMana;

        // player.add_spellcast_to_statistics(event._name, event._is_crit, event._is_soup_proc, event._is_eog_proc)
        let procs = {};
        let status, manaUsed, currentMana, errorMessage, offset, isCrit, msg;

        // checks for soup, and eog procs
        // holy light has more hits; all other spells have 2 hits (due to beacon)
        for (let _key of ['soup', 'eog']) {
            if (this._options['trinkets'].indexOf(_key) > -1) {
                procs[_key] = this.isSoupEogProc(_key === 'soup', spellIndex, spellKey === 'HOLY_LIGHT' ? this._numHitsPerHolyLight : 2);
            };
        }

        // all pally spells have 1 chance to crit (beacon just mirrors the spell cast)
        isCrit = this.checkProcHelper('crit', spellIndex, 1, this.critChance);

        [status, manaUsed, currentMana, errorMessage] = this.subtractMana(spellKey, timestamp, procs);

        // player oom
        if (status === 0) {
            return [status, errorMessage, 0];
        }

        // # try to get 1 hit
        // if event._name == 'Holy Shock' and event._is_sow_proc:
        //     player.add_mana_from_sow_proc()


        if (procs['soup']) {
            logger.log('🥣🥣🥣 SOUP 🥣🥣🥣', 2);
        } else if (procs['eog']) {
            logger.log('👀 👀 EOG 👀 👀', 2);
        }

        msg = isCrit ? `${timestamp}s: **CRIT ${spellKey}** (spent ${originalMana - currentMana} mana)` :
            `${timestamp}s: Casted ${spellKey} (spent ${originalMana - currentMana} mana)`;

        logger.log(msg, 2);

        if (isCrit) {
            this.addManaFromIllumination(spellKey, logger);
        }

        // if we cast an instant spell, we need to account for it using the gcd
        offset = this._instantSpells.indexOf(spellKey) > -1 ? this._options['gcd'] : 0;
        return [status, errorMessage, offset];


        // # selects next spell
        // selected_spell = player.select_spell(current_time, override_spell_selection)

        // cast_time = self._options['CAST_TIMES'][selected_spell['key']]
        // # adding next spell cast
        // crit_chance = player._crit_chance
        // # 10% additional crit chance to holy shock
        // if selected_spell['key'] == 'HOLY_SHOCK' and self._options['2p_t7']:
        //     crit_chance += 0.1
        // if selected_spell['key'] == 'HOLY_LIGHT' and player._buffs['INFUSION_OF_LIGHT']:
        //     player._buffs['INFUSION_OF_LIGHT'] = False
        //     crit_chance += 0.2

        // if self._logs_level == 3:
        //     print('Crit chance of next spell: {}; {}'.format(selected_spell['key'], crit_chance))
        // is_crit = self.crit_rng_thresholds[spell_index] <= crit_chance

        // # holy shock crits triggers infusion of light, which adds 20% to next HL crit
        // if selected_spell['key'] == 'HOLY_SHOCK' and is_crit:
        //     player._buffs['INFUSION_OF_LIGHT'] = True

        // # print('{}; crit_chance: {}'.format(selected_spell['key'], crit_chance))
        // # soup_proc of next spell based off the current spell
        // # holy shock only has 2 soup procs
        // # both eog and soup share same number of hits
        // num_chances_for_soup = self._num_hits_per_holy_light if selected_spell['key'] == 'HOLY_LIGHT' else 2
        // is_soup_proc = self.get_soup_eog_proc(self.soup_rng_thresholds[spell_index * num_chances_for_soup: (spell_index + 1) * num_chances_for_soup], 'soup')
        // is_eog_proc = self.get_soup_eog_proc(self.eog_rng_thresholds[spell_index * num_chances_for_soup: (spell_index + 1) * num_chances_for_soup], 'eog')
        // # checks and see if dmcg is proc
        // is_dmcg_proc = self.dmcg_rng_thresholds[spell_index] <= TRINKET_STATS['dmcg_proc_rate'] if self._options['dmcg'] else False
        // if is_dmcg_proc and player.check_dmcg_available(current_time):
        //     player.set_dmcg_active(True, current_time)
        //     heapq.heappush(event_heap, Event('DMCG Buff Inactive', False, False, False, False, current_time + 15, 'DMCG_BUFF_INACTIVE'))

        // is_sow_proc = self.sow_rng_thresholds[spell_index] <= SOW_PROC_RATE
        // if self._logs_level == 3 and selected_spell['key'] == 'HOLY_SHOCK' and is_sow_proc:
        //     print('SOW PROC FOR UPCOMING HOLY SHOCK')


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

    addManaFromIllumination(spellKey, logger) {
        let baseManaCost = this.classInfo['spells'].find((_spell) => _spell['key'] === spellKey)['baseManaCost'];
        let amount = Math.floor(baseManaCost * 0.3);
        logger.log(`Gained ${amount} from Illumination`, 2);
        return this.addManaHelper(amount, 'illumination');
    }
}

module.exports = Paladin;