const mongoose = require('mongoose');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // an array of ids that are related to a store. Link each heart to a store
  hearts: [{ type: mongoose.Schema.ObjectId, ref: 'Store' }]
});

// Globally Recognisable avatar
// not stored in database - virtual
userSchema.virtual('gravatar').get(function() {
  // gravatar uses hashing algorithm (MD5) - takes users email adress and hashes it
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

// exposes a method called .register that will deal with registration - hashing password...
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
// unique: true gives an ugly error - this plugin prettifies it
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
