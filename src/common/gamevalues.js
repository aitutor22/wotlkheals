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
            },
            {
                'key': 'HOLY_LIGHT',
                'name': 'Holy Light',
                'cooldown': 0,
                'instant': false,
                'baseManaCost': 1274.26,
            }],
            manaCostModifiers: {
                '4pT7': 0.05, // 5% mana discount on HL
                'glyphSOW': 0.05, // 5% mana discount on all spells
                'libramOfRenewal': 113, // subtracts 113
            },
            maxSoupHits: 7, //up to 7 for HL
        }
    },
    manaCooldowns: {
        // : {
        //     key: 'DIVINE_PLEA',
        //     name: 'Divine Plea',
        //     'value': 0, # we calculate this separately,
        //     'minimum_time_elapsed': 0,
        //     'minimum_mana_deficit': 6000, # how much mana needs to be lost before using this
        //     'available_for_use': True,
        //     'last_used': -9999, #timestamp of last usage
        //     'cooldown': 60, # the actual cooldown of spell
        //     'off_gcd': False,
        // },
        DIVINE_PLEA: {
            key: 'DIVINE_PLEA',
            name: 'Divine Plea',
            value: 0, // we calculate this separately
            cooldown: 60,
            offGcd: false,
            playerClass: 'paladin',
        },
        RUNIC_MANA_POTION: {
            key: 'RUNIC_MANA_POTION',
            name: 'Runic Mana Potion',
            value: 4300,
            // 'minimum_time_elapsed': 0,
            // 'minimum_mana_deficit': 18000, # how much mana needs to be lost before using this
            cooldown: 9999, // mana pots can only be used once
            offGcd: true,
            playerClass: 'all',
        }
    }


        // self._mana_cooldowns = [{
        //     'key': 'DIVINE_PLEA',
        //     'name': 'Divine Plea',
        //     'value': 0, # we calculate this separately,
        //     'minimum_time_elapsed': 0,
        //     'minimum_mana_deficit': 6000, # how much mana needs to be lost before using this
        //     'available_for_use': True,
        //     'last_used': -9999, #timestamp of last usage
        //     'cooldown': 60, # the actual cooldown of spell
        //     'off_gcd': False,
        // },
        // {
        //     'key': 'DIVINE_ILLUMINATION',
        //     'name': 'Divine Illumination',
        //     'value': 0, # we calculate this separately,
        //     'minimum_time_elapsed': 0,
        //     'minimum_mana_deficit': 9000, # how much mana needs to be lost before using this
        //     'available_for_use': True,
        //     'last_used': -9999, #timestamp of last usage
        //     'cooldown': 60 * 3, # the actual cooldown of spell
        //     'off_gcd': True,
        // },
        // {
        //     'key': 'MANA_TIDE_TOTEM',
        //     'name': 'Mana Tide Totem',
        //     'value': 0, # we calculate this separately,
        //     # there's a weird interaction with dmcg because when it procs, the mana deficit will grow which caused the sim to
        //     # use mana tide totem with dmcg. but we shouldnt always have this interaction
        //     # hence we just code MTT to be used at a fixed time instead
        //     'minimum_time_elapsed': 60,
        //     'minimum_mana_deficit': 0,
        //     'available_for_use': True,
        //     'last_used': -9999, #timestamp of last usage
        //     'cooldown': 60 * 5, # the actual cooldown of spell
        //     'off_gcd': True,
        // },
        // {
        //     'key': 'MANA_POTION',
        //     'name': 'Runic Mana Potion',
        //     'value': 4300,
        //     'minimum_time_elapsed': 0,
        //     'minimum_mana_deficit': 18000, # how much mana needs to be lost before using this
        //     'available_for_use': True,
        //     'last_used': -9999, #timestamp of last usage
        //     'cooldown': 9999, # mana pots can only be used once
        //     'off_gcd': True,
        // },
        // # build it in as an instant mana regen - doesn't make a difference
        // {
        //     'key': 'OWL',
        //     'name': 'Sapphire Owl',
        //     'value': 2340,
        //     'minimum_time_elapsed': 0,
        //     'minimum_mana_deficit': 20000, # how much mana needs to be lost before using this
        //     'available_for_use': True,
        //     'last_used': -9999, #timestamp of last usage
        //     'cooldown': 9999, # mana pots can only be used once
        //     'off_gcd': True,
        // }]


}

module.exports = data;