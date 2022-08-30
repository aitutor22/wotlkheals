<template>
  <div class="container">
    <p>
      This tool aims to determine a more accurate spellpower value by accounting for overhealing. Consider an extreme situation where every spell a HPLD casts is overhealing by just 1%. Despite the low overhealing %, spellpower actually has 0 value in this case since every spell is already overhealing.
    </p>
    <p>
      This tool loops through each healing event to determine the real value of spellpower, and to use, please paste a specific fight with your HPLD selected. Note: 1) assumptions have been made with Sacred Shield to avoid overcounting small hits, 2) spells like JoL, LoH, FoL HoT and GotN are not considered. Inspired by <b>Holypalaswe</b>.
    </p>

    <div class="row">
      <div class="input-group mb-2" style="width: 100%">
        <input type="text" class="form-control" v-model.number="wclLink" placeholder="Paste WCL Link">
      </div>
      <button v-if="!fetching" @click="run" class="btn btn-primary">Analyze</button>
      <button v-if="fetching" @click="run" class="btn btn-primary">Analyzing.......</button>
    </div>

    <div class="row" v-if="results">
      <ul>
        <p>What is the marginal increase in healing for a whole fight from adding +1 spell power?</p>
        <li>
          Total hits: {{ results['overall']['hitsTotal'] }} ({{ results['overall']['hitsOverHeal'] }} overhealed)
        </li>
        <li>
          Additional Healing: +{{ Math.floor(results['overall']['nettAdditionalHealAmount']) }} net healing (+{{ Math.floor(results['overall']['rawAdditionalHealAmount']) }} raw healing)
        </li>
        <li>
          Useful spellpower: {{ Math.floor(results['overall']['usefulSpellpowerPercentage'] * 100) }}% 
        </li>
      </ul>
    </div>
    <div v-if="results">
      <h3>Breakdown Per Spell</h3>
      <div v-for="(entry, index) in results['spells']" :key="index">
        <h4>{{ entry['key'] }}</h4>
        <ul>
          <li>
            Total hits: {{ entry['hitsTotal'] }} ({{ entry['hitsOverHeal'] }} overhealed)
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
          .post(`analyzer/paladin/overhealing`, {wclLink: this.wclLink})
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
