const Utility = require('../common/utilities');

const MIN_AMOUNT_OF_HEALING_TO_COUNT_AS_SACRED_SHIELD_HIT = 2000;

// used to analyze the real value of spellpower by checking the number of hits that overheals
// returns both the % of hits that overheal and the usefulSpellpowerPercentage
// this is calculated by if thinking if lets say adding +1 spellpower results in 100 additional heal, but only 20 of this isn't overheal
// then usefulSpellpowerPercentage is 0.2

const mapAbilityIdToCoefficient = {
    48785: {'coefficient': 1.009 * 1.12 * 1.05, 'name': 'FoL'}, // flash of light, , with healing light & divinity talents
    53653: {'coefficient': 1.009 * 1.12 * 1.05, 'name': 'FoL (Beacon)'}, // beacon (flash of light)
    48782: {'coefficient': 1.679 * 1.12 * 1.05, 'name': 'HL'}, // holy light, with healing light & divinity talents
    53652: {'coefficient': 1.679 * 1.12 * 1.05, 'name': 'HL (Beacon)'}, // beacon (holy light)
    54968: {'coefficient': 1.679 * 1.12 * 1.05 * 0.1, 'name': 'HL (Glyph)'}, // glyph of holy light
    58597: {'coefficient': 0.75 * 1.2, 'name': 'Sacred Shield'}, // sacred shield, divine guardian
    48821: {'coefficient': 0.807 * 1.12 * 1.05, 'name': 'HS'}, // holy shock
    53654: {'coefficient': 0.807 * 1.12 * 1.05, 'name': 'HS (Beacon)'}, // beacon (holy shock)
}

// to ensure system works with downranked spells
const mapDownRankSpellsToMaxRank = {
    // fol
    19750: 48785,
    19939: 48785,
    19940: 48785,
    19941: 48785,
    19942: 48785,
    19943: 48785,
    27137: 48785,
    48784: 48785,

    // hl
    635: 48782,
    639: 48782,
    647: 48782,
    1026: 48782,
    1042: 48782,
    3472: 48782,
    10328: 48782,
    10329: 48782,
    25292: 48782,
    27135: 48782,
    27136: 48782,
    48781: 48782,

    // hs
    25912: 48821,
    25914: 48821,
    25911: 48821,
    25913: 48821,
    25902: 48821,
    25903: 48821,
    27175: 48821,
    27176: 48821,
    33073: 48821,
    33074: 48821,
    48820: 48821,
    48822: 48821,
    48823: 48821,
}

class Analyzer {
    constructor(data) {
        // be careful not to mutate the passed in object
        this._rawdata = JSON.parse(JSON.stringify(data));
        this._healingData = this._rawdata['data']['reportData']['report']['healing']['data'];
    }

    run() {
        // nettAdditionalHeal tracks how much more healing +1 spell power generated if we consider overhealing
        // rawAdditionalHeal tracks how much more healing +1 spell power generated if we DON'T consider overhealing
        let counter = {'overall': {hitsOverHeal: 0, hitsTotal: 0, rawAdditionalHealAmount: 0, nettAdditionalHealAmount: 0}, spells: {}},
            sacredShieldHealing = 0; // tracks cumulative amount of sacred shield healing
        for (let entry of this._healingData) {
            if (!('hitType' in entry)) entry['hitType'] = 1; //. hittype ==1 means noncrit
            if (entry['abilityGameID'] in mapDownRankSpellsToMaxRank) {
                entry['abilityGameID'] = mapDownRankSpellsToMaxRank[entry['abilityGameID']];
            }

            let spellKey = mapAbilityIdToCoefficient[entry['abilityGameID']]['name'];
            if (!(spellKey in counter['spells'])) {
                counter['spells'][spellKey] = {key: spellKey, hitsOverHeal: 0, hitsTotal: 0, rawAdditionalHealAmount: 0, nettAdditionalHealAmount: 0}
            }

            // handle sacred shield separately - assume it never overheals
            // if a player is being hit by multiple mobs for small amount, we don't want to consider each hit as adding 1 spellpower to sacred shield
            // instead, we want to accumulate hits until a minimum threshold, and count that as 1 sacred shield hit
            // on fights like patchwerk, where each hit removes a sacred shied, this isn't a problem
            if (spellKey === 'Sacred Shield') {
                sacredShieldHealing += entry['amount'];
                if (sacredShieldHealing >= MIN_AMOUNT_OF_HEALING_TO_COUNT_AS_SACRED_SHIELD_HIT) {
                    counter['overall']['hitsTotal']++;
                    counter['spells'][spellKey]['hitsTotal']++;
                    counter['spells'][spellKey]['nettAdditionalHealAmount'] += mapAbilityIdToCoefficient[entry['abilityGameID']]['coefficient'];
                    counter['spells'][spellKey]['rawAdditionalHealAmount'] += mapAbilityIdToCoefficient[entry['abilityGameID']]['coefficient'];
                    sacredShieldHealing = 0; //resets variable that tracks cumulative sacredshield healing
                }
                continue;
            }

            if (('overheal' in entry) && entry['overheal'] > 0) {
                counter['overall']['hitsOverHeal']++;
                counter['spells'][spellKey]['hitsOverHeal']++;
            } else {
                // if there is no overhealing, then there is value in adding spellpower
                // assumes if there is a crit, then the spellpower value is increased by 50%
                counter['spells'][spellKey]['nettAdditionalHealAmount'] += mapAbilityIdToCoefficient[entry['abilityGameID']]['coefficient'] *
                    (entry['hitType'] === 2 ? 1.5 : 1);
            }

            counter['spells'][spellKey]['rawAdditionalHealAmount'] += mapAbilityIdToCoefficient[entry['abilityGameID']]['coefficient'] *
                (entry['hitType'] === 2 ? 1.5 : 1);
            counter['overall']['hitsTotal']++;
            counter['spells'][spellKey]['hitsTotal']++;

        }

        // computes overall statistics
        for (let key in counter['spells']) {
            counter['overall']['rawAdditionalHealAmount'] += counter['spells'][key]['rawAdditionalHealAmount'];
            counter['overall']['nettAdditionalHealAmount'] += counter['spells'][key]['nettAdditionalHealAmount'];
            counter['spells'][key]['usefulSpellpowerPercentage'] = counter['spells'][key]['rawAdditionalHealAmount'] > 0 ?
                counter['spells'][key]['nettAdditionalHealAmount'] / counter['spells'][key]['rawAdditionalHealAmount'] : 0;
        }
        counter['overall']['hitsOverhealPercentage'] = counter['overall']['hitsOverHeal'] / counter['overall']['hitsTotal'];
        counter['overall']['usefulSpellpowerPercentage'] = counter['overall']['nettAdditionalHealAmount'] / counter['overall']['rawAdditionalHealAmount'];
        return counter;
    }
}

module.exports = Analyzer;