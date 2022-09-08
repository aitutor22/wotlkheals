// to add: pagination, pull whole report, pull boss only, pull encounter only
// function to return options

let axios = require('axios');
const Utility = require('../common/utilities');

/**
 *  - Helper class that handles calls to WCL
 */

const EVENT_TYPES = ['All', 'Buffs', 'Casts', 'CombatantInfo', 'DamageDone', 'DamageTaken', 'Deaths', 'Debuffs', 'Dispels', 'Healing', 'Interrupts', 'Resources', 'Summons', 'Threat'];

class WclReader {
    // given a link, we try to split into code, sourceId and fightId
    constructor(wclLink) {
        this._defaultLinkData = {
            'url': wclLink,
            'code': '',
            'sourceId': -99,
            'fightId': -99, // if user passes in last, this is saved as last rather than being converted to actual fightIt
        };

        // important variables that will be used by a variety of functions
        //for almost all functions, we require fightTimes to get start and end time of a specific encounter
        // after pulling once, we can reuse across all functions unless we require a repull
        this._fightTimesMap = null;
        this._lastFightId = -99;
        this._reportStartTime = 0;
        this._reportEndTime = 0; // in miliseconds, will be updated when we call getFightTimes

        // code starts here - extract info fromlink
        let getWclCodeRegex = '',
            found = false;

        if (wclLink.indexOf('source=') > - 1) {
            getWclCodeRegex = /(.*reports\/)?(\w{16}).*source=(\d+).*/;
            found = wclLink.match(getWclCodeRegex);
            this._defaultLinkData['sourceId'] = Number(found[3]);
        } else {
            getWclCodeRegex = /(.*reports\/)?(\w{16}).*/;
            found = wclLink.match(getWclCodeRegex);
        }

        this._defaultLinkData['code'] = found[2];

        // careful - if user passes in 'last', this means final boss fight
        if (wclLink.indexOf('fight=') > - 1) {
            if (wclLink.indexOf('fight=last') > -1) {
                this._defaultLinkData['fightId'] = 'last'
            } else {
                let sourceIdFound = wclLink.match(/.*fight=(\d+).*/)
                this._defaultLinkData['fightId'] = Number(sourceIdFound[1]);
            }
        }
    }

    // takes a graphql subQuery string, and returns values
    async pullData(subQuery) {
        let headers = {
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
        }
        let url = 'https://classic.warcraftlogs.com/api/v2/client';
        let query =  { 
            query: `query {
                reportData {
                    report(code: "${this._defaultLinkData['code']}") {
                        ${subQuery}
                    }
                }
            }`,
        };

        try {
            const response = await axios({
                url: url,
                method: 'post',
                headers: headers,
                data: query
            });
            return response['data']['data']['reportData']['report'];
        } catch (error) {
            console.log('error with function pullData');
            console.log(error);
        }
    }

    // NOTE -> need to support 'all' for fightId
    // takes a list of subqueries, finds the fight time for the inputted fightId, and pulls data
    async runQuery(listSubqueriesToCreate, fightId=null) {
        try {
            // we always start by getting fight times - if it's already pulled, we wont call server again
            await this.getFightTimes();
            // if no fightId is passed, then we extract from url
            if (fightId === null) {
                fightId = this._defaultLinkData['fightId'];
            }

            let subQuery = '';
            for (let options of listSubqueriesToCreate) {
                subQuery += this.createEventsSubqueryHelper(options['key'], fightId, options) + '\n';
            }
            return this.pullData(subQuery);
        } catch (error) {
            console.log('error with runquery');
            console.log(error);
        }
    }

    // note that WCL fields have a tendency to capitalise ID
    // for options, we follow this notation to make it easier to copy from insomania
    // healing: events(startTime: ${fightTime.startTime}, endTime: ${fightTime.endTime}, dataType: Healing, useAbilityIDs: true, sourceID: ${sourceId}, limit:10000, filterExpression: "ability.name='Chain Heal'") { data }
    createEventsSubqueryHelper(key, fightId, options) {
        if (fightId === 'last') fightId = this._lastFightId;
        if (typeof options === 'undefined') options = {};
        if (typeof options['dataType'] !== 'undefined' && EVENT_TYPES.indexOf(options['dataType']) === -1) {
            throw new Error('Invalid field for dataType: ' + options['dataType']);
        }

        let startTime = this._fightTimesMap[fightId]['startTime'],
            endTime = this._fightTimesMap[fightId]['endTime'],
            otherQueryFields = '';

        // adds sourceId if an argument is passed or if it exists in the initial wcl link
        if (typeof options['sourceID'] !== 'undefined' && options['sourceID'] !== '') {
            otherQueryFields += `, sourceID: ${options['sourceID']}`
        } else if ((typeof options['sourceID'] === 'undefined') && this._defaultLinkData['sourceId'] !== -99) {
            otherQueryFields += `, sourceID: ${this._defaultLinkData['sourceId']}`;
        }

        for (let key in options) {
            if (key === 'key' || key === 'sourceID') continue;
            if (typeof options[key] !== 'undefined') {
                otherQueryFields += (key !== 'filterExpression') ? `, ${key}: ${options[key]}` :
                    `, ${key}: "${options[key]}"`;
            }
        }

        let subQuery = `${key}: events(startTime: ${startTime}, endTime: ${endTime}${otherQueryFields}) { data }`
        return subQuery;
    }

    // a key function, since we will typically need the start times and endtimes of fights for any
    // sort of query. returns a map, with key being fightId, and value being the fight object
    // takes an optional argument forcedRefresh that repulls if true (potentially if live logging)
    async getFightTimes(forcedRefresh=false) {
        if (!forcedRefresh && this._fightTimesMap !== null) return this._fightTimesMap;

        let subQuery =  `
            startTime, endTime,
            fights {
                id,
                encounterID,
                name,
                startTime, endTime,
            }
        `;

        try {
            let report = await this.pullData(subQuery);
            this._fightTimesMap = {};
            // note that startTime and endTime for the whole report is in unix timestamp format
            // the first fight starts at 0; hence we need to zero out the startTime/endTime of the report
            this._reportEndTime = report['endTime'] - report['startTime'];

            // creates a map for fightTimes
            for (let entry of report['fights']) {
                this._fightTimesMap[Number(entry['id'])] = entry;

                // for last fight, id isn't passed, and instead the string 'last' is used instead
                // # NOTE: last refers to LAST BOSS FIGHT (trash not included)
                if (Number(entry['encounterID']) > 0) {
                    this._lastFightId = Number(entry['id']);
                }
            }
            return this._fightTimesMap;

        } catch (error) {
            console.log(error);
        }
    }

}
module.exports = WclReader;