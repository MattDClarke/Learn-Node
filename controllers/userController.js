const mongoose = require('mongoose');

const User = mongoose.model('User');
const Store = mongoose.model('Store');
const Review = mongoose.model('Review');
const { promisify } = require('util');

exports.loginForm = (req, res) => {
  // res.render('login', { title: 'Login' });
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // register method does not use promises, use promisify to change that
  // pass in method and object to bind method to
  const register = promisify(User.register.bind(User));
  // stores hash of password and a salt
  // passport-local-mongoose method. Also checks if username is unique
  await register(user, req.body.password);
  next(); // pass to authController.sendEmailConfirm
};

exports.account = (req, res) => {
  res.render('account', {
    title: 'Edit Your Account'
  });
};

// exports.updateAccount = async (req, res) => {
//   const updates = {
//     name: req.body.name,
//     email: req.body.email
//   };

//   const user = await User.findOneAndUpdate(
//     // await User.updateOne(
//     { _id: req.user._id },
//     { $set: updates },
//     // context option lets you set the value of 'this' in update validators to the underlying query ...?
//     {
//       new: true,
//       runValidators: true,
//       context: 'query',
//       useFindAndModify: false
//     }
//   );
//   // TODO - updating email caused current session to be invalid, re-login solution is probably not best solution
//   req.logIn(user, function(err) {
//     if (err) {
//       return err;
//     }
//     req.flash('success', 'Updated the profile');
//     return res.redirect('back');
//   });
// };

exports.deleteAccount = async (req, res, next) => {
  // delete stores created by user
  // delete comments by user
  // delete store - make sure user is the author
  // for all other users - delete hearts for each deleted store
  // logout user

  const user = await User.findOneAndDelete(
    {
      _id: req.user._id
    },
    { useFindAndModify: false }
  );
  // delete associated stores and reviews if user deleted
  if (user) {
    const userStores = await Store.find({ author: req.user._id });
    const userStoresIds = userStores.map(store => store.id);
    const storesDeletePromise = Store.deleteMany({ author: req.user._id });
    const reviewsDeletePromise = Review.deleteMany({ author: req.user._id });
    // for each store that the user added, delete the hearts for that store, for each user
    const heartsDeletePromise = User.updateMany({
      $pull: { hearts: { $in: userStoresIds } }
    });
    await Promise.all([
      storesDeletePromise,
      reviewsDeletePromise,
      heartsDeletePromise
    ]);
    req.flash('info', `Successfully deleted your account.`);
    next();
  }
};
