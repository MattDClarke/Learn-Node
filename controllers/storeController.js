const mongoose = require('mongoose');
// model added in start.js, model defined in Store.js
const Store = mongoose.model('Store');
const User = mongoose.model('User');
// middleware to handle multiparted form data (with img uploads, text, ...) - adds photo to memory so that it can be resized
// handles upload request
const multer = require('multer');

// package to allow photo resize
const jimp = require('jimp');
// make sure file names are unique
const uuid = require('uuid');
// const User = require('../models/User');

const multerOptions = {
  // reads photo into memory
  storage: multer.memoryStorage(),
  filefilter(req, file, next) {
    // mimeType will tell what kind of photo - png, jpg, ... all files have their own mimeType - cant rely on file extension name only
    // serverside file type validation
    const isPhoto = file.mimeType.startsWith('image/');
    if (isPhoto) {
      // first argument is the error, second is allowed filetype (photo)
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  }
};

exports.homePage = (req, res) => {
  // console.log(req.name);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

// can have multiple fields - but here we just want 1
// multerOptions defined above
exports.upload = multer(multerOptions).single('photo');

// resize images middleware incase too big
exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  // user may choose not to upload an image.... a default image will be displayed in / and /stores if img not uploaded
  if (!req.file) {
    next();
    return;
  }
  // see img in memory - buffer
  // console.log(req.file);
  // get file type from mimetype - dnt rely on extension... user can change it
  const extension = req.file.mimetype.split('/')[1];
  // req.body will be saved to database in next middleware
  req.body.photo = `${uuid.v4()}.${extension}`;
  // resize
  // jimp uses promises so you can await the response. Read from memory in this case
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written photo to file system then continue
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  // create a new store (new db entry) using the schema defined in Store.js. Only data which fits the scheme will be added to db
  // need to wait for slug (url friendly) to be created from store name
  const store = await new Store(req.body).save();
  // saves to database. save is a method from mongoose, makes it easy to interact with db
  req.flash(
    'success',
    `Successfully created ${store.name}. Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 10;
  const skip = page * limit - limit;
  // 1. query the database for a list of all stores - mongoose method
  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  // round up - so that pages is always an integer that can fit all stores
  const pages = Math.ceil(count / limit);
  // if user looks for page that does not exist, for example - edit url or old bookmark
  if (!stores.length && skip) {
    req.flash(
      'info',
      `You asked for page ${page}. But that does not exist. So I put you on page ${pages}.`
    );
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  // render stores pug template, pass data from MongoDB to pug template
  res.render('stores', { title: 'Stores', stores, page, pages, count });
};

// make sure only author can edit store
// not middleware -> just a function
const confirmOwner = (store, user) => {
  // .equals - compare object id with a string
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
  // 1. find the store given the id (url param)
  // does not return data... it returns a promise (an IOU) -> need to await for promise to resolve (get the money or not)
  const store = await Store.findOne({ _id: req.params.id });
  // res.json(store);
  // 2. confirm they are the owner
  confirmOwner(store, req.user);
  // 3. render edit form
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return new store instead of old one
    runValidators: true // force model to run required validators (in Store.js)  - serverside input check
  }).exec(); // run the query - some by default do not run so add exec
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${
      store.slug
    }">View Store</a>`
  );
  // redirect to the screen that they were on and tell them it worked (done using flash message already)
  res.redirect(`/stores/${store.id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  // 1. find the store given the slug (url param)
  // does not return data... it returns a promise (an IOU) -> need to await for promise to resolve (get the money or not)
  // populate - for author field. Show all info for a user instead of just id. Finds associated document for that user. CAREFUL ABOUT WHAT U EXPOSE WITH POPULATE (for example email). password, hash and salt by default not included
  // reviews is a virtual field created in Store.js using the Reviews model
  const store = await Store.findOne({
    slug: req.params.slug
  }).populate('author reviews');
  // res.json(store);
  // handle case where store does not exist
  // moves to next middleware in app.js: app.use(Handlers.notFound);
  if (!store) return next();

  // console.log(req.body);
  res.render('store', { title: store.name, store });
};

exports.getStoresByTag = async (req, res) => {
  // res.send('It works!');
  const { tag } = req.params;
  // if no tag req params (when tab link clicked in nav), then give me any store that has a tag property on it (at least 1 tag) - find using Mongoose .find method below
  const tagQuery = tag || { $exists: true };
  // getTagsList is a custom static method
  // dnt await because we want to get both promises asynchronously
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // res.json(tags);
  // wait for multiple promises
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  // res.json(req.query);
  const stores = await Store.find(
    {
      // $text performs a text search on the content of fields indexed with a text index (name and description of a store)
      // see storeSchema.index in Stores.js
      $text: {
        $search: req.query.q
      }
    },
    {
      // project, which is Mongoose jargon for add a field, - text score is higher if search word mentioned more
      // this gives each store a score field
      score: { $meta: 'textScore' }
    }
  )
    .sort({
      score: { $meta: 'textScore' }
    })
    // limit results
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      // mongoDB near query operator - find stores near given lat and long
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };
  // good to select what fields you need - keep ajax req small
  const stores = await Store.find(q)
    // fields to return
    .select('slug name description location photo')
    // can also pass limit in as url query
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

// add or remove heart - toggle
exports.heartStore = async (req, res) => {
  // objects are compared by ref not value -> convert obj to string
  // in app.js -> req.user made available by passport.js -> pass to locals
  const hearts = req.user.hearts.map(obj => obj.toString());
  // MongoDB: $pull - remove, addToSet - push (makes sure that it is unique)
  // toggle
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      // computed property name
      // update hearts property of user
      [operator]: { hearts: req.params.id }
    },
    // returns updated user - rather than previous
    { new: true }
  );
  // res handled in front-end JavaScript - heart.js
  res.json(user);
};

exports.getHeartedStores = async (req, res) => {
  // get hearted stores from DB
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  // res.json(stores);
  // display them
  res.render('stores', { title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
  // custom aggregation method defined in Store.js
  const stores = await Store.getTopStores();
  // res.json(stores);
  res.render('topStores', { stores, title: '★ Top Stores' });
};
