const mongoose = require('mongoose');

const User = mongoose.model('User');
const { body, validationResult } = require('express-validator');

exports.userValidationRules = () => [
  body('name', 'You must supply a name.').notEmpty(),
  body(
    'name',
    'You must supply a name that is at least 3 characters long.'
  ).isLength({ min: 3 }),
  body('name', 'The maximum number of characters is 50.').isLength({ max: 50 }),
  body('email', 'That Email is not vaild!')
    .isEmail()
    .normalizeEmail({
      remove_dots: false,
      remove_extension: false,
      gmail_remove_subaddress: false
    }),
  body('email', 'The maximum number of characters is 50.').isLength({
    max: 50
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
  body('password', 'The maximum number of characters is 50.').isLength({
    max: 50
  }),
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
  if (errors) {
    req.flash('error', errors.array().map(err => err.msg));
    // pre-populate the registration form with the data they put in, so that they dnt have to re-enter everything
    res.render('register', {
      body: req.body,
      flashes: req.flash()
    });
  }
};
