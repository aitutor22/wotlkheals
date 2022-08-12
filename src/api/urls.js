require('./simulator');

var express = require('express');
var router = express.Router();

console.log('is this working?')
router.get('', function(req, res) {
    res.send('Just a test');
});

module.exports = router;