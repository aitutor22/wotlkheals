const textData = {
  changeLogs: {
    paladin: [
    // {
    //   dateAdded: '05/09/22',
    //   text: 'Added Soul of the Dead',
    // },
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
      'The following have NOT been implented yet: Divine Favour, FoL Infusion of Light (currently the system will automatically prioritise HL when Infusion of Light is up), and standalone gcds used for Beacon.',
      'Mana cost shown above is after EoG/Soup and Illumination',
      'Judgement is not casted in the sim, but two SoW procs is automatically calculated every 60s (Judgement counts as 2 hits).',
      'Soup and EoG procs are directly subtracted from the spell that procced it rather than the following spell. This is both for implemention simplicity and also to reflect that spells with multiple chances to proc soup will have lower blended mana cost.',
      'For instants to proc SoW, the player might to pause for a very short while to allow the hit to go off when using a 1.8 speed weapon. Currently, the system does not implement this delay as more work needs to be done to determine how long, if any, a pause is required.',
      'When infusion of light is active, Holy Light is always casted unless you have set HL cpm to 0.',
      'The first Sacred Shield is assumed to be precasted just before entering battle',
      'There are minor rounding issues which can slightly increase the CPM shown.',
    ],
    shaman: [
      'Healing Stream Totem is not implemented',
      'Mana cost shown above is after Soup and Water Shield',
      'Only two points are taken in Ancestral Knowledge.',
      'Selecting Bloodlust will not affect the amount of spells casted as that is determined by CPM; rather, casting Bloodlust is aimed at properly evaluating mana usage since Bloodlust is an expensive spell.',
      'The first Earth Shield is assumed to be precasted just before entering battle',
      'GCD for mana tide totem should be 1s, but this is not reflected in the sim yet.',
      'There are minor rounding issues which can slightly increase the CPM shown.',
    ],
  }
}

module.exports = textData;