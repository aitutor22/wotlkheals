<template>
  <div class="container">
    Pally TTOOM
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
    };
  },
  computed: {
  },
  methods: {
  },
  mounted() {
    console.log('mounting');
    axios
        .get('/ttoom/paladin/')
        .then((response) => {
          console.log(response);
        });
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
