import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

import PaladinCalculator from
  '../components/calculator/PaladinComponent.vue';

import PaladinTTOOM from
  '../components/paladin/TimeToOomComponent.vue';

import PaladinStatWeights from
  '../components/paladin/StatWeights.vue';

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
    component: PaladinTTOOM,
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
