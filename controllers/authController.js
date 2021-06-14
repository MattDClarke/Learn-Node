const crypto = require('crypto');
const mongoose = require('mongoose');
// const promisify = require('es6-promisify');
const { promisify } = require('util');
// const { body } = require('express-validator');

const User = mongoose.model('User');
const mail = require('../handlers/mail');

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
    // It could be abused, depending on the site
    // However, in this app - in register route - if email used, then they can't register so someone can figure out if email in use from there. It is easier to check if an email is in use from this middleware, if u show message in flash that states email is in use.
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

// email confirmation
exports.sendEmailConfirm = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // 1. if newly registered user exists: set email confirm tokens and expiry
  // crypto module is built into Node
  user.emailConfirmToken = crypto.randomBytes(20).toString('hex');
  user.emailConfirmExpires = Date.now() + 3600000; // 1h from now
  // token and expire added to db
  await user.save();
  // 2. send them an email with the token
  const resetURL = `http://${req.headers.host}/emailconfirm/${
    user.emailConfirmToken
  }`;
  await mail.send({
    user,
    subject: 'Confirm your email',
    resetURL,
    // needed for rendering password-reset.pug
    filename: 'email-confirm'
  });

  req.flash('success', `You have been emailed a link to confirm your email.`);
  // 3. redirect to login page
  res.redirect('/login');
};

exports.emailConfirmCheck = async (req, res) => {
  const user = await User.findOne({
    // look for person who is registering and wants to confirm their email
    // someone needs to know the token - emailed to them - check
    emailConfirmToken: req.params.token,
    // gt = greater than. Check if expire date (set 1 h into the future) is greater than now
    emailConfirmExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Email confirmation is invalid or has expired');
    return res.redirect('/login');
  }
  // email confirmed
  if (user) {
    user.confirmed = true;
    await user.save();
    req.flash('success', 'Your email has been confirmed! You can now login');
    return res.redirect('/login');
  }
};

exports.updateAccount = async (req, res) => {
  // if email updated - confirm email - check if req email matches current email
  // set confirmed to false and then send email confirm message
  const userEmail = req.user.email;

  if (req.body.email !== userEmail) {
    const updates = {
      name: req.body.name,
      email: req.body.email,
      confirmed: false,
      // create new token
      emailConfirmToken: crypto.randomBytes(20).toString('hex'),
      emailConfirmExpires: Date.now() + 3600000 // 1h from now
    };

    const user = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: updates },
      // context option lets you set the value of 'this' in update validators to the underlying query ...?
      {
        new: true,
        runValidators: true,
        context: 'query',
        useFindAndModify: false
      }
    );

    //  send them an email with the token
    const resetURL = `http://${req.headers.host}/emailconfirm/${
      user.emailConfirmToken
    }`;
    // logout current session
    await mail.send({
      user,
      subject: 'Confirm your email',
      resetURL,
      // needed for rendering password-reset.pug
      filename: 'email-confirm'
    });
    req.logOut();

    req.flash('success', `You have been emailed a link to confirm your email.`);
    // 3. redirect to login page
    res.redirect('/login');
  }

  // only update name if email not changed
  if (req.body.email === userEmail) {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { name: req.body.name } },
      // context option lets you set the value of 'this' in update validators to the underlying query ...?
      {
        new: true,
        runValidators: true,
        context: 'query',
        useFindAndModify: false
      }
    );

    req.flash('success', 'Profile updated');
    return res.redirect('back');
  }
};
