<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <div class="col-md-12">
        <blockquote class="blockquote">
          <p>If a shield is casted on a player and no damage lands on it, does it count as a shield?</p>
        </blockquote>
        <p>
          This tool aims to show you what Power Word: Shields whiffed (aka expired without absorbing a single bit of damage).
        </p>
        <p>
          To start, paste the wcl link of a specific fight.
        </p>
      </div>
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
    <div v-if="results" class="container margin-top-40 no-pad-left">
      <div class="row">
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1"
          v-b-tooltip.hover title="Will analyze PWS spell casts from 0 to x sec of chosen fight. However, will consider shield absorbs from 0 to x + 30s since a shield casted at x sec can absorb damage up to x + 30 secs.">Analyze the first x secs of a fight</span>
          <input type="text" class="form-control" v-model.number="endAnalysisTimeOffset">
        </div>
      </div>
      <hr>
      <p>Whiffed Casts: {{ totalWhiffedCasts }} whiffed / {{ totalCasts }} total ({{ percentageWhiffed }}%)</p>
      <ul class="light-grey">
        <li v-for="(row, index) in logs" :key="index">
          Shield casted at {{ row.timestamp }}s on <span :class="row.playerClass">{{ row.name}}</span> whiffed!
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

import axios from 'axios';


export default {
  name: 'PriestShieldAnalyzer',
  metaInfo: {
    title: 'Shield Analyzer',
  },
  data() {
    return {
      showExplanation: true,
      fetching: false,
      wclLink: '',
      results: null,
      currentFightId: '',
      logs: [],
      endAnalysisTimeOffset: 30, // analyze spellcasts from 0s to xs
      totalCasts: 0,
      totalWhiffedCasts: 0,
    };
  },
  watch: {
    currentFightId(newVal, oldVal) {
      // we only want to repull when user has already run once, and is selecting from select input
      if (oldVal === '' || isNaN(oldVal) || newVal === oldVal) return;
      console.log(oldVal, newVal)
      this.runHelper(newVal);
    },
    results: {
      deep: true,
      handler() {
        if (!this.results) return;
        this.analyze(this.results['data'], 0, this.endAnalysisTimeOffset, this.results['playerIdToData']);
      },
    },
    endAnalysisTimeOffset: {
      handler() {
        if (!this.results) return;
        this.analyze(this.results['data'], 0, this.endAnalysisTimeOffset, this.results['playerIdToData']);
      },
    },
  },
  computed: {
    percentageWhiffed() {
      if (this.totalCasts === 0) return 0;
      return Math.floor(this.totalWhiffedCasts / this.totalCasts * 100);
    }
  },
  methods: {
    // if a specific fight id is passed, then we use that, regardless of what the fight id is on the wcl link
    runHelper(specificFightId=null) {
      console.log('run helper');
      this.fetching = true;
      this.results = null;
      let toPass = {wclLink: this.wclLink};
      if (specificFightId) {
        toPass['fightId'] = specificFightId;
      }

      axios
          .post(`analyzer/priest/shield`, toPass)
          .then((response) => {
            this.fetching = false;
            this.results = response.data;
            this.currentFightId = Number(response.data['currentFightId']);
            this.showExplanation = false;
          })
          .catch((error)  => {
            console.log(error);
            alert(error.response.data);
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
      if (this.wclLink.indexOf('source=') === -1) {
          alert("Invalid URL link - make sure 'source=yy' is in the link");
          return;
      }
      this.runHelper();
    },
    // we check for all PWS casts from startTime to endTime, how many casts whiffed (note that we will need to check up to 30s)
    analyze(combined, startAnalysisTimeOffset, endAnalysisTimeOffset, playerIdToData, minDamageAbsorbedThreshold=0) {
        let castsSequence = {};
        let logs = [];
        let totalCasts = 0; // refers to total pws casts (not just whiffed casts)
        let totalWhiffedCasts = 0;

        for (let entry of combined) {
            let key = entry['targetID'];
            if (!(key in castsSequence)) {
                castsSequence[key] = [];
            }
            castsSequence[key].push(entry);
        }

        function checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, damageTaken) {
            if (damageTaken > minDamageAbsorbedThreshold) return;
            // if (!(targetID in whiffed)) whiffed[targetID] = 0;
            // whiffed[targetID]++;
            totalWhiffedCasts++;
            let name, playerClass;
            if (targetID in playerIdToData) {
              name = playerIdToData[targetID]['name'];
              playerClass = playerIdToData[targetID]['type'];
            } else {
              name = 'Pet';
              playerClass = 'Pet';
            }
            logs.push({
              timestamp: pwsCastedTimestamp,
              name: name,
              playerClass: playerClass,
            });
        }

        for (let targetID in castsSequence) {
            let totalDamageAbsorbed = 0;
            let startedCounting = false;
            let pwsCastedTimestamp = 0;
            let finishedCountingForPlayer = false;
            for (let event of castsSequence[targetID]) {
                // initial cast of PWS on this target -> we only start counting from this onwards
                if (event['type'] === 'cast') {
                    if (!startedCounting) {
                        if (event['timestamp'] > endAnalysisTimeOffset) break;
                        startedCounting = true;
                        pwsCastedTimestamp = event['timestamp'];
                        totalCasts++;
                        continue;
                    }
                    checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, totalDamageAbsorbed);
                    // resets for next pws
                    totalDamageAbsorbed = 0;
                    pwsCastedTimestamp = event['timestamp'];

                    // if we find a pws cast after the end of analysis time, it means we stop analysing after this
                    if (event['timestamp'] > endAnalysisTimeOffset) {
                        finishedCountingForPlayer = true;
                        break;
                    }
                    totalCasts++;
                } else {
                    if (!startedCounting) continue;
                    // we stop counting until 30s after last pws cast since that's how long pws lasts
                    if (event['timestamp'] > endAnalysisTimeOffset + 30) {
                        checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, totalDamageAbsorbed);
                        finishedCountingForPlayer = true;
                        break;
                    }
                    totalDamageAbsorbed += event['amount'];
                }
            }
            if (startedCounting && !finishedCountingForPlayer) {
                checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, totalDamageAbsorbed);
            }
        }
        logs.sort((a, b) => (a['timestamp'] - b['timestamp']))
        this.logs = logs;
        this.totalCasts = totalCasts;
        this.totalWhiffedCasts = totalWhiffedCasts;
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

.Shaman {
  color: #2459ff!important;
}

.Druid {
  color: #ff7d0a!important;
}

.Paladin {
  color: #f58cba!important;
}

.Priest {
  color: #a4a5a8!important;
}

.Warrior {
  color: #c79c6e!important;
}

.Rogue {
  color: #fff569!important;
}

.Hunter {
  color: #abd473!important;
}

.Mage {
  color: #69ccf0!important;
}

.Warlock {
  color: #9482c9!important;
}

.DeathKnight {
  color: #c41f3b !important;
}
.light-grey {
  background-color: lightgrey;
}
</style>
