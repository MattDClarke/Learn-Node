const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
// const promisify = require('es6-promisify');
const { promisify } = require('util');
// const { body } = require('express-validator');

const User = mongoose.model('User');
const mail = require('../handlers/mail');

exports.login = function(req, res, next) {
  console.log('register login');
  passport.authenticate('local', function(err, user) {
    if (err) {
      req.flash('error', 'Failed Login!');
      return res.redirect('/login');
    }
    if (!user) {
      req.flash('error', 'Failed Login!');
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        req.flash('error', 'Failed Login!');
        return res.redirect('/login');
      }
      req.flash('info', 'You are now logged in!');
      return res.redirect(`/`);
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out! 👋');
  res.redirect('/');
};

// check if user logged in
exports.isLoggedIn = (req, res, next) => {
  // 1st check if user authenticated (done by passport.js)
  if (req.isAuthenticated()) {
    next(); // continue - the are logged in
    return;
  }
  req.flash('error', 'Oops you must be logged in to do that!');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    console.log('no user');
    // can choose to notify that email does not exist
    // I chose to not share that info, it could be abused, depending on the site
    req.flash('success', 'You have been emailed a password reset link.');
    return res.redirect('/login');
  }
  console.log('user exists');

  // 2. if user exists: set reset tokens and expiry on their account
  // crypto module is built into Node
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1h from now
  // token and expire added to db
  await user.save();
  // 3. send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${
    user.resetPasswordToken
  }`;
  console.log(user, resetURL);
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    // needed for rendering password-reset.pug
    filename: 'password-reset'
  });

  req.flash('success', `You have been emailed a password reset link.`);
  // 4. redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    // look for person who requested pw reset
    // someone needs to know the token - emailed to them - check
    resetPasswordToken: req.params.token,
    // gt = greater than. Check if expire date (set 1 h into the future) is greater than now
    resetPasswordExpires: { $gt: Date.now() }
  });
  // res.json(req.params);
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  // if there is a user, show the reset password form
  res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  // use [] to access property with '-' in it.
  // if (req.body.password === req.body['password-confirm']) {
  if (req.body.password === req.body.passwordConfirm) {
    next(); // keep going
    return;
  }
  req.flash('error', 'Passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  // check if token not expired - someone might open the reset link and leave the page open for more than 1h, so check if token is expired again
  const user = await User.findOne({
    // look for person who requested pw reset
    // someone needs to know the token - emailed to them - check
    resetPasswordToken: req.params.token,
    // gt = greater than. Check if expire date (set 1 h into the future) is greater than now
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // method made available via passport plugin in User.js
  const setPassword = promisify(user.setPassword.bind(user));

  // passport will deal with hashing and salting, ...
  await setPassword(req.body.password);
  // 'queues' changes'
  // set field values to undefined in order to delete them from db
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // save changes to db
  const updatedUser = await user.save();
  // automatically log them in - using passport js - simple
  await req.login(updatedUser);
  req.flash(
    'success',
    '🕺 your password has been reset. You are now logged in.'
  );
  res.redirect('/');
};
