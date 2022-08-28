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
                data = response.data['data']['reportData']['report']['fights'];
                for (let entry of data) {
                    toReturn['fightsMap'][entry['id']] = entry;
                }
                toReturn['lastFightId'] = data[data.length - 1]['id'];
                return toReturn;
            })
            .catch((error) => {
                console.log('error');
                console.log(error.message);
            });
    },
    getFightDetail(wclCode, fightId) {
        return this.getFightTimes(wclCode)
            .then((data) => {
                console.log(data);
                // for last fight, id isn't passed, and instead the string 'last' is used instead
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



// def get_list_of_boss_fight_times(wcl_code):
//     query = f'''{{
//         reportData {{
//             report(code: "{wcl_code}") {{
//                 fights {{
//                     id,
//                     encounterID,
//                     name,
//                     startTime, endTime,
//                 }}
//             }}
//         }}
//     }}'''
//     try:
//         temp = pull_data(query)
//         # print(temp)
//         data = temp['data']['reportData']['report']
//         return {fight['id']: fight for fight in data['fights']}
//     except Exception as e:
//         print('error getting list of boss fight times')
//         print(e)
//         raise e