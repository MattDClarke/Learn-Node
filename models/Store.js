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

const storeSchema = new mongoose.Schema(
  {
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

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

storeSchema.statics.getTopStores = function() {
  // returns a promise that you can await for (in storeController)
  return this.aggregate([
    // Look up Stores and populate their reviews (where ids match)
    // * cant use virtual reviews (Mongoose specific). aggregate is not Mongoose specific, it is a MongoDB operation. Cant always use Mongoose methods...
    {
      $lookup: {
        // MongoDB takes model name, lowercases it and adds an s
        from: 'reviews',
        // look for reviews for a particular store
        localField: '_id',
        foreignField: 'store',
        // new field name
        as: 'reviews'
      }
    },
    // filter for only items that have 2 or more reviews
    // reviews.1 -> get 2nd review ... get index based things - not in JavaScript
    { $match: { 'reviews.2': { $exists: true } } },
    // Add the average reviews field - project means add field
    // problem with project - og fields not automatically added. There is an addField operator... only available to higher tier Atlas users
    {
      $project: {
        // $$root variable = original document
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        slug: '$$ROOT.slug',
        reviews: '$$ROOT.reviews',
        // $reviews means it is a field from the data being piped in (from match)
        averageRating: { $avg: '$reviews.rating' }
      }
    },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 } },
    // limit to max of 10
    { $limit: 10 }
  ]);
};

// virtual populate - not saving relationship
// like a SQL join
// find reviews where stores._id === reviews.store
storeSchema.virtual('reviews', {
  // go to review model and do a query to get reviews for the given store
  ref: 'Review', // what model to link?
  // which field on the store?
  localField: '_id',
  // which field on the review?
  foreignField: 'store'
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

// autopopulate the reivews field whenever find or findOne query performed
storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
