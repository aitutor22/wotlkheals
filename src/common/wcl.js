let axios = require('axios');
const Utility = require('../common/utilities');

/**
 *  - Helper class that handles calls to WCL
 */

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

        // code starts here

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