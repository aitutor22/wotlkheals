<template>
  <div class="container">
    <div class="row" v-if="showExplanation">
      <div class="col-md-12">
        <p>
          This tool aims to show you what Power Word: Shields whiffed (aka expired without absorbing a single bit of damage) as well as who and what spell caused your rapture to proc. This knowledge will ideally help the priest player improve his or her raptures, by both reducing useless shields as well as avoiding certain players prior to a rapture chain.
        </p>
        <p>
          To start, paste the wcl link of a specific fight with your priest selected (there should be a source=x in your url). If you want to only analyze the first x seconds of a fight (e.g. P1 of Heigan), you can manually set an endpoint timestamp, and the tool will analyze shields casted from the start of the fight to your inputted endpoint (damage absorbed within 30s of the end point will still be tracked).
        </p>
        <p>
          Note: if a rapture procs on the priest itself, this is counted as 1 rapture and not 2, even though it technically triggers two different rapture events in WCL.
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
      <div class="row">
        <div class="col-md-8">
          <h4>Whiffed casts by role</h4>
          <b-table :items="whiffedCastsByRoleTableData"></b-table>
        </div>
        <div class="col-md-4">
          <h4>Rapture Statistics</h4>
          <p v-b-tooltip.hover title="Note that when a PWS on the priest is the one that triggered rapture, it counts as two procs">
            Total Raptures: {{ totalRaptures }} ({{ rapturesPerMin }} per min)
          </p>
          <p v-b-tooltip.hover title="Raptures that occur within 1s of each other are grouped together">Amount of raptures</p>
          <ul>
            <!-- (value, key, index) for object -->
            <li v-for="(data, timestamp, index) in rapturesBreakdown" :key="index">
              <p v-if="data['amount'] > 1">
                <b>{{ timestamp }}s: {{ data['amount'] }} raptures</b>
                <br><i>{{ data['abilityCausingProcStr'] }}</i>
              </p>
              <p v-else>
                <b>{{ timestamp }}s: 1 rapture ({{ data['proccers'][0] }})</b>
                <br><i>{{ data['abilityCausingProcStr'] }}</i>
              </p>
            </li>
          </ul>
        </div>
      </div>
      <div class="row mt-4">
        <div class="col-md-8 center">
          <h4>Damage Taken By Role</h4>
          <PieChart
            :chart-data="chartData"
            :chart-options="chartOptions"
            />
        </div>
        <div class="col-md-4">
          <h4>Whiffed Logs</h4>
          <ul class="light-grey">
            <li v-for="(row, index) in logs" :key="index">
              Shield casted at {{ row.timestamp }}s on <span :class="row.playerClass">{{ row.name}}</span> whiffed! ({{ row.playerRole }})
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios';
import PieChart from './PieChart';

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
      whiffedCastsByRole: {},
      whiffedCastsByRoleTableData: [],
      totalRaptures: 0,
      rapturesPerMin: 0,
      chartData: null,
      rapturesBreakdown: null,
    };
  },
  components: {
    PieChart,
  },
  watch: {
    currentFightId(newVal, oldVal) {
      // we only want to repull when user has already run once, and is selecting from select input
      if (oldVal === '' || isNaN(oldVal) || newVal === oldVal) return;
      this.runHelper(newVal);
    },
    results: {
      deep: true,
      handler() {
        if (!this.results) return;
        this.analyze(this.results['data'], 0, this.endAnalysisTimeOffset, this.results['playerIdToData'], this.results['damageTaken'], this.results['rapturesData']);
      },
    },
    // this is being called everytime results is changed aka everytime we change a fight, analyze is called twice
    // need to refactor in future
    endAnalysisTimeOffset: {
      handler() {
        if (!this.results) return;
        this.analyze(this.results['data'], 0, this.endAnalysisTimeOffset, this.results['playerIdToData'], this.results['damageTaken'], this.results['rapturesData']);
      },
    },
  },
  computed: {
    percentageWhiffed() {
      if (this.totalCasts === 0) return 0;
      return Math.floor(this.totalWhiffedCasts / this.totalCasts * 100);
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      };
    },
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
          .post(`analyzer/priest/shield`, toPass)
          .then((response) => {
            console.log(response.data);
            this.fetching = false;
            this.results = response.data;
            this.currentFightId = Number(response.data['currentFightId']);
            this.showExplanation = false;
            this.endAnalysisTimeOffset = response.data['fightLength'];
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
    analyzerRaptures(data) {
      let totalRaptures = 0;
      let counter = {};
      let previousTimestamp = -99;
      let currentTimestamp = 0;
      // loops through each rapture event, and aggregates to determine how many raptures actually occurred at each timestamp
      for (let entry of data) {
        currentTimestamp = entry['timestamp'];
        if (currentTimestamp <= this.endAnalysisTimeOffset) {
          // there could be slight delay between raptures (especially for own priest proc)
          // thus we use a threshold of 1s to determine if same rapture
          // since rapture has 12s ICD (thus successive raptures should be 12s apart, 1s leeway is fine)
          if (currentTimestamp - previousTimestamp < 1) {
            currentTimestamp = previousTimestamp;
          } else {
            previousTimestamp = currentTimestamp;
          }

          if (!(currentTimestamp in counter)) {
            counter[currentTimestamp] = {amount: 0, proccers: [], abilityCausingProc: []};
          }
          counter[currentTimestamp]['amount']++;
          counter[currentTimestamp]['proccers'].push(entry['proccerName']);
          counter[currentTimestamp]['abilityCausingProc'] = counter[currentTimestamp]['abilityCausingProc'].concat(entry['abilitiesCausingProc']);
          // unique items
          counter[currentTimestamp]['abilityCausingProc'] = [...new Set(counter[currentTimestamp]['abilityCausingProc'])];
          counter[currentTimestamp]['abilityCausingProcStr'] = counter[currentTimestamp]['abilityCausingProc'].join(', ');
          totalRaptures++;
        } else {
          break;
        }
      }
      this.totalRaptures = totalRaptures;
      this.rapturesPerMin = this.endAnalysisTimeOffset > 0 ? (totalRaptures / (this.endAnalysisTimeOffset) * 60).toFixed(1) : 0;
      this.rapturesBreakdown = counter;
    },
    // we check for all PWS casts from startTime to endTime, how many casts whiffed (note that we will need to check up to 30s)
    analyze(combined, startAnalysisTimeOffset, endAnalysisTimeOffset, playerIdToData, overallDamageTakenData, rapturesData, minDamageAbsorbedThreshold=0) {
        let castsSequence = {};
        let logs = [];
        let totalCasts = 0; // refers to total pws casts (not just whiffed casts)
        let totalWhiffedCasts = 0;
        let whiffedCastsByRole = {};
        let totalCastsByRole = {};

        for (let entry of combined) {
            let key = entry['targetID'];
            if (!(key in castsSequence)) {
                castsSequence[key] = [];
            }
            castsSequence[key].push(entry);
        }

        function getDetails(targetID) {
          let name, playerClass, playerRole;
          if (targetID in playerIdToData) {
            name = playerIdToData[targetID]['name'];
            playerClass = playerIdToData[targetID]['type'];
            playerRole = playerIdToData[targetID]['role'];
          } else {
            name = 'Pet';
            playerClass = 'Pet';
            playerRole = 'pet';
          }
          return [name, playerClass, playerRole];
        }

        function checkIfShouldAddToWhiffed(pwsCastedTimestamp, targetID, damageTaken) {
          if (damageTaken > minDamageAbsorbedThreshold) return;
          totalWhiffedCasts++;
          let [name, playerClass, playerRole] = getDetails(targetID);
          logs.push({
            timestamp: pwsCastedTimestamp,
            name: name,
            playerClass: playerClass,
            playerRole: playerRole,
          });

          if (!(playerRole in whiffedCastsByRole)) {
            whiffedCastsByRole[playerRole] = 0;  
          }
          whiffedCastsByRole[playerRole]++;
        }

        function addCast(targetID) {
          let [name, playerClass, playerRole] = getDetails(targetID);
          totalCasts++;
          if (!(playerRole in totalCastsByRole)) {
            totalCastsByRole[playerRole] = 0;  
          }
          totalCastsByRole[playerRole]++;
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
                    // totalCasts++;
                    addCast(targetID);
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
                  addCast(targetID);
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
        this.whiffedCastsByRoleTableData = [];


        let totalDamageTaken = 0;
        for (let key in overallDamageTakenData) {
          totalDamageTaken += overallDamageTakenData[key];
        }

        for (let role of ['tanks', 'melee_dps', 'ranged_dps', 'healers', 'pet']) {
          let entry = {};
          entry['role'] = role;
          entry['casts'] = (role in totalCastsByRole) ? totalCastsByRole[role] : 0;
          entry['whiffed'] = (role in whiffedCastsByRole) ? whiffedCastsByRole[role] : 0;
          entry['whiffed_%'] = entry['casts'] > 0 ?
            Math.floor(entry['whiffed'] / entry['casts'] * 100): 0;
          entry['casts_%'] = totalCasts > 0 ?
            Math.floor(entry['casts'] / totalCasts * 100): 0;

          entry['damage_taken_%'] = (totalDamageTaken > 0) && (role in overallDamageTakenData) ?
            Math.floor(overallDamageTakenData[role] / totalDamageTaken * 100) : 0

          if (entry['whiffed_%'] > 50) {
            entry['_rowVariant'] = 'danger';
          }
          this.whiffedCastsByRoleTableData.push(entry);
        }
        // we add a totals row
        let totalEntry = {};
        totalEntry['role'] = 'total';
        totalEntry['casts'] = totalCasts;
        totalEntry['whiffed'] = totalWhiffedCasts;
        totalEntry['whiffed_%'] = Math.floor(this.totalWhiffedCasts / this.totalCasts * 100);
        totalEntry['casts_%'] = 100;
        totalEntry['damage_taken_%'] = 100;
        this.whiffedCastsByRoleTableData.push(totalEntry);


        // pie chart of damage taken
        this.chartData = {
          labels: Object.keys(overallDamageTakenData),
          datasets: [
            {
              backgroundColor: ['#41B883', '#E46651', '#00D8FF', '#DD1B16', '#f58cba'],
              data: Object.values(overallDamageTakenData),
            }
          ]
        };

        this.analyzerRaptures(rapturesData);
    }
  },
  mounted() {
    console.log('mounting');
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.center {
  text-align: center!important;
}

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
