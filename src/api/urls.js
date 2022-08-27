var express = require('express');
var router = express.Router();

const ttoomController = require('./ttoomController');
const wclController = require('../wcl/services');


// query = {
//             reportData {
//                 report(code: "LPFHmcD6hf3V84KQ") {
//         dazed: table(startTime: 5482549, endTime: 5575236, dataType: Debuffs, sourceID: 34)
//                 }
//             }
//         }

// 

// let test = JSON.stringify({
//     query: `
//         query GetLearnWithJasonEpisodes($now: DateTime!) {
//           allEpisode(limit: 10, sort: {date: ASC}, where: {date: {gte: $now}}) {
//             date
//             title
//             guest {
//               name
//               twitter
//             }
//             description
//           }
//         }
//       `,
//     variables: {
//       now: new Date().toISOString(),
//     },
//   })
// console.log(test)
// wclController.pullData(JSON.stringify(payload))

router.post('/ttoom/paladin/:seed', ttoomController.paladinTtoomSeed);
router.post('/ttoom/paladin/', ttoomController.ttoom);
router.post('/ttoom/shaman/', ttoomController.ttoom);

router.get('/', function(req, res) {
    res.send('Just a test');
});

module.exports = router;