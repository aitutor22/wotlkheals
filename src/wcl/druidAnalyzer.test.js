const Analyzer = require('./druidAnalyzer');
const shortTestData = require('./testdata/frankDruid');


test('Analyzer base', () => {
    let analyzer = new Analyzer(shortTestData);
    analyzer.run(4599873);
});



https://classic.warcraftlogs.com/reports/ynJgVQCLTxAPdrWw#type=resources&fight=last&pins=2%24Off%24%23244F4B%24expression%24ability.name%3D%22Revitalize%22&spell=100&view=events