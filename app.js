const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const path = require('path');
// const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');
const passport = require('passport');
// const promisify = require('es6-promisify');
const { promisify } = require('util');
const flash = require('connect-flash');
// const expressValidator = require('express-validator');

const routes = require('./routes/index');
const helpers = require('./helpers');
const errorHandlers = require('./handlers/errorHandlers');
require('./handlers/passport');

// create our Express app
const app = express();

// app.set('trust proxy', function(ip) {
//   if (ip === '::1') return true; // trusted IPs
//   return false;
// });

// Sets all of the defaults, but overrides `script-src` and disables the default `style-src`
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'script-src': ["'self'", 'https://maps.googleapis.com/', "'unsafe-eval'"],
      'img-src': [
        "'self'",
        'data:',
        'https://gravatar.com/avatar/',
        'https://maps.gstatic.com/',
        'https://maps.googleapis.com',
        'http://maps.google.com/mapfiles/kml/paddle/',
        'https://lh3.ggpht.com/',
        'https://khms0.googleapis.com/',
        'https://khms1.googleapis.com/'
      ]
    }
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views')); // this is the folder where we keep our pug files
app.set('view engine', 'pug'); // we use the engine pug, mustache or EJS work great too

// serves up static files from the public folder. Anything in public/ will just be served up as the file it is, route does not matter
// could be used on multiple routes
app.use(express.static(path.join(__dirname, 'public')));

// Takes the raw requests and turns them into usable properties on req.body
// middleware that checks the url for data BEFORE route hit (routes defined below). Puts all the data in the request so it can be easily accessed
// all data passed in is stored in the request variable
// when a user submits data via form tag - you will get data submitted on request.body
app.use(express.json());
// app.use(bodyParser.json());
// easily get access to nested data ... location.address ...
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
// app.use(bodyCheck);
// app.use(validationResult);

// populates req.cookies with any cookies that came along with the request
// app.use(cookieParser());

// Sessions allow us to store data on visitors from request to request
// This keeps users logged in and allows us to send flash messages
// store data about users -> how long logged in...
app.use(
  session({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

// // Passport JS is what we use to handle our logins
app.use(passport.initialize());
app.use(passport.session());

// // The flash middleware let's us use req.flash('error', 'Shit!'), which will then pass that message to the next page the user requests
app.use(flash());

// pass variables to our templates + all requests
app.use((req, res, next) => {
  // put the information into locals (local variables)
  res.locals.h = helpers;
  // pulls out flashes from controllers and puts them in locals
  res.locals.flashes = req.flash();
  // req.user made available by passport.js -> pass to locals
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;

  next();
});

// promisify some callback based APIs
app.use((req, res, next) => {
  req.login = promisify(req.login.bind(req));
  next();
});

// After allllll that above middleware, we finally handle our own routes!
app.use('/', routes);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// One of our error handlers will see if these errors are just validation errors
app.use(errorHandlers.flashValidationErrors);

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (app.get('env') === 'development') {
  /* Development Error Handler - Prints stack trace */
  app.use(errorHandlers.developmentErrors);
}

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
