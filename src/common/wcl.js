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
            'sourceId': null,
            'fightId': null, // if user passes in last, this is saved as last rather than being converted to actual fightIt
        };

        // important variables that will be used by a variety of functions
        //for almost all functions, we require fightTimes to get start and end time of a specific encounter
        // after pulling once, we can reuse across all functions unless we require a repull
        this._fightTimesMap = null;
        this._lastFightId = null;
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

        // links can either in the format of boss=xxx or fight=yyy
        // careful - if user passes in 'last', this means final boss fight
        if (wclLink.indexOf('fight=') > - 1) {
            if (wclLink.indexOf('fight=last') > -1) {
                this._defaultLinkData['fightId'] = 'last';
            } else {
                let fightIdFound = wclLink.match(/.*fight=(\d+).*/);
                this._defaultLinkData['fightId'] = Number(fightIdFound[1]);
            }
        } else if (wclLink.indexOf('boss=') > -1) {
            let bossId = Number(wclLink.match(/.*boss=([-\d]+).*/)[1]);
            if (bossId === 0) {
                this._defaultLinkData['fightId'] = 'trash';       
            } else if (bossId === -3) {
                this._defaultLinkData['fightId'] = 'all';       
            } else if (bossId === -2) {
                this._defaultLinkData['fightId'] = 'bosses';       
            }

                // this._defaultLinkData['fightId'] = Number(bossIdFound[1]);
        } else {
            // if neither fight or boss are passed in, default to reading whole report
            this._defaultLinkData['fightId'] = 'all';
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
            let subQuery = '',
                results = {}, // for queries that require pagination
                endTime = fightId === 'all' ? this._reportEndTime : this._fightTimesMap[fightId]['endTime'];

            for (let options of listSubqueriesToCreate) {
                subQuery += this.createEventsSubqueryHelper(options['key'], fightId, options) + '\n';
                results[options['key']] = {data: []};
            }

            // // for single fights, we dont need pagination

            if (fightId !== 'all') return this.pullData(subQuery);
            let app = this;

            async function paginate(subQuery) {
                let subreportData = await app.pullData(subQuery);
                let newSubquery = '';

                for (let key in subreportData) {
                    if (subreportData[key] === null) {
                        console.log('skipping because null')
                        continue;
                    }

                    let arr = subreportData[key]['data'],
                        lastTimeStamp = arr.length > 0 ? arr[arr.length - 1]['timestamp'] : null;

                    let needToContinuePulling = true;
                    if (arr.length === 0) {
                        needToContinuePulling = false;
                    } else {
                        if (arr[0]['timestamp'] === arr[arr.length - 1]['timestamp']) {
                            needToContinuePulling = false;
                        };

                        // // just a hack - if very few entries, implies we already pulled everything
                        // if (arr.length < 50) {
                        //     needToContinuePulling = false;
                        // }

                        if (lastTimeStamp === endTime) {
                            needToContinuePulling = false;
                        }
                    }
                    
                    if (!needToContinuePulling) {
                        results[key]['data'].push(...arr);
                        continue;
                    }

                    // for pagination, there's the problem of what to do with events on the final timestamp
                    // because when we pullusing the same timestamp, there will be duplicate events
                    // so we only add events before timestamp
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i]['timestamp'] < lastTimeStamp) {
                            results[key]['data'].push(arr[i]);
                        }
                    }

                    let options = listSubqueriesToCreate.find((_row) => _row['key'] === key);
                    // we start pulling on lastTimeStamp - this is not included above, but isn't a problem as it will be pulled in next pull
                    newSubquery += app.createEventsSubqueryHelper(key, fightId, options, lastTimeStamp) + '\n';
                }
                return newSubquery;
            }

            let counter = 0;
            while (subQuery !== '') {
                subQuery = await paginate(subQuery);
                counter++;
            }
            return results;

        } catch (error) {
            console.log('error with runquery');
            console.log(error);
        }
    }

    // note that WCL fields have a tendency to capitalise ID
    // for options, we follow this notation to make it easier to copy from insomania
    // takes an optional overrideStartTime (for pagination)
    createEventsSubqueryHelper(key, fightId, options, overrideStartTime=null) {
        if (fightId === 'last') fightId = this._lastFightId;
        if (typeof options === 'undefined') options = {};
        if (typeof options['dataType'] !== 'undefined' && EVENT_TYPES.indexOf(options['dataType']) === -1) {
            throw new Error('Invalid field for dataType: ' + options['dataType']);
        }

        let otherQueryFields = '',
            startTime,
            endTime;

        // if (fightId !== 'all' && overrideStartTime !== null) {
        //     throw new Error('overrideStartTime passed even though fightID is not all');
        // }

        // checks to see if we should use the user inputted startTime (for pagination)
        if (overrideStartTime !== null) {
            startTime = overrideStartTime;
        } else {
            startTime = fightId === 'all' ? this._reportStartTime : this._fightTimesMap[fightId]['startTime'];
        }

        endTime = fightId === 'all' ? this._reportEndTime : this._fightTimesMap[fightId]['endTime'];

        // adds sourceId if an argument is passed or if it exists in the initial wcl link
        if (typeof options['sourceID'] !== 'undefined' && options['sourceID'] !== '') {
            otherQueryFields += `, sourceID: ${options['sourceID']}`
        } else if ((typeof options['sourceID'] === 'undefined') && this._defaultLinkData['sourceId'] !== null) {
            otherQueryFields += `, sourceID: ${this._defaultLinkData['sourceId']}`;
        }

        for (let key in options) {
            if (key === 'key' || key === 'sourceID') continue;
            if (typeof options[key] !== 'undefined') {
                otherQueryFields += (key !== 'filterExpression') ? `, ${key}: ${options[key]}` :
                    `, ${key}: "${options[key]}"`;
            }
        }

        if (typeof options['limit'] === 'undefined') {
            otherQueryFields += `, limit: 10000`;
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