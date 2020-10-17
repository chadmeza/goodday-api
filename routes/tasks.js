const express = require('express');

const tasksController = require('../controllers/tasks');
const { requireAuth } = require('../middleware/authHandler');

const router = express.Router();

router.get('/', requireAuth, tasksController.getTasks);
router.post('/', requireAuth, tasksController.createTask);
router.get('/:id', requireAuth, tasksController.getTask);
router.put('/:id', requireAuth, tasksController.updateTask);
router.delete('/:id', requireAuth, tasksController.deleteTask);

module.exports = router;