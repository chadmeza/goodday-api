const express = require('express');

const usersController = require('../controllers/users');
const { requireAuth, requireAdmin } = require('../middleware/authHandler');

const router = express.Router();

router.get('/', requireAuth, requireAdmin, usersController.getUsers);
router.post('/', requireAuth, requireAdmin, usersController.createUser);
router.get('/:id', requireAuth, requireAdmin, usersController.getUser);
router.put('/:id', requireAuth, requireAdmin, usersController.updateUser);
router.delete('/:id', requireAuth, requireAdmin, usersController.deleteUser);

module.exports = router;