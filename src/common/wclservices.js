let axios = require('axios');

const helperFunctions = {
    // takes a graphql query string, and returns a promise
    // note that you will typically need to do response.data to get the data out`
    pullData(query) {
        headers = {
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
        }
        url = 'https://classic.warcraftlogs.com/api/v2/client';

        return axios({
          url: url,
          method: 'post',
          headers: headers,
          data: query
        });
    },
    // a key function, since we will typically need the start times and endtimes of fights for any
    // sort of query. returns a map, with key being fightId, and value being the fight object
    getFightTimes(wclCode) {
        let body =  { 
            query: `
                query {
                    reportData {
                        report(code: "${wclCode}") {
                            startTime, endTime,
                            fights {
                                id,
                                encounterID,
                                name,
                                startTime, endTime,
                            }
                        }
                    }
                }
            `,
        };
        let toReturn = {fightsMap: {}, lastFightId: 0};
        return this.pullData(body)
            .then((response) => {
                let report = response.data['data']['reportData']['report'];
                data = report['fights'];
                for (let entry of data) {
                    toReturn['fightsMap'][entry['id']] = entry;

                    // for last fight, id isn't passed, and instead the string 'last' is used instead
                    // # NOTE: last refers to LAST BOSS FIGHT (trash not included)
                    if (entry['encounterID'] > 0) {
                        toReturn['lastFightId'] = entry['id'];
                    }
                }
                // note that startTime and endTime for the whole report is in unix timestamp format
                // while startTime and endTime for specific fights start counting from the start of the fight
                // aka the first encounter starts at 0; hence we need to zero out the startTime/endTime of the report
                toReturn['startTime'] = 0;
                toReturn['endTime'] = report['endTime'] - report['startTime'];
                return toReturn;
            })
            .catch((error) => {
                console.log('error');
                console.log(error.message);
            });
    },
    // use this to get the details for a specfic fight
    getFightDetail(wclCode, fightId) {
        return this.getFightTimes(wclCode)
            .then((data) => {
                // when user wants to pull the whole report
                if (fightId === 'all') {
                    return {
                        startTime: data['startTime'],
                        endTime: data['endTime'],
                    }
                }
                if (fightId === 'last') fightId = data['lastFightId'];
                return data.fightsMap[fightId];
            })
            .catch((error) => {
                console.log('error');
                console.log(error.message);
            });
    }
}

module.exports = helperFunctions;
