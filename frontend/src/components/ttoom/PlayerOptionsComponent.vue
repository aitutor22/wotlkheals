<!-- 
  not the smartest way to do this but we just 
  list all the possible fields from the 4 classes and
  show/hide only the relevant ones
-->
<template>
  <section id="options-modal" class="full-screen-modal" :class="{active: isShow}">
<!--     <div v-if="oomOptions">
      {{ oomOptions['charSheetStats'] }}      
    </div> -->
    <div class="container">
      <div class="row">
        <div class="col-12 text-right">
          <button type="button" class="close" aria-label="Close" @click="close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>

      <div class="row" v-if="oomOptions">
        <div class="col-12">
          <b-card no-body>
            <b-tabs pills card>

              <!-- paladin gear -->
              <b-tab title="Gear" active><b-card-text>
                <h6 v-if="playerClass === 'paladin'">Presets from Light Club</h6>
                <h6 v-if="playerClass === 'shaman'">Presets from Shaman Discord</h6>
                  <b-button-group>
                    <b-button v-for="(preset, index) in presets" :key="index"
                      :class="{'btn-success': selectedPreset && !hasChangedPreset && (selectedPreset['name'] === preset['name'])}"
                      @click="setPreset(preset)">
                      {{ preset.name }}
                    </b-button>
                  </b-button-group>
                  <p v-if="selectedPreset" class="mt-2">
                    <a :href="selectedPreset['url']" target=”_blank”>Link to 80upgrades</a>
                    <span v-if="selectedPreset['notes'] !== ''"> (Note: {{ selectedPreset['notes'] }})</span>
                  </p>
                <hr>

                <!-- tier options -->
                <h6>Tier Sets</h6>
                <!-- paladin stuff -->
                <div v-if="playerClass === 'paladin'" class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id="2pT7" v-model="oomOptions['tier']['2pT7']">
                  <label class="form-check-label" for="2pT7"
                    v-b-tooltip.hover title="Your Holy Shock gains an additional 10% chance to critically strike.">2PT7</label>
                </div>
                <div v-if="playerClass === 'paladin'" class="form-check form-check-inline ml-4">
                  <input class="form-check-input" type="checkbox" id="4pT7" v-model="oomOptions['tier']['4pT7']">
                  <label class="form-check-label" for="4pT7"
                    v-b-tooltip.hover title="The cost of your Holy Light is reduced by 5%.">4PT7</label>
                </div>
                <div v-if="playerClass === 'paladin'" class="form-check form-check-inline ml-4">
                  <input class="form-check-input" type="checkbox" id="4pT8" v-model="oomOptions['tier']['4pT8']">
                  <label class="form-check-label" for="4pT8"
                    v-b-tooltip.hover title="Your Sacred Shield can now trigger its effect every 4 sec instead of every 6.">4PT8</label>
                </div>

                <!-- shaman tier -->
                <div v-if="playerClass === 'shaman'" class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id="2pT6" v-model="oomOptions['tier']['2pT6']">
                  <label class="form-check-label" for="2pT6"
                    v-b-tooltip.hover title="Your Chain Heal ability costs 10% less mana.">2PT6</label>
                </div>
                <div v-if="playerClass === 'shaman'" class="form-check form-check-inline ml-4">
                  <input class="form-check-input" type="checkbox" id="2pT7" v-model="oomOptions['tier']['2pT7']">
                  <label class="form-check-label" for="2pT7"
                    v-b-tooltip.hover title="Your Water Shield is 10% stronger.">2PT7</label>
                </div>
                <div v-if="playerClass === 'shaman'" class="form-check form-check-inline ml-4">
                  <input class="form-check-input" type="checkbox" id="4pT7" v-model="oomOptions['tier']['4pT7']">
                  <label class="form-check-label" for="4pT7"
                    v-b-tooltip.hover title="Increases the healing done by your Chain Heal and Healing Wave by 5%.">4PT7</label>
                </div>
                <hr>

                <!-- we first show trinkets that all healers are interested in, then show specific player class ones -->
                <h6>Trinkets</h6>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="soup" v-model="oomOptions['trinkets']" value="soup">
                  <label class="form-check-label" for="soup">Soul Preserver</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="dmcg" v-model="oomOptions['trinkets']" value="dmcg">
                  <label class="form-check-label" for="dmcg">Darkmoon Card: Greatness</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="illustration" v-model="oomOptions['trinkets']" value="illustration">
                  <label class="form-check-label" for="illustration">Illustration</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="soulDead" v-model="oomOptions['trinkets']" value="soulDead">
                  <label class="form-check-label" for="soulDead">Soul of the Dead</label>
                </div>
                <div v-if="playerClass === 'paladin'" class="form-check">
                  <input class="form-check-input" type="checkbox" id="owl" v-model="oomOptions['trinkets']" value="owl">
                  <label class="form-check-label" for="owl"
                    v-b-tooltip.hover title="Note that Owl is 5 min cooldown, so using it on shorter fights overestimates its value">Figurine - Sapphire Owl</label>
                </div>
                <div v-if="playerClass === 'paladin'" class="form-check">
                  <input class="form-check-input" type="checkbox" id="eog" v-model="oomOptions['trinkets']" value="eog">
                  <label class="form-check-label" for="eog">Eye of Gruul</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="meteoriteCrystal" v-model="oomOptions['trinkets']" value="meteoriteCrystal">
                  <label class="form-check-label" for="meteoriteCrystal">Meteorite Crystal (P2)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="pandorasPlea" v-model="oomOptions['trinkets']" value="pandorasPlea">
                  <label class="form-check-label" for="pandorasPlea">Pandora's Plea (P2)</label>
                </div>
