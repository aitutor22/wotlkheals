<template>
  <div class="container">
    <div class="row">
      <div class="input-group mb-2" style="width: 100%">
        <input type="text" class="form-control" v-model.number="wclLink" placeholder="Paste WCL Link">
      </div>
      <button v-if="!fetching" @click="run" class="btn btn-primary">Analyze</button>
      <button v-if="fetching" @click="run" class="btn btn-primary">Analyzing.......</button>
    </div>

    <div class="row" v-if="results">
      <p>Total Casts: {{ results['totalCasts'] }}</p>
    </div>
    <div v-if="results">
      <h3>Cast Breakdown</h3>
      <p>Breaks down what % of Chain Heal hits 1 target vs 2 targets, etc</p>
      <ul>
        <li v-for="(entry, index) in results['castBreakdown']" :key="index">
          {{ entry['targetsHit'] }} target: {{ entry['amount'] }} casts ({{ Math.floor(entry['percentage'] * 100)}}%)
      </li>
      </ul>
    </div>
    <div v-if="results">
      <h3>Overhealing % of Chain Heal Hit</h3>
      <p>If 2 hit overhealing % is 20%, this means that the the second hit (aka first CH bounce) tends to overheal by 20%.</p>
      <ul>
        <li v-for="(entry, index) in results['castBreakdown']" :key="index">
          Hit {{ entry['targetsHit'] }}: {{ Math.floor(entry['overhealingPercent'] * 100)}}%
      </li>
      </ul>
    </div>
  </div>
</template>

<script>

import axios from 'axios';

export default {
  name: 'ShamanChainHealAnalyzer',
  props: {
  },
  data() {
    return {
      fetching: false,
      wclLink: '',
      results: null,
    };
  },
  computed: {
  },
  methods: {
    run() {
      if (this.fetching) return;
      if (this.wclLink.indexOf('source=') === -1 || this.wclLink.indexOf('fight=') === -1) {
          alert("Invalid URL link - make sure 'source=xx' and 'fight=yy' are in the link");
          return;
      }

      this.fetching = true;
      this.results = null;
      axios
          .post(`analyzer/shaman/chainheal`, {wclLink: this.wclLink})
          .then((response) => {
            this.fetching = false;
            console.log(response.data);
            this.results = response.data;
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
