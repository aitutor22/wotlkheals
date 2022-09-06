const data = {
    rapture: {
        // to save computation and reduce calls, we only pull effects that deal at least 2k damage
        minimumRawDamage: 2000, 
        includeMelee: false,
        abilitiesToExclude: ['Divine Sacrifice', 'Falling', 'Shadow Word: Death'],
        minThresholdToReport: 2,
    }
}

module.exports = data;