require('./simulator');

var express = require('express');
var router = express.Router();

router.post('/ttoom/paladin/', function(req, res) {
    res.send({test: 123});
});

router.get('/', function(req, res) {
    res.send('Just a test');
});

module.exports = router;