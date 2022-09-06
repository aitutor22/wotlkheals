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
        For each ability, the highest bubble rank that can be used to ensure it is broken immediately is shown for your convenience (based on 2000 spellpower). To see a breakdown of PWS values by rank, please see <a href="https://docs.google.com/spreadsheets/d/1QPo0d4rUYFvvsRt2Fpu5_2DlcWeeGylJNx6qCCI9ybk/edit#gid=0"><b>Bael's sheet</b></a>.
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
      <h3>No multiple rapture opportunities found.</h3>
    </div>

    <div v-if="results && results['data'].length > 0" class="container mt-3 no-pad-left">
      <h3>Rapture Opportunities</h3>
      <br>
      <div class="row">
        <b-form-checkbox v-model="showHighDamageItemsOnly" :true-value="true" :false-value="false" switch class="mr-n2">
          Show only abilities >= 2k damage
        </b-form-checkbox>
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

export default {
  name: 'PriestRaptureAnalyzer',
  props: {
  },
  data() {
    return {
      showExplanation: true,
      fetching: false,
      wclLink: '',
      results: null,
      showHighDamageItemsOnly: false,
      currentFightId: '',
    };
  },
  watch: {
    currentFightId(newVal, oldVal) {
      console.log(newVal, oldVal);
      // we only want to repull when user has already run once, and is selecting from select input
      if (oldVal === '' || isNaN(oldVal) || newVal === oldVal) return;
      this.runHelper(newVal);
    },
  },
  computed: {
    tableData() {
      if (!this.showHighDamageItemsOnly) return this.results['data'];
      return this.results['data'].filter((entry) => {
        return Number(entry['avgDamageTaken']) > 2000;
      });
    }
  },
  methods: {
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
