const data = {
    paladin: {
      oomOptions: {
        manaPool: 28000,
        spellPower: 2400,
        critChance: 30,
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
          divinePleaMinimumManaDeficit: 8000,
          canSoW: true,
          selfLoh: false,
          injector: false,
          innervate: false,
          manaTideTotem: false,
          arcaneTorrent: false,
        },
        trinkets: ['soup', 'eog'],
        glyphHolyLightHits: 4,
        mp5FromGearAndRaidBuffs: 300,
        '2pT7': true,
        '4pT7': true,
      },
    }
}

module.exports = data;