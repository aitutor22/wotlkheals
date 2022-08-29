const Utility = require('../../common/utilities');
const DATA = require('../gamevalues');
const BaseTrinketComparisonSim = require('./baseTrinketComparisonSim');

test('test generate trinkets', () => {
    let result = BaseTrinketComparisonSim.generateTrinkets(['soup', 'eog', 'dmcg']);
    expect(result.length).toBe(2);

    result = BaseTrinketComparisonSim.generateTrinkets(['soup', 'illustration', 'dmcg']);
    expect(result.length).toBe(3);

    result = BaseTrinketComparisonSim.generateTrinkets(['soup', 'illustration', 'dmcg', 'eog']);
    expect(result.length).toBe(4);
});