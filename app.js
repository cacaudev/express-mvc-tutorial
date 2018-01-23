// app.js

// Import necessary modules
var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var compression  = require('compression');
var helmet       = require('helmet');

// routes
var index   = require('./routes/index');
var users   = require('./routes/users');
var catalog = require('./routes/catalog');

var app = express();

app.use(helmet());
//--------------------------------------------------------------------------- //

//Set up default mongoose connection
var mongoose = require('mongoose');
var mongoDB = process.env.MONGODB_URI || 'mongodb://root:root@ds123400.mlab.com:23400/libraryapptest';
mongoose.connect(mongoDB, {
  useMongoClient: true
});
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// -------------------------------------------------------------------------- //
app.use(compression()); //Compress all routes

// Express should search for static files in /public directory
app.use('/public', express.static(process.cwd() + '/public'));

// view engine setup
// Express should search for templates in the /views subdirectory.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// -------------------------------------------------------------------------- //

/* Middleware for routes */

app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog);

// -------------------------------------------------------------------------- //

// Errors handler

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;