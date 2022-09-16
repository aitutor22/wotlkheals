var express = require('express');
var router = express.Router();

const ttoomController = require('./ttoomController');
const wclController = require('./wclController');


// seed routes are when we pass in a single log seed, and it returns the results just for 1 run
router.post('/ttoom/paladin/:seed', ttoomController.ttoomSeed);
router.post('/ttoom/shaman/:seed', ttoomController.ttoomSeed);

// general ttoom functions
router.post('/ttoom/paladin/', ttoomController.ttoom);
router.post('/ttoom/shaman/', ttoomController.ttoom);

router.post('/analyzer/shaman/chainheal/', wclController.chainheal);
router.post('/analyzer/paladin/overhealing/', wclController.overhealing);
router.post('/analyzer/paladin/divineplea/', wclController.divinePlea);
router.post('/analyzer/priest/rapture/', wclController.rapture);
router.post('/analyzer/druid/revitalize/', wclController.revitalize);



router.get('/', function(req, res) {
    res.send('Just a test');
});

module.exports = router;