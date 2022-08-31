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
    setCharSheetInt(state: any, value: number) {
      Vue.set(state.oomOptions, 'charSheetInt', value);
    },
  },
  actions: {
  },
  getters: {
  },

};
