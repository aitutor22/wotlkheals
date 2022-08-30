<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>
        This tool generates provides more context to spellpower by accounting for overhealing. Consider an extreme situation where every spell is overheals by just 1. Despite the low overhealing, spellpower actually has 0 value in this case since every spell is already overhealing.
      </p>
      <p>
        This tool loops through each healing event to determine the real value of spellpower; to use, paste a specific fight with your HPLD selected. Note: 1) assumptions have been made with Sacred Shield to avoid overcounting small hits, 2) JoL, LoH, FoL HoT and GotN are not considered. Inspired by <b>Holypalaswe</b>.
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
      <ul>
        <h3>Marginal increase in healing for a whole fight from adding +1 sp</h3>
        <li>
          Useful spellpower: <b>{{ Math.floor(results['overall']['usefulSpellpowerPercentage'] * 100) }}%</b> 
        </li>
        <li>
          Total hits: {{ results['overall']['hitsTotal'] }} ({{ results['overall']['hitsOverHeal'] }} overheals)
        </li>
        <li>
          Additional Healing: +{{ Math.floor(results['overall']['nettAdditionalHealAmount']) }} net healing (+{{ Math.floor(results['overall']['rawAdditionalHealAmount']) }} raw healing)
        </li>
      </ul>
    </div>
    <div v-if="results">
      <hr>
      <h4>Breakdown Per Spell</h4>
      <div v-for="(entry, index) in results['spells']" :key="index">
        <h5>{{ entry['key'] }}</h5>
        <ul>
          <li>
            Total hits: {{ entry['hitsTotal'] }} ({{ entry['hitsOverHeal'] }} overheals)
          </li>
          <li>
            Additional Healing: +{{ Math.floor(entry['nettAdditionalHealAmount']) }} net healing (+{{ Math.floor(entry['rawAdditionalHealAmount']) }} raw healing)
          </li>
          <li>
            Useful spellpower: {{ Math.floor(entry['usefulSpellpowerPercentage'] * 100) }}% 
          </li>
      </ul>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';

export default {
  name: 'PaladinOverhealingAnalyzer',
  props: {
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
          .post(`analyzer/paladin/overhealing`, {wclLink: this.wclLink})
          .then((response) => {
            this.fetching = false;
            console.log(response.data);
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
