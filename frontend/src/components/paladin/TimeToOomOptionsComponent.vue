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

      <div class="row">
        <div class="col-12">
          <b-card no-body>
            <b-tabs pills card>
              <b-tab title="General" active><b-card-text>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Raid Buffed">Mana Pool</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaPool']">
                </div>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="Raid Buffed, including spellpower from Holy Guidance">Spellpower</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['spellPower']">
                </div>
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
                    v-b-tooltip.hover title="Number of talent points in Enlightened Judgements (0 to 2)">#pts (Enl. Judgements)</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['talents']['enlightenedJudgements']">
                </div>
              </b-card-text></b-tab>

              <b-tab title="Gear"><b-card-text>
                <b>Tier Bonus</b>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="2pT7" v-model="oomOptions['2pT7']">
                  <label class="form-check-label" for="2pT7"
                    v-b-tooltip.hover title="Your Holy Shock gains an additional 10% chance to critically strike.">2pT7</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="4pT7" v-model="oomOptions['4pT7']">
                  <label class="form-check-label" for="4pT7"
                    v-b-tooltip.hover title="The cost of your Holy Light is reduced by 5%.">4pT7</label>
                </div>

                <b>Trinkets</b>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="soup" v-model="oomOptions['trinkets']" value="soup">
                  <label class="form-check-label" for="soup">Soul Preserver</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="eog" v-model="oomOptions['trinkets']" value="eog">
                  <label class="form-check-label" for="eog">Eye of Gruul</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="dmcg" v-model="oomOptions['trinkets']" value="dmcg">
                  <label class="form-check-label" for="dmcg">Darkmoon Card: Greatness</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="owl" v-model="oomOptions['trinkets']" value="owl">
                  <label class="form-check-label" for="owl">Figurine - Sapphire Owl</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="illustration" v-model="oomOptions['trinkets']" value="illustration">
                  <label class="form-check-label" for="illustration">Illustration</label>
                </div>
              </b-card-text></b-tab>

              <b-tab title="Mana Cooldowns"><b-card-text>
                <b>Mana Options</b>
                <div class="input-group mb-2" style="width: 100%">
                  <span class="input-group-text" id="basic-addon1">Replenishment Uptime %</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['replenishmentUptime']">
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="canSoW" v-model="oomOptions['manaOptions']['canSoW']">
                  <label class="form-check-label" for="canSoW"
                    v-b-tooltip.hover title="Is HPLD in melee range and thus able to proc Seal of Wisdom for mana?">Can SoW?</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="divinePlea" v-model="oomOptions['manaOptions']['divinePlea']">
                  <label class="form-check-label" for="divinePlea">Divine Plea</label>
                </div>
                <div class="input-group mb-2" style="width: 100%" v-if="oomOptions['manaOptions']['divinePlea']">
                  <span class="input-group-text" id="basic-addon1"
                    v-b-tooltip.hover title="This controls when to use Divine Plea - if you would like to delay Divine Plea, set this to a higher value.">Mana Deficit to use Divine Plea</span>
                  <input type="text" class="form-control" v-model.number="oomOptions['manaOptions']['divinePleaMinimumManaDeficit']">
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="divineIllumination" v-model="oomOptions['manaOptions']['divineIllumination']">
                  <label class="form-check-label" for="divineIllumination">Divine Illumination</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="selfLoh" v-model="oomOptions['manaOptions']['selfLoh']">
                  <label class="form-check-label" for="selfLoh"
                    v-b-tooltip.hover title="Is the HPLD using Glyph of Divinity and casting Lay on Hands on him/herself for additional mana?">Self LoH (Divinity)</label>
                </div>
                <div class="form-check">
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
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="arcaneTorrent" v-model="oomOptions['manaOptions']['arcaneTorrent']">
                  <label class="form-check-label" for="arcaneTorrent">Arcane Torrent</label>
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

import {mapMutations} from 'vuex';

export default {
  name: 'PaladinTtoomOptions',
  props: {
    isShow: Boolean,
  },
  computed: {
  },
  data() {
    return {
      oomOptions: {
        manaPool: 28000,
        spellPower: 2400,
        castTimes: {
          HOLY_LIGHT: 1.6,
          FLASH_OF_LIGHT: 1.4,
        },
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
        critChance: 30,
      },
    };
  },
  methods: {
     ...mapMutations('ttoom', ['setOomOptions']),
    close() {
      this.$emit('close');
      this.setOomOptions(this.oomOptions);
    },
  },
  mounted() {
    // sets default values
    this.setOomOptions(this.oomOptions);
  }
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
