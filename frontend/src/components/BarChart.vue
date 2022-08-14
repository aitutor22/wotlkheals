<template>
  <Bar
    :chart-options="chartOptions"
    :chart-data="chartData"
    :chart-id="chartId"
    :dataset-id-key="datasetIdKey"
    :plugins="plugins"
    :css-classes="cssClasses"
    :styles="styles"
    :width="width"
    :height="height"
  />
</template>

<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, BarElement, CategoryScale, LinearScale)

/* eslint-disable */

export default {
  name: 'BarChart',
  components: { Bar },
  props: {
    chartId: {
      type: String,
      default: 'bar-chart'
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    chartData: {
      type: Object,
      default: () => {}
    },
    chartValues: {
      type: Array,
      default: () => []
    },
    width: {
      type: Number,
      default: 400
    },
    height: {
      type: Number,
      default: 400
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => {}
    },
    plugins: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    test() {

    },
  },
  data() {
    return {
      chartOptions: {
        responsive: true,
        onClick: this.handle,
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Time to OOM (s)',
            },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              stepSize: 10,
            }
          }
        },
        // legend: {
        //   display: false,
        // },
      }
    }
  },
  methods: {
    handle(event, bars) {
      if (bars.length === 0) return;
      this.$emit('on-receive', {
        index: bars[0].index,
      });
    }
  }
}
</script>