const GEM_VALUES = {
    int: 16, // 2 gem slots, assume we insert 2x 16 int gems
}

const data = {
    items: {
        // increase int by 300 for 15s
        dmcg: {
            name: 'Darkmoon Card: Greatness',
            itemType: 'trinket',
            base: {
                int: 90,
            },
            proc: {
                icd: 45, //internal cooldown (s)
                chance: 0.35,
                int: 300, // how much it increases value by when it procs
                duration: 15,
            },
        },
        soup: {
            name: 'Soul Preserver',
            itemType: 'trinket',
            base: {
                spellpower: 75,
            },
            proc: {
                icd: 0,
                chance: 0.02,
                manaReduction: 800,
            },
        },
        eog: {
            name: 'Eye of Gruul',
            itemType: 'trinket',
            base: {
                spellpower: 23,
            },
            proc: {
                icd: 0,
                chance: 0.02,
                manaReduction: 450,
            },
        },
        owl: {
            name: 'Figurine - Sapphire Owl',
            itemType: 'trinket',
            base: {
                int: 42 + 2 * GEM_VALUES['int'],
            },
        },
    },
    constants: {
        manaFromOneInt: 15,
        // 166.667 points of Intellect equals 1% of Spell Critical; divide by 100 to convert to decimal points
        critChanceFromOneInt: 1 / 16666.7,
        replenishment: 0.01, //returns 1% of mana pool every 5s
    },
    classes: {
        paladin: {
            intModifier: 1.1 * 1.1, //blessing of kings and divine intellect
            baseCritChanceModifier: 0.05, // 5% additional crit chance from holy power
            sanctifiedLightCritChanceModifier: 0.06, // 6% additional crit chance for holy shock and holy light
            sow: {
                chance: 0.45 * (1 - 0.05 - 0.065), // 45% chance to proc on hit, include a 5% miss chance and 6.5% chance to be blocked,
                value: 0.04, // 4% of max mana
            },
            spells: [
            {
                'key': 'HOLY_SHOCK',
                'name': 'Holy Shock',
                'cooldown': 6, // the actual cooldown of spell
                'instant': true,
                'baseManaCost': 790.92,
                baseHeal: 2500,
                coefficient: 0.806, // https://wowwiki-archive.fandom.com/wiki/Spell_power_coefficient
            },
            {
                'key': 'HOLY_LIGHT',
                'name': 'Holy Light',
                'cooldown': 0,
                'instant': false,
                'baseManaCost': 1274.26,
                baseHeal: 5166,
                coefficient: 1.679, // tested by currelius, before talents
            }],
            manaCostModifiers: {
                '4pT7': 0.05, // 5% mana discount on HL
                'glyphSOW': 0.05, // 5% mana discount on all spells
                'libramOfRenewal': 113, // subtracts 113
            },
            maxSoupHits: 7, //up to 7 for HL
            spellPowerFromInt: 0.2, // holy guidance
        }
    },
    manaCooldowns: {
        DIVINE_PLEA: {
            key: 'DIVINE_PLEA',
            name: 'Divine Plea',
            value: 0, // we calculate this separately - 0 mana returned initially
            cooldown: 60,
            offGcd: false,
            category: 'interval',
            numIntervals: 5,
            secsBetweenInterval: 3,
            startAtTimestamp: false,
            percentageManaPool: 0.05,
            playerClass: 'paladin',
        },
        RUNIC_MANA_POTION: {
            key: 'RUNIC_MANA_POTION',
            name: 'Runic Mana Potion',
            value: 4300,
            category: 'immediate',
            // 'minimum_time_elapsed': 0,
            // 'minimum_mana_deficit': 18000, # how much mana needs to be lost before using this
            cooldown: 9999, // mana pots can only be used once
            offGcd: true,
            playerClass: 'all',
        },
        DIVINE_ILLUMINATION: {
            key: 'DIVINE_ILLUMINATION',
            name: 'Divine Illumination',
            value: 0, // we calculate this separately
            cooldown: 60 * 3, // the actual cooldown of spell
            offGcd: true,
            playerClass: 'paladin',
            category: 'buff',
            duration: 15,
        },
        // assumes you self LoH together with glyph
        LAY_ON_HANDS: {
            key: 'LAY_ON_HANDS',
            name: 'Lay On Hands (Self)',
            value: 7800, // we calculate this separately
            cooldown: 11 * 60, // the actual cooldown of spell
            offGcd: false,
            playerClass: 'paladin',
            category: 'immediate',
        },
        // technically a 12s 2340 mana regen; but just assume you get it all at one shot for simplicity
        OWL: {
            key: 'OWL',
            name: 'Figurine - Sapphire Owl',
            value: 2340,
            cooldown: 60 * 5,
            offGcd: true,
            category: 'immediate',
            playerClass: 'all',
        },
    },
    manaCooldownNamesMap: {
        'libramOfRenewal': 'Libram of Renewal',
        'otherMP5': 'Others',
        'divinePlea': 'Divine Plea',
        'divineIllumination': 'Divine Illumination',
        'RUNIC_MANA_POTION': 'Mana Potion',
        'sow': 'Holy Shock SoW',
        'eog': 'EoG',
        'OWL': 'Sapphire Owl'
    },
}

module.exports = data;