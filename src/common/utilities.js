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
    }
}

module.exports = helperFunctions;