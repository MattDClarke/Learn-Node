const mongoose = require('mongoose');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;

const reviewSchema = new Schema({
  text: {
    type: String,
    required: 'Please add a review',
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  author: {
    // custom type (Object) - can see in MongoDB Compass
    type: mongoose.Schema.ObjectId,
    // tell MongoDB that author will reference User. Point to user
    ref: 'User',
    required: 'You must supply an author.'
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: 'You must supply a store.'
  },
  created: {
    type: Date,
    default: Date.now
  }
});

// add hooks (pre query find) - whenever review queried. Populate author field
function autoPopulate(next) {
  this.populate('author');
  next();
}

reviewSchema.pre('find', autoPopulate);
reviewSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Review', reviewSchema);