<!--                 <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="solace" v-model="oomOptions['trinkets']" value="solace">
                  <label class="form-check-label" for="solace">Solace of the Fallen (P3)</label>
                </div> -->


                <hr>
                <!-- general options that apply to all healers -->
                <h6>Unbuffed Stats from 80 Upgrades</h6>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Unbuffed Int from gear as taken from 80 upgrades; already includes additional int from talents">Int</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['int']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Unbuffed, including spellpower from talents">Spellpower</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['spellpower']">
                </div>
                <div v-if="playerClass === 'shaman'" class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Mp5, excludes Water Shield">MP5 From Gear (no Water Shield)</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['mp5FromGear']">
                </div>
                <div v-else class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Unbuffed MP5 from gear, not including IED">MP5 From Gear</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['mp5FromGear']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Crit Rating from gear">Crit Rating</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['critRating']">
                </div>
                <hr>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="If you leave this blank, sim will use random numbers. If you wish to use a specific seed, input an integer">Seed</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['seed']" placeholder="Leave blank to use random seed">
                </div>

                <hr>
                <h6>Speedrunning Options</h6>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="manaNotFull" v-model="oomOptions['manaOptions']['manaNotFull']">
                  <label class="form-check-label" for="manaNotFull"
                    v-b-tooltip.hover title="In a speedrun, players often do not start fights with full mana, and this could reduces the value of int">Player does not start with full mana?</label>
                </div>
                <div v-if="oomOptions['manaOptions']['manaNotFull']" class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="User will start with this, assuming it is lower than the mana pool implied from int value passed in by user">Starting Mana</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['startingMana']">
                </div>
              </b-card-text></b-tab>


              <!-- options that apply to specific classes; we use v-if to show the correct one -->
              <b-tab v-if="playerClass === 'paladin'" title="Spells"><b-card-text>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">HL CPM</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['HOLY_LIGHT']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">FoL CPM</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['FLASH_OF_LIGHT']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">HS CPM </span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['HOLY_SHOCK']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Integer from 0 to 5"># hits from glyph HL</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['glyphHolyLightHits']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Number of talent points in Enlightened Judgements (0 to 2)">#pts (Enl. Judgements)</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['talents']['enlightenedJudgements']">
                </div>
                <b-form-group label="Select your final glyph (HL and SoW glyphs assumed to be taken)">
                  <b-form-radio v-model="oomOptions['finalGlyph']" name="finalGlyph" value="beacon">
                    <span v-b-tooltip.hover title="Increases the duration of Beacon of Light by 30 sec.">
                      Beacon of Light
                    </span>
                  </b-form-radio>
                  <b-form-radio v-model="oomOptions['finalGlyph']" name="finalGlyph" value="divinity">
                    <span v-b-tooltip.hover title="Your Lay on Hands grants twice as much mana as normal and also grants you as much mana as it grants your target.">
                      Divinity
                    </span>
                  </b-form-radio>
                </b-form-group>
                <p v-if="oomOptions['finalGlyph'] === 'divinity' && !oomOptions['manaOptions']['selfLoh']" class="red">Make sure to select Self-LoH under the "Mana" tab</p>
                <hr>
                <h6>Advanced Gameplay Choices</h6>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="canSoW" v-model="oomOptions['manaOptions']['canSoW']">
                  <label class="form-check-label" for="canSoW"
                    v-b-tooltip.hover title="Is HPLD in melee range and thus able to proc Seal of Wisdom for mana?">Can SoW?</label>
                </div>
                <div v-if="oomOptions['manaOptions']['canSoW']" class="form-check">
                  <input class="form-check-input" type="checkbox" id="meleeWeave" v-model="oomOptions['meleeWeave']" :value="true">
                  <label class="form-check-label" for="meleeWeave"
                    v-b-tooltip.hover title="">
                    Additional melee weave and delay spell casts
                  </label>
                </div>
                <p v-if="oomOptions['meleeWeave']">
                  This sim usually disregards haste rating and relies on CPM to determine cast times. The system will normally only melee during instant casts, and when selecting melee weave, the sim weaves in additional melees between spell casts based on your haste. This increases mana regen while also <b>increasing the gaps between healing spells and the risk of a tank death</b>.
                </p>
                <div v-if="oomOptions['meleeWeave']" class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Haste Rating </span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['hasteRating']">
                </div>
               <div v-if="oomOptions['meleeWeave']" class="col-md-4 mt-2 no-pad-left" style="width: 100%">
                  <span id="basic-addon1">Melee weave uptime %</span>
                  <vue-slider v-model="oomOptions['meleeWeaveUptime']"></vue-slider>
                </div>
              </b-card-text></b-tab>

              <!-- options that apply to specific classes; we use v-if to show the correct one -->
              <b-tab v-if="playerClass === 'shaman'" title="Shaman"><b-card-text>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Chain Heal CPM</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['CHAIN_HEAL']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Chain Heal Hits</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['chainHealHits']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Riptide CPM</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['RIPTIDE']">
                </div>
                <div class="mb-2">
                  <span class="mr-2">Min riptide ticks before CH consumption</span>
                  <v-select
                    :options="[0, 1, 2, 3, 4, 5]" v-model="oomOptions['minEarthShieldTicksBeforeConsuming']">
                    
                  </v-select>
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Healing Wave CPM</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['HEALING_WAVE']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Lesser Healing Wave CPM</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['LESSER_HEALING_WAVE']">
                </div>

                <b-form-group label="Select your final glyph (Glyph of CH and ES assumed to be taken)">
                  <b-form-radio v-model="oomOptions['finalGlyph']" name="finalGlyph" value="lesserHealingWave">Lesser Healing Wave</b-form-radio>
                  <b-form-radio v-model="oomOptions['finalGlyph']" name="finalGlyph" value="earthliving">Earthliving</b-form-radio>
                </b-form-group>

                <div v-if="oomOptions['finalGlyph'] === 'lesserHealingWave'" class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">% LHW on Earth Shield target</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['lesserHealingWaveCastPercentageOnEarthShield']">
                </div>
                <hr>
                <h6>Advanced Gameplay Choices</h6>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="bloodlust" v-model="oomOptions['bloodlust']" :value="true">
                  <label class="form-check-label" for="bloodlust"
                    v-b-tooltip.hover title="Ticking this will not affect the amount of spells casted as that is determined by CPM; rather this aims to more properly sim mana usage since Bloodlust is an expensive spell.">
                    Use Bloodlust
                  </label>
                </div>
              </b-card-text></b-tab>


              <b-tab title="Mana"><b-card-text>
                <!-- general options available to all classes -->
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Replenishment Uptime %</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['replenishmentUptime']">
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="manaPotion" v-model="oomOptions['manaOptions']['manaPotion']">
                  <label class="form-check-label" for="manaPotion">Runic Mana Potion</label>
                </div>
                <div v-if="oomOptions['manaOptions']['manaPotion']" class="form-check">
                  <input class="form-check-input" type="checkbox" id="injector" v-model="oomOptions['manaOptions']['injector']">
                  <label class="form-check-label" for="injector"
                    v-b-tooltip.hover title="Engineers using mana injectors gain a +25% bonus to mana potion">Mana Injector</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="innervate" v-model="oomOptions['manaOptions']['innervate']">
                  <label class="form-check-label" for="innervate">Innervate</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="manaTideTotem" v-model="oomOptions['manaOptions']['manaTideTotem']">
                  <label class="form-check-label" for="manaTideTotem">Mana Tide Totem</label>
                </div>
                <div class="form-check" v-if="typeof oomOptions['manaOptions']['arcaneTorrent'] !== 'undefined'">
                  <input class="form-check-input" type="checkbox" id="arcaneTorrent" v-model="oomOptions['manaOptions']['arcaneTorrent']">
                  <label class="form-check-label" for="arcaneTorrent">Arcane Torrent</label>
                </div>
                <!-- only show if dmcg and arcane torrent are selected -->
                <div v-if="hasDmcg && oomOptions['manaOptions']['arcaneTorrent']" class="form-check">
                  <input class="form-check-input" type="checkbox" id="useArcaneTorrentWithDmcg" v-model="oomOptions['manaOptions']['useArcaneTorrentWithDmcg']">
                  <label class="form-check-label" for="useArcaneTorrentWithDmcg">Use Arcane Torrent with DMCG</label>
                </div>

                <!-- class specific -->
                <div v-if="playerClass === 'paladin'" class="form-check">
                  <input class="form-check-input" type="checkbox" id="divinePlea" v-model="oomOptions['manaOptions']['divinePlea']">
                  <label class="form-check-label" for="divinePlea">Divine Plea</label>
                </div>
                <div class="input-group mb-2" style="width: 100%" v-if="oomOptions['manaOptions']['divinePlea']">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="This controls when to use Divine Plea - if you would like to delay Divine Plea, set this to a higher value.">Mana Deficit to use Divine Plea</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['divinePleaMinimumManaDeficit']">
                </div>
                <div class="input-group mb-2" style="width: 100%" v-if="oomOptions['manaOptions']['divinePlea']">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="This controls the max number of pleas used in a fight; used when we want to increase throughput by pleain less">Maximum number of Divine Pleas in a fight</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['maxNumDivinePleaUsesPerFight']">
                </div>

                <div v-if="playerClass === 'paladin'" class="form-check">
                  <input class="form-check-input" type="checkbox" id="divineIllumination" v-model="oomOptions['manaOptions']['divineIllumination']">
                  <label class="form-check-label" for="divineIllumination">Divine Illumination</label>
                </div>
                <div v-if="playerClass === 'paladin'" class="form-check">
                  <input class="form-check-input" type="checkbox" id="selfLoh" v-model="oomOptions['manaOptions']['selfLoh']">
                  <label class="form-check-label" for="selfLoh"
                    v-b-tooltip.hover title="Is the HPLD casting Lay on Hands on him/herself for additional mana?">Self LoH</label>
                </div>

                <!-- class specific -->
                <div v-if="playerClass === 'shaman'">
                   <div class="input-group mb-2" style="width: 100%" v-if="'waterShieldProcsPerMinFromDamage' in oomOptions['manaOptions']">
                    <span class="input-group-text" id="basic-addon1"
                      v-b-tooltip.hover title="Water Shield PPM from taking damage">Water Shield PPM (taking damage)</span>
                    <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['waterShieldProcsPerMinFromDamage']">
                  </div>
                </div>

                <hr>
                <h6>Flask of ...</h6>
                <b-form-group>
                  <b-form-radio v-model="oomOptions['flask']" name="some-radios" value="distilledWisdom"
                    v-b-tooltip.hover.left title="Increases Intellect by 65">Distilled Wisdom</b-form-radio>
                  <b-form-radio v-model="oomOptions['flask']" name="some-radios" value="frostWyrm"
                    v-b-tooltip.hover.left title="Increases Spell Power by 125">Frost Wyrm</b-form-radio>
                </b-form-group>

                <hr>
                <h6 v-if="hasDmcg && oomOptions['manaOptions']['divinePlea']">Advanced Options for DMCG and Divine Plea</h6>
                <b-form-group
                  v-if="hasDmcg && oomOptions['manaOptions']['divinePlea']"
                  label="How should Divine Plea be used in conjunction with DMCG?">
                  <b-form-radio v-model="oomOptions['manaOptions']['useDivinePleaWithDmcg']" name="useDivinePleaWithDmcg" value="no">
                    <span v-b-tooltip.hover title="Do not wait for dmcg, use Divine Plea whenever cooldown is up and minimum mana deficit has been satisfied">
                      Don't wait for DMCG 
                    </span>
                  </b-form-radio>
                  <b-form-radio v-model="oomOptions['manaOptions']['useDivinePleaWithDmcg']" name="useDivinePleaWithDmcg" value="alwaysWait">
                    <span v-b-tooltip.hover title="Always wait for DMCG to be up (assuming it satisfies minimum duration below) before using Diving Plea. This will likely result in fewer Divine Plea being used so TTOOM might be lower, while HPS is higher.">
                      Always wait for DMCG (will result in fewer Divine Pleas)
                    </span>
                  </b-form-radio>
