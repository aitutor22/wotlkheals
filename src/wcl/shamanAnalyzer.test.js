// const Utility = require('../common/utilities');
const Analyzer = require('./shamanAnalyzer');
const shortTestData = require('./testdata/shortShamanChainHeal');
const shortLovelaceTestData = require('./testdata/lovelaceShortShaman');
const testData = require('./testdata/shamanChainHeal');
const loathebTestData = require('./testdata/loathebChainHeal');


// test('calculateOverhealing', () => {
//     const _data = [
//         {
//             "timestamp": 4000,
//             "type": "heal",
//             "sourceID": 33,
//             "targetID": 35,
//             "abilityGameID": 25423,
//             "fight": 16,
//             "hitType": 2,
//             "amount": 1505,
//             "overheal": 0,
//             "targetMarker": 3
//         },
//         {
//             "timestamp": 4000,
//             "type": "heal",
//             "sourceID": 33,
//             "targetID": 35,
//             "abilityGameID": 25422,
//             "fight": 16,
//             "hitType": 1,
//             "amount": 1912,
//             "overheal": 200,
//             "targetMarker": 3
//         },
//         {
//             "timestamp": 4000,
//             "type": "heal",
//             "sourceID": 33,
//             "targetID": 35,
//             "abilityGameID": 25422,
//             "fight": 16,
//             "hitType": 1,
//             "amount": 930,
//             "overheal": 2670,
//             "targetMarker": 3
//         }];
//     let results = Analyzer.calculateOverhealing(_data, {1: [], 2: [], 3: []});
//     expect(Math.abs(results[1] - 0.7416666666666667)).toBeLessThan(0.0001);
//     expect(Math.abs(results[2] - 0.0946969696969697)).toBeLessThan(0.0001);
//     expect(Math.abs(results[3] - 0)).toBeLessThan(0.0001);
// });

test('Analyzer base', () => {
    let analyzer = new Analyzer(shortTestData);
    // expect(analyzer._healingData.length).toBe(6);
    let results = analyzer.categorizeChainHeal(3);
    expect(results['counter'][1]).toBe(4);
    expect(results['counter'][3]).toBe(1);
    expect(results['totalCasts']).toBe(5);
});

// test('Analyzer adding two casts', () => {
//     let analyzer = new Analyzer(shortTestData);
//     let results = analyzer.categorizeChainHeal(3);
//     expect(results['counter'][1]).toBe(4);
//     expect(results['counter'][3]).toBe(1);
//     expect(results['totalCasts']).toBe(5);

//     // adding one new cast with 2 hits
//     analyzer._healingData.push({
//         "timestamp": 15000,
//         "type": "heal",
//         "sourceID": 33,
//         "targetID": 16,
//         "abilityGameID": 25422,
//         "fight": 16,
//         "hitType": 1,
//         "amount": 1366,
//         "overheal": 561
//     });

//     analyzer._healingData.push({
//         "timestamp": 15100,
//         "type": "heal",
//         "sourceID": 33,
//         "targetID": 16,
//         "abilityGameID": 25422,
//         "fight": 16,
//         "hitType": 1,
//         "amount": 1366,
//         "overheal": 561
//     });

//     results = analyzer.categorizeChainHeal(3);
//     expect(results['counter'][1]).toBe(4);
//     expect(results['counter'][2]).toBe(1);
//     expect(results['counter'][3]).toBe(1);
//     expect(results['totalCasts']).toBe(6);
// });

// test('Analyzer adding two casts with nature swiftness', () => {
//     let analyzer = new Analyzer(shortTestData);
//     // expect(analyzer._healingData.length).toBe(6);
//     let results = analyzer.categorizeChainHeal(3);
//     expect(results['counter'][1]).toBe(4);
//     expect(results['counter'][3]).toBe(1);
//     expect(results['totalCasts']).toBe(5);

//     // adding one new cast with 2 hits
//     analyzer._healingData.push({
//         "timestamp": 15000,
//         "type": "heal",
//         "sourceID": 33,
//         "targetID": 16,
//         "abilityGameID": 25422,
//         "fight": 16,
//         "hitType": 1,
//         "amount": 1366,
//         "overheal": 561
//     });

//     analyzer._healingData.push({
//         "timestamp": 15200,
//         "type": "heal",
//         "sourceID": 33,
//         "targetID": 16,
//         "abilityGameID": 25422,
//         "fight": 16,
//         "hitType": 1,
//         "amount": 1366,
//         "overheal": 561
//     });

//     analyzer._natureSwiftnessCastData.push({
//         "timestamp": 15100,
//         "type": "cast",
//         "sourceID": 33,
//         "abilityGameID": 16188,
//     });

//     results = analyzer.categorizeChainHeal(3);
//     expect(results['counter'][1]).toBe(6);
//     expect(results['counter'][2]).toBe(0);
//     expect(results['counter'][3]).toBe(1);
//     expect(results['totalCasts']).toBe(7);
// });


// test('Analyzer lovelace', () => {
//     let analyzer = new Analyzer(shortLovelaceTestData);
//     let results = analyzer.categorizeChainHeal(3);
//     expect(results['counter'][1]).toBe(4);
//     expect(results['counter'][2]).toBe(2);
//     expect(results['counter'][3]).toBe(4);
//     expect(results['totalCasts']).toBe(10);
// });


// test('Analyzer loatheb', () => {
//     let analyzer = new Analyzer(loathebTestData);
//     let results = analyzer.categorizeChainHeal(4);
//     // expect(results['counter'][1]).toBe(4);
//     // expect(results['counter'][3]).toBe(1);
//     // expect(results['totalCasts']).toBe(5);
//     console.log(results)
// });