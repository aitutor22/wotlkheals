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
}

module.exports = helperFunctions;