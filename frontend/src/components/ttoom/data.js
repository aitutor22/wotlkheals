const data = {
    paladin: {
      oomOptions: {
        manaPool: 28000,
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
        mp5FromGearAndRaidBuffs: 300,
        '2pT7': true,
        '4pT7': true,
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
    }
}

module.exports = data;