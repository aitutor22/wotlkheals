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
    },
    constants: {
        manaFromOneInt: 15,
        // 166.667 points of Intellect equals 1% of Spell Critical; divide by 100 to convert to decimal points
        critChanceFromOneInt: 1 / 16666.7,
    },
    classes: {
        paladin: {
            intModifier: 1.1 * 1.1, //blessing of kings and divine intellect
        }
    }
}

module.exports = data;