const mongoose = require('mongoose');
// model added in start.js, model defined in Store.js
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
  req.body.author = req.user._id;
  req.body.store = req.params.id;
  const newReview = new Review(req.body);
  await newReview.save();
  req.flash('success', 'Review saved');
  req.session.save(function() {
    return res.redirect('back');
  });
};
