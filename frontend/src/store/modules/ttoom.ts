import Vue from 'vue';


const getDefaultState = () => {
  // note: index resets for every subtrack
  const results = {
    oomOptions: null,
  };

  return results;
};

const state = getDefaultState();

// changed name to dailyChallengeModule rather than dailyChallenge
// since it was easy to accidentally name a variable dailyChallenge
export const ttoom = {
  namespaced: true,
  state,
  mutations: {
    resetStateMutation(state: object) {
      Object.assign(state, getDefaultState());
    },
    setOomOptions(state: object, value: object) {
      Vue.set(state, 'oomOptions', value);
    },
    setCharSheetStats(state: any, payLoad: any) {
      Vue.set(state.oomOptions.charSheetStats, payLoad['key'], payLoad['value']);
    },
    setStatsBeforeTrinket(state: any, payLoad: any) {
      Vue.set(state.oomOptions.statsBeforeTrinket, payLoad['key'], payLoad['value']);
    },
  },
  actions: {
  },
  getters: {
  },

};
