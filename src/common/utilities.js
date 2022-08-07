const helperFunctions = {
    roundDp(num, dp) {
        let x = 10 ** dp;
        return Math.round((num + Number.EPSILON) * x) / x;
    },
    getKeyBoolean(obj, key) {
        return (obj && typeof obj[key] !== 'undefined') && obj[key];
    },
}

module.exports = helperFunctions;