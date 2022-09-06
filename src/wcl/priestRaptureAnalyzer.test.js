const Analyzer = require('./priestRaptureAnalyzer');
const fourHorseMenData = require('./testdata/4hmrapture');


test('Analyzer base', () => {
    let analyzer = new Analyzer(fourHorseMenData);
    analyzer.run(7014294);
});