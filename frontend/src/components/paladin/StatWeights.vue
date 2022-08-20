<template>
  <div class="container">
   <div class="row" v-if="showExplanation">
    <p>
      Preliminary guestimates of HPLD statweights by <b>Trollhealer</b>, <b>Lovelace</b> and <b>Currelius</b>.
    </p>
    <p>
      The central idea is that paladins have an extremely efficient way to convert healing throughput into mana conservation through Divine Plea. From here, we can work out a standard conversion or stat-weight for MP5 relative to 1 spellpower, and then use that to derive valuations for int and crit. Haste has also been included for completeness.
    </p>
    <p>
      The stat-weight for stamina has been left as an exercise for the reader.
    </p>
    </div>

    <div class="row">
      <div class="col-6">
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Mana Pool</span>
          <input type="text" class="form-control" v-model.number="manaPool">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Spellpower</span>
          <input type="text" class="form-control" v-model.number="spellPower">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">HL CPM</span>
          <input type="text" class="form-control" v-model.number="cpm">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Raid Buffed Crit Chance (exc. talents)</span>
          <input type="text" class="form-control" v-model.number="critChance">
        </div>
        <button class="btn btn-primary" @click="run">Run</button>
      </div>
    </div>
    <br>
    <hr>
    <div v-if="showResults">
      <div class="row">
        <div class="col-7">
          <h3>Overall Findings</h3>
          <p>
            While pserver wisdom argues we should prioritise Haste at all costs, we find that Int is quite undervalued and has similar or even better stat-weights to Haste in T7.
          </p>
          <p>
            This is because most stats exhibit diminishing marginal returns relative to other stats - for instance, the more haste you have, the less valuable each incremental haste rating becomes relative to spellpower.
          </p>
          <p>
            HPLD gets 20+% haste just from buffs and talents, making the marginal value of haste less valuable than at first glance.
          </p>
        </div>
        <div class="col-5">
          <b-table striped hover :items="results['statWeights']"></b-table>
        </div>
      </div>

      <hr>
      <div class="row">
        <div class="col-7">
          <h3>MP5 Stat Weight</h3>
          <p>
            Traditionally, it has been difficult to reconcile mana and throughput stat weights for healers. We use Divine Plea to calculate MP5 stat weight - essentially, we are asking "how much is the reduced throughput worth in spellpowerterms" and comparing it to "how much Mp5 do we need so we can skip a plea".
          </p>
          <p>
            This assumes that the player is chain-casting with no downtime. If a fight has breaks that allows the HPLD to get "free" pleas off, MP5 stat value drops since the player suffers less of a throughput penalty.
          </p>
          <p>
            We also considered different throughtput-mp5 conversion methods such as meleeing for 15s to proc SoW or using more Flash Heal, but these methods had inferior conversion efficency compared to Divine Plea.
          </p>
        </div>
        <div class="col-5">
          <b-table striped hover :items="results['tables']['mp5']"></b-table>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col-7">
          <h3>Crit Stat Weight</h3>
          <p>
            Crit benefits the HPLD in two ways - increased throughput, and mana regen from Illumination.
          </p>
          <p>
            For the throughput component, note that while we do not typically consider overhealing for stat weights, beacon and huge HL crits on tanks means that the vast majority of crit heals are overhealing. For better modelling, we include a 10% discount factor to crit heals (only in this crit section), which matches with the 10-20% overhealing delta on crit HL vs non-crit HL in most beta logs.
          </p>
          <p>
            In reality, the discount factor changes nothing as the crit throughput portion is not large enough to make the discount anything more than a rounding error.
          </p>

        </div>
        <div class="col-5">
          <b-table striped hover :items="results['tables']['crit']"></b-table>
        </div>
      </div>
      {{ results }}
    </div>
  </div>
</template>

<script>

import Vue from 'vue';

const CRIT_RATING = 45.91;
const HASTE_RATING = 32.79;

// 12% from healing light, 5% from divinity (assume multiplicative); for just one target
const MULTIPLIER_DIVINITY_HEALING_LIGHT = 1.12 * 1.05;
const BASE_HL_COEFFICIENT_UNCRIT = 1.679 * MULTIPLIER_DIVINITY_HEALING_LIGHT;
const DIVINE_PLEA_DURATION = 15; // in seconds
const HEALING_LOSS_DURING_DIVINE_PLEA = 0.5;
const HL_BASE_HEAL = 5166;
const MANA_OBTAINED_FROM_HL_CRIT = 382


