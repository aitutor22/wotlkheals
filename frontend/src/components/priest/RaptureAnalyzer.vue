<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>
        This tool aims to help the player identify rapture opportunties by running through your log, and identifying situations when multiple players take damage at the exact same timestamp.
      </p>
      <p>
        To start, paste the wcl link of a specific fight and the abilities-timestamp pairs that hit at least two targets will be shown. Note that melee attacks are not considered as they are unlikely to be part of a multiple rapture combo.
      </p>
      <p>
        For each ability, the highest bubble rank that can be used to ensure it is broken immediately is shown for your convenience. To see a breakdown of PWS values by rank, please see <a href="https://docs.google.com/spreadsheets/d/1QPo0d4rUYFvvsRt2Fpu5_2DlcWeeGylJNx6qCCI9ybk/edit#gid=0"><b>Bael's sheet</b></a>.
      </p>
    </div>

    <div class="row">
      <div class="input-group mb-2" style="width: 100%">
        <input type="text" class="form-control" v-model.number="wclLink" placeholder="Paste WCL Link">
      </div>
      <button v-if="!fetching" @click="run" class="btn btn-primary">Analyze</button>
      <button v-if="fetching" @click="run" class="btn btn-primary">Analyzing.......</button>
    </div>

    <div class="row margin-top-40" v-if="results && !fetching">
      <h5 style="width: 100%">Select other fights</h5>
      <v-select v-if="results" style="width: 100%"
        :options="results['otherFightOptions']" v-model="currentFightId"
        :reduce="fight => fight.fightId"
        label="label"
      >
      </v-select>      
    </div>


    <div class="row margin-top-40" v-if="results && results['data'].length === 0">
      <h3>No rapture opportunities found.</h3>
    </div>

    <div v-if="results && results['data'].length > 0" class="container margin-top-40 no-pad-left">
      <h3>Rapture Opportunities</h3>
      <br>
      <div class="row">
        <b-form-checkbox v-model="showHighDamageItemsOnly" :true-value="true" :false-value="false" switch class="mr-n2">
          Show only high damage abilities
        </b-form-checkbox>
      </div>
      <div class="row mt-2" v-if="showHighDamageItemsOnly">
        <div class="input-group mb-2" style="width: 100%">
        <span class="input-group-text" id="basic-addon1"
        v-b-tooltip.hover title="Only abilities that deal a certain amount of damage will be shown">Minimum damage to show ability</span>
        <input type="text" class="form-control" v-model.number="damageThreshold">
        </div>
      </div>
      <div class="row">
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1"
          v-b-tooltip.hover title="PWS values are calculated based off inputted spellpower">Spellpower</span>
          <input type="text" class="form-control" v-model.number="spellPower">
        </div>
      </div>

      <br>
      <div class="row">
        <b-table :items="tableData"></b-table>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';

// based off bael's sheet
// https://docs.google.com/spreadsheets/d/1QPo0d4rUYFvvsRt2Fpu5_2DlcWeeGylJNx6qCCI9ybk/edit#gid=0
// first element in rank 14, al the way to rank 1
const PWS_BASE_HEALS = [2230, 1951, 1286, 1144, 964, 783, 622, 499, 394, 313, 244, 166, 94, 48];
const DOWNRANKING_PENALTY = [1, 1, 0.8, 0.55, 0.35, 0.05, 0, 0, 0, 0, 0, 0, 0, 0];
const COLOR_VARIANTS = ['danger', 'primary', 'success', 'warning', 'info', 'light', 'dark'];

export default {
  name: 'PriestRaptureAnalyzer',
  metaInfo: {
    title: 'Rapture Analyzer',
  },
  data() {
    return {
      showExplanation: true,
      fetching: false,
      wclLink: '',
      results: null,
      showHighDamageItemsOnly: true,
      currentFightId: '',
      damageThreshold: 3000, // to determine what to show
      spellPower: 2000,
    };
  },
  watch: {
    currentFightId(newVal, oldVal) {
      // we only want to repull when user has already run once, and is selecting from select input
      if (oldVal === '' || isNaN(oldVal) || newVal === oldVal) return;
      this.runHelper(newVal);
    },
  },
  computed: {
    PWS_HEALS() {
      return PWS_BASE_HEALS.map((baseHeal, index) => {
        return Math.floor((baseHeal +((0.8068 + 0.08 * 5) * DOWNRANKING_PENALTY[index]) * this.spellPower) *
          (1 + 3 * 0.05) * (1 + 0.02 * 2 + 0.01 * 5));
      })
    },
    tableData() {
      let data = JSON.parse(JSON.stringify(this.results['data']));
      // assigns a pws rank based on spellpower and avgDamagTaken for each ability
      for (let i = 0; i < data.length; i++) {
        let rank = this.findPWSRank(data[i]['avgDamageTaken']);
        data[i]['PWS Rank'] = rank;
      }

      // https://www.benmvp.com/blog/quick-way-sort-javascript-array-multiple-fields/
      // sort first by pws rank, then by number of hits
      data.sort((a, b) => (b['PWS Rank'] - a['PWS Rank']) || (b['numHits'] - a['numHits']) || (b['avgDamageTaken'] - a['avgDamageTaken']));

      // we want to ensure that the key colors are taken by abilities that appear at the top (hence need rank -> hits)
      let colorMap = {},
        colorIndex = 0;
      for (let j = 0; j < data.length; j++) {
        let name = data[j]['name']
        if (!(name in colorMap)) {
          // assigns a color; if we run out of colors, then use 'dark'
          colorMap[name] = (colorIndex < COLOR_VARIANTS.length - 1) ? COLOR_VARIANTS[colorIndex++] : 'dark';
        }
        data[j]['_rowVariant'] = colorMap[name];
      }


      if (!this.showHighDamageItemsOnly) return data;
      return data.filter((entry) => {
        return Number(entry['avgDamageTaken']) >= this.damageThreshold;
      });
    }
  },
  methods: {
    // returns the highest rank PWS that can fully absorb all the damage
    // first element is rank 14
    findPWSRank(damage) {
        damage = Number(damage);
        for (let i = 0; i < this.PWS_HEALS.length; i++) {
            if (damage >= this.PWS_HEALS[i]) {
                return 14 - i;
            }
        }
        return 1;
    },
    // if a specific fight id is passed, then we use that, regardless of what the fight id is on the wcl link
    runHelper(specificFightId=null) {
      this.fetching = true;
      this.results = null;
      let toPass = {wclLink: this.wclLink};
      if (specificFightId) {
        toPass['fightId'] = specificFightId;
      }

      axios
          .post(`analyzer/priest/rapture`, toPass)
          .then((response) => {
            this.fetching = false;
            console.log(response.data);
            this.results = response.data;
            this.currentFightId = Number(response.data['currentFightId']);
            this.showExplanation = false;
          })
          .catch((error)  => {
            alert(error.response.data.message);
            this.fetching = false;
            this.showExplanation = false;
          });
    },
    run() {
      if (this.fetching) return;
      if (this.wclLink.indexOf('fight=') === -1) {
          alert("Invalid URL link - make sure 'fight=yy' is in the link");
          return;
      }
      this.runHelper();
    }
  },
  mounted() {
    console.log('mounting');
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.no-pad-left {
  padding-left: 0px;
}

.margin-top-40 {
  margin-top: 40px;
}
</style>
