const Analyzer = require('./paladinOverhealingAnalyzer');
const shortTestData = require('./testdata/shortRoozeeHolyLight');


test('Analyzer base', () => {
    let analyzer = new Analyzer(shortTestData);
    analyzer.run();
    // // expect(analyzer._healingData.length).toBe(6);
    // let results = analyzer.categorizeChainHeal(3);
    // expect(results['counter'][1]).toBe(4);
    // expect(results['counter'][3]).toBe(1);
    // expect(results['totalCasts']).toBe(5);
});