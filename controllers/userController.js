const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
    // sanitize name - from app.js expressValidator() -> Adds validation methods to every request
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'That Email is not vaild!').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();
    // handle error ourselves instead of passing it to the next middleware
    if(errors) {
        req.flash('error', errors.map(err => err.msg));
        // pre-populate the registration form with the data they put in, so that they dnt have to re-enter everything
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
        return; // stop the fn from running
    }
    next(); // there were no errors
};

exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    // register method does not use promises, use promisify to change that
    // pass in method and object to bind method to
    const register = promisify(User.register, User);
    // stores hash of password and a salt
    await register(user, req.body.password);
    // res.send('It works');
    next(); // pass to authController.login
};

exports.account = (req, res) => {
    res.render('account', { title: 'Edit Your Account'});
}

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        // context option lets you set the value of 'this' in update validators to the underlying query ...?
        { new: true, runValidators: true, context: 'query' }
    );
    req.flash('success', 'Updated the profile');
    // res.json(user);
    res.redirect('back');

}
