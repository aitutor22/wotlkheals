const textData = {
  changeLogs: {
    paladin: [
    {
      dateAdded: '12/10/22',
      text: 'Added support for Meteroite Crystal (P2) and Pandora\'s Plea (P2), and assume a 6% increase in both stats and proc effect inline with upcoming Uldar ilevel boost.',
    },
    {
      dateAdded: '10/10/22',
      text: 'Updated DMCG proc effect to be 70% for paladin due to Beacon.',
    },
    {
      dateAdded: '07/10/22',
      text: 'Added support for more fine-tuning of DMCG + Plea usage. By default, will assume the player uses trinket swapping to ensure DMCG will only proc after 15s (thank you @Euroflip for the idea). Added an option for Divine Plea to only be used during DMCG (this typically skips a plea, and increases throughput at the expense of ttoom).',
    },
    {
      dateAdded: '05/10/22',
      text: 'Added support for player to start at less than full mana (for speedrunning)',
    },
    {
      dateAdded: '18/09/22',
      text: 'Splits out mana regen due to DMCG.',
    },
    {
      dateAdded: '09/09/22',
      text: 'Added support for Beacon of Light and related glyphs. Improve melee weaving options.',
    },
    {
      dateAdded: '05/09/22',
      text: 'Added Melee weaving as an advanced game play option. Added Soul of the Dead to trinket options.',
    },
    {
      dateAdded: '03/09/22',
      text: 'For convenience, users can now input int & crit rating taken from 80upgrades. Added presets taken from Light Club.',
    },
    {
      dateAdded: '26/08/22',
      text: 'User can now input a seed to allow for better comparison. Added options to control how mana cooldowns are used. Fixed bug where DMCG would only be used once in some cases. Improved mobile responsiveness.',
    }],
    shaman: [],
  },
  implementationAssumptions: {
    paladin: [
      'Mana cost shown above is after EoG/Soup and Illumination',
      'If DMCG is equipped, mana generated due to the increased crit and mana pool is tracked separately (e.g. Illumination tracks the mana regen from base crit, whiel Illumination (DMCG) tracks mana regen from crits that occur due to DMCG',
      'Soup and EoG procs are directly subtracted from the spell that procced it rather than the following spell. This is both for implemention simplicity and also to reflect that spells with multiple chances to proc soup will have lower blended mana cost.',
      'For instants to proc SoW, the player might to pause for a very short while to allow the hit to go off when using a 1.8 speed weapon. Currently, the system does not implement this delay as more work needs to be done to determine how long, if any, a pause is required.',
      'When infusion of light is active, Holy Light is always casted unless you have set HL cpm to 0.',
      'The first Sacred Shield and Beacon are assumed to be precasted just before entering battle',
      'There are minor rounding issues which can slightly increase the CPM shown.',
    ],
    shaman: [
      'Healing Stream Totem is not implemented',
      'Mana cost shown above is after Soup and Water Shield',
      'For implementation ease, Healing Wave will always cast 30% faster, with or without TW as in practise, TW should always be up.',
      'Only two points are taken in Ancestral Knowledge.',
      'Selecting Bloodlust will not affect the amount of spells casted as that is determined by CPM; rather, casting Bloodlust is aimed at properly evaluating mana usage since Bloodlust is an expensive spell.',
      'The first Earth Shield is assumed to be precasted just before entering battle',
      'GCD for mana tide totem should be 1s, but this is not reflected in the sim yet.',
      'There are minor rounding issues which can slightly increase the CPM shown.',
    ],
  }
}

module.exports = textData;