const jwt = require('jsonwebtoken');

const User = require('../models/User');

exports.requireAuth = async (req, res, next) => {
    let token;

    // get the token from the authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // if a token cannot be found, return a 401
    if (!token) {
        return res.status(401).json({
            success: false,
            data: {},
            error: 'User is not authorized to access this route.'
        });
    }

    try {
        // make sure the token is a valid JWT token
        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    
        // check if the token data matches a user in the DB
        const user = await User.findById(payload.id);

        // if a user cannot be found or is not active, return a 401
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                data: {},
                error: 'User is not authorized to access this route.'
            });
        }
    
        // populate req.user with the user data
        req.user = user;
    
        next();
    } catch(error) {
        next(error);
    }
};

exports.requireAdmin = (req, res, next) => {
    // if the user is not logged-in or is not an admin, return a 401
    if (!req.user || req.user.role != 'admin') {
        return res.status(401).json({
            success: false,
            data: {},
            error: 'User is not authorized to access this route.'
        });
    }

    // continue if the logged-in user is an admin
    next();
};