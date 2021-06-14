const { body, validationResult } = require('express-validator');

exports.loginValidationRules = () => [
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
  body('password', 'Password cannot be blank!').notEmpty(),
  body(
    'password',
    'Password should be at least 8 characters long and contain at least 1 lowercase word, 1 uppercase word, 1 number and 1 symbol.'
  ).isStrongPassword(),
  body('password', 'The maximum number of characters is 50.').isLength({
    max: 50
  })
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  if (errors) {
    // console.log(errors);
    req.flash('error', errors.array().map(err => err.msg));
    // pre-populate the login form with the data they put in, so that they dnt have to re-enter everything
    res.render('login', {
      flashes: req.flash()
    });
  }
};
