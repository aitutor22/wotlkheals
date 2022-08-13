<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <p>
        This tool simulates how long it takes for a Holy Paladin to go OOM, especially due to the high mana cost of Holy Light. Given the high number of procs in the hpld toolkit, the tool simulates 200 runs and returns the median ttoom, and the specific statistics from that run.
      </p>
      <p>The tool assumes the player incorporates slight pauses after every instant cast (e.g. HS) to allow for melee hits to proc Seal of Wisdom.</p>
      <p>Please input raid-buffed values for spellpower, mana pool and crit chance (do not add crit from talents). Note: do not change stats from trinkets to these values as the tool will automatically calculate it.</p>
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
      <div class="col-4">
        <h8><b>Trinkets</b></h8>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="soup" v-model="oomOptions['trinkets']" value="soup">
          <label class="form-check-label" for="soup">Soul Preserver</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="eog" v-model="oomOptions['trinkets']" value="eog">
          <label class="form-check-label" for="eog">Eye of Gruul</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="dmcg" v-model="oomOptions['trinkets']" value="dmcg">
          <label class="form-check-label" for="dmcg">Darkmoon Card: Greatness</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="owl" v-model="oomOptions['trinkets']" value="owl">
          <label class="form-check-label" for="owl">Figurine - Sapphire Owl</label>
        </div>
      </div>
    </div>

    <div class="row slight-offset-top" v-if="results">
      <div class="col-4">
        <ul>
          <li>Time to OOM: <b>{{ results['ttoom'] }}s</b></li>
<!--           <li>Time to next consume: <b> {{ results['timeToNextConsume'] }}s</b></li>
          <li>Mana Pool: <b>{{ results['manaPool'] }}</b></li>
          <li>Buffed Int: <b>{{ results['statsSummary']['buffedInt'] }}</b></li>
          <li>Buffed Spirit: <b>{{ results['statsSummary']['buffedSpirit'] }}</b></li>
          <li>Mana from Super Mana Pots: <b>{{ results['consumesManaSummary']['SUPER_MANA_POTION'] }}</b></li>
          <li>Mana from Dark Runes: <b>{{ results['consumesManaSummary']['DARK_RUNE'] }}</b></li>
          <li>Mana from Shadowfiend: <b>{{ results['consumesManaSummary']['SHADOWFIEND'] }}</b></li>
          <li v-if="results['consumesManaSummary']['MANA_TIDE_TOTEM']">
            Mana from Mana Tide Totem: <b>{{ results['consumesManaSummary']['MANA_TIDE_TOTEM'] }}</b> -->
          <!-- </li> -->
        </ul>
      </div>
<!--       <div class="col-4">
        Total MP5: <b>{{ results['statsSummary']['totalOtherMP5'] }}</b>
        <ol>
          <li v-for="(item, index) in results['mp5Summary']" :key="index">
            {{ item.name }}: <b>{{ item.value }}</b>
          </li>
        </ol>
      </div> -->
    </div>
    <hr>

    <div class="row" v-if="results">
      <div class="pad-bottom">
        <i>
          Note: While time to oom is a median value and thus stable, the following spell and mana breakdown and logs are are from a specific run, and proc effects like soup will vary greatly. These values are for error-checking purposes, and not meant to be a mathematical average of soup mp5, etc.
        </i>
      </div>
      <br>
      <div class="col-6">
        <h5>Spell Breakdown</h5>
        <b-table striped hover :items="tableData"></b-table>
        <br>
        <h5>Mana Regeneration Breakdown</h5>
        <b-table striped hover :items="mp5Data"></b-table>
      </div>
      <div class="col-5 offset-1">
        <textarea class="log" readonly="" v-model="logs"></textarea>  
      </div>
<!--       <div class="col-6">
        <h2>Highlighted Logs</h2>
        <textarea class="log" readonly="" v-model="highlightedLogs"></textarea>
      </div> -->
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
      fetching: false,
      showExplanation: true,
      results: null,
      oomOptions: {
        manaPool: 28000,
        castTimes: {
          HOLY_LIGHT: 1.6,
        },
        trinkets: ['soup', 'eog'],
        holyShockCPM: 3,
        glyphHolyLightHits: 4,
        mp5FromGearAndRaidBuffs: 300,
      },
    };
  },
  computed: {
    logs() {
      if (!this.results || (typeof this.results['logs'] === 'undefined')) return;
      return this.results['logs'].join('\n');
    },
    tableData() {
      let results = [
        {spell: 'Holy Light', CPM: 20.5, HPS: 20000, 'Crit %': 42},
      ];
      return results;
    },
    mp5Data() {
      // let results = [
      //   {source: 'DMCG', 'Total Mana': 20000, MPS: 20.5},
      //   {source: 'Soup', 'Total Mana': 20000, MPS: 20.5},
      //   {source: 'Others', 'Total Mana': 20000, MPS: 20.5},
      //   {source: 'SoW', 'Total Mana': 20000, MPS: 20.5},
      // ];
      if (!this.results || (typeof this.results['statistics'] === 'undefined')) return;
      let results = [];
      for (let i = 0; i < this.results['statistics']['manaGenerated'].length; i++) {
        let entry = this.results['statistics']['manaGenerated'][i];
        entry['Total Mana'] = this.formatNumber(entry['Total Mana']);
        results.push(entry);
      }

      return results;
    }
  },
  methods: {
    formatNumber (num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    },
    runSim() {
      if (this.oomOptions['trinkets'].length > 2) {
        alert('You can only select up to two trinkets.');
        return;
      }
      if (this.fetching) return;
      this.fetching = true;
      axios
          .post('ttoom/paladin', this.oomOptions)
          .then((response) => {
            this.fetching = false;
            this.showExplanation = false;
            console.log(response.data);
            this.results = response.data;
          })
          .catch((error)  => {
            console.log(error);
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
.log {
  width: 100%;
  height: 100%;
}

.pad-bottom {
  padding: 0px 0px 20px;
}
</style>
