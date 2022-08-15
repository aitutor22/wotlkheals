<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>
        This tool simulates how long it takes for a Holy Paladin to go OOM (ttoom), especially due to the high mana cost of Holy Light. Given the high number of procs in the hpld toolkit, the tool simulates 300 runs and returns the median ttoom, and the specific statistics from that run.
      </p>
      <p>The tool assumes the player incorporates slight pauses after every instant cast (e.g. HS) to allow for melee hits to proc Seal of Wisdom. Maintenance spells like Sacred Shield and Beacon are not currently considered in the sim, though we assume an extra 100mp5 from SoW under "Others" for meleeing during these spells.</p>
      <p>Please input raid-buffed values for spellpower, mana pool and crit chance (do not add crit from talents). Note: do not change stats from trinkets to these values as the tool will automatically calculate it.</p>
      <p>
        Special thanks to Lovelace and Currelius for formula help, as well as the rest of the healer cabal for valuable feedback and beta testing.
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
          <span class="input-group-text" id="basic-addon1">Mana Pool</span>
          <input type="text" class="form-control" v-model.number="oomOptions['manaPool']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">HL Cast Time</span>
          <input type="text" class="form-control" v-model.number="oomOptions['castTimes']['HOLY_LIGHT']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">HS CPM </span>
          <input type="text" class="form-control" v-model.number="oomOptions['holyShockCPM']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Avg hit from glyph HL</span>
          <input type="text" class="form-control" v-model.number="oomOptions['glyphHolyLightHits']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">MP5 From Gear & Buffs</span>
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
          <span class="input-group-text" id="basic-addon1">Crit Chance %</span>
          <input type="text" class="form-control" v-model.number="oomOptions['critChance']">
        </div>

        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="2pT7" v-model="oomOptions['2pT7']">
          <label class="form-check-label" for="2pT7">2pT7</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="4pT7" v-model="oomOptions['4pT7']">
          <label class="form-check-label" for="4pT7">4pT7</label>
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
      </div>

      <div class="col-4">
        <b>Mana Options</b>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="selfLoh" v-model="oomOptions['manaOptions']['selfLoh']">
          <label class="form-check-label" for="selfLoh">Self LoH (Divinity)</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="injector" v-model="oomOptions['manaOptions']['injector']">
          <label class="form-check-label" for="injector">Mana Injector</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="innervate" v-model="oomOptions['manaOptions']['innervate']">
          <label class="form-check-label" for="innervate">Innervate</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="manaTideTotem" v-model="oomOptions['manaOptions']['manaTideTotem']">
          <label class="form-check-label" for="manaTideTotem">Mana Tide Totem</label>
        </div>
      </div>
    </div>

    <hr>
    <div class="row" v-if="results">
      <div class="col-7">
        <p>Median Time to OOM: <b>{{ results['ttoom'] }}s</b></p>
        <p>
          HPLD's ttoom has higher variance vs other healers due to Divine Plea breakpoints (amplified by using Darkmoon Card: Greatness).
        </p>
        <p>
          The bimodal distribution means a simple median/mean ttoom misses important context - you could have a high median ttoom but also be mana-screwed 30-40% of the time. The histogram (median in red) provides more contex, and you can click on bars to see the log on the right.</p>
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
      <div class="col-5">
        <h5>Mana Generation Breakdown</h5>
        <b-table striped hover :items="mp5Data"></b-table>
      </div>

      <div class="col-5 offset-2">
        <h5>Cast Profile</h5>
        <b-table striped hover :items="tableData"></b-table>
      </div>
      <div class="pad-bottom">
        <i>
          The above values for Cast Profile and Mana Generated are median values over 300 runs, and do not come from the same log.
        </i>
      </div>
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
        castTimes: {
          HOLY_LIGHT: 1.6,
        },
        manaOptions: {
          selfLoh: false,
          injector: false,
          innervate: false,
          manaTideTotem: false,
        },
        trinkets: ['soup', 'eog'],
        holyShockCPM: 3,
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
    tableData() {
      let results = [
        // {spell: 'Holy Light', CPM: 20.5, HPS: 20000, 'Crit %': 42},
      ];
      return results;
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
