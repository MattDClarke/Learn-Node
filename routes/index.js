// define all routes
const express = require('express');

const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const rateLimitController = require('../controllers/rateLimitController');
const userValidator = require('../validators/userValidator');
const storeValidator = require('../validators/storeValidator');
const reviewValidator = require('../validators/reviewValidator');
const { catchErrors } = require('../handlers/errorHandlers');

// Add catch errors to async controllers
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);

router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  storeValidator.storeValidationRules(),
  storeValidator.validate,
  catchErrors(storeController.createStore)
);

router.post(
  '/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.post('/delete/:id', catchErrors(storeController.deleteStore));

router.get(
  '/stores/:id/edit',
  authController.isLoggedIn,
  catchErrors(storeController.editStore)
);
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
// router.post('/login', authController.login);
router.post('/login', catchErrors(rateLimitController.loginRouteRateLimit));
router.get('/register', userController.registerForm);

// 1. validate registration data
// 2. register the user - save to db
// 3. log them in
router.post(
  '/register',
  userValidator.userValidationRules(),
  userValidator.validate,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post(
  '/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
router.post(
  '/account/delete',
  catchErrors(userController.deleteAccount),
  authController.logout
);

router.get('/map', storeController.mapPage);
router.get(
  '/hearts',
  authController.isLoggedIn,
  catchErrors(storeController.getHeartedStores)
);
router.post(
  '/reviews/:id',
  authController.isLoggedIn,
  reviewValidator.reviewValidationRules(),
  reviewValidator.validate,
  catchErrors(reviewController.addReview)
);

router.get('/top', catchErrors(storeController.getTopStores));

/*
  API
*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
