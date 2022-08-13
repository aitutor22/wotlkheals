const seedrandom = require('seedrandom');

const helperFunctions = {
    // number functions
    roundDp(num, dp) {
        let x = 10 ** dp;
        return Math.round((num + Number.EPSILON) * x) / x;
    },
    anyValueBelowThreshold(arr, thresholdValue) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] < thresholdValue) return true;
        }
        return false;
    },
    median(numbers) {
        const sorted = Array.from(numbers).sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
    },
    // given an array of dicts, returns the median value, and the element that contains it
    // in the case of equal numbers, return the element just before the middle line (rather than dividing)
    // because we want to get element
    medianArrDict(numbers, key) {
        const sorted = Array.from(numbers).sort((a, b) => a[key] - b[key]);
        const middle = Math.floor(sorted.length / 2);
        // this is different from how the typical median function works, but for our purposes (want to return median time and its log)
        // is ok
        if (sorted.length % 2 === 0) {
            return sorted[middle - 1];
        }
        return sorted[middle];
    },
    // given an arr of dictionaries, determine the median values (key is source, value is MP5)
    /*
        [
          [{ source: 'Libram', MP5: 299 }, { source: 'Illumination', MP5: 551 },],
          [{ source: 'Libram', MP5: 298 }, { source: 'Illumination', MP5: 483 },],
          [{ source: 'Libram', MP5: 300 },{ source: 'Illumination', MP5: 403 },]
        ]
    */
    medianStatistics(arr, key, value) {
        let totals = {}, toReturn = [];
        for (let i = 0; i < arr.length; i++) {
            for (let entry of arr[i]) {
                if (!(entry[key] in totals)) totals[entry[key]] = [];
                totals[entry[key]].push(entry[value]);
            }
        }
        // entry would be values like Libram, or Illumination (aka the source feld)
        for (let entry in totals) {
            let _newRow = {};
            _newRow[key] = entry;
            _newRow[value] = Math.floor(this.median(totals[entry]));
            toReturn.push(_newRow); 
        }
        // sorts in descending order
        toReturn.sort((a, b) => b[value] - a[value]);
        return toReturn;
    },
    sum(numbers) {
        const reducer = (accumulator, curr) => accumulator + curr;
        return numbers.reduce(reducer);
    },
    // adds thousand separator to a number
    formatNumber (num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
    },

    // string functions
    camalize(str) {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    },
    capitalizeFirstLetter(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // random functions
    // seeding rng if a seed is passed in (default is 0, which means user didnt pass in)
    // otherwise just use random seed
    setSeed(seed=0) {
        let rng;
        if (seed > 0) {
            rng = seedrandom(seed);
        } else {
            rng = seedrandom(Math.random());
        }
        return rng;
    },
    // Randomize array in-place using Durstenfeld shuffle algorithm 
    shuffleArray(array, rng) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    // other functions
    getKeyBoolean(obj, key) {
        return (obj && typeof obj[key] !== 'undefined') && obj[key];
    },
}

module.exports = helperFunctions;