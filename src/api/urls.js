var express = require('express');
var router = express.Router();

const ttoomController = require('./ttoomController');
const wclController = require('./shamanAnalyzerController');



router.post('/ttoom/paladin/:seed', ttoomController.ttoomSeed);
router.post('/ttoom/shaman/:seed', ttoomController.ttoomSeed);
router.post('/ttoom/paladin/', ttoomController.ttoom);
router.post('/ttoom/shaman/', ttoomController.ttoom);

router.post('/analyzer/shaman/chainheal/', wclController.chainheal);

router.get('/', function(req, res) {
    res.send('Just a test');
});

module.exports = router;