<!--                   <b-form-radio v-model="oomOptions['manaOptions']['useDivinePleaWithDmcg']" name="useDivinePleaWithDmcg" value="waitIfICDAlmostUp">
                    <span v-b-tooltip.hover title="If DMCG internal cooldown is less than 10s, wait for it before using Divine Plea. Otherwise just go ahead and use Divine plea if minmum mana deficit has been satisfied.">
                      Only wait for DMCG if its ICD is < 10s
                    </span>
                  </b-form-radio> -->
                </b-form-group>

                <div v-if="hasDmcg && oomOptions['manaOptions']['divinePlea']" class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Use trinket swapping to delay DMCG first usage. This allows DMCG + plea to occur at a more optimal time than right at the start of the fight, which will waste mana.">Delay DMCG first proc until after X secs</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['dmcgFirstProcDelayedUntil']">
                </div>

                <div v-if="hasDmcg && oomOptions['manaOptions']['divinePlea'] && oomOptions['manaOptions']['useDivinePleaWithDmcg'] === 'alwaysWait'" class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="If divine plea comes off cooldown while DMCG proc is active, what is the minimum amount of DMCG duration before we use Divine Plea?">Use plea only if there are at least X secs of DMCG</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['usePleaOnlyIfMinimumAmountOfDMCGSecs']">
                </div>

              </b-card-text></b-tab>
            </b-tabs>
          </b-card>
        </div>
      </div>

    </div>
  </section>
