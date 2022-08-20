console.log(process.env.TEST)

const helperFunctions = {
    pullData(query) {
        headers = {
            // 'Authorization': `Bearer ${}`
        }
    }
}

// def pull_data(query):
//     headers = {
//         'Authorization': 'Bearer {}'.format(access_token)
//     }
//     url = 'https://classic.warcraftlogs.com/api/v2/client'
//     try:
//         r = requests.post(url, json={'query': query}, headers=headers)
//         return r.json()
//     except Exception as e:
//         print(e)

module.exports = helperFunctions;