const WclService = require('../common/wclservices');
const WclReader = require('../common/wcl');
const ShamanAnalyzer = require('../wcl/shamanAnalyzer');
const PaladinOverhealingAnalyzer = require('../wcl/paladinOverhealingAnalyzer');
const PriestRaptureAnalyzer = require('../wcl/priestRaptureAnalyzer');
const DruidRevitalizeAnalyzer = require('../wcl/druidAnalyzer');

const analyzerOptions = require('../wcl/analyzerOptions');

// // // rapture
// // https://classic.warcraftlogs.com/reports/nXarWYFR3tx1dJBH#type=resources&fight=4&view=events&pins=2%24Off%24%23244F4B%24expression%24ability.name%3D%22Rapture%22&spell=101
// async function a() {
//         let wclReader = new WclReader('https://classic.warcraftlogs.com/reports/qtZMRdhV43K7fc28#boss=-2&difficulty=0&type=deaths');
//         let reportData = await wclReader.runQuery([
//             {key: 'deaths', dataType: 'Deaths'}
//         ]);
//         console.log(reportData['deaths']['data'].length)
//         // console.log(reportData['revitalize']['data'])
//         // console.log(reportData['revitalize']['data'].length)
//         // fs = require('fs');
//         // let text = JSON.stringify(reportData['revitalize']['data']);
//         // fs.writeFile('data.txt', text, function (err) {
//         //   if (err) return console.log(err);
//         //   console.log('finshed saving');
//         //   // console.log('Hello World > helloworld.txt');
//         // });
// }

// a();

exports.chainheal = async (req, res) => {
    const link = req.body.wclLink;
    try {
        let wclReader = new WclReader(link);
        let reportData = await wclReader.runQuery([
            {key: 'healing', dataType: 'Healing', useAbilityIDs: true, limit: 10000, filterExpression: "ability.name='Chain Heal'"},
            {key: 'natureSwiftness', dataType: 'Casts', useAbilityIDs: true, limit: 10000, abilityID: 16188},
        ]);

        let analyzer = new ShamanAnalyzer(reportData);
        res.send(analyzer.categorizeChainHeal());
    } catch (error) {
        console.log('error with chain heal analyzer');
        console.log(error);
        res.status(400).send(error.message);
    }
};

// paladin
exports.overhealing = async (req, res) => {
    const link = req.body.wclLink;
    if (link.indexOf('source=') === -1) {
        return res.status(400).send({message: 'Invalid url link'});
    }

    try {
        let wclReader = new WclReader(link);
        // 66922 refers to FoL hot - exclude that
        // 54968 is glyph of HL - for some reason, using .name doesnt work for it
        let reportData = await wclReader.runQuery([
            {key: 'healing', dataType: 'Healing', useAbilityIDs: true, limit: 10000, filterExpression: "(ability.id != 66922) and (ability.name='Holy Light' or ability.name='Flash of Light' or ability.name='Sacred Shield' or ability.name='Beacon of Light' or ability.id=54968 or ability.name='Holy Shock')"},
        ]);
        let analyzer = new PaladinOverhealingAnalyzer(reportData);
        res.send(analyzer.run());
    } catch (error) {
        res.status(400).send(error.message)
    }
};


// doesn't support pagination currently, need to add
exports.rapture = async (req, res) => {
    let link = req.body.wclLink;
    // rapture shouldnt have sourceId -> will screw up the analyser as it will only returns damage hitting the source target
    if (link.indexOf('source=') > -1) {
        link = link.replace(/source=[-\d]+/, '');
    }

    let overrideFightId = null;

    // if a specific fightId is passed, then use it
    if (req.body['fightId']) {
        overrideFightId = Number(req.body['fightId'])
    } 

    try {
        let wclReader = new WclReader(link, overrideFightId);
        let reportData = await wclReader.runQuery([
            {key: 'damageTaken', dataType: 'DamageTaken', useAbilityIDs: false, limit: 10000, filterExpression: "ability.name != 'Melee'"},
        ]);

        let analyzer = new PriestRaptureAnalyzer(reportData);
        let results = analyzer.run(wclReader.fightTime['startTime']);
        res.send({
            data: results,
            otherFightOptions: wclReader._otherFightOptions,
            currentFightId: wclReader._selectedFightId,
        });
    } catch (error) {
        res.status(400).send(error.message)
    }
};

