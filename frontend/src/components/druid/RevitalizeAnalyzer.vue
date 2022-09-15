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
      <ul>
        <li>Total Procs: {{ results['total'] }}</li>
        <li>Wild Growth Procs: {{ results['wildGrowth'] }} </li>
        <li>Rejuvenation Procs: {{ results['rejuvenation'] }} </li>
      </ul>
    </div>
  </div>
</template>

<script>

import axios from 'axios';

export default {
  name: 'DruidRevitalizeAnalyzer',
  metaInfo: {
    title: 'Revitalize Analyzer',
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

      this.fetching = true;
      this.results = null;
      axios
          .post(`analyzer/druid/revitalize`, {wclLink: this.wclLink})
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
