var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var apiRouter = require('./api/urls');

var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api', apiRouter);
// app.use('/', (req, res, next) => {

// });

/* GET home page. */

app.use(express.static('public'));
app.use('*', function(req, res, next) {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// this helps with SPA - but should come after all the server routes to avoid messing them up
// https://forum.vuejs.org/t/how-to-handle-vue-routes-with-express-ones/23522
app.use(require('connect-history-api-fallback')());


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
