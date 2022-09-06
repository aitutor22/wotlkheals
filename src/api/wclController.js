const WclService = require('../common/wclservices');
const ShamanAnalyzer = require('../wcl/shamanAnalyzer');
const PaladinOverhealingAnalyzer = require('../wcl/paladinOverhealingAnalyzer');
const PriestRaptureAnalyzer = require('../wcl/priestRaptureAnalyzer');

const analyzerOptions = require('../wcl/analyzerOptions');


exports.chainheal = (req, res) => {
    const link = req.body.wclLink;
    if (link.indexOf('source=') === -1 || link.indexOf('fight=') === -1) {
        return res.status(400).send({message: 'Invalid url link'});
    }

    try {
        // looks for wclCode, and sourceId
        const getWclCodeRegex = /(.*reports\/)?(\w{16}).*source=(\d+).*/;
        const found = link.match(getWclCodeRegex);
        const wclCode = found[2];
        const sourceId = found[3];

        let fightId; // fightId needs to be found separately because it's possbile that user passes in last
        if (link.indexOf('fight=last') > -1) {
            fightId = 'last'
        } else {
            let sourceIdFound = link.match(/.*fight=(\d+).*/)
            fightId = sourceIdFound[1];
        }

        // gets start, end time of fight
        WclService.getFightDetail(wclCode, fightId)
            .then((fightTime) => {
                // we pull chain heal healing events and nature swiftness casts, which is required for chain heal analysis
                let body =  { 
                    query: `
                        query {
                            reportData {
                                report(code: "${wclCode}") {
                                    healing: events(startTime: ${fightTime.startTime}, endTime: ${fightTime.endTime}, dataType: Healing, useAbilityIDs: true, sourceID: ${sourceId}, limit:10000, filterExpression: "ability.name='Chain Heal'") { data }
                                    natureSwiftness: events(startTime: ${fightTime.startTime}, endTime: ${fightTime.endTime}, dataType: Casts, useAbilityIDs: true, sourceID: ${sourceId}, abilityID: 16188) { data }
                                }
                            }
                        }
                    `,
                };
                return WclService.pullData(body)
                    .then((wclResponse) => {
                        let analyzer = new ShamanAnalyzer(wclResponse.data);
                        let results = analyzer.categorizeChainHeal();
                        res.send(results)
                    })
            })
    } catch (error) {
        res.status(400).send(error.message)
    }
};

// doesn't support pagination currently, need to add in future
exports.overhealing = (req, res) => {
    const link = req.body.wclLink;
    // if (link.indexOf('source=') === -1 || link.indexOf('fight=') === -1) {
    if (link.indexOf('source=') === -1) {
        return res.status(400).send({message: 'Invalid url link'});
    }

    try {
        // looks for wclCode, and sourceId
        const getWclCodeRegex = /(.*reports\/)?(\w{16}).*source=(\d+).*/;
        const found = link.match(getWclCodeRegex);
        const wclCode = found[2];
        const sourceId = found[3];

        // fightId needs to be found separately because it's possbile that user passes in "last" as a value
        let fightId;
        if (link.indexOf('fight=') === -1) {
            fightId = 'all'; // search whole report
        } else if (link.indexOf('fight=last') > -1) {
            fightId = 'last';
        } else {
            let fightIdFound = link.match(/.*fight=(\d+).*/)
            fightId = fightIdFound[1];
        }

        // gets start, end time of fight
        // 66922 refers to FoL hot - exclude that
        // 54968 is glyph of HL - for some reason, using .name doesnt work for it
        WclService.getFightDetail(wclCode, fightId)
            .then((fightTime) => {
                let body =  { 
                    query: `
                        query {
                            reportData {
                                report(code: "${wclCode}") {
                                    healing: events(startTime: ${fightTime.startTime}, endTime:  ${fightTime.endTime}, dataType: Healing, useAbilityIDs: true, sourceID: ${sourceId}, limit:10000, filterExpression: "(ability.id != 66922) and (ability.name='Holy Light' or ability.name='Flash of Light' or ability.name='Sacred Shield' or ability.name='Beacon of Light' or ability.id=54968 or ability.name='Holy Shock')")  { data }
                                }
                            }
                        }
                    `,
                };
                return WclService.pullData(body)
                    .then((wclResponse) => {
                        let healingEvents = wclResponse.data.data.reportData.report.healing.data;
                        let analyzer = new PaladinOverhealingAnalyzer(wclResponse.data);
                        let results = analyzer.run();
                        res.send(results)
                    })
            })
    } catch (error) {
        res.status(400).send(error.message)
    }
};

// doesn't support pagination currently, need to add
exports.rapture = (req, res) => {
    const link = req.body.wclLink;

    try {
        // looks for wclCode, and sourceId
        const getWclCodeRegex = /(.*reports\/)?(\w{16}).*/;
        const found = link.match(getWclCodeRegex);
        const wclCode = found[2];

        // fightId needs to be found separately because it's possbile that user passes in "last" as a value
        let fightId;

        // if a specific fightId is passed, then use it
        if (req.body['fightId']) {
            fightId = Number(req.body['fightId'])
        } 
        // otherwise get fightId from url
        else {
            if (link.indexOf('fight=') === -1) {
                fightId = 'all'; // search whole report
            } else if (link.indexOf('fight=last') > -1) {
                fightId = 'last';
            } else {
                let fightIdFound = link.match(/.*fight=(\d+).*/)
                fightId = fightIdFound[1];
            }
        }

        WclService.getFightDetail(wclCode, fightId, true)
            .then((_fightData) => {
                let fightTime = _fightData['fightDetail'];

                // converts the fight map data into a selection
                // [{label: 'Canada', code: 'ca'}]
                let otherFightOptions = Object.values(_fightData['fullFightMapData']).map((entry) => {
                    let fightLength = Math.floor((entry['endTime'] - entry['startTime']) / 1000);
                    // hackish code - doesn't work for fights that last >= 10mins; refactor and add to utilities in future
                    let timeString = new Date(fightLength * 1000).toISOString().substr(14, 5);
                    return {
                        label: `${entry['name']} (${timeString})`,
                        fightId: entry['id'],
                    }
                });

                let body =  { 
                    query: `
                        query {
                            reportData {
                                report(code: "${wclCode}") {
                                    damageTaken: events(startTime: ${fightTime.startTime}, endTime:  ${fightTime.endTime}, dataType: DamageTaken, useAbilityIDs: false, limit:10000, filterExpression: "ability.name != 'Melee'")  { data }
                                }
                            }
                        }
                    `,
                };
                return WclService.pullData(body)
                    .then((wclResponse) => {
                        // console.log(wclResponse.data);
                        // let healingEvents = wclResponse.data.data.reportData.report.damageTaken.data;
                        // console.log(healingEvents.length)
                        let analyzer = new PriestRaptureAnalyzer(wclResponse.data);
                        let results = analyzer.run(fightTime['startTime']);
                        res.send({
                            data: results,
                            otherFightOptions: otherFightOptions,
                            // use this rather than fightId above because fightId could be last
                            // fightTime['id'] is already converted to a number even for last fight
                            currentFightId: fightTime['id'],
                        });
                    })
            })
    } catch (error) {
        res.status(400).send(error.message)
    }
};