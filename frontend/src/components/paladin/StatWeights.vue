<template>
  <div class="container">
    Stat Weights
  </div>
</template>

<script>


export default {
  name: 'PaladinStatWeights',
  props: {
  },
  data() {
    return {
      spellPower: 2400, // includes holy guidance; to extract out later
      manaPool: 28000,
      baseCritChance: 0.15, // do not include crit % from raid buffs as that will be added)
      baseHastePercent: 0.15, // do not include haste % from raid buffs as that will be added)
      cpm: 40,
    };
  },
  computed: {
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
