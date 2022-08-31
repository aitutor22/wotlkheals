<!-- 
  not the smartest way to do this but we just 
  list all the possible fields from the 4 classes and
  show/hide only the relevant ones
-->
<template>
  <section id="options-modal" class="full-screen-modal" :class="{active: isShow}">
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
              <b-tab v-if="playerClass === 'paladin'" title="Gear" active><b-card-text>
                <!-- tier options -->
                <h6>Tier Sets</h6>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="checkbox" id="2pT7" v-model="oomOptions['2pT7']">
                  <label class="form-check-label" for="2pT7"
                    v-b-tooltip.hover title="Your Holy Shock gains an additional 10% chance to critically strike.">2PT7</label>
                </div>
                <div class="form-check form-check-inline ml-4">
                  <input class="form-check-input" type="checkbox" id="4pT7" v-model="oomOptions['4pT7']">
                  <label class="form-check-label" for="4pT7"
                    v-b-tooltip.hover title="The cost of your Holy Light is reduced by 5%.">4PT7</label>
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
                <div v-if="playerClass === 'paladin'" class="form-check">
                  <input class="form-check-input" type="checkbox" id="owl" v-model="oomOptions['trinkets']" value="owl">
                  <label class="form-check-label" for="owl"
                    v-b-tooltip.hover title="Note that Owl is 5 min cooldown, so using it on shorter fights overestimates its value">Figurine - Sapphire Owl</label>
                </div>
                <div v-if="playerClass === 'paladin'" class="form-check">
                  <input class="form-check-input" type="checkbox" id="eog" v-model="oomOptions['trinkets']" value="eog">
                  <label class="form-check-label" for="eog">Eye of Gruul</label>
                </div>

                <hr>
                <!-- general options that apply to all healers -->
                <h6>Stats from 80 Upgrades</h6>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Raid Buffed">Mana Pool</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaPool']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Unbuffed Int from gear as taken from 80 upgrades; already includes +10% additional int from Divine Intellect Talent">Unbuffed Int</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['int']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Raid Buffed, including spellpower from Holy Guidance">Spellpower</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['charSheetStats']['spellpower']">
                </div>
                <div v-if="playerClass === 'shaman'" class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Raid Buffed Mp5, excludes Water Shield">MP5 From Gear & Buffs (no Water Shield)</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['mp5FromGearAndRaidBuffs']">
                </div>
                <div v-else class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Raid Buffed">MP5 From Gear & Buffs</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['mp5FromGearAndRaidBuffs']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Raid Buffed, DO NOT include values from Holy Power and Sanctified Light talents as system will automatically add">Crit Chance %</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['critChance']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="If you leave this blank, sim will use random numbers. If you wish to use a specific seed, input an integer">Seed</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['seed']" placeholder="Leave blank to use random seed">
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
              </b-card-text></b-tab>

              <!-- options that apply to specific classes; we use v-if to show the correct one -->
              <b-tab v-if="playerClass === 'shaman'" title="Shaman"><b-card-text>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Chain Heal CPM</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['cpm']['CHAIN_HEAL']">
                </div>
<!--                 <div class="input-group mb-2" style="width: 100%">
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

                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="4pT7" v-model="oomOptions['4pT7']">
                  <label class="form-check-label" for="4pT7"
                    v-b-tooltip.hover title="The cost of your Holy Light is reduced by 5%.">4pT7</label>
                </div> -->
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="2pT6" v-model="oomOptions['2pT6']">
                  <label class="form-check-label" for="2pT6"
                    v-b-tooltip.hover title="Your Chain Heal ability cost 10% less mana.">2pT6</label>
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
                  <input class="form-check-input" type="checkbox" id="canSoW" v-model="oomOptions['manaOptions']['canSoW']">
                  <label class="form-check-label" for="canSoW"
                    v-b-tooltip.hover title="Is HPLD in melee range and thus able to proc Seal of Wisdom for mana?">Can SoW?</label>
                </div>
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
                    v-b-tooltip.hover title="Is the HPLD using Glyph of Divinity and casting Lay on Hands on him/herself for additional mana?">Self LoH (Divinity)</label>
                </div>

                <!-- class specific -->
                <div v-if="playerClass === 'shaman'">
                  123
                   <div class="input-group mb-2" style="width: 100%" v-if="'waterShieldProcsPerMinFromDamage' in oomOptions['manaOptions']">
                    <span class="input-group-text" id="basic-addon1"
                      v-b-tooltip.hover title="Water Shield PPM from taking damage">Water Shield PPM (taking damage)</span>
                    <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['waterShieldProcsPerMinFromDamage']">
                  </div>
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
    }
  },
  data() {
    return {
    };
  },
  watch: {
    '$store.state.ttoom.oomOptions.trinkets': function(newValue, oldValue) {
      // when we first initialize, we want to find the unbuffed int value for the paladin, without trinkets
      // basically subtract trinket stats from charSheetStats to get statsBeforeTrinket
      if (typeof oldValue === 'undefined') {
        this.loopThroughTrinkets(this.oomOptions['charSheetStats'], true, (stat, newValue) => {
          this.setStatsBeforeTrinket({key: stat, value: newValue});
        });
        return;
      }
      
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
        if (typeof oldValue === 'undefined') return;
        this.loopThroughTrinkets(this.oomOptions['charSheetStats'], true, (stat, newValue) => {
          this.setStatsBeforeTrinket({key: stat, value: newValue});
        });
      },
      deep: true,
    },
  },
  methods: {
    ...mapMutations('ttoom', ['setCharSheetStats', 'setStatsBeforeTrinket']),
    loopThroughTrinkets(originalValues, subtractTrinketValuesFromCharSheetStats, callback) {
      function addOrSubtract(a, b, subtract) {
        if (subtract) return a - b;
        return a + b;
      }

      for (let stat of ['int', 'spellpower', 'critRating']) {
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
        callback(stat, Math.round(newValue));
      }
    },
    close() {
      this.$emit('close');
    },
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
</style>
