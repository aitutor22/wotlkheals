const ss = require('simple-statistics');
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
    percentile(numbers, q) {
        return ss.quantile(numbers, q);
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
    medianStatistics(arr, key, value, roundingMethod='floor') {
        let totals = {}, toReturn = []
            roundingFunc = null,
            app = this;

        if (roundingMethod === 'floor') {
            roundingFunc = Math.floor
        } 
        // uses closure to create a function that rounds numbers to 1 dp
        else if (roundingMethod === '1dp') {
            roundingFunc = ((dp) => {
                return (num) => {
                    return app.roundDp(num, dp);
                }
            })(1);
        }

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
            _newRow[value] = roundingFunc(this.median(totals[entry]));
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
    // given a list of objects, bins them using the inputted value field
    // also keeps a record of the objects (useful when we want to know which seeds led to which results)
    createBins(arr, numBins, valueFieldName) {
        let values = arr.map(entry => entry[valueFieldName]),
            minValue = Math.floor(Math.min(...values)), maxValue = Math.ceil(Math.max(...values)),
            binSize = (maxValue - minValue) / numBins, bins = [];

        for (let i = 0; i < numBins; i++) {
            bins.push({
                minNum: this.roundDp(minValue + binSize * i, 1),
                maxNum: this.roundDp(minValue + binSize * (i + 1), 1),
                count: 0,
                entries: [],
            });
        }

        // unoptimised - should probably sort to optimise - todo
        //Loop through data and add to bin's count
        for (let i = 0; i < arr.length; i++) {
          let item = arr[i];
          for (let j = 0; j < bins.length; j++) {
            let bin = bins[j];
            if(item[valueFieldName] >= bin.minNum && item[valueFieldName] <= bin.maxNum) {
              bin.count++;
              bin.entries.push(item);
              break;  // An item can only be in one bin.
            }
          }  
        }
        return bins;
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
        // very important step '123' and 123 give different values
        seed = Number(seed);
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
    // game play functions
    calculateProcBasedMp5(procValue, procICD, procChance, castTime) {
      // what is expected amount of time to get 1 proc? internal_cooldown + cast_time * expected_number_of_casts_required
      // expected_number_of_casts_required is 1 / proc_chance
      // so expected time = internal_cooldown + cast_time / proc_chance
      // we then calculate expected_mp5 by value / expected_time * 5
      return Math.floor(procValue / (procICD + castTime / procChance) * 5);
    },
}

module.exports = helperFunctions;