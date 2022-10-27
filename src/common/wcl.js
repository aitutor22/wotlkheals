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
    constructor(wclLink, overrideFightId=null) {
        this._defaultLinkData = {
            'url': wclLink,
            'code': '',
            'sourceId': null,
            'fightId': null, // if user passes in last, this is saved as last rather than being converted to actual fightIt
        };

        this._petIds = [];

        // important variables that will be used by a variety of functions
        //for almost all functions, we require fightTimes to get start and end time of a specific encounter
        // after pulling once, we can reuse across all functions unless we require a repull
        this._fightTimesMap = null;
        this._lastFightId = null;
        this._reportStartTime = 0;
        this._reportEndTime = 0; // in miliseconds, will be updated when we call getFightTimes
        this._overrideFightId = overrideFightId;
        this._selectedFightId = null;
        this._playerDetails = null;
        this._playerIdToData = null;

        // encounterID filter doesn't work very well
        // use fightIDs instead to filter between trash/bosses if required
        this._fightIds = {
            'bosses': [],
            'trash': [],
        };

        // to pass to frontend, allows user to select between fights
        this._otherFightOptions = [];
        this._otherBossFightOptions = [];

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
        } else {
            // if neither fight or boss are passed in, default to reading whole report
            this._defaultLinkData['fightId'] = 'all';
        }
    }

    // start getters
    get fightTime() {
        if (['all', 'bosses', 'trash'].indexOf(this._selectedFightId) > -1) {
            return {
                startTime: this._reportStartTime,
                endTime: this._reportEndTime,
            }
        }       
        return {
            startTime: this._fightTimesMap[this._selectedFightId]['startTime'],
            endTime: this._fightTimesMap[this._selectedFightId]['endTime'],
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

    // pulling playerDetails from the whole report sometimes gives weird resukts
    // for instance, a druid player can appear as all three specs (happened on https://classic.warcraftlogs.com/reports/1Zx8BDnMNXGHz6FK#type=summary&boss=-3&difficulty=0)
    // to solve this, use playerDetails for the specific fight if passed
    // adds a role field - tanks, healers, ranged_dps, caster_dps
    async getDamageAndPlayerDetails(lookAtSelectedFightIdOnly=true) {
        let startTime, endTime;
        if (!lookAtSelectedFightIdOnly) {
            startTime = this._reportStartTime;
            endTime: this._reportEndTime;
        } else {
            startTime = this._fightTimesMap[this._selectedFightId]['startTime'];
            endTime = this._fightTimesMap[this._selectedFightId]['endTime'];
        }
        let subQuery = `
            playerDetails(startTime: ${startTime}, endTime: ${endTime})
            damageTaken: table(startTime: ${startTime}, endTime: ${endTime}, dataType: DamageTaken)
            petDamageTaken: table(startTime: ${startTime}, endTime: ${endTime}, dataType: DamageDone, hostilityType: Enemies, targetClass: "Pet")
        `;

        let results = await this.pullData(subQuery);

        // it's possible for a player to not be tracked due to wcl error with playerdetails
        this._playerDetails = results['playerDetails']['data']['playerDetails'];
        this._playerIdToData = {};
        // dps classes that are definitely melee
        const MELEE_DPS = ['Warrior', 'DeathKnight', 'Rogue', 'Paladin'];
        const RANGED_DPS = ['Mage', 'Warlock', 'Priest', 'Hunter'];
        const MELEE_SPECS = ['Feral', 'Enhancement'];
        for (let role in this._playerDetails) {
            for (let player of this._playerDetails[role]) {
                this._playerIdToData[player['id']] = player;
                if (role === 'healers' || role === 'tanks') {
                    this._playerIdToData[player['id']]['role'] = role;
                } else {
                    // for dps, we want to split into melee dps and ranged rps
                    if (MELEE_DPS.indexOf(player.type) > -1) {
                        this._playerIdToData[player['id']]['role'] = 'melee_dps';
                    } else if (RANGED_DPS.indexOf(player.type) > -1) {
                        this._playerIdToData[player['id']]['role'] = 'ranged_dps';
                    } else {
                        try {
                            // sometimes wcl shows 2 specs, we take the higher one
                            player.specs.sort((a, b) => (b['count'] - a['count']));
                            let dominantSpec = player.specs[0]['spec'];
                            this._playerIdToData[player['id']]['role'] = MELEE_SPECS.indexOf(dominantSpec) > -1
                                ? 'melee_dps' : 'ranged_dps';
                        } catch(error) {
                            this._playerIdToData[player['id']]['role'] = 'hybrid_dps';    
                        }
                    }
                }
            }
        }

        // calculating damage taken
        // WCL damage taken table doesn't show pets, so we need to obtain this in a different way
        let totalDamageTaken = {
            'tanks': 0,
            'healers': 0,
            'melee_dps': 0,
            'ranged_dps': 0,
            'pet': 0,
            'unknown': 0,
        };
        for (let petEntry of results['petDamageTaken']['data']['entries']) {
            totalDamageTaken['pet'] += petEntry['total'];
        }

        for (let playerEntry of results['damageTaken']['data']['entries']) {
            try {
                let role = this._playerIdToData[playerEntry['id']]['role'];
                totalDamageTaken[role] += playerEntry['total'];
            } catch(error) {
                totalDamageTaken['unknown'] += playerEntry['total'];
            }
        }

        return [this._playerDetails, this._playerIdToData, totalDamageTaken];
    }

    // NOTE -> need to support 'all' for fightId
    // takes a list of subqueries, finds the fight time for the inputted fightId, and pulls data
    async runQuery(listSubqueriesToCreate, fightId=null) {
        try {
            // we always start by getting fight times - if it's already pulled, we wont call server again
            await this.getFightTimes();
            // overrideFightId always take precedence (this is useful when player is swapping fights via a select input)
            // but isn't changing the wcl link
            if (this._overrideFightId !== null) {
                fightId = this._overrideFightId;
            } else {
                // if no fightId is passed, then we extract from url
                if (fightId === null) {
                    fightId = this._defaultLinkData['fightId'];
                }
            }
            
            if (fightId === 'last') fightId = this._lastFightId;

            this._selectedFightId = fightId;

            let subQuery = '',
                results = {}, // for queries that require pagination
                endTime = (['bosses', 'all', 'trash'].indexOf(fightId) > -1) ? this._reportEndTime : this._fightTimesMap[fightId]['endTime'];

            for (let options of listSubqueriesToCreate) {
                subQuery += this.createEventsSubqueryHelper(options['key'], fightId, options) + '\n';
                results[options['key']] = {data: []};
            }

            // for single fights, we dont need pagination
            if (['bosses', 'all', 'trash'].indexOf(fightId) === -1) return this.pullData(subQuery);
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

            while (subQuery !== '') {
                subQuery = await paginate(subQuery);
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

        // checks to see if we should use the user inputted startTime (for pagination)
        if (overrideStartTime !== null) {
            startTime = overrideStartTime;
        } else {

            startTime = (['bosses', 'all', 'trash'].indexOf(fightId) > -1) ? this._reportStartTime : this._fightTimesMap[fightId]['startTime'];
        }

        endTime = (['bosses', 'all', 'trash'].indexOf(fightId) > -1) ? this._reportEndTime : this._fightTimesMap[fightId]['endTime'];

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

        // filters trash/bosses
        if (fightId === 'trash') {
            otherQueryFields += `, fightIDs: [${this._fightIds['trash']}]`;   
        } else if (fightId === 'bosses') {
            otherQueryFields += `, fightIDs: [${this._fightIds['bosses']}]`;   
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
                friendlyPets {petOwner, id}
            },
        `;

        try {
            let report = await this.pullData(subQuery);
            this._fightTimesMap = {};
            // note that startTime and endTime for the whole report is in unix timestamp format
            // the first fight starts at 0; hence we need to zero out the startTime/endTime of the report
            this._reportEndTime = report['endTime'] - report['startTime'];

            // this._petIds = report.;
            let temp = report['fights'].map((fight) => fight['friendlyPets'].map((row) => row['id']));
            for (let v of temp) {
                this._petIds.push(...v);
            }
            // removes duplicates
            this._petIds = [...new Set(this._petIds)];

            // creates a map for fightTimes
            for (let entry of report['fights']) {
                this._fightTimesMap[Number(entry['id'])] = entry;

                // categorises fights into trash/bosses
                if (entry['encounterID'] === 0) {
                    this._fightIds['trash'].push(entry['id']);
                } else {
                    this._fightIds['bosses'].push(entry['id']);
                }

                // adds options to select other fights
                let fightLength = Math.floor((entry['endTime'] - entry['startTime']) / 1000);
                // hackish code - doesn't work for fights that last >= 10mins; refactor and add to utilities in future
                let timeString = new Date(fightLength * 1000).toISOString().substr(14, 5);
                this._otherFightOptions.push({
                    label: `${entry['name']} (${timeString})`,
                    fightId: entry['id'],
                });

                if (entry['encounterID'] > 0) {
                    this._otherBossFightOptions.push({
                        label: `${entry['name']} (${timeString})`,
                        fightId: entry['id'],
                    });
                };

                // for last fight, id isn't passed, and instead the string 'last' is used instead
                // # NOTE: last refers to LAST BOSS FIGHT (trash not included)
                if (Number(entry['encounterID']) > 0) {
                    this._lastFightId = Number(entry['id']);
                }
            }

            this._otherFightOptions.push({
                label: 'Trash',
                fightId: 'trash',
            });
            this._otherFightOptions.push({
                label: 'Bosses',
                fightId: 'bosses',
            });
            this._otherFightOptions.push({
                label: 'All',
                fightId: 'all',
            });
            return this._fightTimesMap;

        } catch (error) {
            console.log(error);
        }
    }

}
module.exports = WclReader;