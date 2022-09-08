require('dotenv').config();
const WclReader = require('./wcl');


test('constructor', () => {
    let wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': -99,
        'fightId': -99,
    });

    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#type=healing&source=19');
    expect(wclReader._defaultLinkData).toEqual({
        'url': 'https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#type=healing&source=19',
        'code': 'ZTC3FGfNrL4VY1A9',
        'sourceId': 19,
        'fightId': -99,
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
});


test('getFightTimes', async () => {
    // stores fightId=last
    wclReader = new WclReader('https://classic.warcraftlogs.com/reports/ZTC3FGfNrL4VY1A9#fight=last&type=healing&source=19');
    await wclReader.getFightTimes();
    expect(wclReader._lastFightId).toBe(58);
    expect(wclReader._fightTimesMap[57]).toEqual({
        id: 57,
        encounterID: 101119,
        name: 'Sapphiron',
        startTime: 7555420,
        endTime: 7799498
      })
});