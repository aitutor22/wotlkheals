require('./simulator');

var express = require('express');
var router = express.Router();


router.get('/', function(req, res) {
  res.send('Just a test');
});

module.exports = router;