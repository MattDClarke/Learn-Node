const mongoose = require('mongoose');

const User = mongoose.model('User');
const { body, validationResult } = require('express-validator');

exports.accountUpdateValidationRules = () => [
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
  body('email').custom((value, { req }) =>
    // prevent user from changing email to email that is already in use
    User.findOne({ email: value }).then(user => {
      if (user && user.email !== req.user.email) {
        console.log('user exists: ', user);
        return Promise.reject('E-mail already in use');
      }
    })
  )
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (errors.isEmpty()) {
    return next();
  }
  if (errors) {
    console.log(errors);
    req.flash('error', errors.array().map(err => err.msg));
    // pre-populate the registration form with the data they put in, so that they dnt have to re-enter everything
    res.render('account', {
      body: req.body,
      flashes: req.flash()
    });
  }
};
