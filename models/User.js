const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }, 
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: 'user'
    },
    passwordResetToken: String,
    passwordResetExpiration: Date
});

module.exports = mongoose.model('User', userSchema);