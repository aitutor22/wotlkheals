const WclService = require('../common/wclservices');
const WclReader = require('../common/wcl');
const ShamanAnalyzer = require('../wcl/shamanAnalyzer');
const PaladinOverhealingAnalyzer = require('../wcl/paladinOverhealingAnalyzer');
const PaladinDivinePleaAnalyzer = require('../wcl/paladinDivinePleaAnalyzer');
const PriestRaptureAnalyzer = require('../wcl/priestRaptureAnalyzer');
const PriestShieldAnalyzer = require('../wcl/priestShieldAnalyzer');
const DruidRevitalizeAnalyzer = require('../wcl/druidAnalyzer');

const analyzerOptions = require('../wcl/analyzerOptions');

// // // rapture
// // https://classic.warcraftlogs.com/reports/nXarWYFR3tx1dJBH#type=resources&fight=4&view=events&pins=2%24Off%24%23244F4B%24expression%24ability.name%3D%22Rapture%22&spell=101
// async function a() {
//         let wclReader = new WclReader('https://classic.warcraftlogs.com/reports/HnjJ4MfADp7hTt36#fight=56&type=healing&source=7');
//         let reportData = await wclReader.runQuery([
//             {key: 'healing', dataType: 'Healing', filterExpression: "ability.name='Power Word: Shield'"}
//         ]);
//         console.log(reportData['healing']['data'])
// //         // console.log(reportData['revitalize']['data'])
// //         // console.log(reportData['revitalize']['data'].length)
// //         // fs = require('fs');
// //         // let text = JSON.stringify(reportData['revitalize']['data']);
// //         // fs.writeFile('data.txt', text, function (err) {
// //         //   if (err) return console.log(err);
// //         //   console.log('finshed saving');
// //         //   // console.log('Hello World > helloworld.txt');
// //         // });
// }

// // a();

exports.chainheal = async (req, res) => {
    const link = req.body.wclLink;
    try {
        let wclReader = new WclReader(link);
        // using chain heal ids instead of name to avoid translation errors
        let filterExpression = 'ability.id in (1064, 10622, 10623, 25422, 25423, 55458, 55459)';
        let reportData = await wclReader.runQuery([
            {key: 'healing', dataType: 'Healing', useAbilityIDs: true, limit: 10000, filterExpression: filterExpression},
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


exports.divinePlea = async (req, res) => {
    const link = req.body.wclLink;
    if (link.indexOf('fight=') === -1) {
        return res.status(400).send({message: 'Invalid url link'});
    }

    try {
        let wclReader = new WclReader(link);
        let reportData = await wclReader.runQuery([
            {key: 'damageTaken', dataType: 'DamageTaken', useAbilityIDs: false, limit: 10000, filterExpression: "effectiveDamage > 0"},
        ]);
        // console.log(reportData)
        let analyzer = new PaladinDivinePleaAnalyzer(reportData);
        // fs = require('fs');
        // let text = JSON.stringify(reportData['damageTaken']['data']);
        // fs.writeFile('data.txt', text, function (err) {
        //   if (err) return console.log(err);
        //   console.log('finshed saving');
        //   // console.log('Hello World > helloworld.txt');
        // });
        res.send(analyzer.run(wclReader.fightTime['startTime']));
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

// we let the frontend handle most of the data processing
exports.shield = async (req, res) => {
    const link = req.body.wclLink;
    // need to pass in fight and source
    if (link.indexOf('fight=') === -1) {
        return res.status(400).send({message: 'Invalid url link'});
    }

    if (link.indexOf('source=') === -1) {
        return res.status(400).send({message: 'Invalid url link'});
    }

    let overrideFightId = null;

    // if a specific fightId is passed, then use it
    if (req.body['fightId']) {
        overrideFightId = Number(req.body['fightId'])
    } 
    try {
        let wclReader = new WclReader(link, overrideFightId);
        // to avoid translation issues, we avoid ability.name ="Power Word: Shield" as that wont work for german, etc log
        let filterExpression = 'ability.id in (48066, 48065, 25218, 25217, 10901, 10900, 10899, 10898, 6066, 6065, 3747, 600, 592, 17)'
        let reportData = await wclReader.runQuery([
            {key: 'casts', dataType: 'Casts', filterExpression: filterExpression},
            {key: 'healing', dataType: 'Healing', filterExpression: filterExpression, useAbilityIDs: false},
            // commands dictionary will not be added to subqery, meant to pass on some additional options
            // buffs are quite weird, and you need can't enter sourceID otherwise it will only pull buffs that are applied on sourceID on itself and
            {key: 'shieldBreaks', dataType: 'Buffs', filterExpression: filterExpression, commands: {noSourceId: true}},

            // initially, we looked for both 63654 (self rapture that is 2% of mana) and normal rapture (47755)
            // however, self rapture causes issues as system will try to look for a cause for self rapture since it creates 2 rapture events events for a single damage event
            {key: 'raptures', dataType: 'Resources', filterExpression: 'ability.id in (47755)'},
            // we only pull events that leads to shield breaks because we want to know which ability caused it
            // {key: 'damageTakenShieldBreaks', dataType: 'DamageTaken', useAbilityIDs: false, limit: 10000, filterExpression: "effectiveDamage > 0 and absorbedDamage > 0", commands: {noSourceId: true}},
        ]);

        let [playerDetails, playerIdToData, damageTaken] = await wclReader.getDamageAndPlayerDetails(true);
        let analyzer = new PriestShieldAnalyzer(reportData, playerIdToData);
        let sourcePlayerData = playerIdToData[wclReader._defaultLinkData['sourceId']];
        if (sourcePlayerData['type'] !== 'Priest') {
            throw new Error('Source Id is not a priest');
        }
        let startTime = wclReader.fightTime['startTime'];
        let [combinedData, rapturesData] = analyzer.run(startTime);
        let fightLength = Math.ceil((wclReader.fightTime['endTime'] - wclReader.fightTime['startTime']) / 1000);

        res.send({
            data: combinedData,
            rapturesData: rapturesData,
            playerIdToData: playerIdToData,
            otherFightOptions: wclReader._otherBossFightOptions, // for shield, we only want to analyze boss fights
            currentFightId: wclReader._selectedFightId,
            fightLength: fightLength,
            damageTaken: damageTaken,
        });
    } catch (error) {
        console.log('error trying to analyze: ' + link);
        console.log(error);
        res.status(400).send(error.message);
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