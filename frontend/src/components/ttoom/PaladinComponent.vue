<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>This is a general tool to visualise how long it takes for a Holy Paladin to go OOM, especially due to the high mana cost of Holy Light.</p>
      <p>The tool assumes the player incorporates slight pauses after every instant cast (e.g. HS) to allow for melee hits to proc Seal of Wisdom.</p>
      <p>Please input raid-buffed values for spellpower, mana pool, as well as your cast time for HL. If you select DMCG, you do not need to change the spellpower and mana pool as the system will automatically calculate it.</p>
      <p>
        Special thanks to Lovelace and Currelius for formula help, as well as the rest of the healer cabal for valuable feedback and beta testing.
      </p>
    </div>
<!--     <div class="row chart-container">
      <div class="col-12">
        <bar-chart
          v-if="chartdata"
          id="chart"
          :chart-data="chartdata"
          :options="chartoptions"
           style="height: 350px" />
      </div>
    </div> -->
    <div class="row">
      <div class="col-4">
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Mana Pool</span>
          <input type="text" class="form-control" v-model.number="oomOptions['manaPool']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">HL Cast Time</span>
          <input type="text" class="form-control" v-model.number="oomOptions['castTimes']['HOLY_LIGHT']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">HS CPM </span>
          <input type="text" class="form-control" v-model.number="oomOptions['holyShockCPM']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Avg hit from glyph HL</span>
          <input type="text" class="form-control" v-model.number="oomOptions['glyphHolyLightHits']">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">MP5 From Gear & Buffs</span>
          <input type="text" class="form-control" v-model.number="oomOptions['mp5FromGearAndRaidBuffs']">
        </div>
        <div>
          <button class="btn btn-primary" @click="runSim">Run Simulation</button>
<!--           <button class="btn btn-success slight-offset-left" @click="getManaDetails">Details from logs</button> -->
          <!-- <button class="btn btn-danger slight-offset-left" @click="reset">Reset</button> -->
        </div>
      </div>
    </div>

  </div>
</template>

<script>

import axios from 'axios';

// https://stackoverflow.com/questions/38085352/how-to-use-two-y-axes-in-chart-js-v2
export default {
  name: 'PaladinTTOOM',
  props: {
  },
  data() {
    return {
      showExplanation: true,
      oomOptions: {
        manaPool: 28000,
        castTimes: {
          HOLY_LIGHT: 1.6,
        },
        holyShockCPM: 3,
        glyphHolyLightHits: 4,
        mp5FromGearAndRaidBuffs: 300,
      },
    };
  },
  computed: {
  },
  methods: {
    runSim() {
      console.log('run sim');
      axios
          .post('ttoom/paladin', this.oomOptions)
          .then((response) => {
            this.showExplanation = false;
            console.log(response);
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
