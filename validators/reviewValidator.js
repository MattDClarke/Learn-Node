const { body, validationResult } = require('express-validator');

exports.reviewValidationRules = () => [
  body(
    'text',
    'You must supply a review that is at least 3 characters long.'
  ).isLength({ min: 3 }),
  body(
    'text',
    'The maximum length of a review is 1000 characters long.'
  ).isLength({ max: 1000 })
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  if (errors) {
    req.flash('error', errors.array().map(err => err.msg));
    res.redirect('back');
  }
};
