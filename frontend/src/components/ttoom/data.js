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
          hasteRating: 574,
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
          hasteRating: 620,
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
          hasteRating: 0,
        },
        // we store player stats before trinkets
        // these are the real values that are passed to the backend
        statsBeforeTrinket: {
          int: 0,
          critRating: 0,
          spellpower: 0,
          mp5FromGear: 0,
          hasteRating: 0,
        },
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
          useDivinePleaWithDmcg: 'no',
          dmcgFirstProcDelayedUntil: 15,
          usePleaOnlyIfMinimumAmountOfDMCGSecs: 6,
          manaNotFull: false,
          startingMana: 20000,
        },
        trinkets: ['soup', 'eog'],
        glyphHolyLightHits: 4,
        tier: {
          '2pT7': true,
          '4pT7': true,
        },
        flask: 'distilledWisdom',
        finalGlyph: 'beacon',
        meleeWeave: false,
        meleeWeaveUptime: 50, // need to divide by 100 on backend
      },
    },
    shaman: {
      // most users will input int taken from 80 upgrades, which will already have a 10% boost to talents
      // so need to convert accordingly
      statsConversionFactor: {
        int: 1.04, // assume just 2 points in ancestral intellect
        spellPowerFromInt: 0.15, // nature's blessing
      },
      presets: [{
        name: 'P1 Realistic',
        default: true,
        url: 'https://eightyupgrades.com/set/3jckxd9fBQaLoWaVZqQQQZ',
        notes: '',
        charSheetStats: {
          int: 1002,
          spellpower: 1981,
          critRating: 349,
          mp5FromGear: 264,
          hasteRating: 633,
        },
        trinkets: ['soup', 'soulDead'],
        tier: {
          '2pT6': false,
          '2pT7': true,
          '4pT7': true,
        },
      },
      {
        name: 'P1 Realistic (with 2PT6)',
        default: true,
        url: 'https://eightyupgrades.com/set/fzTiGGqrazpgJ7YC3nm6mP',
        notes: '',
        charSheetStats: {
          int: 960,
          spellpower: 1934,
          critRating: 312,
          mp5FromGear: 275,
          hasteRating: 608,
        },
        trinkets: ['soup', 'soulDead'],
        tier: {
          '2pT6': true,
          '2pT7': true,
          '4pT7': true,
        },
      }],
      oomOptions: {
        charSheetStats: {
          int: 1425, // this includes the 10% int talent
          spellpower: 2035,
          critRating: 425,
          mp5FromGear: 117,
          hasteRating: 0,
        },
        // we store player stats before trinkets
        // these are the real values that are passed to the backend
        statsBeforeTrinket: {
          int: 0,
          critRating: 0,
          spellpower: 0,
          hasteRating: 0,
          mp5FromGear: 0,
        },
        seed: '',
        cpm: {
          CHAIN_HEAL: 18,
          LESSER_HEALING_WAVE: 8,
          HEALING_WAVE: 1,
          RIPTIDE: 9,
        },
        talents: {
          tidalFocus: true,
        },
        manaOptions: {
          replenishmentUptime: 90,
          manaPotion: true,
          injector: false,
          innervate: false,
          manaTideTotem: true,
          waterShieldProcsPerMinFromDamage: 2.5,
          manaNotFull: false,
          startingMana: 20000,
        },
        trinkets: ['soup',],
        chainHealHits: 4,
        tier: {
          '2pT6': false,
          '2pT7': true,
          '4pT7': true,
        },
        flask: 'frostWyrm',
        finalGlyph: 'lesserHealingWave',
        lesserHealingWaveCastPercentageOnEarthShield: 50,
        minEarthShieldTicksBeforeConsuming: 2, // for riptide
        bloodlust: true,
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
        soulDead: {
            name: 'Soul of the Dead',
            itemType: 'trinket',
            base: {
                critRating: 95,
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
        meteoriteCrystal: {
            name: 'Meteorite Crystal',
            itemType: 'trinket',
            base: {
                int: 118, //originally 111, assume +6% ilevel buff
            },
        },
        pandorasPlea: {
            name: 'Pandora\'s Plea',
            itemType: 'trinket',
            base: {
                int: 114, //originally 108, assume +6% ilevel buff
            },
        },
        solace: {
            name: 'Solace of the Fallen',
            itemType: 'trinket',
            base: {
                spellpower: 168,
            },
        },
    },
}

module.exports = data;