export default {
  name: 'PaladinStatWeights',
  props: {
  },
  data() {
    return {
      showExplanation: true,
      showResults: false,
      spellPower: 2400, // includes holy guidance; to extract out later
      manaPool: 28000,
      critChance: 30, // includes raid buffs
      hastePercent: 0.15,
      cpm: 40,
      glyphHolyLightHits: 5,
      critOverhealDiscountFactor: 10,
      results: {statWeights: [], tables: {}},
    };
  },
  computed: {
    hlCritChance() {
      return this.critChance / 100 + 0.11; //11% from talents
    },
    multiplierFromBeaconGlyph() {
      return 2 + this.glyphHolyLightHits * 0.1;
    },
    HL_CRIT_COEFFICIENT() {
      return (BASE_HL_COEFFICIENT_UNCRIT * 1.5 * this.hlCritChance + BASE_HL_COEFFICIENT_UNCRIT * (1 - this.hlCritChance)) * this.multiplierFromBeaconGlyph;
    },
    hlUncritHealing() {
      return (HL_BASE_HEAL * MULTIPLIER_DIVINITY_HEALING_LIGHT + this.spellPower * BASE_HL_COEFFICIENT_UNCRIT) * this.multiplierFromBeaconGlyph;
    },
    hlRawHealing() {
      return this.hlUncritHealing * 1.5 * this.hlCritChance + this.hlUncritHealing * (1 - this.hlCritChance)
    },
  },
  methods: {
    formatNumber (num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    },
    roundDp(num, dp) {
        let x = 10 ** dp;
        return Math.round((num + Number.EPSILON) * x) / x;
    },
    run() {
      this.showExplanation = false;
      let mp5Results = this.calculateMP5(),
        critResults = this.calculateCrit(mp5Results[0]);
      let statWeights = [
        {'stat': 'MP5', 'value': mp5Results[0]},
        {'stat': 'Crit', 'value': critResults[0]},
      ];

      Vue.set(this.results['tables'], 'mp5', mp5Results[1]);
      Vue.set(this.results['tables'], 'crit', critResults[1]);
      
      this.$set(this.results, 'statWeights', statWeights);
      this.showResults = true;
    },
    calculateMP5() {
      let averageCastTime = 60 / this.cpm, totalHealingLossDuringDivinePlea, spellPowerLoss, totalManaRegenFromDivinePleaMp5, mp5StatWeight = 0, table = [];
      // 2 targets healed using beacon
      // divine plea lasts for 15s, and we plan to compare what's the mp5 and +healing loss in one minute
      // which is the CD for divine plea
      totalHealingLossDuringDivinePlea = DIVINE_PLEA_DURATION / averageCastTime * this.hlRawHealing * HEALING_LOSS_DURING_DIVINE_PLEA;

      //we calculate what is the equivalent +spellpower loss per HL cast, averaged over all the spell casts in one minute
      spellPowerLoss = totalHealingLossDuringDivinePlea / (this.HL_CRIT_COEFFICIENT * this.cpm);
      totalManaRegenFromDivinePleaMp5 = this.manaPool * 0.25 / 12;

      mp5StatWeight = this.roundDp(spellPowerLoss / totalManaRegenFromDivinePleaMp5, 1);
     table.push({
        'field': 'Total healing loss',
        'value': this.formatNumber(Math.floor(totalHealingLossDuringDivinePlea)),
      });

      table.push({
        'field': 'Equivalent Spellpower loss',
        'value': Math.floor(spellPowerLoss),
      });

      table.push({
        'field': 'Mana regen (mp5)',
        'value': Math.floor(totalManaRegenFromDivinePleaMp5),
      });

      table.push({
        'field': 'Stat Weight',
        'value': mp5StatWeight,
      });

      return [mp5StatWeight, table];
    },

    // crit statweight is from througput and illumination
    // typically for stat weights, we don't really consider overhealing
    // but with beacon + huge HL crits on tanks, might want to make this more realistic with a smallish discount (but not full overhealing amounts)
    calculateCrit(mp5StatWeight) {
      let increaseInHealingFromOnePercentageCrit = 0, increaseInHealingFromOneCritRating = 0,
        critStatWeight = 0, table = [], overhealDiscountFactor;
      
      overhealDiscountFactor = 1 + this.critOverhealDiscountFactor / 100;
      increaseInHealingFromOnePercentageCrit = (this.hlUncritHealing * 0.5 / 100) / overhealDiscountFactor;
      increaseInHealingFromOneCritRating = increaseInHealingFromOnePercentageCrit / CRIT_RATING;
      
      let critStatWeightFromIncreasedHealing = increaseInHealingFromOneCritRating / this.HL_CRIT_COEFFICIENT;


      let amountOfManaSavedFromOnCriRatingPerCast = (1 / CRIT_RATING * MANA_OBTAINED_FROM_HL_CRIT) / 100;
      let amountOfManaSavedFromOnCriRatingMp5 = amountOfManaSavedFromOnCriRatingPerCast * this.cpm / 12;
      let critStatWeightFromManaRegen = amountOfManaSavedFromOnCriRatingMp5 * mp5StatWeight;
      let totalCritStatWeight = this.roundDp(critStatWeightFromManaRegen + critStatWeightFromIncreasedHealing, 1);

      table.push({
        'field': 'Stat Weight from throughput increase',
        'value': this.roundDp(critStatWeightFromIncreasedHealing, 1),
      });

      table.push({
        'field': 'Stat Weight from Illumination',
        'value': this.roundDp(critStatWeightFromManaRegen, 1),
      });

      table.push({
        'field': 'Total Stat Weight',
        'value': totalCritStatWeight,
      });
      return [totalCritStatWeight, table];
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
