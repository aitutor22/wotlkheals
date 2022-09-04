import axios from 'axios';
import Vue from 'vue';
import vSelect from 'vue-select';
import VueMeta from 'vue-meta'
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import {BootstrapVue, IconsPlugin} from 'bootstrap-vue';

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'vue-select/dist/vue-select.css';


// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(VueMeta);
Vue.component('v-select', vSelect);
Vue.config.productionTip = false;

// to update
// axios.defaults.baseURL = 'http://localhost:3000/api/';
axios.defaults.baseURL = '/api/';


new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
