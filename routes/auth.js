const express = require('express');

const authController = require('../controllers/auth');
const { requireAuth } = require('../middleware/authHandler');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword/:resetToken', authController.resetPassword);
router.put('/changepassword', requireAuth, authController.changePassword);

module.exports = router;