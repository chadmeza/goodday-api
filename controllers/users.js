const User = require('../models/User');
const authHelper = require('../utils/authHelper');

exports.getUsers = async (req, res, next) => {
    try {
        // get all users in the DB
        const users = await User.find({});

        // return a 200 with the users
        res.status(200).json({
            success: true,
            data: users
        });
    } catch(error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
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

        // create a user object with the given data
        const user = {
            email: req.body.email,
            password: password,
            isActive: req.body.isActive,
            role: req.body.role
        };
    
        // save the new user in the DB
        const newUser = await User.create(user);
    
        // return a 201 with the new user
        res.status(201).json({
            success: true,
            data: newUser
        });
    } catch(error) {
        next(error);
    }
};

exports.getUser = async (req, res, next) => {
    try {
        // find a user with the given ID
        const user = await User.findById(req.params.id);

        // if a user cannot be found, return a 404
        if (!user) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'User account could not be found.'
            });
        }

        // return a 200 with the user
        res.status(200).json({
            success: true,
            data: user
        });
    } catch(error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        // create a user object with the given data
        const user = {
            ...req.body
        };

        // if the password field is to be updated as well, then validate and hash it
        if (req.body.password) {

            // if the password is not valid, return a 400
            if (!authHelper.validatePassword(req.body.password)) {
                return res.status(400).json({
                    success: false,
                    data: {},
                    error: 'Password is not valid.'
                });
            }

            // hash the password for security
            user.password = await authHelper.hashPassword(req.body.password);
        }

        // find a user with the given ID, and update it with the given data
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // if a user cannot be found, return a 404
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'User account could not be found.'
            });
        }

        // return a 200 with the updated user
        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch(error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        // find a user with the given ID, and delete it from the DB
        const user = await User.findByIdAndDelete(req.params.id);

        // if a user cannot be found, return a 404
        if (!user) {
            return res.status(404).json({
                success: false,
                data: {},
                error: 'User account could not be found.'
            });
        }

        // return a 200 with the deleted user
        res.status(200).json({
            success: true,
            data: user
        });
    } catch(error) {
        next(error);
    }
};