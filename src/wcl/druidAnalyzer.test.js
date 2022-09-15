const Analyzer = require('./druidAnalyzer');
const shortTestData = require('./testdata/frankDruid');


test('Analyzer base', () => {
    let analyzer = new Analyzer(shortTestData);
    analyzer.run(4599873);
});