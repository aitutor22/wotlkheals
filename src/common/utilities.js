const helperFunctions = {
    roundDp(num, dp) {
        let x = 10 ** dp;
        return Math.round((num + Number.EPSILON) * x) / x;
    },
    getKeyBoolean(obj, key) {
        return (obj && typeof obj[key] !== 'undefined') && obj[key];
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
    sum(numbers) {
        const reducer = (accumulator, curr) => accumulator + curr;
        return numbers.reduce(reducer);
    },
    camalize(str) {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    }
}

module.exports = helperFunctions;