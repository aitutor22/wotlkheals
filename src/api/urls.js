var express = require('express');
var router = express.Router();

const ttoomController = require('./ttoomController');
require('../wcl/services');

router.post('/ttoom/paladin/:seed', ttoomController.paladinTtoomSeed);

router.post('/ttoom/paladin/', ttoomController.paladinTtoom);

router.get('/', function(req, res) {
    res.send('Just a test');
});

module.exports = router;