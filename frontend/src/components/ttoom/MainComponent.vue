<template>
  <div class="container">
    <div v-if="showExplanation" class="row">
      <p class="text-justify">
        This tool simulates how long it takes to go OOM (ttoom). Click <b>Edit Options</b>, input stats from 80upgrades (including talents), and click <b>Run Simulation</b>. Unlike dps sims, this tool focuses more on spell choice and gameplay choices than gear, as we believe that has the highest impact on healer performance.
      </p>
      <p class="text-justify">
        Please message <b>Trollhealer#8441</b> on Discord if you see any bugs or have suggestions.
        <span v-if="playerClass === 'paladin'">
          Special thanks to <b>Lovelace</b> and <b>Currelius</b> for formula help, <b>Kanga</b> for setting everything up, as well as the rest of the healer cabal for valuable feedback.
        </span>
        <span v-if="playerClass === 'shaman'">
          Created jointly with <b>Lovelace</b>. Special thanks to <b>Kanga</b> for setting everything up.
        </span>
      </p>
    </div>
    
    <div class="row">
      <div class="col-md-4">
          <button class="btn btn-warning" @click="showOptionsModal = true">Edit Options</button>
          <button class="btn btn-primary" @click="runSim">
            {{ fetching ? 'Loading...' : 'Run Simulation' }}
          </button>
      </div>
