const GEM_VALUES = {
    int: 16, // 2 gem slots, assume we insert 2x 16 int gems
}

const data = {
    paladin: {
      // most users will input int taken from 80 upgrades, which will already have a 10% boost to talents
      // so need to convert accordingly
      statsConversionFactor: {
        int: 1.1,
        spellPowerFromInt: 0.2, // holy guidance
      },
      presets: [{
        name: 'P1 Realistic',
        default: true,
        url: 'https://eightyupgrades.com/set/e4pt8ZyQMZerC6n3TrHXnH',
        notes: '',
        charSheetStats: {
          int: 1332,
          spellpower: 1971,
          critRating: 333,
          mp5FromGear: 174,
        },
        trinkets: ['soup', 'owl'],
        tier: {
          '2pT7': true,
          '4pT7': true,
        }
      },
      {
        name: 'P1 Lootwhore',
        default: false,
        url: 'https://eightyupgrades.com/set/tL7pmzxb984wbHrmciH9ZK',
        notes: 'Swapped Owl for Soup',
        charSheetStats: {
          int: 1425,
          spellpower: 2035,
          critRating: 425,
          mp5FromGear: 156,
        },
        trinkets: ['soup', 'dmcg'],
        tier: {
          '2pT7': true,
          '4pT7': true,
        }
      },
      ],
      oomOptions: {
        // these are the values that user inputs, which include the trinket stats as they are taken from 80 upgrades
        // this isn't actually passed to the backend
        charSheetStats: {
          int: 1425, // this includes the 10% int talent
          spellpower: 2035,
          critRating: 425,
          mp5FromGear: 117,
        },
        // we store player stats before trinkets
        // these are the real values that are passed to the backend
        statsBeforeTrinket: {
          int: 0,
          critRating: 0,
          spellpower: 0,
        },
        spellPower: 2400,
        critChance: 30,
        seed: '',
        cpm: {
          HOLY_LIGHT: 35,
          HOLY_SHOCK: 3,
          FLASH_OF_LIGHT: 0,
        },
        talents: {
          enlightenedJudgements: 1,
        },
        manaOptions: {
          replenishmentUptime: 90,
          divineIllumination: true,
          divinePlea: true,
          maxNumDivinePleaUsesPerFight: 99,
          divinePleaMinimumManaDeficit: 8000,
          canSoW: true,
          selfLoh: false,
          injector: false,
          manaPotion: true,
          innervate: false,
          manaTideTotem: false,
          arcaneTorrent: false,
          useArcaneTorrentWithDmcg: false,
        },
        trinkets: ['soup', 'eog'],
        glyphHolyLightHits: 4,
        tier: {
          '2pT7': true,
          '4pT7': true,
        },
      },
    },
    shaman: {
      oomOptions: {
        manaPool: 25000,
        spellPower: 2500,
        critChance: 20,
        seed: '',
        cpm: {
          CHAIN_HEAL: 30,
        },
        talents: {
          tidalFocus: true,
        },
        manaOptions: {
          replenishmentUptime: 90,
          manaPotion: true,
          injector: false,
          innervate: false,
          manaTideTotem: false,
          waterShieldProcsPerMinFromDamage: 2.5,
        },
        trinkets: ['soup',],
        mp5FromGearAndRaidBuffs: 200,
        chainHealHits: 3,
        '2pT6': true,
      },
    },
    items: {
        // increase int by 300 for 15s
        dmcg: {
            name: 'Darkmoon Card: Greatness',
            itemType: 'trinket',
            base: {
                int: 90,
            },
        },
        soup: {
            name: 'Soul Preserver',
            itemType: 'trinket',
            base: {
                spellpower: 75,
            },
        },
        eog: {
            name: 'Eye of Gruul',
            itemType: 'trinket',
            base: {
                spellpower: 23,
            },
        },
        owl: {
            name: 'Figurine - Sapphire Owl',
            itemType: 'trinket',
            base: {
                int: 42 + 2 * GEM_VALUES['int'],
            },
        },
        // assume we prestack illustration before entering the fight
        illustration: {
            name: 'Illustration of the Dragon Soul',
            itemType: 'trinket',
            base: {
                spellpower: 200,
            },
        },
    },
}

module.exports = data;