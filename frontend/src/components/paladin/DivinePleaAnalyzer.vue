<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>
        This tool (DivineCum) identifies Divine Plea opportunities based on cumulative damage taken in a 15s window, and assume the best time to plea is when either the tank and/or entire raid is in a damage lull. However, as DTPS patterns vary largely from week to week, it is still unclear if insights from a given week will be actionable on subsequent weeks.
      </p>
      <p>
        Recommended plea timings are shaded in red.
      </p>
      <blockquote class="blockquote text-left">
        <p class="mb-0">
          If Cum(t) refers to the cumulative damage taken from t to t + 15, then we can find the best periods to plea twice by minimising Cum(t1) + Cum(t2), subject to t1 > t2 + 60. However, this isn't easily solved.
        </p>
        <br>
        <p class="mb-0">
          We thus define MinCum(t) = s, where s is the time that results in the lowest Cum amounts in the interval 0 to t. MinCum(t) is trivial to calculate, simplying the objective function to Cum(t1) + Cum(MinCum(t1 - 60)).
        </p>
        <footer class="blockquote-footer">Algorithm provided by Lovelace (explanation paraphrased)</footer>
      </blockquote>
      <p>
        Much thanks to Pynkie for providing the original idea, and to Lovelace for providing the algorithm.
      </p>
    </div>

    <div class="row">
      <div class="input-group mb-2" style="width: 100%">
        <input type="text" class="form-control" v-model.number="wclLink" placeholder="Paste WCL Link">
      </div>
      <button v-if="!fetching" @click="run" class="btn btn-primary">Analyze</button>
      <button v-if="fetching" @click="run" class="btn btn-primary">Analyzing.......</button>
    </div>
    <hr>
    <div class="row" v-if="results">
      <div class="col-md-12">
        <BarChart v-if="results"
          :chart-data="chartData"
          :chart-options="chartOptions"
          />
      </div>
    </div>
    <div class="row" v-if="results">
      <div class="input-group mb-2" style="width: 40%">
        <span class="input-group-text" id="basic-addon1">Number of Pleas</span>
        <input type="text" class="form-control" v-model.number="numPleas">
      </div>
      <div class="input-group mb-2" style="width: 40%">
        <span class="input-group-text" id="basic-addon1">Bin Size</span>
        <input type="text" class="form-control" v-model.number="binSize">
      </div>
    </div>
    <div class="row" v-if="results">
      <div class="col-md-12">
        <h4>Best Times to Plea</h4>
        <ul>
          <li v-for="(entry, index) in divinePleaTimings" :key="index">{{ entry }}s</li>
        </ul>
      </div>
    </div>
    <div class="row" v-if="results">
      <div class="col-md-12">
        <h4>Damage Events</h4>
        <ul>
          <li v-for="(entry, index) in results['rawData']" :key="index">
            {{ entry['editedTimestamp'] }}s: {{ entry['ability']['name']}} hit for {{ entry['amount'] }}
        </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';

import BarChart from '../ttoom/BarChart';

const DIVINE_PLEA_DURATION = 15;
const DIVINE_PLEA_COOLDOWN = 60;