<!--       <div class="col-md-6">
        <b-form-checkbox v-model="isNormalMode" true-value="yes" false-value="no" switch class="mr-n2">
          <span v-if="isNormalMode"><b>Normal Comparison</b></span>
          <span v-if="!isNormalMode"><b>Trinket Comparison</b></span>
        </b-form-checkbox>
      </div> -->
    </div>

    <player-options
      :is-show="showOptionsModal"
      :player-class="playerClass"
      @close="showOptionsModal = false"
    ></player-options>

    <hr>
    <div class="row" v-if="results">
      <div class="col-md-7">
        <p>Median Time to OOM: <b>{{ results['ttoom'] }}s ({{ formatNumber(results['hps']) }} HPS)</b></p>
        <p>
          Batch Seed: <b>{{ results['batchSeed'] }} </b>
          <span v-if="oomOptions['seed'] !== '' && oomOptions['seed'] > 0 && oomOptions['seed'] === results['batchSeed']">(Seed currently fixed)</span>
        </p>
        <div v-if="playerClass === 'paladin'">
          <p><em>
            HPLD's ttoom has higher variance vs other healers due to Divine Plea breakpoints (amplified by using Darkmoon Card: Greatness).
          </em></p>
          <p>
            <em>The bimodal distribution means a simple median ttoom misses important context - you could have a high median ttoom but also be mana-screwed 30-40% of the time. The histogram (median in red) provides more context, and you can click on bars to see the log on the right.
            </em>
          </p>
        </div>
        <div v-if="playerClass === 'shaman'">
          <p>
            <em>There are large number of proc effects in the shaman toolkit, and a simple median ttoom misses important context. You could have a high median ttoom but also be mana-screwed 30-40% of the time. The histogram (median in red) provides more context, and you can click on bars to see the log on the right.
            </em>
          </p>
        </div>
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
        <div class="col-md-5">
          <textarea class="log" readonly="" v-model="logs"></textarea>  
        </div>
    </div>

    <div class="row gap-top" v-if="results">
      <br>
      <div class="col-md-7">
        <h5>Cast Profile</h5>
        <b-table striped hover :items="this.results['spellsCastedStatistics']"></b-table>
      </div>

      <div class="col-md-5">
        <h5>Mana Generation Breakdown</h5>
        <b-table striped hover :items="mp5Data"></b-table>
      </div>

      <div class="pad-bottom">
        <i>
          The above values for Cast Profile and Mana Generated are median values over 400 runs, and do not come from the same log.
        </i>
      </div>
    </div>

    <div v-if="results && implementationAssumptions.length > 0" class="row gap-top">
      <h5>Assumptions & Known Issues</h5>
      <ol>
        <li v-for="(assumption, index) in implementationAssumptions" :key="index">
          {{ assumption }}
        </li>
      </ol>
    </div>

    <div v-if="results && changeLogs.length > 0" class="row gap-top">
      <h5>Change Logs</h5>
      <ul>
        <li v-for="(changeLog, index) in changeLogs" :key="index">
          <p><b>{{ changeLog['dateAdded'] }}</b></p>
          <p>{{ changeLog['text'] }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

import {mapState, mapMutations} from 'vuex';
import axios from 'axios';
import BarChart from './BarChart';
import PlayerOptions from './PlayerOptionsComponent';

import data from './data';
import textData from './textData';

// https://stackoverflow.com/questions/38085352/how-to-use-two-y-axes-in-chart-js-v2
export default {
  name: 'TTOOM',
  metaInfo: {
    title: 'Time to OOM',
  },
  props: {
    playerClass: String,
  },
  data() {
    return {
      fetching: false,
      isNormalMode: true, // can be either normal mode (run sim for inputted options) or trinket comparison mode
      showExplanation: true,
      showOptionsModal: false,
      results: null,
      selectedLog: null,
      minXAxis: 0,
      maxXAxis: 0,
      isFixedAxis: false,
    };
  },
  components: {
    BarChart,
    PlayerOptions,
  },
  watch: {
    $route (to, from){
      this.reset();
    },
  },
  computed: {
    ...mapState('ttoom', ['oomOptions']),
    changeLogs() {
      return textData['changeLogs'][this.playerClass];
    },
    implementationAssumptions() {
      return textData['implementationAssumptions'][this.playerClass];
    },
    optionsComponent() {
      if (this.playerClass === 'paladin') {
        return 'paladin-options';
      }
      return null;
    },
    playerClassVerbose() {
      if (this.playerClass === 'paladin') {
        return 'Holy Paladin';
      } else if (this.playerClass === 'shaman') {
        return 'Resto Shaman'
      } else {
        return '';
      }
    },
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
    ...mapMutations('ttoom', ['setOomOptions']),
    formatNumber (num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    },
    basicNumberValidation(num) {
      if (isNaN(num) || num === '' || num < 0) {
        return false;
      }
      return true;
    },
    // passes a copy to avoid dirtying data
    reset() {
      let _data = JSON.parse(JSON.stringify(data[this.playerClass]['oomOptions']));
      this.setOomOptions(_data);
    },
    runSim() {
      if (this.fetching) return;
      // validation
      if (this.oomOptions['trinkets'].length > 2) {
        alert('You can only select up to two trinkets.');
        return;
      }

      for (let key in this.oomOptions['cpm']) {
        let entry = this.oomOptions['cpm'][key];
        if (!this.basicNumberValidation(entry)) {
          alert('Please enter a valid number for : ' + key);
          return;
        }
      }

      // class specific validation
      if (this.playerClass === 'paladin') {
        if (!this.oomOptions['tier']['2pT7'] && this.oomOptions['tier']['4pT7']) {
          alert('4PT7 was selected but not 2PT7');
          return;
        }

        if (this.oomOptions['talents']['enlightenedJudgements'] < 0 || this.oomOptions['talents']['enlightenedJudgements'] > 2
            || !Number.isInteger(this.oomOptions['talents']['enlightenedJudgements'])) {
          alert('Please input a valid value for Enlightened Judgements');
          return;
        }

        if (!this.basicNumberValidation(this.oomOptions['glyphHolyLightHits'])) {
          alert('Please enter a valid number for glyphHolyLightHits');
          return;
        }

        if (this.oomOptions['glyphHolyLightHits'] < 0 || this.oomOptions['glyphHolyLightHits'] > 5 ||
              !Number.isInteger(this.oomOptions['glyphHolyLightHits'])) {
            alert('glyphHolyLightHits should be an integer between 0 and 5');
            return; 
        }
      } else if (this.playerClass === 'shaman') {
        if (this.oomOptions['finalGlyph'] === 'lesserHealingWave') {
          let num = this.oomOptions['lesserHealingWaveCastPercentageOnEarthShield'];
          if (!this.basicNumberValidation(num) || num < 0 || num > 100) {
            alert('Please insert valid number for lesserHealingWaveCastPercentageOnEarthShield');
            return;
          }
        }
      }

      this.fetching = true;
      axios
          .post(`ttoom/${this.playerClass}`, {options: this.oomOptions, playerClass: this.playerClass, isNormalMode: this.isNormalMode})
          .then((response) => {
            this.fetching = false;
            this.showExplanation = false;
            this.results = response.data;
            console.log(this.results);
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
      if (this.fetching) return;
      this.fetching = true;

      axios
          .post(`ttoom/paladin/${entry.seed}`, {options: this.oomOptions, playerClass: this.playerClass})
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
    this.reset();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.log {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.pad-bottom {
  padding: 0px 0px 20px;
}

.gap-top {
  margin-top: 40px;
}

ol {
  width: 100%;
}
</style>
