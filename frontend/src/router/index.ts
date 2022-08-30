import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

import PaladinCalculator from
  '../components/calculator/PaladinComponent.vue';

import TTOOM from
  '../components/ttoom/MainComponent.vue';

import PaladinStatWeights from
  '../components/paladin/StatWeights.vue';

import PaladinOverhealingAnalyzer from
  '../components/paladin/OverhealingAnalyzer.vue';
  

import ShamanChainHealAnalyzer from
  '../components/shaman/ChainHealAnalyzer.vue';

Vue.use(VueRouter);


// TODO -> set up child routes for paladin
const routes: Array<RouteConfig> = [
  {
    path: '/paladin/statweights',
    name: 'paladin-stat-weights',
    component: PaladinStatWeights,
  },
  {
    path: '/paladin/ttoom/',
    name: 'paladin-ttoom',
    component: TTOOM,
    props: {playerClass: 'paladin'},
  },
  {
    path: '/shaman/ttoom/',
    name: 'shaman-ttoom',
    component: TTOOM,
    props: {playerClass: 'shaman'},
  },
  {
    path: '/shaman/analyzer/chainheal/',
    name: 'shaman-chainheal-analyzer',
    component: ShamanChainHealAnalyzer,
  },
  {
    path: '/paladin/analyzer/overhealing/',
    name: 'paladin-overhealing-analyzer',
    component: PaladinOverhealingAnalyzer,
  },
  {
    path: '/',
    name: 'home',
    component: PaladinCalculator
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
