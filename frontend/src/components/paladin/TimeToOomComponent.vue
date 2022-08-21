<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>
        This tool simulates how long it takes for a Holy Paladin to go OOM (ttoom). Hover over the fields to see a quick explanation. Note: do not add stats from trinkets to spellpower, crit, etc as the tool will automatically calculate it.
      </p>
      <p>
        Two warnings - firstly, due to Divine Plea and numerous procs in the HPLD toolkit, there is high variance in ttoom. Players that have mastered the intricacies of Holy Paladin from playing TBC can easily adjust their cast profile, but it is recommended to not fixate on median ttoom, and also consider unlucky situations. Secondly, if a fight is shorter than 5 mins, then the MP5 and ttoom generated from Owl is theoretically inflated (not an issue if the player is aggressively swapping trinkets that go off cooldown).
      <p>
        This tool is in alpha and thus buggy and please message <b>Trollhealer#8441</b> on Discord if you see any bugs or have suggestions. Special thanks to <b>Lovelace</b> and <b>Currelius</b> for formula help, <b>Kanga</b> for setting everything up, as well as the rest of the healer cabal for valuable feedback and testing of beta values.
      </p>
    </div>
<!--     <div class="row chart-container">
      <div class="col-12">
        <bar-chart
          v-if="chartdata"
          id="chart"
          :chart-data="chartdata"
          :options="chartoptions"
           style="height: 350px" />
      </div>
    </div> -->
    <div class="row">
      <div class="col-4">
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
        <div>
          <button class="btn btn-primary" @click="runSim">
            {{ fetching ? 'Loading...' : 'Run Simulation' }}
          </button>
<!--           <button class="btn btn-success slight-offset-left" @click="getManaDetails">Details from logs</button> -->
          <!-- <button class="btn btn-danger slight-offset-left" @click="reset">Reset</button> -->
        </div>
      </div>

      <div class="col-4">
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
      </div>

      <div class="col-4">
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
      </div>
    </div>

    <hr>
    <div class="row" v-if="results">
      <div class="col-7">
        <p>Median Time to OOM: <b>{{ results['ttoom'] }}s ({{ formatNumber(results['hps']) }} HPS)</b></p>
        <p><em>
          HPLD's ttoom has higher variance vs other healers due to Divine Plea breakpoints (amplified by using Darkmoon Card: Greatness).
        </em></p>
        <p>
          <em>The bimodal distribution means a simple median/mean ttoom misses important context - you could have a high median ttoom but also be mana-screwed 30-40% of the time. The histogram (median in red) provides more context, and you can click on bars to see the log on the right.
          </em>
        </p>
        <div>
          <input type="text" name="" v-model="minXAxis">
          <input type="text" name="" v-model="maxXAxis">
          <button class="btn btn-success btn-sm" @click="isFixedAxis = !isFixedAxis">
            {{ !isFixedAxis ? "Fix Axis?" : "Unfix Axis?" }}
          </button>
        </div>
    
          <BarChart
            :chart-data="chartData"
            :chart-options="chartOptions"
            />
        </div>
        <div class="col-5">
          <textarea class="log" readonly="" v-model="logs"></textarea>  
        </div>
    </div>

    <div class="row gap-top" v-if="results">
      <br>
      <div class="col-7">
        <h5>Cast Profile</h5>
        <b-table striped hover :items="this.results['spellsCastedStatistics']"></b-table>
      </div>

      <div class="col-5">
        <h5>Mana Generation Breakdown</h5>
        <b-table striped hover :items="mp5Data"></b-table>
      </div>

      <div class="pad-bottom">
        <i>
          The above values for Cast Profile and Mana Generated are median values over 400 runs, and do not come from the same log.
        </i>
      </div>
    </div>

    <div v-if="results" class="row gap-top">
      <h5>Implementation Assumptions & Known Issues</h5>
      <ol>
        <li>The following have NOT been implented yet: Divine Favour, FoL Infusion of Light (currently the system will automatically prioritise HL when Infusion of Light is up), and standalone gcds used for Beacon and Sacred Shield.</li>
        <li>
          Sacred Shield, Beacon of Light and Judgement are not casted in the sim, but an expected value for SoW procs is automatically calculated based on 4 hits a min (Judgement counts as 2 hits) and added to MP5.
        </li>
        <li>
          Soup and EoG procs are directly subtracted from the spell that procced it rather than the following spell. This is both for implemention simplicity and also to reflect that spells with multiple chances to proc soup will have lower blended mana cost.
        </li>
        <li>
          For instants to proc SoW, the player might to pause for a very short while to allow the hit to go off when using a 1.8 speed weapon. Currently, the system does not implement this delay as more work needs to be done to determine how long, if any, a pause is required.
        </li>
        <li>When infusion of light is active, Holy Light is always casted unless you have set HL cpm to 0.</li>
        <li>
          There are minor rounding issues which can slightly increase the CPM shown.
        </li>
      </ol>
    </div>
  </div>
</template>

<script>

import axios from 'axios';
import BarChart from '../BarChart'