export default {
  name: 'PaladinDivinePleaAnalyzer',
  metaInfo: {
    title: 'Paladin Divine CUM Analyzer',
  },
  data() {
    return {
      fetching: false,
      showExplanation: true,
      wclLink: '',
      results: null,
      binSize: 2,
      numPleas: 2,
    };
  },
  components: {
    BarChart,
  },
  computed: {
    divinePleaTimings() {
      if (!this.results || isNaN(this.numPleas) || this.numPleas <= 0) return {};
      return this.divinePlea(this.results['overall'], this.numPleas).sort((a, b) => a - b);
    },
    chartData() {
      if (!this.results || isNaN(this.binSize)) return {};
      let labels = [];
      let data = [];
      let backgroundColors = [];
      let divinePleaIndex = 0,
        pleaStart = this.divinePleaTimings[divinePleaIndex],
        pleaEnd = pleaStart + DIVINE_PLEA_DURATION;

      // we bin results together to make it easier to read
      // for (let i = 0; i < Math.ceil(this.results['overall'].length / this.binSize); i++) {
      for (let i = 0; i < this.results['overall'].length ; i++) {
        if (i % this.binSize === 0) {
          labels.push(i);
          data.push(this.results['overall'][i]);
          // console.log(i)
          // we do a background color check at the start of the bin
          if (i >= pleaStart && i <= pleaEnd) {
            backgroundColors.push('red');
          } else {
            backgroundColors.push('#55a0f0');
            if (i > pleaEnd) {
              divinePleaIndex++;
              if (divinePleaIndex < this.divinePleaTimings.length) {
                pleaStart = this.divinePleaTimings[divinePleaIndex];
                pleaEnd = pleaStart + DIVINE_PLEA_DURATION;
              }
            }
          }
        } else {
          data[data.length - 1] += this.results['overall'][i];
        }
      }

      for (let j = 0; j < data.length; j++) {
        data[j] /= this.binSize;
      }

      return {
        labels: labels,
        datasets: [{
          label: 'DTPS',
          backgroundColor: backgroundColors,
          data: data,
        }]
      }
    },
    chartOptions() {
      if (!this.results) return {};
      return {
        responsive: true,
        onClick: (evt, bars) => {
          // if (bars.length === 0) return;
          // this.getLogOfClickedBar(bars[0]);
        },
        scales: {
          x: {
            // min: Number(this.minXAxis),
            // max: Number(this.maxXAxis),
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
    },
  },
  methods: {
    run() {
      if (this.fetching) return;
      if (this.wclLink.indexOf('fight=') === -1) {
          alert("Invalid URL link - make sure 'fight=xx' is in the link");
          return;
      }

      this.fetching = true;
      this.results = null;
      axios
          .post(`analyzer/paladin/divineplea`, {wclLink: this.wclLink})
          .then((response) => {
            this.fetching = false;
            this.results = response.data;
            console.log(this.results)
            this.showExplanation = false;
          })
          .catch((error)  => {
            alert(error.response.data.message);
            this.fetching = false;
          });
    },
    // given an arr of elements, returns another array where each element corresponds to the
    // cumulative sum of the next n elements (including itself)
    // for instance, if cumForward([1, 2, 3, 4], 2) were to return an arr "cumF"
    // cumF[0] == 3, cumF[2] == 7
    cumForward(arr, n=1) {
      let cum = []; // cum(t) returns a sum of items from index 0 <= t    
      let cumF = []; // cumF(t) returns a sum of items from index t to t + n - 1
      let cumIndex = 0,
        remainingCounter = 0,
        newCumVal;

      // if n is 5, the first value of cumF is actually cum[4], so we loop until we find that first value
      for (let i = 0; i < n; i++) {
        newCumVal = cumIndex == 0 ? arr[0] : arr[cumIndex] + cum[cum.length - 1]
        cum.push(newCumVal)
        cumIndex += 1        
      }
      cumF.push(cum[cum.length - 1])

      // note that cum is ahead of cumF in number of elements
      // if n is 2, then when cumIndex is 3, cumFIndex (not stated directly here) is actually 1
      while (cumIndex < arr.length) {
        newCumVal = arr[cumIndex] + cum[cum.length - 1]
        cum.push(newCumVal)
        
        cumF.push(newCumVal - cum[cum.length - 1 - n])
        cumIndex += 1
      }
      
      // add back the last few items to cumF; note that they will have fewer and fewer elements
      remainingCounter = 1
      while (cumF.length < cum.length) {
        cumF.push(newCumVal - cum[cum.length - 1 - n + remainingCounter])
        remainingCounter += 1
      }
      
      return cumF
    },
    // recusively creates a series of minima array
    // given an arr of cumF numbers, we want to return an array m
    // where m[1][t] == [s], s is the argMin of cumF[0:t], and 1 refers to we only need 1 divine plea timing
    // for the purpose of getting full length divine plea, we might to tell system to ignore last n elements
    // otherwise, the system would try to plea on the last second of a fight since only 1s of damage is considered
    // m[2][t] will return s, where s is [t1, t2] corresponding to the two divine plea timings
    createMinimas(cumF, numPleas, ignoreLastNElements=0, ignoreFirstNElements=0) {
      let m = {}
      
      function minimaHelper(numPleas) {
        // base case
        if (numPleas === 0) return true;
        
        // recursively creates all the preceding m
        minimaHelper(numPleas - 1);
        m[numPleas] = [];
        let currentMinimumVal = Number.POSITIVE_INFINITY;
        let currentMinimumIndex = null;
        let i = 0;
        // invalid values as implies insufficient divine plea
        while (i < DIVINE_PLEA_COOLDOWN * (numPleas - 1)) {
            m[numPleas].push(null)
            i += 1
        }
        
        // basically getting argMin of cumF[0: i], but in more optimised fashion
        while (i < cumF.length) {
          let previousVal = 0
          let minIndices = []
          if (numPleas > 1) {
            minIndices = m[numPleas - 1][i - DIVINE_PLEA_COOLDOWN];
            if (minIndices === null) {
              i++;
              m[numPleas].push(currentMinimumIndex)
              continue;
            }

            for (let index of minIndices) {
              previousVal += cumF[index];
            }
          }
              
          let val = cumF[i] + previousVal
          let index = [i].concat(minIndices) // [t1, t2] refer to the timings of the divine pleas
          if (val < currentMinimumVal && (i < cumF.length - ignoreLastNElements) && (i > ignoreFirstNElements - 1)) {
            currentMinimumIndex = index
            currentMinimumVal = val
            m[numPleas].push(currentMinimumIndex)
          } else {
              m[numPleas].push(currentMinimumIndex);
          }
          i += 1
        }

        return m
      }
      
      return minimaHelper(numPleas)
    },
    divinePlea(arr, numPleas) {
      let cumF = this.cumForward(arr, DIVINE_PLEA_DURATION)
      // we only start counting potential elements after the first damage event
      let damageStartTimestamp = arr.findIndex((entry) => entry > 0);
      if ((arr.length - damageStartTimestamp) < (numPleas - 1) * DIVINE_PLEA_COOLDOWN) {
        alert(`Fight is too short to have ${numPleas} pleas.`);
        return;
      }
      let m = this.createMinimas(cumF, numPleas, DIVINE_PLEA_DURATION - 1, damageStartTimestamp)
      if (numPleas === 1) {
        return m[1][m[1].length - 1];
      }

      let i = DIVINE_PLEA_COOLDOWN * (numPleas - 1);
      let currentMinimumVal = Number.POSITIVE_INFINITY;
      let currentMinimumIndex = -1;
          
      // we loop through from t = DIVINE_PLEA_COOLDOWN to end of list (but need to make sure all pleas are full duration)
      while (i < cumF.length - DIVINE_PLEA_DURATION) {
        let previousVal = 0;
        let minIndices = m[numPleas - 1][i - DIVINE_PLEA_COOLDOWN];
        if (minIndices === null) {
          i++;
          continue;
        }

        for (let index of minIndices) {
          previousVal += cumF[index];
        }

        // and look for the lowest value of cumF(t) + cumF(m(t - DIVINE_PLEA_COOLDOWN))
        let val = cumF[i] + previousVal
        if (val < currentMinimumVal) {
          val = currentMinimumVal
          currentMinimumIndex = i
        }
        i += 1
      }
      return [i].concat(m[numPleas - 1][i - DIVINE_PLEA_COOLDOWN]);
    },
  },
  mounted() {
    // let arr = [0, 5, 4, 2, 3, 5, 3, 1, 2];
    // console.log(this.divinePlea(arr, 3));
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
