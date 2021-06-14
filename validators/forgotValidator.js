const { body, validationResult } = require('express-validator');

exports.forgotValidationRules = () => [
  body('email', 'That Email is not vaild!')
    .isEmail()
    .normalizeEmail({
      remove_dots: false,
      remove_extension: false,
      gmail_remove_subaddress: false
    }),
  body('email', 'The maximum number of characters is 50.').isLength({
    max: 50
  })
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  if (errors) {
    console.log(errors);
    req.flash('error', errors.array().map(err => err.msg));
    res.render('login', {
      flashes: req.flash()
    });
  }
};
