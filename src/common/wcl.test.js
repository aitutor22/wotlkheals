require('dotenv').config();
const WclReader = require('./wcl');


test('constructor', () => {
    // not passings in specific fight defaults to to all
    let wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': null,
        'fightId': 'all',
    });

    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#type=healing&source=19');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#type=healing&source=19',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': 19,
        'fightId': 'all',
    });

    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=8&type=healing&source=19');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=8&type=healing&source=19',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': 19,
        'fightId': 8,
    });

    // stores fightId=last
    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=last&type=healing&source=19');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=last&type=healing&source=19',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': 19,
        'fightId': 'last',
    });

    // tests when opponent passes in only trash
    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#boss=0&difficulty=0');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#boss=0&difficulty=0',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': null,
        'fightId': 'trash',
    });

    // bosses only
    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#boss=-2&difficulty=0');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#boss=-2&difficulty=0',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': null,
        'fightId': 'bosses',
    });

    // all
    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#boss=-3&difficulty=0');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#boss=-3&difficulty=0',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': null,
        'fightId': 'all',
    });
});

// commenting out temporarily to reduce call to wcl and test time
// test('getFightTimes', async () => {
//     // stores fightId=last
//     wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=last&type=healing&source=19');
//     await wclReader.getFightTimes();
//     expect(wclReader._lastFightId).toBe(58);
//     expect(wclReader._fightTimesMap[57]).toEqual({
//         id: 57,
//         encounterID: 101119,
//         name: 'Sapphiron',
//         startTime: 7555420,
//         endTime: 7799498
//       })
// });

test('createEventsSubqueryHelper', async () => {
    // stores fightId=last
    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=last&type=healing&source=19');
    await wclReader.getFightTimes();
    let results = wclReader.createEventsSubqueryHelper('healing', 35)
    // with no options passed in; note limit: 10000 is default
    expect(results).toBe('healing: events(startTime: 4629571, endTime: 4629604, sourceID: 19, limit: 10000) { data }');

    results = wclReader.createEventsSubqueryHelper('healing', 35, {dataType: 'Healing'})
    expect(results).toBe('healing: events(startTime: 4629571, endTime: 4629604, sourceID: 19, dataType: Healing, limit: 10000) { data }');

    // passing in blank value for sourceId will cause it not to apepar in subquery
    results = wclReader.createEventsSubqueryHelper('healing', 35, {dataType: 'Healing', sourceID: ''})
    expect(results).toBe('healing: events(startTime: 4629571, endTime: 4629604, dataType: Healing, limit: 10000) { data }');

    results = wclReader.createEventsSubqueryHelper('healing', 35, {dataType: 'Healing', sourceID: '', useAbilityIDs: true})
    expect(results).toBe('healing: events(startTime: 4629571, endTime: 4629604, dataType: Healing, useAbilityIDs: true, limit: 10000) { data }');

    results = wclReader.createEventsSubqueryHelper('healing', 35, {dataType: 'Healing', sourceID: '', useAbilityIDs: false, limit: 1000})
    expect(results).toBe('healing: events(startTime: 4629571, endTime: 4629604, dataType: Healing, useAbilityIDs: false, limit: 1000) { data }');
});

// healing: events(startTime: ${fightTime.startTime}, endTime:  ${fightTime.endTime}, dataType: Healing, useAbilityIDs: true, sourceID: ${sourceId}, limit:10000, filterExpression: "(ability.id != 66922) and (ability.name='Holy Light' or ability.name='Flash of Light' or ability.name='Sacred Shield' or ability.name='Beacon of Light' or ability.id=54968 or ability.name='Holy Shock')")  { data }


// // commenting out temporarily to reduce call to wcl and test time
// test('runQuery', async () => {
//     // stores fightId=last
//     wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=last&type=healing&source=49');
//     let result = await wclReader.runQuery([{key: 'healing', dataType: 'Healing', useAbilityIDs: false, limit: 1000}], 'last');
//     // console.log(result);

// });

// test('pulling pagination', async () => {
//     jest.setTimeout(30000);
//     // stores fightId=last
//     wclReader = new WclReader('https://classic.warcraftlogs.com/reports/dVhMH1Pqb6KaDRL9#fight=38');
//     let result = await wclReader.runQuery([{key: 'damageTaken', dataType: 'DamageTaken', limit: 100}]);
//     expect(result['damageTaken'].length).toBe(635);
// }, 30000);

test('pulling pagination2', async () => {
    // stores fightId=last
    // 
    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/dVhMH1Pqb6KaDRL9#fight=59');
    let result = await wclReader.runQuery([{key: 'damageTaken', dataType: 'DamageTaken', limit: 200}, {key: 'healing', dataType: 'Healing', limit: 800}]);
    expect(result['damageTaken'].length).toBe(353);
    expect(result['healing'].length).toBe(8427);
}, 60000);