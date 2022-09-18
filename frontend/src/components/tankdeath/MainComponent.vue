<template>
  <div class="container">
    <div class="row col-md-12 mt-3 explanation" v-if="showExplanation">
      <p>
        This is an updated version of the TBC tank death analyzer, with several key changes reflecting the <a href="https://bit.ly/wotlk-healing-primer">evolution in the WOTLK healing meta</a>.
      </p>
      <h6>Notable Changes</h6>
      <p>
        <ul>
          <li>
            There is a shift from clear bifurcation of tank/raid healing duties towards a shared responsibility in keeping the tank alive, and healing assignments are no longer a required input.
          </li>
          <li>
            Druids no longer required to maintain lifeblooms on tanks, and this tracking has been removed.
          </li>
          <li>
            Tank, healing and raid cooldowns play a much bigger part in keeping tanks alive, and will be included in future updates.
          </li>
        </ul>
      </p>
<!--       <p>
        Reviewing tank death logs is a time-consuming activity. This tool checks the three common causes of tank deaths
        (<a class="dotted" v-b-tooltip.hover title="Direct Heals exclude HOTS, Earth Shield, Chain Heal bounces, etc"><b>lack of direct heals</b></a>, 
        <a class="dotted" v-b-tooltip.hover title="Tracks if there are 80% uptime of 3x lifebloom stacks"><b>3x lifeblooms</b></a>, or
        <a class="dotted" v-b-tooltip.hover title="Demo Shout, Thunderclap, Scorpid Sting, Screech"><b>debuffs</b></a>), helping a raid improve on the next attempt.
      </p> -->
      <p>
        Special thanks to Kanga and the rest of the Cabal for their healing insights. If you see any bugs, please message Trollhealer#8441 on Discord.
      </p>
    </div>

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
  name: 'TankDeathAnalyzer',
  metaInfo: {
    title: 'Tank Death Analyzer',
  },
  data() {
    return {
      fetching: false,
      showExplanation: true,
      wclLink: '',
      results: null,
    };
  },
  computed: {
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
