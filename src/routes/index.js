var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/', function(req, res, next) {
    console.log(__dirname)
  // res.render('index', { title: 'Express' });
  res.sendFile('index.html');
});

module.exports = router;
