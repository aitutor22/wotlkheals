<template>
  <div class="container">
   <div class="row" v-if="showExplanation">
    <p>
      Preliminary guestimates of HPLD statweights by <b>Trollhealer</b>, <b>Lovelace</b> and <b>Currelius</b>. Note that int valuation is a floor value, and please see a writeup below as to why in practice, some players choose a higher value (especially when choosing int vs spellpower enchants).
    </p>
    <blockquote class="blockquote text-center">
      <p>
        It’s important to think about what your stats actually do and how stat weights reflect that. The int value in the calculator comes from comparing raw healing output increase from more spellpower to effective healing increase that int provides by allowing you to better manage when you use divine plea.
      </p>
      <p>
        While it’s a good sandbox model and lets you peg mana stats like mp5 to other throughput stats, it gives a poor valuation of spellpower in particular since your raw healing output is mostly irrelevant. Holy Light and Beacon has very high overheal, and there is often no functional difference between an 11k or a 12k holy light in terms of whether your tank lives or dies. Basically, spellpower is worth significantly less than the model suggests.
      </p>
      <p>
        So if the size of your HL doesn’t really matter, what is spellpower even good for? Three things in practice: a) bigger sacred shield; b) bigger heals during plea where their size matters more; c) slightly more healing with glyph of holy light splash.
      </p>
      <p>
        When using a value for int, decide for yourself how important you think spellpower is vs. the sheer longevity (and flexibility with plea) that int provides, in the context of your kill times, how fast your raid moves, and your healing composition. The answer will always be “it depends”.
      </p>
      <footer class="blockquote-footer">Lovelace</footer>
    </blockquote>
    <p>
      IMPORTANT NOTE FOR HASTE: the higher the existing haste, the lower the marginal value of adding more haste. If you wish to see what are your stat weights based on your current gear to determine incremental upgrades, then put your existing haste. But if you are trying to determine phase bis, put a low to midrange haste value to avoid undervaluing haste (this will not affect your mp5, int or crit weights).
    </p>
    <p>
      The stat-weight for stamina has been left as an exercise for the reader.
    </p>
    </div>

    <div class="row">
      <div class="col-6">
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1"
            v-b-tooltip.hover title="Raid Buffed">Mana Pool</span>
          <input type="text" class="form-control" v-model.number="manaPool">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1"
            v-b-tooltip.hover title="Raid Buffed, including spellpower from Holy Guidance">Spellpower</span>
          <input type="text" class="form-control" v-model.number="spellPower">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">HL CPM</span>
          <input type="text" class="form-control" v-model.number="cpm">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1"
            v-b-tooltip.hover title="Raid Buffed, DO NOT include values from Holy Power and Sanctified Light talents as system will automatically add">Raid Buffed Crit Chance (exc. talents)</span>
          <input type="text" class="form-control" v-model.number="critChance">
        </div>
        <button class="btn btn-primary" @click="run">Run</button>
      </div>

      <div class="col-6">
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Fight Length (s)</span>
          <input type="text" class="form-control" v-model.number="fightLength">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1">Replenishment %</span>
          <input type="text" class="form-control" v-model.number="replenishmentUptime">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1"
            v-b-tooltip.hover title="The number of melee attacks a HPLD does, which has a chance to proc Seal of Wisdom for mana?">Num melee Hits (min)</span>
          <input type="text" class="form-control" v-model.number="numSoWHitsPerMin">
        </div>
        <div class="input-group mb-2" style="width: 100%">
          <span class="input-group-text" id="basic-addon1"
            v-b-tooltip.hover title="Haste % from gear only; DO NOT add JotP or other raid buffs">Haste %</span>
          <input type="text" class="form-control" v-model.number="hastePercent">
        </div>
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
            Traditionally, it has been difficult to reconcile mana and throughput stat weights for healers. In particular, if you never run out of mana, what value do mana stats have?"
          </p>
          <p>
            HPLDs in WotLK can directly convert extra mana into throughput with Divine Plea. If you have enough Intellect or MP5 to delay your Plea to downtime, or even avoid using it at all during a fight, then that Intellect or MP5 are likely better throughput stats in this situation than spell-power or haste.
          </p>
          <p>
            We use Divine Plea to obtain a MP5 stat weight by essentially asking "how much is the reduced throughput worth in spellpower terms" and comparing it to "how much MP5 do we need so we can skip a plea".
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
      <div class="row">
        <div class="col-7">
          <h3>Int Stat Weight</h3>
          <p>
            Int has three components - 1. increased mana pool, 2. direct spellpower increase through Holy Guidance, and 3. increased crit chance. Having already calculated MP5 and Crit stat weights above, the calculation is straightforward and a breakdown is shown on the right.
          </p>
          <p>
            The increased mana pool is calculated by considering how much mana 1 int gives, after considering effects like Divine Plea, Replenishment, and Seal of Wisdom hits.
          </p>
          <p>
            By default, we assume that a player has 4 SoW hits a min (2 from Judgement, 1 from Sacred Shield and Plea - note that the spell component of judgement technically cannot be dodged, but for simplicity, we assume all SoW hits has the same miss/dodge chance.
          </p>
        </div>
        <div class="col-5">
          <b-table striped hover :items="results['tables']['int']"></b-table>
        </div>
      </div>
      <div class="row">
        <div class="col-7">
          <h3>Haste Stat Weight</h3>
          <p>
            Haste stat weight is calculated independently of all the above stats, and assumes no mana problems. Importantly, this means that we don't factor in situations like a higher haste rating causing the player to OOM faster and thus reducing output.
          </p>
          <p>
            Use the TTOOM tool to get a rough idea of how long you can sustain and adjust your weights accordingly.
          </p>
        </div>
        <div class="col-5">
          <b-table striped hover :items="results['tables']['haste']"></b-table>
        </div>
      </div>
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
  metaInfo: {
    title: 'Paladin Stat Weights',
  },
  data() {
    return {
      showExplanation: true,
      showResults: false,
      spellPower: 2400, // includes holy guidance; to extract out later
      manaPool: 28000,
      critChance: 30, // includes raid buffs
      hastePercent: 20,
      cpm: 40,
      glyphHolyLightHits: 5,
      critOverhealDiscountFactor: 10,
      results: {statWeights: [], tables: {}},
      fightLength: 5 * 60, // in seconds
      replenishmentUptime: 90,
      numSoWHitsPerMin: 4,
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
        critResults = this.calculateCrit(mp5Results[0]),
        intResults = this.calculateInt(mp5Results[0], critResults[0]),
        hasteResults = this.calculateHaste();

      let statWeights = [
      {'stat': 'Spellpower', 'value': 1},
        {'stat': 'MP5', 'value': this.roundDp(mp5Results[0], 1)},
        {'stat': 'Crit', 'value': this.roundDp(critResults[0], 1)},
        {'stat': 'Int', 'value': this.roundDp(intResults[0], 1)},
        {'stat': 'Haste', 'value': this.roundDp(hasteResults[0], 1)},
      ];

      Vue.set(this.results['tables'], 'mp5', mp5Results[1]);
      Vue.set(this.results['tables'], 'crit', critResults[1]);
      Vue.set(this.results['tables'], 'int', intResults[1]);
      Vue.set(this.results['tables'], 'haste', hasteResults[1]);
      
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

      mp5StatWeight = spellPowerLoss / totalManaRegenFromDivinePleaMp5;
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
        'value': this.roundDp(mp5StatWeight, 1)
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
      let totalCritStatWeight = critStatWeightFromManaRegen + critStatWeightFromIncreasedHealing;

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
        'value': this.roundDp(totalCritStatWeight, 1),
      });
      return [totalCritStatWeight, table];
    },
    calculateInt(mp5StatWeight, critStatWeight) {
      let table = [];

      // fight length in mins ==  number of divine plea (theoretically, a pally could use divine plea 6 times in a 5 min fight)
      // but unlikely to use at the start, so assume divine_plea_num is same as fight_length mins
      let numDivinePleas = Math.floor(this.fightLength / 60);
      let baseManaFromOneInt = 15 * 1.1 * 1.1 // includes blessing of kings and the mana talent
      let manaFromOneIntIncludingDivinePlea = baseManaFromOneInt * (1 + numDivinePleas * 0.25);
      // 1% of mana pool every 5s, assumes 100% replenishment rate
      let manaFromReplenishment = baseManaFromOneInt * 0.01 * this.fightLength / 60 * 12 * this.replenishmentUptime / 100;

      // for SOW, assume 45% proc chance per hit, 4% chance to miss and 6.5% chance to be dodged.
      let numSowProcsWholeFight = this.numSoWHitsPerMin * 0.45 * (1 - 0.04 - 0.065) * this.fightLength / 60;
      // 4% of manapool per successful sow proc; should multiply by the incremental mana from 1 int
      let manaFromSoW = numSowProcsWholeFight * baseManaFromOneInt * 0.04 ;

      let totalManaFromOneInt = manaFromOneIntIncludingDivinePlea + manaFromReplenishment + manaFromSoW;
      let implied_mp5 = totalManaFromOneInt / (this.fightLength / 60 * 12);
      // we can get a partial valuation of int purely from mp5 valuation
      let intStatWeightFromMp5 = implied_mp5 * mp5StatWeight;

      let intStatWeightFromHolyGuidance = 1.1 * 1.1 * 0.2;


      // # 166.667 points of Intellect equals 1% of Spell Critical.
      let critPercentIncreaseFromOneInt = 1.1 * 1.1 / 166.667;
      let intStatWeightFromSpellCrit = critPercentIncreaseFromOneInt * CRIT_RATING * critStatWeight
      let intStatWeight = intStatWeightFromMp5 + intStatWeightFromHolyGuidance + intStatWeightFromSpellCrit

      table.push({
        'field': 'Mana from Int & Plea',
        'value': this.roundDp(manaFromOneIntIncludingDivinePlea, 1),
      });

      table.push({
        'field': 'Mana from Replenishment',
        'value': this.roundDp(manaFromReplenishment, 1),
      });

      table.push({
        'field': 'Mana from SoW',
        'value': this.roundDp(manaFromSoW, 1),
      });

      table.push({
        'field': 'Total MP5 From Int',
        'value': this.roundDp(implied_mp5, 2),
      });

      table.push({
        'field': 'Stat Weight from Mana',
        'value': this.roundDp(intStatWeightFromMp5, 1),
      });

      table.push({
        'field': 'Stat Weight from Holy Guidance',
        'value': this.roundDp(intStatWeightFromHolyGuidance, 1),
      });

      table.push({
        'field': 'Stat Weight from Crit',
        'value': this.roundDp(intStatWeightFromSpellCrit, 1),
      });

      table.push({
        'field': 'Total Stat Weight',
        'value': this.roundDp(intStatWeight, 1),
      });
      return [intStatWeight, table];
    },
    calculateHaste() {
      const HOLY_LIGHT_BASE_CAST_TIME = 2;
      const OTHER_HASTE_MODIFIERS = 1.03 * 1.05 * 1.15; // moonkin, WoA, JotP

      const HL_HPS_COEFFICIENT = this.HL_CRIT_COEFFICIENT * (1 + this.hastePercent / 100) * OTHER_HASTE_MODIFIERS / HOLY_LIGHT_BASE_CAST_TIME;
      let table = [];
      // how much additional healing per second 1 spellpower gives you, using a cast time of 2 / (1 + haste%)
      // the raw healing per second of HL if you had 0% haste
      let hlUnhastedRawHps = this.hlRawHealing / HOLY_LIGHT_BASE_CAST_TIME * OTHER_HASTE_MODIFIERS;

      let increaseInHPSFromOnePercentageHaste = hlUnhastedRawHps / 100;
      let increaseInHPSFromOneHasteRating = increaseInHPSFromOnePercentageHaste / HASTE_RATING;
      let hasteStatWeightFromIncresedHealing = increaseInHPSFromOneHasteRating / HL_HPS_COEFFICIENT

      // console.log((1 + this.hastePercent / 100) * OTHER_HASTE_MODIFIERS)

      table.push({
        'field': 'Unhasted HPS',
        'value': this.formatNumber(Math.floor(hlUnhastedRawHps)),
      });

      table.push({
        'field': 'Increase in HPS from 0% to 1% haste',
        'value': this.formatNumber(Math.floor(increaseInHPSFromOnePercentageHaste)),
      });

      table.push({
        'field': 'Increase in HPS from x% to x+1% haste',
        'value': this.formatNumber(Math.floor(increaseInHPSFromOnePercentageHaste / (1 + this.hastePercent / 100))),
      });

      table.push({
        'field': 'Total Stat Weight',
        'value': this.roundDp(hasteStatWeightFromIncresedHealing, 2),
      });
      return [hasteStatWeightFromIncresedHealing, table];
    },
  },
  mounted() {
    console.log('mounting');
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
blockquote p {
  font-size: 0.8em;
  font-style: italic;
}
</style>
