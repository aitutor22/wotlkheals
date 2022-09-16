const Analyzer = require('./paladinOverhealingAnalyzer');
const DivinePleaAnalyzer = require('./paladinDivinePleaAnalyzer');
const shortTestData = require('./testdata/shortRoozeeHolyLight');
const divinePleaTestData = require('./testdata/simpleDamageTaken');


test('Analyzer base', () => {
    let analyzer = new Analyzer(shortTestData);
    analyzer.run();
});

test('divine plea helper', () => {
    // test only 1 element
    let data = JSON.parse(JSON.stringify(divinePleaTestData))
    let truncatedData = data['damageTaken']['data'].slice(0, 1);
    data['damageTaken']['data'] = truncatedData
    let analyzer = new DivinePleaAnalyzer(data);
    let results = analyzer.run(833382);
    expect(results['overall']).toEqual([0, 0, 0, 0, 0, 0, 3153]);
});


test('divine plea helper 2', () => {
    // test only 1 element
    let data = JSON.parse(JSON.stringify(divinePleaTestData))
    let truncatedData = data['damageTaken']['data'].slice(0, 4);
    data['damageTaken']['data'] = truncatedData
    let analyzer = new DivinePleaAnalyzer(data);
    let results = analyzer.run(833382);
});