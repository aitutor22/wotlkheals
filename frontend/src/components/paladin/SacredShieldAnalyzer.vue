<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>
        to be added
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
    <div v-if="results" class="col-md-12">
      <div class="row">
        <b-form-checkbox v-model="is4pT8" :true-value="true" :false-value="false" switch class="mr-n2">
          4PT8?
        </b-form-checkbox>
      </div>
      <div class="row">
        <h3>Total Sacred Shield Procs: {{ transformedData[1] }}</h3>
      </div>
      <div class="row">
        <h3>Total Sacred Shield Healing: {{ transformedData[2] }}</h3>
      </div>
      <div class="row">
        <ul>
          <li v-for="(row, index) in transformedData[0]" :key="index">
            {{ row }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';

export default {
  name: 'SacredShieldAnalyzer',
  metaInfo: {
    title: 'Sacred Shield Analyzer',
  },
  data() {
    return {
      fetching: false,
      showExplanation: true,
      wclLink: '',
      results: null,
      is4pT8: false,
    };
  },
  computed: {
    transformedData() {
      if (!this.results) return;

      function helper(rawData, sacredShieldICDDuration, sacredShieldAmount) {
        let logs = [];
        let sacredShieldAvailableTimestamp = 0;
        let totalSacredShieldProcs = 0;
        let totalSacredShieldHealing = 0;
        let sacredShieldRemaining = 0;
        for (let entry of rawData) {
          // add/refresh sacred shield
          if (entry['timestamp'] > sacredShieldAvailableTimestamp) {
            sacredShieldRemaining = sacredShieldAmount;
            totalSacredShieldProcs++;
            sacredShieldAvailableTimestamp = entry['timestamp'] + sacredShieldICDDuration;
            logs.push('proccing sacred shield at ' + entry['timestamp'] / 1000);
            continue
          }

          if (sacredShieldRemaining > 0) {
            let damage = entry['amount'] + (entry['absorbed'] || 0);
            let absorbed = Math.min(damage, sacredShieldRemaining);
            sacredShieldRemaining -= absorbed;
            totalSacredShieldHealing += absorbed;
          }
        }

        return [logs, totalSacredShieldProcs, totalSacredShieldHealing];
      }
      return helper(this.results.rawData, (this.is4pT8 ? 4000 : 6000), 2500);
    },
  },
  methods: {
    run() {
      if (this.fetching) return;
      if (this.wclLink.indexOf('source=') === -1) {
          alert("Invalid URL link - make sure 'source=xx' is in the link");
          return;
      }

      this.fetching = true;
      this.results = null;
      // divine plea also asks for damage taken
      axios
          .post(`analyzer/paladin/divineplea`, {wclLink: this.wclLink})
          .then((response) => {
            this.fetching = false;
            this.results = response.data;
            this.showExplanation = false;
          })
          .catch((error)  => {
            alert(error.response.data.message);
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
</style>
