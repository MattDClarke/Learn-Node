const mongoose = require('mongoose');

const User = mongoose.model('User');
const { promisify } = require('util');
const { body, validationResult } = require('express-validator');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.userValidationRules = () => [
  body('name', 'You must supply a name.').notEmpty(),
  body(
    'name',
    'You must supply a name that is at least 3 characters long.'
  ).isLength({ min: 3 }),
  body('email', 'That Email is not vaild!')
    .isEmail()
    .normalizeEmail({
      remove_dots: false,
      remove_extension: false,
      gmail_remove_subaddress: false
    }),
  body('email').custom(value =>
    User.findOne({ email: value }).then(user => {
      if (user) {
        return Promise.reject('E-mail already in use');
      }
    })
  ),
  body('password', 'Password cannot be blank!').notEmpty(),
  body(
    'password',
    'Password should be at least 8 characters long and contain at least 1 lowercase word, 1 uppercase word, 1 number and 1 symbol.'
  ).isStrongPassword(),
  body('passwordConfirm', 'Confirmed password cannot be blank!').notEmpty(),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Oops! Your passwords do not match');
    }
    // Indicates the success of this synchronous custom validator
    return true;
  })
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  console.log(req.body);
  if (errors) {
    req.flash('error', errors.array().map(err => err.msg));
    // pre-populate the registration form with the data they put in, so that they dnt have to re-enter everything
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
  }
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // register method does not use promises, use promisify to change that
  // pass in method and object to bind method to
  const register = promisify(User.register.bind(User));
  // stores hash of password and a salt
  await register(user, req.body.password);
  // res.send('It works');
  next(); // pass to authController.login
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    // context option lets you set the value of 'this' in update validators to the underlying query ...?
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'Updated the profile');
  // res.json(user);
  res.redirect('back');
};
