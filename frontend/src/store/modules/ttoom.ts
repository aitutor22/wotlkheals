// import Vue from 'vue';


const getDefaultState = () => {
  // note: index resets for every subtrack
  const results = {
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
  },
  actions: {
  },
  getters: {
  },

};
