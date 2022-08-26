import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

import PaladinCalculator from
  '../components/calculator/PaladinComponent.vue';

import TTOOM from
  '../components/ttoom/MainComponent.vue';

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
