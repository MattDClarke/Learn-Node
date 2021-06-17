// const mongoose = require('mongoose');

// const Store = mongoose.model('Store');
const { body, validationResult } = require('express-validator');

exports.storeEditValidationRules = () => [
  body(
    'name',
    'You must supply a name that is at least 3 characters long.'
  ).isLength({ min: 3 }),
  // body('name').custom(value =>
  //   // prevent user from changing store to name that is in use (excl. current store name)
  //   Store.findOne({ name: value })
  //     .collation({ locale: 'en', strength: 2 })
  //     .then(store => {
  //       console.log(
  //         store,
  //         store === true,
  //         // store.name,
  //         value
  //         // store.name !== value
  //       );
  //       // if (store && store.name !== value) {
  //       if (store) {
  //         console.log('.........................failed validation');
  //         return Promise.reject('Store name already in use');
  //       }
  //     })
  // ),
  body('name', 'The maximum number of characters is 50.').isLength({ max: 50 }),
  body(
    'description',
    'You must supply a description that is at least 3 characters long.'
  ).isLength({ min: 3 }),
  body('description', 'The maximum number of characters is 1000.').isLength({
    max: 1000
  }),
  body('coordinates').custom((value, { req }) => {
    const lng = req.body.location.coordinates[0];
    const lat = req.body.location.coordinates[1];

    if (
      lng > 180 ||
      lng < -180 ||
      lat < -90 ||
      lat > 90 ||
      isNaN(lng) ||
      isNaN(lat)
    ) {
      throw new Error('Incorrect coordinates');
    }
    // success - coordinates validated
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
    res.render('editStore', {
      title: 'Edit Store',
      // pre-populate the add store form with the data they put in, so that they dnt have to re-enter everything
      store: req.body,
      flashes: req.flash()
    });
  }
};
