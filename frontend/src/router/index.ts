import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

import PaladinCalculator from
  '../components/calculator/PaladinComponent.vue';

Vue.use(VueRouter);

// const routes = [
//   // {path: '/priestoom', component: PriestTimeToOOM, name: 'priest-time-to-oom'},
//   // {path: '/greaterheal', component: GreaterHeal, name: 'greater-heal'},
//   // {path: '/flashheal', component: FlashHeal, name: 'flash-heal'},
//   // {path: '/renew', component: Renew, name: 'renew'},
//   // {path: '/circleofhealing', component: CircleOfHealing, name: 'coh'},
//   // {path: '/shamanoom', component: ShamanTimeToOOM, name: 'shaman-time-to-oom'},
//   // {path: '/chainheal', component: ChainHeal, name: 'chain-heal'},
//   // {path: '/lesserhealingwave', component: LesserHealingWave, name: 'lesser-healing-wave'},
//   // {path: '/healingwave', component: HealingWave, name: 'healing-wave'},
//   // {path: '/holylight', component: HolyLight, name: 'holy-light'},
//   // {path: '/flashoflight', component: FlashOfLight, name: 'flash-of-light'},
//   {path: '/calculator/paladin', component: PaladinCalculator, name: 'paladin-calculator'},
//   // {path: '/death-analyzer', component: DeathAnalyzer, name: 'death-analyzer'},
//   // {path: '*', component: DeathAnalyzer, name: 'death-analyzer'},
// ];

// const router = new VueRouter({
//   routes,
//   mode: 'history',
//   base: '/',
// });


const routes: Array<RouteConfig> = [
  {
    path: '/calculator/paladin',
    name: 'paladin-calculator',
    component: PaladinCalculator,
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
