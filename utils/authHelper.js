const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.comparePasswords = async (enteredPassword, userPassword) => {
    // compare the passwords and return a boolean response
    return await bcrypt.compare(enteredPassword, userPassword);
};

exports.generateAuthToken = (userId, userEmail, userRole) => {
    // create a JWT token and return it
    return jwt.sign(
        { id: userId, email: userEmail, role: userRole },
        process.env.JWT_PRIVATE_KEY,
        { expiresIn: process.env.JWT_EXPIRATION }
    );
};

exports.hashPassword = async (password) => {
    // generate a salt for the hash
    const salt = await bcrypt.genSalt(10);

    // hash the given password and return it
    return await bcrypt.hash(password, salt);
};

exports.validatePassword = (password) => {
    // check if the password meets the minimum length requirement
    if (password.length < (parseInt(process.env.PASSWORD_MIN_LENGTH) || 6)) {
        return false;
    }

    // password is valid
    return true;
};

exports.generateRandomToken = () => {
    // create a buffer made of 12 random bytes
    const buf = crypto.randomBytes(12);

    // decode the buffer to a string and return it
    return buf.toString('hex');
};