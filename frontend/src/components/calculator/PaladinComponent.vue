<template>
  <div class="container">
    {{ spells }}
  </div>
</template>

<script>

import {paladin as spellData} from '../../gamevalues/spells';

// https://stackoverflow.com/questions/38085352/how-to-use-two-y-axes-in-chart-js-v2
export default {
  name: 'PaladinCalculator',
  props: {
  },
  data() {
    return {
      // includes holy guidance; to extract out later
      spellPower: 2400,
      manaPool: 28000,
    };
  },
  computed: {
    spells() {
      // if (!this.baseChartData) return;
      // let _spells = JSON.parse(JSON.stringify(spellData));
      return spellData;
    },
  },
  methods: {
  },
  mounted() {
    console.log('mounting');
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
