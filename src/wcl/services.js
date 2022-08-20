let axios = require('axios');

const helperFunctions = {
    pullData(query) {
        headers = {
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
        }
        url = 'https://classic.warcraftlogs.com/api/v2/client';
        console.log(query)
        axios.post(url, {query: query}, {headers: headers})
            .then((response) => {
                console.log(response.data);
            })
    }
}

module.exports = helperFunctions;