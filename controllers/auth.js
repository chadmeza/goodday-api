const User = require('../models/User');
const emailHelper = require('../utils/emailHelper');
const authHelper = require('../utils/authHelper');

exports.login = async (req, res, next) => {
    try {
        // find a user with the given email address, and include the password field
        const user = await User.findOne({ email: req.body.email }, '+password');

        // if a user cannot be found, return a 401
        if (!user) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'Email and/or password are not valid.'
            });
        }

        // if a user is found, but is not active, return a 401
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'User account is not active.'
            });
        }
    
        // if a user is found and is active, then check if the password is correct
        const isValidPassword = await authHelper.comparePasswords(req.body.password, user.password);
    
        // if the password doesn't match, return a 401
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'Email and/or password are not valid.'
            });
        }
    
        // if the password is correct, create an auth token
        const token = authHelper.generateAuthToken(user._id, user.email, user.password);
    
        // return a 200 with the auth token
        res.status(200).json({
            success: true,
            data: {
                token: token
            }
        });
    } catch(error) {
        next(error);
    }
};

exports.register = async (req, res, next) => {
    try {
        // if the password is not valid, return a 400
        if (!authHelper.validatePassword(req.body.password)) {
            return res.status(400).json({
                success: false,
                data: {},
                error: 'Password is not valid.'
            });
        }
        
        // hash the password for security
        const password = await authHelper.hashPassword(req.body.password);

        // create a user object
        const user = {
            email: req.body.email,
            password: password
        };
    
        // save the user to the DB
        await User.create(user);
    
        // return a 200
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch(error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        // find a user with the given email address
        const user = await User.findOne({ email: req.body.email });

        // if a user cannot be found, return a 404
        if (!user) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'User account could not be found.'
            });
        }

        // if a user is found, but is not active, return a 401
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'User is not authorized to make this request.'
            });
        }
        
        // update the user with a password reset token (hash) and expiration
        user.passwordResetToken = authHelper.generateRandomToken();
        user.passwordResetExpiration = Date.now() + (1000 * 60 * 10);

        // save the user updates in the DB
        await user.save();

        // configure the password reset email options
        const emailOptions = {
            email: user.email,
            subject: 'Password Reset',
            message: `${req.protocol}://${req.hostname}/api/v1/users/resetpassword/${user.passwordResetToken}`
        };

        // send a password reset email
        await emailHelper.sendEmail(emailOptions);

        // return a 200
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch(error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        // check if the password reset token is valid and has not expired
        const user = await User.findOne({ 
            passwordResetToken: req.params.resetToken, 
            passwordResetExpiration: { $gt: Date.now() } 
        }, '+password');

        // if the password reset token is invalid or expired, return a 404
        if (!user) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'The password reset token is either invalid or expired.'
            });
        }

        // if the new password is not valid, return a 400
        if (!authHelper.validatePassword(req.body.password)) {
            return res.status(400).json({
                success: false,
                data: {},
                error: 'Password is not valid.'
            });
        }

        // hash the new password for security
        user.password = await authHelper.hashPassword(req.body.password);

        // clear the user's password reset fields
        user.passwordResetToken = undefined;
        user.passwordResetExpiration = undefined;

        // save the user updates in the DB
        await user.save();

        // return a 200
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch(error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        // get the currently logged-in user, and include the password field
        const user = await User.findById(req.user._id, '+password');

        // if the new password is not valid, return a 400
        if (!authHelper.validatePassword(req.body.password)) {
            return res.status(400).json({
                success: false,
                data: {},
                error: 'Password is not valid.'
            });
        }

        // hash the new password for security
        user.password = await authHelper.hashPassword(req.body.password);

        // save the user updates in the DB
        await user.save();

        // return a 200
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch(error) {
        next(error);
    }
};