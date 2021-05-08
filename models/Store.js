// interface with MongoDB
// const { Store } = require('express-session');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const mongoose = require('mongoose');
// when database queried, can wait in different ways because it happens async
// using es6 promise
mongoose.Promise = global.Promise;
// make url friendly names for slugs
const slug = require('slugs');

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [
      {
        type: Number,
        required: 'You must supply coordinates!'
      }
    ],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    // custom type (Object) - can see in MongoDB Compass
    type: mongoose.Schema.ObjectId,
    // tell MongoDB that author will reference User. Point to user
    ref: 'User',
    required: 'You must supply an author'
  }
});

// define index - stored as compound index in MongoDB
// will allow us to search for both of these fields at once - efficiently
storeSchema.index({
  name: 'text',
  description: 'text'
});

// index location as geospatial data - quickly search for stores nearby
storeSchema.index({ location: '2dsphere' });

// done before store name saved
// dnt use arrow function because 'this' in an arrow function does not have it's own binding to 'this'
// this = the store that we are trying to save
// url slug is created using the name and the slugs package
// pre hook = pre middleware (before added to database)
storeSchema.pre('save', async function(next) {
  // only call when store name modified - no need to create a new slug if a slug exists
  if (!this.isModified('name')) {
    next(); // skip
    return; // stop function from running
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of wes, wes-2, wes-3, ...
  // make slugs unique
  const slugRegEx = new RegExp(`^(${this.slug})((-[0,9]*$)?)$`, 'i');
  // this.constructor = store, Mongoose created the storeSchema
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    // naming ... wes, wes-2, wes-3, ...
    // if length = 0, then next called without changing slug (1st time name used)
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next();
});

function strSanitizer(str) {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
}

// sanitize additions, validation occurs before save - if sanitize leaves name empty -> required: 'Please enter a store name'
storeSchema.pre('validate', async function(next) {
  this.name = strSanitizer(this.name);
  this.description = strSanitizer(this.description);
  this.address = strSanitizer(this.address);
  next();
});

// sanitize updates
storeSchema.pre('findOneAndUpdate', async function(next) {
  this._update.name = strSanitizer(this._update.name);
  this._update.description = strSanitizer(this._update.description);
  this._update.address = strSanitizer(this._update.address);
  next();
});

// add method for aggregation (complex query) onto schema
storeSchema.statics.getTagsList = function() {
  // this function (and the static methods) is bound to our model
  // add aggregation pipeline operators - special object ($)
  return this.aggregate([
    // unwind the tags field - gets an instance of each store for each tag it contains
    { $unwind: '$tags' },
    // group everything based on tag field then create new field in each group called count. Each time items grouped, count is going to sum itself by 1 (+ 1) -> weird syntax
    // e.g. "_id": "wifi", "count": 3
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    // sort by most popular
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Store', storeSchema);