</template>

<script>

import {mapState, mapMutations} from 'vuex';
import data from './data';

export default {
  name: 'TtoomOptions',
  props: {
    playerClass: String,
    isShow: Boolean,
  },
  computed: {
    ...mapState('ttoom', ['oomOptions']),
    hasDmcg() {
      return this.oomOptions['trinkets'].indexOf('dmcg') > -1;
    },
    presets() {
      return data[this.playerClass]['presets'];
    }
  },
  data() {
    return {
      selectedPreset: null,
      hasChangedPreset: false,
    };
  },
  mounted() {
    this.$nextTick(function () {
      // Code that will run only after the
      // entire view has been rendered
      this.setPreset();
    })
  },
  watch: {
    // whenever player class changes, updated the initial selectedPreset
    playerClass() {
      this.setPreset();
      return;
    },
    '$store.state.ttoom.oomOptions.trinkets': function(newValue, oldValue) {
      if (typeof oldValue === 'undefined') return;
      
      this.hasChangedPreset = true;

      // whenever user selects or unselects trinkets, we will use statsBeforeTrinket and the selected trinket to calculate set charsheetstats
      // basically add trinket stats to statsBeforeTrinket resulting in charSheetStats
      this.loopThroughTrinkets(this.oomOptions['statsBeforeTrinket'], false, (stat, newValue) => {
        this.setCharSheetStats({key: stat, value: newValue});
      });
    },
    // everytime user manually changes a stat value, we need to update statsBeforeTrinket
    // need to use a deep watcher here since it's watching the whole object
    '$store.state.ttoom.oomOptions.charSheetStats': {
      handler: function(newValue, oldValue) {
        console.log(this.oomOptions)
        if (typeof oldValue === 'undefined') return;
        this.hasChangedPreset = true;
        this.loopThroughTrinkets(this.oomOptions['charSheetStats'], true, (stat, newValue) => {
          this.setStatsBeforeTrinket({key: stat, value: newValue});
        });
      },
      deep: true,
    },
  },
  methods: {
    ...mapMutations('ttoom', ['setCharSheetStats', 'setStatsBeforeTrinket', 'setTrinkets', 'setTierOptions']),
    loopThroughTrinkets(originalValues, subtractTrinketValuesFromCharSheetStats, callback) {
      function addOrSubtract(a, b, subtract) {
        if (subtract) return a - b;
        return a + b;
      }

      for (let stat of ['int', 'spellpower', 'critRating', 'hasteRating', 'mp5FromGear']) {
        let newValue = originalValues[stat];
        // loops through selected trinkets, and subtracts from the appropraite stat
        for (let trinket of this.oomOptions['trinkets']) {
          if (stat in data['items'][trinket]['base']) {
            if (stat === 'int') {
              // for int, we need to consider the statsConversionFactor
              // for instance, whatever stats user passes in from 80upgrades will already have a 10% buff from talents
              newValue = addOrSubtract(newValue,
                  data['items'][trinket]['base'][stat] * data[this.playerClass]['statsConversionFactor'][stat],
                  subtractTrinketValuesFromCharSheetStats);
            } else {
              newValue = addOrSubtract(newValue,
                data['items'][trinket]['base'][stat], 
                subtractTrinketValuesFromCharSheetStats);
            }
          }
        }

        // NOTE: AS OF 5th Sep 2022, eighty upgrades does not modify the spellpower portion shown on character screen
        // with the spellpower portion of int
        // // need to add/subtract the spellpower portion of int
        // if (stat === 'spellpower') {
        //   let spellpowerFromInt = data[this.playerClass]['statsConversionFactor']['spellPowerFromInt'] *
        //     this.oomOptions['charSheetStats']['int'];
        //   newValue = addOrSubtract(newValue, spellpowerFromInt, subtractTrinketValuesFromCharSheetStats);
        // }

        callback(stat, Math.round(newValue));
      }
    },
    close() {
      this.$emit('close');
    },
    calculateStatsBeforeTrinket() {
      // when we first initialize, we want to find the unbuffed int value for the paladin, without trinkets
      // basically subtract trinket stats from charSheetStats to get statsBeforeTrinket
      this.loopThroughTrinkets(this.oomOptions['charSheetStats'], true, (stat, newValue) => {
        this.setStatsBeforeTrinket({key: stat, value: newValue});
      });
    },
    // updates selectedPreset and also updates tier sets, trinkets and stats
    // if preset isn't passed, will use default value
    setPreset(preset) {
      if (typeof preset === 'undefined') {
        preset = data[this.playerClass]['presets'].find((entry) => entry['default']);
      }
      this.selectedPreset = preset;
      this.setTrinkets(preset['trinkets']);
      this.setTierOptions(preset['tier']);
      for (let statKey in preset['charSheetStats']) {
        this.setCharSheetStats({key: statKey, value: preset['charSheetStats'][statKey]});
      }
      this.calculateStatsBeforeTrinket(); // need to recalculate statsBeforeTrinket everytime we update presets
      // bad code but we force the button to update color 50ms later
      // otherwise, this wont work as this.hasChangedPreset will be set to false in the watch events for trinket change
      setTimeout(() => {
        this.hasChangedPreset = false; // this controlls whether the button will be shaded
      }, 50);
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.full-screen-modal {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}

.full-screen-modal {
  z-index: 101;
  background-color: #fff;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.5s, visibility 0s 0.5s;
}

.full-screen-modal.active {
    opacity: 1;
    visibility: visible;
    transition: opacity 0.5s;
}

.full-screen-modal .close {
  font-size: 3em;
}

.no-pad-left {
  padding-left: 0px;
}

.vs--single.vs--open .vs__selected { position: inherit; }
.v-select {
  display: inline-block;
  width: auto; 
  min-width: 11em;
}

.red {
  color: red;
}
</style>
