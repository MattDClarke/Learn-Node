const passport = require('passport');
const mongoose = require('mongoose');

const User = mongoose.model('User');

passport.use(User.createStrategy());

// log in to passport - tell passport what to do with user
// everytime you have a request, it will ask passport what do do with user once its confirmed that they are properly logged in
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