// https://stackoverflow.com/questions/38085352/how-to-use-two-y-axes-in-chart-js-v2
export default {
  name: 'PaladinTTOOM',
  props: {
  },
  data() {
    return {
      fetching: false,
      showExplanation: true,
      results: null,
      selectedLog: null,
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
      minXAxis: 0,
      maxXAxis: 0,
      isFixedAxis: false,
    };
  },
  components: {
    BarChart,
  },
  computed: {
    logs() {
      if (!this.selectedLog) return;
      return this.selectedLog.join('\n');
    },
    mp5Data() {
      if (!this.results || (typeof this.results['manaStatistics'] === 'undefined')) return;
      let results = [];
      for (let i = 0; i < this.results['manaStatistics'].length; i++) {
        let entry = this.results['manaStatistics'][i];
        entry['MP5'] = this.formatNumber(entry['MP5']);
        results.push(entry);
      }

      return results;
    },
    chartData() {
      if (!this.results || (typeof this.results['chartDetails'] === 'undefined')) return;

      function createBackgroundColors(numBars, medianIndex) {
        let toReturn = [];
        for (let i = 0; i < numBars; i++) {
          // default color
          toReturn.push('#439af8');
        }
        // color of median
        toReturn[medianIndex] = '#f87979';
        return toReturn;
      }

      return {
        labels: this.results['chartDetails']['labels'],
        datasets: [{
          label: 'Counts',
          backgroundColor: createBackgroundColors(this.results['chartDetails']['labels'].length,
            this.results['chartDetails']['medianIndex']),
          data: this.results['chartDetails']['values'],
          // https://www.chartjs.org/docs/3.2.0/charts/bar.html
          // following two lines make it a histogram
          barPercentage: 1,
          categoryPercentage: 1,
        }]
      }
    },
    chartOptions() {
      if (!this.results || (typeof this.results['chartDetails'] === 'undefined')) return;
      return {
        responsive: true,
        onClick: (evt, bars) => {
          if (bars.length === 0) return;
          this.getLogOfClickedBar(bars[0]);
        },
        scales: {
          x: {
            min: Number(this.minXAxis),
            max: Number(this.maxXAxis),
            type: 'linear',
            title: {
              display: true,
              text: 'Time to OOM (s)',
            },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              stepSize: 10,
            }
          }
        },
      };
    }, // end chartOptions
  },
  methods: {
    formatNumber (num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    },
    basicNumberValidation(num) {
      if (isNaN(num) || num === '' || num < 0) {
        return false;
      }
      return true;
    },
    runSim() {
      if (this.fetching) return;

      // validation
      if (this.oomOptions['trinkets'].length > 2) {
        alert('You can only select up to two trinkets.');
        return;
      }
      if (!this.oomOptions['2pT7'] && this.oomOptions['4pT7']) {
        alert('4PT7 was selected but not 2PT7');
        return;
      }

      if (this.oomOptions['talents']['enlightenedJudgements'] < 0 || this.oomOptions['talents']['enlightenedJudgements'] > 2
          || !Number.isInteger(this.oomOptions['talents']['enlightenedJudgements'])) {
        alert('Please input a valid value for Enlightened Judgements');
        return;
      }

      for (let key in this.oomOptions['cpm']) {
        let entry = this.oomOptions['cpm'][key];
        if (!this.basicNumberValidation(entry)) {
          alert('Please enter a valid number for : ' + key);
          return;
        }
      }

      for (let otherField of ['manaPool', 'glyphHolyLightHits', 'critChance']) {
        if (!this.basicNumberValidation(this.oomOptions[otherField])) {
          alert('Please enter a valid number for : ' + otherField);
          return;
        }
      }

      if (this.oomOptions['glyphHolyLightHits'] < 0 || this.oomOptions['glyphHolyLightHits'] > 5 ||
            !Number.isInteger(this.oomOptions['glyphHolyLightHits'])) {
          alert('glyphHolyLightHits should be an integer between 0 and 5');
          return; 
      }

      this.fetching = true;
      axios
          .post('ttoom/paladin', this.oomOptions)
          .then((response) => {
            this.fetching = false;
            this.showExplanation = false;
            console.log(response.data);
            this.results = response.data;
            this.selectedLog = response.data['logs'];
            if (!this.isFixedAxis) {
              this.minXAxis = Number(this.results['chartDetails']['minXAxis']);
              this.maxXAxis = Number(this.results['chartDetails']['maxXAxis']);
            }
          })
          .catch((error)  => {
            console.log(error);
            this.fetching = false;
          });
    },
    getLogOfClickedBar(data) {
      let index = data['index'],
        entry = this.results['chartDetails']['exampleEntries'][index];
      console.log(entry);
      if (this.fetching) return;
      this.fetching = true;

      axios
          .post(`ttoom/paladin/${entry.seed}`, this.oomOptions)
          .then((response) => {
            this.fetching = false;
            this.selectedLog = response.data;
          })
          .catch((error)  => {
            console.log(error);
            this.fetching = false;
          }); 
    }
  },
  mounted() {
    console.log('mounting');
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.log {
  width: 100%;
  height: 100%;
}

.pad-bottom {
  padding: 0px 0px 20px;
}

.gap-top {
  margin-top: 40px;
}
</style>