exports.revitalize = async (req, res) => {
    let link = req.body.wclLink;
    // revitalize shouldnt have sourceId
    if (link.indexOf('source=') > -1) {
        link = link.replace(/source=[-\d]+/, '');
    }

    let overrideFightId = null;
    // if a specific fightId is passed, then use it
    if (req.body['fightId']) {
        overrideFightId = Number(req.body['fightId'])
    } 

    try {
        let wclReader = new WclReader(link, overrideFightId);
        let reportData = await wclReader.runQuery([
            {key: 'revitalize', dataType: 'Resources', useAbilityIDs: true, limit: 10000, filterExpression: "ability.name= 'Revitalize'"},
            {key: 'wildgrowth', dataType: 'Healing', useAbilityIDs: true, limit: 10000, filterExpression: "ability.name= 'Wild Growth'"},
            {key: 'rejuvenation', dataType: 'Healing', useAbilityIDs: true, limit: 10000, filterExpression: "ability.name= 'Rejuvenation'"},
        ]);

        let analyzer = new DruidRevitalizeAnalyzer(reportData);
        let results = analyzer.run(wclReader.fightTime['startTime'], wclReader._petIds);
        res.send(results);
    } catch (error) {
        res.status(400).send(error.message)
    }
};

// // doesn't support pagination currently, need to add
// exports.rapture = (req, res) => {
//     const link = req.body.wclLink;

//     try {
//         // looks for wclCode, and sourceId
//         const getWclCodeRegex = /(.*reports\/)?(\w{16}).*/;
//         const found = link.match(getWclCodeRegex);
//         const wclCode = found[2];

//         // fightId needs to be found separately because it's possbile that user passes in "last" as a value
//         let fightId;

//         // if a specific fightId is passed, then use it
//         if (req.body['fightId']) {
//             fightId = Number(req.body['fightId'])
//         } 
//         // otherwise get fightId from url
//         else {
//             if (link.indexOf('fight=') === -1) {
//                 fightId = 'all'; // search whole report
//             } else if (link.indexOf('fight=last') > -1) {
//                 fightId = 'last';
//             } else {
//                 let fightIdFound = link.match(/.*fight=(\d+).*/)
//                 fightId = fightIdFound[1];
//             }
//         }

//         WclService.getFightDetail(wclCode, fightId, true)
//             .then((_fightData) => {
//                 let fightTime = _fightData['fightDetail'];

//                 // converts the fight map data into a selection
//                 // [{label: 'Canada', code: 'ca'}]
//                 let otherFightOptions = Object.values(_fightData['fullFightMapData']).map((entry) => {
//                     let fightLength = Math.floor((entry['endTime'] - entry['startTime']) / 1000);
//                     // hackish code - doesn't work for fights that last >= 10mins; refactor and add to utilities in future
//                     let timeString = new Date(fightLength * 1000).toISOString().substr(14, 5);
//                     return {
//                         label: `${entry['name']} (${timeString})`,
//                         fightId: entry['id'],
//                     }
//                 });

//                 let body =  { 
//                     query: `
//                         query {
//                             reportData {
//                                 report(code: "${wclCode}") {
//                                     damageTaken: events(startTime: ${fightTime.startTime}, endTime:  ${fightTime.endTime}, dataType: DamageTaken, useAbilityIDs: false, limit:10000, filterExpression: "ability.name != 'Melee'")  { data }
//                                 }
//                             }
//                         }
//                     `,
//                 };
//                 return WclService.pullData(body)
//                     .then((wclResponse) => {
//                         // console.log(wclResponse.data);
//                         // let healingEvents = wclResponse.data.data.reportData.report.damageTaken.data;
//                         // console.log(healingEvents.length)
//                         let analyzer = new PriestRaptureAnalyzer(wclResponse.data);
//                         let results = analyzer.run(fightTime['startTime']);
//                         res.send({
//                             data: results,
//                             otherFightOptions: otherFightOptions,
//                             // use this rather than fightId above because fightId could be last
//                             // fightTime['id'] is already converted to a number even for last fight
//                             currentFightId: fightTime['id'],
//                         });
//                     })
//             })
//     } catch (error) {
//         res.status(400).send(error.message)
//     }
// };